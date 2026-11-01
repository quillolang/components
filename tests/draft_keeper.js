// mobile
const slot = "ui-draft-keeper:dkeep-demo";
const box = $("#dkeep-demo");
const title = $("#dkeep-demo-title"), body = $("#dkeep-demo-body"), ref = $("#dkeep-demo-ref");
const send = box.querySelector('button[type="submit"]');
const note = (b = box) => b.querySelector(".ui-dkeep-note").textContent;
const lasts = (b = box) => b.querySelector(".ui-dkeep-lasts").textContent;
const held = () => JSON.parse(localStorage.getItem(slot) ?? "null");
const frame = async () => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
    f.src = "/?only=draft_keeper";
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(900);
    return f;
};
localStorage.removeItem(slot);
if (lasts() !== "Your draft stays in this browser, on this device only.") return "it says what lasts: " + lasts();
if (box.querySelector(".ui-dkeep-offer")) return "no offer with nothing kept";
const size = parseFloat(getComputedStyle(body).fontSize);
if (size < 16) return "iOS zooms under 16 px: " + size;
// Each character is down at once, and secrets never are.
type(title, "Broken lift"); type(ref, "S3CRET"); type(body, "Stuck between floors");
await wait(0);
if (held()?.values?.body !== "Stuck between floors" || held().values.title !== "Broken lift") return "written on each change: " + JSON.stringify(held());
if (localStorage.getItem(slot).includes("S3CRET")) return "a secret field was written down";
if (held().v !== 1 || typeof held().at !== "number") return "the format: " + localStorage.getItem(slot);

// A crash: the page goes in the same moment as the last characters, with no goodbye.
let f = await frame();
const inside = (s) => f.contentDocument.querySelector(s);
const fType = (el, t) => { el.value = t; el.dispatchEvent(new f.contentWindow.Event("input", { bubbles: true })); };
if (inside("#dkeep-demo .ui-dkeep-offer-title").textContent !== "You have an unsent draft from a moment ago.") return "offered: " + inside("#dkeep-demo .ui-dkeep-offer-title").textContent;
if (inside("#dkeep-demo .ui-dkeep-preview").textContent !== "Broken lift") return "preview: " + inside("#dkeep-demo .ui-dkeep-preview").textContent;
if (inside("#dkeep-demo-body").value !== "") return "it is offered, not forced in: " + inside("#dkeep-demo-body").value;
// Typing before choosing does not overwrite it.
fType(inside("#dkeep-demo-body"), "Z"); await wait(30);
if (held().values.body !== "Stuck between floors") return "typing before the choice overwrote it: " + held().values.body;
fType(inside("#dkeep-demo-body"), "more");
f.remove();
if (held().values.body !== "Stuck between floors") return "and it survives another crash";
f = await frame();
const put = [...f.contentDocument.querySelectorAll("#dkeep-demo .ui-dkeep-btn")].find((b) => b.textContent === "Put it back");
put.click(); await wait(100);
if (inside("#dkeep-demo-body").value !== "Stuck between floors" || inside("#dkeep-demo-title").value !== "Broken lift") return "put back: " + inside("#dkeep-demo-body").value;
if (inside("#dkeep-demo .ui-dkeep-offer")) return "the offer goes";
if (inside("#dkeep-demo .ui-dkeep-note").textContent !== "Your draft is back.") return "says so: " + inside("#dkeep-demo .ui-dkeep-note").textContent;
if (!inside("#dkeep-demo .ui-dkeep-note").isSameNode(f.contentDocument.activeElement)) return "focus stays near, with no keyboard";
fType(inside("#dkeep-demo-body"), "Stuck between floors, third time"); await wait(0);
f.remove();
if (held().values.body !== "Stuck between floors, third time") return "kept after being put back: " + held().values.body;
// Discard.
f = await frame();
[...f.contentDocument.querySelectorAll("#dkeep-demo .ui-dkeep-btn")].find((b) => b.textContent === "Discard").click(); await wait(100);
if (localStorage.getItem(slot) !== null) return "discard clears it: " + localStorage.getItem(slot);
if (inside("#dkeep-demo .ui-dkeep-note").textContent !== "Draft discarded.") return "says so";
f.remove();
// An old draft and a bad one: dropped, and said so.
localStorage.setItem(slot, JSON.stringify({ v: 1, at: Date.now() - 31 * 86400000, values: { body: "Very old" } }));
f = await frame();
if (inside("#dkeep-demo .ui-dkeep-offer") || inside("#dkeep-demo .ui-dkeep-note").textContent !== "An old draft was past keeping, so it was cleared.") return "too old: " + inside("#dkeep-demo .ui-dkeep-note").textContent;
if (localStorage.getItem(slot) !== null) return "too old is cleared";
f.remove();
localStorage.setItem(slot, "{broken");
f = await frame();
if (inside("#dkeep-demo .ui-dkeep-note").textContent !== "A saved draft could not be read, so it was cleared.") return "bad: " + inside("#dkeep-demo .ui-dkeep-note").textContent;
f.remove();
localStorage.setItem(slot, JSON.stringify({ v: 1, at: Date.now() - 2 * 3600000, values: { body: "  ".padEnd(90, "ab"), title: "" } }));
f = await frame();
if (inside("#dkeep-demo .ui-dkeep-offer-title").textContent !== "You have an unsent draft from 2 h ago.") return "its age: " + inside("#dkeep-demo .ui-dkeep-offer-title").textContent;
if (inside("#dkeep-demo .ui-dkeep-preview").textContent !== "ab".repeat(40) + "…") return "the preview is cut: " + inside("#dkeep-demo .ui-dkeep-preview").textContent;
f.remove();
localStorage.removeItem(slot);

// Send. On the page itself: what is needed first, then a failure keeps it, then it clears.
type(title, ""); type(body, ""); await wait(50);
await tap(send);
if (note() !== "Title is needed before this can go.") return "required: " + note();
if (title.getAttribute("aria-invalid") !== "true" || !title.isSameNode(document.activeElement)) return "the field is marked and focused";
type(title, "Broken lift"); type(body, "Stuck"); await wait(50);
await tap($("#dkeep-refuse"));
await tap(send); await wait(150);
if (note() !== "Not sent: The line dropped. Your draft is kept.") return "failed send: " + note();
if (body.value !== "Stuck" || held()?.values?.body !== "Stuck") return "a failed send keeps it";
await tap($("#dkeep-refuse"));
await tap(send); await wait(150);
if ($("#dkeep-sent").textContent !== "Sent: Broken lift: Stuck") return "sent: " + $("#dkeep-sent").textContent;
if (body.value !== "" || title.value !== "") return "the form is empty after sending";
if (localStorage.getItem(slot) !== null) return "sending clears the draft: " + localStorage.getItem(slot);
if (note() !== "Sent. Your draft is cleared.") return "says so: " + note();
// Two taps in a row send once: the second waits on the button's `sending`.
type(title, "T"); type(body, "B"); await wait(50);
send.click(); send.click(); await wait(250);
if ($("#dkeep-sent").textContent !== "Sent: T: B") return "double send: " + $("#dkeep-sent").textContent;

// A draft held by the program: offered, on_save reports, localStorage is left alone.
const kept = $("#dkeep-kept"), told = () => $("#dkeep-told").textContent, area = $("#dkeep-kept-text");
if (lasts(kept) !== "Your draft is kept by this program.") return "kept: " + lasts(kept);
if (kept.querySelector(".ui-dkeep-preview").textContent !== "From the app's own database") return "saved is offered";
await tap([...kept.querySelectorAll(".ui-dkeep-btn")].find((b) => b.textContent === "Put it back"));
await wait(500);
if (area.value !== "From the app's own database") return "put back from saved: " + area.value;
if (told() !== "on_save: From the app's own database") return "on_save after putting back: " + told();
type(area, "Typed on"); type(area, "Typed on and on");
await wait(0);
if (told() === "on_save: Typed on") return "on_save waits for a pause in the typing";
await wait(500);
if (told() !== "on_save: Typed on and on") return "on_save: " + told();
if (localStorage.getItem("ui-draft-keeper:dkeep-kept") !== null) return "saved leaves localStorage alone";
// Going to the background hands over what is waiting at once.
type(area, "Before the home button");
const t = await cdp("Target.createTarget", { url: "about:blank" });
await wait(60);
const whileAway = told();
await cdp("Target.closeTarget", { targetId: t.targetId });
await wait(100);
if (document.visibilityState !== "visible") return "the test did not get its tab back";
if (whileAway !== "on_save: Before the home button") return "hidden, it hands over at once: " + whileAway;
// The program saying no is shown.
await tap($("#dkeep-hold"));
type(area, "Nowhere to go"); await wait(700);
if (note(kept) !== "Your draft could not be kept. It is safe on this page until you leave it.") return "keeping failed: " + note(kept);

// In a phone app.
const add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = {};" });
f = await frame();
const inApp = inside("#dkeep-demo .ui-dkeep-lasts").textContent, inAppKept = inside("#dkeep-kept .ui-dkeep-lasts").textContent;
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
if (inApp !== "Your draft lasts until the app closes.") return "in an app without saved: " + inApp;
if (inAppKept !== "Your draft stays on this phone, even if the app closes.") return "in an app with saved: " + inAppKept;
