const figs = $$("figure.ui-bb");
if (figs.length !== 2) return `expected 2 Bollinger charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#bollinger_chart-demo-line figure"), bars = $("#bollinger_chart-demo-bars figure");
const val = (s) => (s === "—" ? null : Number(s.replace(/[$,]/g, "")));
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.cells].slice(1).map((c) => val(c.textContent)));
if (rows.length !== 110) return `${rows.length} rows for 110 candles`;
if (rows[18][2] !== null || rows[19][2] === null) return "the bands do not start at the 20th close";
// Middle: the mean of 20 closes; bands: 2 population deviations either side (from the closes shown).
for (const i of [19, 55, 109]) {
    const w = rows.slice(i - 19, i + 1).map((r) => r[0]), m = w.reduce((a, b) => a + b) / 20;
    const sd = Math.sqrt(w.reduce((a, b) => a + (b - m) ** 2, 0) / 20);
    if (Math.abs(rows[i][2] - m) > 0.006 || Math.abs(rows[i][1] - (m + 2 * sd)) > 0.006 || Math.abs(rows[i][3] - (m - 2 * sd)) > 0.006) return `bands at ${i}: ${rows[i]} vs ${m}, ±${2 * sd}`;
}
const cols = [...f.querySelectorAll(".ui-bb-col")];
for (let i = 0; i < 110; i++) {
    const out = rows[i][1] !== null && (rows[i][0] > rows[i][1] || rows[i][0] < rows[i][3]);
    const ring = cols[i].querySelector(".ui-bb-out");
    if (!!ring !== out && Math.min(Math.abs(rows[i][0] - (rows[i][1] ?? 0)), Math.abs(rows[i][0] - (rows[i][3] ?? 0))) > 0.01) return `close ${i} (${rows[i][0]}, bands ${rows[i][3]} to ${rows[i][1]}) ${out ? "is not" : "is"} marked outside`;
}
if (!f.querySelector(".ui-bb-out")) return "the demo has no close outside the bands";
const band = f.querySelector(".ui-bb-fill").getAttribute("d");
if (!band.startsWith("M") || !band.endsWith("Z") || band.split(/ ?[ML]/).filter(Boolean).length !== 2 * 91) return "the band is not one shape over the 91 banded closes";
if (f.querySelectorAll(".ui-bb-close").length !== 1 || bars.querySelector(".ui-bb-close")) return "bars={true} should draw candles, not the close line";
if (bars.querySelectorAll(".ui-bb-body").length !== 50 || !bars.querySelector(".ui-bb-up .ui-bb-body") || !bars.querySelector(".ui-bb-down .ui-bb-body")) return "the candles are missing";
if (!bars.querySelector(".ui-bb-legend").textContent.includes("±1.5σ") || !bars.querySelector(".ui-bb-legend").textContent.includes("SMA 10")) return "the legend does not name period and deviations";
const tip = cols[70].querySelector(".ui-bb-tip").textContent;
const pb = (rows[70][0] - rows[70][3]) / (rows[70][1] - rows[70][3]);
if (getComputedStyle(cols[70].querySelector(".ui-bb-tip")).display !== "none" || !tip.includes("SMA 20$" + rows[70][2].toFixed(2)) || Math.abs(Number(tip.match(/%B(-?[\d.]+)/)[1]) - pb) > 0.011) return `hover details: ${tip}`;
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
