if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-violin");
if (charts.length !== 2) return `expected 2 violin plots, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a violin plot has NaN, Infinity or undefined in it";
const [sess, exam] = charts;
if (sess.getAttribute("aria-label") !== "Session length by device") return "the label does not name the chart";
const shapes = [...sess.querySelectorAll(".ui-violin-area")];
if (shapes.length !== 3) return `3 groups made ${shapes.length} violins`;
const points = (p) => p.getAttribute("d").replace(/[MZ]/g, "").split(" L").map((s) => s.trim().split(",").map(Number));
for (const p of shapes) {
    const pts = points(p), half = pts.length / 2;
    if (pts.length !== 98) return `a violin has ${pts.length} points, not 2 x 49`;
    for (let k = 0; k < half; k++) {
        const r = pts[k], l = pts[pts.length - 1 - k];
        if (Math.abs(r[1] - l[1]) > 0.01 || Math.abs(r[0] - 50 - (50 - l[0])) > 0.02) return "a violin is not mirrored";
    }
    if (Math.max(...pts.map((q) => q[0])) !== 100) return "a violin is not full width at its densest";
}
// Desktop mixes short and long visits: its right side has two bulges.
const right = points(shapes[2]).slice(0, 49).map((q) => q[0]);
const peaks = right.filter((x, k) => k > 0 && k < 48 && x > right[k - 1] && x >= right[k + 1]).length;
if (peaks < 2) return `Desktop's violin has ${peaks} bulge(s), not two`;
const peaksM = points(shapes[0]).slice(0, 49).map((q) => q[0]).filter((x, k, a) => k > 0 && k < 48 && x > a[k - 1] && x >= a[k + 1]).length;
if (peaksM !== 1) return `Mobile's violin has ${peaksM} bulges`;
if (sess.querySelectorAll(".ui-violin-box").length !== 3 || sess.querySelectorAll(".ui-violin-median").length !== 3) return "box={true} draws no quartile boxes";
const row = [...sess.querySelectorAll("tbody tr")][0].querySelectorAll("td");
const q1 = parseFloat(row[2].textContent), q3 = parseFloat(row[4].textContent);
const box = sess.querySelector(".ui-violin-box");
if (Math.abs(parseFloat(box.style.getPropertyValue("--a")) - q1 * 100 / 40) > 0.01) return `the box starts at ${box.style.getPropertyValue("--a")}, not Q1 ${q1}`;
if (Math.abs(parseFloat(box.style.getPropertyValue("--b")) - (q3 - q1) * 100 / 40) > 0.01) return "the box does not reach Q3";
if (row[0].textContent !== "120") return "the table does not count the values";
if (sess.querySelector(".ui-violin-y span").textContent !== "0") return "zero={true} does not start at 0";

const ex = [...exam.querySelectorAll(".ui-violin-col")];
const a = points(ex[0].querySelector(".ui-violin-area"));
// Class A spans 62 to 94 on an axis from 40 to 100.
if (Math.abs(a[0][1] - 10) > 0.01 || Math.abs(a[48][1] - (100 - 22 / 60 * 100)) > 0.01) return `Class A's violin spans ${a[0][1]} to ${a[48][1]}`;
if (exam.querySelector(".ui-violin-box")) return "box={false} still draws boxes";
if (ex[2].querySelector("svg") || !ex[2].querySelector(".ui-violin-dot")) return "one value is not a dot";
const tip = ex[0].querySelector(".ui-violin-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "Class AHighest94Q386.5Median81Q176Lowest62Values11") return `tooltip: ${tip.textContent}`;
if (new Set(shapes.map((s) => getComputedStyle(s).stroke)).size !== 3) return "groups share a colour";
if (!exam.querySelector(".ui-violin-frame").hasAttribute("aria-hidden")) return "the drawing is not hidden from screen readers";
