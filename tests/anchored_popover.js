// tablet
const W = innerWidth, H = innerHeight;
const pop = (n) => $(`#anchored-demo-${n}`);
const btn = (n) => pop(n).parentElement.querySelector(".ui-anchored-trigger");
const opened = (n) => pop(n).matches(":popover-open");
const escape = async () => {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await wait();
};
// The arrow's tip points at the button's middle, along the side it faces.
const tied = (n) => {
    const p = pop(n), a = p.querySelector(".ui-anchored-arrow"), s = p.dataset.side, b = btn(n).getBoundingClientRect(), r = a.getBoundingClientRect();
    if (getComputedStyle(a).display === "none") return `${n}: no arrow`;
    const down = s === "top" || s === "bottom";
    const off = down ? (r.left + r.width / 2) - (b.left + b.width / 2) : (r.top + r.height / 2) - (b.top + b.height / 2);
    if (Math.abs(off) > 1.5) return `${n}: the arrow is ${off} px off the button's middle`;
    const pr = p.getBoundingClientRect();
    const gap = s === "bottom" ? pr.top - b.bottom : s === "top" ? b.top - pr.bottom : s === "right" ? pr.left - b.right : b.left - pr.right;
    if (Math.abs(gap - 12) > 1) return `${n}: ${gap} px from the button on side ${s}`;
    if (pr.left < 0 || pr.top < 0 || pr.right > innerWidth || pr.bottom > innerHeight) return `${n}: off the screen`;
};

// Open by a real tap: it is a popover with its arrow, not a sheet.
await tap(btn("sort"));
if (!opened("sort")) return "a tap did not open it";
if (btn("sort").getAttribute("aria-expanded") !== "true") return "the button does not say it is open";
if (pop("sort").dataset.side !== "bottom") return `it wanted the bottom and got ${pop("sort").dataset.side}`;
let bad = tied("sort");
if (bad) return bad;
if (document.activeElement !== pop("sort")) return "the focus did not go to the panel";
if ($("#anchored-demo-count").textContent !== "Opened 1, closed 0") return `on_open: ${$("#anchored-demo-count").textContent}`;
// The page's left edge is near: the panel stays on the screen, and the arrow still points.
if (pop("sort").getBoundingClientRect().left !== 8) return `near the left edge it sits at ${pop("sort").getBoundingClientRect().left}, not the 8 px margin`;

// Escape, a real key: it closes and gives the focus back.
await escape();
if (opened("sort")) return "Escape did not close it";
if (document.activeElement !== btn("sort")) return `the focus went to ${document.activeElement.tagName}, not the button`;
if ($("#anchored-demo-count").textContent !== "Opened 1, closed 1") return `on_close: ${$("#anchored-demo-count").textContent}`;

// A tap elsewhere closes it, and a tap on its button closes it rather than opening it again.
await tap(btn("sort"));
await tap($("#anchored-demo-count"));
if (opened("sort")) return "a tap elsewhere did not close it";
await tap(btn("sort")); if (!opened("sort")) return "it did not open again";
await tap(btn("sort"));
if (opened("sort")) return "a second tap on its button left it open";
await tap(btn("sort"));
await tap(pop("sort").querySelector(".ui-anchored-close"));
if (opened("sort")) return "Close did not close it";

// Near the bottom it turns to the top, as asked, and the arrow goes with it.
await tap(btn("info"));
if (pop("info").dataset.side !== "top") return `side "top" gave ${pop("info").dataset.side}`;
bad = tied("info"); if (bad) return bad;
await escape();

// No room below: "bottom" flips. A controlled one tied by id to the page's own button.
await tap($("#anchored-demo-other"));
if (!opened("tied")) return "open={true} did not show it";
const tiedTo = $("#anchored-demo-other").getBoundingClientRect(), t = pop("tied").getBoundingClientRect();
if (pop("tied").dataset.side !== "bottom" || Math.abs(t.top - tiedTo.bottom - 12) > 1) return "it is not tied to the anchor element";
await tap($("#anchored-demo-count"));
if (opened("tied")) return "the controlled one did not close on a tap elsewhere";
await wait(100);
if ($("#anchored-demo-other").textContent !== "Show a note") return "on_close did not reach the owner's state";
await tap($("#anchored-demo-other"));
if (!opened("tied")) return "it did not open a second time from state";
await tap($("#anchored-demo-other"));
if (opened("tied")) return "taking `open` away did not close it";

// A panel too tall for either side shortens and scrolls.
await tap(btn("side"));
const long = pop("side"), lr = long.getBoundingClientRect();
if (long.dataset.side !== "left") return `side "right" at the right edge should flip to the left, and is ${long.dataset.side}`;
bad = tied("side"); if (bad) return bad;
if (lr.top < 0 || lr.bottom > H) return `the long one runs off the screen: ${lr.top} to ${lr.bottom}`;
const body = long.querySelector(".ui-anchored-body");
if (!(body.scrollHeight > body.clientHeight)) return "the long one's body should scroll";
await escape();

// The keyboard: a stand-in, as a real one cannot open here. The visible height shrinks
// and the page's own size does not.
await tap(btn("info"));
const vv = visualViewport, shut = vv.height, keyboardH = 320;
Object.defineProperty(vv, "height", { configurable: true, get: () => shut - keyboardH });
vv.dispatchEvent(new Event("resize"));
await wait(80);
const kbd = pop("info").getBoundingClientRect();
if (kbd.bottom > shut - keyboardH + 1) return `the panel runs under the keyboard: ${kbd.bottom} past ${shut - keyboardH}`;
if (pop("info").dataset.tied !== "false") return "its button is under the keyboard: an arrow would point at nothing";
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(80);
if (pop("info").dataset.tied !== "true") return "the arrow did not come back with the keyboard gone";
bad = tied("info"); if (bad) return bad;
await escape();

// A real turn with it open: still open, re-tied, focus kept in it.
await tap(btn("reply"));
// A change of what its style is made from leaves it placed: it moves to the new width, tied.
const placedAt = pop("reply").style.top;
if (!placedAt) return "it is not placed through its own style";
$("#anchored-demo-wider").click(); await wait(120);
if (pop("reply").getBoundingClientRect().width !== 360) return `the width came to ${pop("reply").getBoundingClientRect().width}`;
if (pop("reply").style.top !== placedAt) return `a change of width lost its place: ${pop("reply").style.top}`;
bad = tied("reply"); if (bad) return `after a change of width: ${bad}`;
$("#anchored-demo-wider").click(); await wait(120);
const field = $("#anchored-demo-text");
await tap(field);
if (document.activeElement !== field) return "the field did not take the focus";
field.value = "On my way";
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (!opened("reply")) return "the turn closed it";
bad = tied("reply"); if (bad) return `after a turn: ${bad}`;
if (document.activeElement !== field || field.value !== "On my way") return "the turn lost the focus or the text";

// The same, to a phone's width: it becomes a sheet without closing.
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (!opened("reply")) return "going to a phone's width closed it";
let sheet = pop("reply").getBoundingClientRect();
if (pop("reply").dataset.side !== "sheet") return `at 390 px its side is ${pop("reply").dataset.side}`;
if (sheet.left !== 0 || sheet.width !== 390 || Math.abs(sheet.bottom - 844) > 1) return `not a sheet: ${JSON.stringify(sheet)}`;
if (getComputedStyle(pop("reply").querySelector(".ui-anchored-arrow")).display !== "none") return "a sheet has no arrow";
if (document.activeElement !== field) return "the focus was lost when it became a sheet";

// The keyboard on a phone: the sheet rises, by a stand-in again.
Object.defineProperty(vv, "height", { configurable: true, get: () => 844 - keyboardH });
vv.dispatchEvent(new Event("resize"));
await wait(80);
sheet = pop("reply").getBoundingClientRect();
if (Math.abs(sheet.bottom - (844 - keyboardH)) > 1) return `the sheet stops at ${sheet.bottom}, not above the keyboard at ${844 - keyboardH}`;
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(80);
sheet = pop("reply").getBoundingClientRect();
if (Math.abs(sheet.bottom - 844) > 1) return "the sheet did not come down with the keyboard";

// Pulling the sheet: short springs back, a touch cancelled springs back, long closes, a flick closes.
const grip = pop("reply").querySelector(".ui-anchored-grip");
const h = pop("reply").offsetHeight;
await drag(grip, 0, h * 0.2, 400);
await wait(300);
if (!opened("reply")) return "a short pull closed it";
if (pop("reply").style.transform !== "") return `a short pull left ${pop("reply").style.transform}`;
if (Math.abs(pop("reply").getBoundingClientRect().bottom - 844) > 1) return "a short pull did not spring back";
// Across, not down: nothing moves.
await drag(grip, 120, 2, 200);
if (!opened("reply")) return "a sideways pull closed it";
// A touch the system takes back, part way down.
const g = grip.getBoundingClientRect(), gx = g.left + g.width / 2, gy = g.top + g.height / 2;
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: gx, y: gy }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: gx, y: gy + 40 }] });
await wait(60);
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: gx, y: gy + 70 }] });
await wait(60);
const pulled = pop("reply").style.transform;
if (!pulled.includes("translateY")) return "the sheet did not follow the finger";
// State changing mid-pull: it stays under the finger, and goes on following.
$("#anchored-demo-wider").click(); await wait(80);
if (pop("reply").style.transform !== pulled) return `a change of state took the pull from ${pulled} to ${pop("reply").style.transform}`;
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: gx, y: gy + 90 }] });
await wait(80);
if (pop("reply").style.transform !== "translateY(90px)") return `it stopped following: ${pop("reply").style.transform}`;
$("#anchored-demo-wider").click(); await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(300);
if (!opened("reply") || pop("reply").style.transform !== "") return "a cancelled pull did not spring back";
await drag(grip, 0, h * 0.5, 300);
await wait(350);
if (opened("reply")) return "a long pull did not close it";
await tap(btn("reply"));
if (!opened("reply")) return "it did not open again as a sheet";
if (pop("reply").style.transform !== "") return "the sheet came back still pulled";
await wait(300);
// A quick flick of a short distance, under the third.
await drag(grip, 0, h * 0.25, 40);
await wait(350);
if (opened("reply")) return "a flick did not close it";

await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(400);
