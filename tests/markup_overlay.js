// tablet
await wait(300);
const bad = $("#markup-overlay-bad");
const badKept = JSON.parse(bad.querySelector("input[name=markup-bad]").value);
if (badKept.length !== 1 || badKept[0].text !== "<b>ok</b>" || badKept[0].id !== "m1") return "bad marks: " + JSON.stringify(badKept);
if (!bad.querySelector("#markup-overlay-page")) return "a page given as children is not shown";
if (!bad.querySelector("text") || bad.querySelector("text").textContent !== "<b>ok</b>") return "a text mark is not shown as text";
bad.remove();
const data = () => JSON.parse($("input[name=markup-demo]").value);
const layer = $(".ui-markup-overlay-layer");
const note = () => $("#markup-overlay-note").textContent;
const btn = (t) => $$(".ui-markup-overlay-btn").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const at = (x, y) => { const r = layer.getBoundingClientRect(); return { x: r.left + x * r.width / 1000, y: r.top + y * r.height / 750 }; };
const pen = (type, p, o = {}) => cdp("Input.dispatchMouseEvent", { type, x: p.x, y: p.y, pointerType: "pen", button: "left", buttons: 1, clickCount: 1, force: 0.5, ...o });
const line = async (points) => {
    await pen("mousePressed", at(...points[0]));
    for (const p of points.slice(1)) await pen("mouseMoved", at(...p));
    const l = points[points.length - 1];
    await pen("mouseReleased", at(...l), { buttons: 0, force: 0 });
    await wait(80);
};
const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;
// The image is what it was: marks go in the data and on the layer over it.
const src = $(".ui-markup-overlay-frame img").getAttribute("src");
if (!src.startsWith("data:image/svg")) return "the image: " + src.slice(0, 30);
if (data().length !== 2) return "start: " + data().length;
const head = $(".ui-markup-overlay-layer polygon").getAttribute("points");
// A line from 700,80 to 640,240 has length 170.88; 26 back along it stands at 649.13,215.66, and 13 across gives the corners.
if (head !== "640,240 637,211.1 661.3,220.2") return "the arrow's head: " + head;

// Fingers mark until a pen is seen.
await tap(btn("Highlight"));
await drag(layer, 60, 0, 120);
if (data().length !== 3 || data()[2].kind !== "highlight") return "a finger with Highlight: " + JSON.stringify(data().at(-1));
if (note() !== "3 marks.") return "on_change: " + note();
if (getComputedStyle(layer).touchAction !== "none") return "touch-action while a finger marks: " + getComputedStyle(layer).touchAction;
// The live line was only for the drag.
if ($(".ui-markup-overlay-live").getAttribute("d") !== "") return "the live line stayed";
await tap(btn("Undo"));

// The pen: a line in the picture's units, kept smooth.
await tap(btn("Pen"));
await line([[100, 650], [200, 700], [300, 650]]);
let m = data().at(-1);
if (m.kind !== "pen" || m.points.length !== 3 || !near(m.points[1][0], 200) || !near(m.points[1][1], 700)) return "a pen line: " + JSON.stringify(m);
const path = $$(".ui-markup-overlay-layer path").find((p) => p.getAttribute("data-id") === m.id);
if (!path || path.namespaceURI !== "http://www.w3.org/2000/svg") return "the mark is not an SVG path";
if (!/^M[\d.]+ [\d.]+ Q[\d.]+ [\d.]+ [\d.]+ [\d.]+ L[\d.]+ [\d.]+$/.test(path.getAttribute("d"))) return "the path: " + path.getAttribute("d");
if (path.getBoundingClientRect().width < 50) return "the path is not drawn";
// A finger after the pen leaves the picture alone, and the layer lets the finger pan.
if (getComputedStyle(layer).touchAction === "none") return "touch-action after a pen: " + getComputedStyle(layer).touchAction;
const n1 = data().length;
await drag(layer, 40, 40, 120);
if (data().length !== n1) return "a finger marked after the pen: " + data().length;
await tap(btn("Fingers mark"));
if (getComputedStyle(layer).touchAction !== "none") return "Finger did not bring fingers back";
await tap(btn("Fingers mark"));

// An arrow by pen; a press with no length is none, and a cancel leaves nothing.
await tap(btn("Arrow"));
const n2 = data().length;
await line([[100, 100], [100, 101]]);
if (data().length !== n2) return "a press made an arrow";
await line([[100, 100], [300, 100]]);
m = data().at(-1);
if (m.kind !== "arrow" || m.points.length !== 2 || !near(m.points[1][0], 300)) return "an arrow: " + JSON.stringify(m);
await tap(btn("Fingers mark"));
const p0 = at(400, 500);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p0] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x + 80, y: p0.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(80);
if (data().length !== n2 + 1) return "a cancelled arrow was kept";
await tap(btn("Fingers mark"));

// Text: tap where it goes, type, Enter. Escape leaves nothing.
await tap(btn("Text"));
await tap(layer);
let field = $(".ui-markup-overlay-field");
if (!field || document.activeElement !== field) return "Text does not open a focused field";
type(field, "Check this");
await wait(40);
key(field, "Enter");
await wait(120);
m = data().at(-1);
if (m.kind !== "text" || m.text !== "Check this") return "a text mark: " + JSON.stringify(m);
if ($(".ui-markup-overlay-field")) return "the field stayed";
await tap(layer);
field = $(".ui-markup-overlay-field");
type(field, "Not this");
await wait(40);
key(field, "Escape");
await wait(120);
if (data().some((x) => x.text === "Not this")) return "Escape kept the text";

// Select: tap a mark near it, drag it, the data moves by what the finger moved.
await tap(btn("Select"));
const id = data()[0].id, was = data()[0].points[0];
const e0 = at(700, 80);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [e0] });
for (let i = 1; i <= 4; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: e0.x, y: e0.y + i * 20 }] });
// A state changing mid-drag leaves the mark where the finger has it.
await wait(60);
const moving = $(".ui-markup-overlay-layer [transform]");
const heldThere = moving && moving.getAttribute("transform");
if (!heldThere) return "the mark does not follow the finger";
$$(".ui-markup-overlay-swatch")[1].click();
await wait(60);
if ($(".ui-markup-overlay-layer [transform]")?.getAttribute("transform") !== heldThere) return "a state change mid-drag moved the mark: " + heldThere;
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(120);
const by = 80 * 1000 / layer.getBoundingClientRect().width;
if (data()[0].id !== id || !near(data()[0].points[0][1], was[1] + by, 3) || data()[0].points[0][0] !== was[0]) return "a dragged mark: " + JSON.stringify(data()[0]) + " by " + by;
if ($(".ui-markup-overlay-layer [transform]")) return "the move's transform stayed";
// And by keys, 10 at a time, 40 with Shift.
const frame = $(".ui-markup-overlay-frame");
frame.focus();
const y0 = data()[0].points[0][1];
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await wait(80);
if (!near(data()[0].points[0][1], y0 + 10, 0.2)) return "the arrow key: " + data()[0].points[0][1] + " from " + y0;
// Undo and redo, and Delete by key.
await tap(btn("Undo"));
if (!near(data()[0].points[0][1], y0, 0.2)) return "undo of a move";
await tap(btn("Redo"));
if (!near(data()[0].points[0][1], y0 + 10, 0.2)) return "redo of a move";
const n3 = data().length;
frame.focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Delete", code: "Delete", windowsVirtualKeyCode: 46 });
await wait(80);
if (data().length !== n3 - 1 || data().some((x) => x.id === id)) return "Delete: " + data().length;
await tap(btn("Undo"));
if (data().length !== n3) return "undo of a delete";

// The list is the route without a pointer: a row picks, Remove takes off, the form adds.
const rows = () => $$(".ui-markup-overlay-name");
if (rows().length !== n3) return "the list: " + rows().length;
if (rows()[1].textContent !== "2. Text: Move this socket") return "a row: " + rows()[1].textContent;
await tap(rows()[1]);
if (rows()[1].getAttribute("aria-pressed") !== "true" || btn("Delete").disabled) return "a row does not pick its mark";
const box = $(".ui-markup-overlay-note input");
box.focus();
type(box, "  Seen on site  ");
await wait(60);
$(".ui-markup-overlay-note button").click();
await wait(100);
if (data().at(-1).text !== "Seen on site" || box.value !== "") return "the note: " + JSON.stringify(data().at(-1)) + " " + box.value;
const removeBtn = btn("Remove " + rows().at(-1).textContent);
await tap(removeBtn);
if (data().some((x) => x.text === "Seen on site")) return "Remove";

// Marks stay in the picture's units when the tablet turns, and the picture stays whole.
const turned = innerWidth > innerHeight;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
const before = JSON.stringify(data());
await (turned ? size(820, 1180) : size(1180, 820));
await wait(300);
if (JSON.stringify(data()) !== before) return "turning changed the marks";
const f = frame.getBoundingClientRect(), s = $(".ui-markup-overlay-stage").getBoundingClientRect();
if (Math.abs(f.width / f.height - 1000 / 750) > 0.02) return "the picture's shape: " + f.width + "x" + f.height;
if (f.right > s.right + 1 || f.bottom > s.bottom + 1) return "the picture does not fit";
const side = $(".ui-markup-overlay-side").getBoundingClientRect();
if ((innerWidth >= 900) !== (side.left >= f.right - 1)) return "the list's place at " + innerWidth;
await (turned ? size(1180, 820) : size(820, 1180));
await wait(300);
