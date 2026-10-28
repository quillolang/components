const figs = $$("figure.ui-dc");
if (figs.length !== 2) return `expected 2 depth charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#depth_chart-demo-btc figure"), narrow = $("#depth_chart-demo-acme figure");
const num = (s) => Number(s.replace(/[$,]|BTC/g, ""));
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => ({ side: r.cells[0].textContent, price: num(r.cells[1].textContent), size: num(r.cells[2].textContent), total: num(r.cells[3].textContent) }));
const asks = rows.filter((r) => r.side === "Ask").reverse(), bids = rows.filter((r) => r.side === "Bid");
if (asks.length !== 40 || bids.length !== 40) return `40 levels a side made ${asks.length} asks and ${bids.length} bids`;
// Best first, and each total is the running sum.
for (const [name, side, dir] of [["bids", bids, -1], ["asks", asks, 1]]) {
    for (let k = 0; k < side.length; k++) {
        if (k > 0 && Math.sign(side[k].price - side[k - 1].price) !== dir) return `${name} are not best first`;
        const run = (k > 0 ? side[k - 1].total : 0) + side[k].size;
        if (Math.abs(side[k].total - run) > 0.011) return `${name} level ${k}: total ${side[k].total}, not ${run}`;
    }
}
const head = f.querySelector(".ui-dc-head").textContent.replace(/\s+/g, " ");
if (!head.includes("Best bid 61,247.5") || !head.includes("Best ask 61,252.5") || !head.includes("Spread 5.0")) return `head: ${head}`;
if (f.querySelector(".ui-dc-mid span").textContent !== "Mid 61,250.0") return "the mid price is not marked";
// The mid line sits between the best bid and the best ask, in the middle of the plot.
const plot = f.querySelector(".ui-dc-plot").getBoundingClientRect(), mid = f.querySelector(".ui-dc-mid").getBoundingClientRect();
if (Math.abs(mid.left - (plot.left + plot.width / 2)) > 1.5) return "the mid price is not centred";
const edges = f.querySelectorAll(".ui-dc-edge");
if (edges.length !== 2 || getComputedStyle(edges[0]).stroke === getComputedStyle(edges[1]).stroke) return "bids and asks are not two colours";
// A stepped edge: points alternate a vertical and a horizontal move.
const pts = edges[1].getAttribute("d").split(/ ?[ML]/).filter(Boolean).map((p) => p.split(",").map(Number));
if (pts.some((p, i) => i > 0 && p[0] !== pts[i - 1][0] && p[1] !== pts[i - 1][1])) return "the asks' edge is not stepped";
if (Math.min(...pts.map((p) => p[0])) < 50) return "asks are drawn left of the mid";
const zones = [...f.querySelectorAll(".ui-dc-zone")];
if (zones.length !== 80) return `not a hover zone per level (${zones.length})`;
const tip = zones[3].querySelector(".ui-dc-tip");
if (getComputedStyle(tip).display !== "none") return "the details show before hover";
if (!tip.textContent.includes(`Bids at ${bids[3].price.toLocaleString("en-US", { minimumFractionDigits: 1 })} or more`) || !tip.textContent.includes(`Total${bids[3].total} BTC`)) return `a bid's details: ${tip.textContent}`;
// Within 0.5% of the mid: the farthest levels are left out of the plot, not the table.
const nrows = narrow.querySelectorAll("table.ui-sr tbody tr").length, nzones = narrow.querySelectorAll(".ui-dc-zone").length;
if (nrows !== 60 || nzones >= 60 || nzones < 20) return `spread={0.5} kept ${nzones} of ${nrows} levels`;
const xs = [...narrow.querySelectorAll(".ui-dc-x span")], np = narrow.querySelector(".ui-dc-plot").getBoundingClientRect();
if (xs.some((s) => s.getBoundingClientRect().left < np.left - 1)) return "a price label runs off the plot";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
