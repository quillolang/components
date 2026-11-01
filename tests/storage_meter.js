// mobile
const box = $("#stormeter-demo");
const MB = 1048576;
const part = (id) => box.querySelector(`.ui-stormeter-part[data-id="${id}"]`);
const bytes = (id) => part(id)?.querySelector(".ui-stormeter-bytes").textContent;
const clearBtn = (id) => part(id)?.querySelector(`[aria-label^="Clear"]`);
const total = () => box.querySelector(".ui-stormeter-total").textContent;
const of_ = () => box.querySelector(".ui-stormeter-of")?.textContent;
const said = () => box.querySelector(".ui-stormeter-said").textContent;
const where = () => box.querySelector(".ui-stormeter-where").textContent;
const again = () => [...box.querySelectorAll(".ui-stormeter-btn")].find((b) => b.textContent === "Measure again");
const ask = (id) => part(id).querySelector(".ui-stormeter-ask");
const askBtn = (id, t) => [...part(id).querySelectorAll(".ui-stormeter-ask button")].find((b) => b.textContent === t);
const proto = StorageManager.prototype, real = proto.estimate;
const stub = (v) => { proto.estimate = v; };
const dbs = async () => (await indexedDB.databases()).map((d) => d.name);
const mkdb = (n) => new Promise((ok) => { const r = indexedDB.open(n, 1); r.onsuccess = () => { r.result.close(); ok(); }; });

// The real thing: it starts by itself, from a real estimate.
if (total() === "Measuring…") return "it measured on start";
if (!/^used, of about [\d.]+ [KMG]B this browser allows$/.test(of_() ?? "")) return "the quota: " + of_();
if (!part("local") || !part("cache") || !part("indexeddb") || !part("photos")) return "the kinds: " + box.textContent;

// Known numbers from then on, with a stand-in for what the browser estimates.
localStorage.clear();
localStorage.setItem("abcd", "x".repeat(996));      // 1000 characters, 2000 bytes
localStorage.setItem("ui-draft-keeper:note", "kept"); // 24 characters, 48 bytes, never cleared
stub(async () => ({ usage: 4 * MB, quota: 1073741824, usageDetails: { caches: 2 * MB, indexedDB: MB } }));
await tap(again()); await wait(100);
if (bytes("local") !== "2 KB") return "localStorage is measured: " + bytes("local");
if (bytes("cache") !== "2 MB" || bytes("indexeddb") !== "1 MB") return "kinds from the estimate: " + bytes("cache") + " " + bytes("indexeddb");
if (bytes("other") !== "1 MB") return "what is left over: " + bytes("other");
if (bytes("photos") !== "50 MB") return "the program's kind: " + bytes("photos");
// 4 MB + 2048 bytes + 50 MB = 54.00195 MB
if (total() !== "54 MB") return "the total: " + total();
if (of_() !== "used, of about 1 GB this browser allows") return "the quota: " + of_();
const seg = (id) => parseFloat(box.querySelector(`.ui-stormeter-seg[data-id="${id}"]`).style.width);
const whole = 4 * MB + 2048 + 50 * MB;
if (Math.abs(seg("photos") - Math.round(50 * MB * 1000 / whole) / 10) > 0.001) return "the bar's share: " + seg("photos");
if (where() !== "Sizes are the browser's estimates, rounded on purpose.") return "where: " + where();
if (clearBtn("other")) return "what cannot be cleared has no button";
if (!clearBtn("local") || !clearBtn("cache") || !clearBtn("indexeddb") || !clearBtn("photos")) return "each can be cleared";

// The question: focus on the safe answer, says what goes, and Keep it changes nothing.
await tap(clearBtn("local")); await wait(50);
if (!ask("local")) return "it asks first";
if (localStorage.getItem("abcd") === null) return "nothing goes before the answer";
if (ask("local").querySelector(".ui-stormeter-q").textContent !== "Clear 2 KB of Settings kept here?") return "the question: " + ask("local").querySelector(".ui-stormeter-q").textContent;
if (ask("local").querySelector(".ui-stormeter-warn").textContent !== "This removes settings kept in this browser. Unsent drafts and queues stay.") return "the warning";
if (!askBtn("local", "Keep it").isSameNode(document.activeElement)) return "focus is on the safe answer";
if (clearBtn("local").getAttribute("aria-expanded") !== "true") return "aria-expanded";
await tap(askBtn("local", "Keep it"));
if (ask("local") || localStorage.getItem("abcd") === null) return "Keep it keeps it";
// Clear it: the rest goes, unsent work stays.
await tap(clearBtn("local"));
await tap(askBtn("local", "Clear it")); await wait(100);
if (localStorage.getItem("abcd") !== null) return "it cleared nothing";
if (localStorage.getItem("ui-draft-keeper:note") !== "kept") return "a draft was cleared";
if (said() !== "Cleared 2 KB of Settings kept here.") return "says so: " + said();
if (bytes("local") !== "48 B") return "measured again: " + bytes("local");
if ($("#stormeter-told").textContent !== "Cleared local, 2048 bytes.") return "on_cleared: " + $("#stormeter-told").textContent;

// Cached files, for real.
const c = await caches.open("t-demo");
await c.put("/t.txt", new Response("hello"));
await tap(clearBtn("cache"));
await tap(askBtn("cache", "Clear it")); await wait(200);
if ((await caches.keys()).length !== 0) return "caches left: " + (await caches.keys());
// Offline data, for real, with a kept name left alone.
await mkdb("t-demo-db"); await mkdb("ui-pending-uploads-test");
await tap(clearBtn("indexeddb"));
await tap(askBtn("indexeddb", "Clear it")); await wait(300);
const left = await dbs();
if (left.includes("t-demo-db")) return "a database stayed: " + left;
if (!left.includes("ui-pending-uploads-test")) return "unsent uploads were cleared: " + left;
indexedDB.deleteDatabase("ui-pending-uploads-test");

// The program's own: refused, then done.
await tap($("#stormeter-refuse"));
await tap(clearBtn("photos"));
if (ask("photos").querySelector(".ui-stormeter-warn").textContent !== "They come back from the server when you are online.") return "its own warning";
await tap(askBtn("photos", "Clear it")); await wait(150);
if (said() !== "Photos could not be cleared." || !box.querySelector(".ui-stormeter-said").hasAttribute("data-bad")) return "a refusal: " + said();
if (bytes("photos") !== "50 MB") return "a refusal changes nothing";
await tap($("#stormeter-refuse"));
await tap(clearBtn("photos"));
await tap(askBtn("photos", "Clear it")); await wait(150);
if (bytes("photos") !== "0 B" || said() !== "Cleared 50 MB of Photos.") return "cleared: " + bytes("photos") + " " + said();
if ($("#stormeter-told").textContent !== "Cleared photos, 52428800 bytes.") return "on_cleared: " + $("#stormeter-told").textContent;

// Safari's kind of answer: a total and no kinds.
stub(async () => ({ usage: 3 * MB, quota: 2 * 1073741824 }));
await tap(again()); await wait(100);
if (bytes("cache") !== "Size not given" || bytes("indexeddb") !== "Size not given") return "no kinds: " + bytes("cache");
if (part("other")) return "no leftover without kinds";
if (total() !== "3 MB") return "the total: " + total();
if (where() !== "This browser gives one total, so each kind says no size.") return "where: " + where();
if (!clearBtn("cache")) return "it can still be cleared";
// A refusal, then no API at all: what could be measured stays, and it says so.
stub(async () => { throw new Error("no"); });
await tap(again()); await wait(100);
if (part("cache")) return "no estimate, no cache row";
if (where() !== "This browser does not say how much space is used, so this shows what could be measured.") return "where: " + where();
stub(undefined);
await tap(again()); await wait(100);
if (where() !== "This browser does not say how much space is used, so this shows what could be measured.") return "no api: " + where();
if (bytes("local") !== "48 B") return "what can be measured still is: " + bytes("local");
if (of_()) return "no quota to show";
stub(real);
localStorage.removeItem("ui-draft-keeper:note");

// Side by side where there is room.
const sum = box.querySelector(".ui-stormeter-sum").getBoundingClientRect(), list = box.querySelector(".ui-stormeter-list").getBoundingClientRect();
if (device === "tablet" ? list.left < sum.right - 1 : list.top < sum.bottom - 1) return "layout on a " + device;

// In a phone app, the sum is said to be partial.
const add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = {};" });
const f = document.createElement("iframe");
f.src = "/?only=storage_meter"; f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
document.body.append(f);
await new Promise((r) => (f.onload = r));
await wait(900);
const inApp = f.contentDocument.querySelector("#stormeter-demo .ui-stormeter-where").textContent;
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
if (inApp !== "The web view's storage starts empty each time the app opens.") return "in an app: " + inApp;
