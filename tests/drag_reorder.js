// mobile
await wait(300);
// Bad data: what has a title, each id once.
const bad = [...$("#drag-reorder-bad").querySelectorAll(".ui-drag-reorder-list")].map((l) => [...l.querySelectorAll(".ui-drag-reorder-title")].map((t) => t.textContent).join());
if (bad.join("|") !== "Two,No id|") return "bad items: " + bad.join("|");
$("#drag-reorder-bad").remove();

const list = $(".ui-drag-reorder-list");
const rows = () => $$(".ui-drag-reorder-row");
const ids = () => rows().map((r) => r.dataset.id).join(" ");
const order = () => $("#drag-reorder-order").textContent;
const said = () => $(".ui-sr[role=status]").textContent;
const rowH = rows()[0].offsetHeight;
if (ids() !== "1 2 3 4 5 6 7 8 9 10 11 12") return "start: " + ids();

// A quick drag on a row is a scroll, not a move.
await drag(rows()[2].querySelector(".ui-drag-reorder-text"), 0, -120, 200);
await wait(100);
if (ids() !== "1 2 3 4 5 6 7 8 9 10 11 12") return "a quick drag moved a row: " + ids();
if (list.scrollTop <= 0) return "a quick drag should scroll the list";
if (order() !== "Not changed yet.") return "on_reorder was called";
list.scrollTop = 0;
await wait(60);

// A long press lifts the row; held still it shows, and the finger then moves it.
const lift = async (el) => {
    const p = middle(el);
    await fingers("touchStart", [p]);
    await wait(420);
    return p;
};
const p = await lift(rows()[1].querySelector(".ui-drag-reorder-text"));
const row1 = rows()[1];
if (!row1.classList.contains("ui-drag-reorder-lifted")) return "a long press should lift the row";
// Down two and a half rows: its middle is past the next two, which step up by exactly its height.
await fingers("touchMove", [{ x: p.x, y: p.y + rowH * 2.5 }]);
await wait(80);
if (row1.style.transform !== `translateY(${rowH * 2.5}px)`) return "the row should follow: " + row1.style.transform;
if (rows()[2].style.transform !== `translateY(-${rowH}px)`) return "the next row should step up: " + rows()[2].style.transform;
if (rows()[3].style.transform !== "translateY(-" + rowH + "px)" ) return "the row after should step up too: " + rows()[3].style.transform;
if (rows()[4].style.transform !== "") return "further rows stay: " + rows()[4].style.transform;
await fingers("touchEnd", []);
await wait(120);
if (ids() !== "1 3 4 2 5 6 7 8 9 10 11 12") return "after a drop: " + ids();
if (order() !== "1 3 4 2 5 6 7 8 9 10 11 12") return "on_reorder: " + order();
if (said() !== "Harbour Street moved to place 4 of 12.") return "not announced: " + said();
if (rows().some((r) => r.style.transform !== "")) return "transforms left behind";
if (list.scrollTop !== 0) return "the drop moved the list";

// Back up, by the grip, at once with no long press.
const grip = rows()[3].querySelector(".ui-drag-reorder-grip");
await drag(grip, 0, -rowH * 2, 300);
if (ids() !== "1 2 3 4 5 6 7 8 9 10 11 12") return "by the grip: " + ids();

// Let go where it started: no call.
const before = order();
const q = await lift(rows()[5].querySelector(".ui-drag-reorder-text"));
await fingers("touchMove", [{ x: q.x, y: q.y + 12 }]);
await wait(60);
await fingers("touchEnd", []);
await wait(100);
if (order() !== before) return "a row dropped in place called on_reorder";

// The system taking the gesture leaves the order alone.
const c = await lift(rows()[2].querySelector(".ui-drag-reorder-text"));
await fingers("touchMove", [{ x: c.x, y: c.y + rowH * 2 }]);
await wait(60);
await fingers("touchCancel", []);
await wait(250);
if (order() !== before) return "a cancelled drag reordered: " + order();
if (rows().some((r) => r.style.transform !== "")) return "a cancelled drag left rows out of place";
if ($(".ui-drag-reorder-lifted")) return "still lifted after a cancel";

// At the bottom edge the list scrolls by itself, and the row lands far down.
const box = list.getBoundingClientRect();
const e = await lift(rows()[0].querySelector(".ui-drag-reorder-text"));
await fingers("touchMove", [{ x: e.x, y: box.bottom - 10 }]);
await wait(30);
const s0 = list.scrollTop;
await wait(700);
if (list.scrollTop <= s0 + 60) return "the edge should scroll the list: " + s0 + " to " + list.scrollTop;
await fingers("touchEnd", []);
await wait(120);
const landed = ids().split(" ").indexOf("1");
if (landed < 5) return "the row should land far down: place " + landed + " of " + ids();
if (order() !== ids()) return "on_reorder after the scroll: " + order();

// The keyboard: arrows on the grip, and focus stays on the row that moved.
list.scrollTop = 0;
await wait(60);
const k = rows()[0].querySelector(".ui-drag-reorder-grip");
const id0 = rows()[0].dataset.id, id1 = rows()[1].dataset.id;
k.focus();
key(k, "ArrowDown");
await wait(60);
if (rows()[1].dataset.id !== id0 || rows()[0].dataset.id !== id1) return "ArrowDown should move it: " + ids();
if (document.activeElement !== k) return "focus should stay on the moved row";
if (k.getAttribute("aria-label").indexOf("place 2 of 12") < 0) return "the label should say its new place: " + k.getAttribute("aria-label");
key(k, "ArrowUp");
await wait(60);
if (rows()[0].dataset.id !== id0) return "ArrowUp should move it back: " + ids();
key(k, "ArrowUp");
await wait(60);
if (rows()[0].dataset.id !== id0) return "ArrowUp at the top should do nothing";
key(k, "End");
await wait(60);
if (rows()[11].dataset.id !== id0) return "End: " + ids();
key(k, "Home");
await wait(60);
if (rows()[0].dataset.id !== id0) return "Home: " + ids();

// What differs on a tablet: the buttons are there for anyone. On a phone they are for screen readers.
const up = rows()[1].querySelectorAll(".ui-drag-reorder-move")[0];
const down = rows()[1].querySelectorAll(".ui-drag-reorder-move")[1];
const wide = rows()[1].querySelector(".ui-drag-reorder-moves").getBoundingClientRect().width >= 44;
if (device === "phone" && wide) return "a phone keeps the buttons out of sight";
if (device === "tablet" && !wide) return "a tablet shows the buttons";
const id1b = rows()[1].dataset.id;
if (device === "tablet") { await tap(down); } else { down.click(); await wait(60); }
if (rows()[2].dataset.id !== id1b) return "Down: " + ids();
if (rows()[0].querySelector(".ui-drag-reorder-move").getAttribute("aria-disabled") !== "true") return "the first row cannot go up";

// Without a box of its own, the page scrolls at the edge of the screen.
list.style.maxHeight = "none";
list.style.overflowY = "visible";
document.body.style.paddingBottom = "1600px";
await wait(60);
scrollTo(0, 0);
const last = rows().find((r) => r.getBoundingClientRect().bottom > innerHeight - 70 && r.getBoundingClientRect().top < innerHeight - 70) ?? rows()[0];
last.scrollIntoView({ block: "center" });
await wait(60);
const page = await lift(last.querySelector(".ui-drag-reorder-text"));
if (!$(".ui-drag-reorder-lifted")) return "no lift for the page test";
await fingers("touchMove", [{ x: page.x, y: innerHeight - 6 }]);
await wait(30);
const py0 = scrollY;
await wait(500);
const py1 = scrollY;
await fingers("touchCancel", []);
await wait(250);
if (py1 <= py0 + 30) return "the page should scroll at the screen's edge: " + py0 + " to " + py1;
document.body.style.paddingBottom = "";
await wait(40);
