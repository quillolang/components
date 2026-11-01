// tablet
await wait(300);
const plain = $("#handwritten-note-plain");
if (plain.querySelector("input[name=note-bad]").value !== "[[]]") return "bad pages: " + plain.querySelector("input[name=note-bad]").value;
plain.remove();
const book = () => JSON.parse($("input[name=note-demo]").value);
const sheet = $(".ui-handwritten-note-sheet"), scroller = $(".ui-handwritten-note-scroll");
const count = () => $(".ui-handwritten-note-count").textContent;
const state = () => $("#handwritten-note-state").textContent;
const btn = (t) => $$(".ui-handwritten-note-btn").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const at = (x, y) => { const r = sheet.getBoundingClientRect(); return { x: r.left + x * r.width / 800, y: r.top + y * r.height / 1200 }; };
const pen = (type, p, o = {}) => cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, pointerType: "pen", button: "left", buttons: 1, clickCount: 1, ...o });
const write = async (points, force = 0.5) => {
    await pen("mousePressed", at(...points[0]), { force });
    for (const p of points.slice(1)) await pen("mouseMoved", at(...p), { force });
    const l = points[points.length - 1];
    await pen("mouseReleased", at(...l), { buttons: 0, force: 0 });
    await wait(80);
};
if (count() !== "Page 1 of 3") return "start: " + count();

// The rules are on a share of the page, so they scale with it: 44 of 1200.
if (sheet.getAttribute("style")) return "the sheet a swipe moves has a style from the markup: " + sheet.getAttribute("style");
const rule = getComputedStyle(sheet).getPropertyValue("--rule").trim();
if (Math.abs(parseFloat(rule) - 44 * 100 / 1200) > 0.001) return "the rule's gap: " + rule;

// The pen writes, in the page's units; width 3 * (0.25 + 1.5 * 0.5) = 3, at 1.0, 5.25.
await write([[200, 300], [260, 310], [320, 300]]);
let b = book();
if (b[0].length !== 2) return "the pen did not write: " + b[0].length;
if (b[0][1].points.map((p) => Math.round(p[0])).join() !== "200,260,320") return "points: " + JSON.stringify(b[0][1].points);
if (b[0][1].points[0][2] !== 3) return "the pen's width: " + b[0][1].points[0][2];
if (state() !== "3 pages, 3 strokes.") return "on_change: " + state();

// A finger scrolls up and down, and writes nothing.
if (scroller.scrollHeight <= scroller.clientHeight) return "the page should be taller than the screen here";
await drag(sheet, 0, -200, 200);
await wait(150);
const top1 = scroller.scrollTop;
if (top1 < 100) return "a finger should scroll: " + top1;
if (book()[0].length !== 2) return "a finger wrote: " + book()[0].length;
scroller.scrollTop = 0;
await wait(80);

// A short sideways drag springs back.
await drag(sheet, -60, 0, 400);
if (count() !== "Page 1 of 3") return "a short slow drag turned the page: " + count();
if (sheet.style.transform !== "") return "it did not spring back: " + sheet.style.transform;
// Held mid-way it follows the finger, past the 10 pixels that lock it.
const m = middle(sheet);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 20, y: m.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 150, y: m.y }] });
await wait(60);
if (sheet.style.transform !== "translateX(-150px)") return "the page should follow: " + sheet.style.transform;
// A state changing under the finger leaves the page where the finger has it.
btn("Eraser").click();
await wait(60);
if (sheet.style.transform !== "translateX(-150px)") return "a state change mid-swipe moved the page: " + sheet.style.transform;
btn("Pen").click();
// The sheet's own class changes with this one, which is what would rewrite a style on it.
btn("Fingers write").click();
await wait(60);
if (sheet.style.transform !== "translateX(-150px)") return "a state on the sheet itself moved the page: " + sheet.style.transform;
btn("Fingers write").click();
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 170, y: m.y }] });
await wait(60);
if (sheet.style.transform !== "translateX(-170px)") return "the swipe did not go on after a state change: " + sheet.style.transform;
// A cancel puts it back and turns nothing.
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(120);
if (count() !== "Page 1 of 3" || sheet.style.transform !== "") return "a cancelled swipe: " + count() + " " + sheet.style.transform;
// Far enough turns it: 30% of the page's width and more.
await drag(sheet, -Math.round(sheet.clientWidth * 0.4), 0, 400);
if (count() !== "Page 2 of 3") return "a long swipe: " + count();
if (book()[1].length !== 1) return "a swipe wrote: " + JSON.stringify(book()[1].length);
// A flick is short of 30% but fast: 160 pixels in under 300 ms is over half a pixel a millisecond.
await drag(sheet, -160, 0, 40);
if (count() !== "Page 3 of 3") return "a flick: " + count();
// Past the last page it gives a little and stays.
await drag(sheet, -300, 0, 300);
if (count() !== "Page 3 of 3") return "past the end: " + count();
// Back again with a swipe the other way.
await drag(sheet, Math.round(sheet.clientWidth * 0.4), 0, 300);
if (count() !== "Page 2 of 3") return "a swipe back: " + count();

// A pen drawn sideways writes, however fast, and turns nothing.
await write([[100, 500], [700, 500]]);
if (count() !== "Page 2 of 3" || book()[1].length !== 2) return "a pen should write across: " + count() + " " + book()[1].length;

// Buttons, keys and the new page, which are the equals of a swipe.
await tap(btn("Next page"));
if (count() !== "Page 3 of 3") return "Next: " + count();
if (!btn("Next page").disabled) return "Next is not disabled at the end";
scroller.focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
await wait(60);
if (count() !== "Page 2 of 3") return "the left arrow: " + count();
await tap(btn("New page"));
if (count() !== "Page 4 of 4" || book().length !== 4) return "New page: " + count();
if (book()[3].length !== 0) return "a new page should be empty";
if (state() !== "4 pages, 4 strokes.") return "on_change after a page: " + state();

// Undo goes back to the page it belongs to.
await tap(btn("Undo"));
if (count() !== "Page 2 of 4" || book()[1].length !== 1) return "undo on another page: " + count() + " " + book()[1].length;
// The eraser takes a stroke; undo returns it.
await tap(btn("Eraser"));
await write([[240, 180], [240, 200]]);
if (book()[1].length !== 0) return "the eraser: " + book()[1].length;
await tap(btn("Undo"));
if (book()[1].length !== 1) return "undo of the eraser: " + book()[1].length;
await tap(btn("Pen"));

// A stroke the system cancels is not kept. The finger is let write for that, and a finger then writes.
await tap(btn("Fingers write"));
const p = at(300, 700);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + 50, y: p.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(80);
if (book()[1].length !== 1) return "a cancelled stroke was kept: " + book()[1].length;
await drag(sheet, 40, 30, 100);
if (book()[1].length !== 2) return "Fingers write: " + book()[1].length;
await tap(btn("Undo"));
await tap(btn("Fingers write"));

// Export: each page in order; a PNG of the page's size, with the rule at 44 and the margin at 110.
await tap(btn("Export page"));
if ($("#handwritten-note-out").textContent.trim() !== "2:png") return "export a page: " + $("#handwritten-note-out").textContent;
await tap(btn("Export all"));
if ($("#handwritten-note-out").textContent.trim() !== "2:png 1:png 2:png 3:png 4:png") return "export all: " + $("#handwritten-note-out").textContent;

const shot = new Image();
shot.src = $("#handwritten-note-out").dataset.png;
await shot.decode();
if (shot.naturalWidth !== 800 || shot.naturalHeight !== 1200) return "the PNG's size: " + shot.naturalWidth + "x" + shot.naturalHeight;
const pix = document.createElement("canvas");
pix.width = 800; pix.height = 1200;
const pc = pix.getContext("2d", { willReadFrequently: true });
pc.drawImage(shot, 0, 0);
const rgb = (x, y) => [...pc.getImageData(x, y, 1, 1).data].slice(0, 3).join();
// The last page is empty: white paper, a rule on 44 and each 44 after, the margin on 110.
if (rgb(400, 66) !== "255,255,255") return "the paper: " + rgb(400, 66);
if (rgb(400, 44) !== "200,212,230" || rgb(400, 88) !== "200,212,230") return "a rule: " + rgb(400, 44) + " " + rgb(400, 88);
if (rgb(110, 66) !== "230,169,172") return "the margin: " + rgb(110, 66);

// Turning the tablet keeps the page and the place in it.
await tap(btn("Last page"));
const room = () => scroller.scrollHeight - scroller.clientHeight;
scroller.scrollTop = room() / 2;
await wait(80);
const share = scroller.scrollTop / room(), was = count();
const turned = innerWidth > innerHeight;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await (turned ? size(820, 1180) : size(1180, 820));
await wait(350);
if (count() !== was) return "turning changed the page: " + count();
if (Math.abs(scroller.scrollTop / room() - share) > 0.02) return "turning lost the place: " + scroller.scrollTop / room() + " from " + share;
if (getComputedStyle($(".ui-handwritten-note-side")).display !== (innerWidth > 1000 ? "flex" : "none")) return "the pages' list at " + innerWidth;
await (turned ? size(1180, 820) : size(820, 1180));
await wait(350);
if (innerWidth > 1000) {
    const tabs = $$(".ui-handwritten-note-tab");
    if (tabs.length !== 4 || tabs[0].getAttribute("aria-current") !== "page") return "the side list: " + tabs.length;
    await tap(tabs[2]);
    if (count() !== "Page 3 of 4") return "a page from the side: " + count();
}
