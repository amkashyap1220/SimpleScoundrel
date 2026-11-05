<script>
  import { rankLabel } from "./rules.js";

  // A playing card as in a real deck: an index in two corners, pips in the
  // standard layout, a framed letter for the face cards, one big pip for an ace.
  // card: { suit, rank }; size: "room" | "small"
  let { card, size = "room", selected = false, onclick = null, label = "" } = $props();

  const SYMBOL = { C: "♣", S: "♠", D: "♦", H: "♥" };

  // Where the pips go, as [x%, y%]. Pips in the lower half are drawn upside down, as on a real card.
  const L = 34, M = 50, R = 66;
  const PIPS = {
    2: [[M, 20], [M, 80]],
    3: [[M, 20], [M, 50], [M, 80]],
    4: [[L, 20], [R, 20], [L, 80], [R, 80]],
    5: [[L, 20], [R, 20], [M, 50], [L, 80], [R, 80]],
    6: [[L, 20], [R, 20], [L, 50], [R, 50], [L, 80], [R, 80]],
    7: [[L, 20], [R, 20], [M, 35], [L, 50], [R, 50], [L, 80], [R, 80]],
    8: [[L, 20], [R, 20], [M, 35], [L, 50], [R, 50], [M, 65], [L, 80], [R, 80]],
    9: [[L, 20], [R, 20], [L, 39], [R, 39], [M, 50], [L, 61], [R, 61], [L, 80], [R, 80]],
    10: [[L, 20], [R, 20], [M, 30], [L, 39], [R, 39], [L, 61], [R, 61], [M, 70], [L, 80], [R, 80]],
  };

  let red = $derived(card.suit === "D" || card.suit === "H");
  let sym = $derived(SYMBOL[card.suit]);
  let face = $derived(card.rank >= 11 && card.rank <= 13);
</script>

{#snippet faceSide()}
  <span class="index top">{rankLabel(card.rank)}<span>{sym}</span></span>
  <span class="index bottom">{rankLabel(card.rank)}<span>{sym}</span></span>
  {#if card.rank === 14}
    <span class="ace">{sym}</span>
  {:else if face}
    <span class="court"><span class="court-letter">{rankLabel(card.rank)}</span><span class="court-sym">{sym}</span></span>
  {:else}
    {#each PIPS[card.rank] as [x, y]}
      <span class="pip" class:flip={y > 50} style:left="{x}%" style:top="{y}%">{sym}</span>
    {/each}
  {/if}
{/snippet}

{#if onclick}
  <button type="button" class="card {size}" class:red class:selected aria-pressed={selected} aria-label={label} {onclick}>
    {@render faceSide()}
  </button>
{:else}
  <div class="card {size}" class:red role="img" aria-label={label}>{@render faceSide()}</div>
{/if}

<style>
  .card {
    position: relative;
    display: block;
    container-type: inline-size;
    aspect-ratio: 5 / 7;
    width: 100%;
    padding: 0;
    border: 1px solid var(--card-edge);
    border-radius: 8% / 5.7%;
    background: var(--card);
    color: var(--black-suit);
    box-shadow: var(--shadow);
    font-family: Georgia, "Times New Roman", serif;
    line-height: 1;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
  }
  .card.red { color: var(--red-suit); }
  button.card { cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  @media (hover: hover) { button.card:hover { transform: translateY(-2px); } }
  button.card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .card.selected {
    transform: translateY(-6px);
    border-color: var(--select);
    box-shadow: 0 0 0 3px var(--select), var(--shadow);
  }

  .index {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 15cqw;
    font-size: 14cqw;
    font-weight: 700;
    letter-spacing: -0.04em;
  }
  .index span { font-size: 11cqw; margin-top: 1cqw; }
  .index.top { top: 4cqw; left: 2cqw; }
  .index.bottom { bottom: 4cqw; right: 2cqw; transform: rotate(180deg); }

  .pip {
    position: absolute;
    font-size: 18cqw;
    transform: translate(-50%, -50%);
  }
  .pip.flip { transform: translate(-50%, -50%) rotate(180deg); }

  .ace {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 52cqw;
  }

  .court {
    position: absolute;
    inset: 17cqw 20cqw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4cqw;
    border: 1.5px solid currentColor;
    border-radius: 4cqw;
    background: color-mix(in srgb, currentColor 7%, transparent);
  }
  .court::before {
    content: "";
    position: absolute;
    inset: 3cqw;
    border: 1px solid currentColor;
    border-radius: 2.5cqw;
    opacity: 0.35;
  }
  .court-letter { font-size: 34cqw; font-weight: 700; }
  .court-sym { font-size: 20cqw; }

  .card.small .index { font-size: 22cqw; width: 22cqw; }
  .card.small .index span { font-size: 17cqw; }
</style>
