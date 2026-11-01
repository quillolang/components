// mobile
await wait(200);
const ex = $("#weight-trend-exact");
const plot = ex.querySelector(".ui-wtrend-plot");
const read = () => ex.querySelector(".ui-wtrend-read span").textContent;
const said = () => $("#weight-trend-said").textContent;
const cross = () => ex.querySelector(".ui-wtrend-cross");
const crossAt = () => parseFloat(cross().style.transform.slice(11));
const cells = () => [...ex.querySelectorAll("tbody tr")].map((r) => [...r.children].map((c) => c.textContent).join(" | "));

// By hand. 1 Sep 80 (first, so trend 80). 2 Sep 81: 80 + 0.1 * 1 = 80.1. 4 Sep 79, two days:
// 80.1 + 0.19 * -1.1 = 79.891. 5 Sep the mean of 80 and 81, 80.5: 79.891 + 0.1 * 0.609 = 79.9519.
// 17 Sep is 12 days on, past the 7 of a hole: 78, afresh. 18 Sep 79: 78 + 0.1 = 78.1.
const rows = cells();
if (rows.length !== 6) return "six days kept: " + rows.length;
if (rows[0] !== "1 Sep | 80.0 kg | 80.0 kg") return "first: " + rows[0];
if (rows[1] !== "2 Sep | 81.0 kg | 80.1 kg") return "second: " + rows[1];
if (rows[2] !== "4 Sep | 79.0 kg | 79.9 kg") return "two days on: " + rows[2];
if (rows[3] !== "5 Sep | 80.5 kg | 80.0 kg") return "a day's average: " + rows[3];
if (rows[4] !== "After 12 days without one, 17 Sep | 78.0 kg | 78.0 kg") return "after a hole: " + rows[4];
if (rows[5] !== "18 Sep | 79.0 kg | 78.1 kg") return "last: " + rows[5];

// The headline is the trend, not the scale's last word.
if (ex.querySelector(".ui-wtrend-now").textContent !== "78.1 kg") return "now: " + ex.querySelector(".ui-wtrend-now").textContent;
const stats = [...ex.querySelectorAll(".ui-wtrend-stats dd")].map((d) => d.textContent);
if (stats[0] !== "79.0 kg") return "last weigh-in: " + stats[0];
// Two days of this run: too short to give a rate.
if (stats[1] !== "Too soon to say") return "rate: " + stats[1];
if (stats[2] !== "-2.1 kg") return "to goal: 76 - 78.1: " + stats[2];

// The line breaks at the hole: two starts. 6 dots. The hole's band says 12 days.
const line = ex.querySelector(".ui-wtrend-line").getAttribute("d");
if ((line.match(/M/g) ?? []).length !== 2) return "the line should lift at the hole: " + line;
if ((line.match(/L/g) ?? []).length !== 4) return "four joins: " + line;
if ((ex.querySelector(".ui-wtrend-dots").getAttribute("d").match(/M/g) ?? []).length !== 6) return "six dots";
const hole = ex.querySelector(".ui-wtrend-hole");
if (!hole || hole.textContent !== "12 days") return "the hole is marked: " + hole?.textContent;
// 17 days across 960: 5 Sep is day 4, 17 Sep day 16: 20 + 4 * 960 / 17 = 245.88 -> 24.588%; width 12 * 960 / 17 = 677.65 -> 67.765%.
if (Math.abs(parseFloat(hole.style.left) - 24.588) > 0.01) return "hole left: " + hole.style.left;
if (Math.abs(parseFloat(hole.style.width) - 67.765) > 0.01) return "hole width: " + hole.style.width;

// The goal line and its place: the scale, in kg: lowest 76, highest 81, width 5, middle 78.5, so 75.6 to 81.4;
// 76 sits (81.4 - 76) / 5.8 = 93.1% down.
const goal = ex.querySelector(".ui-wtrend-goal");
if (Math.abs(parseFloat(goal.style.top) - 93.103) > 0.02) return "goal at: " + goal.style.top;
if (goal.textContent !== "Goal 76.0 kg") return "goal says: " + goal.textContent;

// Before a touch.
if (read() !== "Touch the chart to read a day.") return "hint: " + read();
if (!cross().hidden) return "no line before a touch";

// Drag to the left end: 1 Sep. The plot is 1000 wide in its own numbers, the first dot at 20.
const w = plot.getBoundingClientRect().width;
await drag(plot, -0.49 * w, 0, 300);
if (read() !== "1 Sep: 80.0 kg, trend 80.0 kg") return "to the left end: " + read();
if (said() !== "2026-09-01 80 80") return "on_select: " + said();
if (crossAt() !== 2) return "line on the first dot: " + crossAt();
if (plot.getAttribute("aria-valuenow") !== "1") return "aria-valuenow: " + plot.getAttribute("aria-valuenow");

// A tap in the middle is in the hole: it says so and offers no number.
await tap(plot);
if (read() !== "No weigh-in for 12 days, 5 Sep to 17 Sep") return "the hole reads as a hole: " + read();
if (said() !== "Cleared.") return "a hole chooses no weigh-in: " + said();
if (!ex.querySelector(".ui-wtrend-pt").hidden) return "no dot in a hole";

// During a drag only the line and words move; on a system's cancel they go back.
await tap(ex.querySelector(".ui-wtrend-clear"));
await drag(plot, 0.49 * w, 0, 200);
if (read() !== "18 Sep: 79.0 kg, trend 78.1 kg") return "to the right end: " + read();
if (said() !== "2026-09-18 79 78.1") return "on_select right: " + said();
const p0 = middle(plot);
await fingers("touchStart", [p0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p0.x - 0.07 * w * i, y: p0.y }]); await wait(16); }
await wait(30);
if (read() !== "2 Sep: 81.0 kg, trend 80.1 kg") return "reading during a drag: " + read();
if (said() !== "2026-09-18 79 78.1") return "the choice waits for the lift: " + said();
await fingers("touchCancel", []);
await wait(100);
if (read() !== "18 Sep: 79.0 kg, trend 78.1 kg") return "cancel goes back: " + read();
if (said() !== "2026-09-18 79 78.1") return "cancel chooses nothing";

// Up and down is the page's.
await tap(ex.querySelector(".ui-wtrend-clear"));
await drag(plot, 3, 100, 200);
if (!cross().hidden) return "a vertical drag should not scrub";
window.scrollTo(0, 0);
await wait(50);

// The unit: everything follows, the choice with it, and the callback hears. 79 kg = 174.2 lb, 78.1 = 172.2.
await tap(ex.querySelectorAll(".ui-wtrend-read span")[0]);
plot.focus();
const press = (k) => plot.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
press("End");
await wait(50);
if (read() !== "18 Sep: 79.0 kg, trend 78.1 kg") return "End: " + read();
const lb = ex.querySelectorAll(".ui-wtrend-unit")[1];
await tap(lb);
if (lb.getAttribute("aria-pressed") !== "true") return "lb pressed";
if ($("#weight-trend-unit").textContent !== "lb") return "on_unit: " + $("#weight-trend-unit").textContent;
if (read() !== "18 Sep: 174.2 lb, trend 172.2 lb") return "in pounds: " + read();
if (ex.querySelector(".ui-wtrend-now").textContent !== "172.2 lb") return "headline in pounds: " + ex.querySelector(".ui-wtrend-now").textContent;
if (ex.querySelector(".ui-wtrend-goal").textContent !== "Goal 167.6 lb") return "goal in pounds: " + ex.querySelector(".ui-wtrend-goal").textContent;
if (cells()[0] !== "1 Sep | 176.4 lb | 176.4 lb") return "the table follows: " + cells()[0];
// Round numbers of the unit shown: pounds run 166.7 to 179.5, a width of 12.8, so lines every 5: 170 and 175.
const grid = [...ex.querySelectorAll(".ui-wtrend-grid")].map((g) => g.textContent).join();
if (grid !== "170,175") return "lines in pounds: " + grid;
await tap(ex.querySelectorAll(".ui-wtrend-unit")[0]);

// Keys go from weigh-in to weigh-in, jumping the hole.
press("Home");
await wait(30);
if (read() !== "1 Sep: 80.0 kg, trend 80.0 kg") return "Home: " + read();
for (let i = 0; i < 4; i++) { press("ArrowRight"); await wait(20); }
if (read() !== "17 Sep: 78.0 kg, trend 78.0 kg") return "four rights: " + read();
press("ArrowLeft");
await wait(30);
if (read() !== "5 Sep: 80.5 kg, trend 80.0 kg") return "left over the hole: " + read();
press("Home");
press("ArrowLeft");
await wait(30);
if (read() !== "1 Sep: 80.0 kg, trend 80.0 kg") return "left at the start stays: " + read();
press("Escape");
await wait(30);
if (said() !== "Cleared.") return "Escape: " + said();
if (read() !== "Touch the chart to read a day.") return "Escape clears the words: " + read();

// A full season: a rate from the last four weeks, a goal, and the holiday's hole of 16 days.
const season = $("#weight-trend-season");
if (season.querySelectorAll(".ui-wtrend-hole").length !== 1) return "one hole in the season";
if (season.querySelector(".ui-wtrend-hole").textContent !== "16 days") return "day 37 to day 53: " + season.querySelector(".ui-wtrend-hole").textContent;
const rate = season.querySelectorAll(".ui-wtrend-stats dd")[1].textContent;
if (!/^-0\.\d kg$/.test(rate)) return "a slow slide: " + rate;

// One weigh-in, in pounds: a dot in the middle, nothing to smooth. Those given in pounds stay exact.
const one = $("#weight-trend-lb");
if (one.querySelector(".ui-wtrend-now").textContent !== "176.4 lb") return "pounds in: " + one.querySelector(".ui-wtrend-now").textContent;
if (!one.querySelector(".ui-wtrend-dots").getAttribute("d").startsWith("M500")) return "a single dot in the middle";
if (one.querySelector(".ui-wtrend-goal").textContent !== "Goal 165.0 lb") return "pounds goal: " + one.querySelector(".ui-wtrend-goal").textContent;

// Nothing yet.
const none = $("#weight-trend-none");
if (none.querySelector(".ui-wtrend-now").textContent !== "No weigh-ins yet.") return "empty: " + none.textContent;
if (none.querySelector(".ui-wtrend-plot")) return "no chart for nothing";

// The tablet has room to set the numbers beside the chart.
const body = ex.querySelector(".ui-wtrend-body");
const cols = getComputedStyle(body).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns on " + device + ": " + cols;

// New data arrives with a finger on the chart: the line and the words stay with the finger, not with what was chosen.
window.scrollTo(0, 0);
ex.scrollIntoView({ block: "center" });
await wait(80);
plot.focus();
press("End");
await wait(50);
const seen = (q) => ({ x: q.x - visualViewport.offsetLeft, y: q.y - visualViewport.offsetTop });
const r2 = plot.getBoundingClientRect(), c0 = seen({ x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 });
await fingers("touchStart", [c0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: c0.x - 0.07 * r2.width * i, y: c0.y }]); await wait(16); }
await wait(30);
if (read() !== "2 Sep: 81.0 kg, trend 80.1 kg") return "before the data: " + read();
const lineAt = cross().style.transform;
$("#weight-trend-stir").click();
await wait(120);
if (cross().style.transform !== lineAt) return "new data moved the line under a finger: " + cross().style.transform;
if (read() !== "2 Sep: 81.0 kg, trend 80.1 kg") return "new data changed the words under a finger: " + read();
await fingers("touchEnd", []);
await wait(120);
if (said() !== "2026-09-02 81 80.1") return "the lift after new data: " + said();

