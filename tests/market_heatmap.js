const figs = $$("figure.ui-mkthm");
if (figs.length !== 2) return `expected 2 heatmaps, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a map has NaN, Infinity or undefined in it";
const f = $("#market_heatmap-demo-market figure"), coins = $("#market_heatmap-demo-crypto figure");
const map = f.querySelector(".ui-mkthm-map").getBoundingClientRect();
if (Math.abs(map.width / map.height - 2) > 0.02) return `ratio={2} made ${map.width / map.height}`;
const tiles = [...f.querySelectorAll(".ui-mkthm-tile")];
if (tiles.length !== 19) return `19 stocks made ${tiles.length} tiles`;
const caps = { NOVA: 2950, PIXL: 2410, CHIP: 1820, CLDX: 640, BYTE: 310, SOFT: 220, MEDI: 820, CURE: 610, VITA: 340, DOSE: 120, BANK: 720, PAYX: 530, CRED: 260, MALL: 1980, FIZZ: 290, SHOE: 150, OILX: 470, SUNR: 95, GRID: 140 };
const total = Object.values(caps).reduce((a, b) => a + b), area = map.width * map.height;
const rect = (t) => t.getBoundingClientRect();
// Each sector's area is its share of the market, each stock's of its sector (under its
// heading), and tiles neither overlap nor leave the map.
const secs = { Technology: 8350, Consumer: 2420, Health: 1890, Finance: 1510, Energy: 565, Utilities: 140 };
for (const s of f.querySelectorAll(".ui-mkthm-sector")) {
    const r = s.getBoundingClientRect(), want = secs[s.dataset.sector] / total * area;
    if (Math.abs(r.width * r.height - want) > want * 0.02 + 4) return `${s.dataset.sector} covers ${Math.round(r.width * r.height)}px², not ${Math.round(want)}`;
}
const ar = (s) => { const r = rect(tiles.find((t) => t.dataset.symbol === s)); return r.width * r.height; };
for (const [a, b] of [["NOVA", "PIXL"], ["NOVA", "SOFT"], ["MEDI", "DOSE"], ["BANK", "CRED"]])
    if (Math.abs(ar(a) / ar(b) - caps[a] / caps[b]) > caps[a] / caps[b] * 0.04) return `${a} and ${b} are not sized by market value`;
for (const t of tiles) {
    const r = rect(t);
    if (r.left < map.left - 0.5 || r.right > map.right + 0.5 || r.top < map.top - 0.5 || r.bottom > map.bottom + 0.5) return `${t.dataset.symbol} is outside the map`;
}
for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) {
    const a = rect(tiles[i]), b = rect(tiles[j]);
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w > 1 && h > 1) return `${tiles[i].dataset.symbol} and ${tiles[j].dataset.symbol} overlap`;
}
// Sectors hold their stocks, and the biggest sector is laid out first, at the top left.
const sectors = [...f.querySelectorAll(".ui-mkthm-sector")];
if (sectors.map((s) => s.dataset.sector).join() !== "Technology,Consumer,Health,Finance,Energy,Utilities") return `sectors by size: ${sectors.map((s) => s.dataset.sector)}`;
const tech = rect(sectors[0]);
if (Math.abs(tech.left - map.left) > 1 || Math.abs(tech.top - map.top) > 1) return "the largest sector is not at the top left";
for (const sym of ["NOVA", "PIXL", "CHIP", "CLDX", "BYTE", "SOFT"]) {
    const r = rect(tiles.find((t) => t.dataset.symbol === sym));
    if (r.left < tech.left - 0.5 || r.right > tech.right + 0.5 || r.top < tech.top - 0.5 || r.bottom > tech.bottom + 0.5) return `${sym} is outside Technology`;
}
const tile = (s) => tiles.find((t) => t.dataset.symbol === s);
if (!tile("CHIP").classList.contains("ui-mkthm-up") || !tile("SHOE").classList.contains("ui-mkthm-down") || !tile("GRID").classList.contains("ui-mkthm-flat")) return "colour sides";
if (tile("CHIP").style.getPropertyValue("--p") !== "100%" || tile("SOFT").style.getPropertyValue("--p") !== "3%" || tile("SUNR").style.getPropertyValue("--p") !== "100%") return "depth is not the change over limit={3}, capped";
if (getComputedStyle(tile("CHIP")).backgroundColor === getComputedStyle(tile("SOFT")).backgroundColor) return "a big move is not a deeper colour";
if (getComputedStyle(tile("NOVA").querySelector(".ui-mkthm-sym")).display === "none" || tile("NOVA").querySelector(".ui-mkthm-chg").textContent !== "+1.84%") return "the big tile does not show its symbol and change";
const tip = tile("CLDX").querySelector(".ui-mkthm-tip");
if (getComputedStyle(tip).display !== "none" || tip.textContent !== "CLDX · CloudexSectorTechnologyPrice$302.10Change-1.20%Market value$640B") return `details: ${tip.textContent}`;
if (f.querySelectorAll("table.ui-sr tbody tr").length !== 19) return "screen readers do not get every stock";
if (coins.querySelector(".ui-mkthm-head")) return "coins without sectors still have a sector heading";
if (coins.querySelectorAll(".ui-mkthm-scale span")[0].textContent !== "-8.0%") return "limit={8} is not the legend's end";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
