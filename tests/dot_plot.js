if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-dotplot");
if (charts.length !== 3) return `expected 3 dot plots, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [scores, reply, salary] = charts;
const rows = [...scores.querySelectorAll(".ui-dotplot-rl")].map((r) => r.textContent);
// Changes: +9, +2, +11, -3, +7, +9: most up first, ties in the order given.
if (rows.join() !== "Oak Hill,Northfield,Harbor,Westbrook,Riverside,Lakeview") return `sort="change" gives ${rows}`;
const row = scores.querySelectorAll(".ui-dotplot-row")[0];
const dots = [...row.querySelectorAll(".ui-dotplot-dot")].map((d) => d.getBoundingClientRect());
const bar = row.querySelector(".ui-dotplot-bar").getBoundingClientRect();
if (dots.length !== 2) return "a row of two series has not two dots";
if (Math.abs(bar.left - (dots[0].left + dots[0].right) / 2) > 1 || Math.abs(bar.right - (dots[1].left + dots[1].right) / 2) > 1) return "the bar does not join the dots";
if (getComputedStyle(row.querySelectorAll(".ui-dotplot-dot")[0]).backgroundColor === getComputedStyle(row.querySelectorAll(".ui-dotplot-dot")[1]).backgroundColor) return "the two series share a colour";
const lakeview = scores.querySelectorAll(".ui-dotplot-row")[5].querySelectorAll(".ui-dotplot-dot");
if (!(lakeview[1].getBoundingClientRect().left < lakeview[0].getBoundingClientRect().left)) return "a fall is not drawn right to left";
const tip = row.querySelector(".ui-dotplot-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "Oak Hill202455202566Change+11") return `tooltip: ${tip.textContent}`;
if (scores.querySelectorAll(".ui-dotplot-legend li").length !== 2) return "two series have no legend";
if (scores.querySelectorAll("thead th").length !== 4) return "the table has no change column";
if (scores.querySelectorAll("tbody tr")[5].lastElementChild.textContent !== "-3") return "a fall is not -3 in the table";

const rr = [...reply.querySelectorAll(".ui-dotplot-rl")].map((r) => r.textContent);
if (rr.join() !== "Sales,Billing,Support,Security") return `sort="asc" gives ${rr}`;
if (reply.querySelector(".ui-dotplot-bar")) return "a single series has bars";
if (reply.querySelector(".ui-dotplot-x span").textContent !== "0") return "zero={true} does not start at 0";
if (reply.querySelector(".ui-dotplot-legend")) return "one series has a legend";
const grid = reply.querySelector(".ui-dotplot-grids").getBoundingClientRect();
const sec = reply.querySelectorAll(".ui-dotplot-dot")[3].getBoundingClientRect();
if (Math.abs((sec.left + sec.right) / 2 - (grid.left + grid.width * 14 / 15)) > 1) return "14 h is not drawn at 14 of 15";

const staff = salary.querySelectorAll(".ui-dotplot-row")[3];
if (staff.querySelectorAll(".ui-dotplot-dot").length !== 2) return "a null has a dot";
if (salary.querySelectorAll(".ui-dotplot-row")[0].querySelectorAll(".ui-dotplot-dot").length !== 3) return "three series have not three dots";
if (salary.querySelector(".ui-dotplot-change")) return "three series show a change";
