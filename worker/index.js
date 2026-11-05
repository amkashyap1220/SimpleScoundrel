/* Cloudflare Worker: the shared high scores. Everything else is the static
   game in dist/, served as plain files.

   POST /api/games            -> { id, seed }   deals a new game
   POST /api/scores           <- { id, name, moves } saves a finished game's score
   GET  /api/scores           -> { scores: [{ name, score, won, date }] }  the top 10

   A score is never taken from the browser. The server replays the game from
   the seed it dealt and the moves sent, with the same rules file the game
   uses (src/rules.js), and saves the score that replay gives. An illegal
   move, an unfinished game, an unknown game or one already scored is
   refused. */

import { replay, score } from "../src/rules.js";

const TOP = 10;
const MAX_NAME = 20;
const MAX_MOVES = 200;              // a full game is at most ~90 moves
const GAME_TTL_DAYS = 7;            // unscored games are cleared after this

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/games" && request.method === "POST") return await newGame(request, env, ctx);
      if (url.pathname === "/api/scores" && request.method === "GET") return await topScores(env);
      if (url.pathname === "/api/scores" && request.method === "POST") return await saveScore(request, env);
      if (url.pathname.startsWith("/api/")) return json({ error: "Not found" }, 404);
      return env.ASSETS.fetch(request);
    } catch (e) {
      console.error(e);
      return json({ error: "Something went wrong" }, 500);
    }
  },
};

async function newGame(request, env, ctx) {
  if (!(await allowed(env.GAME_LIMITER, request))) return json({ error: "Too many new games. Try again in a minute." }, 429);
  const id = crypto.randomUUID();
  const seed = randomSeed();
  await env.DB.prepare("INSERT INTO games (id, seed, created_at) VALUES (?, ?, ?)")
    .bind(id, seed, new Date().toISOString()).run();
  // Now and then, clear out old games that were never scored.
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - GAME_TTL_DAYS * 86400e3).toISOString();
    ctx.waitUntil(env.DB.prepare("DELETE FROM games WHERE scored = 0 AND created_at < ?").bind(cutoff).run());
  }
  return json({ id, seed });
}

async function topScores(env) {
  const { results } = await env.DB.prepare(
    "SELECT name, score, won, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?",
  ).bind(TOP).all();
  return json(
    { scores: results.map((r) => ({ name: r.name, score: r.score, won: !!r.won, date: r.created_at })) },
    200,
    { "Cache-Control": "public, max-age=15" },
  );
}

async function saveScore(request, env) {
  if (!(await allowed(env.SCORE_LIMITER, request))) return json({ error: "Too many scores. Try again in a minute." }, 429);
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  const name = cleanName(body?.name);
  if (!name) return json({ error: `Enter a name of 1 to ${MAX_NAME} characters.` }, 400);
  const moves = body?.moves;
  if (typeof body?.id !== "string" || !Array.isArray(moves) || moves.length > MAX_MOVES || !moves.every((m) => typeof m === "string")) {
    return json({ error: "Bad request" }, 400);
  }

  const game = await env.DB.prepare("SELECT seed, scored FROM games WHERE id = ?").bind(body.id).first();
  if (!game) return json({ error: "That game isn't one this server dealt." }, 404);
  if (game.scored) return json({ error: "That game's score is already saved." }, 409);

  let final;
  try { final = replay(game.seed, moves); } catch { return json({ error: "That game has an illegal move." }, 422); }
  if (!final.over) return json({ error: "That game isn't finished." }, 422);

  const points = score(final);
  const now = new Date().toISOString();
  // Mark the game scored first; if two saves race, only one gets the row.
  const claim = await env.DB.prepare("UPDATE games SET scored = 1 WHERE id = ? AND scored = 0").bind(body.id).run();
  if (!claim.meta.changes) return json({ error: "That game's score is already saved." }, 409);
  await env.DB.prepare("INSERT INTO scores (game_id, name, score, won, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(body.id, name, points, final.won ? 1 : 0, now).run();

  const better = await env.DB.prepare("SELECT COUNT(*) AS n FROM scores WHERE score > ?").bind(points).first();
  return json({ name, score: points, won: final.won, rank: better.n + 1, date: now });
}

// Letters, numbers, spaces and simple punctuation; 1 to 20 characters.
export function cleanName(raw) {
  if (typeof raw !== "string") return "";
  const name = raw.normalize("NFKC").replace(/[^\p{L}\p{N} ._'-]/gu, "").replace(/\s+/g, " ").trim();
  return name.length >= 1 && name.length <= MAX_NAME ? name : "";
}

async function allowed(limiter, request) {
  if (!limiter) return true;  // not configured (local dev)
  const key = request.headers.get("CF-Connecting-IP") ?? "local";
  const { success } = await limiter.limit({ key });
  return success;
}

function randomSeed() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });
}
