// tablet
await wait(300);
const box = $(".ui-stylus-canvas");
const bad = $("#stylus-canvas-bad");
const badKept = JSON.parse(bad.querySelector("input[name=stylus-bad]").value);
if (badKept.length !== 1 || badKept[0].color !== "ink" || badKept[0].points.length !== 1) return "bad strokes: " + JSON.stringify(badKept);
bad.remove();
const stage = $(".ui-stylus-canvas-view"), page = $(".ui-stylus-canvas-page");
const data = () => JSON.parse($("input[name=stylus-demo]").value);
const note = () => $("#stylus-canvas-note").textContent;
const btn = (t) => $$(".ui-stylus-canvas-btn").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const rect = () => page.getBoundingClientRect();
if (data().length !== 2) return "start: " + data().length;
const inkAt = (px, py, size = 12) => {
    const c = page.getContext("2d"), k = page.width / 1200;
    const d = c.getImageData(px * k - size, py * k - size, size * 2, size * 2).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
};
if (!inkAt(420, 260)) return "the starting strokes are not painted ";

// Where a page point stands on the screen.
const at = (x, y) => { const r = rect(); return { x: r.left + x * r.width / 1200, y: r.top + y * r.height / 800 }; };
const pen = (type, p, o = {}) => cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, pointerType: "pen", button: "left", buttons: 1, clickCount: 1, ...o });
const stroke = async (points) => {
    await pen("mousePressed", at(...points[0]), points[0][2]);
    for (const p of points.slice(1)) await pen("mouseMoved", at(...p), p[2]);
    const last = points[points.length - 1];
    await pen("mouseReleased", at(last[0], last[1]), { buttons: 0, force: 0 });
    await wait(80);
};
// A pen's width: 4 * (0.25 + 1.5 * pressure), times the side of a pen laid over.
await stroke([[800, 100, { force: 0.5, tiltX: 0, tiltY: 0 }], [850, 100, { force: 1, tiltX: 0, tiltY: 0 }], [900, 100, { force: 0.5, tiltX: 50, tiltY: 0 }], [950, 100, { force: 0.5, tiltX: 0, tiltY: -70 }], [1000, 100, { force: 0.5, tiltX: 30, tiltY: 20 }]]);
let all = data();
if (all.length !== 3 || note() !== "3 strokes.") return "a pen stroke was not kept: " + all.length + " " + note();
const widths = all[2].points.map((p) => p[2]).join();
if (widths !== "4,7,8,12,4") return "widths by pressure and tilt: " + widths;
const xs = all[2].points.map((p) => Math.round(p[0])).join();
if (xs !== "800,850,900,950,1000") return "points in the page's units: " + xs;
if (!inkAt(900, 100)) return "the stroke is not on the canvas";

// A finger after a pen moves nothing onto the page. The page fits, so nothing moves at all.
await drag(stage, 60, 40, 120);
if (data().length !== 3) return "a finger drew after the pen was seen: " + data().length;
if (!$(".ui-stylus-canvas-foot").textContent.includes("a palm draws nothing")) return "it does not say fingers no longer draw";
// A palm while the pen is down draws nothing, and the pen's stroke goes on.
const p0 = at(200, 700), p1 = at(300, 700);
await pen("mousePressed", p0, { force: 0.5 });
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p0.x, y: p0.y - 60, id: 1, radiusX: 40, radiusY: 40 }] });
await pen("mouseMoved", p1, { force: 0.5 });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await pen("mouseReleased", p1, { buttons: 0, force: 0 });
await wait(80);
if (data().length !== 4 || data()[3].points.length !== 2) return "a palm under the pen changed the stroke: " + JSON.stringify(data()[3]);

// Undo and redo, by button, and Ctrl+Z from the keyboard for real.
await tap(btn("Undo"));
if (data().length !== 3) return "Undo: " + data().length;
await tap(btn("Redo"));
if (data().length !== 4) return "Redo: " + data().length;
stage.focus();
const ctrlZ = async (shift) => {
    const mods = shift ? 2 + 8 : 2;
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", modifiers: mods, key: "z", code: "KeyZ", windowsVirtualKeyCode: 90 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", modifiers: mods, key: "z", code: "KeyZ", windowsVirtualKeyCode: 90 });
    await wait(60);
};
await ctrlZ(false);
if (data().length !== 3) return "Ctrl+Z: " + data().length;
await ctrlZ(true);
if (data().length !== 4) return "Ctrl+Shift+Z: " + data().length;
await ctrlZ(false);

// The eraser takes the whole stroke it touches, and one undo brings it back.
await tap(btn("Eraser"));
if (btn("Eraser").getAttribute("aria-pressed") !== "true") return "Eraser is not shown chosen";
await stroke([[850, 90, { force: 0.5 }], [850, 110, { force: 0.5 }]]);
if (data().length !== 2) return "the eraser did not take a stroke: " + data().length;
if (inkAt(950, 100)) return "the erased stroke is still painted";
await tap(btn("Undo"));
if (data().length !== 3) return "undo of the eraser: " + data().length;
if (!inkAt(950, 100)) return "undo did not paint it back";
await tap(btn("Pen"));
// The pen's own eraser end, with Pen chosen.
// DevTools cannot press it, so this one event is made up. Chrome's capture refuses a made-up pointer.
const real = stage.setPointerCapture;
stage.setPointerCapture = () => {};
const e = at(900, 100), o = { bubbles: true, cancelable: true, pointerId: 99, pointerType: "pen", clientX: e.x, clientY: e.y };
stage.dispatchEvent(new PointerEvent("pointerdown", { ...o, button: 5, buttons: 32, pressure: 0.5 }));
stage.dispatchEvent(new PointerEvent("pointerup", { ...o, button: 5, buttons: 0 }));
delete stage.setPointerCapture;
await wait(80);
if (data().length !== 2) return "the pen's eraser did not erase: " + data().length;
await tap(btn("Undo"));

// A stroke the system takes away leaves nothing.
const q = at(100, 100);
await tap(btn("Fingers draw"));
if (btn("Fingers draw").getAttribute("aria-pressed") !== "true") return "Finger: not on";
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [q] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: q.x + 40, y: q.y + 10 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(80);
if (data().length !== 3) return "a cancelled stroke was kept: " + data().length;
// With fingers let in, a finger draws, and a pen coming down throws that stroke away, as it was a palm.
await drag(stage, 30, 20, 100);
if (data().length !== 4) return "a finger with Finger on did not draw: " + data().length;
await tap(btn("Undo"));
const s = at(600, 700);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [s] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: s.x + 40, y: s.y }] });
await pen("mousePressed", at(100, 700), { force: 0.5 });
await pen("mouseMoved", at(120, 700), { force: 0.5 });
await pen("mouseReleased", at(120, 700), { buttons: 0, force: 0 });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(80);
if (data().length !== 4 || Math.round(data()[3].points[0][0]) !== 100) return "a palm's stroke survived the pen: " + JSON.stringify(data().slice(3));
await tap(btn("Undo"));
await tap(btn("Fingers draw"));

// Zoom by button: 1.5, then back; the page's point under the middle stays put.
const w0 = rect().width;
await tap(btn("Zoom in"));
if ($(".ui-stylus-canvas-zoom").textContent !== "150%") return "zoom in: " + $(".ui-stylus-canvas-zoom").textContent;
if (Math.abs(rect().width / w0 - 1.5) > 0.01) return "the page did not grow by half: " + rect().width / w0;
if (page.width < 1200 * rect().width / 1200 * 2 - 2) return "the canvas is not remade sharp: " + page.width + " for " + rect().width;
// A finger moves a zoomed page now. Pan clamps: its edge stays on the view.
const before = rect().left;
await drag(stage, -60, 0, 120);
// The page is 1.5 times as wide as it fits, so it has room to go left by 60, or stops at its edge.
const edge = stage.getBoundingClientRect().right - rect().width;
if (Math.abs(rect().left - Math.max(before - 60, edge)) > 2) return "a finger did not move the zoomed page: " + rect().left + " from " + before + ", edge " + edge;
if (data().length !== 3) return "moving the page drew: " + data().length;
// A state changing while a finger holds the page leaves it where it is.
const hp = middle(stage);
await fingers("touchStart", [hp]);
await fingers("touchMove", [{ x: hp.x + 30, y: hp.y }]);
await wait(40);
const heldAt = page.style.transform, heldWidth = page.style.width;
btn("Eraser").click();
await wait(60);
if (page.style.transform !== heldAt || page.style.width !== heldWidth) return "a state change mid-pan moved the page: " + page.style.transform;
btn("Pen").click();
await fingers("touchEnd", []);
await wait(60);
// Then the keys: - back to fit, and 0.
stage.focus();
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "-", code: "Minus", text: "-", windowsVirtualKeyCode: 189 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "-", code: "Minus", windowsVirtualKeyCode: 189 });
await wait(60);
if ($(".ui-stylus-canvas-zoom").textContent !== "100%") return "the - key: " + $(".ui-stylus-canvas-zoom").textContent;
// Two fingers apart zoom by how far they spread: 40 to 80 from the middle is twice.
await pinch(stage, 2);
const z = parseInt($(".ui-stylus-canvas-zoom").textContent);
if (Math.abs(z - 200) > 3) return "a pinch to twice: " + z;
if (data().length !== 3) return "a pinch drew: " + data().length;
await tap(btn("Zoom out"));
await tap(btn("Zoom out"));
if ($(".ui-stylus-canvas-zoom").textContent !== "100%") return "back to fit: " + $(".ui-stylus-canvas-zoom").textContent;

// Out: the callback gets a PNG and JSON, and the PNG holds the page's size.
await tap(btn("Image"));
if (!$("#stylus-canvas-out").textContent.startsWith("png: data:image/png;base")) return "on_export: " + $("#stylus-canvas-out").textContent;
const shot = new Image();
shot.src = $("#stylus-canvas-out").dataset.out;
await shot.decode();
if (shot.naturalWidth !== 1200 || shot.naturalHeight !== 800) return "the PNG's size: " + shot.naturalWidth + "x" + shot.naturalHeight;
const pix = document.createElement("canvas");
pix.width = 1200; pix.height = 800;
const pc = pix.getContext("2d", { willReadFrequently: true });
pc.drawImage(shot, 0, 0);
if ([...pc.getImageData(5, 5, 1, 1).data].join() !== "255,255,255,255") return "the PNG's paper: " + [...pc.getImageData(5, 5, 1, 1).data].join();
const dark = pc.getImageData(0, 0, 1200, 800).data;
let inked = 0;
for (let i = 0; i < dark.length; i += 4) if (dark[i] < 200) inked++;
if (inked < 200) return "the PNG holds no strokes: " + inked;
await tap(btn("Data"));
if ($("#stylus-canvas-out").textContent !== 'data: {"width":1200,"height"') return "on_export data: " + $("#stylus-canvas-out").textContent;
const out = JSON.parse($("#stylus-canvas-out").dataset.out);
if (out.width !== 1200 || out.strokes.length !== data().length) return "the data: " + out.strokes.length + " of " + data().length;

// Turning the tablet keeps the strokes and refits.
const turned = innerWidth > innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", turned ? { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true } : { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true });
await wait(350);
if (data().length !== 3) return "turning lost strokes: " + data().length;
if (!inkAt(420, 260)) return "turning lost the painted page";
const v = stage.getBoundingClientRect();
if (Math.abs(rect().width - Math.min(v.width, v.height * 1.5)) > 2) return "the page does not fit after turning: " + rect().width + " in " + v.width + "x" + v.height;
// The tools change sides with the room, by the box's width.
const bar = $(".ui-stylus-canvas-bar").getBoundingClientRect();
const wide = innerWidth > 1000;
if (wide !== (bar.height > bar.width)) return "the tools at " + innerWidth + ": " + bar.width + "x" + bar.height;
await cdp("Emulation.setDeviceMetricsOverride", turned ? { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true } : { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
await wait(350);
