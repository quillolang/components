// mobile
const bar = $("#syncbar-demo");
const word = (el = bar) => el.querySelector(".ui-syncbar-word").textContent;
const line = (el = bar) => el.querySelector(".ui-syncbar-detail").textContent;
const retry = () => bar.querySelector(".ui-syncbar-retry");
const net = async (offline) => { await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(150); };
if (word() !== "Saved" || bar.dataset.state !== "saved") return "starts saved: " + word();
if (line() !== "Last synced 3 min ago") return "relative from the props: " + line();
if (retry()) return "no retry while saved";
// The other forms of time, worked out by hand: 2 h, never, a clock behind, bad text, stale.
if (line($("#syncbar-iso")) !== "Last synced 2 h ago") return "a date-time: " + line($("#syncbar-iso"));
if (line($("#syncbar-never")) !== "Not synced yet") return "never: " + line($("#syncbar-never"));
if (line($("#syncbar-ahead")) !== "Last synced just now") return "a time ahead: " + line($("#syncbar-ahead"));
if (line($("#syncbar-bad")) !== "Not synced yet") return "bad text: " + line($("#syncbar-bad"));
if (!$("#syncbar-stale").hasAttribute("data-stale") || bar.hasAttribute("data-stale")) return "stale past 60 minutes only";
if (word($("#syncbar-words")) !== "Sending" || line($("#syncbar-words")) !== "1 change going") return "words: " + word($("#syncbar-words")) + line($("#syncbar-words"));
// The status prop, and what is waiting.
await tap($("#syncbar-syncing"));
if (bar.dataset.state !== "syncing" || word() !== "Syncing…") return "syncing: " + word();
await tap($("#syncbar-pending")); await tap($("#syncbar-pending"));
if (line() !== "2 changes going") return "pending while syncing: " + line();
await tap($("#syncbar-saved"));
if (line() !== "2 changes waiting. Last synced 3 min ago") return "pending while saved: " + line();
// Coming back from the background the time has moved on, though timers stopped: five minutes on.
const clock = Date.now;
Date.now = () => clock.call(Date) + 300000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
Date.now = clock;
if (line() !== "2 changes waiting. Last synced 8 min ago") return "the clock caught up: " + line();
// Offline, by itself, for real.
await net(true);
try {
    if (bar.dataset.state !== "offline" || word() !== "Offline") return "it notices being offline: " + word();
    if (line() !== "2 changes will sync when you are back") return "offline's line: " + line();
    await tap($("#syncbar-failed"));
    if (bar.dataset.state !== "offline" || retry()) return "offline wins, and no retry that cannot work";
    if ($("#syncbar-iso").dataset.state !== "saved") return "follow_network false stays as it is";
} finally { await net(false); }
if (bar.dataset.state !== "failed" || word() !== "Sync failed") return "back to the program's word: " + word();
if (line() !== "The server did not answer.") return "the reason: " + line();
// Retry: a real tap, a second during it does nothing, it says when it failed again.
await tap(retry());
if (bar.dataset.state !== "syncing" || !retry().disabled) return "syncing while it tries: " + bar.dataset.state + " " + $("#syncbar-tries").textContent + " " + retry()?.textContent + " " + line() + " " + JSON.stringify(retry().getBoundingClientRect());
if (retry().textContent !== "Trying") return "the button stays in place: " + retry().textContent;
await tap(retry());
await wait(300);
if ($("#syncbar-tries").textContent !== "Retries asked for: 1.") return "a double tap: " + $("#syncbar-tries").textContent;
if (bar.dataset.state !== "failed" || line() !== "Still could not sync.") return "failed again: " + bar.dataset.state + " " + line();
await tap($("#syncbar-fix"));
await tap(retry()); await wait(600);
if (bar.dataset.state !== "saved" || retry()) return "a retry that works: " + bar.dataset.state;
if (line() !== "2 changes waiting. Last synced 3 min ago") return "the line is the time again: " + line();
// As wide as it gets the two words share a row; on a phone, they stack.
const a = bar.querySelector(".ui-syncbar-word").getBoundingClientRect(), b = bar.querySelector(".ui-syncbar-detail").getBoundingClientRect();
if (device === "phone" ? b.top < a.bottom - 1 : Math.abs(a.bottom - b.bottom) > 6) return "layout on a " + device + ": " + a.bottom + " " + b.top;
