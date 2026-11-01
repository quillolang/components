// mobile
await wait(200);
const main = () => $("#widget-grid-main");
const tiles = () => [...main().querySelectorAll(".ui-wgrid-tile")];
const ids = () => tiles().map((t) => t.dataset.id).join();
const tile = (id) => main().querySelector(`[data-id="${id}"]`);
const told = () => $("#widget-grid-told").textContent;
const kept = () => JSON.parse($("#widget-grid-kept").textContent);
const edit = () => main().querySelector(".ui-wgrid-edit");
const editing = () => main().querySelector(".ui-wgrid").classList.contains("ui-wgrid-editing");
const tool = (s) => main().querySelector(s);
const said = () => main().querySelector(".ui-sr").textContent;
const calls = [];
window.quilloNative = { haptic: (k) => { calls.push(k); return Promise.resolve(true); } };
const done = (why) => { delete window.quilloNative; return why; };
const topOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + Math.min(30, r.width / 2), y: r.top + Math.min(24, r.height / 2) }; };

// Order and shapes from the data.
if (ids() !== "steps,water,sleep,weight,week,heart") return done("ids: " + ids());
const cols = getComputedStyle(main().querySelector(".ui-wgrid-grid")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 8 : 4)) return done("columns on " + device + ": " + cols);
const size = (id) => { const r = tile(id).getBoundingClientRect(); return [r.width, r.height]; };
const gap = 10, box = main().querySelector(".ui-wgrid-grid").getBoundingClientRect(), cell = (box.width - (cols - 1) * gap) / cols;
const near = (a, b) => Math.abs(a - b) < 1;
if (!near(size("steps")[0], 2 * cell + gap) || !near(size("steps")[1], 2 * cell + gap)) return done("2x2: " + size("steps") + " cell " + cell);
if (!near(size("water")[0], cell) || !near(size("water")[1], cell)) return done("1x1 is square: " + size("water"));
if (!near(size("weight")[0], 2 * cell + gap) || !near(size("weight")[1], cell)) return done("2x1: " + size("weight"));
if (!near(size("week")[0], 4 * cell + 3 * gap)) return done("4x2: " + size("week"));
if (tile("sleep").querySelector(".demo-widget-own")?.textContent !== "Own markup") return done("render: " + tile("sleep").textContent);
if (tile("steps").querySelector(".ui-wgrid-value").textContent !== "8,412") return done("value");

// First fit, by hand, on four columns: steps at 0,0 (2x2), water at 2,0, sleep at 3,0, weight at 2,1 (2x1),
// week at 0,2 (4x2), heart at 0,4. On eight: steps 0,0, water 2,0, sleep 3,0, weight 4,0, week 2,1 (too wide
// for the two columns left on row 0; row 1 from column 2 has room), heart 6,0, the hole week left.
const place = (id) => { const r = tile(id).getBoundingClientRect(); return [Math.round((r.left - box.left) / (cell + gap)), Math.round((r.top - box.top) / (cell + gap))].join(); };
const where = device === "tablet"
    ? { steps: "0,0", water: "2,0", sleep: "3,0", weight: "4,0", week: "2,1", heart: "6,0" }
    : { steps: "0,0", water: "2,0", sleep: "3,0", weight: "2,1", week: "0,2", heart: "0,4" };
for (const [id, at] of Object.entries(where)) if (place(id) !== at) return done(id + " stands at " + place(id) + ", not " + at);

// A tap opens; a short press too; long press does not.
await tap(tile("water"));
if (told() !== "opened water") return done("tap: " + told());
await hold(tile("heart"), 150);
if (told() !== "opened heart") return done("a short press is a tap: " + told());

// A finger that wanders does not lift. Nor does one the system takes.
const pw = topOf(tile("sleep"));
await fingers("touchStart", [pw]);
await wait(80);
await fingers("touchMove", [{ x: pw.x + 16, y: pw.y }]);
await wait(520);
await fingers("touchEnd", []);
await wait(100);
if (editing()) return done("a moved finger should not lift a tile");
await fingers("touchStart", [pw]);
await wait(80);
await fingers("touchCancel", []);
await wait(500);
if (editing()) return done("a cancelled press should not lift a tile");

// A long press lifts: Edit starts, the tile is chosen, and the click after it opens nothing.
calls.length = 0;
const toldBefore = told();
await hold(tile("sleep"), 620);
if (!editing()) return done("a long press should start Edit");
if (told() !== toldBefore) return done("a long press opens nothing: " + told());
if (!tile("sleep").classList.contains("ui-wgrid-picked")) return done("the tile is chosen");
if (calls[0] !== "medium") return done("felt: " + calls);
if (ids() !== "steps,water,sleep,weight,week,heart") return done("no move, no change: " + ids());
await tap(edit());
if (editing()) return done("Done ends it");

// The whole thing with one finger: hold sleep, then carry it onto steps, without lifting.
const from = topOf(tile("sleep")), r = tile("steps").getBoundingClientRect();
const restLeft = tile("sleep").getBoundingClientRect().left, restTop = tile("sleep").getBoundingClientRect().top;
await fingers("touchStart", [from]);
await wait(560);
if (!tile("sleep").classList.contains("ui-wgrid-lifted")) return done("it should be in the air under the finger");
const end = { x: r.left + 20, y: r.top + 20 };
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: from.x + (end.x - from.x) * i / 10, y: from.y + (end.y - from.y) * i / 10 }]); await wait(16); }
await wait(260);
// Nothing committed, and the others have made way: they stand where they will land.
if (ids() !== "steps,water,sleep,weight,week,heart") return done("nothing commits in the air: " + ids());
const during = {};
for (const id of ["steps", "water", "weight", "week", "heart"]) during[id] = tile(id).getBoundingClientRect();
const sleepR = tile("sleep").getBoundingClientRect();
if (!near(sleepR.left - restLeft, end.x - from.x) || !near(sleepR.top - restTop, end.y - from.y)) return done("under the finger: " + (sleepR.left - restLeft) + " for " + (end.x - from.x));
// A system cancel at this point: back as it was.
await fingers("touchCancel", []);
await wait(300);
if (ids() !== "steps,water,sleep,weight,week,heart") return done("cancel keeps it: " + ids());
if (tiles().some((t) => t.style.transform !== "")) return done("cancel leaves no transforms");
if (tile("sleep").classList.contains("ui-wgrid-lifted")) return done("cancel lands the tile");
// Edit stays on. A drag at once this time: no long press in Edit.
if (!editing()) return done("still in Edit");
const pre = topOf(tile("sleep"));
await fingers("touchStart", [pre]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: pre.x + (end.x - pre.x) * i / 10, y: pre.y + (end.y - pre.y) * i / 10 }]); await wait(16); }
await wait(260);
const mid = {};
for (const id of ["steps", "water", "weight", "week", "heart"]) mid[id] = tile(id).getBoundingClientRect();
await fingers("touchEnd", []);
await wait(300);
if (ids() !== "sleep,steps,water,weight,week,heart") return done("the drag lands: " + ids());
if (tiles().some((t) => t.style.transform !== "")) return done("no transforms left");
if (kept().map((x) => x.id).join() !== "sleep,steps,water,weight,week,heart") return done("kept: " + JSON.stringify(kept()));
if (said() !== "Moved to place 1 of 6.") return done("said: " + said());
// What made way stood exactly where the browser then put them: the sums and the dense grid agree.
for (const id of Object.keys(mid)) {
    const a = mid[id], b = tile(id).getBoundingClientRect();
    if (!near(a.left, b.left) || !near(a.top, b.top)) return done(id + " made way to " + a.left + "," + a.top + " and landed at " + b.left + "," + b.top);
}

// Past the end of everything: last.
const heartR = tile("heart").getBoundingClientRect(), weekR = tile("week").getBoundingClientRect();
const lowest = Math.max(...tiles().map((t) => t.getBoundingClientRect().bottom));
const p0 = topOf(tile("sleep"));
await fingers("touchStart", [p0]);
const far = { x: box.left + cell / 2, y: lowest + cell * 0.6 };
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p0.x + (far.x - p0.x) * i / 10, y: p0.y + (far.y - p0.y) * i / 10 }]); await wait(16); }
await wait(100);
await fingers("touchEnd", []);
await wait(300);
if (!ids().endsWith("sleep")) return done("past the end goes last: " + ids());

// A tap in Edit chooses; the tools act on what is chosen.
await tap(tile("water"));
if (!tile("water").classList.contains("ui-wgrid-picked")) return done("a tap chooses");
if (told().includes("water") && told() !== toldBefore) return done("a tap in Edit opens nothing: " + told());
const order0 = ids();
await tap(tool(".ui-wgrid-earlier"));
const i0 = order0.split(",").indexOf("water");
if (ids().split(",").indexOf("water") !== i0 - 1) return done("Earlier: " + ids());
await tap(tool(".ui-wgrid-later"));
if (ids() !== order0) return done("Later: " + ids());
if (tool(".ui-wgrid-sized").textContent !== "Size 1x1") return done("size names it: " + tool(".ui-wgrid-sized").textContent);
await tap(tool(".ui-wgrid-sized"));
if (tool(".ui-wgrid-sized").textContent !== "Size 2x1") return done("Size goes on: " + tool(".ui-wgrid-sized").textContent);
if (!near(size("water")[0], 2 * cell + gap)) return done("it grows: " + size("water"));
if (kept().find((x) => x.id === "water").size !== "2x1") return done("kept size: " + JSON.stringify(kept()));
await tap(tool(".ui-wgrid-sized"));
await tap(tool(".ui-wgrid-sized"));
await tap(tool(".ui-wgrid-sized"));
if (tool(".ui-wgrid-sized").textContent !== "Size 1x1") return done("Size goes round: " + tool(".ui-wgrid-sized").textContent);

// A tile with its own sizes goes through those alone.
await tap(tile("week"));
await tap(tool(".ui-wgrid-sized"));
if (tool(".ui-wgrid-sized").textContent !== "Size 2x2") return done("own sizes: " + tool(".ui-wgrid-sized").textContent);
await tap(tool(".ui-wgrid-sized"));

// Taken away and brought back, kept as data. The next tile gets the focus.
await tap(tile("heart"));
await tap(tool(".ui-wgrid-away"));
if (tile("heart")) return done("taken away");
const entry = kept().find((x) => x.id === "heart");
if (!entry || entry.hidden !== true) return done("kept hidden: " + JSON.stringify(kept()));
if (kept()[kept().length - 1].id !== "heart") return done("hidden last");
const backBtn = main().querySelector(".ui-wgrid-back");
if (backBtn.textContent !== "Bring back Heart") return done("the tray: " + backBtn.textContent);
await tap(backBtn);
if (!tile("heart") || !ids().endsWith("heart")) return done("brought back last: " + ids());
if (kept().find((x) => x.id === "heart").hidden !== false) return done("no longer hidden");
if (main().querySelector(".ui-wgrid-back")) return done("the tray empties");

// Keys.
const t = tile("water");
t.focus();
const order1 = ids();
key(t, "ArrowRight");
await wait(60);
if (ids().split(",").indexOf("water") !== order1.split(",").indexOf("water") + 1) return done("Right: " + ids());
if (document.activeElement !== t) return done("focus stays with the tile");
key(t, "ArrowLeft");
await wait(60);
if (ids() !== order1) return done("Left: " + ids());
key(t, "Enter");
await wait(60);
if (!t.classList.contains("ui-wgrid-picked")) return done("Enter chooses");
key(t, "Delete");
await wait(60);
if (tile("water")) return done("Delete takes away");
if (!document.activeElement.classList.contains("ui-wgrid-tile")) return done("focus stays in the grid: " + document.activeElement.className);
await tap(main().querySelector(".ui-wgrid-back"));
key(tile("water"), "Escape");
await wait(60);
if (editing()) return done("Escape ends Edit");

// A tile opens again. Kept: made again, the order, sizes and all.
const shape = ids();
await tap(tile("steps"));
if (told() !== "opened steps") return done("opens after Done: " + told());
await tap($("#widget-grid-remake"));
await wait(200);
if (ids() !== shape) return done("kept comes back: " + ids());

// Rotation keeps what is there, and a wide box has twice the columns.
if (device === "phone") {
    const sized = tile("steps").getBoundingClientRect().width;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await wait(200);
    const c2 = getComputedStyle(main().querySelector(".ui-wgrid-grid")).gridTemplateColumns.split(" ").length;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await wait(200);
    if (c2 !== 8) return done("turned, eight columns: " + c2);
    if (ids() !== shape) return done("turning keeps the order");
}

// A reading comes in with a tile in the air: it shows, and nothing in the air or making way goes home.
window.scrollTo(0, 0);
await wait(80);
await tap(edit());
const seen = (q) => ({ x: q.x - visualViewport.offsetLeft, y: q.y - visualViewport.offsetTop });
const carried = tiles()[0], other = tiles()[1], carriedId = carried.dataset.id, s0 = seen(topOf(carried)), or = other.getBoundingClientRect(), s1 = seen({ x: or.left + or.width / 2, y: or.top + or.height / 2 });
await fingers("touchStart", [s0]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: s0.x + (s1.x - s0.x) * i / 8, y: s0.y + (s1.y - s0.y) * i / 8 }]); await wait(16); }
await wait(260);
const airBefore = carried.style.transform, moved = tiles().filter((t) => t !== carried).map((t) => t.style.transform).join("|");
if (airBefore === "") return done("the tile should be in the air");
if (moved.replace(/\|/g, "") === "") return done("another tile should have made way");
$("#widget-grid-stir").click();
await wait(150);
if (tile("heart").querySelector(".ui-wgrid-value").textContent !== "63") return done("the reading should show: " + tile("heart").querySelector(".ui-wgrid-value").textContent);
if (carried.style.transform !== airBefore) return done("a state change dropped the tile: " + JSON.stringify(carried.style.transform) + " was " + airBefore);
if (tiles().filter((t) => t !== carried).map((t) => t.style.transform).join("|") !== moved) return done("a state change sent those making way home");
if (!carried.classList.contains("ui-wgrid-lifted")) return done("still lifted");
await fingers("touchMove", [{ x: s1.x + 2, y: s1.y + 2 }]);
await wait(40);
if (carried.style.transform === airBefore) return done("the tile should go on following the finger");
await fingers("touchEnd", []);
await wait(300);
if (ids().split(",")[0] === carriedId) return done("the drag should still land: " + ids());
await tap(edit());

// Bad data.
const bad = $("#widget-grid-bad");
const names = [...bad.querySelectorAll(".ui-wgrid-name")].map((n) => n.textContent).join();
if (names !== "Odd size,No id") return done("bad data: " + names);
if (bad.querySelector("li").style.gridColumn !== "span 1") return done("a bad size is 1x1: " + bad.querySelector("li").style.gridColumn);
delete window.quilloNative;
