// mobile
await wait(200);
const main = $("#quick-settings-main");
const told = () => $("#quick-settings-told").textContent;
const kept = () => JSON.parse($("#quick-settings-kept").textContent);
const tiles = () => [...main.querySelectorAll(".ui-qset-tile")];
const ids = () => tiles().map((t) => t.dataset.id).join();
const tile = (id) => main.querySelector(`[data-id="${id}"]`);
const sw = (id) => tile(id).querySelector(".ui-qset-main");
const state = (id) => tile(id).querySelector(".ui-qset-state").textContent;
const dlg = main.querySelector("dialog");
const edit = () => main.querySelector(".ui-qset-edit");
const calls = [];
window.quilloNative = { haptic: (k) => { calls.push(k); return Promise.resolve(true); } };
const done = (why) => { delete window.quilloNative; return why; };

// As given: eight tiles, the on ones marked, a value on the tile that has one.
if (tiles().length !== 8) return done("eight tiles: " + tiles().length);
if (state("wifi") !== "Home" || state("bt") !== "On" || state("torch") !== "Off") return done("states: " + state("wifi") + state("bt") + state("torch"));
if (sw("wifi").getAttribute("aria-checked") !== "true" || !tile("wifi").classList.contains("ui-qset-on")) return done("wifi on");
if (sw("roam").getAttribute("aria-disabled") !== "true" || state("roam") !== "Unavailable") return done("roam unavailable: " + state("roam"));

// A tap turns one.
await tap(sw("torch"));
if (state("torch") !== "On" || sw("torch").getAttribute("aria-checked") !== "true") return done("tap on: " + state("torch"));
if (told() !== "torch true") return done("on_toggle: " + told());
if (!kept().includes("torch+")) return done("kept: " + kept());
if (calls.join() !== "selection") return done("felt: " + calls);
if (main.querySelector(".ui-sr").textContent !== "Torch on.") return done("told: " + main.querySelector(".ui-sr").textContent);
await tap(sw("torch"));
if (state("torch") !== "Off" || told() !== "torch false") return done("tap off: " + told());
// One that cannot be turned stays off, and says nothing happened.
await tap(sw("roam"));
if (state("roam") !== "Unavailable" || told() !== "torch false") return done("unavailable stays: " + told());

// A press shorter than the long press is a tap, not details.
await hold(sw("cast"), 150);
if (dlg.open) return done("a short press opened the details");
if (state("cast") !== "On") return done("a short press is a tap: " + state("cast"));
await tap(sw("cast"));

// A long press opens the details and does not turn it, on lifting or after.
calls.length = 0;
await hold(sw("dnd"), 650);
if (!dlg.open) return done("a long press should open the details");
if (state("dnd") !== "Off") return done("a long press should not turn the tile: " + state("dnd"));
if (told() !== "torch false" && told() !== "cast false") return done("nothing turned: " + told());
if (calls[0] !== "medium") return done("a long press is felt: " + calls);
if (dlg.querySelector("h3").textContent !== "Do not disturb") return done("details of: " + dlg.querySelector("h3").textContent);
if (!dlg.textContent.includes("Calls and alerts stay silent.")) return done("detail text");
// Its options; picking one turns it on and shows on the tile.
const opts = () => [...dlg.querySelectorAll(".ui-qset-opt")];
if (opts().map((o) => o.textContent).join() !== "For an hour,Until tomorrow") return done("options: " + opts().map((o) => o.textContent).join());
await tap(opts()[1]);
if (opts()[1].getAttribute("aria-pressed") !== "true") return done("option pressed");
if (state("dnd") !== "Until tomorrow") return done("a choice shows on the tile: " + state("dnd"));
if (told() !== "dnd: Until tomorrow") return done("on_detail: " + told());
// The switch inside the details turns it too.
await tap(dlg.querySelector(".ui-qset-turn"));
if (state("dnd") !== "Off") return done("the details' switch: " + state("dnd"));
await tap(dlg.querySelector(".ui-qset-turn"));
if (state("dnd") !== "Until tomorrow") return done("back on with its value: " + state("dnd"));

// Where the details stand: a sheet at the foot of a phone; a card by the tile on a tablet.
const dr = dlg.getBoundingClientRect(), tr = tile("dnd").getBoundingClientRect();
if (device === "phone") {
    if (Math.round(dr.bottom) !== innerHeight || Math.round(dr.width) !== innerWidth) return done("a sheet: " + JSON.stringify(dr));
} else {
    if (Math.round(dr.width) !== 320) return done("a card on a tablet: " + dr.width);
    // Within a few pixels: the tile is pressed in, at 97%, as it is measured.
    if (Math.abs(dr.left - tr.left) > 4 || Math.abs(dr.top - (tr.bottom + 8)) > 4) return done("beside the tile: " + dr.left + "," + dr.top + " tile " + tr.left + "," + tr.bottom);
}
// Done closes it and gives the focus back to the tile.
await tap(dlg.querySelector(".ui-qset-close"));
if (dlg.open) return done("Done closes");
if (document.activeElement !== sw("dnd")) return done("focus goes back: " + document.activeElement.className);

// The arrow in the corner is the same place, for a screen reader or a thumb. The backdrop closes it.
const more = tile("wifi").querySelector(".ui-qset-more");
await tap(more);
if (!dlg.open || dlg.querySelector("h3").textContent !== "Wi-Fi") return done("the arrow opens the details");
if (state("wifi") !== "Home") return done("the arrow turns nothing: " + state("wifi"));
await tap(dlg.querySelector(".ui-qset-close"));
// An unavailable tile's details say why, and its switch is off.
await hold(sw("roam"), 650);
if (!dlg.open || !dlg.textContent.includes("Needs a SIM card.")) return done("why: " + dlg.textContent);
if (!dlg.querySelector(".ui-qset-turn").disabled) return done("its switch is off");
// A press on the backdrop closes. The very top of the screen is backdrop on a phone; on a tablet too, as the card is lower.
await fingers("touchStart", [{ x: 10, y: 10 }]);
await fingers("touchEnd", []);
await wait(250);
if (dlg.open) return done("a press on the backdrop should close");

// A finger that moves is not a long press.
const p = middle(sw("place"));
await fingers("touchStart", [p]);
await wait(100);
await fingers("touchMove", [{ x: p.x + 16, y: p.y }]);
await wait(550);
await fingers("touchEnd", []);
await wait(200);
if (dlg.open) return done("a moved finger should not open the details");
// The system taking the touch: no details either.
await fingers("touchStart", [p]);
await wait(100);
await fingers("touchCancel", []);
await wait(600);
if (dlg.open) return done("a cancelled press should not open the details");
if (state("place") !== "On") return done("a cancelled press turns nothing: " + state("place"));

// Edit: tiles stop answering a tap, buttons show.
await tap(edit());
if (edit().textContent !== "Done") return done("Edit becomes Done: " + edit().textContent);
const torchWas = state("torch");
const onTop = tile("torch").getBoundingClientRect();
await fingers("touchStart", [{ x: onTop.left + 30, y: onTop.top + 20 }]);
await fingers("touchEnd", []);
await wait(250);
if (state("torch") !== torchWas) return done("a tap in Edit turns nothing: " + state("torch"));
if (getComputedStyle(tile("torch").querySelector(".ui-qset-moves")).display !== "flex") return done("the move buttons show");
if (getComputedStyle(tile("torch")).touchAction !== "none") return done("tiles take the finger in Edit: " + getComputedStyle(tile("torch")).touchAction);

// By button.
const movesOf = (id) => tile(id).querySelectorAll(".ui-qset-move");
const start = ids();
if (!movesOf("wifi")[0].disabled) return done("the first cannot go earlier");
await tap(movesOf("bt")[0]);
if (ids() !== "bt,wifi,dnd,torch,lock,place,roam,cast") return done("Earlier: " + ids());
await tap(movesOf("bt")[1]);
if (ids() !== start) return done("Later: " + ids());

// A drag: the first tile to the place of the fourth. On a phone that is two columns: place 3 is second row, right.
const cols = getComputedStyle(main.querySelector(".ui-qset-grid")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 5 : 2)) return done("columns on " + device + ": " + cols);
const a = tile("wifi"), b = tile("torch");
const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
await drag(a, rb.left - ra.left, rb.top - ra.top, 300);
await wait(100);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("drag: " + ids());
if (tiles().some((t) => t.style.transform !== "")) return done("no transforms left");
if (kept()[3] !== "wifi+Home") return done("the order is kept: " + kept());
if (main.querySelector(".ui-sr").textContent !== "Moved to place 4 of 8.") return done("told: " + main.querySelector(".ui-sr").textContent);

// During a drag, the state waits: only transforms move, those between step aside.
const c = tile("bt"), r0 = c.getBoundingClientRect(), m0 = middle(c);
const r3 = tiles()[2].getBoundingClientRect();
await fingers("touchStart", [m0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: m0.x + (r3.left - r0.left) * i / 6, y: m0.y + (r3.top - r0.top) * i / 6 }]); await wait(16); }
await wait(250);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("nothing commits during a drag: " + ids());
if (!c.classList.contains("ui-qset-lifted")) return done("the tile is lifted");
if (tile("dnd").style.transform === "" || tile("torch").style.transform === "") return done("those between should step aside");
if (Math.abs(tile("dnd").getBoundingClientRect().left - r0.left) > 1) return done("the next steps into its place: " + tile("dnd").getBoundingClientRect().left + " for " + r0.left);
// A system cancel drops it where it was.
await fingers("touchCancel", []);
await wait(250);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("cancel keeps the order: " + ids());
if (tiles().some((t) => t.style.transform !== "")) return done("cancel leaves no transforms");
if (c.classList.contains("ui-qset-lifted")) return done("cancel lands it");

// A drag that goes nowhere changes nothing, and a finger barely moved does nothing.
const still = tile("bt").getBoundingClientRect(), m1 = { x: still.left + 30, y: still.top + 20 };
await fingers("touchStart", [m1]);
await fingers("touchMove", [{ x: m1.x + 3, y: m1.y + 3 }]);
await wait(60);
await fingers("touchEnd", []);
await wait(250);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("a tremble: " + ids());
if (state("torch") !== torchWas) return done("Edit turns nothing");

// A drag may start on a Move button, which covers half a tile: it is a drag, and the button is not pressed.
const onBtn = movesOf("bt")[1], mv = middle(onBtn), rd = tile("dnd").getBoundingClientRect(), rt = tile("bt").getBoundingClientRect();
const dx = rd.left - rt.left, dy = rd.top - rt.top;
await fingers("touchStart", [mv]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: mv.x + dx * i / 6, y: mv.y + dy * i / 6 }]); await wait(16); }
await fingers("touchEnd", []);
await wait(250);
if (ids() !== "dnd,bt,torch,wifi,lock,place,roam,cast") return done("a drag from a button: " + ids());
await tap(movesOf("bt")[0]);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("the button still presses: " + ids());

// Keys, on a focused tile; focus stays with it.
const t = tile("dnd");
t.focus();
key(t, "ArrowRight");
await wait(60);
if (ids() !== "bt,torch,dnd,wifi,lock,place,roam,cast") return done("Right: " + ids());
if (document.activeElement !== t) return done("focus stays with the tile: " + document.activeElement.className);
key(t, "ArrowLeft");
await wait(60);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("Left: " + ids());
key(t, "ArrowDown");
await wait(60);
const want = device === "tablet" ? "bt,torch,wifi,lock,place,roam,dnd,cast" : "bt,torch,wifi,dnd,lock,place,roam,cast";
if (ids() !== want) return done("Down by a row: " + ids());
key(t, "ArrowUp");
await wait(60);
if (ids() !== "bt,dnd,torch,wifi,lock,place,roam,cast") return done("Up: " + ids());
key(tile("bt"), "ArrowLeft");
await wait(60);
if (!ids().startsWith("bt")) return done("nowhere to go: " + ids());

// Done, then the tiles answer again.
await tap(edit());
if (edit().textContent !== "Edit") return done("Done: " + edit().textContent);
await tap(sw("lock"));
if (state("lock") !== "On") return done("tiles answer after Done: " + state("lock"));

// Kept: made again from what on_change gave, order and all.
const order = ids();
await tap($("#quick-settings-remake"));
await wait(200);
if (ids() !== order) return done("the order comes back: " + ids());
if (state("lock") !== "On" || state("dnd") !== "Until tomorrow" || state("wifi") !== "Home") return done("what was on comes back: " + state("lock") + state("dnd"));

// A label changes with a tile in the air: it shows, and nothing in the air or making way goes home.
window.scrollTo(0, 0);
await wait(80);
await tap(edit());
const seen = (q) => ({ x: q.x - visualViewport.offsetLeft, y: q.y - visualViewport.offsetTop });
const carried = tiles()[0], next = tiles()[1], rc = carried.getBoundingClientRect(), rn = next.getBoundingClientRect();
const s0 = seen({ x: rc.left + 30, y: rc.top + 20 }), s1 = seen({ x: rn.left + 30, y: rn.top + 20 });
await fingers("touchStart", [s0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: s0.x + (s1.x - s0.x) * i / 6, y: s0.y + (s1.y - s0.y) * i / 6 }]); await wait(16); }
await wait(250);
const airBefore = carried.style.transform, nextBefore = next.style.transform;
if (airBefore === "" || nextBefore === "") return done("in the air, and making way: " + airBefore + " / " + nextBefore);
$("#quick-settings-stir").click();
await wait(150);
if (tile("cast").querySelector(".ui-qset-name").textContent !== "Cast 1") return done("the label should show: " + tile("cast").querySelector(".ui-qset-name").textContent);
if (carried.style.transform !== airBefore || next.style.transform !== nextBefore) return done("a state change sent a tile home");
await fingers("touchEnd", []);
await wait(250);
if (tiles()[0] !== next) return done("the drag should still land: " + ids());
await tap(edit());

// Kept in localStorage, under its key.
const stored = $("#quick-settings-stored");
localStorage.removeItem("demo-qset");
await tap(stored.querySelector(".ui-qset-main"));
const inStore = JSON.parse(localStorage.getItem("demo-qset") ?? "null");
localStorage.removeItem("demo-qset");
if (!inStore || inStore[0].id !== "one" || inStore[0].on !== true) return done("stored: " + JSON.stringify(inStore));

// Bad data: those with a label, each id once, a thing kept for a tile gone ignored.
const bad = $("#quick-settings-bad");
const names = [...bad.querySelectorAll(".ui-qset-name")].map((n) => n.textContent).join();
if (names !== "Twin,No id") return done("bad data: " + names);
delete window.quilloNative;
