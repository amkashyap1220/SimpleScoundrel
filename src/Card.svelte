<script>
  import { cardKind, rankLabel } from "./rules.js";

  // card: { suit, rank }; size: "room" | "small"
  let { card, size = "room", selected = false, hint = "", hintTone = "", onclick = null, label = "" } = $props();

  const SYMBOL = { C: "♣", S: "♠", D: "♦", H: "♥" };
  const KIND = { monster: "Monster", weapon: "Weapon", potion: "Potion" };

  let kind = $derived(cardKind(card));
  let red = $derived(card.suit === "D" || card.suit === "H");
</script>

{#snippet face()}
  <span class="corner">{rankLabel(card.rank)}<span class="sym">{SYMBOL[card.suit]}</span></span>
  <span class="pip" aria-hidden="true">{SYMBOL[card.suit]}</span>
  {#if size === "room"}
    <span class="kind">{KIND[kind]} {card.rank}</span>
    {#if hint}<span class="hint {hintTone}">{hint}</span>{/if}
  {/if}
{/snippet}

{#if onclick}
  <button
    type="button"
    class="card {size} {kind}"
    class:red
    class:selected
    aria-pressed={selected}
    aria-label={label}
    {onclick}
  >{@render face()}</button>
{:else}
  <div class="card {size} {kind}" class:red role="img" aria-label={label}>{@render face()}</div>
{/if}

<style>
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 5 / 7;
    width: 100%;
    padding: 0;
    border: 1px solid var(--card-edge);
    border-radius: 10px;
    background: var(--card);
    color: var(--black-suit);
    box-shadow: var(--shadow);
    font-family: Georgia, "Times New Roman", serif;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .card.red { color: var(--red-suit); }
  button.card { cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  button.card:hover { transform: translateY(-2px); }
  button.card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .card.selected {
    transform: translateY(-6px);
    border-color: var(--select);
    box-shadow: 0 0 0 3px var(--select), var(--shadow);
  }

  .corner {
    position: absolute;
    top: 6px;
    left: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1;
  }
  .corner .sym { font-size: 0.95rem; margin-top: 2px; }
  .pip { font-size: clamp(2.2rem, 11vw, 3.4rem); line-height: 1; }
  .kind {
    margin-top: 0.3rem;
    font: 600 0.72rem/1.2 system-ui, sans-serif;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .hint {
    position: absolute;
    bottom: 6px;
    left: 4px;
    right: 4px;
    text-align: center;
    font: 600 0.75rem/1.2 system-ui, sans-serif;
    color: var(--muted);
  }
  .hint.bad { color: var(--danger); }
  .hint.good { color: var(--health); }

  @media (max-width: 460px) {
    .card { border-radius: 8px; }
    .corner { top: 4px; left: 5px; font-size: 0.95rem; }
    .corner .sym { font-size: 0.8rem; }
    .pip { font-size: 2rem; }
    .kind { font-size: 0.6rem; letter-spacing: 0.02em; }
    .hint { bottom: 4px; left: 2px; right: 2px; font-size: 0.66rem; }
  }

  .card.small { border-radius: 7px; }
  .card.small .corner { top: 4px; left: 5px; font-size: 0.9rem; }
  .card.small .corner .sym { font-size: 0.75rem; }
  .card.small .pip { font-size: 1.6rem; }
</style>
