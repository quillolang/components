// mobile
await wait(300);
const bad = $("#task-row-bad");
const badTitles = [...bad.querySelectorAll(".ui-task-row-title")].map((t) => t.textContent);
if (badTitles.join() !== "Untitled,Untitled,One,Untitled") return "bad data: " + badTitles.join();
bad.remove();

const row = (id) => $(`.ui-task-rows-item[data-id="${id}"]`);
const rowOf = (id) => row(id).querySelector(".ui-task-row");
const front = (id) => row(id).querySelector(".ui-task-row-front");
const check = (id) => row(id).querySelector(".ui-task-row-check");
const x = (id) => { const t = front(id).style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const order = () => $$(".ui-task-rows-item").map((r) => r.dataset.id).join(" ");
const part = (id) => row(id).dataset.part;
const log = () => $("#task-row-log").textContent;
const due = (id) => row(id).querySelector(".ui-task-row-due")?.textContent;
const tone = (id) => row(id).querySelector(".ui-task-row-due")?.dataset.tone;
const w = rowOf(1).offsetWidth;

// The words from a known day: 2026-11-01 is a Sunday.
if (due(1) !== "2 days late" || tone(1) !== "late") return "overdue: " + due(1);
if (due(2) !== "Today" || tone(2) !== "today") return "today: " + due(2);
if (due(3) !== "Wednesday") return "a weekday within the week: " + due(3);
if (due(4) !== "Thu 10 Dec") return "later this year: " + due(4);
if (order() !== "1 2 3 4 5") return "start: " + order();
if (part(5) !== "done" || part(4) !== "open") return "parts at the start";
if (check(1).getAttribute("aria-checked") !== "false" || check(5).getAttribute("aria-checked") !== "true") return "the checks at the start";
if (getComputedStyle(front(1)).touchAction !== "pan-y") return "touch-action: " + getComputedStyle(front(1)).touchAction;
if (check(3).dataset.priority !== "medium") return "priority";

// Short of the threshold, slowly: springs back.
await drag(front(1), 40, 0, 500);
await wait(300);
if (x(1) !== 0) return "a short swipe right should spring back: " + x(1);
await drag(front(1), -30, 0, 500);
await wait(300);
if (x(1) !== 0) return "a short swipe left should spring back: " + x(1);

// A cancelled swipe springs back; mid-swipe it follows the finger less the slop.
const p = middle(front(1));
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x + 10 * i, y: p.y }]); await wait(30); }
await wait(40);
if (x(1) !== 52) return "mid-swipe: " + x(1);
if (rowOf(1).dataset.way !== "due") return "the due actions should show under a swipe right";
if (getComputedStyle(front(1)).userSelect !== "none") return "selection should be off in a swipe";
// State changing under the finger must leave the drag alone.
row(1).querySelector(".ui-task-row-icon").click();
await wait(60);
if (x(1) !== 52 || rowOf(1).dataset.way !== "due" || !front(1).classList.contains("ui-task-row-moving")) return "a state change undid the swipe: " + x(1) + " " + rowOf(1).dataset.way;
row(1).querySelector(".ui-task-row-icon").click();
await wait(60);
if (x(1) !== 52) return "a second state change undid the swipe: " + x(1);
await fingers("touchCancel", []);
await wait(300);
if (x(1) !== 0 || rowOf(1).dataset.way !== "") return "a cancelled swipe should spring back: " + x(1);

// Past it, right: the due actions stay open, tappable.
await drag(front(1), 110, 0, 500);
await wait(300);
if (x(1) !== 192) return "a swipe right should rest at 192: " + x(1);
const acts = [...rowOf(1).querySelectorAll(".ui-task-row-under-due button")];
if (acts.map((b) => b.textContent).join() !== "Today,Tomorrow,Pick a day") return "actions: " + acts.map((b) => b.textContent);
if (acts[0].tabIndex !== 0) return "open actions should be reachable";
await tap(acts[1]);
if (log() !== "due 1 2026-11-02") return "Tomorrow: " + log();
if (due(1) !== "Tomorrow" || x(1) !== 0) return "after Tomorrow: " + due(1) + " " + x(1);

// A throw from a short way opens too; another row's touch shuts it.
const flick = async (el, dist) => {
    const q = middle(el);
    await fingers("touchStart", [q]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x + dist * i / 3, y: q.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(320);
};
await flick(front(2), 50);
if (x(2) !== 192) return "a throw right should open: " + x(2);
await tap(front(4));
if (x(2) !== 0) return "touching another row should shut it: " + x(2);
await flick(front(2), -50);
if (x(2) !== -88) return "a throw left should show Delete: " + x(2);
await tap(front(2));
if (x(2) !== 0) return "a tap should shut it: " + x(2);

// The list scrolls under a vertical drag; the row does not move.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(front(3)), scrollY);
await drag(front(3), 4, -150, 250);
if (x(3) !== 0) return "a vertical drag moved the row";
if (scrollY <= y0) return "a vertical drag should scroll the page";
document.body.style.paddingBottom = "";
scrollTo(0, 0);
await wait(100);

// The line through a finished title stops at its words, not at the row's edge.
const doneTitle = row(5).querySelector(".ui-task-row-title");
const words = document.createRange();
words.selectNodeContents(doneTitle);
if (Math.abs(doneTitle.getBoundingClientRect().width - words.getBoundingClientRect().width) > 1) return "the strike runs past the words: " + doneTitle.getBoundingClientRect().width + " " + words.getBoundingClientRect().width;

// The check: at once on the row, then a smooth move to the finished part, not before.
await tap(check(2));
if (log() !== "toggle 2 true") return "toggle: " + log();
if (check(2).getAttribute("aria-checked") !== "true") return "the check should fill";
if (!rowOf(2).classList.contains("ui-task-row-done")) return "the row should show done";
await wait(450);
if (order() !== "1 3 4 2 5") return "after finishing: " + order();
if (part(2) !== "done") return "the row should be in the finished part";
if (device === "phone") {
    const heads = $$(".ui-task-rows-head").filter((h) => h.offsetParent);
    if (heads.length !== 1 || heads[0].textContent !== "Completed (2)") return "the finished heading: " + heads.map((h) => h.textContent);
    if (heads[0].getBoundingClientRect().top > row(2).getBoundingClientRect().top) return "the heading stands above what it heads";
} else {
    if ($$(".ui-task-rows-head")[0].textContent !== "To do (3)") return "the open heading: " + $$(".ui-task-rows-head")[0].textContent;
    const l = row(1).getBoundingClientRect(), r = row(2).getBoundingClientRect();
    if (r.left < l.right) return "a tablet shows the finished part beside: " + r.left + " " + l.right;
    if (r.top > l.top + 120) return "the finished column starts at the top: " + r.top + " " + l.top;
}
// And back.
await tap(check(2));
await wait(450);
if (part(2) !== "open") return "unticking should bring it back";
if (log() !== "toggle 2 false") return "untoggle: " + log();

// The move really plays: caught a frame after it starts.
// tap() itself waits 250 ms, and the move starts at 340.
await tap(check(4));
await wait(130);
const a = row(4).getAnimations();
if (matchMedia("(prefers-reduced-motion: reduce)").matches === false && a.length !== 1) return "the row should animate to its place: " + a.length;
await wait(350);
await tap(check(4));
await wait(450);

// Subtasks: a count, opened, ticked; the ring follows.
const count = row(3).querySelector(".ui-task-row-count");
if (count.textContent !== "2/4") return "subtask count: " + count.textContent;
if (row(3).querySelector(".ui-task-row-ring").style.getPropertyValue("--done").trim() !== "0.5") return "the ring: " + row(3).querySelector(".ui-task-row-ring").getAttribute("style");
await tap(count);
const subs = () => [...row(3).querySelectorAll(".ui-task-row-sub")];
if (subs().length !== 4 || count.getAttribute("aria-expanded") !== "true") return "subtasks should open";
await tap(subs()[1].querySelector("button"));
if (log() !== "sub 3 b true") return "subtask: " + log();
if (row(3).querySelector(".ui-task-row-count").textContent !== "3/4") return "the count should follow: " + row(3).querySelector(".ui-task-row-count").textContent;
if (row(3).querySelector(".ui-task-row-ring").style.getPropertyValue("--done").trim() !== "0.75") return "the ring should follow";
await tap(row(3).querySelector(".ui-task-row-count"));
if (subs().length !== 0) return "subtasks should shut";

// The equal of a swipe: More has the same, and a date.
const more = (id) => row(id).querySelector('.ui-task-row-icon');
await tap(more(4));
const panel = () => row(4).querySelector(".ui-task-row-more");
if (more(4).getAttribute("aria-expanded") !== "true" || !panel()) return "More should open";
const by = (t) => [...panel().querySelectorAll("button")].find((b) => b.textContent === t);
await tap(by("Next week"));
if (log() !== "due 4 2026-11-02") return "Next week from a Sunday is the next day's Monday: " + log();
await tap(more(4));
type(panel().querySelector("input"), "2026-11-20");
await wait(100);
if (log() !== "due 4 2026-11-20") return "a picked day: " + log();
if (due(4) !== "Fri 20 Nov") return "the picked day's words: " + due(4);
await tap(more(4));
await tap(by("No day"));
if (log() !== "due 4 null" || due(4) !== undefined) return "no day: " + log() + " " + due(4);

// A year away says the year.
await tap(more(4));
type(panel().querySelector("input"), "2027-01-20");
await wait(100);
if (due(4) !== "20 Jan 2027") return "another year: " + due(4);

// A short left swipe shows Delete, tapped it goes, and Undo brings it back in its place.
await drag(front(4), -90, 0, 500);
await wait(300);
if (x(4) !== -88) return "a swipe left should rest at -88: " + x(4);
await tap(rowOf(4).querySelector(".ui-task-row-act-del"));
await wait(60);
if (row(4)) return "Delete should take the row away";
const bar = () => $(".ui-task-rows-bar");
if (bar().querySelector("span").textContent !== "Read the lease deleted") return "the bar: " + bar().textContent;
if (log() === "delete 4") return "nothing is final until the undo runs out";
await tap($(".ui-task-rows-undo"));
await wait(100);
if (!row(4) || order() !== "1 2 3 4 5") return "Undo: " + order();
if (log() !== "restore 4") return "on_restore: " + log();

// A long swipe deletes at once, and past the undo it is final.
await drag(front(1), -w * 0.75, 0, 400);
await wait(120);
if (row(1)) return "a long swipe should delete";
await wait(2200);
if (log() !== "delete 1") return "final after the undo: " + log();
if (bar()) return "the bar should leave";

// The keyboard: Delete on the check, Escape shuts what a swipe opened.
check(3).focus();
key(check(3), "Delete");
await wait(100);
if (row(3)) return "Delete on a focused row";
await tap($(".ui-task-rows-undo"));
await wait(100);
if (!row(3)) return "Undo after Delete";
await drag(front(3), 110, 0, 500);
await wait(300);
key(check(3), "Escape");
await wait(300);
if (x(3) !== 0) return "Escape should shut the row: " + x(3);
