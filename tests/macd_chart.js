const figs = $$("figure.ui-macd");
if (figs.length !== 2) return `expected 2 MACD charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#macd_chart-demo-price figure"), alone = $("#macd_chart-demo-alone figure");
const val = (s) => (s === "—" ? null : Number(s.replace(/[$,]/g, "")));
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.cells].slice(1).map((c) => val(c.textContent)));
if (rows.length !== 130) return `${rows.length} rows for 130 candles`;
const first = (k) => rows.findIndex((r) => r[k] !== null);
if (first(1) !== 25 || first(2) !== 33 || first(3) !== 33) return `MACD starts at ${first(1)} (want 25), signal at ${first(2)} (want 33)`;
// The MACD is EMA 12 less EMA 26 of the closes shown.
const ema = (xs, p) => { const k = 2 / (p + 1); let e = null; return xs.map((x, i) => { if (i + 1 === p) e = xs.slice(0, p).reduce((a, b) => a + b) / p; else if (i + 1 > p) e = x * k + e * (1 - k); return e; }); };
const closes = rows.map((r) => r[0]), e12 = ema(closes, 12), e26 = ema(closes, 26);
for (const i of [30, 80, 129]) if (Math.abs(rows[i][1] - (e12[i] - e26[i])) > 0.0002) return `MACD at ${i} is ${rows[i][1]}, not ${(e12[i] - e26[i]).toFixed(4)}`;
for (let i = 33; i < 130; i++) if (Math.abs(rows[i][3] - (rows[i][1] - rows[i][2])) > 0.0002) return `the histogram at ${i} is not MACD less signal`;
const sig = ema(rows.slice(25).map((r) => r[1]), 9);
if (Math.abs(rows[129][2] - sig[104]) > 0.0005) return `the signal is not EMA 9 of the MACD: ${rows[129][2]} vs ${sig[104]}`;
const cols = [...f.querySelectorAll(".ui-macd-col")];
if (cols.length !== 130 || cols.slice(0, 33).some((c) => c.querySelector(".ui-macd-hist"))) return "histogram bars before the signal starts";
for (let i = 34; i < 130; i++) {
    const bar = cols[i].querySelector(".ui-macd-hist");
    if (bar.classList.contains("ui-macd-up") !== rows[i][3] >= 0) return `bar ${i} is the wrong colour`;
    if (bar.classList.contains("ui-macd-fade") !== Math.abs(rows[i][3]) < Math.abs(rows[i - 1][3]) && Math.abs(Math.abs(rows[i][3]) - Math.abs(rows[i - 1][3])) > 0.0002) return `bar ${i}: paler should mean shrinking`;
}
// Bars hang from the zero line.
const zero = f.querySelector(".ui-macd-zero").getBoundingClientRect().top;
const up = cols.findIndex((c, i) => i > 33 && rows[i][3] > 0.05), down = cols.findIndex((c, i) => i > 33 && rows[i][3] < -0.05);
const ub = cols[up].querySelector(".ui-macd-hist").getBoundingClientRect(), db = cols[down].querySelector(".ui-macd-hist").getBoundingClientRect();
if (Math.abs(ub.bottom - zero) > 1.5 || Math.abs(db.top - zero) > 1.5) return "histogram bars do not start at zero";
const lines = f.querySelectorAll(".ui-macd-ipane .ui-macd-svg path");
if (lines.length !== 2 || getComputedStyle(lines[0]).stroke === getComputedStyle(lines[1]).stroke) return "the MACD and signal lines are not two colours";
const tip = cols[80].querySelector(".ui-macd-tip").textContent;
if (!tip.includes("MACD" + rows[80][1].toFixed(4)) || !tip.includes("Signal" + rows[80][2].toFixed(4))) return `hover details: ${tip}`;
if (alone.querySelector(".ui-macd-pane") || !f.querySelector(".ui-macd-pane")) return "price={false}";
if (alone.querySelector(".ui-macd-name").textContent !== "MACD 5 35 5" || alone.querySelector(".ui-macd-legend").textContent.indexOf("Signal (5)") < 0) return "the periods are not named";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
