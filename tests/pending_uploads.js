// mobile
const slot = "ui-pending-uploads:pendup-demo";
const box = $("#pendup-demo");
const row = (name) => box.querySelector(`.ui-pendup-row[data-name="${name}"]`);
const word = (name) => row(name)?.querySelector(".ui-pendup-word").textContent ?? "";
const status = (name) => row(name)?.dataset.status;
const btn = (name) => box.querySelector(`[aria-label="${name}"]`);
const log = () => $("#pendup-log").textContent;
const sum = () => box.querySelector(".ui-pendup-sum").textContent;
const gate = () => box.querySelector(".ui-pendup-gate-words")?.textContent ?? "";
const lasts = (b = box) => b.querySelector(".ui-pendup-lasts").textContent;
const said = () => box.querySelector(".ui-pendup-said").textContent;
const file = (name, size, at = 1000) => new File(["x".repeat(size)], name, { type: "text/plain", lastModified: at });
const pick = (input, files, W = window) => { const d = new W.DataTransfer(); for (const f of files) d.items.add(f); input.files = d.files; input.dispatchEvent(new W.Event("change", { bubbles: true })); };
const addInput = () => box.querySelector('.ui-pendup-foot input[type="file"]');
const net = async (offline) => { await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(150); };
const until = async (test, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (test()) return true; await wait(20); } return false; };
const frame = async () => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
    f.src = "/?only=pending_uploads";
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(1000);
    return f;
};
const clearDb = () => new Promise((ok) => { const r = indexedDB.deleteDatabase("ui-pending-uploads"); r.onsuccess = r.onerror = r.onblocked = () => ok(); });

if (sum() !== "No uploads") return "starts empty: " + sum();
if (lasts() !== "Uploads run only while this page is open. This list and its files stay in this browser through a reload, up to 100 MB each.") return "what lasts: " + lasts();
const input = addInput();
const r0 = input.getBoundingClientRect();
if (r0.width < 44 || r0.height < 44) return "the real field is what a finger presses: " + r0.width + "x" + r0.height;

// Two files: parts in order, file after file, each part once.
pick(input, [file("a.txt", 2500), file("b.txt", 700)]);
if (!(await until(() => box.querySelectorAll(".ui-pendup-row").length === 2))) return "two rows";
if (!(await until(() => sum() === "All sent"))) return "they finish: " + sum() + " " + log();
if (log() !== "a.txt 0-1024 (1024), a.txt 1024-2048 (1024), a.txt 2048-2500 last (452), b.txt 0-700 last (700)") return "the parts: " + log();
if (word("a.txt") !== "Sent" || row("a.txt").querySelector("[role=progressbar]").getAttribute("aria-valuenow") !== "100") return "a.txt is done: " + word("a.txt");
if (row("a.txt").querySelector(".ui-pendup-line span:last-child").textContent !== "2.4 KB of 2.4 KB") return "sizes: " + row("a.txt").querySelector(".ui-pendup-line span:last-child").textContent;
if (JSON.parse(localStorage.getItem(slot)).items.length !== 0) return "what went is not kept";
await tap([...box.querySelectorAll(".ui-pendup-btn")].find((b) => b.textContent === "Clear sent"));
if (sum() !== "No uploads") return "Clear sent: " + sum();

// Bad input: too large, twice, too many.
pick(input, [file("huge.bin", 20001)]);
await wait(100);
if (said() !== "huge.bin is larger than 19.5 KB." || box.querySelector(".ui-pendup-row")) return "too large: " + said();

// Pause: the next file goes on, and resume does not repeat a part.
await tap($("#pendup-slow"));
const mark = log();
pick(input, [file("c.txt", 2100), file("d.txt", 100)]);
if (!(await until(() => word("c.txt").startsWith("Sending")))) return "c starts";
await tap(btn("Pause c.txt"));
if (status("c.txt") !== "paused" || word("c.txt") !== "Paused") return "paused: " + status("c.txt");
if (!(await until(() => status("d.txt") === "done", 2500))) return "the next goes past a paused file: " + status("d.txt");
const sentC = (log().slice(mark.length).match(/c\.txt/g) ?? []).length;
if (sentC !== 1) return "the part on its way lands, and no more: " + log().slice(mark.length);
await tap($("#pendup-slow"));
await tap(btn("Resume c.txt"));
if (!(await until(() => status("c.txt") === "done"))) return "resumed: " + status("c.txt");
if (!log().endsWith("c.txt 0-1024 (1024), d.txt 0-100 last (100), c.txt 1024-2048 (1024), c.txt 2048-2100 last (52)")) return "from where it stopped: " + log();

// A server failure: stops the file, says why, Retry goes on from the last good part.
await tap([...box.querySelectorAll(".ui-pendup-btn")].find((b) => b.textContent === "Clear sent"));
await tap($("#pendup-refuse"));
pick(input, [file("e.txt", 1500)]);
if (!(await until(() => row("e.txt")?.dataset.status === "failed"))) return "it fails";
if (word("e.txt") !== "The server is busy.") return "why: " + word("e.txt");
await tap($("#pendup-refuse"));
await tap(btn("Retry e.txt"));
if (!(await until(() => status("e.txt") === "done"))) return "retry: " + status("e.txt");
await tap([...box.querySelectorAll(".ui-pendup-btn")].find((b) => b.textContent === "Clear sent"));

// The rule: on mobile data it holds, and says so; a person can override it.
const rule = box.querySelector('.ui-pendup-rule input');
await tap(box.querySelector(".ui-pendup-rule"));
if (!rule.checked || $("#pendup-rule-said").textContent !== "Wifi only is on.") return "the rule flips by a tap: " + $("#pendup-rule-said").textContent;
if (gate() !== "This device does not say what network it is on, so wifi only cannot be checked. Files wait until you say.") return "chrome says nothing: " + gate();
const mark2 = log();
pick(input, [file("f.txt", 1100)]);
await wait(300);
if (log() !== mark2 || word("f.txt") !== "Waiting for you to say") return "not known, it waits: " + word("f.txt");
await tap($("#pendup-cell"));
if (gate() !== "On mobile data, so uploads are waiting for wifi." || word("f.txt") !== "Waiting for wifi") return "mobile data: " + gate();
await tap($("#pendup-wifi"));
if (!(await until(() => status("f.txt") === "done"))) return "wifi lets it go: " + status("f.txt");
await tap($("#pendup-cell"));
pick(input, [file("g.txt", 1100)]);
await wait(250);
if (word("g.txt") !== "Waiting for wifi") return "held again: " + word("g.txt");
await tap([...box.querySelectorAll(".ui-pendup-gate button")].find((b) => b.textContent === "Send on mobile data"));
if (!(await until(() => status("g.txt") === "done"))) return "a person can say go: " + status("g.txt");
await tap(box.querySelector(".ui-pendup-rule"));
if (gate() !== "" || rule.checked) return "the rule off";
await tap([...box.querySelectorAll(".ui-pendup-btn")].find((b) => b.textContent === "Clear sent"));

// A connection lost: a part cut off is no failure. The file waits, and goes on by itself on return.
await tap($("#pendup-slow"));
pick(input, [file("h.txt", 1500)]);
if (!(await until(() => word("h.txt").startsWith("Sending")))) return "h starts";
await net(true);
try {
    if (gate() !== "You are offline. Uploads go on when you are back.") return "offline: " + gate();
    if (!(await until(() => status("h.txt") === "queued", 1500))) return "the file waits: " + status("h.txt");
    if (word("h.txt") !== "Waiting for a connection") return "it says so: " + word("h.txt");
    if (box.querySelector(".ui-pendup-gate button")) return "offline has nothing to override";
} finally { await net(false); await tap($("#pendup-slow")); }
if (!(await until(() => status("h.txt") === "done"))) return "it goes on return: " + status("h.txt");
await tap([...box.querySelectorAll(".ui-pendup-btn")].find((b) => b.textContent === "Clear sent"));

// Remove stops one that is waiting.
await tap($("#pendup-refuse"));
pick(input, [file("i.txt", 1500)]);
if (!(await until(() => row("i.txt")?.dataset.status === "failed"))) return "i fails";
await tap(btn("Remove i.txt"));
await tap($("#pendup-refuse"));
if (row("i.txt")) return "removed";

// A list the program kept: what was going is queued, then lost, since there is no file; rule from saved.
const kept = $("#pendup-kept");
const krow = kept.querySelector(".ui-pendup-row");
if (krow.dataset.status !== "lost") return "no file in this browser, so lost: " + krow.dataset.status;
if (krow.querySelector(".ui-pendup-word").textContent !== "Choose it again to go on from 34%") return "it says how: " + krow.querySelector(".ui-pendup-word").textContent;
if (kept.querySelector('.ui-pendup-rule input').checked) return "saved's rule wins over wifi_only";
const again = kept.querySelector('.ui-pendup-row input[type="file"]');
pick(again, [file("other.pdf", 3000, 5)]);
await wait(100);
if (kept.querySelector(".ui-pendup-said").textContent !== "That is not the same file as scan.pdf.") return "the wrong file: " + kept.querySelector(".ui-pendup-said").textContent;
const mark3 = log();
pick(kept.querySelector('.ui-pendup-row input[type="file"]'), [file("scan.pdf", 3000, 5)]);
if (!(await until(() => kept.querySelector(".ui-pendup-row").dataset.status === "done"))) return "the right file goes on: " + kept.querySelector(".ui-pendup-row").dataset.status;
if (log().slice(mark3.length) !== ", scan.pdf 1024-2048 (1024), scan.pdf 2048-3000 last (952)") return "from where it was: " + log().slice(mark3.length);
if ($("#pendup-kept-said").textContent !== "Would keep: false .") return "on_change at the end: " + $("#pendup-kept-said").textContent;
if (localStorage.getItem("ui-pending-uploads:pendup-kept") !== null) return "saved leaves localStorage alone";

// A reload, with a file part way: the list from localStorage, the file from IndexedDB.
let f = await frame();
const inside = (s) => f.contentDocument.querySelector(s);
const W = () => f.contentWindow;
inside("#pendup-slow").click(); await wait(60);
pick(inside('#pendup-demo .ui-pendup-foot input[type="file"]'), [new (W().File)(["y".repeat(2500)], "j.txt", { lastModified: 7 })], f.contentWindow);
const first = await until(() => (inside("#pendup-log").textContent.match(/j\.txt/g) ?? []).length >= 1, 2500);
await wait(30);
f.remove();
if (!first) return "j.txt did not start";
const st = JSON.parse(localStorage.getItem(slot));
if (st.items.length !== 1 || st.items[0].sent !== 1024 || st.items[0].status !== "sending") return "the place was kept: " + localStorage.getItem(slot);
f = await frame();
if (!(await until(() => inside('#pendup-demo .ui-pendup-sum').textContent === "All sent"))) return "resumed after a reload: " + inside('#pendup-demo').textContent;
if (inside("#pendup-log").textContent !== "j.txt 1024-2048 (1024), j.txt 2048-2500 last (452)") return "from the part it had reached: " + inside("#pendup-log").textContent;
f.remove();

// A list with its file gone from IndexedDB, as after clearing data: said so, not pretended.
localStorage.setItem(slot, JSON.stringify({ rule: true, items: [{ id: "k.txt:900:1", name: "k.txt", size: 900, type: "", modified: 1, sent: 0, status: "queued", kept: true }] }));
await clearDb();
f = await frame();
if (inside('#pendup-demo .ui-pendup-row').dataset.status !== "lost") return "a lost file: " + inside('#pendup-demo .ui-pendup-row').dataset.status;
if (inside('#pendup-demo .ui-pendup-word').textContent !== "Choose it again to send it") return "says so: " + inside('#pendup-demo .ui-pendup-word').textContent;
if (!inside('#pendup-demo .ui-pendup-rule input').checked) return "the rule came back";
f.remove();
// Bad data.
localStorage.setItem(slot, "[1,{}");
f = await frame();
if (inside('#pendup-demo .ui-pendup-sum').textContent !== "No uploads") return "bad data";
f.remove();
localStorage.removeItem(slot);

// The real network reading: mobile data, then wifi, as a stand-in the page reads before it starts.
let add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "{ const c = new EventTarget(); c.type = 'cellular'; Object.defineProperty(navigator, 'connection', { value: c, configurable: true }); window.__conn = c; }" });
f = await frame();
inside('#pendup-demo .ui-pendup-rule input').click(); await wait(100);
const heldWords = inside("#pendup-demo .ui-pendup-gate-words")?.textContent;
f.contentWindow.__conn.type = "wifi";
f.contentWindow.__conn.dispatchEvent(new f.contentWindow.Event("change"));
await wait(100);
const after = inside("#pendup-demo .ui-pendup-gate-words")?.textContent ?? "";
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
localStorage.removeItem(slot);
if (heldWords !== "On mobile data, so uploads are waiting for wifi.") return "navigator.connection: " + heldWords;
if (after !== "") return "wifi found: " + after;

// In a phone app: an honest line.
add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = {};" });
f = await frame();
const inApp = lasts(inside("#pendup-demo")), inAppKept = lasts(inside("#pendup-kept"));
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
localStorage.removeItem(slot);
await clearDb();
if (inApp !== "Uploads run only while this page is open. This list lasts until the app closes.") return "in an app: " + inApp;
if (inAppKept !== "Uploads run only while this page is open. If the app closes, this list comes back and you choose each file again.") return "in an app, kept: " + inAppKept;
