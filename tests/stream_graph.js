if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-stream");
if (charts.length !== 2) return `expected 2 stream graphs, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a stream graph has NaN, Infinity or undefined in it";
const [plays, visits] = charts;
if (plays.getAttribute("aria-label") !== "Plays by genre, thousands") return "the label does not name the chart";
// A layer's path: its top edge left to right, then its bottom edge right to left;
// the points are the M, each C's last pair, and the L.
const edges = (layer) => {
    const [top, bottom] = layer.getAttribute("d").replace(" Z", "").split(" L");
    const pts = (s) => { const p = s.replace("M", "").trim().split(/ C ?/).map((seg) => seg.trim().split(" ").pop().split(",").map(Number)); return p; };
    return { top: pts(top), bottom: pts(bottom).reverse() };
};
const layers = [...plays.querySelectorAll(".ui-stream-layer")];
if (layers.length !== 5) return `5 series made ${layers.length} layers`;
const e = layers.map(edges);
if (e[0].top.length !== 20 || e[0].bottom.length !== 20) return `a layer has ${e[0].top.length} points, not 20`;
for (let j = 1; j < 5; j++) for (let i = 0; i < 20; i++)
    if (Math.abs(e[j].bottom[i][1] - e[j - 1].top[i][1]) > 0.02) return `layer ${j} does not sit on layer ${j - 1} at moment ${i}`;
const centre = parseFloat(plays.querySelector(".ui-stream-centre").style.top);
for (let i = 0; i < 20; i++) {
    const mid = (e[0].bottom[i][1] + e[4].top[i][1]) / 2;
    if (Math.abs(mid - centre) > 0.02) return `the pile is not centred on the centre line at moment ${i}`;
}
// Heights follow the values: the table has them.
const rows = [...plays.querySelectorAll("tbody tr")];
const val = (i, j) => parseFloat(rows[i].querySelectorAll("td")[j].textContent);
const total = (i) => parseFloat(rows[i].querySelectorAll("td")[5].textContent);
const h = (j, i) => e[j].bottom[i][1] - e[j].top[i][1];
if (Math.abs(h(0, 3) / h(2, 3) - val(3, 0) / val(3, 2)) > 0.02) return "layer heights are not in proportion to their values";
if (Math.abs(total(0) - [0, 1, 2, 3, 4].reduce((a, j) => a + val(0, j), 0)) > 0.01) return "the table's total";
if (plays.querySelectorAll(".ui-stream-legend li").length !== 5) return "no legend of five";
if (new Set(layers.map((l) => getComputedStyle(l).fill)).size !== 5) return "layers share a colour";
const cols = plays.querySelectorAll(".ui-stream-col");
if (cols.length !== 20) return "not a hover column per moment";
const tip = cols[5].querySelector(".ui-stream-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
const names = [...tip.querySelectorAll("p")].map((p) => p.textContent.replace(/[\d.,]+k$/, "")).join();
if (tip.querySelector("strong").textContent !== "W6" || names !== "Electronic,Jazz,Hip-hop,Rock,Pop,Total") return `tooltip: ${tip.textContent}`;
if (!cols[15].classList.contains("ui-stream-flip")) return "right-hand tooltips do not open to the left";
const xl = [...plays.querySelectorAll(".ui-stream-x span")].map((s) => s.textContent).join();
if (xl !== "W1,W4,W7,W10,W13,W16,W19") return `20 labels thinned to ${xl}`;

if (visits.querySelector(".ui-stream-centre")) return "wiggle has a centre line";
const v = [...visits.querySelectorAll(".ui-stream-layer")].map(edges);
for (let j = 1; j < 4; j++) for (let i = 0; i < 7; i++)
    if (Math.abs(v[j].bottom[i][1] - v[j - 1].top[i][1]) > 0.02) return "wiggled layers do not stack";
const mids = [0, 1, 2, 3, 4, 5, 6].map((i) => (v[0].bottom[i][1] + v[3].top[i][1]) / 2);
if (Math.max(...mids) - Math.min(...mids) < 1) return "wiggle is not moved off the centre";
if (visits.querySelector("tbody tr").textContent !== "Mon4,2002,1009001,8009,000") return `the table: ${visits.querySelector("tbody tr").textContent}`;
