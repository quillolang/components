// mobile
await wait(300);
// Bad data: what has a title, each id once.
const bad = [...$("#swipe-dismiss-bad").querySelectorAll(".ui-swipe-dismiss-list")].map((l) => [...l.querySelectorAll(".ui-swipe-dismiss-title")].map((t) => t.textContent).join());
if (bad.join("|") !== "Two,No id|") return "bad items: " + bad.join("|");
$("#swipe-dismiss-bad").remove();

const fronts = () => $$(".ui-swipe-dismiss-front");
const front = (id) => $(`.ui-swipe-dismiss-front[data-id="${id}"]`);
const row = (id) => front(id).closest("li");
const shown = () => $$(".ui-swipe-dismiss-row:not(.ui-swipe-dismiss-gone) .ui-swipe-dismiss-front").map((f) => f.dataset.id).join(" ");
const log = () => $("#swipe-dismiss-log").textContent;
const undone = () => $("#swipe-dismiss-undone").textContent;
const x = (id) => { const t = front(id).style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const batches = () => $$(".ui-swipe-dismiss-batch").filter((b) => getComputedStyle(b).display !== "none").map((b) => b.querySelector("span").textContent);
const undoBtn = (i = 0) => $$(".ui-swipe-dismiss-undo")[i];
// From the top of the page, where a tablet's batches stand beside the list.
const undoTap = async (i = 0) => { scrollTo(0, 0); await wait(40); await tap(undoBtn(i)); };
const w = front(1).offsetWidth;
const rowH = row(2).offsetHeight;
if (shown() !== "1 2 3 4 5 6") return "start: " + shown();

// Short of 40%, slowly: back, and nothing is sent.
await drag(front(1), -w * 0.25, 0, 500);
await wait(100);
if (x(1) !== 0) return "a short swipe should spring back: " + x(1);
if (shown() !== "1 2 3 4 5 6") return "a short swipe dismissed";

// Mid-way it follows the finger, less the slop, and shows what it will do.
const p = middle(front(1));
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - 12 * i, y: p.y }]); await wait(40); }
await wait(60);
if (x(1) !== -64) return "mid-swipe: " + x(1);
if (front(1).previousElementSibling.dataset.way !== "left") return "the label should stand on the side it is uncovered";
if (getComputedStyle(front(1)).userSelect !== "none") return "selection should be off in a swipe";
await fingers("touchCancel", []);
await wait(300);
if (x(1) !== 0 || shown() !== "1 2 3 4 5 6") return "a cancelled swipe should spring back";

// Past 40%: it goes, and those below close up by exactly its height.
const y3 = front(3).getBoundingClientRect().top;
await drag(front(2), w * 0.55, 0, 500);
if (shown() !== "1 3 4 5 6") return "a long swipe should send the row: " + shown();
await wait(500);
const moved = y3 - front(3).getBoundingClientRect().top;
if (Math.abs(moved - rowH) > 1.5) return "the rows should close up by " + rowH + ", moved " + moved;
if (row(2).getBoundingClientRect().height > 0.5) return "the gone row should have no height: " + row(2).getBoundingClientRect().height;
if (getComputedStyle(row(2)).visibility !== "hidden") return "the gone row should be out of reach";
if (batches()[0] !== "Ana replied removed") return "the bar: " + batches();

// Undo: it comes back in its own place.
await undoTap();
await wait(450);
if (shown() !== "1 2 3 4 5 6") return "undo should restore the order: " + shown();
if (x(2) !== 0) return "the row should come back into place: " + x(2);
if (undone() !== "2") return "on_undo: " + undone();
if (batches().length !== 0) return "the bar should go after the last undo";
if (Math.abs(front(3).getBoundingClientRect().top - y3) > 1) return "the rows should open back up";

// A throw from a short distance sends it; thrown back, it stays.
const flick = async (id, dist) => {
    const q = middle(front(id));
    await fingers("touchStart", [q]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x + dist * i / 3, y: q.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(320);
};
await flick(5, -70);
if (shown() !== "1 2 3 4 6") return "a throw should send the row: " + shown();
await undoTap();
await wait(450);
const q = middle(front(5));
await fingers("touchStart", [q]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: q.x + 25 * i, y: q.y }]); await wait(30); }
await wait(120);
for (let i = 1; i <= 2; i++) { await fingers("touchMove", [{ x: q.x + 150 - 45 * i, y: q.y }]); await wait(4); }
await fingers("touchEnd", []);
await wait(320);
if (shown() !== "1 2 3 4 5 6") return "a throw back should keep the row: " + shown();

// Up and down is the page's.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(front(3)), scrollY);
await drag(front(3), 3, -150, 250);
if (x(3) !== 0) return "a vertical drag moved the row";
if (scrollY <= y0) return "a vertical drag should scroll the page";
document.body.style.paddingBottom = "";
await wait(50);

// Batches. Two within the second are one; the third, later, is another. The button is the equal.
const btn = (id) => front(id).querySelector("button");
if (btn(1).getAttribute("aria-label") !== "Dismiss Build finished") return "the button's name: " + btn(1).getAttribute("aria-label");
await tap(btn(1));
await tap(btn(3));
await wait(1200);
await tap(btn(5));
if (shown() !== "2 4 6") return "three gone: " + shown();
const n = $$(".ui-swipe-dismiss-undo").length;
if (n !== 2) return "two batches expected, have " + n;
if (device === "phone") {
    if (batches().join() !== "Parcel delivered removed (1 more)") return "a phone shows the newest: " + batches();
} else {
    if (batches().join("|") !== "Parcel delivered removed (1 more)|2 removed") return "a tablet shows them all: " + batches();
    if ($(".ui-swipe-dismiss-bar").getBoundingClientRect().left < $(".ui-swipe-dismiss-list").getBoundingClientRect().right - 1) return "a tablet's batches stand beside the list";
}

if (document.documentElement.scrollWidth > innerWidth) return "the batches widen the page: " + document.documentElement.scrollWidth;

// Newest first, each back to its place.
await undoTap();
await wait(100);
if (undone() !== "5") return "the newest batch first: " + undone();
if (shown() !== "2 4 5 6") return "after one undo: " + shown();
await undoTap();
await wait(100);
if (undone() !== "1 3") return "then the batch before, in order: " + undone();
if (shown() !== "1 2 3 4 5 6") return "after both: " + shown();
await wait(420);

// The keyboard: Delete on the button, focus goes on, and Ctrl+Z undoes.
btn(2).focus();
key(btn(2), "Delete");
await wait(80);
if (shown() !== "1 3 4 5 6") return "Delete: " + shown();
if (document.activeElement !== btn(3)) return "focus should go to the next row, is on " + document.activeElement.className;
$(".ui-swipe-dismiss").querySelector("button").focus();
btn(3).dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true }));
await wait(450);
if (shown() !== "1 2 3 4 5 6") return "Ctrl+Z: " + shown();

if (device === "tablet") {
    // On a tablet an older batch can be undone past a newer one.
    await tap(btn(1));
    await wait(1200);
    await tap(btn(2));
    await wait(60);
    await undoTap(1);
    await wait(100);
    if (undone() !== "1") return "the older batch: " + undone();
    if (shown() !== "1 3 4 5 6") return "after the older undo: " + shown();
    await undoTap();
    await wait(450);
}

// Running out: oldest first, and only then is it final. 5 s from each batch's last row.
await tap($(".ui-swipe-dismiss-clear"));
await wait(40);
if (shown() !== "") return "Clear all: " + shown();
if ($(".ui-swipe-dismiss-none").textContent !== "All clear.") return "the empty list: " + $(".ui-swipe-dismiss-none").textContent;
if (batches()[0] !== "6 removed") return "Clear all is one batch: " + batches();
await undoTap();
await wait(450);
if (shown() !== "1 2 3 4 5 6") return "Clear all undone: " + shown();

await tap(btn(1));
await wait(1200);
await tap(btn(6));
await wait(3000);
if (log() !== "Nothing final yet.") return "nothing is final yet: " + log();
await wait(1100);
if (log() !== "1") return "the first batch ran out first: " + log();
if (front(1)) return "a final row should leave the page";
await wait(1400);
if (log() !== "1; 6") return "then the second: " + log();
if (front(6)) return "the second row should leave too";
if (batches().length !== 0) return "no batches should be left";
if (shown() !== "2 3 4 5") return "what is left: " + shown();
