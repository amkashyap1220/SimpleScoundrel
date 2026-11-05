<script>
  import Card from "./Card.svelte";
  import {
    newGame, act, score, canAvoid, canUseWeapon, weaponDamage, cardKind, cardId, cardName,
    MAX_HP, PLAYS_PER_ROOM,
  } from "./rules.js";

  // The project page on the website: rules, links, README and how it's built.
  const HOW_TO_PLAY = "https://alexanderk.dev/repositories/scoundrel";
  const SAVE_KEY = "scoundrel:game";

  function randomSeed() {
    const a = new Uint32Array(2);
    crypto.getRandomValues(a);
    return a[0].toString(36) + a[1].toString(36);
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (saved && saved.seed && Array.isArray(saved.room)) return saved;
    } catch {}
    return newGame(randomSeed());
  }

  let game = $state(load());
  let selectedId = $state(null);
  let error = $state("");

  $effect(() => {
    const snapshot = JSON.stringify(game);
    try { localStorage.setItem(SAVE_KEY, snapshot); } catch {}
  });

  let selected = $derived(game.room.find((c) => cardId(c) === selectedId) ?? null);
  let finalScore = $derived(score(game));
  let hpPct = $derived(Math.max(0, game.hp) / MAX_HP * 100);
  let weaponLimit = $derived(
    game.weapon && game.weapon.slain.length ? game.weapon.slain[game.weapon.slain.length - 1].rank : null,
  );

  function run(action) {
    try {
      game = act($state.snapshot(game), action);
      selectedId = null;
      error = "";
    } catch (e) {
      error = e.message;
    }
  }

  function pick(card) {
    if (game.over) return;
    selectedId = selectedId === cardId(card) ? null : cardId(card);
  }

  function restart() {
    game = newGame(randomSeed());
    selectedId = null;
    error = "";
  }

  function confirmRestart() {
    if (game.over || game.moves.length === 0 || confirm("Give up this dungeon and start a new one?")) restart();
  }

  // What a tap on this card would do, shown on the card.
  function hint(card) {
    const kind = cardKind(card);
    if (kind === "potion") {
      if (game.potionThisRoom) return ["No effect", "bad"];
      const heal = Math.min(card.rank, MAX_HP - game.hp);
      return heal ? [`+${heal} health`, "good"] : ["Already full", ""];
    }
    if (kind === "weapon") return [game.weapon ? "Swap weapon" : "Equip", ""];
    if (canUseWeapon(game, card)) {
      const dmg = weaponDamage(game, card);
      return dmg ? [`Weapon −${dmg}`, ""] : ["Weapon: no harm", "good"];
    }
    return [`−${card.rank} health`, "bad"];
  }

  function cardLabel(card) {
    return `${cardName(card)}: ${hint(card)[0]}`;
  }
</script>

<main>
  <header>
    <h1>Scoundrel</h1>
    <nav>
      <a href={HOW_TO_PLAY} target="_blank" rel="noopener">How to play</a>
      <button type="button" class="link" onclick={confirmRestart}>New game</button>
    </nav>
  </header>

  <section class="status" aria-label="Status">
    <div class="health">
      <div class="health-label">
        <span>Health</span>
        <strong>{game.hp} / {MAX_HP}</strong>
      </div>
      <div class="bar" role="meter" aria-valuemin="0" aria-valuemax={MAX_HP} aria-valuenow={game.hp} aria-label="Health">
        <div class="fill" class:low={game.hp <= 6} style:width="{hpPct}%"></div>
      </div>
    </div>
    <div class="facts">
      <div><span>Dungeon</span><strong>{game.deck.length}</strong></div>
      <div><span>Discarded</span><strong>{game.discarded}</strong></div>
    </div>
  </section>

  <section class="room-head">
    <h2>Room</h2>
    <span class="played" aria-label="{game.playedThisRoom} of {PLAYS_PER_ROOM} cards faced">
      {#each Array(PLAYS_PER_ROOM) as _, i}
        <span class="dot" class:on={i < game.playedThisRoom}></span>
      {/each}
      <span class="played-text">{game.playedThisRoom} of {PLAYS_PER_ROOM} faced</span>
    </span>
  </section>

  <section class="room" aria-label="Room">
    {#each game.room as card (cardId(card))}
      {@const [h, tone] = hint(card)}
      <Card
        {card}
        selected={selectedId === cardId(card)}
        hint={h}
        hintTone={tone}
        label={cardLabel(card)}
        onclick={game.over ? null : () => pick(card)}
      />
    {/each}
    {#each Array(Math.max(0, 4 - game.room.length)) as _}
      <div class="slot" aria-hidden="true"></div>
    {/each}
  </section>

  <p class="message" aria-live="polite">{error || game.message}</p>

  {#if game.over}
  <section class="over" class:won={game.won} aria-live="assertive">
    <h2>{game.won ? "You escaped the dungeon" : "You died in the dungeon"}</h2>
    <p class="score">Score <strong>{finalScore}</strong></p>
    <p class="why">
      {#if game.won}Your score is the health you kept{finalScore > game.hp ? ", plus the last potion" : ""}.
      {:else}Your score is minus the monsters still in the dungeon.{/if}
    </p>
    <button type="button" class="primary" onclick={restart}>Play again</button>
  </section>
  {:else}
  <section class="actions" aria-label="Actions">
    {#if selected}
      {@const kind = cardKind(selected)}
      {#if kind === "monster"}
        {#if canUseWeapon(game, selected)}
          <button type="button" class="primary" onclick={() => run({ type: "play", card: selectedId })}>
            Use weapon (−{weaponDamage(game, selected)})
          </button>
        {/if}
        <button type="button" class={canUseWeapon(game, selected) ? "secondary" : "primary"}
          onclick={() => run({ type: "play", card: selectedId, barehanded: true })}>
          Fight barehanded (−{selected.rank})
        </button>
      {:else if kind === "weapon"}
        <button type="button" class="primary" onclick={() => run({ type: "play", card: selectedId })}>
          {game.weapon ? "Swap to this weapon" : "Equip weapon"}
        </button>
      {:else}
        <button type="button" class="primary" onclick={() => run({ type: "play", card: selectedId })}>
          {game.potionThisRoom ? "Discard potion (no effect)" : "Drink potion"}
        </button>
      {/if}
      <button type="button" class="ghost" onclick={() => (selectedId = null)}>Cancel</button>
    {:else}
      <button type="button" class="secondary" disabled={!canAvoid(game)} onclick={() => run({ type: "avoid" })}>
        Avoid room
      </button>
      <span class="tip">
        {#if canAvoid(game)}Tap a card to face it, or avoid the whole room.
        {:else if game.avoidedLast && game.playedThisRoom === 0}You avoided the last room, so you must face this one.
        {:else}Tap a card to face it.{/if}
      </span>
    {/if}
  </section>
  {/if}

  <section class="weapon" aria-label="Weapon">
    <h2>Weapon</h2>
    {#if game.weapon}
      <div class="weapon-row">
        <div class="weapon-card">
          <Card card={game.weapon.card} size="small" label={cardName(game.weapon.card)} />
        </div>
        <div class="slain">
          {#each game.weapon.slain as m, i (cardId(m))}
            <div class="slain-card" style:z-index={i}>
              <Card card={m} size="small" label={cardName(m)} />
            </div>
          {/each}
        </div>
      </div>
      <p class="weapon-note">
        Strength {game.weapon.card.rank}.
        {#if weaponLimit !== null}It can only hit monsters below {weaponLimit}.{:else}It can hit any monster.{/if}
      </p>
    {:else}
      <p class="weapon-note">None yet. Pick up a ♦ to fight with it.</p>
    {/if}
  </section>

</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: max(12px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom));
  }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  h1 {
    margin: 0;
    font: 700 1.6rem/1.1 Georgia, "Times New Roman", serif;
    letter-spacing: 0.01em;
  }
  nav { display: flex; gap: 16px; align-items: baseline; font-size: 0.95rem; }
  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }

  h2 {
    margin: 0;
    font: 700 0.78rem/1 system-ui, sans-serif;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .status {
    display: flex;
    gap: 16px;
    align-items: end;
    padding: 12px 14px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }
  .health { flex: 1; min-width: 0; }
  .health-label { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); }
  .health-label strong { color: var(--ink); font-size: 1rem; font-variant-numeric: tabular-nums; }
  .bar { height: 10px; margin-top: 6px; border-radius: 5px; background: var(--line); overflow: hidden; }
  .fill { height: 100%; background: var(--health); transition: width 0.3s ease; }
  .fill.low { background: var(--health-low); }
  .facts { display: flex; gap: 14px; }
  .facts div { display: flex; flex-direction: column; align-items: end; font-size: 0.75rem; color: var(--muted); }
  .facts strong { font-size: 1rem; color: var(--ink); font-variant-numeric: tabular-nums; }

  .room-head { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 10px; }
  .played { display: flex; align-items: center; gap: 5px; font-size: 0.8rem; color: var(--muted); }
  .dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--muted); }
  .dot.on { background: var(--muted); }
  .played-text { margin-left: 4px; }

  .room {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  @media (max-width: 460px) {
    .room { gap: 6px; }
  }
  .slot {
    aspect-ratio: 5 / 7;
    border: 1.5px dashed var(--line);
    border-radius: 10px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    margin-top: 16px;
  }
  .actions button, .over button {
    min-height: 44px;
    padding: 0 18px;
    border-radius: 10px;
    border: 1px solid transparent;
    font-weight: 600;
    cursor: pointer;
  }
  .primary { background: var(--accent); color: var(--accent-ink); }
  .secondary { background: var(--surface); border-color: var(--line) !important; }
  .ghost { background: none; color: var(--muted); }
  button:disabled { opacity: 0.45; cursor: not-allowed; }
  .tip { flex: 1 1 200px; font-size: 0.85rem; color: var(--muted); }

  .message { min-height: 1.5em; margin: 12px 0 0; font-size: 0.95rem; }

  .weapon { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); }
  .weapon-row { display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; }
  .weapon-card { width: 64px; flex: none; }
  .slain { display: flex; flex: 1; min-width: 0; padding-top: 10px; }
  .slain-card { width: 52px; flex: none; margin-right: -30px; }
  .weapon-note { margin: 8px 0 0; font-size: 0.85rem; color: var(--muted); }

  .over {
    margin-top: 12px;
    padding: 18px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: var(--surface);
    text-align: center;
  }
  .over h2 { font-size: 0.85rem; color: var(--danger); }
  .over.won h2 { color: var(--health); }
  .score { margin: 10px 0 4px; font-size: 1.1rem; }
  .score strong { font: 700 2.2rem/1 Georgia, serif; margin-left: 6px; }
  .why { margin: 0 0 14px; font-size: 0.85rem; color: var(--muted); }
</style>
