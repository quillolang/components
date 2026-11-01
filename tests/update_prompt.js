// mobile
const until = async (test, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (test()) return true; await wait(15); } return false; };
const frame = async (src = "/?only=update_prompt") => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
    f.src = src;
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(900);
    return f;
};
const prompt = () => $("#upgp-demo");
const btn = (t, box = prompt()) => [...(box?.querySelectorAll(".ui-upgp-btn") ?? [])].find((b) => b.textContent === t);
const plain = $("#upgp-plain");
const looks = () => parseInt($("#upgp-looks").textContent.match(/\d+/)[0]);

// Nothing new: it looks, and says nothing. Its own page reads the same: no false alarm.
await until(() => looks() >= 2, 1500);
if (looks() < 2) return "it looks by itself: " + looks();
if (prompt()) return "no new version, no prompt";
await wait(1200);
if ($("#upgp-own")) return "the page's own scripts have not moved, yet it says so";

// A new one, while a field has focus: not now.
plain.focus();
await tap($("#upgp-publish"));
await wait(100);
plain.focus();
await wait(900);
if (prompt()) return "it interrupted a field in focus";
plain.blur();
// Typing just now: it waits out quiet_ms, then shows.
document.dispatchEvent(new Event("keydown"));
await wait(150);
if (prompt()) return "it came straight after a key";
if (!(await until(() => prompt(), 1500))) return "it should come once things are quiet";
if (prompt().querySelector(".ui-upgp-title").textContent !== "A new version is ready") return "title";
if (prompt().querySelector(".ui-upgp-text").textContent !== "Reload to get it. What you typed stays.") return "text";
if (document.activeElement && document.activeElement.closest?.("#upgp-demo")) return "it took the focus";
if (Math.abs(prompt().getBoundingClientRect().bottom - innerHeight) > 16) return "it sits at the bottom: " + prompt().getBoundingClientRect().bottom;
// Focus goes to a field: it steps aside so as not to cover what is being typed.
plain.focus();
if (!(await until(() => !prompt(), 800))) return "it should leave a person who starts typing";
plain.blur();
await until(() => prompt(), 1500);
if (!prompt()) return "back again";
// An open dialog holds it back, and a finger held down.
const dlg = document.createElement("dialog"); document.body.append(dlg); dlg.show();
if (!(await until(() => !prompt(), 800))) return "a dialog holds it";
dlg.close(); dlg.remove();
await until(() => prompt(), 1500);
const hold_ = hold($("#upgp-looks"), 900);
await wait(500);
const heldGone = !prompt();
await hold_;
if (!heldGone) return "a finger held down holds it";
await until(() => prompt(), 1500);
// Later: gone for later_ms, then back.
await tap(btn("Later"));
if (prompt()) return "Later hides it";
await wait(300);
if (prompt()) return "Later holds";
if (!(await until(() => prompt(), 1500))) return "Later comes back";

// The real reload, in a page of its own, with real fields.
let f = await frame();
const inside = (s) => f.contentDocument.querySelector(s);
const typeIn = (el, t) => { el.value = t; el.dispatchEvent(new f.contentWindow.Event("input", { bubbles: true })); el.dispatchEvent(new f.contentWindow.Event("change", { bubbles: true })); };
typeIn(inside("#upgp-plain"), "typed plain");
typeIn(inside("#upgp-bound"), "typed bound");
typeIn(inside("#upgp-notes"), "typed\nnotes");
typeIn(inside("#upgp-pass"), "hunter2");
typeIn(inside("#upgp-card"), "4242424242424242");
await wait(50);
if (inside("#upgp-bound-says").textContent !== "State holds: typed bound.") return "bound state";
inside("#upgp-publish").click();
if (!(await until(() => inside("#upgp-demo"), 2500))) return "the prompt in the frame";
const loaded = new Promise((r) => (f.onload = r));
[...f.contentDocument.querySelectorAll("#upgp-demo .ui-upgp-btn")].find((b) => b.textContent === "Reload").click();
await wait(0);
await loaded;
await wait(900);
if (inside("#upgp-plain").value !== "typed plain") return "plain after reload: " + inside("#upgp-plain").value;
if (inside("#upgp-bound").value !== "typed bound") return "bound after reload: " + inside("#upgp-bound").value;
if (inside("#upgp-notes").value !== "typed\nnotes") return "notes after reload: " + inside("#upgp-notes").value;
if (inside("#upgp-bound-says").textContent !== "State holds: typed bound.") return "state after reload: " + inside("#upgp-bound-says").textContent;
if (inside("#upgp-pass").value !== "") return "a password came back";
if (inside("#upgp-card").value !== "") return "a card number came back";
const left = f.contentWindow.sessionStorage.getItem("ui-update-prompt");
if (left !== null) return "the snapshot stays: " + left;
f.remove();

// Its own page, when the program has changed: the fetch brings another script address.
const realFetch = window.fetch;
window.fetch = async (u, o) => {
    const r = await realFetch(u, o);
    const t = await r.text();
    return new Response(t.replace(/\/_quillo\/b\/[0-9a-f]+\.js/g, "/_quillo/b/feedfacefeedface.js"), { status: 200 });
};
const own = await until(() => $("#upgp-own"), 2500);
window.fetch = realFetch;
if (!own) return "it should see its own page has moved";
await wait(260);
if ($("#upgp-own .ui-upgp-title").textContent !== "This page has changed") return "the title prop";
if (Math.abs($("#upgp-own").getBoundingClientRect().top) > 16) return "place top: " + $("#upgp-own").getBoundingClientRect().top;

// A snapshot that cannot be written: says so, and a second press would go ahead.
const proto = Storage.prototype, setItem = proto.setItem;
proto.setItem = () => { throw new Error("full"); };
await until(() => prompt(), 1500);
let warned = "";
try {
    plain.value = "x";
    await tap(btn("Reload"));
    warned = prompt()?.querySelector(".ui-upgp-text").textContent;
} finally { proto.setItem = setItem; plain.value = ""; }
if (warned !== "What you typed here could not be kept. Send it first, or press Reload again to lose it.") return "a failed snapshot: " + warned;
await tap(btn("Later"));

// A phone app: nothing to reload, the store instead; and its own page is not read.
const add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = {};" });
f = await frame();
inside("#upgp-publish").click();
await until(() => inside("#upgp-demo"), 2500);
const inApp = inside("#upgp-demo")?.textContent ?? "";
const buttons = [...f.contentDocument.querySelectorAll("#upgp-demo .ui-upgp-btn")].map((b) => b.textContent).join();
[...f.contentDocument.querySelectorAll("#upgp-demo .ui-upgp-btn")].find((b) => b.textContent === "Open the store")?.click();
await wait(60);
const asked = inside("#upgp-store").textContent;
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
if (!inApp.includes("A new version is out") || !inApp.includes("Update this app from its store to get it.")) return "in an app: " + inApp;
if (buttons !== "Later,Open the store") return "in an app, no Reload: " + buttons;
if (asked !== "The store was asked for.") return "on_store: " + asked;
