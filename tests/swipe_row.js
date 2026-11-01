// mobile
await wait(300);
// Bad data: no actions to show, and no way to get stuck.
const bad = $("#swipe-row-bad");
if (bad.querySelectorAll(".ui-swipe-row-act").length !== 0) return "bad actions should be left out";
if (bad.querySelector(".ui-swipe-row").style.getPropertyValue("--w") !== "44px") return "an action is 44 px at least";
bad.remove();

const rows = () => $$(".ui-swipe-row");
const front = (i) => rows()[i].querySelector(".ui-swipe-row-front");
const x = (i) => { const t = front(i).style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const said = () => $("#swipe-row-said").textContent;
if (rows().length !== 5) return "five rows expected";

// Short of the middle of what is behind (152 / 2), slowly: it springs back.
await fingers("touchStart", [middle(front(0))]);
const from = middle(front(0));
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: from.x - 8 * i, y: from.y }]); await wait(40); }
await wait(30);
if (x(0) !== -56) return "the row should follow the finger, less the slop: -56, is " + x(0);
await wait(120);
await fingers("touchEnd", []);
await wait(300);
if (x(0) !== 0) return "a short swipe should spring back: " + x(0);
if (rows()[0].classList.contains("ui-swipe-row-open")) return "a short swipe opened the row";

// Past the middle: open, at exactly the width of its two actions.
await drag(front(0), -110, 0, 500);
if (x(0) !== -152) return "open should rest at -152: " + x(0);
if (!rows()[0].classList.contains("ui-swipe-row-open")) return "not marked open";
const archive = rows()[0].querySelector(".ui-swipe-row-trailing button");
if (getComputedStyle(archive).visibility !== "visible") return "the actions are not showing";

// One row open: the next one's swipe, the other way, opens its one action and closes the first.
await drag(front(1), 60, 0, 500);
if (x(1) !== 76) return "the second should rest at 76: " + x(1);
if (x(0) !== 0) return "one row at a time: the first is still at " + x(0);
if ($$(".ui-swipe-row-open").length !== 1) return "open rows: " + $$(".ui-swipe-row-open").length;

// A touch elsewhere closes it.
await tap($("#swipe-row-said"));
if (x(1) !== 0) return "a touch elsewhere should close the row: " + x(1);

// A swipe further than the actions drags: 240 px of finger on the left, with one 76 px action
// and no full swipe that way: 76 + (232 - 76) * 0.3 = 122.8.
await fingers("touchStart", [middle(front(2))]);
const f2 = middle(front(2));
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: f2.x + 30 * i, y: f2.y }]); await wait(40); }
await wait(30);
if (Math.abs(x(2) - (76 + (112 - 76) * 0.3)) > 0.01) return "past the actions it should drag: " + x(2);
await wait(120);
await fingers("touchEnd", []);
await wait(300);
if (x(2) !== 76) return "should settle open at 76: " + x(2);
// Its action, by touch.
await tap(rows()[2].querySelector(".ui-swipe-row-leading button"));
if (said() !== "read: Parcel Tracking") return "the revealed action: " + said();
if (x(2) !== 0) return "an action should close the row: " + x(2);

// A flick opens from less than the middle: three quick moves, 45 px in all.
const flick = async (el, dist) => {
    const p = middle(el);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: p.x + dist * i / 3, y: p.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(320);
};
await flick(front(3), -65);
if (x(3) !== -152) return "a flick should open the row: " + x(3);
// And a flick back shuts it, though it is well past the middle.
await flick(front(3), 65);
if (x(3) !== 0) return "a flick back should close it: " + x(3);

// A full swipe runs the action marked full, once.
const width = front(4).offsetWidth;
await drag(front(4), -width * 0.72, 0, 500);
await wait(300);
if (said() !== "archive: Tom Reyes") return "a full swipe should archive: " + said();
if (x(4) !== 0) return "after a full swipe the row comes back: " + x(4);
if (rows()[4].classList.contains("ui-swipe-row-open")) return "open after a full swipe";

// The system taking the gesture springs back and runs nothing.
const was = said();
const f4 = middle(front(4));
await fingers("touchStart", [f4]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: f4.x - 40 * i, y: f4.y }]); await wait(20); }
await wait(30);
if (x(4) >= -200) return "cancel test: the row did not follow: " + x(4);
await fingers("touchCancel", []);
await wait(300);
if (x(4) !== 0) return "a cancelled swipe should spring back: " + x(4);
if (said() !== was) return "a cancelled swipe ran an action: " + said();

// Up and down belongs to the page: a vertical drag leaves the row alone.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(front(1)), scrollY);
await drag(front(1), 4, -160, 250);
if (x(1) !== 0) return "a vertical drag moved the row: " + x(1);
if (scrollY <= y0) return "a vertical drag should scroll the page";
document.body.style.paddingBottom = "";
await wait(50);

// Keys: the arrows open a focused row, Escape closes it.
const row = front(0);
row.focus();
key(row, "ArrowLeft");
await wait(320);
if (x(0) !== -152) return "ArrowLeft should open the trailing actions: " + x(0);
key(row, "Escape");
await wait(320);
if (x(0) !== 0) return "Escape should close: " + x(0);
key(row, "ArrowRight");
await wait(320);
if (x(0) !== 76) return "ArrowRight should open the leading actions: " + x(0);
key(row, "ArrowLeft");
await wait(320);
if (x(0) !== 0) return "the other arrow should close: " + x(0);

// One row at a time by keys alone, where no touch elsewhere closes the first.
key(front(0), "ArrowLeft");
await wait(320);
key(front(1), "ArrowLeft");
await wait(320);
if (x(0) !== 0) return "opening a row by keys should close the other: " + x(0);
if (x(1) !== -152) return "the second row by keys: " + x(1);
key(front(1), "Escape");
await wait(320);
// An arrow on the row's own button is not an arrow on the row.
key(rows()[0].querySelector(".ui-swipe-row-more-btn"), "ArrowLeft");
await wait(320);
if (x(0) !== 0) return "an arrow on the More button moved the row: " + x(0);

if (device === "phone") {
    // The More button lists every action, and focus goes there.
    const more = rows()[1].querySelector(".ui-swipe-row-more-btn");
    if (more.getAttribute("aria-label") !== "More actions for Maya Chen") return "More has no name: " + more.getAttribute("aria-label");
    await tap(more);
    const chips = () => [...rows()[1].querySelectorAll(".ui-swipe-row-sheet button")];
    if (chips().map((b) => b.textContent).join() !== "Read,Archive,Delete") return "the list of actions: " + chips().map((b) => b.textContent);
    if (document.activeElement !== chips()[0]) return "focus did not go to the first action";
    key(chips()[0], "Escape");
    await wait(60);
    if (chips().length) return "Escape should close the list";
    if (document.activeElement !== more) return "focus should return to More";
    await tap(more);
    await tap(chips()[2]);
    if (said() !== "delete: Maya Chen") return "the listed action: " + said();
    if (rows().length !== 4) return "delete should remove the row: " + rows().length;
    if (getComputedStyle(rows()[0].querySelector(".ui-swipe-row-inline")).display !== "none") return "a phone keeps the actions behind the row";
} else {
    // A tablet has room: the actions stand on the row, and no More button is needed.
    if (getComputedStyle(rows()[1].querySelector(".ui-swipe-row-more-btn")).display !== "none") return "a tablet should not need More";
    const inline = [...rows()[1].querySelectorAll(".ui-swipe-row-inline button")];
    if (inline.map((b) => b.textContent).join() !== "Read,Archive,Delete") return "the actions on the row: " + inline.map((b) => b.textContent);
    await tap(inline[2]);
    if (said() !== "delete: Maya Chen") return "the row's own action: " + said();
    if (rows().length !== 4) return "delete should remove the row";
}
