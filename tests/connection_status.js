const hosts = $$(".ui-conn-host");
if (hosts.length !== 3) return `expected 3, found ${hosts.length}`;
const [pill, always, bar] = hosts;
if (pill.querySelector(".ui-conn") || bar.querySelector(".ui-conn")) return "something shows while online";
const dot = always.querySelector(".ui-conn");
if (!dot || dot.textContent.trim() !== "Online" || !dot.querySelector(".ui-conn-dot") || !dot.classList.contains("ui-conn-online")) return "always does not say Online with a dot";
if (hosts.some((h) => h.querySelector("[role=status]") == null)) return "no status region";
window.dispatchEvent(new Event("offline")); await wait();
try {
const off = pill.querySelector(".ui-conn");
if (!off || !off.classList.contains("ui-conn-offline") || off.textContent.trim() !== "You are offline" || !off.classList.contains("ui-conn-inline")) return `offline shows: ${off?.textContent}`;
if (always.querySelector(".ui-conn").textContent.trim() !== "You are offline") return "always does not say offline";
const top = bar.querySelector(".ui-conn");
await wait(300); // its slide-in
if (!top || !top.classList.contains("ui-conn-top") || getComputedStyle(top).position !== "fixed" || Math.abs(top.getBoundingClientRect().top) > 0.5) return "the bar is not fixed to the top";
if (!$(".demo-note").textContent.includes("Seen: offline")) return `on_change(false) did not reach the note: ${$(".demo-note").textContent}`;
} finally { window.dispatchEvent(new Event("online")); }
await wait();
const back = pill.querySelector(".ui-conn");
if (!back || !back.classList.contains("ui-conn-online") || back.textContent.trim() !== "Back online") return `back online shows: ${back?.textContent}`;
if (!$(".demo-note").textContent.includes("Seen: offline, online")) return "on_change(true) did not reach the note";
await wait(2400);
if (pill.querySelector(".ui-conn")) return "Back online did not go after 2 s";
if (always.querySelector(".ui-conn").textContent.trim() !== "Online") return "always does not go back to Online";
