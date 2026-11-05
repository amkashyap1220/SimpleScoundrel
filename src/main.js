import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

mount(App, { target: document.getElementById("app") });

// When the game is embedded in a page (alexanderk.dev/lab/scoundrel), tell
// that page how tall the game is, so its frame fits without a scrollbar.
// Browsers pause resize events in a frame that's off screen, so changes to the
// page are watched too.
if (window.parent !== window) {
  let last = 0;
  const report = () => {
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    if (height === last) return;
    last = height;
    window.parent.postMessage({ type: "scoundrel:height", height }, "*");
  };
  new ResizeObserver(report).observe(document.body);
  new MutationObserver(report).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
  addEventListener("resize", report);
  report();
}
