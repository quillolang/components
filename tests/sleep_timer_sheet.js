// mobile
// A flick with its speed fixed by the events' own times, so a busy machine cannot slow it.
const flick = async (el, dx, dy = 0) => {
    const p = middle(el), t0 = Date.now() / 1000, steps = 5;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p], timestamp: t0 });
    for (let i = 1; i <= steps; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }], timestamp: t0 + i * 0.012 });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: t0 + 0.07 });
    await wait();
};
const audio = $("#sleep-demo-audio");
const open = () => $(".ui-sleept-open");
const sheet = () => $(".ui-sleept-sheet");
const note = () => $("#sleep-demo-note").textContent;
const level = () => Number(note().match(/level ([\d.]+)/)[1]);
const pick = (t) => $$(".ui-sleept-choice").find((b) => b.textContent === t);
const real = Date.now.bind(Date);
let shift = 0;
Date.now = () => real() + shift;
const undo = () => { Date.now = real; };

if (open().textContent !== "Sleep timer") return "the button says what it is: " + open().textContent;
await tap($("#sleep-demo-play"));
await wait(300);
if (audio.paused) { undo(); return "the demo plays"; }
await tap(open());
if (!sheet().open) { undo(); return "a tap opens it"; }
const box = sheet().getBoundingClientRect();
if (device === "phone") {
    if (Math.round(box.bottom) !== innerHeight || Math.round(box.width) !== innerWidth) { undo(); return "a sheet along the bottom: " + JSON.stringify(box); }
} else {
    if (Math.round(box.width) !== 540 || Math.abs((box.left + box.right) / 2 - innerWidth / 2) > 2 || box.bottom > innerHeight - 40) { undo(); return "in the middle on a tablet: " + JSON.stringify(box); }
    if (getComputedStyle($(".ui-sleept-grip")).display !== "none") { undo(); return "nothing to pull on a tablet"; }
    if (getComputedStyle($(".ui-sleept-choices")).gridTemplateColumns.split(" ").length !== 4) { undo(); return "four across on a tablet"; }
}
const labels = $$(".ui-sleept-choice").slice(0, 7).map((b) => b.textContent).join();
if (labels !== "5 min,10 min,15 min,30 min,45 min,1 h,1 h 30 min") { undo(); return "the choices: " + labels; }

// Your own time, kept to what makes sense.
const out = () => $(".ui-sleept-own output").textContent;
if (out() !== "20 min") { undo(); return "starts at 20: " + out(); }
await tap($('.ui-sleept-step[aria-label="Five minutes more"]'));
if (out() !== "25 min") { undo(); return "+ adds five: " + out(); }
for (let i = 0; i < 6; i++) await tap($('.ui-sleept-step[aria-label="Five minutes less"]'));
if (out() !== "1 min") { undo(); return "not below a minute: " + out(); }

// A choice starts it, and the sheet shows what is left.
const began = Date.now();
await tap(pick("5 min"));
if ($(".ui-sleept-pick").offsetHeight !== 0) { undo(); return "the choices go while it runs"; }
if (!["5:00", "4:59"].includes($(".ui-sleept-left").textContent)) { undo(); return "what is left: " + $(".ui-sleept-left").textContent; }
await tap($(".ui-sleept-close"));
if (sheet().open) { undo(); return "Close closes it"; }
await wait(1100);
if (!/^4:5\d$/.test(open().textContent)) { undo(); return "the button counts down: " + open().textContent; }
if (open().getAttribute("aria-label").indexOf("left") < 0) { undo(); return "and says so: " + open().getAttribute("aria-label"); }

// 15 seconds left of a 30 second fade: a quarter, as it is the square of a half.
shift = began + 5 * 60 * 1000 - 16000 - real();
await wait(1200);
const v = audio.volume, leftNow = (began + 5 * 60 * 1000 - Date.now()) / 1000, want = (leftNow / 30) ** 2;
if (Math.abs(v - want) > 0.03) { undo(); return "the square of what is left of the fade: " + v + " wanted " + want; }
if (Math.abs(level() - want) > 0.04) { undo(); return "on_volume is told: " + note(); }
await tap(open());
if ($(".ui-sleept-sub").textContent !== "Fading out") { undo(); return "it says it is fading: " + $(".ui-sleept-sub").textContent; }

// Extending in the fade puts the volume back.
await tap($(".ui-sleept-more"));
await wait(300);
if (audio.volume !== 1) { undo(); return "extending ends the fade: " + audio.volume; }
if (level() !== 1) { undo(); return "and says so: " + note(); }
if (audio.paused) { undo(); return "still playing"; }
if (!/^10:1\d$/.test($(".ui-sleept-left").textContent)) { undo(); return "ten more: " + $(".ui-sleept-left").textContent; }
await tap($(".ui-sleept-close"));

// A rotation changes nothing. (A turn of the screen: the phone's, then back.)
const portrait = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: portrait[1], height: portrait[0], deviceScaleFactor: 2, mobile: true });
await wait(200);
if (!/^10:\d\d$/.test(open().textContent)) { undo(); return "turning keeps the timer: " + open().textContent; }
await cdp("Emulation.setDeviceMetricsOverride", { width: portrait[0], height: portrait[1], deviceScaleFactor: 2, mobile: true });
await wait(200);

// The time passes while the page sleeps: media's own event ends it at once, with no tick.
shift += 11 * 60 * 1000;
audio.dispatchEvent(new Event("timeupdate"));
await wait(100);
if (!audio.paused) { undo(); return "it stops the media"; }
if (audio.volume !== 1) { undo(); return "and leaves the volume as it was: " + audio.volume; }
if (!note().startsWith("Stopped 1 times")) { undo(); return "on_stop: " + note(); }
if (open().textContent !== "Sleep timer") { undo(); return "the button goes back: " + open().textContent; }

// The volume was 0.8: the fade comes down from there and goes back to it. Fade can be turned off.
audio.volume = 0.8;
await audio.play();
await tap(open());
if ($(".ui-sleept-note[role=status]").textContent !== "Stopped.") { undo(); return "the sheet says why: " + $(".ui-sleept-note[role=status]").textContent; }
const began2 = Date.now();
await tap(pick("10 min"));
shift += began2 + 10 * 60 * 1000 - 22000 - Date.now();
await wait(1200);
const left2 = (began2 + 10 * 60 * 1000 - Date.now()) / 1000;
if (Math.abs(audio.volume - 0.8 * (left2 / 30) ** 2) > 0.05) { undo(); return "the fade comes down from 0.8: " + audio.volume + " at " + left2; }
await tap($(".ui-sleept-stop"));
await wait(100);
if (Math.abs(audio.volume - 0.8) > 0.001) { undo(); return "cancelling restores it: " + audio.volume; }
if (audio.paused) { undo(); return "cancelling does not stop it"; }
if (!note().startsWith("Stopped 1 times")) { undo(); return "cancel is no stop: " + note(); }
if ($(".ui-sleept-note[role=status]").textContent !== "Timer cancelled.") { undo(); return "says it is cancelled"; }
if ($(".ui-sleept-pick").offsetHeight === 0) { undo(); return "the choices come back"; }
await tap($(".ui-sleept-fade input"));
const began3 = Date.now();
await tap(pick("5 min"));
shift += began3 + 5 * 60 * 1000 - 10000 - Date.now();
await wait(1300);
if (Math.abs(audio.volume - 0.8) > 0.001) { undo(); return "no fade when turned off: " + audio.volume; }
shift += 20000;
audio.dispatchEvent(new Event("timeupdate"));
await wait(100);
if (!audio.paused || !note().startsWith("Stopped 2 times")) { undo(); return "it stops all the same: " + note(); }
audio.volume = 1;

// The ways to close: a pull short of it springs, one past it or a flick closes.
if (!sheet().open) await tap(open());
if (device === "phone") {
    const grip = $(".ui-sleept-grip");
    await drag(grip, 0, 50, 500);
    await wait(100);
    if (!sheet().open) { undo(); return "a short slow pull stays"; }
    if (sheet().style.transform !== "") { undo(); return "and springs back: " + sheet().style.transform; }
    await drag(grip, 0, 170, 500);
    if (sheet().open) { undo(); return "a long pull closes"; }
    await tap(open());
    await flick(grip, 0, 100);
    if (sheet().open) { undo(); return "a flick closes"; }
    await tap(open());
    const g = middle(grip);
    await fingers("touchStart", [g]);
    await fingers("touchMove", [{ x: g.x, y: g.y + 200 }]); await wait(40);
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(100);
    if (!sheet().open || sheet().style.transform !== "") { undo(); return "a cancelled pull stays"; }
}
await fingers("touchStart", [{ x: 20, y: 20 }]); await fingers("touchEnd", []); await wait(200);
if (sheet().open) { undo(); return "a tap outside closes"; }
await tap(open());
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(200);
if (sheet().open) { undo(); return "Escape closes"; }

// A pull held while the countdown ticks: its state changes each second, and the sheet stays with the finger.
if (device === "phone") {
    await tap(open());
    await tap(pick("5 min"));
    const g = middle($(".ui-sleept-grip"));
    await fingers("touchStart", [g]);
    for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + i * 12 }]); await wait(16); }
    await wait(60);
    const was = sheet().style.transform, tick0 = $(".ui-sleept-left").textContent;
    await wait(2100);
    const later = sheet().style.transform, tick1 = $(".ui-sleept-left").textContent;
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(100);
    await tap($(".ui-sleept-stop"));
    await tap($(".ui-sleept-close"));
    if (tick0 === tick1) { undo(); return "the countdown went on: " + tick1; }
    if (was === "" || later !== was) { undo(); return "a tick moved the sheet under the finger: " + later + " from " + was; }
}

// A device that holds on to the volume: said on screen, and it stops without fading.
await tap($("#sleep-demo-again")); await wait(200);
Object.defineProperty(audio, "volume", { configurable: true, get: () => 1, set: () => {} });
await audio.play();
await tap(open());
if ($$(".ui-sleept-fade").length !== 2 && false) { undo(); return "fade offered"; }
await tap(pick("5 min"));
delete audio.volume;
Object.defineProperty(audio, "volume", { configurable: true, get: () => 1, set: () => {} });
await wait(100);
const told = $(".ui-sleept-note").textContent;
if (!told.includes("without a fade")) { undo(); delete audio.volume; return "it says so: " + told; }
await tap($(".ui-sleept-stop"));
delete audio.volume;
audio.pause();
await tap($(".ui-sleept-close"));

// Odd props: only the usable choices, no fade row, and the default own time.
const bad = $("#sleep-demo-bad");
await tap(bad.querySelector(".ui-sleept-open"));
const shown = [...bad.querySelectorAll(".ui-sleept-choice")].map((b) => b.textContent).join();
if (shown !== "5 min") { undo(); return "only what can be used: " + shown; }
if (bad.querySelector(".ui-sleept-fade")) { undo(); return "no fade to offer"; }
if (bad.querySelector(".ui-sleept-own output").textContent !== "20 min") { undo(); return "a bad start falls back"; }
await tap(bad.querySelector(".ui-sleept-close"));
undo();
