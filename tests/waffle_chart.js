if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-wafflec");
if (charts.length !== 2) return `expected 2 waffle charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [power, seats] = charts;
const cells = [...power.querySelectorAll(".ui-wafflec-cell")];
if (cells.length !== 100) return `the grid has ${cells.length} squares, not 100`;
const count = (i) => cells.filter((c) => c.classList.contains(`ui-wafflec-p${i}`)).length;
// 241 TWh: 33.7, 25.9, 18.6, 13.2, 5.1, 3.4 percent -> 34, 26, 19, 13, 5, 3 (largest remainders up).
const got = [1, 2, 3, 4, 5, 6].map(count);
if (got.join() !== "34,26,19,13,5,3") return `squares per part: ${got}`;
if (!cells[0].classList.contains("ui-wafflec-p1") || !cells[99].classList.contains("ui-wafflec-p6")) return "the parts do not fill from the top left in order";
const r0 = cells[0].getBoundingClientRect(), r1 = cells[1].getBoundingClientRect(), r10 = cells[10].getBoundingClientRect();
if (Math.abs(r0.width - r0.height) > 0.5) return "the squares are not square";
if (!(r1.left > r0.right && Math.abs(r10.top - r0.bottom - 3) < 0.6)) return "the grid is not ten across with 3px gaps";
if (Math.round(power.querySelector(".ui-wafflec-grid").getBoundingClientRect().width) !== 200) return "the grid is not 200px wide";
if (new Set([1, 2, 3, 4, 5, 6].map((i) => getComputedStyle(power.querySelector(`.ui-wafflec-cell.ui-wafflec-p${i}`)).backgroundColor)).size !== 6) return "parts share a colour";
const li = [...power.querySelectorAll(".ui-wafflec-legend li")].map((l) => l.textContent);
if (li[0] !== "Wind81.2 TWh33.7%") return `the legend reads ${li[0]}`;
if (cells[0].title !== "Wind: 81.2 TWh (33.7%)") return "a square has no title";
if (power.querySelectorAll("tbody tr").length !== 6) return "the table has no row per part";

const sc = [...seats.querySelectorAll(".ui-wafflec-cell")];
const empty = sc.filter((c) => !c.className.includes("ui-wafflec-p")).length;
if (empty !== 18) return `total={5000} with 4,120 sold leaves ${empty} empty squares, not 18`;
if (getComputedStyle(sc[99]).backgroundColor !== getComputedStyle(seats.querySelector(".ui-wafflec-legend li:last-child .ui-wafflec-key")).backgroundColor) return "the empty squares are not the Rest key's colour";
const rest = seats.querySelector("tbody tr:last-child").textContent;
if (rest !== "Rest88017.6%") return `the table's rest: ${rest}`;
