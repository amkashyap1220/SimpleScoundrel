import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import worker, { cleanName } from "../worker/index.js";
import { newGame, act, canUseWeapon, cardKind } from "../src/rules.js";

// A stand-in for Cloudflare D1 on Node's built-in SQLite, with the real migration.
function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_scores.sql", import.meta.url), "utf8"));
  const statement = (sql, args = []) => ({
    bind: (...a) => statement(sql, a),
    run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
    first: async () => db.prepare(sql).get(...args) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...args) }),
  });
  return { prepare: (sql) => statement(sql) };
}

function setup() {
  const env = { DB: fakeD1(), ASSETS: { fetch: async () => new Response("asset") } };
  const ctx = { waitUntil() {} };
  const call = async (method, path, body) => {
    const res = await worker.fetch(new Request("http://x" + path, { method, body: body && JSON.stringify(body) }), env, ctx);
    return { status: res.status, data: await res.json() };
  };
  return call;
}

// Plays a whole game from a seed: potions and weapons first, weapon on monsters when allowed.
function playThrough(seed) {
  let s = newGame(seed);
  while (!s.over) {
    const c = s.room.find((x) => cardKind(x) !== "monster") ?? s.room[0];
    s = act(s, { type: "play", card: c.suit + c.rank, barehanded: cardKind(c) === "monster" && !canUseWeapon(s, c) });
  }
  return s;
}

test("a dealt game can be scored once, with the score the server works out", async () => {
  const call = setup();
  const { data: game } = await call("POST", "/api/games");
  assert.match(game.seed, /^[0-9a-f]{24}$/);
  const played = playThrough(game.seed);

  const saved = await call("POST", "/api/scores", { id: game.id, name: "  Alex   K ", moves: played.moves });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.name, "Alex K");
  assert.equal(saved.data.rank, 1);

  const again = await call("POST", "/api/scores", { id: game.id, name: "Alex", moves: played.moves });
  assert.equal(again.status, 409);

  const { data } = await call("GET", "/api/scores");
  assert.equal(data.scores.length, 1);
  assert.equal(data.scores[0].name, "Alex K");
  assert.equal(typeof data.scores[0].score, "number");
  assert.ok(!Number.isNaN(Date.parse(data.scores[0].date)));
});

test("unknown, unfinished and illegal games are refused", async () => {
  const call = setup();
  const { data: game } = await call("POST", "/api/games");
  assert.equal((await call("POST", "/api/scores", { id: "nope", name: "A", moves: [] })).status, 404);
  assert.equal((await call("POST", "/api/scores", { id: game.id, name: "A", moves: [] })).status, 422);
  // Moves from a different dungeon don't fit this one
  const other = playThrough("someone-elses-seed");
  assert.equal((await call("POST", "/api/scores", { id: game.id, name: "A", moves: other.moves })).status, 422);
  assert.equal((await call("POST", "/api/scores", { id: game.id, name: "", moves: [] })).status, 400);
  assert.equal((await call("POST", "/api/scores", { id: game.id, name: "A", moves: "a" })).status, 400);
});

test("scores list highest first, top 10", async () => {
  const call = setup();
  for (let i = 0; i < 12; i++) {
    const { data: game } = await call("POST", "/api/games");
    await call("POST", "/api/scores", { id: game.id, name: "P" + i, moves: playThrough(game.seed).moves });
  }
  const { data } = await call("GET", "/api/scores");
  assert.equal(data.scores.length, 10);
  for (let i = 1; i < data.scores.length; i++) assert.ok(data.scores[i - 1].score >= data.scores[i].score);
});

test("names are cleaned up", () => {
  assert.equal(cleanName("Tester <b>One</b>"), "Tester bOneb");
  assert.equal(cleanName("Zoë O'Brien-Smith"), "Zoë O'Brien-Smith");
  assert.equal(cleanName("x".repeat(21)), "");
  assert.equal(cleanName("   "), "");
  assert.equal(cleanName(42), "");
});
