// mobile
const row = (id) => $(`.ui-dlist-item[data-id="${id}"]`);
const says = (id) => row(id).querySelector(".ui-dlist-state").textContent;
const note = () => $("#dlist-demo-note").textContent;
const btn = (id, verb) => row(id).querySelector(`[aria-label^="${verb}"]`);
const used = () => $(".ui-dlist-used").textContent;
const held = () => $(".ui-dlist-held").textContent;
const wifiBox = () => $(".ui-dlist-wifi input");
// The first list: the empty one below it asks the device for itself, once, at load.
const free = () => $(".ui-dlist").querySelector(".ui-dlist-free");
const again = async () => { await tap($("#dlist-demo-again")); await wait(350); };

// By hand: 20.5 + 300 + 30 + 12 + 0 + 9 = 371.5 MB. Rows without an id are gone.
if ($$(".ui-dlist-item").length !== 6) return "six usable rows: " + $$(".ui-dlist-item").length;
if (used() !== "371.5 MB used of 5 GB") return "storage: " + used();
const meter = $(".ui-dlist-meter");
if (meter.getAttribute("aria-valuenow") !== "7") return "371.5 MB of 5 GB is 7%: " + meter.getAttribute("aria-valuenow");
if (says("a") !== "50%, 20.5 MB of 41 MB") return "a row: " + says("a");
if (says("b") !== "25%, 300 MB of 1.2 GB") return "a row in GB: " + says("b");
if (says("c") !== "Paused, 30 MB of 88 MB") return "paused: " + says("c");
if (says("d") !== "Connection lost, 12 MB of 62 MB") return "failed, with why: " + says("d");
if (says("e") !== "Queued, 15 MB") return "queued: " + says("e");
if (says("f") !== "9 MB") return "done: " + says("f");
if (row("f").querySelector(".ui-dlist-bar")) return "done has no bar";
if (row("a").querySelector(".ui-dlist-bar").getAttribute("aria-valuenow") !== "50") return "the bar's value";

// The right button for each state.
if (!btn("a", "Pause") || btn("a", "Resume") || btn("a", "Retry")) return "loading pauses";
if (!btn("c", "Resume") || btn("c", "Pause")) return "paused resumes";
if (!btn("d", "Retry")) return "failed retries";
if (!btn("e", "Pause")) return "queued pauses";
if (btn("f", "Pause") || btn("f", "Resume") || btn("f", "Retry") || !btn("f", "Remove")) return "done only removes";

// Progress arrives from the page, and the row and total follow.
await tap($("#dlist-demo-more"));
if (says("a") !== "100%, 41 MB of 41 MB") return "more arrives: " + says("a");
if (used() !== "412.5 MB used of 5 GB" && used() !== "412 MB used of 5 GB") return "the total follows: " + used();

// A press shows at once, and the page is told.
await tap(btn("b", "Pause"));
if (says("b") !== "Paused, 320.5 MB of 1.2 GB") return "pause shows at once: " + says("b");
if (!note().startsWith("Last pause b")) return "on_pause: " + note();
if (!btn("b", "Resume")) return "and the button turns";
await tap(btn("c", "Resume"));
if (!says("c").startsWith("34%, 30 MB of 88 MB")) return "resume: " + says("c");
if (!note().startsWith("Last resume c")) return "on_resume: " + note();
await tap(btn("d", "Retry"));
if (!says("d").startsWith("19%, 12 MB of 62 MB")) return "retry: " + says("d");
if (!note().startsWith("Last retry d")) return "on_retry: " + note();
await tap(btn("e", "Remove"));
if (row("e")) return "remove goes at once";
if (!note().startsWith("Last remove e")) return "on_remove: " + note();

// Clear finished.
await tap($(".ui-dlist-clear"));
if (row("f")) return "clear finished";
if (!note().startsWith("Last clear 1")) return "on_clear: " + note();
await again();

// The setting, on a browser that does not say which network it is on: Chrome here.
await tap(wifiBox());
if (!note().endsWith("setting true")) return "on_wifi_only: " + note();
if (wifiBox().checked !== true) return "it stays on";
if (!$(".ui-dlist-why").textContent.includes("does not say which network")) return "it says it cannot be kept to: " + $(".ui-dlist-why").textContent;
await tap(wifiBox());

// A network that does say. On data with Wi-Fi only: waits, says so, tells the page, and buttons wait too.
const had = Object.getOwnPropertyDescriptor(Navigator.prototype, "connection");
const listeners = new Set();
const net = { type: "cellular", addEventListener: (n, f) => listeners.add(f), removeEventListener: (n, f) => listeners.delete(f) };
Object.defineProperty(Navigator.prototype, "connection", { configurable: true, get: () => net });
const restore = () => Object.defineProperty(Navigator.prototype, "connection", had);
await again();
if (held() !== "") { restore(); return "data with the setting off is fine: " + held(); }
if (says("a").startsWith("Waiting")) { restore(); return "not waiting: " + says("a"); }
await tap(wifiBox()); await wait(120);
if (held() !== "On mobile data: waiting for Wi-Fi.") { restore(); return "on data it waits: " + held(); }
if (says("a") !== "Waiting for Wi-Fi, 20.5 MB of 41 MB") { restore(); return "each row says why: " + says("a"); }
if (says("c") !== "Paused, 30 MB of 88 MB") { restore(); return "a paused row stays paused: " + says("c"); }
if (!row("a").classList.contains("ui-dlist-waiting")) { restore(); return "and is marked"; }
if (!btn("c", "Resume").disabled || !btn("d", "Retry").disabled) { restore(); return "Resume and Retry wait too"; }
if (!note().includes("held yes")) { restore(); return "on_hold(true): " + note(); }
if ($(".ui-dlist-why").textContent.includes("does not say")) { restore(); return "and no warning, as it can tell"; }
// Wi-Fi comes back: it goes on by itself.
net.type = "wifi";
listeners.forEach((f) => f()); await wait(150);
if (held() !== "" || says("a") !== "50%, 20.5 MB of 41 MB") { restore(); return "Wi-Fi: it goes on: " + says("a"); }
if (!note().includes("held no")) { restore(); return "on_hold(false): " + note(); }
if (btn("c", "Resume").disabled) { restore(); return "and the buttons come back"; }
net.type = "cellular";
listeners.forEach((f) => f()); await wait(150);
if (!note().includes("held yes")) { restore(); return "data again: " + note(); }
// Turning the setting off lets go at once.
await tap(wifiBox()); await wait(120);
if (held() !== "" || !note().includes("held no")) { restore(); return "setting off: it goes on: " + note(); }
restore();

// No connection at all, by the browser's own event.
await again();
await cdp("Network.enable");
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
const off = [held(), says("a"), note().includes("held yes")];
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
if (off[0] !== "No connection: waiting." || off[1] !== "Waiting for a connection, 20.5 MB of 41 MB" || !off[2]) return "offline: " + off.join();
if (held() !== "" || says("a") !== "50%, 20.5 MB of 41 MB") return "back online: " + says("a");

// The device's own room, where it says.
const realEstimate = StorageManager.prototype.estimate;
StorageManager.prototype.estimate = () => Promise.resolve({ quota: 5000000000, usage: 1000000000 });
await again();
StorageManager.prototype.estimate = realEstimate;
if (free()?.textContent !== "4 GB free for this app") return "room left: " + free()?.textContent;
StorageManager.prototype.estimate = () => Promise.reject(new DOMException("no", "SecurityError"));
await again();
StorageManager.prototype.estimate = realEstimate;
if (free()) return "refused: no line: " + free().textContent;
const hadStorage = Object.getOwnPropertyDescriptor(Navigator.prototype, "storage");
Object.defineProperty(Navigator.prototype, "storage", { configurable: true, get: () => undefined });
await again();
Object.defineProperty(Navigator.prototype, "storage", hadStorage);
if (free()) return "not there: no line: " + free().textContent;
if (used() !== "371.5 MB used of 5 GB") return "and the rest stands: " + used();

// Wide: the storage beside the list.
const cols = getComputedStyle($(".ui-dlist-in")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
if (device === "tablet" && $(".ui-dlist-side").getBoundingClientRect().left < $(".ui-dlist-main").getBoundingClientRect().right) return "beside it";

// A turn keeps what was pressed; nothing at all says so.
await tap(btn("a", "Pause"));
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(250);
const kept = says("a");
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (kept !== "Paused, 20.5 MB of 41 MB") return "turned: " + kept;
if ($("#dlist-demo-none .ui-dlist-empty").textContent !== "Nothing downloaded yet.") return "empty: it says so";
