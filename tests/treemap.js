if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-treemap");
if (charts.length !== 2) return `expected 2 treemaps, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a treemap has NaN, Infinity or undefined in it";
const [disk, sales] = charts;
if (disk.getAttribute("aria-label") !== "Disk use" || disk.querySelector("figcaption")?.textContent !== "Disk use") return "the label";
const box = disk.querySelector(".ui-treemap-box").getBoundingClientRect();
if (Math.abs(box.width / box.height - 2.4) > 0.02) return `aspect={2.4} made a box ${box.width} by ${box.height}`;
const tiles = [...disk.querySelectorAll(".ui-treemap-tile")];
if (tiles.length !== 8) return `8 items made ${tiles.length} tiles`;
const values = tiles.map((t) => Number(t.dataset.value));
if (values.join() !== "182,121,64,38,21,9,6,3") return `tiles are not largest first: ${values}`;
const total = values.reduce((a, b) => a + b, 0);
const pct = (t, k) => parseFloat(t.style[k]);
let area = 0;
for (const [i, t] of tiles.entries()) {
    const a = pct(t, "width") * pct(t, "height");
    area += a;
    if (Math.abs(a / 10000 - values[i] / total) > 0.002) return `${t.querySelector("b").textContent} takes ${a / 100}% of the area, not ${values[i] / total * 100}%`;
}
if (Math.abs(area - 10000) > 2) return `the tiles cover ${area / 100}% of the box`;
const rects = tiles.map((t) => t.getBoundingClientRect());
for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 0.5 && h > 0.5) return `tiles ${i} and ${j} overlap`;
}
const worst = Math.max(...rects.map((r) => Math.max(r.width / r.height, r.height / r.width)));
if (worst > 4) return `the layout is not squarified: a tile is ${worst.toFixed(1)} times longer than wide`;
if (pct(tiles[0], "left") !== 0 || pct(tiles[0], "top") !== 0) return "the largest tile is not first, top left";
if (new Set(tiles.map((t) => getComputedStyle(t).backgroundColor)).size !== 8) return "ungrouped tiles do not each have a colour";
const tip = tiles[0].querySelector(".ui-treemap-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "PhotosValue182 GBShare41%") return `tooltip: ${tip.textContent}`;
if (tiles[0].querySelector(".ui-treemap-text").textContent !== "Photos182 GB") return "the tile does not show its label and value";
if (disk.querySelector(".ui-treemap-legend")) return "an ungrouped treemap has a legend";
if (disk.querySelectorAll("tbody tr").length !== 8 || disk.querySelector("tbody tr").textContent !== "Photos182 GB41%") return "the screen reader table";

const groups = [...sales.querySelectorAll(".ui-treemap-group")];
if (groups.length !== 4) return `4 groups made ${groups.length}`;
const names = groups.map((g) => g.querySelector(".ui-treemap-gname").textContent);
if (names.join() !== "Furniture$43,600,Electronics$35,400,Lighting$7,800,Office$4,700") return `group names: ${names}`;
const all = 43600 + 35400 + 7800 + 4700;
const ga = pct(groups[0], "width") * pct(groups[0], "height") / 10000;
if (Math.abs(ga - 43600 / all) > 0.002) return `Furniture's area is ${ga}`;
const furn = [...groups[0].querySelectorAll(".ui-treemap-tile")];
if (furn.length !== 4 || !furn.every((t) => t.classList.contains("ui-treemap-s1"))) return "a group's tiles are not in its colour";
if (!groups[1].querySelector(".ui-treemap-tile").classList.contains("ui-treemap-s2")) return "the second group is not the second colour";
if (sales.querySelectorAll(".ui-treemap-tile").length !== 13) return "not a tile per item";
const legend = [...sales.querySelectorAll(".ui-treemap-legend li")].map((l) => l.textContent);
if (legend.join() !== "Furniture$43,600,Electronics$35,400,Lighting$7,800,Office$4,700") return `legend: ${legend}`;
if (!furn[0].querySelector(".ui-treemap-tip").textContent.includes("GroupFurniture")) return "a grouped tip does not name its group";
if (sales.querySelectorAll("thead th").length !== 4 || sales.querySelector("tbody td").textContent !== "Furniture") return "the grouped table has no group column";
