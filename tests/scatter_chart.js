if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-scatc");
if (charts.length !== 2) return `expected 2 scatter charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [ads, body] = charts;
const pts = [...ads.querySelectorAll(".ui-scatc-pt")];
if (pts.length !== 9) return `9 points drew ${pts.length}`;
const plot = ads.querySelector(".ui-scatc-plot").getBoundingClientRect();
const xt = [...ads.querySelectorAll(".ui-scatc-x span")].map((s) => s.textContent), yt = [...ads.querySelectorAll(".ui-scatc-y span")].map((s) => s.textContent);
if (xt.join() !== "$0,$1k,$2k,$3k,$4k,$5k" || yt.join() !== "$5k,$10k,$15k,$20k,$25k") return `the ticks: ${xt} / ${yt}`;
// Mar: (2600, 15100) on axes 0-5000 and 5000-25000.
const r = pts[2].getBoundingClientRect();
const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
if (Math.abs(cx - (plot.left + plot.width * 2600 / 5000)) > 1 || Math.abs(cy - (plot.bottom - plot.height * (15100 - 5000) / 20000)) > 1) return "a point is not at its x and y";
if (Math.abs(r.width - 10) > 0.5 || getComputedStyle(pts[2]).borderRadius !== "50%") return "points are not 10px dots";
const tip = pts[2].querySelector(".ui-scatc-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "MarAd spend$2,600Sales$15,100") return `tooltip: ${tip.textContent}`;
if (!pts[8].classList.contains("ui-scatc-right") || !pts[7].classList.contains("ui-scatc-left") || pts[2].className.match(/left|right/)) return "only tooltips near the edges open inward";
// The trend line: least squares through the nine points.
const P = [[1200, 8400], [1800, 11200], [2600, 15100], [2200, 12900], [3400, 17800], [4100, 22600], [3800, 19400], [900, 7600], [4600, 23900]];
const mx = P.reduce((a, p) => a + p[0], 0) / 9, my = P.reduce((a, p) => a + p[1], 0) / 9;
const slope = P.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / P.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
const at = (x) => 100 - ((my + slope * (x - mx)) - 5000) * 100 / 20000;
const d = ads.querySelector(".ui-scatc-trend").getAttribute("d").match(/-?[\d.]+/g).map(Number);
if (Math.abs(d[0] - 18) > 0.01 || Math.abs(d[1] - at(900)) > 0.02 || Math.abs(d[2] - 92) > 0.01 || Math.abs(d[3] - at(4600)) > 0.02) return `the trend line is ${d}`;
if (ads.querySelectorAll("tbody tr").length !== 9 || ads.querySelector("tbody tr").textContent !== "Jan$1,200$8,400") return "the screen reader table";
if (ads.querySelector(".ui-scatc-ylabel").textContent !== "Sales" || ads.querySelector(".ui-scatc-xlabel").textContent !== "Ad spend") return "the axes are not named";

if (body.querySelectorAll(".ui-scatc-legend .ui-scatc-key").length !== 2) return "two groups have no legend";
if (body.querySelectorAll(".ui-scatc-trend").length !== 2) return "not a trend line per group";
const bp = body.querySelectorAll(".ui-scatc-pt");
if (bp.length !== 36) return `36 points drew ${bp.length}`;
if (getComputedStyle(bp[0]).backgroundColor === getComputedStyle(bp[20]).backgroundColor) return "the groups share a colour";
if (!bp[20].querySelector(".ui-scatc-tip").textContent.startsWith("MenHeight")) return `a grouped point's tooltip: ${bp[20].querySelector(".ui-scatc-tip").textContent}`;
if (body.querySelectorAll("thead th").length !== 4) return "the grouped table has no group column";
if (!body.querySelector("tbody th + td").textContent.endsWith(" cm")) return "x_suffix";
