// mobile
const a = $("#stepper-row-demo-adults"), d = $("#stepper-row-demo-dose"), l = $("#stepper-row-demo-long");
const row = (i) => i.closest(".ui-stepper-row");
const less = (i) => row(i).querySelector('[aria-label^="Less"]'), more = (i) => row(i).querySelector('[aria-label^="More"]');
const out = () => $("#stepper-row-demo-out").textContent;
const live = (i) => row(i).querySelector("[aria-live]").textContent;
const realKey = async (k, code = k) => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: { Enter: 13, ArrowUp: 38, ArrowDown: 40, PageUp: 33, PageDown: 34, Home: 36, End: 35 }[k] }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code }); await wait(100); };
// Named, with limits, for a screen reader.
if (a.getAttribute("role") !== "spinbutton" || a.getAttribute("aria-valuenow") !== "2" || a.getAttribute("aria-valuemin") !== "1" || a.getAttribute("aria-valuemax") !== "9") return "the spin button's values";
if (document.getElementById(a.getAttribute("aria-describedby")).textContent !== "From 1 to 9.") return `limits said: ${document.getElementById(a.getAttribute("aria-describedby")).textContent}`;
if ($('label[for="stepper-row-demo-adults"]').textContent !== "Adults") return "the label is not tied to the field";
if (l.getAttribute("aria-valuemax") !== null || document.getElementById(l.getAttribute("aria-describedby")).textContent !== "At least 0.") return "a limit left out";
if (d.getAttribute("aria-valuetext") !== "0.50 ml") return `unit: ${d.getAttribute("aria-valuetext")}`;
// A tap is one step.
await tap(more(a));
if (a.value !== "3" || out() !== "Adults 3, dose 0.5, 1 changes.") return `plus: ${a.value}, ${out()}`;
await tap(less(a));
if (a.value !== "2" || out() !== "Adults 2, dose 0.5, 2 changes.") return `minus: ${a.value}, ${out()}`;
// Decimals are exact: 0.25 by 0.25, and written with two places.
await tap(more(d));
if (d.value !== "0.75") return `0.5 + 0.25: ${d.value}`;
for (let i = 0; i < 7; i++) await tap(more(d));
if (d.value !== "2.50" || !out().includes("dose 2.5,")) return `to the top: ${d.value}, ${out()}`;
if (more(d).getAttribute("aria-disabled") !== "true") return "plus is not off at the top";
if (live(d) !== "2.50 is the most.") return `the limit is not said: ${live(d)}`;
await tap(more(d));
if (d.value !== "2.50") return `past the top: ${d.value}`;
// A hold repeats, faster and faster, and stops at the limit.
await tap(less(a));
if (a.value !== "1" || live(a) !== "1 is the least.") return `at the least: ${a.value}, ${live(a)}`;
const before = out();
await hold(more(a), 2200);
if (a.value !== "9") return `a hold of 2.2 s reached ${a.value}`;
if (more(a).getAttribute("aria-disabled") !== "true") return "plus stays on at the most";
if (!out().startsWith("Adults 9,")) return `on_change after the hold: ${out()}`;
// A repeat is not a change: one call for the whole hold.
if (out() !== "Adults 9, dose 2.5, 4 changes.") return `calls: ${out()}`;
// It goes faster: a hold of 2 s moves far more than twice a hold of 1 s.
await hold(more(l), 1000); const one = +l.value;
await hold(more(l), 2000); const two = +l.value - one;
if (one <= 100 || two < 2.5 * (one - 100)) return `no acceleration: ${one - 100} in 1 s, ${two} in 2 s`;
// A short hold is one step.
const was = +l.value; await hold(more(l), 120);
if (+l.value !== was + 10) return `a short hold: ${l.value} from ${was}`;
// The system takes the finger: it stops, and the value stays where it got to.
const r = less(a).getBoundingClientRect(), m = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
await wait(700);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(100);
const after = a.value; await wait(400);
if (a.value !== after || +after >= 9 || +after <= 1) return `after a cancel: ${after} then ${a.value}`;
if (!out().startsWith(`Adults ${after},`)) return `a cancelled hold is not told: ${out()}`;
// Typing: a good number, past a limit, nonsense.
await tap(a); a.value = "7"; a.dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
await realKey("Enter");
if (a.value !== "7" || !out().startsWith("Adults 7,")) return `typed 7: ${a.value}, ${out()}, active ${document.activeElement.tagName}`;
await tap(a); a.value = "44"; a.dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
await realKey("Enter");
if (a.value !== "9" || live(a) !== "9 is the most.") return `typed 44: ${a.value}, ${live(a)}`;
await tap(a); a.value = "abc"; a.dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
a.blur(); await wait(100);
if (a.value !== "9") return `typed nonsense: ${a.value}`;
await tap(d); d.value = "1,5"; d.dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
d.blur(); await wait(100);
if (d.value !== "1.50") return `a comma: ${d.value}`;
await tap(d); d.value = "1e99"; d.dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
d.blur(); await wait(100);
if (d.value !== "1.50") return `an exponent: ${d.value}`;
if (a.getAttribute("inputmode") !== "numeric" || d.getAttribute("inputmode") !== "decimal") return "the wrong keyboard";
if (parseFloat(getComputedStyle(a).fontSize) < 16) return "under 16 px, iOS zooms the page on focus";
// Keys.
a.focus();
await realKey("ArrowDown");
if (a.value !== "8") return `ArrowDown: ${a.value}`;
await realKey("Home");
if (a.value !== "1") return `Home: ${a.value}`;
await realKey("PageUp");
if (a.value !== "9") return `PageUp to the limit: ${a.value}`;
if (a.getAttribute("aria-valuenow") !== "9") return "aria-valuenow does not follow";
// A screen reader's click.
less(a).click(); await wait(100);
if (a.value !== "8") return `a click: ${a.value}`;
// Readonly where typing is off.
if (!l.readOnly) return "typed={false} can be typed in";
// A unit does not push its row out of line with the others.
if (Math.abs(less(a).getBoundingClientRect().left - less(d).getBoundingClientRect().left) > 1) return "the rows do not line up";
// A tablet has the hint beside the label.
const pane = row(a).clientWidth, w = row(a).querySelector(".ui-stepper-row-words");
const label = w.querySelector("label").getBoundingClientRect(), hint = w.querySelector(".ui-stepper-row-hint").getBoundingClientRect();
if ((pane >= 440) !== (device === "tablet")) return `the pane is ${pane}`;
if ((hint.left >= label.right) !== (pane >= 440)) return `the hint at ${pane} px`;
