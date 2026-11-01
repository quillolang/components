// mobile
await wait(300);
const box = $("#swipe-kanban-screen .ui-swipe-kanban");
const track = box.querySelector(".ui-swipe-kanban-track");
const col = (id) => box.querySelector(`.ui-swipe-kanban-col[data-id="${id}"]`);
const inCol = (id) => [...col(id).querySelectorAll(".ui-swipe-kanban-card")].map((c) => c.dataset.id).join(" ");
const board = () => ["todo", "doing", "review", "done"].map(inCol).join(" | ");
const card = (id) => box.querySelector(`.ui-swipe-kanban-card[data-id="${id}"]`);
const grip = (id) => card(id).querySelector(".ui-swipe-kanban-grip");
const tabs = () => [...box.querySelectorAll(".ui-swipe-kanban-tab")];
const selected = () => tabs().findIndex((t) => t.getAttribute("aria-selected") === "true");
const log = () => $("#swipe-kanban-log").textContent;
const say = () => box.querySelector(".ui-swipe-kanban-say").textContent;
const ghost = box.querySelector(".ui-swipe-kanban-ghost");
const line = box.querySelector(".ui-swipe-kanban-line");
const dlg = box.querySelector("dialog");
const settle = async () => { let last = -1; for (let i = 0; i < 30; i++) { await wait(60); if (track.scrollLeft === last) break; last = track.scrollLeft; } await wait(60); };
const page = async (i) => { await tap(tabs()[i]); await settle(); };
const step = () => col("doing").offsetLeft - col("todo").offsetLeft;
const shown = () => ["todo", "doing", "review", "done"].filter((id) => { const r = col(id).getBoundingClientRect(), b = box.getBoundingClientRect(); return r.left >= b.left - 1 && r.right <= b.right + 1; }).join(" ");

// Bad data: a column without a title has its id, a card lost goes to the first, nothing stops.
const bad = $("#swipe-kanban-bad");
const badCards = [...bad.querySelectorAll(".ui-swipe-kanban-title")].map((t) => t.textContent).filter((t) => t);
if (badCards.join() !== "Lost") return "bad data: " + badCards.join();
if ([...bad.querySelectorAll(".ui-swipe-kanban-tab")].map((t) => t.firstChild.textContent).join() !== "a") return "bad columns";
if (bad.querySelectorAll(".ui-swipe-kanban")[1].querySelector(".ui-swipe-kanban-none").textContent !== "No columns.") return "no columns";
bad.remove();

if (board() !== "1 2 3 | 4 5 |  | 6") return "start: " + board();
if (tabs().map((t) => t.textContent).join() !== "To do3,Doing2,Review0,Done1") return "tabs: " + tabs().map((t) => t.textContent).join();
if (getComputedStyle(grip(1)).touchAction !== "none") return "the grip: " + getComputedStyle(grip(1)).touchAction;
if (getComputedStyle(card(1)).touchAction !== "pan-x pan-y") return "the card: " + getComputedStyle(card(1)).touchAction;
if (getComputedStyle(track).scrollSnapType !== "x mandatory") return "snap: " + getComputedStyle(track).scrollSnapType;
if (device === "phone" && shown() !== "todo") return "one column on a phone: " + shown();
if (device === "tablet" && shown() !== "todo doing review") return "three on a tablet: " + shown();

// A swipe goes a page.
await drag(track, -260, 0, 300);
await settle();
if (Math.abs(track.scrollLeft - step()) > 1) return "a swipe should go one column: " + track.scrollLeft + " " + step();
if (selected() !== 1) return "the tab follows: " + selected();
await drag(track, 80, 0, 900);
await settle();
if (device === "phone" && Math.abs(track.scrollLeft - step()) > 1 && track.scrollLeft !== 0) return "a short swipe snaps back: " + track.scrollLeft;
await page(0);
if (track.scrollLeft !== 0 || selected() !== 0) return "the tab goes there: " + track.scrollLeft;
await page(1);
await page(0);

// A tap opens; a tap on the grip moves nothing.
await tap(card(2).querySelector(".ui-swipe-kanban-open"));
if (log() !== "open 2") return "on_open: " + log();
await tap(grip(2));
if (board() !== "1 2 3 | 4 5 |  | 6") return "a tap on the grip moved it: " + board();
if (!ghost.hidden || !line.hidden) return "nothing should stay in the air";

// Mid-drag: the ghost follows, the card stays dim, the line shows where.
const p = middle(grip(1));
await fingers("touchStart", [p]);
await wait(40);
if (ghost.hidden || !card(1).classList.contains("ui-swipe-kanban-lifted")) return "the grip should lift at once";
if (ghost.textContent.trim() !== "Write the brief") return "the ghost: " + ghost.textContent;
const y3 = card(3).getBoundingClientRect();
const y2 = card(2).getBoundingClientRect();
const steps = 8, target = y2.top + y2.height * 0.8 - p.y;
for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x + 10, y: p.y + target * i / steps }]); await wait(20); }
await wait(40);
const m = new DOMMatrix(getComputedStyle(ghost).transform);
const b = box.getBoundingClientRect();
const cr = card(1).getBoundingClientRect();
if (Math.abs(m.m41 - (cr.left + 10 - b.left)) > 2) return "the ghost's x: " + m.m41;
if (line.hidden) return "the line should show";
const ly = new DOMMatrix(getComputedStyle(line).transform).m42 + b.top;
if (Math.abs(ly - (y3.top - 4)) > 2) return "the line should stand above card 3: " + ly + " " + y3.top;
// State changing under the finger must leave the card in the air: the page, then the parent's own.
const gx = ghost.style.transform, gw = ghost.style.width;
tabs()[1].click();
await settle();
$("#swipe-kanban-refuse").click();
await wait(60);
if (selected() !== 1) return "the state should have changed: " + selected();
if (ghost.style.transform !== gx || ghost.style.width !== gw || ghost.hidden) return "a state change undid the drag: " + ghost.style.transform;
if (!card(1).classList.contains("ui-swipe-kanban-lifted")) return "a state change dropped the card";
$("#swipe-kanban-refuse").click();
tabs()[0].click();
await settle();
// Cancelled: nothing moved, all put away.
await fingers("touchCancel", []);
await wait(100);
if (board() !== "1 2 3 | 4 5 |  | 6") return "a cancelled drag moved it: " + board();
if (!ghost.hidden || !line.hidden || card(1).classList.contains("ui-swipe-kanban-lifted")) return "a cancelled drag should put all away";

// Dropped lower in the column: the order changes.
await drag(grip(1), 10, target, 300);
await wait(60);
if (inCol("todo") !== "2 1 3") return "reordered: " + inCol("todo");
if (log() !== "move 1 todo 1") return "on_move: " + log();
if (say() !== "Write the brief moved to To do.") return "says: " + say();

// To the edge and held: the board turns, and it lands in the next column.
const q = middle(grip(1));
const right = b.right - 12;
await fingers("touchStart", [q]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: q.x + (right - q.x) * i / 8, y: q.y }]); await wait(16); }
await wait(40);
if (device === "phone") {
    if (box.querySelector('.ui-swipe-kanban-edge[data-side="right"]').hidden) return "the edge should light";
    await wait(450);
    await settle();
    if (Math.abs(track.scrollLeft - step()) > 2) return "held at the edge the board should turn: " + track.scrollLeft;
    if (selected() !== 1) return "the tab follows the turn: " + selected();
    // Come away from the edge, into the column, to drop it.
    await fingers("touchMove", [{ x: right - 150, y: q.y }]);
    await wait(120);
    if (!box.querySelector('.ui-swipe-kanban-edge[data-side="right"]').hidden) return "the edge should go out";
} else {
    // The fourth column is out of view: the board turns to it.
    await wait(450);
    await settle();
    if (Math.abs(track.scrollLeft - step()) > 2) return "held at the edge the board should turn: " + track.scrollLeft;
    await fingers("touchMove", [{ x: col("review").getBoundingClientRect().left + 40, y: q.y }]);
    await wait(120);
}
await fingers("touchEnd", []);
await wait(120);
if (device === "phone") {
    if (inCol("doing").split(" ").indexOf("1") < 0 || inCol("todo") !== "2 3") return "landed: " + board();
    await page(2);
    await wait(30);
} else {
    if (inCol("review") !== "1") return "landed: " + board();
}
await page(0);

// A tablet: straight across without turning.
if (device === "tablet") {
    await drag(grip(2), col("doing").getBoundingClientRect().left + 60 - middle(grip(2)).x, -10, 300);
    await wait(100);
    if (inCol("doing") !== "2 4 5") return "across: " + board();
    await page(0);
}

// A long press anywhere on the card lifts it, and a passing finger only scrolls.
const pressed = 3;
const c = middle(card(pressed).querySelector(".ui-swipe-kanban-open"));
await fingers("touchStart", [c]);
await wait(120);
if (!card(pressed).classList.contains("ui-swipe-kanban-pressed")) return "a press should show";
await wait(380);
if (!card(pressed).classList.contains("ui-swipe-kanban-lifted")) return "a long press should lift";
await fingers("touchMove", [{ x: c.x + 2, y: c.y + 2 }]);
await wait(30);
await fingers("touchEnd", []);
await wait(100);
if (card(pressed).querySelector(".ui-swipe-kanban-open") === null || !ghost.hidden) return "the release should land";
if (log().startsWith("open")) return "a long press is not a tap";

await fingers("touchStart", [c]);
await wait(60);
await fingers("touchMove", [{ x: c.x - 40, y: c.y }]);
await wait(400);
if (card(pressed).classList.contains("ui-swipe-kanban-lifted")) return "a moved finger is no long press";
await fingers("touchCancel", []);
await wait(100);
await page(0);

// The menu moves it, says where it is, and the board goes to it on a phone.
const before = board();
const more = card(3).querySelector(".ui-swipe-kanban-more");
await tap(more);
if (!dlg.open) return "the menu should open";
const picks = () => [...dlg.querySelectorAll(".ui-swipe-kanban-pick")];
if (picks().map((x) => x.textContent).join() !== "In To do,To Doing,To Review,To Done,Up one place,Down one place,Close") return "the menu: " + picks().map((x) => x.textContent).join();
if (!picks()[0].disabled) return "its own column is off";
await tap(picks()[3]);
await settle();
if (dlg.open) return "the menu should close";
if (inCol("done") !== "6 3") return "to Done: " + board();
if (log() !== "move 3 done 1") return "on_move from the menu: " + log();
if (!shown().includes("done")) return "the board should go to it: " + shown();

// Refused: it goes back and says so.
$("#swipe-kanban-refuse").click();
await wait(60);
await tap(card(6).querySelector(".ui-swipe-kanban-more"));
await tap(picks()[0]);
await wait(150);
if (inCol("done") !== "6 3") return "a refused move goes back: " + board();
if (say() !== "Renew the domain could not be moved." || !box.querySelector(".ui-swipe-kanban-say").hasAttribute("data-bad")) return "refused: " + say();
$("#swipe-kanban-refuse").click();
await wait(60);
await settle();
await page(3);

// Up and down a place from the menu.
await tap(card(3).querySelector(".ui-swipe-kanban-more"));
await tap(picks()[4]);
await wait(100);
if (inCol("done") !== "3 6") return "Up one place: " + inCol("done");
await tap(card(3).querySelector(".ui-swipe-kanban-more"));
if (!picks()[4].disabled) return "the top card cannot go up";
await tap(picks()[6]);
await wait(100);

// The keys: focus stays on the grip, the column in view.
grip(3).focus();
key(grip(3), "ArrowDown");
await wait(100);
if (inCol("done") !== "6 3") return "ArrowDown: " + inCol("done");
if (document.activeElement !== grip(3)) return "focus should stay on the grip";
key(grip(3), "ArrowRight");
await wait(100);
if (inCol("done") !== "6 3") return "ArrowRight at the last column moves nothing: " + inCol("done");
key(grip(3), "ArrowLeft");
await settle();
if (inCol("done") !== "6" || !inCol("review").endsWith("3")) return "ArrowLeft: " + board();
if (document.activeElement !== grip(3)) return "focus should stay after a column";
if (device === "phone" && !shown().includes("review")) return "the column should come into view: " + shown();

// Turning keeps the column.
await page(1);
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await wait(350);
const after = selected();
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await wait(350);
if (after !== 1) return "turning should keep the column: " + after;
if (selected() !== 1) return "turned back: " + selected();
if (Math.abs(track.scrollLeft - step()) > 2) return "turned back, the place: " + track.scrollLeft;
