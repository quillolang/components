// mobile
const dlg = $("dialog.ui-bottom-sheet");
const grip = dlg.querySelector(".ui-bottom-sheet-grip");
const list = dlg.querySelector(".ui-bottom-sheet-body");
const row = () => list.querySelectorAll("li")[2];
const trig = $$("button.ui-btn").find((b) => b.textContent === "Show places");
const shown = () => Math.round(innerHeight - dlg.getBoundingClientRect().top);
const stop = () => $(".bottom-sheet-demo-stop").textContent;
const closed = () => +$(".bottom-sheet-demo-closed").textContent;
const near = (a, b, by = 2) => Math.abs(a - b) <= by;
const settle = () => wait(420);
// A drag that stops before the finger lifts, so only distance counts.
const slow = async (el, dy) => {
    const p = middle(el), steps = 16;
    await fingers("touchStart", [p]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + dy * i / steps }]); await wait(16); }
    await wait(140);
    await fingers("touchEnd", []);
    await settle();
};
// A flick: a finger gone in two moves, whatever the machine's load does to the timing.
const flick = async (el, dy) => {
    const p = middle(el);
    await fingers("touchStart", [p]);
    await fingers("touchMove", [{ x: p.x, y: p.y + Math.sign(dy) * 8 }]);
    await fingers("touchMove", [{ x: p.x, y: p.y + dy }]);
    await fingers("touchEnd", []);
    await wait();
};
const start = history.state;
if (dlg.open) return "the sheet starts open";
await tap(trig); await settle();
if (!dlg.open) return "the trigger does not open it";
const full = dlg.offsetHeight, half = Math.round(full / 2), peek = 132;
if (full !== innerHeight - 12) return `full is ${full} in ${innerHeight}`;
if (!near(shown(), half)) return `it opens at ${shown()}, not half ${half}`;
if (device === "phone" && dlg.getBoundingClientRect().width !== innerWidth) return "on a phone it is not the screen's width";
if (device === "tablet") {
    const r = dlg.getBoundingClientRect();
    if (r.width !== 640 || r.left !== (innerWidth - 640) / 2) return `on a tablet it stands at ${r.left}, ${r.width} wide`;
}

// A short drag springs back.
await slow(grip, -30);
if (!near(shown(), half)) return `a short drag up did not spring back: ${shown()}`;
if (stop() !== "none yet") return "a drag that came back reported a new stop";
await slow(grip, 40);
if (!near(shown(), half)) return `a short drag down did not spring back: ${shown()}`;

// It follows the finger, without the state going round for each move.
let p = middle(grip);
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
await wait(30);
if (!near(shown(), half + 80)) return `the sheet does not follow the finger: ${shown()} for ${half + 80}`;
if (!dlg.style.transform.includes("translateY")) return "a drag is not moved by the element's transform";
// The system taking the gesture puts it back.
await fingers("touchCancel", []);
await settle();
if (!near(shown(), half)) return `a cancelled drag did not go back: ${shown()}`;
if (dlg.style.transform !== "") return "a cancelled drag left its transform";

// The width prop changing under a finger: what shows it must not touch where the sheet stands.
const widen = $$("button.ui-btn").find((b) => b.textContent === "Change the width");
p = middle(grip);
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
await wait(30);
widen.click(); await wait(200);
if (!near(shown(), half + 80)) return `a new width under a finger moved the sheet to ${shown()}, not ${half + 80}`;
await fingers("touchCancel", []); await settle();
if (!near(shown(), half)) return `after a new width it rests at ${shown()}`;
if (device === "tablet" && dlg.getBoundingClientRect().width !== 560) return `the new width did not arrive: ${dlg.getBoundingClientRect().width}`;
widen.click(); await settle();
if (!near(shown(), half)) return `a new width at rest moved the sheet to ${shown()}`;
if (dlg.style.getPropertyValue("--ui-bottom-sheet-hide") === "") return "a new width lost the list's room at the foot";

// Distance: past the middle of the next stop.
await slow(grip, -(full - half) / 2 - 30);
if (!near(shown(), full)) return `a long slow drag up stopped at ${shown()}, not full`;
if (stop() !== "full") return `on_detent said ${stop()}`;
// Under the middle it stays.
await slow(grip, (full - half) / 2 - 30);
if (!near(shown(), full)) return `a drag down of under half the gap left it at ${shown()}`;

// Rubber band past the top stop: pulled 100, it moves 34.14.
p = middle(grip);
const at = dlg.getBoundingClientRect().top;
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
await wait(30);
const pulled = at - dlg.getBoundingClientRect().top;
if (Math.abs(pulled - 34.14) > 0.6) return `pulled 100 past the top it moved ${pulled}, not 34.14`;
await wait(120);
await fingers("touchEnd", []); await settle();
if (!near(shown(), full)) return `after the rubber band it rests at ${shown()}`;

// Speed: a flick of 120 px goes down a stop, though the distance would not.
await flick(grip, 120); await settle();
if (!near(shown(), half)) return `a flick down from full rests at ${shown()}, not half`;
await flick(grip, 120); await settle();
if (!near(shown(), peek)) return `a flick down from half rests at ${shown()}, not peek`;
if (stop() !== "peek") return `on_detent said ${stop()} at peek`;
await flick(grip, -120); await settle();
if (!near(shown(), half)) return `a flick up from peek rests at ${shown()}, not half`;

// The list and the sheet share the finger. From half, a drag up on the list grows the sheet
// and goes on into the list.
if (list.scrollHeight <= list.clientHeight) return "the list is too short to test with";
await slow(row(), -(full - half) - 120);
if (!near(shown(), full)) return `a drag up on the list left the sheet at ${shown()}`;
if (!near(list.scrollTop, 120, 8)) return `the list did not take over at the top: scrollTop ${list.scrollTop}`;
// At full, scrolled down: the list scrolls and the sheet stays.
await slow(row(), 60);
if (!near(shown(), full)) return `a scrolled list gave the drag to the sheet: ${shown()}`;
if (list.scrollTop >= 120) return `dragging down did not scroll the list: ${list.scrollTop}`;
list.scrollTop = 0; await wait(60);
// At the list's top, dragged up: the list scrolls.
await slow(row(), -60);
if (!near(shown(), full)) return `at full, a drag up moved the sheet: ${shown()}`;
if (list.scrollTop < 30) return `at full, a drag up did not scroll the list: ${list.scrollTop}`;
list.scrollTop = 0; await wait(60);
// At the list's top, dragged down: the sheet.
await slow(row(), full - half);
if (!near(shown(), half)) return `a drag down from the list's top left it at ${shown()}`;
if (list.scrollTop !== 0) return "the list moved with the sheet";
// One finger, list then sheet: the list scrolls to its top and the sheet takes the rest.
key(grip, "ArrowUp"); await settle();
list.scrollTop = 80; await wait(60);
p = { x: innerWidth / 2, y: 240 };
await fingers("touchStart", [p]);
for (let i = 1; i <= 40; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 12 * i }]); await wait(16); }
await wait(30);
if (list.scrollTop !== 0) return `the list did not reach its top: ${list.scrollTop}`;
if (dlg.getBoundingClientRect().top < 200) return `the sheet did not take over from the list: its top is at ${dlg.getBoundingClientRect().top}`;
await wait(140);
await fingers("touchEnd", []); await settle();
if (!near(shown(), half)) return `after the list handed over it rests at ${shown()}`;
// A sideways drag in the list does nothing to the sheet.
await drag(row(), 120, 6, 300); await settle();
if (!near(shown(), half)) return `a sideways drag moved the sheet: ${shown()}`;

// The end of the list can be reached at half.
list.scrollTop = 1e6; await wait(60);
const lastRow = [...list.querySelectorAll("li")].pop().getBoundingClientRect();
if (lastRow.bottom > innerHeight) return `at half the last row ends below the screen: ${lastRow.bottom}`;
list.scrollTop = 0; await wait(60);

// The keyboard's route: the handle is a button.
key(grip, "ArrowUp"); await settle();
if (!near(shown(), full)) return `ArrowUp went to ${shown()}`;
key(grip, "ArrowUp"); await settle();
if (!near(shown(), full)) return "ArrowUp at the top moved it";
key(grip, "ArrowDown"); key(grip, "ArrowDown"); await settle();
if (!near(shown(), peek)) return `ArrowDown twice went to ${shown()}`;
await tap(grip); await settle();
if (!near(shown(), half)) return `tapping the handle went to ${shown()}, not the next stop`;

// The on-screen keyboard: a stand-in, as Chrome here has none.
const realVV = Object.getOwnPropertyDescriptor(window, "visualViewport");
key(grip, "ArrowDown"); await settle();
dlg.querySelector(".ui-bottom-sheet-close").click(); await settle();
if (dlg.open) return "Close does not close it";
if (history.state !== start) return "closing left its history entry";
const fake = new EventTarget();
Object.assign(fake, { height: innerHeight, offsetTop: 0, scale: 1 });
Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
await tap(trig); await settle();
const input = dlg.querySelector("input");
input.focus();
fake.height = innerHeight - 336; fake.dispatchEvent(new Event("resize")); await settle();
let box = dlg.getBoundingClientRect();
const keyboardTop = innerHeight - 336;
if (!near(box.height, keyboardTop - 12)) return `with the keyboard up the sheet is ${box.height} tall`;
const inputBox = input.getBoundingClientRect();
if (inputBox.bottom > keyboardTop) return `the field is under the keyboard: ${inputBox.bottom} of ${keyboardTop}`;
if (box.top < 12 || box.top >= keyboardTop) return `with the keyboard up its top is at ${box.top}`;
// A pinch is not a keyboard.
fake.scale = 2; fake.height = innerHeight / 2; fake.dispatchEvent(new Event("resize")); await settle();
if (!near(dlg.offsetHeight, full)) return `a pinch was taken for a keyboard: ${dlg.offsetHeight}`;
fake.scale = 1; fake.height = innerHeight - 336; fake.dispatchEvent(new Event("resize")); await settle();
fake.height = innerHeight; fake.dispatchEvent(new Event("resize")); await settle();
if (!near(dlg.offsetHeight, full)) return `the sheet did not grow back: ${dlg.offsetHeight}`;
input.blur();
dlg.querySelector(".ui-bottom-sheet-close").click(); await settle();
if (realVV) Object.defineProperty(window, "visualViewport", realVV); else delete window.visualViewport;

// Dragged off.
const before = closed();
await tap(trig); await settle();
await slow(grip, half - peek);
if (!near(shown(), peek)) return `a slow drag to peek rests at ${shown()}`;
await flick(grip, 80); await settle();
if (dlg.open) return "a flick down from the lowest stop does not close it";
if (closed() !== before + 1) return "on_close was not called";
if (history.state !== start) return "a sheet dragged off left its history entry";

// The back gesture: the app goes back in the history.
await tap(trig); await settle();
if (!dlg.open) return "it does not open again";
if (!near(shown(), half)) return `it opens at ${shown()} the second time, not half`;
if (history.state?.quillo_layer !== 1) return "an open sheet has no history entry";
const nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (dlg.open) return "the back gesture does not close it";
if (closed() !== before + 2) return "on_close was not called after the back gesture";

// Tapping above it closes it; a mouse-free tap on the sheet does not.
await tap(trig); await settle();
await fingers("touchStart", [{ x: 20, y: 40 }]); await fingers("touchEnd", []); await settle();
if (dlg.open) return "a tap above it does not close it";

// A field in a sheet at peek needs the room: it goes up a stop.
await tap(trig); await settle();
await slow(grip, half - peek);
const fake2 = new EventTarget();
Object.assign(fake2, { height: innerHeight, offsetTop: 0, scale: 1 });
dlg.querySelector(".ui-bottom-sheet-close").click(); await settle();
Object.defineProperty(window, "visualViewport", { configurable: true, value: fake2 });
await tap(trig); await settle();
await slow(grip, half - peek);
if (!near(shown(), peek)) return `not at peek before the keyboard: ${shown()}`;
fake2.height = innerHeight - 336; fake2.dispatchEvent(new Event("resize")); await settle();
if (stop() !== "half") return `the keyboard at peek left it at ${stop()}`;
if (!near(shown() - 336, Math.round((innerHeight - 336 - 12) / 2))) return `with the keyboard, half shows ${shown() - 336}`;
fake2.height = innerHeight; fake2.dispatchEvent(new Event("resize")); await settle();
dlg.querySelector(".ui-bottom-sheet-close").click(); await settle();
if (realVV) Object.defineProperty(window, "visualViewport", realVV); else delete window.visualViewport;

// One that may not be dragged off.
const other = $$("dialog.ui-bottom-sheet")[1], otherTrig = $$("button.ui-btn").find((b) => b.textContent === "No closing");
await tap(otherTrig); await settle();
if (!near(innerHeight - other.getBoundingClientRect().top, peek)) return "start=peek does not start at peek";
const otherGrip = other.querySelector(".ui-bottom-sheet-grip");
p = middle(otherGrip);
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
await wait(30);
const sunk = peek - (innerHeight - other.getBoundingClientRect().top);
if (Math.abs(sunk - 34.14) > 0.6) return `pulled 100 below its last stop it sank ${sunk}, not 34.14`;
await fingers("touchEnd", []); await settle();
if (!other.open) return "dismissable={false} was dragged off";
if (!near(innerHeight - other.getBoundingClientRect().top, peek)) return "it did not come back to peek";
await tap(otherGrip); await settle();
if (!near(innerHeight - other.getBoundingClientRect().top, other.offsetHeight)) return "detents without half: the handle does not go to full";
await fingers("touchStart", [{ x: 20, y: 4 }]); await fingers("touchEnd", []); await settle();
if (!other.open) return "a tap above closes a sheet that is not dismissable";
other.querySelector(".ui-bottom-sheet-close").click(); await settle();
if (other.open) return "Close does not close the second sheet";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(dlg).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
