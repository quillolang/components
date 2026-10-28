const figs = $$("figure.ui-ha");
if (figs.length !== 2) return `expected 2 Heikin-Ashi charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const big = $("#heikin_ashi_chart-demo-daily figure"), small = $("#heikin_ashi_chart-demo-small figure");
const heads = [...big.querySelectorAll("table.ui-sr thead th")].map((t) => t.textContent);
if (heads.join() !== "Time,HA open,HA high,HA low,HA close,Close,Volume") return `table headings: ${heads}`;
const num = (s) => Number(s.replace(/[$,]/g, ""));
const rows = [...big.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.querySelectorAll("td")].map((td) => num(td.textContent)));
const cols = [...big.querySelectorAll(".ui-ha-col")];
if (rows.length !== 100 || cols.length !== 100) return `100 candles made ${cols.length} columns`;
// Each Heikin-Ashi open is the middle of the one before (to the cent, as shown).
for (let i = 1; i < rows.length; i++) {
    const want = (rows[i - 1][0] + rows[i - 1][3]) / 2;
    if (Math.abs(rows[i][0] - want) > 0.011) return `candle ${i}'s HA open ${rows[i][0]} is not (open + close) / 2 of the last (${want})`;
    const [o, h, l, c] = rows[i];
    if (h < Math.max(o, c) - 0.01 || l > Math.min(o, c) + 0.01) return `candle ${i}'s high and low do not hold its body`;
    if (Math.abs(c - o) > 0.01 && cols[i].classList.contains("ui-ha-up") !== (c > o)) return `candle ${i} is coloured the wrong way`;
}
// Smoothed: fewer changes of colour than the real candles' closes.
const flips = cols.filter((c, i) => i > 0 && c.classList.contains("ui-ha-up") !== cols[i - 1].classList.contains("ui-ha-up")).length;
if (flips > 45) return `${flips} changes of colour in 100 candles: not smoothed`;
const tip = cols[50].querySelector(".ui-ha-tip").textContent;
if (!tip.includes("HA close") || !tip.includes("Close$" + rows[50][4].toFixed(2))) return `the hover details: ${tip}`;
const tag = big.querySelector(".ui-ha-tag");
if (num(tag.textContent) !== rows[99][4]) return `the last price label is not the real close: ${tag.textContent}`;
if (small.querySelectorAll(".ui-ha-col").length !== 40 || !small.querySelector(".ui-ha-ma")) return "the small chart: 40 candles with an EMA";
if (small.querySelector(".ui-ha-vol")) return "volume={false} draws volume";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
