// mobile
const pad = document.getElementById("number-pad-demo-reading"), count = document.getElementById("number-pad-demo-count");
const k = (p, x) => p.querySelector(`[data-key="${x}"]`);
const fig = (p) => p.querySelector("output").textContent;
const out = () => $("#number-pad-demo-out").textContent;
const felt = []; window.quilloNative = { haptic: (x) => { felt.push(x); return Promise.resolve(); } };
try {
if (fig(pad) !== "1204.5" || out() !== "Reading: 1204.5") return `it starts on ${fig(pad)}`;
if ($$("input:not([type=hidden])").length) return "there is a field that would raise the system's keyboard";
// One decimal place: another digit is refused.
await tap(k(pad, "7"));
if (fig(pad) !== "1204.5") return `past the places: ${fig(pad)}`;
await tap(k(pad, "back"));
if (fig(pad) !== "1204." || out() !== "Reading: 1204.") return `delete once: ${fig(pad)}, ${out()}`;
await tap(k(pad, ".")); 
if (fig(pad) !== "1204.") return `a second point: ${fig(pad)}`;
await tap(k(pad, "9"));
if (fig(pad) !== "1204.9") return `a digit after the point: ${fig(pad)}`;
if (!felt.length || felt[0] !== "light") return `no tap felt: ${felt}`;
if ($("[role=status]")) return "says it cannot vibrate where it can";
// Hold to delete: faster and faster, and nothing on letting go.
await hold(k(pad, "back"), 900);
const left = fig(pad);
if (left.length > 3) return `a hold of 0.9 s left ${left}`;
await wait(300);
if (fig(pad) !== left) return "it goes on deleting after the finger lifts";
await tap($("#number-pad-demo-clear"));
if (fig(pad) !== "0" || !pad.querySelector("output").classList.contains("ui-number-pad-empty")) return `set from outside: ${fig(pad)}`;
// A short hold is one delete.
await tap(k(pad, "1")); await tap(k(pad, "2")); await tap(k(pad, "3"));
await hold(k(pad, "back"), 120);
if (fig(pad) !== "12") return `a short hold: ${fig(pad)}`;
// A hold of a second, then the system takes the finger: it stops.
const m = (() => { const r = k(pad, "back").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })();
await tap(k(pad, "3")); await tap(k(pad, "4")); await tap(k(pad, "5")); await tap(k(pad, "6"));
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
await wait(560);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(100);
const stopped = fig(pad); await wait(400);
if (fig(pad) !== stopped || stopped.length === 6) return `after a cancel: ${stopped} then ${fig(pad)}`;
// Leading zero and a point first.
await tap($("#number-pad-demo-clear"));
await tap(k(pad, "0")); await tap(k(pad, "0"));
if (fig(pad) !== "0") return `00: ${fig(pad)}`;
await tap(k(pad, "7"));
if (fig(pad) !== "7") return `07: ${fig(pad)}`;
await tap($("#number-pad-demo-clear"));
await tap(k(pad, "."));
if (fig(pad) !== "0." || out() !== "Reading: 0.") return `a point first: ${fig(pad)}`;
await tap($("#number-pad-demo-clear"));
// Limit: six digits before the point.
for (const d of "1234567") await tap(k(pad, d));
if (fig(pad) !== "123456") return `limit: ${fig(pad)}`;
// A key goes on the touch, and overlapping presses lose neither. A finger stays down while a
// mouse presses another key: two real fingers can't be used here, as they leave Chrome giving
// later pages clicks with no pointer events at all, which fails whatever test comes next.
await tap($("#number-pad-demo-clear"));
const at = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const [a, b] = [at(k(pad, "1")), at(k(pad, "9"))];
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [a] }); await wait(60);
const touched = fig(pad);
await cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...b, button: "left", buttons: 1, clickCount: 1 });
await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...b, button: "left", buttons: 0, clickCount: 1 }); await wait(60);
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait();
if (touched !== "1") return `the key waits for the lift: ${touched}`;
if (fig(pad) !== "19") return `two fingers overlapping: ${fig(pad)}`;
// A touch is one press, however its click lands.
await tap(k(pad, "5"));
if (fig(pad) !== "195") return `one tap: ${fig(pad)}`;
await tap(k(pad, "back")); await tap(k(pad, "back"));
if (fig(pad) !== "1") return `two deletes: ${fig(pad)}`;
await tap(k(pad, "9"));
// A whole-number pad has no point.
if (k(count, ".") || k(pad, ".") === null) return "the point key is wrong";
if (count.querySelectorAll("button").length !== 11) return `whole numbers have ${count.querySelectorAll("button").length} keys`;
await tap(k(count, "3"));
if (fig(count) !== "123" || count.querySelector("input[name=boxes]").value !== "123") return `the hidden field: ${count.querySelector("input[name=boxes]").value}`;
// The keyboard's route: a real key on a focused pad, and Enter on a key.
k(count, "5").focus();
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "8", code: "Digit8", text: "8" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "8", code: "Digit8" }); await wait(100);
if (fig(count) !== "1238") return `a typed 8: ${fig(count)}`;
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); await wait(100);
if (fig(count) !== "123") return `Backspace: ${fig(count)}`;
k(count, "5").click(); await wait(100);
if (fig(count) !== "1235") return `a screen reader's click: ${fig(count)}`;
} finally { delete window.quilloNative; }
// Where there is no haptic at all it says so, after a press.
const nav = Object.getOwnPropertyDescriptor(Navigator.prototype, "vibrate");
delete Navigator.prototype.vibrate;
await tap(k(count, "back"));
Object.defineProperty(Navigator.prototype, "vibrate", nav);
if (!count.querySelector("[role=status]")?.textContent.includes("cannot vibrate")) return "a device with no vibrate is not told about";
// The browser's own vibrate is used without the app.
const was = navigator.vibrate; let shaken = 0;
Navigator.prototype.vibrate = function () { shaken++; return true; };
await tap(k(pad, "back"));
Object.defineProperty(Navigator.prototype, "vibrate", nav);
if (shaken < 1) return "navigator.vibrate is not used";
// A tablet has the number beside the keys.
const wide = pad.clientWidth >= 440;
if (wide !== (device === "tablet")) return `the pane is ${pad.clientWidth}`;
const fr = pad.querySelector("output").getBoundingClientRect(), kr = pad.querySelector(".ui-number-pad-keys").getBoundingClientRect();
if ((fr.right <= kr.left) !== wide) return `side by side at ${pad.clientWidth}: ${fr.right} ${kr.left}`;
