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
npm run dev        # just the game at http://localhost:5173 (offline: no high scores)
npm run dev:full   # the game and the high-score server at http://localhost:8787
npm test           # the rules and server tests (Node 22.13 or newer)
npm run build      # the static game in dist/
```

## Deploying

The game and its high scores run as one Cloudflare Worker at `scoundrel.alexanderk.dev`.

**Every push to `main` deploys the site.** Cloudflare's [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/) watches this repository, runs the tests, builds the game and deploys it. If a test fails, nothing is deployed. Pushes to other branches build a preview version and leave the live site alone. To ship a change, merge it into `main`.

Migrations still run by hand: `npm run db:migrate` whenever a file is added to `migrations/`.

### Setting it up from scratch

1. `npx wrangler login`
2. `npm run deploy`. This runs the tests, builds the game, and creates the Worker and its D1 database (named `scoundrel`) on the first deploy.
3. `npm run db:migrate` creates the tables in that database.
4. In the Cloudflare dashboard, open the `scoundrel` Worker, then **Settings > Domains & Routes > Add > Custom domain**, and enter `scoundrel.alexanderk.dev`.
5. Still in the Worker's **Settings > Build**, connect this GitHub repository. Set the production branch to `main`, leave the build command empty (`wrangler.jsonc` already runs the tests and the build before each deploy), keep `npx wrangler deploy` as the deploy command, and add the build variable `NODE_VERSION` = `22`.

## How it's built

- `src/rules.js` is the whole game as pure functions: a seeded shuffle, `act(state, action)` for every move, and `score(state)`. It has no browser code, so the same file can run on a server to replay a finished game from its seed and moves and check its score.
- `src/App.svelte`, `src/Card.svelte` (fantasy-styled cards: a color per suit, monsters on the face cards) and `src/Icon.svelte` are the interface, in [Svelte 5](https://svelte.dev), built with [Vite](https://vite.dev). Tap a card to see what it would do, then confirm. The game in progress is kept in the browser, so a reload doesn't lose it.
- `worker/index.js` is the high-score server, a [Cloudflare Worker](https://developers.cloudflare.com/workers/) with a [D1](https://developers.cloudflare.com/d1/) database (`migrations/`). It deals each game (a random seed) and keeps the seed. When a game ends, the browser sends only the name and the list of moves. The server replays them with the same `rules.js`, refuses unknown games, games already scored, unfinished games and illegal moves, and saves the score the replay gives, with the date. A rate limit slows down spam.
- If the server can't be reached, the game is dealt in the browser instead and can still be played, just not ranked.
- `tests/` checks the rules, and the server against Node's built-in SQLite standing in for D1, with Node's built-in test runner.
