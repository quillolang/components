// mobile
await wait(300);
const box = $(".ui-focus-timer");
const time = (b = box) => b.querySelector(".ui-focus-timer-time").textContent;
const phase = (b = box) => b.querySelector(".ui-focus-timer-phase").textContent;
const round = (b = box) => b.querySelector(".ui-focus-timer-round").textContent;
const go = (b = box) => b.querySelector(".ui-focus-timer-go");
const off = (b = box) => b.querySelector(".ui-focus-timer-off");
const say = (b = box) => b.querySelector(".ui-focus-timer-say").textContent;
const stat = (i, b = box) => b.querySelectorAll(".ui-focus-timer-stat dd")[i].textContent;
const sw = (b = box) => b.querySelector('[role="switch"]');
const note = (b = box) => sw(b).querySelector(".ui-focus-timer-note").textContent;
const got = () => $("#focus-timer-got").textContent;
const st = () => $("#focus-timer-state").textContent;
const arc = (b = box) => parseFloat(b.querySelector(".ui-focus-timer-arc").getAttribute("stroke-dashoffset"));

// Bad data still shows a timer of 25 minutes.
const bad = $("#focus-timer-bad");
if (bad.querySelector(".ui-focus-timer-time").textContent !== "25:00") return "bad props: " + bad.querySelector(".ui-focus-timer-time").textContent;
if (bad.querySelector(".ui-focus-timer-round").textContent !== "Round 1 of 4") return "bad rounds";
bad.remove();

// The figures, from known days: 2026-11-04 has none yet, so the run ending yesterday, 3rd and 2nd, stands.
if (stat(0) !== "2 days") return "streak: " + stat(0);
if (stat(1) !== "0 min") return "today: " + stat(1);
if (stat(2) !== "4 days") return "best, 27th to 30th October: " + stat(2);
if (time() !== "25:00" || phase() !== "Focus" || round() !== "Round 1 of 2") return "start: " + time() + round();
if (arc() !== 0) return "the ring starts full: " + arc();
if (sw().getAttribute("aria-checked") !== "true") return "keep awake starts on";
if (note() !== "While a session runs.") return "the switch's note: " + note();

// Lengths, offered only before starting.
await tap(box.querySelector('[aria-label="45 minutes"]'));
if (time() !== "45:00") return "45: " + time();
await tap(box.querySelector('[aria-label="25 minutes"]'));

// The sound is made once, from the first tap, so its stand-in comes before that; a buzz likewise records.
const beeps = [], buzzes = [];
const RealAudio = window.AudioContext;
// Class instances, as a plain object is a Quillo map, whose fields cannot be set; a real AudioParam is a page object.
class Param {}
window.AudioContext = class { constructor() { this.currentTime = 1; this.destination = new Param(); this.state = "running"; } resume() {} createGain() { return { gain: new Param(), connect() {} }; }
    createOscillator() { return { frequency: new Param(), connect() {}, start(t) { beeps.push(t); }, stop() {} }; } };
const realVibrate = navigator.vibrate;
navigator.vibrate = (p) => { buzzes.push(p); return true; };

// Start: it holds the screen with a real Wake Lock, and the clock runs from a real tap.
const realNow = Date.now;
const secs = () => { const [m, s] = time().split(":").map(Number); return m * 60 + s; };
await tap(go());
await wait(200);
if (st() !== "focus running 1") return "on_state: " + st();
if (go().textContent !== "Pause" || off().textContent !== "Stop") return "the buttons: " + go().textContent;
if (note() !== "The screen stays on.") return "the screen: " + note();
if (box.querySelector(".ui-focus-timer-times")) return "no lengths while it runs";

// The clock is a moment, not a count: ten minutes gone in a blink, as a phone asleep would be.
let shift = 0;
Date.now = () => realNow.call(Date) + shift;
shift = 10 * 60000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (secs() < 895 || secs() > 900) return "after a sleep: " + time();
if (Math.abs(arc() - 40) > 1) return "the ring after a sleep: " + arc();

// Paused, time passing changes nothing.
await tap(go());
const paused = time();
if (go().textContent !== "Resume") return "Resume: " + go().textContent;
if (st() !== "focus paused 1") return "paused state: " + st();
if (note() !== "While a session runs.") return "a pause lets the screen go: " + note();
shift += 5 * 60000;
await wait(350);
if (time() !== paused) return "a pause should hold: " + time();
await tap(go());
await wait(120);
const [pm, ps] = paused.split(":").map(Number);
if (Math.abs(secs() - (pm * 60 + ps)) > 2) return "going on from the pause: " + time();
if (note() !== "The screen stays on.") return "resuming takes the screen again: " + note();

// Stop: not counted, back to the whole.
await tap(off());
await wait(60);
if (time() !== "25:00" || say() !== "Stopped, and not counted.") return "stop: " + time() + " " + say();
if (stat(1) !== "0 min" || got() !== "") return "a stopped session should not count";

// The end, heard: a sound, a buzz, the words, and it counts.
await tap(go());
await wait(120);
shift += 24 * 60000 + 59500;
await wait(900);
if (phase() !== "Short break" || time() !== "5:00") return "the end should go on to a break: " + phase() + " " + time();
if (say() !== "Session done. Time for a break.") return "what it says: " + say();
if (!box.querySelector(".ui-focus-timer-say").hasAttribute("data-done")) return "the end should stand out";
if (got() !== "2026-11-04 25 true true") return "on_session: " + got();
if (beeps.length !== 3) return "the sound: " + beeps.length;
if (buzzes.length !== 1 || buzzes[0].join() !== "200,100,200") return "the buzz: " + JSON.stringify(buzzes);
if (stat(0) !== "3 days" || stat(1) !== "25 min") return "the figures: " + stat(0) + " " + stat(1);
if (note() !== "While a session runs.") return "the end lets the screen go: " + note();
window.AudioContext = RealAudio;
navigator.vibrate = realVibrate;

// A break, skipped or run, then the long break after the last round.
if (go().textContent !== "Start break" || off().textContent !== "Skip break") return "the break's buttons";
await tap(off());
if (phase() !== "Focus" || round() !== "Round 2 of 2") return "skip: " + phase() + round();
await tap(go());
await wait(120);
shift += 26 * 60000;
await wait(600);
if (phase() !== "Long break" || time() !== "15:00") return "the long break: " + phase() + " " + time();
if (!say().includes("Time for a long break.")) return "long words: " + say();
if (!say().includes("while you were away")) return "26 minutes on, it ended while away: " + say();
if (stat(1) !== "50 min") return "the second counted: " + stat(1);
await tap(go());
await wait(100);
shift += 16 * 60000;
await wait(600);
if (phase() !== "Focus" || round() !== "Round 1 of 2") return "after the long break: " + phase() + round();
if (stat(1) !== "50 min") return "breaks do not count: " + stat(1);

// In the app: the phone is asked, told when the app leaves, and once only; a refusal offers Settings.
const calls = [];
window.quilloNative = { keepAwake: async (on) => { calls.push("awake " + on); return on; }, haptic: async (k) => { calls.push("haptic " + k); return true; },
    notify: async (t, b, s) => { calls.push(`notify ${t} ${s}`); return "id"; }, openSettings: async () => { calls.push("settings"); return true; } };
await tap(go());
await wait(120);
if (!calls.includes("awake true")) return "the app should hold the screen: " + calls;
shift += 60000;
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange"));
await wait(120);
document.dispatchEvent(new Event("visibilitychange"));
await wait(120);
delete document.visibilityState;
const sent = calls.filter((c) => c.startsWith("notify"));
if (sent.length !== 1 || !/^notify Focus 14\d\d$/.test(sent[0])) return "the phone's alert: " + sent;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
await tap(go());
await wait(60);
if (say() !== "The alert the phone was given cannot be taken back, so it will still come.") return "says so: " + say();
if (!calls.includes("awake false")) return "a pause lets the app's screen go: " + calls;
await tap(off());
window.quilloNative.notify = async () => { throw new Error("notifications are turned off for this app"); };
await tap(go());
await wait(120);
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange"));
await wait(120);
delete document.visibilityState;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
const settings = box.querySelector(".ui-focus-timer-link");
if (settings?.textContent !== "Settings") return "a refusal offers Settings: " + settings?.textContent;
await tap(settings);
if (!calls.includes("settings")) return "Settings";
await tap(off());
await wait(60);
delete window.quilloNative;
Date.now = realNow;

// No Wake Lock, as an old browser: it says so, and goes on.
const realLock = Object.getOwnPropertyDescriptor(Navigator.prototype, "wakeLock");
Object.defineProperty(Navigator.prototype, "wakeLock", { configurable: true, get: () => null });
await tap(go());
await wait(120);
if (note() !== "This browser cannot hold the screen on, so it will dim as usual.") return "no Wake Lock: " + note();
await tap(off());
Object.defineProperty(Navigator.prototype, "wakeLock", realLock);

// The switch off: no lock is asked for.
await tap(sw());
if (sw().getAttribute("aria-checked") !== "false") return "the switch";
await tap(go());
await wait(120);
if (note() !== "While a session runs.") return "the switch off: " + note();
await tap(off());
await wait(60);

// A real three seconds: nothing stood in for the clock.
const short = $("#focus-timer-short");
if (time(short) !== "0:03") return "three seconds: " + time(short);
await tap(go(short));
for (let i = 0; i < 40 && phase(short) === "Focus"; i++) await wait(100);
if (phase(short) !== "Long break") return "a real end, one round: " + phase(short);
if (say(short) !== "Session done. Time for a long break.") return "a real end's words: " + say(short);
if (stat(1, short) !== "0 min") return "3 s rounds to nothing: " + stat(1, short);
if (stat(0, short) !== "1 day") return "a first day: " + stat(0, short);

// Resumed: a paused one as it was, one that ended meanwhile counted with when.
const held = $("#focus-timer-paused");
if (time(held) !== "1:30" || go(held).textContent !== "Resume" || round(held) !== "Round 2 of 4") return "a paused state: " + time(held) + " " + round(held);
const gone = $("#focus-timer-gone");
if (phase(gone) !== "Short break") return "a state that ended: " + phase(gone);
if (!say(gone).includes("while you were away")) return "ended away: " + say(gone);
if (stat(2, gone) !== "1 day") return "it should count: " + stat(2, gone);

const m = box.querySelector(".ui-focus-timer-main").getBoundingClientRect(), s = box.querySelector(".ui-focus-timer-side").getBoundingClientRect();
if (device === "tablet") {
    if (s.left < m.right - 1) return "a tablet puts the figures beside the ring";
    const bars = [...box.querySelectorAll(".ui-focus-timer-bar")];
    if (bars.length !== 7) return "the week: " + bars.length;
    if (getComputedStyle(box.querySelector(".ui-focus-timer-week")).display !== "grid") return "a tablet shows the week";
    // 50 minutes today against 70 on the 3rd, the fullest.
    if (bars[6].style.height !== "71%" || bars[5].style.height !== "100%") return "the bars: " + bars[6].style.height + " " + bars[5].style.height;
} else {
    if (s.top < m.bottom - 1) return "a phone stacks them";
    if (getComputedStyle(box.querySelector(".ui-focus-timer-week")).display !== "none") return "a phone leaves the week out";
}
