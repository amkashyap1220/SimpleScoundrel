<script>
  // Small line icons, 24 x 24, drawn in the current text color.
  let { name, size = 22 } = $props();

  const PATHS = {
    sword: "M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2",
    fist: "M6 11V8.5a1.5 1.5 0 0 1 3 0V11M9 10V7.5a1.5 1.5 0 0 1 3 0V10M12 10V8a1.5 1.5 0 0 1 3 0v2M15 10.5V9.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a5 5 0 0 1-5-5v-3a2 2 0 0 1 2-2h3a1.5 1.5 0 0 1 0 3H9",
    flask: "M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 14h9",
    close: "M6 6l12 12M18 6 6 18",
    detour: "M4 19v-5a7 7 0 0 1 7-7h9M16 3l4 4-4 4",
    restart: "M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5",
    help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9.6 9.2a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .9-1 1.6v.4M12 17h.01",
    trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM17 6h3v1a3 3 0 0 1-3 3M7 6H4v1a3 3 0 0 0 3 3",
    home: "M3 11 12 4l9 7M5 10v10h5v-6h4v6h5V10",
    check: "M5 12.5 10 17l9-10",
  };
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
  stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  <path d={PATHS[name]} />
</svg>
