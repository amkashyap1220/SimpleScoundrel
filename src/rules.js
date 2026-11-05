// Scoundrel rules engine. Pure functions, no DOM, so the same file runs in the
// browser and on the server (which replays a game from its seed and moves to
// check a high score before saving it).
//
// Standard rules (Zach Gage and Kurt Bieg, 2011):
// - A 52-card deck without jokers, red face cards or red aces: 44 cards.
//   Clubs and spades are monsters (2-10, J 11, Q 12, K 13, A 14).
//   Diamonds are weapons, hearts are health potions (2-10).
// - You start with 20 health, and can't go above 20.
// - Each turn, the room is filled up to 4 cards. You may avoid the room (all
//   4 go to the bottom of the dungeon), but never two rooms in a row.
//   Otherwise you face 3 of the 4 cards; the last one stays for the next room.
// - A weapon replaces the one you held. A potion heals its value, but only
//   one potion a turn works; a second one is discarded.
// - A monster hits for its value, less your weapon's value if you use it.
//   Once a weapon has slain a monster, it can only be used on monsters
//   weaker than the last one it slew.
// - The game ends when your health reaches 0 or the dungeon is empty.
//   Win: score is your health, plus the last card's value if it was a
//   potion and you're at 20. Lose: score is minus the remaining monsters.

export const MAX_HP = 20;
export const ROOM_SIZE = 4;
export const PLAYS_PER_ROOM = 3;

export const SUITS = { C: "clubs", S: "spades", D: "diamonds", H: "hearts" };
const RANK_NAMES = { 11: "Jack", 12: "Queen", 13: "King", 14: "Ace" };
const SHORT_RANKS = { 11: "J", 12: "Q", 13: "K", 14: "A" };

export function cardKind(card) {
  if (card.suit === "D") return "weapon";
  if (card.suit === "H") return "potion";
  return "monster";
}

export function cardId(card) {
  return card.suit + card.rank;
}

export function rankLabel(rank) {
  return SHORT_RANKS[rank] ?? String(rank);
}

export function cardName(card) {
  return `${RANK_NAMES[card.rank] ?? card.rank} of ${SUITS[card.suit]}`;
}

export function buildDeck() {
  const deck = [];
  for (const suit of ["C", "S"]) for (let r = 2; r <= 14; r++) deck.push({ suit, rank: r });
  for (const suit of ["D", "H"]) for (let r = 2; r <= 10; r++) deck.push({ suit, rank: r });
  return deck;
}

// Small seeded random number generator (mulberry32), so a seed always deals
// the same dungeon.
export function rng(seed) {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(seed) {
  const s = String(seed);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffle(cards, seed) {
  const out = cards.slice();
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function newGame(seed) {
  const state = {
    seed: String(seed),
    deck: shuffle(buildDeck(), seed), // index 0 is the top of the dungeon
    room: [],
    hp: MAX_HP,
    weapon: null,            // { card, slain: [monster cards] }
    discarded: 0,
    avoidedLast: false,      // the previous room was avoided
    playedThisRoom: 0,
    potionThisRoom: false,
    lastCard: null,
    over: false,
    won: false,
    moves: [],               // what the server replays: "a", "p:S12:w", ...
    message: "A new dungeon. Pick a card, or avoid the room.",
  };
  fillRoom(state);
  return state;
}

function fillRoom(state) {
  while (state.room.length < ROOM_SIZE && state.deck.length > 0) state.room.push(state.deck.shift());
}

export function canAvoid(state) {
  return !state.over && !state.avoidedLast && state.playedThisRoom === 0
    && state.room.length === ROOM_SIZE && state.deck.length > 0;
}

export function canUseWeapon(state, card) {
  if (!state.weapon || cardKind(card) !== "monster") return false;
  const { slain } = state.weapon;
  return slain.length === 0 || card.rank < slain[slain.length - 1].rank;
}

export function weaponDamage(state, card) {
  return Math.max(0, card.rank - state.weapon.card.rank);
}

// Every action goes through here. Returns a new state; throws on an illegal move.
// action: { type: "avoid" } or { type: "play", card: "S12", barehanded?: true }
export function act(prev, action) {
  if (prev.over) throw new Error("The game is over");
  const state = structuredClone(prev);

  if (action.type === "avoid") {
    if (!canAvoid(state)) throw new Error("You can't avoid this room");
    state.deck.push(...state.room);
    state.room = [];
    state.avoidedLast = true;
    state.moves.push("a");
    fillRoom(state);
    state.message = "You slip past the room. You'll have to face the next one.";
    return state;
  }

  if (action.type !== "play") throw new Error("Unknown action");
  const index = state.room.findIndex((c) => cardId(c) === action.card);
  if (index < 0) throw new Error("That card isn't in the room");
  const card = state.room.splice(index, 1)[0];
  const kind = cardKind(card);
  let move = "p:" + cardId(card);

  if (kind === "weapon") {
    if (state.weapon) state.discarded += 1 + state.weapon.slain.length;
    state.weapon = { card, slain: [] };
    state.message = `You take up the ${cardName(card)}.`;
  } else if (kind === "potion") {
    state.discarded++;
    if (state.potionThisRoom) {
      state.message = `Only one potion works per room. The ${cardName(card)} is wasted.`;
    } else {
      const before = state.hp;
      state.hp = Math.min(MAX_HP, state.hp + card.rank);
      state.potionThisRoom = true;
      state.message = `You drink the ${cardName(card)}: +${state.hp - before} health.`;
    }
  } else {
    const useWeapon = !action.barehanded && state.weapon !== null;
    if (useWeapon && !canUseWeapon(state, card)) throw new Error("Your weapon can't be used on that monster");
    if (useWeapon) {
      const dmg = weaponDamage(state, card);
      state.hp -= dmg;
      state.weapon.slain.push(card);
      move += ":w";
      state.message = `You slay the ${cardName(card)} with your weapon` + (dmg ? `, taking ${dmg} damage.` : " unharmed.");
    } else {
      state.hp -= card.rank;
      state.discarded++;
      move += ":b";
      state.message = `You fight the ${cardName(card)} barehanded, taking ${card.rank} damage.`;
    }
  }

  state.moves.push(move);
  state.lastCard = card;
  state.playedThisRoom++;

  if (state.hp <= 0) {
    state.hp = 0;
    state.over = true;
    state.message = `The ${cardName(card)} kills you.`;
    return state;
  }

  if (state.room.length === 0 && state.deck.length === 0) {
    state.over = true;
    state.won = true;
    state.message = "You made it through the dungeon!";
    return state;
  }

  // The room is done after 3 plays (or when it runs out on the last room).
  if (state.playedThisRoom >= PLAYS_PER_ROOM || state.room.length === 0) {
    state.playedThisRoom = 0;
    state.potionThisRoom = false;
    state.avoidedLast = false;
    fillRoom(state);
  }
  return state;
}

export function score(state) {
  if (!state.over) return null;
  if (state.won) {
    if (state.hp === MAX_HP && state.lastCard && cardKind(state.lastCard) === "potion") {
      return state.hp + state.lastCard.rank;
    }
    return state.hp;
  }
  const remaining = [...state.room, ...state.deck].filter((c) => cardKind(c) === "monster");
  return -remaining.reduce((sum, c) => sum + c.rank, 0);
}

// Turns a move string back into an action.
export function parseMove(move) {
  if (move === "a") return { type: "avoid" };
  const [p, card, how] = move.split(":");
  if (p !== "p" || !/^[CSDH]\d{1,2}$/.test(card ?? "")) throw new Error("Bad move " + move);
  return how === "b" ? { type: "play", card, barehanded: true } : { type: "play", card };
}

// Plays a whole game from its seed and moves. Throws if any move is illegal.
export function replay(seed, moves) {
  let state = newGame(seed);
  for (const m of moves) state = act(state, parseMove(m));
  return state;
}
