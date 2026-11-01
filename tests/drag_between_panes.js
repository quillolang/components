// tablet
await wait(300);
const bad = $("#drag-between-panes-bad");
const badTitles = [...bad.querySelectorAll(".ui-drag-between-panes-title")].map((t) => t.textContent).join();
const badHeads = [...bad.querySelectorAll("h3")].map((t) => t.textContent).join();
if (badTitles !== "Kept" || badHeads !== "B") return "bad data: " + badHeads + " / " + badTitles;
bad.remove();
const lists = () => Object.fromEntries($$(".ui-drag-between-panes-list").map((l) => [l.dataset.pane, [...l.querySelectorAll(".ui-drag-between-panes-row")].map((r) => r.dataset.id).join(" ")]));
const list = (p) => $(`.ui-drag-between-panes-list[data-pane=${p}]`);
const row = (id) => $(`.ui-drag-between-panes-row[data-id="${id}"]`);
const note = () => $("#drag-between-panes-note").textContent;
const said = () => $(".ui-sr[role=status]").textContent;
const ghost = $(".ui-drag-between-panes-ghost");
const flying = () => getComputedStyle(ghost).display !== "none";
const start = "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19|20 21|30";
const now = () => { const l = lists(); return [l.backlog, l.today, l.done].join("|"); };
if (now() !== start) return "start: " + now();

// A quick drag scrolls the pane and lifts nothing.
const text = (id) => row(id).querySelector(".ui-drag-between-panes-text");
await drag(text(3), 0, -120, 200);
await wait(120);
if (list("backlog").scrollTop <= 0) return "a quick drag should scroll the pane";
if (flying() || now() !== start) return "a quick drag lifted something";
list("backlog").scrollTop = 0;
await wait(60);

// A long press lifts it; the finger takes it over Today, a gap shows, and letting go puts it there.
const lift = async (el) => { const p = middle(el); await fingers("touchStart", [p]); await wait(420); return p; };
const p = await lift(text(2));
if (!flying()) return "a long press did not lift the item";
if (!row(2).classList.contains("ui-drag-between-panes-source")) return "the source is not marked";
if (ghost.textContent !== "Order filters") return "the ghost: " + ghost.textContent;
// Between the two rows of Today.
const r20 = row(20).getBoundingClientRect(), r21 = row(21).getBoundingClientRect();
const over = { x: r20.left + r20.width / 2, y: r21.top };
await fingers("touchMove", [{ x: (p.x + over.x) / 2, y: (p.y + over.y) / 2 }]);
await fingers("touchMove", [over]);
await wait(80);
const kids = () => [...list("today").children].map((c) => c.dataset.id ?? "gap").join(" ");
if (kids() !== "20 gap 21") return "the drop preview: " + kids();
if ($$(".ui-drag-between-panes-pane")[1].className.indexOf("ui-drag-between-panes-over") < 0) return "the pane is not marked";
// The ghost is under the finger, whatever box the page sits in.
const g = ghost.getBoundingClientRect();
if (Math.abs(g.top + 30 - over.y) > 40 || over.x < g.left || over.x > g.right) return "the ghost is not under the finger: " + g.left + "," + g.top + " for " + over.x + "," + over.y;
// The gap coming was a state change; so is the page's name for what happened, and the ghost keeps its place through both.
const flown = ghost.style.transform, flownWidth = ghost.style.width;
if (!flown.startsWith("translate(") || !flownWidth) return "the ghost's style: " + ghost.getAttribute("style");
await fingers("touchMove", [{ x: over.x + 1, y: over.y }]);
await wait(60);
if (!ghost.style.transform.startsWith("translate(") || ghost.style.width !== flownWidth) return "a state change mid-drag moved the ghost: " + ghost.getAttribute("style");
await fingers("touchEnd", []);
await wait(120);
if (now() !== "1 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19|20 2 21|30") return "after a drop: " + now();
if (note() !== "2 from backlog to today at 1.") return "on_move: " + note();
if (flying()) return "the ghost stayed";
if (said() !== "Order filters moved to Today, place 2.") return "said: " + said();
if ($$(".ui-drag-between-panes-count")[1].textContent !== "3 of 3") return "the count: " + $$(".ui-drag-between-panes-count")[1].textContent;

// Today is full now: over it the gap says so, and letting go moves nothing.
await lift(text(1));
const r0 = row(20).getBoundingClientRect();
await fingers("touchMove", [{ x: r0.left + 40, y: r0.top + 10 }]);
await wait(80);
const slot = $(".ui-drag-between-panes-slot");
if (!slot || slot.textContent !== "Full" || !slot.classList.contains("ui-drag-between-panes-refused")) return "a full pane's preview: " + (slot && slot.textContent);
await fingers("touchEnd", []);
await wait(120);
if (now() !== "1 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19|20 2 21|30") return "a full pane took it: " + now();
if (note() !== "2 from backlog to today at 1.") return "on_move after a refusal: " + note();
if (said() !== "Today is full.") return "said: " + said();

// Let go outside the panes, or cancelled, it goes back.
const before = now();
await lift(text(1));
await fingers("touchMove", [{ x: 2, y: 4 }]);
await wait(80);
if ($(".ui-drag-between-panes-slot")) return "a gap with nothing under the finger";
await fingers("touchEnd", []);
await wait(120);
if (now() !== before) return "let go outside: " + now();
await lift(text(1));
const c = row(30).getBoundingClientRect();
await fingers("touchMove", [{ x: c.left + 40, y: c.top + 10 }]);
await wait(60);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(120);
if (now() !== before || flying()) return "a cancel: " + now();
if ($(".ui-drag-between-panes-slot")) return "the gap stayed after a cancel";

// The grip lifts at once, with no wait.
const gr = middle(row(30).querySelector(".ui-drag-between-panes-grip"));
await fingers("touchStart", [gr]);
await wait(40);
if (!flying()) return "the grip did not lift at once";
const end = list("backlog").getBoundingClientRect();
await fingers("touchMove", [{ x: end.left + 60, y: end.top + 70 }]);
await wait(60);
await fingers("touchEnd", []);
await wait(120);
if (lists().done !== "") return "the grip's move: " + now();
if (!lists().backlog.split(" ").includes("30")) return "the grip's move: " + now();
if (!note().startsWith("30 from done to backlog at ")) return "on_move: " + note();
if (!$(".ui-drag-between-panes-empty")) return "an empty pane should say so";

// A pen lifts after a small move, with no long press.
const pen = (type, q, o = {}) => cdp("Input.dispatchMouseEvent", { type, x: q.x, y: q.y, pointerType: "pen", button: "left", buttons: 1, clickCount: 1, force: 0.5, ...o });
const a = middle(text(21));
const done = list("done").getBoundingClientRect();
await pen("mousePressed", a);
await pen("mouseMoved", { x: a.x + 3, y: a.y });
await wait(30);
if (flying()) return "a pen lifted before the threshold";
await pen("mouseMoved", { x: a.x + 20, y: a.y });
await wait(30);
if (!flying()) return "a pen past the threshold did not lift";
await pen("mouseMoved", { x: done.left + 60, y: done.top + 40 });
await wait(60);
await pen("mouseReleased", { x: done.left + 60, y: done.top + 40 }, { buttons: 0 });
await wait(120);
if (lists().done !== "21") return "a pen's move: " + now();
if (note() !== "21 from today to done at 0.") return "on_move by pen: " + note();

// The keys: lift, two along and down one, put.
const grip = row(21).querySelector(".ui-drag-between-panes-grip");
grip.focus();
const press = async (k, code, vk, text) => {
    await cdp("Input.dispatchKeyEvent", { type: text ? "keyDown" : "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, text });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
    await wait(60);
};
await press(" ", "Space", 32, " ");
if (!$(".ui-drag-between-panes-slot")) return "Space did not lift it";
await press("ArrowLeft", "ArrowLeft", 37);
if (!said().startsWith("Over Today, place 1 of 3")) return "over Today: " + said();
await press("ArrowDown", "ArrowDown", 40);
if (kids() !== "20 gap 2") return "ArrowDown's gap: " + kids();
await press(" ", "Space", 32, " ");
await wait(80);
if (lists().today !== "20 21 2") return "a keyboard move: " + now();
if (note() !== "21 from done to today at 1.") return "on_move by keys: " + note();
if (document.activeElement !== row(21).querySelector(".ui-drag-between-panes-grip")) return "focus should stay on the grip";
// Escape puts it back.
await press("Enter", "Enter", 13, "\r");
await press("ArrowRight", "ArrowRight", 39);
await press("Escape", "Escape", 27);
if ($(".ui-drag-between-panes-slot") || lists().today !== "20 21 2") return "Escape: " + now();
// A full pane says so by key too.
const g5 = row(5).querySelector(".ui-drag-between-panes-grip");
g5.focus();
await press(" ", "Space", 32, " ");
await press("ArrowRight", "ArrowRight", 39);
if (said() !== "Today is full.") return "a full pane by key: " + said();
await press(" ", "Space", 32, " ");
if (now().indexOf("|20 21 2|") < 0) return "a full pane took it by key: " + now();

// The Move list: the same thing with no drag at all.
const sel = row(7).querySelector("select");
sel.value = "done";
sel.dispatchEvent(new Event("change", { bubbles: true }));
await wait(120);
if (!lists().done.split(" ").includes("7")) return "the Move list: " + now();
if (document.activeElement !== row(7).querySelector(".ui-drag-between-panes-grip")) return "focus after the Move list";
if (note() !== "7 from backlog to done at 0.") return "on_move from the list: " + note();

// Turning the tablet keeps every item where it was.
const kept = now(), turned = innerWidth > innerHeight;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await (turned ? size(820, 1180) : size(1180, 820));
await wait(250);
if (now() !== kept) return "turning changed the panes";
await (turned ? size(1180, 820) : size(820, 1180));
await wait(250);
