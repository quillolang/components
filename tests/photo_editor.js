// mobile
const box = () => $(".ui-photo-editor");
const file = () => box().querySelector(".ui-photo-editor-open input");
const carry = () => box().querySelector("input[name=photo]");
const canvas_el = () => box().querySelector("canvas");
const sheet = () => box().querySelector(".ui-photo-editor-sheet");
const note = () => $("#photo-editor-demo-note").textContent;
const button = (t) => [...$$("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent).trim() === t);
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
const steps = () => parseInt(box().dataset.steps);
const make = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")); return c; };
const png = async (c, name = "x.png") => new File([await new Promise((r) => c.toBlob(r, "image/png"))], name, { type: "image/png" });
const pick = async (f) => {
    const dt = new DataTransfer(); dt.items.add(f);
    file().files = dt.files;
    file().dispatchEvent(new Event("change", { bubbles: true }));
    await wait(120);
    await until(() => box().dataset.state === "ready" || box().dataset.state === "bad");
    await wait(60);
};
const save = async () => {
    await tap(button("Done"));
    await until(() => /Saved:/.test(box().textContent));
    await wait(60);
    const f = carry().files[0];
    const b = await createImageBitmap(f);
    const c = make(b.width, b.height, (g) => g.drawImage(b, 0, 0));
    const g = c.getContext("2d", { willReadFrequently: true });
    return { w: b.width, h: b.height, at: (x, y) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3) };
};
const near = (p, c, by = 40) => Math.abs(p[0] - c[0]) < by && Math.abs(p[1] - c[1]) < by && Math.abs(p[2] - c[2]) < by;
const R = [230, 0, 0], G = [0, 200, 0], B = [0, 0, 230], Y = [240, 230, 0];
const four = async (out, a, b, c, d, what) => {
    const pts = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
    const want = [a, b, c, d];
    for (let i = 0; i < 4; i++) { const p = out.at(out.w * pts[i][0], out.h * pts[i][1]); if (!near(p, want[i])) return `${what}: quarter ${i} is ${p}, not ${want[i]}`; }
};
// The demo's picture opens by itself and can be saved: an SVG in a data address taints nothing.
if (!await until(() => box().dataset.state === "ready")) return `the demo's picture: ${box().dataset.state}: ${box().textContent}`;
if (canvas_el().width !== 900 || canvas_el().height !== 675) return `the view is ${canvas_el().width} by ${canvas_el().height}`;
const scene = await save();
if (scene.w !== 640 || scene.h !== 480) return `the demo saved ${scene.w} by ${scene.h}`;
if (!near(scene.at(460, 150), [234, 111, 90])) return `the sun is ${scene.at(460, 150)}`;
if (note() !== "on_done got photo.jpg, 640 by 480.") return `on_done: ${note()}`;

// Four quarters, to see each thing done to them.
const pic = make(200, 100, (g) => {
    g.fillStyle = "rgb(230,0,0)"; g.fillRect(0, 0, 100, 50); g.fillStyle = "rgb(0,200,0)"; g.fillRect(100, 0, 100, 50);
    g.fillStyle = "rgb(0,0,230)"; g.fillRect(0, 50, 100, 50); g.fillStyle = "rgb(240,230,0)"; g.fillRect(100, 50, 100, 50);
});
await pick(await png(pic));
if (box().dataset.state !== "ready" || steps() !== 0) return `a new picture: ${box().dataset.state} ${steps()}`;
if (note() !== "Not saved yet." || carry().files.length !== 0) return `the old result stays: ${note()}`;
if (button("Undo").disabled !== true) return "Undo is on with nothing to undo";
let out = await save(), bad;
if (out.w !== 200 || out.h !== 100) return `untouched it is ${out.w} by ${out.h}`;
if ((bad = await four(out, R, G, B, Y, "untouched"))) return bad;

// A quarter turn right: width and height swap, and the left edge goes to the top.
await tap(button("Rotate right"));
if (carry().files.length !== 0 || note() !== "Not saved yet.") return "a change keeps the old file";
if (box().dataset.turns !== "1" || canvas_el().height <= canvas_el().width) return `turned: ${box().dataset.turns}`;
out = await save();
if (out.w !== 100 || out.h !== 200) return `turned it is ${out.w} by ${out.h}`;
if ((bad = await four(out, B, R, Y, G, "right"))) return bad;
await tap(button("Rotate left"));
await tap(button("Rotate left"));
out = await save();
if ((bad = await four(out, G, Y, R, B, "left"))) return bad;
// Undo goes back one step at a time.
await tap(button("Undo"));
if (box().dataset.turns !== "0" || steps() !== 2) return `undo: ${box().dataset.turns} ${steps()}`;
await tap(button("Undo"));
await tap(button("Undo"));
if (box().dataset.turns !== "0" || steps() !== 0) return `undone: ${box().dataset.turns} ${steps()}`;
out = await save();
if (out.w !== 200 || (bad = await four(out, R, G, B, Y, "undone"))) return bad ?? `undone it is ${out.w} wide`;

// The crop: the bottom right handle dragged in by half each way keeps the top left quarter.
const pos = () => { const s = sheet(); return { x: parseFloat(s.style.getPropertyValue("--x") || "0"), y: parseFloat(s.style.getPropertyValue("--y") || "0"), w: parseFloat(s.style.getPropertyValue("--w") || "1"), h: parseFloat(s.style.getPropertyValue("--h") || "1") }; };
sheet().scrollIntoView({ block: "center" });
await wait(80);
const s = sheet().getBoundingClientRect();
const se = box().querySelector(".ui-photo-editor-se");
const before = steps();
await drag(se, 2, 1);
if (steps() !== before) return "a slip of a finger made a step";
await drag(se, -s.width / 2, -s.height / 2);
if (steps() !== before + 1) return `a crop is ${steps() - before} steps`;
if (Math.abs(pos().w - 0.5) > 0.02 || Math.abs(pos().h - 0.5) > 0.02) return `the crop: ${JSON.stringify(pos())}`;
out = await save();
if (Math.abs(out.w - 100) > 5 || Math.abs(out.h - 50) > 3) return `cropped it is ${out.w} by ${out.h}`;
if ([[0.5, 0.5], [0.15, 0.15], [0.85, 0.85]].some(([x, y]) => !near(out.at(out.w * x, out.h * y), R))) return "the crop kept more than the quarter";
// Moved by its middle: to the top right quarter.
const body = box().querySelector(".ui-photo-editor-box");
await drag(body, s.width / 2, 0);
out = await save();
if ([[0.5, 0.5], [0.15, 0.15], [0.85, 0.85]].some(([x, y]) => !near(out.at(out.w * x, out.h * y), G))) return `the moved crop is ${out.at(out.w / 2, out.h / 2)}`;
// It stops at the edge of the picture.
await drag(body, s.width, s.height);
if (Math.abs(pos().x + pos().w - 1) > 0.001 || Math.abs(pos().y + pos().h - 1) > 0.001) return `off the edge: ${JSON.stringify(pos())}`;
// A handle cannot pass the one across from it.
const nw = box().querySelector(".ui-photo-editor-nw");
await drag(nw, s.width, s.height);
if (Math.abs(pos().w - 0.05) > 0.001 || Math.abs(pos().h - 0.05) > 0.001) return `the smallest crop: ${JSON.stringify(pos())}`;
await tap(button("Undo"));
// A cancelled drag changes nothing.
const was = JSON.stringify(pos()), n0 = steps();
const m = middle(body);
await fingers("touchStart", [m]);
await fingers("touchMove", [{ x: m.x - 30, y: m.y }]);
await wait(30);
if (JSON.stringify(pos()) === was) return "the box does not follow the finger";
await fingers("touchCancel", []);
await wait(60);
if (JSON.stringify(pos()) !== was || steps() !== n0) return "a cancelled drag changed the crop";

// What the crop's place reads changes during a drag: a key on it. It stays under the finger.
{
    const n = steps(), m2 = middle(body);
    await fingers("touchStart", [m2]);
    await fingers("touchMove", [{ x: m2.x - 20, y: m2.y }]);
    await fingers("touchMove", [{ x: m2.x - 40, y: m2.y }]);
    await wait(120);    // the last move has landed
    const moving = JSON.stringify(pos());
    key(body, "ArrowUp");
    await wait(80);
    if (JSON.stringify(pos()) !== moving || steps() !== n) return `the crop jumped during a drag: ${moving} to ${JSON.stringify(pos())}`;
    await fingers("touchCancel", []);
    await wait(60);
    if (steps() !== n) return "a key during a drag made a step";
}

// A rotation carries the crop with it: the bottom right quarter, turned right, is the bottom left.
await tap(button("Rotate right"));
out = await save();
if (Math.abs(out.w - 50) > 3 || Math.abs(out.h - 100) > 5 || !near(out.at(out.w / 2, out.h / 2), Y)) return `a turned crop is ${out.w} by ${out.h}, ${out.at(out.w / 2, out.h / 2)}`;
if (Math.abs(pos().x) > 0.001 || Math.abs(pos().y - 0.5) > 0.001 || Math.abs(pos().w - 0.5) > 0.001) return `the turned crop's box: ${JSON.stringify(pos())}`;

// The crop's keys, and its sliders: the equals of the handles.
await tap(button("Reset"));
if (Math.abs(pos().w - 1) > 0.001 || box().dataset.turns !== "0") return "Reset leaves something";
key(body, "ArrowRight");
await wait(60);
if (pos().x !== 0) return "a box as big as the picture moved";
const sliders = () => [...box().querySelectorAll(".ui-photo-editor-panel input[type=range]")];
if (sliders().map((x) => x.getAttribute("aria-label")).join() !== "Left edge of the crop, percent,Top edge of the crop, percent,Right edge of the crop, percent,Bottom edge of the crop, percent") return "the sliders are not named";
const slide = async (el, v) => { el.focus(); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); await wait(60); };
const n1 = steps();
await slide(sliders()[0], 50);
if (Math.abs(pos().x - 0.5) > 0.001 || Math.abs(pos().w - 0.5) > 0.001 || steps() !== n1 + 1) return `the Left slider: ${JSON.stringify(pos())}`;
await slide(sliders()[1], 50);
if (document.activeElement !== sliders()[1]) return "a slider loses focus when it moves";
out = await save();
if (Math.abs(out.w - 100) > 2 || Math.abs(out.h - 50) > 2 || !near(out.at(out.w / 2, out.h / 2), Y)) return `by sliders it is ${out.w} by ${out.h}`;
await slide(sliders()[2], 10);   // past the left edge: held 5 percent to its right
if (Math.abs(pos().w - 0.05) > 0.001) return `a slider past its partner: ${JSON.stringify(pos())}`;
if (sliders()[2].value !== "55") return `a held slider's thumb is at ${sliders()[2].value}, not 55`;
await slide(sliders()[2], 12);   // and again, where the held value does not change at all
if (sliders()[2].value !== "55") return `a held slider's thumb is at ${sliders()[2].value}, not 55`;
const hk = box().querySelector(".ui-photo-editor-se");
key(hk, "ArrowRight"); await wait(60);
if (Math.abs(pos().w - 0.06) > 0.002) return `a handle's key: ${JSON.stringify(pos())}`;
await tap(button("Reset"));

// With another tool the crop still shows, and a finger goes through it.
await slide(sliders()[0], 25);
await tap(button("Light"));
const off_box = box().querySelector(".ui-photo-editor-box");
if (!off_box.classList.contains("ui-photo-editor-box-off") || getComputedStyle(off_box).pointerEvents !== "none") return "the crop catches fingers under another tool";
if (box().querySelector(".ui-photo-editor-handle")) return "the handles stay under another tool";
await tap(button("Crop"));
if (Math.abs(pos().x - 0.25) > 0.001) return `the crop did not stay: ${JSON.stringify(pos())}`;
await tap(button("Reset"));

// The light: 100 grey, at +50, is 150; at -50, 50: what CSS brightness() would give.
const grey = await png(make(60, 40, (g) => { g.fillStyle = "rgb(100,100,100)"; g.fillRect(0, 0, 60, 40); }));
await pick(grey);
await tap(button("Light"));
const light = () => box().querySelector(".ui-photo-editor-panel input[type=range]");
const nl = steps();
await slide(light(), 50);
if (box().dataset.light !== "50" || steps() !== nl + 1) return `the light: ${box().dataset.light} ${steps()}`;
if (!/\+50/.test(box().querySelector("output").textContent)) return "the light does not show its value";
out = await save();
if (!near(out.at(30, 20), [150, 150, 150], 4)) return `+50: ${out.at(30, 20)}`;
const seen = canvas_el().getContext("2d").getImageData(100, 100, 1, 1).data[0];
if (Math.abs(seen - 150) > 3) return `the view shows ${seen}`;
await slide(light(), -50);
out = await save();
if (!near(out.at(30, 20), [50, 50, 50], 4)) return `-50: ${out.at(30, 20)}`;
// Sliding without letting go is tried, not kept.
const nt = steps();
light().value = 100;
light().dispatchEvent(new Event("input", { bubbles: true }));
await wait(60);
if (steps() !== nt) return "a slider's move made a step";
if (Math.abs(canvas_el().getContext("2d").getImageData(100, 100, 1, 1).data[0] - 200) > 3) return "the view does not follow the slider";
light().dispatchEvent(new Event("change", { bubbles: true }));
await wait(60);
out = await save();
if (!near(out.at(30, 20), [200, 200, 200], 4)) return `+100: ${out.at(30, 20)}`;

// Straighten: one colour, so any corner showing white would be seen.
const plain = await png(make(300, 200, (g) => { g.fillStyle = "rgb(0,120,200)"; g.fillRect(0, 0, 300, 200); }));
await pick(plain);
await tap(button("Level"));
const ruler = box().querySelector(".ui-photo-editor-ruler");
ruler.scrollIntoView({ block: "center" });
await wait(80);
const angle = () => parseFloat(box().dataset.angle);
if (ruler.getAttribute("role") !== "slider" || ruler.getAttribute("aria-valuemax") !== "15") return "the ruler is not a slider";
// Short of the threshold, nothing; a drag of 100 px is 10 degrees.
await drag(ruler, 4, 0);
if (angle() !== 0 || steps() !== 0) return `a slip leaned it: ${angle()}`;
await drag(ruler, 100, 0);
if (Math.abs(angle() - 10) > 0.8) return `a drag of 100 is ${angle()}`;
if (canvas_el().style.transform !== "") return "the turning stays on the canvas";
out = await save();
if (out.w !== 300 || out.h !== 200) return `straightened it is ${out.w} by ${out.h}`;
for (const [x, y] of [[2, 2], [297, 2], [2, 197], [297, 197]]) if (!near(out.at(x, y), [0, 120, 200], 30)) return `a corner shows at ${x},${y}: ${out.at(x, y)}`;
// During a drag the canvas turns by transform; nothing is drawn or kept until it ends.
const n2 = steps();
const q = middle(ruler);
await fingers("touchStart", [q]);
for (const dx of [10, 20, 30, 40]) { await fingers("touchMove", [{ x: q.x + dx, y: q.y }]); await wait(16); }
if (!/rotate\(/.test(canvas_el().style.transform) || steps() !== n2) return `in a drag: ${canvas_el().style.transform}`;
await fingers("touchCancel", []);
await wait(60);
if (steps() !== n2 || canvas_el().style.transform !== "" || Math.abs(angle() - parseFloat(ruler.getAttribute("aria-valuenow"))) > 0.01) return "a cancelled drag changed the angle";
// Up and down is the page's.
const a0 = angle();
await drag(ruler, 2, 120);
if (angle() !== a0) return `a vertical drag leaned it: ${angle()}`;
ruler.scrollIntoView({ block: "center" });
await wait(100);
// What the ruler's place reads changes during a drag: a key on it. Nothing jumps, and the
// finger's angle is what lands.
{
    const a1 = angle(), n = steps(), p = middle(ruler);
    await fingers("touchStart", [p]);
    for (const dx of [-10, -20, -30, -40]) { await fingers("touchMove", [{ x: p.x + dx, y: p.y }]); await wait(16); }
    await until(() => /rotate\(-4deg\)/.test(canvas_el().style.transform), 800);    // the last move has landed
    const turning = canvas_el().style.transform;
    const place = () => getComputedStyle(ruler.querySelector(".ui-photo-editor-ticks") ?? ruler).backgroundPositionX;
    const ticks = place();
    key(ruler, "ArrowRight");
    await wait(80);
    if (steps() !== n || canvas_el().style.transform !== turning) return `a key during a drag: ${steps() - n} steps, ${canvas_el().style.transform}`;
    if (place() !== ticks) return `the ruler jumped during a drag: ${ticks} to ${place()}`;
    await fingers("touchMove", [{ x: p.x - 50, y: p.y }]);
    await wait(30);
    await fingers("touchEnd", []);
    await wait(120);
    if (Math.abs(angle() - (a1 - 5)) > 0.2 || steps() !== n + 1) return `a drag after a key landed at ${angle()}, not ${a1 - 5}`;
    await tap(button("Undo"));
}

// Past the end it holds at 15.
await drag(ruler, Math.min(160, innerWidth / 2 - 30), 0);
await drag(ruler, Math.min(160, innerWidth / 2 - 30), 0);
if (angle() !== 15) return `past the end: ${angle()}`;
// Keys and buttons.
key(ruler, "Home"); await wait(60);
if (angle() !== 0) return `Home: ${angle()}`;
key(ruler, "ArrowRight"); await wait(60);
if (angle() !== 0.5) return `ArrowRight: ${angle()}`;
await tap(button("Lean left"));
await tap(button("Lean left"));
if (angle() !== -0.5) return `Lean left: ${angle()}`;
await tap(button("Lean right"));
if (angle() !== 0) return `Lean right: ${angle()}`;
if (carry().files.length !== 0) return "a change keeps the old file";

// Undo takes it all back, step by step.
while (steps() > 0) await tap(button("Undo"));
if (angle() !== 0 || button("Undo").disabled !== true) return "Undo does not reach the start";

// Not a picture; a broken one: what is open stays open.
await pick(new File(["x"], "a.txt", { type: "text/plain" }));
if (!/not a picture/.test(box().textContent) || box().dataset.state !== "ready") return `a text file: ${box().dataset.state}`;
await pick(new File([new Uint8Array(9)], "b.png", { type: "image/png" }));
if (!/could not be read/.test(box().textContent) || box().dataset.state !== "ready") return `a broken picture: ${box().dataset.state}`;

// A picture its site will not let be read: an SVG with HTML in it taints a canvas in Chrome.
const foreign = new File([`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><foreignObject width="80" height="60"><div xmlns="http://www.w3.org/1999/xhtml" style="background:red;height:60px">x</div></foreignObject></svg>`], "t.svg", { type: "image/svg+xml" });
await pick(foreign);
if (box().dataset.state === "ready" && !/could not be read/.test(box().textContent)) {
    await tap(button("Done"));
    await wait(200);
    if (/Saved:/.test(box().textContent)) { /* this Chrome did not taint it: nothing to learn */ }
    else if (!/cannot be saved here/.test(box().textContent) || box().dataset.state !== "ready") return `a tainted picture: ${box().dataset.state}: ${box().textContent}`;
}

// A tablet puts the tools beside the picture.
const cols = getComputedStyle(box().querySelector(".ui-photo-editor-body")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return `${device} has ${cols} columns`;
