<script>
  import { rankLabel } from "./rules.js";

  // A fantasy-styled playing card: parchment, a framed border in its suit's
  // color, an index in two corners and pips in the standard layout. The face
  // cards (always monsters here, since the red ones are taken out) get a
  // monster: a skull for the Jack, a wraith for the Queen, a crowned skull for
  // the King. The ace is one big pip in a ring.
  // card: { suit, rank }; size: "room" | "small"
  let { card, size = "room", selected = false, onclick = null, label = "" } = $props();

  const SYMBOL = { C: "♣", S: "♠", D: "♦", H: "♥" };
  const SUIT = { C: "clubs", S: "spades", D: "diamonds", H: "hearts" };

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
    9: [[L, 20], [R, 20], [L, 40], [R, 40], [M, 50], [L, 60], [R, 60], [L, 80], [R, 80]],
    10: [[L, 20], [R, 20], [M, 30], [L, 40], [R, 40], [L, 60], [R, 60], [M, 70], [L, 80], [R, 80]],
  };

  let sym = $derived(SYMBOL[card.suit]);
</script>

{#snippet skull()}
  <path d="M50 18c-17 0-29 12-29 27 0 9 4 15 10 19v10c0 3 2 5 5 5h28c3 0 5-2 5-5V64c6-4 10-10 10-19 0-15-12-27-29-27Z" fill="currentColor" />
  <circle cx="39" cy="46" r="7.5" fill="var(--parchment)" />
  <circle cx="61" cy="46" r="7.5" fill="var(--parchment)" />
  <path d="M50 54l-5 9h10Z" fill="var(--parchment)" />
  <path d="M42 70v9M50 70v9M58 70v9" stroke="var(--parchment)" stroke-width="2.5" />
{/snippet}

{#snippet monster()}
  <svg class="monster" viewBox="0 0 100 100" aria-hidden="true">
    {#if card.rank === 11}
      {@render skull()}
    {:else if card.rank === 12}
      <path d="M50 10C30 10 20 30 20 50v38l8-7 7 7 8-7 7 7 7-7 8 7 7-7 8 7V50c0-20-10-40-30-40Z" fill="currentColor" />
      <ellipse cx="50" cy="48" rx="15" ry="18" fill="#1d1712" />
      <circle cx="44" cy="46" r="3.4" fill="#f2c14e" />
      <circle cx="56" cy="46" r="3.4" fill="#f2c14e" />
    {:else}
      <path d="M27 30 32 9l10 12 8-15 8 15 10-12 5 21Z" fill="#d4a537" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      <circle cx="50" cy="21" r="2.6" fill="currentColor" />
      <g transform="translate(12.5 22) scale(0.75)">{@render skull()}</g>
    {/if}
  </svg>
{/snippet}

{#snippet faceSide()}
  <span class="frame" aria-hidden="true"></span>
  <span class="gem" aria-hidden="true"></span>
  <span class="index top">{rankLabel(card.rank)}<span>{sym}</span></span>
  <span class="index bottom">{rankLabel(card.rank)}<span>{sym}</span></span>
  {#if card.rank === 14}
    <span class="ace"><span class="ring"></span><span class="ace-sym">{sym}</span></span>
  {:else if card.rank >= 11}
    {@render monster()}
  {:else}
    {#each PIPS[card.rank] as [x, y]}
      <span class="pip" class:flip={y > 50} style:left="{x}%" style:top="{y}%">{sym}</span>
    {/each}
  {/if}
{/snippet}

{#if onclick}
  <button type="button" class="card {size} {SUIT[card.suit]}" class:selected aria-pressed={selected} aria-label={label} {onclick}>
    {@render faceSide()}
  </button>
{:else}
  <div class="card {size} {SUIT[card.suit]}" role="img" aria-label={label}>{@render faceSide()}</div>
{/if}

<style>
  .card {
    --parchment: #f6ecd2;
    position: relative;
    display: block;
    container-type: inline-size;
    aspect-ratio: 5 / 7;
    width: 100%;
    padding: 0;
    border: 1px solid #8a7550;
    border-radius: 8% / 5.7%;
    background:
      radial-gradient(ellipse at 50% 40%, rgb(255 255 255 / 0.55), transparent 65%),
      radial-gradient(ellipse at 50% 50%, transparent 55%, rgb(120 90 40 / 0.22)),
      var(--parchment);
    color: var(--suit);
    box-shadow: var(--shadow);
    font-family: "Cinzel", Georgia, "Times New Roman", serif;
    line-height: 1;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    overflow: hidden;
  }
  /* Each suit its own color */
  .spades { --suit: #4a2f86; }
  .clubs { --suit: #2c6a36; }
  .diamonds { --suit: #1d5e8f; }
  .hearts { --suit: #b0241c; }

  button.card { cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  @media (hover: hover) { button.card:hover { transform: translateY(-2px); } }
  button.card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .card.selected {
    transform: translateY(-6px);
    border-color: var(--select);
    box-shadow: 0 0 0 3px var(--select), var(--shadow);
  }

  /* An inner border in the suit's color, with a small diamond at each corner */
  .frame {
    position: absolute;
    inset: 3.5cqw;
    border: 1.5px solid var(--suit);
    border-radius: 4cqw;
    opacity: 0.55;
  }
  .frame::before, .frame::after {
    content: "";
    position: absolute;
    inset: 1.6cqw;
    border: 1px solid var(--suit);
    border-radius: 2.5cqw;
    opacity: 0.5;
  }
  .frame::after {
    inset: auto;
    left: 50%;
    top: -2.2cqw;
    width: 3.6cqw;
    height: 3.6cqw;
    border: 0;
    border-radius: 0;
    background: var(--suit);
    transform: translateX(-50%) rotate(45deg);
    opacity: 1;
  }
  .gem {
    position: absolute;
    left: 50%;
    bottom: calc(3.5cqw - 1.8cqw);
    width: 3.6cqw;
    height: 3.6cqw;
    background: var(--suit);
    transform: translateX(-50%) rotate(45deg);
    opacity: 0.55;
  }

  .index {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 15cqw;
    padding: 1cqw 0;
    font-size: 13cqw;
    font-weight: 700;
    letter-spacing: -0.04em;
    background: var(--parchment);
    border-radius: 2cqw;
  }
  .index span { font-family: Georgia, serif; font-size: 11cqw; margin-top: 1cqw; }
  .index.top { top: 5cqw; left: 3cqw; }
  .index.bottom { bottom: 5cqw; right: 3cqw; transform: rotate(180deg); }

  .pip {
    position: absolute;
    font-family: Georgia, serif;
    font-size: 18cqw;
    transform: translate(-50%, -50%);
    text-shadow: 0 0.6cqw 0 rgb(0 0 0 / 0.12);
  }
  .pip.flip { transform: translate(-50%, -50%) rotate(180deg); }

  .ace { position: absolute; inset: 0; display: grid; place-items: center; }
  .ring {
    position: absolute;
    width: 62cqw;
    height: 62cqw;
    border: 2px dotted var(--suit);
    border-radius: 50%;
    opacity: 0.6;
  }
  .ace-sym { font-family: Georgia, serif; font-size: 44cqw; }

  .monster {
    position: absolute;
    left: 18cqw;
    right: 18cqw;
    top: 50%;
    transform: translateY(-50%);
    width: 64cqw;
    height: auto;
    filter: drop-shadow(0 0.8cqw 0 rgb(0 0 0 / 0.15));
  }

  .card.small .index { font-size: 20cqw; width: 22cqw; }
  .card.small .index span { font-size: 16cqw; }
</style>
