// mobile
const key_ = "ui-offline-queue:offq-demo";
const box = $("#offq-demo"), text = $("#offq-demo-text"), add = $("#offq-demo-add");
const rows = () => [...box.querySelectorAll(".ui-offq-row")].map((r) => r.querySelector(".ui-offq-name").textContent + ":" + r.dataset.status);
const word = (i) => box.querySelectorAll(".ui-offq-row")[i].querySelector(".ui-offq-state").textContent;
const said = () => box.querySelector(".ui-offq-said").textContent;
const lasts = () => box.querySelector(".ui-offq-lasts").textContent;
const pill = () => box.querySelector(".ui-offq-net").textContent;
const took = () => $("#offq-demo-took").textContent;
const btn = (name) => box.querySelector(`[aria-label="${name}"]`);
const stored = () => JSON.parse(localStorage.getItem(key_) ?? "[]").map((a) => a.id + ":" + a.status).join(" ");
const doit = async (t) => { type(text, t); await wait(60); await tap(add); };
const net = async (offline) => { await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(150); };
const frame = async () => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
    f.src = "/?only=offline_queue";
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(900);
    return f;
};
if (said() !== "Nothing is waiting.") return "starts empty: " + said();
if (pill() !== "Online") return "the pill: " + pill();
if (lasts() !== "Kept in this browser through a reload. Clearing its data loses them.") return "it says what lasts: " + lasts();

// Offline for real: nothing goes, in the order made.
await net(true);
try {
    if (pill() !== "Offline") return "offline shows: " + pill();
    await doit("Alpha"); await doit("Beta"); await doit("Gamma");
    if (rows().join() !== "Alpha:pending,Beta:pending,Gamma:pending") return "three wait: " + rows();
    if (word(0) !== "Waiting" || word(2) !== "Waiting") return "they say waiting: " + word(0);
    if (said() !== "You are offline. 3 actions will go in order when you are back.") return "the summary: " + said();
    if (took() !== "The server has taken nothing yet.") return "nothing went: " + took();
    if (stored() !== "demo-1:pending demo-2:pending demo-3:pending") return "each is stored at once: " + stored();
} finally { await net(false); }
// One at a time: the first is on its way and the others are not, with 90 ms for each.
await wait(0);
const part = rows().join();
if (part.split(",").filter((r) => r.endsWith(":sending")).length > 1) return "two at once: " + part;
await wait(600);
if (took() !== "The server took: Alpha, Beta, Gamma.") return "in order on return: " + took();
if (rows().join() !== "Alpha:sent,Beta:sent,Gamma:sent") return "all sent: " + rows();
if (said() !== "Everything has been sent.") return "the summary: " + said();
if (stored() !== "") return "nothing stays stored: " + stored();
if (box.querySelectorAll(".ui-offq-row .ui-offq-btn").length !== 0) return "a sent row has no buttons";

// A refusal: the reason shows, and what comes after it waits.
await tap($("#offq-demo-off"));
if (pill() !== "Offline") return "the online prop: " + pill();
await doit("refuse this"); await doit("Delta"); await doit("Epsilon");
await tap($("#offq-demo-off"));
await wait(350);
if (rows().slice(3).join() !== "refuse this:failed,Delta:pending,Epsilon:pending") return "a refusal holds the rest: " + rows();
if (word(3) !== "That room has just been taken.") return "the reason: " + word(3);
if (word(4) !== "Held until the one before it goes") return "held: " + word(4);
if (said() !== "refuse this did not go, so 2 actions after it are held.") return "the summary: " + said();
if (took() !== "The server took: Alpha, Beta, Gamma.") return "nothing passed it: " + took();
if (stored() !== "demo-4:failed demo-5:pending demo-6:pending") return "stored with its state: " + stored();
// Retry at its own place, failing again; a real tap.
await tap(btn("Retry refuse this")); await wait(250);
if (rows()[3] !== "refuse this:failed") return "a retry that fails again: " + rows();
if (took() !== "The server took: Alpha, Beta, Gamma.") return "still nothing passed it: " + took();
// Removing it lets the rest go, in order.
await tap(btn("Remove refuse this")); await wait(450);
if (took() !== "The server took: Alpha, Beta, Gamma, Delta, Epsilon.") return "the rest go: " + took();
if (rows().join().includes("refuse")) return "it is gone: " + rows();

// Not reached: tried again when the connection returns, with no Retry pressed.
await doit("lost one"); await wait(250);
const lost = () => box.querySelector('.ui-offq-row:last-child');
if (lost().dataset.status !== "failed" || lost().querySelector(".ui-offq-state").textContent !== "Could not reach the server.") return "not reached: " + rows();
await net(true);
await net(false);
await wait(50);
await wait(250);
if (lost().dataset.status !== "failed") return "it tried and failed again: " + rows();
await tap(btn("Remove lost one"));

// An answer that never comes, and a `send` that throws, end as failures and stop nothing.
await doit("hang on"); await wait(800);
if (lost().dataset.status !== "failed" || lost().querySelector(".ui-offq-state").textContent !== "Could not reach the server.") return "no answer: " + rows();
await tap(btn("Remove hang on"));
await doit("throw it"); await wait(250);
if (lost().dataset.status !== "failed") return "a throw: " + rows();
await tap(btn("Remove throw it"));
if (rows().join().includes("throw") || rows().join().includes("hang")) return "they went: " + rows();

// keep_order off: the rest go past a failure. Two failures get a Retry all.
await tap($("#offq-demo-strict"));
await tap($("#offq-demo-off"));
await doit("refuse one"); await doit("refuse two"); await doit("Theta");
await tap($("#offq-demo-off"));
await wait(450);
if (!took().endsWith(", Theta.")) return "it went past the failures: " + took();
if (rows().filter((r) => r.endsWith(":failed")).length !== 2) return "two failed: " + rows();
if (said() !== "2 actions did not go.") return "the summary: " + said();
const all_ = [...box.querySelectorAll(".ui-offq-btn")].find((b) => b.textContent === "Retry all");
await tap(all_); await wait(350);
if (rows().filter((r) => r.endsWith(":failed")).length !== 2) return "Retry all tried and failed again: " + rows();
await tap(btn("Remove refuse one")); await tap(btn("Remove refuse two"));
await tap($("#offq-demo-strict"));
await tap([...box.querySelectorAll(".ui-offq-btn")].find((b) => b.textContent === "Clear sent"));
if (rows().length !== 0) return "Clear sent: " + rows();
if (said() !== "Nothing is waiting.") return "empty again: " + said();

// What a program keeps: a refusal stays one, what was on its way goes back, what was sent is gone.
const kept = $("#offq-demo-kept");
const krows = () => [...kept.querySelectorAll(".ui-offq-row")].map((r) => r.dataset.id + ":" + r.dataset.status).join(" ");
if (krows() !== "k1:failed k2:pending") return "restored: " + krows();
if (kept.querySelector(".ui-offq-state").textContent !== "Card declined.") return "its reason came back";
if (kept.querySelector(".ui-offq-lasts").textContent !== "Kept by this program, even if this page closes.") return "kept by the program: " + kept.querySelector(".ui-offq-lasts").textContent;
if (localStorage.getItem("ui-offline-queue:offq-demo-kept") !== null) return "saved leaves localStorage alone";
await tap(kept.querySelector('[aria-label="Remove Pay deposit"]'));
if ($("#offq-demo-kept-said").textContent !== "Would keep: k2 pending.") return "on_change: " + $("#offq-demo-kept-said").textContent;

// A reload. Made in one page that then goes at once, with no goodbye, and the next finds them.
let f = await frame();
const inside = (s) => f.contentDocument.querySelector(s);
inside("#offq-demo-off").click(); await wait(80);
const fi = inside("#offq-demo-text");
fi.value = "Zeta"; fi.dispatchEvent(new f.contentWindow.Event("input", { bubbles: true })); await wait(60);
inside("#offq-demo-add").click(); await wait(120);
const seen = inside("#offq-demo .ui-offq-said").textContent;
f.remove();
if (!(localStorage.getItem(key_) ?? "").includes('"Zeta"')) return "it was stored before the page went: " + seen + " " + localStorage.getItem(key_);
f = await frame();
await wait(400);
if (inside("#offq-demo-took").textContent !== "The server took: Zeta.") return "restored and sent after a reload: " + inside("#offq-demo-took").textContent;
f.remove();
// One on its way when the app died goes again; ones refused stay; bad data does no harm.
localStorage.setItem(key_, JSON.stringify([{ id: "a", title: "Was going", status: "sending", tries: 1 }, { id: "b", title: "refuse me", status: "failed", why: "No." }, { id: "c", title: "After", status: "pending" }]));
f = await frame();
await wait(300);
if (inside("#offq-demo-took").textContent !== "The server took: Was going.") return "a send cut short goes again: " + inside("#offq-demo-took").textContent;
const fr = [...f.contentDocument.querySelectorAll("#offq-demo .ui-offq-row")].map((r) => r.dataset.id + ":" + r.dataset.status).join(" ");
if (fr !== "a:sent b:failed c:pending") return "and the rest stand: " + fr;
f.remove();
localStorage.setItem(key_, "{not json");
f = await frame();
if (inside("#offq-demo .ui-offq-said").textContent !== "Nothing is waiting.") return "bad data: " + inside("#offq-demo .ui-offq-said").textContent;
f.remove();
localStorage.removeItem(key_);

// In a phone app: quilloNative is put on the page before it starts, and it says what lasts.
const add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = {};" });
f = await frame();
const inApp = inside("#offq-demo .ui-offq-lasts").textContent, inAppKept = inside("#offq-demo-kept .ui-offq-lasts").textContent;
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
localStorage.removeItem(key_);
if (inApp !== "Kept until the app closes. What is still here then is lost.") return "in an app without saved: " + inApp;
if (inAppKept !== "Kept on this phone, even if the app closes.") return "in an app with saved: " + inAppKept;
