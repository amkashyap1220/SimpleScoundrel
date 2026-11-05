# Simple Scoundrel

A web version of **Scoundrel**, the solo dungeon crawler played with an ordinary deck of cards (rules by Zach Gage and Kurt Bieg, 2011). It works with a mouse or on a phone, and it's embedded in the Lab on [alexanderk.dev](https://alexanderk.dev/lab/scoundrel).

## How to play

Take a deck of cards and remove the jokers, the red face cards and the red aces. That leaves 44 cards, shuffled face down: the **dungeon**.

- **♣ ♠ Monsters** hit you for their value (2 to 10, Jack 11, Queen 12, King 13, Ace 14).
- **♦ Weapons** (2 to 10) take that much off every monster you fight with them.
- **♥ Health potions** (2 to 10) heal you by their value.

You start with **20 health** and can never go above 20.

Each turn the **room** is filled up to 4 cards. You may **avoid** the room: all 4 cards go to the bottom of the dungeon. You can't avoid two rooms in a row. Otherwise you face 3 of the 4 cards, one at a time, and the fourth stays for the next room.

- **Weapon:** you equip it, and the weapon you held (and the monsters it slew) is discarded.
- **Potion:** you heal by its value, but only one potion a room works. A second one is simply discarded.
- **Monster:** fight it barehanded and take its full value as damage, or use your weapon and take the monster's value minus the weapon's (never below 0). Once a weapon has slain a monster, it can only be used on monsters **weaker** than the last one it slew.

The game ends when your health reaches 0 or you make it through the whole dungeon.

- **You win:** your score is your health. If you finish at 20 and your last card was a potion, add that potion's value.
- **You die:** your score is minus the total value of the monsters still in the dungeon.

## Running it

```sh
npm install
npm run dev     # the game at http://localhost:5173
npm test        # the rules tests
npm run build   # the static site in dist/
```

## How it's built

- `src/rules.js` is the whole game as pure functions: a seeded shuffle, `act(state, action)` for every move, and `score(state)`. It has no browser code, so the same file can run on a server to replay a finished game from its seed and moves and check its score.
- `src/App.svelte` and `src/Card.svelte` are the interface, in [Svelte 5](https://svelte.dev), built with [Vite](https://vite.dev). Tap a card to see what it would do, then confirm. The game in progress is kept in the browser, so a reload doesn't lose it.
- `tests/rules.test.js` checks the rules with Node's built-in test runner.

Coming next: shared high scores (name, score and date) on a Cloudflare Worker with a D1 database, which replays every submitted game before saving its score.
