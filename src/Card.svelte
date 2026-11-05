<script>
  import { rankLabel } from "./rules.js";

  // A storybook-style playing card, drawn as one SVG: a cream card with an
  // inked border, a flat colored panel in its suit's color, and the index in
  // a cream box at two corners. Number cards get outlined pips in the standard
  // layout. The face cards (always monsters here, since the red ones are taken
  // out) are full-length villains: a hooded rogue for the Jack, a sorceress
  // for the Queen and a tyrant king for the King. The ace is one big pip in a
  // medallion.
  // card: { suit, rank }; size: "room" | "small"
  let { card, size = "room", selected = false, onclick = null, label = "" } = $props();

  const SUIT = { C: "clubs", S: "spades", D: "diamonds", H: "hearts" };
  const SYMBOL = { C: "♣", S: "♠", D: "♦", H: "♥" };

  // Suit shapes, about 22 units across, centered on 0,0
  const SHAPE = {
    H: "M0 10C-7 4-12-1-12-5.5-12-9.5-9-12-5.8-12-3-12-1-10 0-7.8 1-10 3-12 5.8-12 9-12 12-9.5 12-5.5 12-1 7 4 0 10Z",
    D: "M0-12 8.5 0 0 12-8.5 0Z",
    S: "M0-12C3.5-7 12-3 12 2.5 12 6.5 9 8.6 6 8.6 4.3 8.6 2.8 7.8 1.8 6.6 2 9 3.2 10.8 5 12H-5C-3.2 10.8-2 9-1.8 6.6-2.8 7.8-4.3 8.6-6 8.6-9 8.6-12 6.5-12 2.5-12-3-3.5-7 0-12Z",
    C: "M0-12.5A5.6 5.6 0 0 1 4.6-3.7 5.6 5.6 0 1 1 1.7 5.9C2.1 8.6 3.3 10.6 5 12H-5C-3.3 10.6-2.1 8.6-1.7 5.9A5.6 5.6 0 1 1-4.6-3.7 5.6 5.6 0 0 1 0-12.5Z",
  };

  // Pip positions in card units (the card is 250 x 350). Lower pips are drawn upside down.
  const L = 88, M = 125, R = 162;
  const T = 72, B = 278, MID = 175;
  const PIPS = {
    2: [[M, T], [M, B]],
    3: [[M, T], [M, MID], [M, B]],
    4: [[L, T], [R, T], [L, B], [R, B]],
    5: [[L, T], [R, T], [M, MID], [L, B], [R, B]],
    6: [[L, T], [R, T], [L, MID], [R, MID], [L, B], [R, B]],
    7: [[L, T], [R, T], [M, 124], [L, MID], [R, MID], [L, B], [R, B]],
    8: [[L, T], [R, T], [M, 124], [L, MID], [R, MID], [M, 226], [L, B], [R, B]],
    9: [[L, T], [R, T], [L, 141], [R, 141], [M, MID], [L, 209], [R, 209], [L, B], [R, B]],
    10: [[L, T], [R, T], [M, 106], [L, 141], [R, 141], [L, 209], [R, 209], [M, 244], [L, B], [R, B]],
  };

  let small = $derived(size === "small");
  let rank = $derived(rankLabel(card.rank));
  // The index box: bigger on the small cards, where it's most of what shows
  let box = $derived(small ? { w: 84, h: 150, fs: rank.length > 1 ? 52 : 66, sy: 128, ss: 2.3 } : { w: 46, h: 88, fs: rank.length > 1 ? 30 : 38, sy: 74, ss: 1.15 });
  let uid = $derived(`${card.suit}${card.rank}${small ? "s" : ""}`);
</script>

{#snippet pip(x, y, scale, flip)}
  <path class="pip" d={SHAPE[card.suit]} stroke-width={2.4 / scale} transform="translate({x} {y}) scale({scale}){flip ? ' rotate(180)' : ''}" />
{/snippet}

{#snippet index()}
  <g class="index">
    <rect x="11" y="11" width={box.w} height={box.h} rx="7" class="cream line" />
    <text clip-path="url(#index-{uid})" x={11 + box.w / 2} y={11 + box.fs * 0.98} font-size={box.fs} text-anchor="middle" class="rank" textLength={rank.length > 1 ? box.w - 8 : null} lengthAdjust="spacingAndGlyphs">{rank}</text>
    {@render pip(11 + box.w / 2, box.sy + (small ? 14 : 4), box.ss, false)}
  </g>
{/snippet}

<!-- Jack: a hooded rogue with a dagger -->
{#snippet rogue()}
  <g class="figure">
    <!-- cloak behind -->
    <path class="dark" d="M98 112C84 170 72 250 66 318H194C188 250 176 170 162 112Z" />
    <!-- legs and boots -->
    <path class="red" d="M108 236H128V300H110Z" />
    <path class="cream" d="M132 236H152L150 300H132Z" />
    <path class="boot" d="M108 296H128L129 320H96C96 312 102 306 108 304Z" />
    <path class="boot" d="M132 296H150C156 304 164 312 164 320H131Z" />
    <!-- tunic -->
    <path class="main" d="M106 116H154L166 246C150 252 110 252 94 246Z" />
    <path class="trim" d="M130 118V246" />
    <path class="gold" d="M100 186H160L161 198H99Z" />
    <rect class="gold" x="124" y="183" width="12" height="18" rx="2" />
    <path class="boot" d="M140 198H156L154 222C150 226 144 226 141 222Z" />
    <!-- arm with the dagger, raised -->
    <path class="main" d="M108 120C94 124 86 140 84 168L98 172C100 154 104 142 112 136Z" />
    <rect class="steel" x="84" y="110" width="9" height="46" rx="1" />
    <path class="steel" d="M84 110 88.5 98 93 110Z" />
    <rect class="gold" x="76" y="154" width="25" height="7" rx="2" />
    <circle class="skin" cx="90" cy="168" r="8" />
    <!-- other arm, on the hip -->
    <path class="main" d="M152 120C166 128 172 150 168 182L156 180C158 160 154 144 148 136Z" />
    <circle class="skin" cx="161" cy="186" r="7.5" />
    <!-- hood and face -->
    <path class="dark" d="M104 122C98 92 106 62 130 46 154 62 162 92 156 122 146 128 114 128 104 122Z" />
    <ellipse class="skin" cx="130" cy="96" rx="15" ry="18" />
    <path class="mask" d="M114 88C122 84 138 84 146 88V97C138 94 122 94 114 97Z" />
    <circle class="eye" cx="123" cy="91" r="2.4" />
    <circle class="eye" cx="137" cy="91" r="2.4" />
    <path class="ink" d="M124 106C128 108 132 108 136 106" />
    <path class="dark" d="M112 82C116 66 124 60 130 58 136 60 144 66 148 82 140 74 120 74 112 82Z" />
  </g>
{/snippet}

<!-- Queen: a sorceress with a staff -->
{#snippet sorceress()}
  <g class="figure">
    <!-- staff -->
    <rect class="wood" x="172" y="60" width="8" height="262" rx="3" />
    <path class="gold" d="M166 66C164 54 168 44 176 40 184 44 188 54 186 66Z" />
    <circle class="orb" cx="176" cy="44" r="12" />
    <circle class="glint" cx="172" cy="40" r="3.5" />
    <!-- high collar -->
    <path class="dark" d="M96 124C88 104 88 80 96 60L112 92 130 66 148 92 164 60C172 80 172 104 164 124Z" />
    <path class="trim" d="M112 92 112 120M148 92 148 120" />
    <!-- gown -->
    <path class="main" d="M114 162C100 214 86 270 78 322H182C174 270 160 214 146 162Z" />
    <path class="trim" d="M130 166V322M106 240C120 246 140 246 154 240" />
    <path class="red" d="M108 120H152L148 168H112Z" />
    <path class="gold" d="M110 160H150L148 170H112Z" />
    <path class="gold" d="M130 128 136 140 130 152 124 140Z" />
    <!-- sleeves -->
    <path class="dark" d="M108 122C96 132 88 160 84 196 94 202 104 200 110 194L114 140Z" />
    <circle class="skin" cx="100" cy="198" r="7" />
    <path class="dark" d="M152 122C164 130 170 146 172 168L160 176C156 160 152 146 146 140Z" />
    <circle class="skin" cx="170" cy="172" r="7.5" />
    <!-- hair, face, circlet -->
    <path class="hair" d="M110 94C108 70 116 56 130 54 144 56 152 70 150 94L156 136C146 130 140 122 140 112H120C120 122 114 130 104 136Z" />
    <ellipse class="pale" cx="130" cy="96" rx="13.5" ry="17" />
    <path class="gold" d="M115 78C124 72 136 72 145 78L144 84C136 79 124 79 116 84Z" />
    <circle class="orb" cx="130" cy="76" r="3.4" />
    <path class="ink" d="M120 92 127 94M140 92 133 94" />
    <circle class="eye" cx="124" cy="96" r="1.8" />
    <circle class="eye" cx="136" cy="96" r="1.8" />
    <path class="lips" d="M125 105C128 107 132 107 135 105 132 109 128 109 125 105Z" />
  </g>
{/snippet}

<!-- King: a bearded tyrant with a greatsword -->
{#snippet tyrant()}
  <g class="figure">
    <!-- cape -->
    <path class="dark" d="M94 118C82 180 70 260 64 322H196C190 260 178 180 166 118Z" />
    <!-- greatsword, held upright -->
    <rect class="steel" x="73" y="56" width="11" height="150" rx="1" />
    <path class="steel" d="M73 56 78.5 40 84 56Z" />
    <path class="ink" d="M78.5 62V200" />
    <rect class="gold" x="60" y="204" width="37" height="9" rx="3" />
    <rect class="wood" x="74.5" y="213" width="8" height="26" rx="2" />
    <circle class="gold" cx="78.5" cy="244" r="6.5" />
    <!-- legs and boots -->
    <path class="boot" d="M106 296H126L127 320H94C94 312 100 304 106 302Z" />
    <path class="boot" d="M134 296H154C160 304 166 312 166 320H133Z" />
    <!-- robe -->
    <path class="main" d="M104 120H156L170 300H90Z" />
    <path class="ermine" d="M122 122H138V300H122Z" />
    <g class="spots"><path d="M128 140v6M132 172v6M128 204v6M132 236v6M128 268v6" /></g>
    <path class="gold" d="M100 190H160L161 202H99Z" />
    <rect class="red" x="123" y="187" width="14" height="18" rx="3" />
    <!-- arms -->
    <path class="main" d="M106 124C92 130 84 160 82 214L96 216C98 178 104 150 114 140Z" />
    <circle class="skin" cx="88" cy="218" r="9" />
    <path class="main" d="M154 124C168 132 176 160 174 194L162 194C162 170 156 150 148 140Z" />
    <circle class="skin" cx="167" cy="198" r="8" />
    <!-- ermine collar -->
    <path class="ermine" d="M98 116C110 128 150 128 162 116L158 132C146 140 114 140 102 132Z" />
    <g class="spots"><path d="M110 128v4M122 132v4M138 132v4M150 128v4" /></g>
    <!-- face, beard, crown -->
    <ellipse class="skin" cx="130" cy="94" rx="15" ry="18" />
    <path class="beard" d="M115 96C116 112 120 132 130 146 140 132 144 112 145 96 140 106 120 106 115 96Z" />
    <path class="beard" d="M120 104C124 100 128 101 130 103 132 101 136 100 140 104 136 106 124 106 120 104Z" />
    <path class="ink" d="M118 86 127 90M142 86 133 90" />
    <circle class="eye" cx="123" cy="93" r="2" />
    <circle class="eye" cx="137" cy="93" r="2" />
    <path class="gold" d="M112 80 110 50 120 64 130 44 140 64 150 50 148 80Z" />
    <circle class="red" cx="130" cy="70" r="4" />
    <circle class="orb" cx="118" cy="73" r="2.6" />
    <circle class="orb" cx="142" cy="73" r="2.6" />
  </g>
{/snippet}

{#snippet face()}
  <svg viewBox="0 0 250 350" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="panel-{uid}"><rect x="17" y="17" width="216" height="316" rx="9" /></clipPath>
      <clipPath id="index-{uid}"><rect x="13" y="13" width={box.w - 4} height={box.h - 4} rx="5" /></clipPath>
      <pattern id="hatch-{uid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <path d="M0 0V6" stroke="rgb(43 29 18 / 0.07)" stroke-width="1.6" />
      </pattern>
    </defs>
    <!-- card and inner line -->
    <rect x="1.5" y="1.5" width="247" height="347" rx="18" class="cream" stroke="#2b1d12" stroke-width="3" />
    <rect x="17" y="17" width="216" height="316" rx="9" class="panel" />
    <rect x="17" y="17" width="216" height="316" rx="9" fill="url(#hatch-{uid})" />
    {#if !small}
      <g clip-path="url(#panel-{uid})">
        {#if card.rank === 14}
          <circle cx="125" cy="175" r="70" class="cream line" />
          <circle cx="125" cy="175" r="60" fill="none" class="dots" />
          {@render pip(125, 175, 4.1, false)}
        {:else if card.rank === 13}
          <g transform="translate(128 326) scale(1.07) translate(-128 -326)">{@render tyrant()}</g>
        {:else if card.rank === 12}
          <g transform="translate(128 326) scale(1.07) translate(-128 -326)">{@render sorceress()}</g>
        {:else if card.rank === 11}
          <g transform="translate(128 326) scale(1.07) translate(-128 -326)">{@render rogue()}</g>
        {:else}
          {#each PIPS[card.rank] as [x, y]}
            {@render pip(x, y, 1.55, y > MID)}
          {/each}
        {/if}
      </g>
    {/if}
    <rect x="17" y="17" width="216" height="316" rx="9" fill="none" class="line" />
    {@render index()}
    {#if !small}
      <g transform="rotate(180 125 175)">{@render index()}</g>
    {/if}
  </svg>
{/snippet}

{#if onclick}
  <button type="button" class="card {size} {SUIT[card.suit]}" class:selected aria-pressed={selected} aria-label={label} {onclick}>
    {@render face()}
  </button>
{:else}
  <div class="card {size} {SUIT[card.suit]}" role="img" aria-label={label}>{@render face()}</div>
{/if}

<style>
  .card {
    --ink: #2b1d12;
    --cream: #f3e7cb;
    position: relative;
    display: block;
    aspect-ratio: 5 / 7;
    width: 100%;
    padding: 0;
    border: 0;
    border-radius: 7.2% / 5.1%;
    background: transparent;
    box-shadow: var(--shadow);
    font-family: "Cinzel", Georgia, "Times New Roman", serif;
    line-height: 1;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .card svg { display: block; width: 100%; height: 100%; overflow: visible; }

  /* Each suit its own panel and pip color, and the villains' clothes */
  .spades { --panel: #b4aed3; --pip: #4f3f9a; --main: #5b4aa0; --dark: #362b66; }
  .clubs { --panel: #a9c8a0; --pip: #2f7a3c; --main: #3d7c46; --dark: #24502c; }
  .diamonds { --panel: #a8ccd8; --pip: #2370a8; }
  .hearts { --panel: #ebbcaa; --pip: #bf3328; }

  button.card { cursor: pointer; transition: transform 0.12s ease, box-shadow 0.12s ease; }
  @media (hover: hover) { button.card:hover { transform: translateY(-2px); } }
  button.card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
  .card.selected {
    transform: translateY(-6px);
    box-shadow: 0 0 0 3px var(--select), var(--shadow);
  }

  svg :global(*) { stroke-linejoin: round; stroke-linecap: round; }
  .cream { fill: var(--cream); }
  .panel { fill: var(--panel); }
  .line { stroke: var(--ink); stroke-width: 2.5; }
  .line:not(.cream) { fill: none; }
  .dots { stroke: var(--ink); stroke-width: 2.5; stroke-dasharray: 0.1 7; opacity: 0.6; }
  .rank { fill: var(--ink); font-family: "Cinzel", Georgia, serif; font-weight: 700; }
  .pip { fill: var(--pip); stroke: var(--ink); }

  .figure :global(path), .figure :global(rect), .figure :global(circle), .figure :global(ellipse) {
    stroke: var(--ink);
    stroke-width: 2.4;
  }
  .figure .main { fill: var(--main); }
  .figure .dark { fill: var(--dark); }
  .figure .red { fill: #b8372b; }
  .figure .gold { fill: #e3b23c; }
  .figure .cream { fill: var(--cream); }
  .figure .ermine { fill: #f6efe0; }
  .figure .spots { stroke-width: 3; }
  .figure .skin { fill: #efc49c; }
  .figure .pale { fill: #e9d6c8; }
  .figure .hair { fill: #2b1d12; }
  .figure .beard { fill: #6b4024; }
  .figure .boot { fill: #4a3020; }
  .figure .wood { fill: #8a5a32; }
  .figure .steel { fill: #d9dde0; }
  .figure .orb { fill: #7fd3c4; }
  .figure .glint { fill: #ffffff; stroke: none; }
  .figure .mask { fill: var(--ink); }
  .figure .eye { fill: var(--ink); stroke: none; }
  .figure .ink { fill: none; stroke-width: 2.2; }
  .figure .trim { fill: none; stroke-width: 1.6; opacity: 0.55; }
  .figure .lips { fill: #a8322a; stroke-width: 1; }
</style>
