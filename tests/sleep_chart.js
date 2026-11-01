// mobile
await wait(200);
const main = $("#sleep-chart-main");
const plot = main.querySelector(".ui-sleepc-plot");
const read = () => main.querySelector(".ui-sleepc-read span").textContent;
const said = () => $("#sleep-chart-said").textContent;
const crossEl = () => main.querySelector(".ui-sleepc-cross");
const cross = () => parseFloat(crossEl().style.transform.slice(11));

// 23:10 PDT to 06:40 PST is 510 minutes, not the 450 the clock faces suggest. By stage, worked by hand:
// awake 15 + 10 + 20 = 45, light 45 + 115 + 110 = 270, deep 65 + 40 = 105, REM 25 + 50 = 75: asleep 450, recorded 495.
if (main.querySelector(".ui-sleepc-total").textContent !== "7 h 30 min asleep") return "total: " + main.querySelector(".ui-sleepc-total").textContent;
const span = main.querySelector(".ui-sleepc-span").textContent;
if (span !== "23:10 to 06:40, 91% of the recorded night, 15 min not recorded") return "span: " + span;
const sums = [...main.querySelectorAll(".ui-sleepc-sum")].map((s) => s.querySelector("b").textContent + " " + s.querySelector("small").textContent);
if (sums.join("|") !== "45 min 9%|1 h 15 min 15%|4 h 30 min 55%|1 h 45 min 21%") return "sums: " + sums.join("|");
if (plot.getAttribute("aria-valuemax") !== "510") return "the night is 510 minutes: " + plot.getAttribute("aria-valuemax");

// Bars: 10 stretches, the hole left empty: 15 / 510 of 1000 = 29.41 between the fifth and the sixth.
const bars = [...main.querySelectorAll("svg rect")];
if (bars.length !== 10) return "ten bars: " + bars.length;
const gapW = +bars[5].getAttribute("x") - (+bars[4].getAttribute("x") + +bars[4].getAttribute("width"));
if (Math.abs(gapW - 29.41) > 0.02) return "the hole: " + gapW;
if (bars[8].getAttribute("class") !== "ui-sleepc-bar-light") return "Core is Light: " + bars[8].getAttribute("class");
// Midnight falls 50 minutes in: 50 / 510 = 9.804%.
const mid = main.querySelector(".ui-sleepc-midnight");
if (Math.abs(parseFloat(mid.style.left) - 9.804) > 0.001) return "midnight: " + mid.style.left;
// Hours by the clock: the even ones, 02:00 written once though the clocks go back around it.
const ticks = [...main.querySelectorAll(".ui-sleepc-tick")].map((t) => t.textContent);
if (ticks.join() !== "00:00,02:00,04:00,06:00") return "ticks: " + ticks.join();

// Joins only where stretches touch: nine stretches touch their next but the one over the hole, so eight.
if ((main.querySelector(".ui-sleepc-steps").getAttribute("d").match(/M/g) ?? []).length !== 8) return "joins: " + main.querySelector(".ui-sleepc-steps").getAttribute("d");
// A label near an end stays inside the plot.
const lastTick = main.querySelector(".ui-sleepc-tick:last-child").getBoundingClientRect();
if (lastTick.right > main.querySelector(".ui-sleepc-axis").getBoundingClientRect().right + 0.5) return "a tick runs off the end";

// The table, for screen readers.
const cells = [...main.querySelectorAll("tbody tr")].map((r) => [...r.children].map((c) => c.textContent).join(" "));
if (cells.length !== 10) return "ten rows: " + cells.length;
if (cells[5] !== "01:05 03:00 Light 1 h 55 min") return "row: " + cells[5];
if (cells[1] !== "23:25 00:10 Light 45 min") return "across midnight: " + cells[1];

// Before a touch.
if (read() !== "Touch the chart to read a moment.") return "hint: " + read();
if (!crossEl().hidden) return "no line before a touch";

// A drag right of the middle: lock on, line follows, and on release the choice is told.
const w = plot.getBoundingClientRect().width;
await drag(plot, 0.1 * w, 0, 300);
// 60% of 510 is 306 minutes, 05:06 by UTC-less count: 23:10 PDT + 306 min = 11:16Z = 03:16 PST, in deep (03:00 to 03:40).
if (read() !== "03:16: Deep, 03:00 to 03:40, 40 min") return "drag: " + read();
if (Math.abs(cross() - 60) > 0.1) return "line at 60%: " + cross();
if (said() !== "03:16 deep 40") return "on_select: " + said();
if (plot.getAttribute("aria-valuenow") !== "306") return "aria-valuenow: " + plot.getAttribute("aria-valuenow");
if (plot.getAttribute("aria-valuetext") !== "03:16: Deep, 03:00 to 03:40, 40 min") return "aria-valuetext: " + plot.getAttribute("aria-valuetext");
if (plot.classList.contains("ui-sleepc-busy")) return "busy should end";

// The moves go by hand: during a drag nothing but the line and the words change, and the state waits for the lift.
const p0 = middle(plot);
await fingers("touchStart", [p0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p0.x - 0.05 * w * i, y: p0.y }]); await wait(16); }
await wait(30);
if (!plot.classList.contains("ui-sleepc-busy")) return "a finger moving should mark it busy";
if (Math.abs(cross() - 20) > 0.1) return "the line follows the finger to 20%: " + cross();
// 20% is 102 minutes on: 00:52 PDT.
if (read() !== "00:52: Deep, 00:10 to 01:15, 1 h 5 min") return "reading during the drag: " + read();
if (said() !== "03:16 deep 40") return "nothing is chosen until the lift: " + said();
// A system taking the gesture: back to what was chosen.
await fingers("touchCancel", []);
await wait(100);
if (Math.abs(cross() - 60) > 0.1) return "pointercancel should go back: " + cross();
if (read() !== "03:16: Deep, 03:00 to 03:40, 40 min") return "the words go back: " + read();
if (said() !== "03:16 deep 40") return "cancel chooses nothing: " + said();
if (plot.classList.contains("ui-sleepc-busy")) return "cancel ends busy";

// A tap reads where it lands: the middle is 255 minutes in, 02:25 PST.
await tap(plot);
if (read() !== "02:25: Light, 01:05 to 03:00, 1 h 55 min") return "tap: " + read();

// A small tremble is not a scrub: 4 px sideways locks nothing, and lifting there reads that place.
await tap(main.querySelector(".ui-sleepc-clear"));
if (said() !== "Cleared.") return "clear: " + said();
if (read() !== "Touch the chart to read a moment.") return "clear words: " + read();
if (!crossEl().hidden) return "the line goes on clearing";
await fingers("touchStart", [p0]);
await fingers("touchMove", [{ x: p0.x + 4, y: p0.y }]);
await wait(30);
if (plot.classList.contains("ui-sleepc-busy")) return "4 px is under the threshold";
await fingers("touchEnd", []);
await wait(100);

// Up and down is the page's: the chart stays out of it.
await tap(main.querySelector(".ui-sleepc-clear"));
await drag(plot, 2, 120, 200);
if (!crossEl().hidden) return "a vertical drag should not scrub";
window.scrollTo(0, 0);
await wait(50);

// In the hole it says so, and names both ends by their own clocks. Keys from the end of the awake at 01:50 PDT.
plot.focus();
const press = (k, shift = false) => plot.dispatchEvent(new KeyboardEvent("keydown", { key: k, shiftKey: shift, bubbles: true, cancelable: true }));
press("Home");
await wait(50);
if (read() !== "23:10: Awake, 23:10 to 23:25, 15 min") return "Home: " + read();
press("End");
await wait(50);
if (read() !== "06:40: Awake, 06:20 to 06:40, 20 min") return "End, the very end of the night: " + read();
press("Home");
for (let i = 0; i < 5; i++) { press("PageDown"); await wait(20); }
if (read() !== "01:05: Light, 01:05 to 03:00, 1 h 55 min") return "five Page Downs: " + read();
press("ArrowLeft");
await wait(50);
// Five minutes before 01:05 PST is 09:00 UTC, which the clock of the stretch before, seven hours behind, reads as 02:00: a hole.
if (read() !== "02:00: No data, 01:50 to 01:05, 15 min") return "in the hole: " + read();
if (said() !== "02:00 null 0") return "on_select in the hole: " + said();
press("ArrowRight", true);
await wait(50);
if (read() !== "01:30: Light, 01:05 to 03:00, 1 h 55 min") return "Shift moves 30: " + read();
press("PageUp");
await wait(50);
if (read() !== "01:05: Light, 01:05 to 03:00, 1 h 55 min") return "Page Up: " + read();
press("Escape");
await wait(50);
if (said() !== "Cleared.") return "Escape clears: " + said();

// Plain clock times across midnight: 22:30 to 06:00 is 450 minutes, in order, the end of REM taken from the next start.
const by = $("#sleep-chart-clock");
if (by.querySelector(".ui-sleepc-span").textContent !== "22:30 to 06:00, 93% of the recorded night") return "clock form: " + by.querySelector(".ui-sleepc-span").textContent;
if (by.querySelector(".ui-sleepc-total").textContent !== "7 h asleep") return "clock form total: " + by.querySelector(".ui-sleepc-total").textContent;
const rows = [...by.querySelectorAll("tbody tr")].map((r) => [...r.children].map((c) => c.textContent).join(" "));
if (rows[1] !== "23:50 00:40 Deep 50 min") return "over midnight: " + rows[1];
if (rows[2] !== "00:40 01:15 REM 35 min") return "from the next start: " + rows[2];
if (by.querySelector(".ui-sleepc-midnight") === null) return "midnight in the clock form";

// Bad data.
const empty = $("#sleep-chart-empty");
if (empty.querySelector(".ui-sleepc-none").textContent !== "No sleep recorded.") return "empty: " + empty.textContent;
if (empty.querySelector(".ui-sleepc-plot")) return "no chart for no data";

// Beside the chart on a tablet, under it on a phone. Turning keeps the choice where it was.
press("Home");
press("PageDown");
await wait(50);
const before = cross();
const body = main.querySelector(".ui-sleepc-body");
const twoCols = getComputedStyle(body).gridTemplateColumns.split(" ").length;
if (twoCols !== (device === "tablet" ? 2 : 1)) return "columns on " + device + ": " + twoCols;
const size = device === "phone" ? [844, 390] : [1180, 820];
await cdp("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 2, mobile: true });
await wait(200);
if (cross() !== before) return "turning moves the choice: " + cross();
const r1 = plot.getBoundingClientRect(), l1 = crossEl().getBoundingClientRect();
if (Math.abs(r1.width - l1.width) > 1) return "the line's box follows the plot";
await cdp("Emulation.setDeviceMetricsOverride", { width: device === "phone" ? 390 : 820, height: device === "phone" ? 844 : 1180, deviceScaleFactor: 2, mobile: true });
await wait(200);

// New data arrives with a finger on the chart: the line and the words stay with the finger, not with what was chosen.
window.scrollTo(0, 0);
await wait(80);
press("Home");
press("PageDown");
await wait(50);
const chosenWords = read();
const seen = (q) => ({ x: q.x - visualViewport.offsetLeft, y: q.y - visualViewport.offsetTop });
const w2 = plot.getBoundingClientRect().width, c0 = seen(middle(plot));
await fingers("touchStart", [c0]);
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: c0.x + 0.05 * w2 * i, y: c0.y }]); await wait(16); }
await wait(30);
// 70% of 510 minutes is 357: 04:07 by the winter clock, in REM.
if (read() !== "04:07: REM, 03:40 to 04:30, 50 min") return "before the data: " + read();
$("#sleep-chart-stir").click();
await wait(120);
if (Math.abs(cross() - 70) > 0.1) return "new data moved the line under a finger: " + crossEl().style.transform;
if (read() !== "04:07: REM, 03:40 to 04:30, 50 min") return "new data changed the words under a finger: " + read();
await fingers("touchMove", [{ x: c0.x + 0.3 * w2, y: c0.y }]);
await wait(40);
if (Math.abs(cross() - 80) > 0.1) return "the drag should go on after new data: " + cross();
await fingers("touchEnd", []);
await wait(120);
if (said() !== "04:58 light 110") return "the lift after new data: " + said();
if (read() === chosenWords) return "the choice should be the new one";

