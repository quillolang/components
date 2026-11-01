// mobile
await wait(200);
// The page's clock, by hand: every time below is exact.
const realNow = Date.now;
let clock = 1800000000000;
Date.now = () => clock;
const calls = [];
window.quilloNative = {
    haptic: (k) => { calls.push("haptic " + k); return Promise.resolve(true); },
    keepAwake: (on) => { calls.push("keep " + on); return Promise.resolve(true); },
};
const done = (why) => { Date.now = realNow; delete window.quilloNative; delete navigator.vibrate; return why; };

const frame = $("#workout-timer-frame");
const box = () => frame.querySelector(".ui-wtimer");
const clk = () => box().querySelector(".ui-wtimer-clock").textContent;
const phase = () => box().querySelector(".ui-wtimer-phase").textContent;
const go = () => box().querySelector(".ui-wtimer-go"), next = () => box().querySelector(".ui-wtimer-skip"), prev = () => box().querySelector(".ui-wtimer-prev");
const left = () => box().querySelector(".ui-wtimer-left").textContent;
const said = () => $("#workout-timer-said").textContent;
// Ticks a real page would have had: anything over 2.5 s between two is a page that stood still.
const passed = async (ms) => { while (ms > 0) { const by = Math.min(ms, 2000); clock += by; ms -= by; await wait(320); } };

// The plan: warm up 5, work 30, rest 15, work 30, rest 15, work 30: 125 s, with no last rest.
if (clk() !== "0:05" || phase() !== "Warm up") return done("ready: " + phase() + " " + clk());
if (left() !== "2:05 left") return done("the whole plan: " + left());
if (box().dataset.status !== "ready") return done("status");
if (!next().disabled || !prev().disabled) return done("Next and Back wait for a start");
if (box().querySelectorAll(".ui-wtimer-row").length !== 6) return done("six intervals: " + box().querySelectorAll(".ui-wtimer-row").length);
if (box().querySelector(".ui-wtimer-round").textContent !== "3 rounds ahead") return done("before the first round: " + box().querySelector(".ui-wtimer-round").textContent);
if (box().querySelector(".ui-wtimer-next").textContent !== "Next: Work, 0:30") return done("next: " + box().querySelector(".ui-wtimer-next").textContent);

// A start keeps the screen on, and is felt.
const startBtn = go();
await tap(startBtn);
if (box().dataset.status !== "running") return done("should run: " + box().dataset.status);
if (go() !== startBtn) return done("the button under the finger should stay the same element");
if (go().textContent !== "Pause") return done("Pause: " + go().textContent);
if (!calls.includes("keep true")) return done("the screen should be held: " + calls);
if (!calls.includes("haptic medium")) return done("a start is felt: " + calls);
if (box().querySelector(".ui-wtimer-awake").textContent !== "The screen stays on.") return done("says the screen is on");
if (said() !== "0: warmup Warm up 5000") return done("on_phase: " + said());

// By the clock, rounded up: a second that has begun still shows.
await passed(100);
if (clk() !== "0:05") return done("4.9 s shows 0:05: " + clk());
await passed(900);
if (clk() !== "0:04") return done("4 s: " + clk());
if (calls.filter((c) => c === "haptic light").length !== 0) return done("no tick before the last three");
await passed(1000);
await passed(1000);
if (clk() !== "0:02") return done("2 s: " + clk());
if (calls.filter((c) => c === "haptic light").length !== 2) return done("a tick at 3 and at 2: " + calls);
if (!box().classList.contains("ui-wtimer-soon")) return done("the last seconds are marked");

// A change of interval, exactly at its edge.
calls.length = 0;
await passed(2000);
if (phase() !== "Work" || clk() !== "0:30") return done("on the edge: " + phase() + " " + clk());
if (box().dataset.kind !== "work") return done("kind: " + box().dataset.kind);
if (box().querySelector(".ui-wtimer-round").textContent !== "Round 1 of 3") return done("round: " + box().querySelector(".ui-wtimer-round").textContent);
if (!calls.includes("haptic warning")) return done("a new interval is felt: " + calls);
if (said() !== "1: work Work 30000") return done("on_phase: " + said());
if (left() !== "2:00 left") return done("left: " + left());
if (box().querySelector(".ui-sr").textContent !== "Work, 0:30.") return done("told: " + box().querySelector(".ui-sr").textContent);

// Pause: time stands, the screen goes back to normal, and the clock moving means nothing.
await passed(10000);
if (clk() !== "0:20") return done("10 s into work: " + clk());
calls.length = 0;
await tap(go());
if (box().dataset.status !== "paused" || go().textContent !== "Resume") return done("paused: " + box().dataset.status);
if (!calls.includes("keep false")) return done("a pause lets the screen go: " + calls);
clock += 60000;
await wait(320);
if (clk() !== "0:20") return done("a pause stops the time: " + clk());
if (box().querySelector(".ui-wtimer-back").textContent !== "") return done("a pause is not the screen going off");
await tap(go());
await passed(5000);
if (clk() !== "0:15") return done("resumes where it was: " + clk());
if (!calls.includes("keep true")) return done("the screen is held again");

// The screen sleeps: 45 s go by with no tick. 15 left of work, then 15 of rest, then 15 into work.
calls.length = 0;
clock += 45000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(50);
if (phase() !== "Work" || clk() !== "0:15") return done("after the sleep: " + phase() + " " + clk());
if (box().querySelector(".ui-wtimer-round").textContent !== "Round 2 of 3") return done("two rounds on: " + box().querySelector(".ui-wtimer-round").textContent);
if (box().querySelector(".ui-wtimer-back").textContent !== "The screen was off for 0:45. The time kept going.") return done("says so: " + box().querySelector(".ui-wtimer-back").textContent);
if (calls.filter((c) => c.startsWith("haptic")).length !== 1) return done("one buzz for all that went by: " + calls);
// As it stands: 5 + 30 + 15 + 15 = 65 s of 125.
if (left() !== "1:00 left") return done("left after sleep: " + left());

// Next and Back. Next goes to the rest of round 2, starting at 80 s.
await tap(next());
if (phase() !== "Rest" || clk() !== "0:15") return done("Next: " + phase() + " " + clk());
if (box().dataset.kind !== "rest") return done("rest: " + box().dataset.kind);
if (left() !== "0:45 left") return done("left after Next: " + left());
if (box().querySelector(".ui-wtimer-round").textContent !== "Round 2 of 3") return done("a rest belongs to the round before");
// Back at once goes to the interval before; three seconds in, it starts this one over.
await tap(prev());
if (phase() !== "Work" || clk() !== "0:30") return done("Back: " + phase() + " " + clk());
await passed(3000);
await tap(prev());
if (clk() !== "0:30") return done("Back, three seconds in: " + clk());

// Kept: made again from what on_change gave, it stands where the clock says, and says nothing of a buzz.
await passed(4000);
if (clk() !== "0:26") return done("before the remake: " + clk());
calls.length = 0;
const oldBox = box();
await tap($("#workout-timer-remake"));
await wait(200);
if (box() === oldBox) return done("the remake should make a new one");
// The old one let go of the screen as it left, and the new one took it.
if (calls.join() !== "keep false,keep true") return done("leaving the page lets go: " + calls);
if (box().dataset.status !== "running" || clk() !== "0:26") return done("carried on: " + box().dataset.status + " " + clk());
if (calls.some((c) => c.startsWith("haptic"))) return done("a page made again is not felt: " + calls);
if (!calls.includes("keep true")) return done("the screen is held again after a remake: " + calls);

// To the end, in one sleep: finish once, screen let go, at the plan's end, not later.
calls.length = 0;
clock += 100000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (box().dataset.status !== "done" || phase() !== "Done" || clk() !== "0:00") return done("over: " + box().dataset.status + " " + phase() + " " + clk());
if (go().textContent !== "Again") return done("Again: " + go().textContent);
if (!calls.includes("keep false")) return done("the end lets the screen go: " + calls);
if (!calls.includes("haptic success")) return done("the end is felt: " + calls);
if ($("#workout-timer-finished").textContent !== "125000 3 0") return done("on_finish: " + $("#workout-timer-finished").textContent);
await passed(1000);
if (calls.filter((c) => c === "haptic success").length !== 1) return done("finished once only");
// Made again after the finish: it stands at the end and does not finish twice.
await tap($("#workout-timer-remake"));
await wait(200);
if (box().dataset.status !== "done") return done("a finished run stays finished: " + box().dataset.status);
if ($("#workout-timer-finishes").textContent !== "1") return done("on_finish once: " + $("#workout-timer-finishes").textContent);

// Again, then Next all the way: the skipped are counted, and on_finish is called afresh.
await tap(go());
if (box().dataset.status !== "running" || clk() !== "0:05") return done("again: " + clk());
for (let i = 0; i < 6; i++) await tap(next());
if (box().dataset.status !== "done") return done("six Nexts end it: " + box().dataset.status);
if ($("#workout-timer-finished").textContent !== "0 0 6") return done("all skipped: " + $("#workout-timer-finished").textContent);

// The tablet's list keeps the current interval in sight.
if (device === "tablet") {
    await tap(go());
    const list = box().querySelector(".ui-wtimer-side");
    list.style.maxHeight = "70px";
    for (let i = 0; i < 3; i++) await tap(next());
    await wait(100);
    if (!(list.scrollTop > 0)) return done("the list should follow: " + list.scrollTop);
    const row = list.querySelector("[aria-current]").getBoundingClientRect(), b = list.getBoundingClientRect();
    if (row.top < b.top - 1 || row.bottom > b.bottom + 12) return done("the current row is out of sight");
    list.style.maxHeight = "";
    // Back takes the interval off those skipped.
    await tap(prev());
    for (let i = 0; i < 4; i++) await tap(next());
    if ($("#workout-timer-finished").textContent !== "0 0 6") return done("six skipped after Back and Next again: " + $("#workout-timer-finished").textContent);
}

// Pausing offers End, which goes back to the start and tells the callback.
await tap(go());
await tap(go());
const end = box().querySelector(".ui-wtimer-end");
if (!end) return done("End shows while paused");
await tap(end);
if (box().dataset.status !== "ready" || clk() !== "0:05") return done("End: " + box().dataset.status);
if (box().querySelector(".ui-wtimer-end")) return done("End goes again");

// A browser: its own vibration and a real Wake Lock.
delete window.quilloNative;
const felt = [];
Object.defineProperty(navigator, "vibrate", { value: (p) => { felt.push(JSON.stringify(p)); return true; }, configurable: true });
await tap($("#workout-timer-remake"));
await wait(200);
await tap(go());
await wait(150);
if (!felt.includes("30")) return done("a browser's vibration: " + felt);
if (box().querySelector(".ui-wtimer-awake").textContent !== "The screen stays on while this page shows.") return done("a real lock: " + box().querySelector(".ui-wtimer-awake").textContent);
await tap(next());
if (!felt.includes("[90,60,90]")) return done("work's pattern: " + felt);
await tap(go());
if (box().querySelector(".ui-wtimer-awake").textContent !== "") return done("nothing to say while paused");
await tap(box().querySelector(".ui-wtimer-end"));

// No vibration, no lock: it says so, and goes on.
Object.defineProperty(navigator, "vibrate", { value: undefined, configurable: true });
const wl = Object.getOwnPropertyDescriptor(Navigator.prototype, "wakeLock");
Object.defineProperty(Navigator.prototype, "wakeLock", { value: undefined, configurable: true });
await tap($("#workout-timer-remake"));
await wait(200);
await tap(go());
await wait(100);
const noneSaid = box().querySelector(".ui-wtimer-awake").textContent, noneBuzz = box().querySelector(".ui-wtimer-nobuzz").textContent;
Object.defineProperty(Navigator.prototype, "wakeLock", wl);
if (noneSaid !== "This browser cannot keep the screen on. The time stays right if it sleeps.") return done("no lock: " + noneSaid);
if (noneBuzz !== "No vibration in this browser: keep the screen in sight.") return done("no vibration: " + noneBuzz);
await tap(go());
await tap(box().querySelector(".ui-wtimer-end"));

// A refusal is said, and the time goes on.
window.quilloNative = { haptic: () => Promise.resolve(true), keepAwake: () => Promise.reject(new Error("refused")) };
await tap(go());
await wait(100);
if (box().querySelector(".ui-wtimer-awake").textContent !== "The screen may dim: this phone said no. The time stays right.") return done("refused: " + box().querySelector(".ui-wtimer-awake").textContent);
await tap(go());
await tap(box().querySelector(".ui-wtimer-end"));
delete window.quilloNative;

// A bad plan has nothing to run and stops nothing.
const bad = $("#workout-timer-bad");
if (bad.querySelector(".ui-wtimer-phase").textContent !== "Nothing to time") return done("bad plan: " + bad.querySelector(".ui-wtimer-phase").textContent);
if (!bad.querySelector(".ui-wtimer-go").disabled) return done("nothing to start");
bad.remove();

// Two columns on a tablet, or a phone on its side; one upright on a phone.
const side = getComputedStyle(box().querySelector(".ui-wtimer-side")).display;
if (device === "phone" && side !== "none") return done("a phone has no room for the list: " + side);
if (device === "tablet") {
    if (side !== "block") return done("a tablet shows the intervals: " + side);
    const main = box().querySelector(".ui-wtimer-main").getBoundingClientRect(), list = box().querySelector(".ui-wtimer-side").getBoundingClientRect();
    if (list.left < main.right) return done("the list stands beside the face");
    if (box().querySelector("[aria-current]")) return done("nothing is current before a start");
}
Date.now = realNow;
delete navigator.vibrate;
