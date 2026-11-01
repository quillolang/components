// mobile
await wait(250);
const scr = (at) => $(`.ui-navstack-screen[data-at="${at}"]`);
const count = () => $$(".ui-navstack-screen").length;
const top = () => $(".ui-navstack-top");
const title = () => top().querySelector(".ui-navstack-title").textContent;
const note = () => $(".demo-note").textContent;
const body = (at) => scr(at).querySelector(".ui-navstack-body");
const rows = () => scr(0).querySelectorAll(".ui-navstack-demo-row");
const saved = () => history.state?.ui_nav_stack?.["nav-stack-demo"];
const slide = 450;
const r = $(".ui-navstack").getBoundingClientRect();
const row = (i) => { const el = rows()[i]; return el; };
const again = () => [...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Build it again");
const press = async (el) => { el.focus(); el.click(); await wait(slide); };

if (device === "tablet") {
    // The first screen is a column; opening goes beside it; another item takes its place.
    const c = scr(0).getBoundingClientRect();
    if (c.width !== 320 || scr(0).hasAttribute("inert")) return `column: ${c.width} ${scr(0).hasAttribute("inert")}`;
    if (getComputedStyle($(".ui-navstack-empty")).display === "none") return "nothing beside the column";
    await tap(row(0));
    await wait(slide);
    if (count() !== 2 || title() !== "Invoice for the site survey") return "open: " + title();
    if (scr(1).getBoundingClientRect().left !== c.right) return "not beside the column: " + scr(1).getBoundingClientRect().left;
    if (getComputedStyle(scr(0)).visibility !== "visible" || scr(0).hasAttribute("inert")) return "the column went";
    if (getComputedStyle(scr(1).querySelector(".ui-navstack-back")).display !== "none") return "a Back beside the column";
    if ($(".ui-navstack-empty")) return "the empty message stayed";
    const steps = history.length;
    await tap(row(2));
    await wait(slide);
    if (count() !== 2 || title() !== "Photos from the ridge") return "another item: " + title() + " " + count();
    if (history.length !== steps) return "another item took a step of history";
    if (saved().length !== 2 || saved()[1].mail !== 3) return "history's stack: " + JSON.stringify(saved());
    if (scr(0).querySelector("input") == null) return "the column was remade";
    // Deeper it is a stack, with its Back.
    await press([...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment")));
    if (count() !== 3 || title() !== "Attachment") return "deeper: " + title();
    if (getComputedStyle(scr(2).querySelector(".ui-navstack-back")).display === "none") return "no Back at the third";
    if (getComputedStyle(scr(0)).visibility !== "visible") return "the column left at the third";
    if (getComputedStyle(scr(1)).visibility !== "hidden") return "the second stayed visible";
    await press(scr(2).querySelector(".ui-navstack-back"));
    if (count() !== 2 || title() !== "Photos from the ridge") return "back: " + title();
    history.back();
    await wait(slide);
    if (count() !== 1) return "Back to the column alone: " + count();
    if (!$(".ui-navstack-empty")) return "the empty message did not return";
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    return;
}

// Phone: a stack.
if (count() !== 1 || title() !== "Inbox") return "start: " + title();
if (scr(0).querySelector(".ui-navstack-back")) return "a Back on the first screen";
if (saved()?.length !== 1) return "the first screen is not in the history: " + JSON.stringify(history.state);

// State below: typed text and scroll.
const field = scr(0).querySelector("input");
field.value = "kept";
body(0).scrollTop = 400;
const stepsAtRoot = history.length;

// Push: slides in from the right, a step of history, the focus on its title.
const row3 = [...rows()].find((b) => b.getBoundingClientRect().top > 100 && b.getBoundingClientRect().bottom < innerHeight - 20);
const subject = row3.firstChild.textContent;
await tap(row3);
const anim = scr(1).getAnimations().map((a) => a.animationName).join();
if (count() !== 2) return "push: " + count();
if (anim !== "ui-navstack-in" && anim !== "") return "animation: " + anim;
await wait(slide);
if (title() !== subject) return "pushed title: " + title();
if (history.length !== stepsAtRoot + 1) return "no step of history";
if (location.hash !== "#mail-1" && !/^#mail-\d+$/.test(location.hash)) return "the entry's path: " + location.hash;
if (saved().length !== 2 || saved()[1].name !== "mail") return "history's stack: " + JSON.stringify(saved());
if (document.activeElement !== scr(1).querySelector(".ui-navstack-title")) return "the focus went to " + document.activeElement.className;
if (getComputedStyle(scr(0)).visibility !== "hidden" || !scr(0).hasAttribute("inert")) return "the screen under is reachable";
if (!/Back to Inbox/.test(scr(1).querySelector(".ui-navstack-back").getAttribute("aria-label"))) return "back's name";
if (scr(1).querySelector(".ui-navstack-back span").textContent !== "Inbox") return "back's text";
if (!note().includes(", 2 deep")) return note();

// State on it, and a third.
const star = scr(1).querySelector(".ui-btn");
star.click();
await wait(40);
const attach = [...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment"));
attach.focus();
body(1).scrollTop = 300;
attach.click();
await wait(slide);
if (count() !== 3 || title() !== "Attachment") return "third: " + title();
if (!scr(2).textContent.includes(`from "${subject}"`)) return "entry's before: " + scr(2).textContent;

// Back with the button: the top slides off and goes, the focus returns to what opened it.
await tap(scr(2).querySelector(".ui-navstack-back"));
await wait(slide);
if (count() !== 2 || title() !== subject) return "back: " + title() + " " + count();
if (star.textContent.trim() !== "Starred 1" || !star.isConnected) return "state of the second screen: " + star.textContent;
if (body(1).scrollTop !== 300) return "scroll of the second: " + body(1).scrollTop;
if (!document.activeElement.textContent.includes("Attachment")) return "focus did not go back to the opener: " + document.activeElement.className;
if (!note().includes(", 2 deep")) return note();

// Two quick presses of Back are one step.
await tap([...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment")));
await wait(slide);
const bk = scr(2).querySelector(".ui-navstack-back");
bk.click(); bk.click();
await wait(slide);
if (count() !== 2) return "two presses: " + count();

// The browser's Back, then its Forward.
history.back();
await wait(slide);
if (count() !== 1 || title() !== "Inbox") return "history back: " + title();
if (location.hash) return "the entry's address stayed: " + location.hash;
if (field.value !== "kept" || !field.isConnected) return "the field below: " + field.value;
if (body(0).scrollTop !== 400) return "the scroll below: " + body(0).scrollTop;
if (document.activeElement.tagName !== "BUTTON") return "focus at the root: " + document.activeElement.tagName;
history.forward();
await wait(slide);
if (count() !== 2 || title() !== subject) return "forward: " + title();
if (!/^#mail-\d+$/.test(location.hash)) return "forward's address";
if (!note().includes(", 2 deep")) return note();

// Alt + Left.
scr(1).querySelector(".ui-navstack-title").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true, cancelable: true }));
await wait(slide);
if (count() !== 1) return "Alt + Left: " + count();

// Swipe: follows the finger, springs back when short, pops past half or on a flick.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
const left = r.left, y = r.top + 300;
const shift = (el) => new DOMMatrix(getComputedStyle(el).transform).m41;
const pull = async (fx, dx, ms) => {
    const steps = Math.max(4, Math.round(ms / 16));
    await fingers("touchStart", [{ x: fx, y }]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: fx + dx * i / steps, y }]); await wait(ms / steps); }
};
await pull(left + 8, 100, 400);
await wait(120);
if (Math.abs(shift(scr(1)) - 100) > 3) return "swipe tracks: " + shift(scr(1));
if (getComputedStyle(scr(0)).visibility !== "visible") return "the screen under does not peek";
const w = r.width, peek = shift(scr(0));
if (Math.abs(peek - (-0.3 * w * (1 - 100 / w))) > 3) return `peek: ${peek}`;
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 2 || shift(scr(1)) !== 0) return "a short swipe: " + count() + " " + shift(scr(1));
if (getComputedStyle(scr(0)).visibility !== "hidden") return "the screen under stayed after a spring back";
await pull(left + 8, 70, 40);
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 1) return "a flick did not pop: " + count();
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
await pull(left + 8, w * 0.6, 400);
await wait(120);
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 1 || title() !== "Inbox") return "a long swipe did not pop";

// From the bar too, which is outside the scroller.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
const barY = scr(1).querySelector(".ui-navstack-bar").getBoundingClientRect().top + 24;
await fingers("touchStart", [{ x: left + 8, y: barY }]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: left + 8 + 16 * i, y: barY }]); await wait(8); }
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 1) return "a swipe from the bar: " + count();

// A cancelled swipe, and one from the middle.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
await pull(left + 8, 150, 200);
await fingers("touchCancel", []);
await wait(slide);
if (count() !== 2 || shift(scr(1)) !== 0) return "a cancelled swipe";
await pull(left + 120, 150, 200);
if (shift(scr(1)) !== 0) return "a swipe from the middle moved it";
await fingers("touchEnd", []);
await wait(100);

// Home from two deep goes in one step of the screen, two of the history.
await press([...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment")));
await press(scr(2).querySelector(".ui-btn"));
if (count() !== 1 || title() !== "Inbox") return "home: " + count();

// A bad entry: another site's address is left out, a title of another type is shown, and
// nothing throws.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
await press([...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment")));
const beforeBad = location.href;
await press([...scr(2).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("A bad entry")));
if (count() !== 4 || title() !== "12345") return "a bad entry: " + count() + " " + title();
if (location.href !== beforeBad) return "a bad entry's address: " + location.href;
if (saved().length !== 4) return "a bad entry's step";
history.go(-3);
await wait(slide);
if (count() !== 1) return "back from a bad entry: " + count();

// A second finger is no swipe.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
await fingers("touchStart", [{ x: left + 8, y, id: 1 }, { x: left + 80, y, id: 2 }]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: left + 8 + 20 * i, y, id: 1 }, { x: left + 80 + 20 * i, y, id: 2 }]); await wait(16); }
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 2 || shift(scr(1)) !== 0) return "two fingers: " + count() + " " + shift(scr(1));
await pull(left + 8, 120, 200);
await fingers("touchStart", [{ x: left + 128, y, id: 1 }, { x: left + 220, y, id: 2 }]);
await wait(40);
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 2 || shift(scr(1)) !== 0) return "a second finger during a swipe";
history.back();
await wait(slide);

// Built again, as after a reload: the history brings the stack back, without a slide.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
const was = title();
await press([...scr(1).querySelectorAll(".ui-btn")].find((b) => b.textContent.includes("Attachment")));
again().click();
await wait(150);
if (count() !== 3 || title() !== "Attachment") return "rebuilt: " + count() + " " + title();
if (scr(1).querySelector(".ui-navstack-title").textContent !== was) return "rebuilt second: " + scr(1).querySelector(".ui-navstack-title").textContent;
if (getComputedStyle(scr(2)).animationName !== "none") return "a rebuilt stack slid";
if ($(".ui-navstack-back") == null) return "rebuilt: no Back";
await press(scr(2).querySelector(".ui-navstack-back"));
if (count() !== 2) return "Back after a rebuild: " + count();
history.back();
await wait(slide);
if (count() !== 1) return "second Back after a rebuild";

// Turned on its side, two deep: the first screen becomes a column, and nothing is lost.
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
const starred = scr(1).querySelector(".ui-btn");
starred.click();
await wait(40);
const iW = innerWidth, iH = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: iH, height: iW, deviceScaleFactor: 2, mobile: true });
await wait(350);
const col = scr(0).getBoundingClientRect().width, colFree = !scr(0).hasAttribute("inert"), n = count();
await cdp("Emulation.setDeviceMetricsOverride", { width: iW, height: iH, deviceScaleFactor: 2, mobile: true });
await wait(350);
if (col !== 320 || !colFree || n !== 2) return `turned: column ${col}, ${colFree}, ${n} screens`;
if (starred.textContent.trim() !== "Starred 1" || !starred.isConnected) return "turning lost a screen's state";
if (!scr(0).hasAttribute("inert") || getComputedStyle(scr(0)).visibility !== "hidden") return "upright again, the first screen stayed";
history.back();
await wait(slide);

// Without the history: the same, and no steps.
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Without the history").click();
await wait(150);
const len0 = history.length;
if (count() !== 1) return "without the history: " + count();
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
if (count() !== 2 || history.length !== len0 || location.hash) return `without the history: ${count()} ${history.length - len0} ${location.hash}`;
await tap(scr(1).querySelector(".ui-navstack-back"));
await wait(slide);
if (count() !== 1) return "without the history, Back: " + count();
await tap(rows()[Math.floor(rows().length / 2)]);
await wait(slide);
await pull(left + 8, 70, 40);
await fingers("touchEnd", []);
await wait(slide);
if (count() !== 1) return "without the history, a flick";
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "With the history").click();
await wait(150);

// Reduced motion: nothing slides.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(50);
await tap(rows()[Math.floor(rows().length / 2)]);
const na = getComputedStyle(scr(1)).animationName;
await wait(100);
const inPlace = shift(scr(1));
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (na !== "none") return "reduced motion: " + na;
if (inPlace !== 0) return "reduced motion, in place: " + inPlace;
history.back();
await wait(slide);
if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
