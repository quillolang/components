// tablet
await wait(300);
const badBox = $("#table-floor-plan-bad");
const badTables = [...badBox.querySelectorAll(".ui-table-floor-plan-table")];
if (badTables.length !== 1 || badTables[0].dataset.id !== "3") return "bad tables: " + badTables.length;
// x 950 and y 690 for a 90 by 90 table on a 1000 by 700 floor come back to 910, 610.
const badSpot = badTables[0].parentElement.style;
if (badSpot.left !== "91%" || parseFloat(badSpot.top).toFixed(3) !== (610 * 100 / 700).toFixed(3)) return "a table past the floor: " + badSpot.left + " " + badSpot.top;
if (!badTables[0].classList.contains("ui-table-floor-plan-free")) return "an unknown status should count as the first";
badBox.remove();

const table = (id) => $(`.ui-table-floor-plan-table[data-id="${id}"]`);
const note = () => $("#table-floor-plan-note").textContent;
const layout = () => $("#table-floor-plan-layout").textContent;
const btn = (t) => $$(".ui-table-floor-plan-btn").find((b) => b.textContent === t);
const floor = $(".ui-table-floor-plan-floor");
const counts = () => $$(".ui-table-floor-plan-counts li").map((l) => l.textContent).join(", ");
// A table's place in the floor's units, from its percentages.
const at = (id) => { const s = table(id).parentElement.style; return [Math.round(parseFloat(s.left) * 10), Math.round(parseFloat(s.top) * 7)]; };
const scale = () => floor.clientWidth / 1000;

if (counts() !== "5 Free, 3 Seated, 1 Ordered, 1 Served, 1 Bill, 1 To clear") return "counts: " + counts();
if (table(3).getAttribute("aria-label") !== "Table 3, Ordered, 3 of 4 seats") return "what is said: " + table(3).getAttribute("aria-label");
if (table(3).querySelector("small").textContent !== "3/4") return "guests: " + table(3).querySelector("small").textContent;
if (table(2).querySelector("small").textContent !== "Free") return "a free table: " + table(2).querySelector("small").textContent;
if (!table(1).classList.contains("ui-table-floor-plan-round")) return "a round table";

// A tap opens the check, and the panel shows it.
await tap(table(4));
if (note() !== "Check of 4 opened.") return "a tap: " + note();
const side = () => $(".ui-table-floor-plan-side").textContent;
if (!side().includes("Table 4") || !side().includes("Bill, 4 of 4 seats")) return "the panel: " + side();
// The status moves on, for all to see.
await tap(btn("To clear"));
if (note() !== "4 is dirty.") return "on_status: " + note();
if (!table(4).classList.contains("ui-table-floor-plan-dirty") || table(4).classList.contains("ui-table-floor-plan-bill")) return "the status class";
if (counts() !== "5 Free, 3 Seated, 1 Ordered, 1 Served, 2 To clear") return "counts after: " + counts();
await tap(btn("Open check"));
if (note() !== "Check of 4 opened.") return "Open check: " + note();

// Out of edit mode a drag moves nothing.
const was = at(7);
await drag(table(7), 80, 60, 150);
if (at(7).join() !== was.join()) return "a drag outside edit mode moved a table";
await tap(btn("Edit plan"));
if (getComputedStyle(table(7)).touchAction !== "none") return "touch-action in edit mode: " + getComputedStyle(table(7)).touchAction;

// A tap in edit mode opens no check.
await tap(table(8));
if (note() !== "Check of 4 opened.") return "a tap in edit mode opened a check: " + note();
// A press that barely moves is a tap: nothing moves.
await drag(table(7), 3, 2, 80);
if (at(7).join() !== was.join()) return "a small move moved a table: " + at(7);

// A drag: the screen's distance in the floor's units, snapped to tens.
const px = 70 * scale(), py = 30 * scale();
const start = middle(table(7));
await fingers("touchStart", [start]);
await fingers("touchMove", [{ x: start.x + px / 2, y: start.y + py / 2 }]);
await fingers("touchMove", [{ x: start.x + px, y: start.y + py }]);
await wait(60);
if (!table(7).style.transform.startsWith("translate(")) return "the table should follow: " + table(7).style.transform;
// The list every table reads changes under the finger: this one stays with the finger, and the drop counts.
const held = table(7).style.transform;
table(1).focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await wait(80);
if (at(1).join() !== "40,50") return "the other table: " + at(1);
if (table(7).style.transform !== held) return "a state change mid-drag moved the table: '" + table(7).style.transform + "' from " + held;
// And the table's own data changing under the finger, which is what rewrites a markup style.
table(7).focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await wait(80);
if (table(7).style.transform !== held) return "its own data changing mid-drag moved the table: '" + table(7).style.transform + "' from " + held;
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowUp", code: "ArrowUp", windowsVirtualKeyCode: 38 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowUp", code: "ArrowUp", windowsVirtualKeyCode: 38 });
await wait(80);
await fingers("touchEnd", []);
await wait(120);
if (at(7).join() !== `${was[0] + 70},${was[1] + 30}`) return "a drag: " + at(7) + " from " + was;
if (table(7).style.transform !== "") return "the transform stayed";

// Off the floor it stops at the edge.
await drag(table(4), 0, -120, 120);
if (at(4).join() !== "430,0") return "dragged off the floor: " + at(4);
// Onto another it goes back, and says so.
const w5 = at(5);
const toThree = (at(3)[0] - w5[0]) * scale(), toThreeY = (at(3)[1] - w5[1]) * scale();
await drag(table(5), toThree, toThreeY, 120);
if (at(5).join() !== w5.join()) return "set down on another table: " + at(5);
if ($(".ui-table-floor-plan .ui-sr").textContent !== "Table 5 cannot stand there.") return "said: " + $(".ui-table-floor-plan .ui-sr").textContent;
// What a handler moves carries no style from the markup.
if ($$(".ui-table-floor-plan-table").some((t) => t.style.left || t.style.width)) return "a table has a style from the markup";
// A cancelled drag goes back too.
const p = middle(table(12));
await fingers("touchStart", [p]);
await fingers("touchMove", [{ x: p.x + 80, y: p.y }]);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(120);
if (at(12).join() !== "200,540" || table(12).style.transform !== "") return "a cancelled drag: " + at(12);

// The keys: a grid step, five with Shift, and focus stays.
table(11).focus();
const press = async (k, code, vk, modifiers = 0) => {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers });
    await wait(60);
};
await press("ArrowRight", "ArrowRight", 39);
if (at(11).join() !== "50,540") return "an arrow: " + at(11);
await press("ArrowRight", "ArrowRight", 39, 8);
if (at(11).join() !== "100,540") return "Shift and an arrow: " + at(11);
if (document.activeElement !== table(11)) return "focus left the table";
// To the table beside it: refused by key as well.
await press("ArrowRight", "ArrowRight", 39, 8);
if (at(11).join() !== "100,540") return "onto another by key: " + at(11);
if ($(".ui-table-floor-plan .ui-sr").textContent !== "Table P1 cannot stand there.") return "said by key: " + $(".ui-table-floor-plan .ui-sr").textContent;

// Cancel puts all back, and calls nothing.
await tap(btn("Cancel"));
if (at(7).join() !== was.join() || at(11).join() !== "40,540" || at(4).join() !== "430,40") return "Cancel: " + at(7) + " " + at(11) + " " + at(4);
if (layout() !== "Not saved.") return "Cancel called on_layout: " + layout();
// Done keeps it and says where everything is.
await tap(btn("Edit plan"));
await drag(table(8), 30 * scale(), 0, 120);
await tap(btn("Done"));
if (!layout().includes("8:70,340")) return "on_layout: " + layout();
if (layout().split(" ").length !== 12) return "on_layout's tables: " + layout();
if (getComputedStyle(table(7)).touchAction === "none") return "touch-action after editing";

// Upright or turned the floor keeps its shape, stays in the room, and shows every table.
const check = () => {
    const f = floor.getBoundingClientRect(), r = $(".ui-table-floor-plan-room").getBoundingClientRect();
    if (Math.abs(f.width / f.height - 1000 / 700) > 0.02) return "the floor's shape: " + f.width + "x" + f.height;
    if (f.right > r.right + 1 || f.bottom > r.bottom + 1) return "the floor leaves the room";
    for (const b of $$(".ui-table-floor-plan-table")) {
        const t = b.getBoundingClientRect();
        if (t.left < f.left - 1 || t.right > f.right + 1 || t.top < f.top - 1 || t.bottom > f.bottom + 1) return "a table left the floor";
        if (t.width < 44 || t.height < 44) return "a table is too small to press: " + t.width + "x" + t.height;
    }
    return null;
};
const c1 = check();
if (c1) return c1;
const place = () => { const f = floor.getBoundingClientRect(), t = table(10).getBoundingClientRect(); return [(t.left - f.left) / f.width, (t.top - f.top) / f.height]; };
const p0 = place(), turned = innerWidth > innerHeight;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await (turned ? size(820, 1180) : size(1180, 820));
await wait(250);
const c2 = check();
if (c2) return "turned: " + c2;
const p1 = place();
if (Math.abs(p0[0] - p1[0]) > 0.01 || Math.abs(p0[1] - p1[1]) > 0.01) return "a table moved on turning: " + p0 + " " + p1;
const s = $(".ui-table-floor-plan-side").getBoundingClientRect(), f = floor.getBoundingClientRect();
if ((innerWidth >= 1000) !== (s.left >= f.right - 1)) return "the panel's place at " + innerWidth;
await (turned ? size(1180, 820) : size(820, 1180));
await wait(250);
