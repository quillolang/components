if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-paretoc");
if (charts.length !== 2) return `expected 2 pareto charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [returns, hours] = charts;
const xs = [...returns.querySelectorAll(".ui-paretoc-x span")].map((s) => s.textContent);
if (xs.join() !== "Wrong size,Damaged,Not as shown,Late,Changed mind,Other,Duplicate") return `not sorted largest first: ${xs}`;
const bars = [...returns.querySelectorAll(".ui-paretoc-bar")];
const h = bars.map((b) => b.getBoundingClientRect().height);
if (!h.every((x, i) => i === 0 || x <= h[i - 1] + 0.01)) return "the bars do not shrink left to right";
// Total 813: 412 (50.7%), +160 (70.4%), +96 (82.2%) crosses 80%.
const few = bars.map((b) => b.classList.contains("ui-paretoc-few"));
if (few.join() !== "true,true,true,false,false,false,false") return `the strong bars: ${few}`;
if (getComputedStyle(bars[0]).backgroundColor === getComputedStyle(bars[3]).backgroundColor) return "the many are not lighter than the few";
const plot = returns.querySelector(".ui-paretoc-plot").getBoundingClientRect();
const pts = [...returns.querySelectorAll(".ui-paretoc-pt")].map((p) => { const r = p.getBoundingClientRect(); return (plot.bottom - (r.top + r.bottom) / 2) / plot.height * 100; });
if (Math.abs(pts[0] - 412 * 100 / 813) > 0.5 || Math.abs(pts[6] - 100) > 0.5) return `the running share: ${pts.map(Math.round)}`;
const line = returns.querySelector(".ui-paretoc-line").getAttribute("d");
if (!line.endsWith(",0")) return "the running share does not end at 100%";
const cut = returns.querySelector(".ui-paretoc-cut").getBoundingClientRect();
if (Math.abs(plot.bottom - cut.top - plot.height * 0.8) > 1.5) return "the 80% line is not at 80%";
if ([...returns.querySelectorAll(".ui-paretoc-right span")].map((s) => s.textContent).join() !== "0%,25%,50%,75%,100%") return "the right axis";
const tip = returns.querySelectorAll(".ui-paretoc-col")[1].querySelector(".ui-paretoc-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "DamagedReturns160Share19.7%Running share70.4%") return `tooltip: ${tip.textContent}`;
if (returns.querySelector("tbody tr").textContent !== "Wrong size41250.7%50.7%") return `the table: ${returns.querySelector("tbody tr").textContent}`;

// Hours: 94 in all: 36.5 (38.8%), +28 (68.6%), +14 (83.5%) crosses 70%.
const hfew = [...hours.querySelectorAll(".ui-paretoc-bar")].map((b) => b.classList.contains("ui-paretoc-few"));
if (hfew.join() !== "true,true,true,false,false") return `threshold={70}: ${hfew}`;
if (hours.querySelector(".ui-paretoc-cut span").textContent !== "70%") return "the threshold line is not labelled";
if (hours.querySelectorAll("tbody td")[0].textContent !== "36.5 h") return "the values have no suffix";
