// mobile
delete window.quilloNative;
localStorage.removeItem("quillo-demo-nothing");
const count = () => $(".ui-bpcard-count").textContent.replace(/\s+/g, " ").trim();
const phase = () => $(".ui-bpcard-count").dataset.phase;
const net = () => $(".ui-bpcard-net").textContent;
const full = () => $(".ui-bpcard-full");

if ($(".ui-bpcard-gate").textContent !== "B12" || $(".ui-bpcard-boards").textContent !== "21:55") return "gate and time: " + $(".ui-bpcard-gate").textContent + $(".ui-bpcard-boards").textContent;
if (parseFloat(getComputedStyle($(".ui-bpcard-gate")).fontSize) < 40) return "the gate is not large";
if (!$(".ui-bpcard-was").textContent.includes("Changed from A3")) return "gate change: " + $(".ui-bpcard-was")?.textContent;
if (!$(".ui-bpcard-show svg")) return "no code on the card";

// 20:40 to 21:55 is 1 h 15 min; the clock has run a second or more, so 1 h 14 min, whole minutes down.
if (!/^Boards in 1 h 1[45] min$/.test(count()) || phase() !== "wait") return "before: " + count();

// Under the hour it counts in minutes and seconds, 10:00 down from 21:45:30: it ticks by itself.
await tap($(".boarding-pass-card-demo-soon"));
const first = count();
if (!/^Boards in 09:[0-9]{2}$/.test(first) && first !== "Boards in 10:00") return "soon: " + first;
await wait(2200);
if (count() === first) return "the countdown does not tick: " + count();

await tap($(".boarding-pass-card-demo-board"));
if (phase() !== "boarding" || !/^Boarding nowGate closes in (09:[0-9]{2}|10:00)$/.test(count())) return "boarding: " + count();
await tap($(".boarding-pass-card-demo-close"));
if (phase() !== "closed" || !/^Gate closedDeparts in (09:[0-9]{2}|10:00)$/.test(count())) return "closed: " + count();
await tap($(".boarding-pass-card-demo-gone"));
if (phase() !== "gone" || count() !== "Departed") return "gone: " + count();

// It kept itself, and told the page once.
if ($(".boarding-pass-card-demo-told").textContent !== "1") return "on_keep: " + $(".boarding-pass-card-demo-told").textContent;
if (net() !== "Saved for offline use.") return "net: " + net();
const saved = JSON.parse(localStorage.getItem("quillo-demo-pass"));
if (saved.flight !== "QA 204") return "not saved: " + JSON.stringify(saved);

// Really offline, by Chrome's network state: it says so and still works.
await cdp("Network.enable");
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
const off = net();
await tap($(".ui-bpcard-show"));
const drawnOffline = !!$(".ui-bpcard-full-code svg");
$(".ui-bpcard-done").click();
await wait(100);
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
if (off !== "Offline. This pass is saved and still works.") return "offline: " + off;
if (!drawnOffline) return "the code was not drawn offline";

// In a browser: the screen says what it cannot do itself, and a Wake Lock is held.
let released = 0, asked = 0;
Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: async (t) => { asked++; return { type: t, release: async () => { released++; } }; } } });
await tap($(".ui-bpcard-show"));
if (!full().open) return "the code did not open";
if ($(".ui-bpcard-full-say").textContent !== "Turn your screen's brightness up for the scanner.") return "say: " + $(".ui-bpcard-full-say").textContent;
if (asked !== 1) return "wake lock asked: " + asked;
// The code's page is white, and as wide as the phone allows, whatever the theme.
if (getComputedStyle(full()).backgroundColor !== "rgb(255, 255, 255)") return "not white: " + getComputedStyle(full()).backgroundColor;
const big = $(".ui-bpcard-full-code svg").getBoundingClientRect();
const want = Math.min(innerWidth * 0.92 - 0, innerHeight * 0.62, innerWidth - 32);
if (Math.abs(big.width - want) > 2) return `code ${big.width} wide, wanted ${want}`;
await tap($(".ui-bpcard-done"));
if (full().open) return "Done did not close it";
if (released !== 1) return "wake lock released: " + released;
if ($(".ui-bpcard-full-code")) return "the big code stays after closing";

// Escape closes it the same way; the browser sends close.
await tap($(".ui-bpcard-show"));
full().close();
await wait(100);
if (released !== 2) return "closing another way does not let go: " + released;

// Going away and coming back: the lock is asked for again.
await tap($(".ui-bpcard-show"));
const n = asked;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (asked !== n + 1) return "not asked again on coming back: " + asked;
$(".ui-bpcard-done").click();
await wait(100);
delete navigator.wakeLock;

// No Wake Lock here at all: it still opens.
const had = Object.getOwnPropertyDescriptor(Navigator.prototype, "wakeLock");
delete Navigator.prototype.wakeLock;
await tap($(".ui-bpcard-show"));
if (!full().open) return "without a Wake Lock it did not open";
$(".ui-bpcard-done").click();
await wait(100);
if (had) Object.defineProperty(Navigator.prototype, "wakeLock", had);

// The app: brightness up to 1, kept on, then back to what it was, in that order.
const calls = [];
window.quilloNative = {
    brightness: async (v) => { calls.push(v === undefined ? "read" : "set " + v); return 0.35; },
    keepAwake: async (on) => { calls.push("awake " + on); },
};
await tap($(".ui-bpcard-show"));
if (calls.join() !== "read,set 1,awake true") return "app up: " + calls;
if ($(".ui-bpcard-full-say").textContent !== "") return "no need to ask in the app";
await tap($(".ui-bpcard-done"));
if (calls.join() !== "read,set 1,awake true,set 0.35,awake false") return "app down: " + calls;

// Brightness refused: it still shows the code, and puts nothing back.
window.quilloNative.brightness = async () => { calls.push("refused"); throw new Error("no"); };
calls.length = 0;
await tap($(".ui-bpcard-show"));
if (!full().open || calls.join() !== "refused,awake true") return "refused: " + calls;
await tap($(".ui-bpcard-done"));
if (calls.join() !== "refused,awake true,awake false") return "refused down: " + calls;
delete window.quilloNative;

// A page with no pass finds the saved one, and one with none says so.
await tap($(".boarding-pass-card-demo-copy"));
await wait(300);
const second = $(".boarding-pass-card-demo-second .ui-bpcard");
if (!second || second.querySelector(".ui-bpcard-gate")?.textContent !== "B12") return "no saved copy shown";
if (!second.querySelector(".ui-bpcard-net").textContent.startsWith("Saved copy.")) return "copy says: " + second.querySelector(".ui-bpcard-net").textContent;
if ($(".boarding-pass-card-demo-none .ui-bpcard-empty")?.textContent !== "No boarding pass to show." ) return "none: " + $(".boarding-pass-card-demo-none")?.textContent;
const noCode = $(".boarding-pass-card-demo-nocode");
if (noCode.querySelector(".ui-bpcard-show") || !noCode.textContent.includes("This pass has no code.")) return "no code: " + noCode.textContent;
await tap($(".boarding-pass-card-demo-copy"));
localStorage.removeItem("quillo-demo-pass");

const cols = getComputedStyle($(".ui-bpcard-in")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
