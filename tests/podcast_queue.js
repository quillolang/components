// mobile
const audio = $("#podq-demo");
// A flick with its speed fixed by the events' own times, so a busy machine cannot slow it.
const flick = async (el, dx, dy = 0) => {
    const p = middle(el), t0 = Date.now() / 1000, steps = 5;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p], timestamp: t0 });
    for (let i = 1; i <= steps; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }], timestamp: t0 + i * 0.012 });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: t0 + 0.07 });
    await wait();
};
const note = () => $("#podq-demo-note").textContent;
const ids = () => $$(".ui-podq-item").map((r) => r.dataset.id);
const row = (id) => $(`.ui-podq-item[data-id="${id}"]`);
const inRow = (id, s) => row(id).querySelector(s);
const total = () => $(".ui-podq-total").textContent, sub = () => $(".ui-podq-sub").textContent;
const leftOf = (id) => inRow(id, ".ui-podq-left").textContent;
const status = () => $(".ui-sr[role=status]").textContent;

// The totals, by hand: 8 + 14 + 2700 + 1800 + 900 + 1200 + 1500 + 1800 + 2100 = 12022 s, and the
// played one counts for nothing. Rounded up to the minute, 201 min.
if (total() !== "3 h 21 min left") return "the time left: " + total();
if (sub() !== "9 episodes to play, 1 downloaded (38 MB)") return "the line under it: " + sub();
if (leftOf("m3") !== "45 min left" || leftOf("m2") !== "30 min left" || leftOf("w9") !== "Played") return "each row's time: " + leftOf("m3") + " " + leftOf("m2") + " " + leftOf("w9");
if (inRow("m2", ".ui-podq-at").textContent !== "from 30:00") return "where it was left: " + inRow("m2", ".ui-podq-at")?.textContent;
if (inRow("m2", ".ui-podq-bar i").style.transform !== "scaleX(0.5)") return "and a bar: " + inRow("m2", ".ui-podq-bar i").style.transform;
if (inRow("e11", ".ui-podq-got").textContent !== "Downloaded") return "downloaded is shown";
if (inRow("e12", ".ui-podq-play").getAttribute("aria-label") !== "Resume Views first") return "a started one resumes: " + inRow("e12", ".ui-podq-play").getAttribute("aria-label");
if (inRow("m3", ".ui-podq-play").getAttribute("aria-label") !== "Play Salt roads") return "a new one plays";
if (inRow("w9", ".ui-podq-play").getAttribute("aria-label") !== "Play Weather for sailors") return "a played one plays from the start";

// Times follow the speed: 12022 / 1.5 = 8014.67 s, 134 min.
await tap($("#podq-demo-speed"));
if (total() !== "2 h 14 min left") return "at 1.5: " + total();
if (leftOf("m3") !== "30 min left") return "each row too: " + leftOf("m3");
if (!sub().includes("to play at 1.5×")) return "and it says so: " + sub();
await tap($("#podq-demo-speed"));
if (total() !== "3 h 21 min left") return "back at 1: " + total();

// Resume where it was left. Pausing reports the place, for keeping.
await tap(inRow("e12", ".ui-podq-play"));
await wait(500);
if (audio.paused) return "a tap plays";
if (audio.currentTime < 5.9 || audio.currentTime > 7.5) return "it resumes at 6: " + audio.currentTime;
if (!note().endsWith("started e12")) return "on_play: " + note();
if (!row("e12").classList.contains("ui-podq-now")) return "the row is marked";
if (inRow("e12", ".ui-podq-play").getAttribute("aria-label") !== "Pause Views first") return "and pauses: " + inRow("e12", ".ui-podq-play").getAttribute("aria-label");
audio.currentTime = 9;
await wait(300);
if (!inRow("e12", ".ui-podq-at").textContent.startsWith("from 0:09")) return "the place follows: " + inRow("e12", ".ui-podq-at").textContent;
await tap(inRow("e12", ".ui-podq-play"));
await wait(200);
if (!audio.paused) return "a second tap pauses";
if (!/place e12 (9|10)/.test(note())) return "on_position at the pause: " + note();

// Ending: played, and on to the next unplayed, skipping a played one, from its start.
await tap(inRow("e12", ".ui-podq-play"));
await wait(200);
audio.currentTime = 13.8;
await wait(900);
if (leftOf("e12") !== "Played") return "it is played: " + leftOf("e12");
if (!row("e11").classList.contains("ui-podq-now")) return "the next one starts: " + note();
if (audio.paused) return "and plays";
if (audio.currentTime > 2) return "from its start: " + audio.currentTime;
if (!note().includes("Order e12 e11 m3")) return "on_change after it: " + note();
if (inRow("e12", ".ui-podq-play").getAttribute("aria-label") !== "Play Views first") return "a played one no longer resumes";
await tap(inRow("e11", ".ui-podq-play"));
await wait(200);

// Reordering by the grip: rows part as it passes, and it lands where it was dropped.
const h = row("e12").offsetHeight;
const grip = (id) => inRow(id, ".ui-podq-grip");
if (getComputedStyle(grip("e12")).touchAction !== "none") return "a grip keeps the finger";
if (getComputedStyle(inRow("e12", ".ui-podq-row")).touchAction !== "pan-y") return "a row leaves up and down to the list";
let g = middle(grip("e12"));
await fingers("touchStart", [g]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + i * h * 2.3 / 8 }]); await wait(20); }
await wait(120);
if (!row("e12").classList.contains("ui-podq-held")) return "the row is held";
if (Math.abs(new DOMMatrix(getComputedStyle(row("e12")).transform).f - h * 2.3) > 2) return "it follows the finger: " + getComputedStyle(row("e12")).transform;
if (Math.abs(new DOMMatrix(getComputedStyle(row("e11")).transform).f + h) > 2) return "the passed rows part: " + getComputedStyle(row("e11")).transform;
if (new DOMMatrix(getComputedStyle(row("m2")).transform).f !== 0) return "the others stay: " + getComputedStyle(row("m2")).transform;
await fingers("touchEnd", []);
await wait(200);
if (ids().slice(0, 4).join() !== "e11,m3,e12,m2") return "it lands: " + ids().join();
if (row("e12").style.transform !== "" || row("e11").style.transform !== "") return "no transforms left";
if (!note().includes("Order e11 m3 e12 m2")) return "on_change: " + note();
// A short move lands where it was; a cancelled one too.
g = middle(grip("e12"));
await fingers("touchStart", [g]);
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + i * 8 }]); await wait(20); }
await fingers("touchEnd", []); await wait(150);
if (ids()[2] !== "e12") return "a short move stays: " + ids().join();
g = middle(grip("e12"));
await fingers("touchStart", [g]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: g.x, y: g.y - i * 30 }]); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(150);
if (ids()[2] !== "e12" || row("e12").style.transform !== "" || row("e11").style.transform !== "") return "a cancelled move stays: " + ids().join();
if ($(".ui-podq-sorting")) return "and ends";

// Held in mid-move while an episode plays: where it has got to changes state on every row's reading of it.
await audio.play(); await wait(200);
const playingRow = ids()[3];
g = middle(grip(playingRow));
await fingers("touchStart", [g]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: g.x, y: g.y - i * 10 }]); await wait(20); }
await wait(120);
const liftedTo = row(playingRow).style.transform;
await wait(700);
const liftedLater = row(playingRow).style.transform;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(150);
if (liftedTo === "" || liftedLater !== liftedTo) { audio.pause(); return "playing moved a held row: " + liftedLater + " from " + liftedTo; }
const sw = middle(inRow(playingRow, ".ui-podq-open"));
await fingers("touchStart", [sw]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: sw.x + i * 12, y: sw.y }]); await wait(20); }
await wait(120);
const sweptTo = inRow(playingRow, ".ui-podq-row").style.transform;
await wait(700);
const sweptLater = inRow(playingRow, ".ui-podq-row").style.transform;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(280);
audio.pause(); await wait(150);
if (sweptTo === "" || sweptLater !== sweptTo) return "playing moved a swiped row: " + sweptLater + " from " + sweptTo;

// Held near the edge of a short list, it scrolls, and the row lands beyond what showed.
const box = $(".ui-podq-list");
$(".ui-podq").style.setProperty("--ui-podq-height", "320px");
await wait(100);
box.scrollTop = 0;
g = middle(grip("e11"));
const edge = box.getBoundingClientRect().bottom - 20;
await fingers("touchStart", [g]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + (edge - g.y) * i / 6 }]); await wait(20); }
await wait(700);
if (box.scrollTop < 60) { await fingers("touchEnd", []); return "it scrolls by itself: " + box.scrollTop; }
await fingers("touchEnd", []);
await wait(200);
const landed = ids().indexOf("e11");
if (landed < 4) return "dropped further down than it showed: " + ids().join();
$(".ui-podq").style.removeProperty("--ui-podq-height");
await wait(100);
box.scrollTop = 0;

// The keys. Focus stays on the grip, which moves with its row.
const k = grip("m3");
k.focus();
const m3Was = ids().indexOf("m3");
key(k, "ArrowDown"); await wait(120);
if (ids().indexOf("m3") !== m3Was + 1) return "ArrowDown moves it: " + ids().join();
if (document.activeElement !== grip("m3")) return "focus stays with it: " + document.activeElement.className;
if (status() !== `Moved to place ${m3Was + 2} of 10.`) return "and it is said: " + status();
key(grip("m3"), "ArrowUp"); await wait(120);
if (ids().indexOf("m3") !== m3Was) return "ArrowUp moves it back";
document.activeElement.blur();

// A swipe right marks it played; a short one springs back; a swipe left removes it, with undo.
const rowEl = (id) => inRow(id, ".ui-podq-row");
const w = rowEl("w8").offsetWidth;
await drag(inRow("w8", ".ui-podq-open"), Math.round(w * 0.2), 0, 500);
await wait(280);
if (leftOf("w8") === "Played") return "a short swipe does nothing";
if (rowEl("w8").style.transform !== "") return "it springs back: " + rowEl("w8").style.transform;
await drag(inRow("w8", ".ui-podq-open"), Math.round(w * 0.5), 0, 500);
await wait(280);
if (leftOf("w8") !== "Played") return "a swipe right marks it played: " + leftOf("w8");
if (status() !== "Reading the swell: played.") return "said: " + status();
await flick(inRow("w8", ".ui-podq-open"), 70);
await wait(280);
if (leftOf("w8") === "Played") return "a flick right takes it back";
const before = ids();
await drag(inRow("w7", ".ui-podq-open"), -Math.round(w * 0.5), 0, 500);
await wait(280);
if (ids().includes("w7")) return "a swipe left takes it out";
if ($(".ui-podq-undo span").textContent !== "Removed Fog") return "there is an undo";
if (note().includes("removed w7")) return "not gone yet";
await tap($(".ui-podq-undo button"));
await wait(100);
if (ids().join() !== before.join()) return "undo puts it back in its place: " + ids().join();
await flick(inRow("w7", ".ui-podq-open"), -70);
await wait(280);
if (ids().includes("w7")) return "a flick left takes it out";
await drag(inRow("w6", ".ui-podq-open"), -Math.round(w * 0.5), 0, 500);
await wait(280);
if (!note().includes("removed w7")) return "a second removal ends the first's undo: " + note();
await wait(6600);
if (!note().includes("removed w6")) return "the undo goes after a few seconds: " + note();
if ($(".ui-podq-undo")) return "and its bar";
// A drag cancelled, and one that was the list's: no change.
const c = middle(inRow("w5", ".ui-podq-open"));
await fingers("touchStart", [c]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: c.x + i * 20, y: c.y }]); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(280);
if (rowEl("w5").style.transform !== "" || leftOf("w5") === "Played") return "a cancelled swipe springs back";

// Actions, for everyone who does not swipe. On a phone they open in the row; on a tablet they are beside it.
const acts = () => device === "phone" ? [...$$(".ui-podq-more .ui-podq-act")] : [...$$(".ui-podq-side .ui-podq-act")];
const act = (t) => acts().find((b) => b.textContent === t);
await tap(inRow("w5", ".ui-podq-open"));
if (device === "phone") {
    if (!$(".ui-podq-more") || getComputedStyle($(".ui-podq-side")).display !== "none") return "a phone opens the row";
    if (inRow("w5", ".ui-podq-open").getAttribute("aria-expanded") !== "true") return "and says so";
} else {
    if ($(".ui-podq-side h2").textContent !== "Anchoring") return "a tablet shows it beside: " + $(".ui-podq-side h2").textContent;
    if (getComputedStyle($(".ui-podq-in")).gridTemplateColumns.split(" ").length !== 2) return "two columns";
    if ($(".ui-podq-more") && getComputedStyle($(".ui-podq-more")).display !== "none") return "and nothing opens in the row";
}
await tap(act("Mark played"));
if (leftOf("w5") !== "Played") return "Mark played";
await tap(act("Mark unplayed"));
if (leftOf("w5") !== "30 min left") return "Mark unplayed, from the start: " + leftOf("w5");
await tap(act("Download"));
if (!note()) return "";
if (inRow("w5", ".ui-podq-got").textContent !== "40%") return "a download shows its progress: " + inRow("w5", ".ui-podq-got")?.textContent;
if (!act("Downloading")?.disabled) return "and is not asked for twice";
await tap(act("Move to top"));
if (ids()[0] !== "w5") return "Move to top: " + ids().join();
await tap(act("Remove"));
if (ids().includes("w5")) return "Remove";
await tap($(".ui-podq-undo button"));
if (ids()[0] !== "w5") return "undo again: " + ids().join();
await tap($("#podq-demo-finish"));
const expectGot = "e11";
if (!sub().includes("2 downloaded")) return "a finished download counts: " + sub();

// A turn keeps the order and what is open.
const W = innerWidth, H = innerHeight, order = ids().join();
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(250);
const same = ids().join() === order;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (!same) return "turning keeps the order";

// Empty.
await tap($("#podq-demo-empty")); await wait(150);
if ($(".ui-podq-empty")?.textContent !== "The queue is empty.") return "empty: it says so";
if (total() !== "No time left") return "empty: " + total();
