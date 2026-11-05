import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildDeck, newGame, act, score, replay, canAvoid, canUseWeapon, cardKind, MAX_HP,
} from "../src/rules.js";

// A game whose dungeon is exactly these cards, top first ("S12", "H5", ...).
function rigged(ids) {
  const s = newGame("test");
  const cards = ids.map((id) => ({ suit: id[0], rank: Number(id.slice(1)) }));
  s.room = cards.slice(0, 4);
  s.deck = cards.slice(4);
  return s;
}
const play = (s, card, barehanded) => act(s, { type: "play", card, ...(barehanded ? { barehanded } : {}) });

test("the deck has 44 cards: 26 monsters, 9 weapons, 9 potions", () => {
  const deck = buildDeck();
  assert.equal(deck.length, 44);
  assert.equal(deck.filter((c) => cardKind(c) === "monster").length, 26);
  assert.equal(deck.filter((c) => cardKind(c) === "weapon").length, 9);
  assert.equal(deck.filter((c) => cardKind(c) === "potion").length, 9);
  assert.ok(!deck.some((c) => (c.suit === "D" || c.suit === "H") && c.rank > 10));
});

test("the same seed deals the same dungeon", () => {
  assert.deepEqual(newGame("abc").room, newGame("abc").room);
  assert.deepEqual(newGame("abc").deck, newGame("abc").deck);
  assert.notDeepEqual(newGame("abc").deck, newGame("abd").deck);
  const g = newGame(1);
  assert.equal(g.room.length, 4);
  assert.equal(g.deck.length, 40);
  assert.equal(g.hp, MAX_HP);
});

test("fighting barehanded costs the monster's value", () => {
  let s = rigged(["S12", "C2", "C3", "C4", "C5"]);
  s = play(s, "S12");
  assert.equal(s.hp, 8);
});

test("a weapon reduces damage and can only hit weaker monsters after", () => {
  let s = rigged(["D5", "S12", "C6", "C7", "C2", "C3", "C4", "C5"]);
  s = play(s, "D5");
  s = play(s, "S12");
  assert.equal(s.hp, 13);
  s = play(s, "C6"); // 6 < 12, takes 1
  assert.equal(s.hp, 12);
  // New room: C7 left over, then C2 C3 C4
  assert.deepEqual(s.room.map((c) => c.suit + c.rank), ["C7", "C2", "C3", "C4"]);
  assert.equal(canUseWeapon(s, s.room[0]), false); // 7 is not below 6
  assert.throws(() => play(s, "C7"));
  s = play(s, "C7", true);
  assert.equal(s.hp, 5);
  assert.equal(canUseWeapon(s, s.room[0]), true); // C2 < 6
});

test("a weapon can't be reused on a monster of equal value", () => {
  let s = rigged(["D3", "C6", "S6", "C2", "C3"]);
  s = play(s, "D3");
  s = play(s, "C6");
  assert.equal(canUseWeapon(s, s.room.find((c) => c.suit === "S")), false);
});

test("a new weapon replaces the old one and its monsters", () => {
  let s = rigged(["D5", "C3", "D8", "C2", "C4"]);
  s = play(s, "D5");
  s = play(s, "C3");
  s = play(s, "D8");
  assert.equal(s.weapon.card.rank, 8);
  assert.equal(s.weapon.slain.length, 0);
  assert.equal(s.discarded, 2);
});

test("only one potion per room heals, and health stops at 20", () => {
  let s = rigged(["S10", "H5", "H7", "C2", "C3"]);
  s = play(s, "S10");
  s = play(s, "H5");
  assert.equal(s.hp, 15);
  s = play(s, "H7");
  assert.equal(s.hp, 15);
  // Next room: potion works again, capped at 20
  s = rigged(["H9", "C2", "C3", "C4", "C5"]);
  s = play(s, "H9");
  assert.equal(s.hp, 20);
});

test("rooms refill to 4 after 3 plays, keeping the last card", () => {
  let s = rigged(["C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9"]);
  s = play(s, "C2");
  s = play(s, "C3");
  assert.equal(s.room.length, 2);
  s = play(s, "C4");
  assert.deepEqual(s.room.map((c) => c.rank), [5, 6, 7, 8]);
});

test("you can avoid a room, but not two in a row, and not after playing", () => {
  let s = rigged(["C9", "C8", "C7", "C6", "C2", "C3", "C4", "C5", "S10"]);
  assert.ok(canAvoid(s));
  s = act(s, { type: "avoid" });
  assert.deepEqual(s.room.map((c) => c.rank), [2, 3, 4, 5]);
  assert.deepEqual(s.deck.map((c) => c.rank), [10, 9, 8, 7, 6]);
  assert.equal(canAvoid(s), false);
  assert.throws(() => act(s, { type: "avoid" }));
  s = play(s, "C2");
  s = play(s, "C3");
  s = play(s, "C4");
  assert.ok(canAvoid(s)); // a room was faced, so the next can be avoided
  s = play(s, "C5");
  assert.equal(canAvoid(s), false);
  // Nothing left to draw: the last room can't be avoided
  s = rigged(["C2", "C3", "C4", "C5"]);
  assert.equal(canAvoid(s), false);
});

test("dying scores minus the monsters left in the dungeon", () => {
  let s = rigged(["S14", "S13", "C2", "H3", "C5"]);
  s = play(s, "S14");
  s = play(s, "S13");
  assert.ok(s.over);
  assert.equal(s.won, false);
  assert.equal(s.hp, 0);
  assert.equal(score(s), -7);
  assert.throws(() => play(s, "C2"));
});

test("clearing the dungeon scores your health", () => {
  let s = rigged(["C2", "C3", "C4", "C5"]);
  s = play(s, "C2");
  s = play(s, "C3");
  s = play(s, "C4");
  assert.equal(s.over, false); // the last room has one card left, which you face
  s = play(s, "C5");
  assert.ok(s.won);
  assert.equal(score(s), 6);
});

test("finishing at 20 on a potion adds the potion's value", () => {
  let s = rigged(["C2", "H2", "D3", "H8"]);
  s = play(s, "C2");
  s = play(s, "H2");
  s = play(s, "D3");
  s = play(s, "H8"); // a new room, so this potion works too
  assert.ok(s.won);
  assert.equal(s.hp, 20);
  assert.equal(score(s), 28);
});

test("replaying the moves rebuilds the same game", () => {
  // Play a whole random game, always taking the first card, weapon when allowed.
  let s = newGame("replay-me");
  while (!s.over) {
    const c = s.room[0];
    s = act(s, { type: "play", card: c.suit + c.rank, barehanded: cardKind(c) === "monster" && !canUseWeapon(s, c) });
  }
  const r = replay("replay-me", s.moves);
  assert.equal(score(r), score(s));
  assert.equal(r.hp, s.hp);
  assert.throws(() => replay("replay-me", ["p:S99"]));
  assert.throws(() => replay("other-seed", s.moves));
});
