import { mount } from "svelte";
import App from "./App.svelte";
import "./app.css";

mount(App, { target: document.getElementById("app") });

// When the game is embedded in a page (alexanderk.dev/lab/scoundrel), tell
// that page how tall the game is, so its frame fits without a scrollbar.
if (window.parent !== window) {
  const report = () => window.parent.postMessage({ type: "scoundrel:height", height: Math.ceil(document.body.getBoundingClientRect().height) }, "*");
  new ResizeObserver(report).observe(document.body);
  report();
}
