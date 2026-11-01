// mobile
const sheet = $("section.ui-peek-sheet");
const host = $(".ui-peek-sheet-host");
const grip = sheet.querySelector(".ui-peek-sheet-grip");
const list = sheet.querySelector(".ui-peek-sheet-body");
const pin = $$("button.ui-btn").find((b) => b.textContent === "Drop a pin");
const stop = () => $(".peek-sheet-demo-stop").textContent;
const pins = () => +$(".peek-sheet-demo-pins").textContent;
const near = (a, b, by = 2) => Math.abs(a - b) <= by;
const frame = () => host.getBoundingClientRect();
// A side card stands 12 px above the frame's foot.
const shown = () => Math.round(frame().bottom - sheet.getBoundingClientRect().top - (frame().width >= 600 ? 12 : 0));
const settle = () => wait(420);
const slow = async (el, dy) => {
    const p = middle(el), steps = 14;
    await fingers("touchStart", [p]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + dy * i / steps }]); await wait(16); }
    await wait(140);
    await fingers("touchEnd", []);
    await settle();
};
const flick = async (el, dy) => {
    const p = middle(el);
    await fingers("touchStart", [p]);
    await fingers("touchMove", [{ x: p.x, y: p.y + Math.sign(dy) * 8 }]);
    await fingers("touchMove", [{ x: p.x, y: p.y + dy }]);
    await fingers("touchEnd", []);
    await settle();
};
const full = sheet.offsetHeight, half = Math.round(full / 2), peek = 112;
if (!near(shown(), peek)) return `it starts at ${shown()}, not peek`;
const wide = frame().width >= 600;
if (device === "tablet" && !wide) return `the tablet's frame is ${frame().width} wide`;
if (device === "phone" && wide) return "a phone gave a wide frame";
if (wide) {
    const r = sheet.getBoundingClientRect();
    if (r.width !== 360 || !near(r.left - frame().left, 12)) return `on a tablet it is not a side card: ${r.left}, ${r.width}`;
    if (getComputedStyle(sheet).borderBottomWidth === "0px") return "the side card has no foot";
}

// What is behind is used, at every height.
const pointAtPin = async () => { const b = pin.getBoundingClientRect(); await fingers("touchStart", [{ x: b.left + 8, y: b.top + 8 }]); await fingers("touchEnd", []); await wait(); };
await pointAtPin();
if (pins() !== 1) return "the page behind does not take a tap at peek";
if ($(".ui-peek-sheet-host").getAttribute("aria-modal") || sheet.closest("dialog")) return "it is modal";
if (document.activeElement && document.activeElement.closest?.("dialog")) return "focus was taken";

// A new peek under a finger must not move the sheet, and takes effect when it lets go.
const peeker = $$("button.ui-btn").find((b) => b.textContent === "Change the peek");
let g = middle(grip);
await fingers("touchStart", [g]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: g.x, y: g.y - 10 * i }]); await wait(16); }
await wait(30);
const midway = shown();
if (!near(midway, peek + 100)) return `the sheet does not follow the finger: ${midway}`;
peeker.click(); await wait(220);
if (!near(shown(), midway)) return `a new peek under a finger moved the sheet from ${midway} to ${shown()}`;
await wait(130);
await fingers("touchEnd", []); await settle();
if (!near(shown(), 160)) return `after a new peek it rests at ${shown()}, not 160`;
peeker.click(); await settle();
if (!near(shown(), peek)) return `a new peek at rest went to ${shown()}, not ${peek}`;

// A short drag springs back; a long one stops at half; a drag past it, at full.
await slow(grip, -30);
if (!near(shown(), peek)) return `a short drag did not spring back: ${shown()}`;
if (stop() !== "peek") return "a short drag moved the stop";
await slow(grip, -(half - peek) / 2 - 40);
if (!near(shown(), half)) return `a drag up stopped at ${shown()}, not half ${half}`;
if (stop() !== "half") return `on_detent said ${stop()}`;
if (wide) { await pointAtPin(); if (pins() !== 2) return "at half the page behind a side card does not take a tap"; }
else { await pointAtPin(); }
const atHalf = pins();
await flick(grip, -120);
if (!near(shown(), full)) return `a flick up from half rests at ${shown()}`;
// Rubber band at the top: pulled 100, it moves 34.14.
let p = middle(grip);
const at = sheet.getBoundingClientRect().top;
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
await wait(30);
const pulled = at - sheet.getBoundingClientRect().top;
if (Math.abs(pulled - 34.14) > 0.6) return `pulled 100 past the top it moved ${pulled}, not 34.14`;
await fingers("touchCancel", []); await settle();
if (!near(shown(), full)) return "a cancelled drag did not go back";
await flick(grip, 120);
if (!near(shown(), half)) return `a flick down from full rests at ${shown()}`;
await flick(grip, 120);
if (!near(shown(), peek)) return `a flick down from half rests at ${shown()}`;
// It never goes: below peek it resists, and comes back. Pulled 80 it sinks 29.55.
p = middle(grip);
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
await wait(30);
const sunk = peek - shown();
if (Math.abs(sunk - 29.55) > 1) return `pulled 80 below peek it sank ${sunk}, not 29.55`;
await fingers("touchEnd", []); await settle();
if (!near(shown(), peek)) return "it did not come back to peek";
await flick(grip, 100);
if (!near(shown(), peek)) return "a flick down at peek moved it";

// The list shares the finger.
key(grip, "ArrowUp"); await settle();
if (!near(shown(), half)) return `ArrowUp went to ${shown()}`;
const row = () => list.querySelectorAll("li")[1];
await slow(row(), -(full - half) - 100);
if (!near(shown(), full)) return `a drag on the list left the sheet at ${shown()}`;
if (!near(list.scrollTop, 100, 10)) return `the list did not go on: scrollTop ${list.scrollTop}`;
await slow(list.querySelectorAll("li")[6], 40);
if (!near(shown(), full)) return "a scrolled list gave a drag to the sheet";
list.scrollTop = 0; await wait(80);
await slow(row(), full - half);
if (!near(shown(), half)) return `from the list's top a drag down left it at ${shown()}`;

// A new stop keeps the room at the foot of the list, so that its end can be reached.
list.scrollTop = 1e6; await wait(80);
const endRow = [...list.querySelectorAll("li")].pop().getBoundingClientRect();
list.scrollTop = 0; await wait(80);
if (endRow.bottom > frame().bottom) return `at half the last row ends below the frame: ${endRow.bottom} of ${frame().bottom}`;

// The keyboard's route and the handle.
key(grip, "ArrowDown"); await settle();
if (!near(shown(), peek)) return "ArrowDown did not go to peek";
key(grip, "ArrowDown"); await settle();
if (!near(shown(), peek)) return "ArrowDown at peek moved it";
await tap(grip); await settle();
if (!near(shown(), half)) return `a tap on the handle went to ${shown()}`;

// Rotation keeps the stop and the scroll, and measures again.
if (device === "tablet") {
    key(grip, "ArrowUp"); await settle();
    list.scrollTop = 30; await wait(60);
    const before = frame().height;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true });
    await settle();
    if (!near(shown(), sheet.offsetHeight)) return `after rotation the stop is lost: ${shown()} of ${sheet.offsetHeight}`;
    if (list.scrollTop !== 30) return `rotation lost the scroll: ${list.scrollTop}`;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
    await settle();
    if (frame().height !== before) return "rotating back did not restore the frame";
    list.scrollTop = 0;
    key(grip, "ArrowDown"); await settle();
}

// A field opens it to the top.
const search = sheet.querySelector("input");
key(grip, "ArrowDown"); await settle();
search.focus(); await settle();
if (!near(shown(), sheet.offsetHeight)) return `a field in it did not open it: ${shown()}`;
if (stop() !== "full") return `the field left the stop at ${stop()}`;
search.blur();
key(grip, "ArrowDown"); key(grip, "ArrowDown"); await settle();
if (!near(shown(), peek)) return "it did not go back down";

// The on-screen keyboard: it rises by what covers its pane.
const vv = window.visualViewport;
key(grip, "ArrowUp"); await settle();
const atFoot = frame().bottom, sheetTall = sheet.offsetHeight;
Object.defineProperty(vv, "height", { configurable: true, get: () => innerHeight - 336 });
vv.dispatchEvent(new Event("resize")); await settle();
const covered = Math.max(0, Math.round(atFoot - (innerHeight - 336)));
const foot = sheet.getBoundingClientRect().height;
// A new stop keeps the lift.
key(grip, "ArrowDown"); await settle();
const footAfter = sheet.getBoundingClientRect().height;
key(grip, "ArrowUp"); await settle();
delete vv.height;
vv.dispatchEvent(new Event("resize")); await settle();
if (Math.abs(sheetTall - foot - covered) > 2) return `the keyboard covers ${covered}, and the sheet gave up ${sheetTall - foot}`;
if (Math.abs(footAfter - foot) > 2) return `a new stop lost the keyboard's lift: ${foot} became ${footAfter}`;
if (sheet.offsetHeight !== sheetTall) return "it did not grow back";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(sheet).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
