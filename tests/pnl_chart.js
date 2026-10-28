const figs = $$("figure.ui-pnl");
if (figs.length !== 2) return `expected 2 P&L charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#pnl_chart-demo-q3 figure"), small = $("#pnl_chart-demo-small figure");
const num = (s) => Number(s.replace(/[$,+]/g, ""));
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.cells].slice(1).map((c) => num(c.textContent)));
if (rows.length !== 64) return `${rows.length} rows for 64 days`;
let run = 0, peak = 0, worst = 0;
for (let i = 0; i < rows.length; i++) {
    run += rows[i][0]; peak = Math.max(peak, run); worst = Math.min(worst, run - peak);
    if (rows[i][1] !== run) return `day ${i}: the total ${rows[i][1]} is not the running sum ${run}`;
    if (rows[i][2] !== run - peak) return `day ${i}: the drawdown ${rows[i][2]} is not the fall from the best (${run - peak})`;
}
const stats = Object.fromEntries([...f.querySelectorAll(".ui-pnl-stats div")].map((d) => [d.querySelector("dt").textContent, d.querySelector("dd").textContent]));
const pnl = rows.map((r) => r[0]), wins = pnl.filter((v) => v > 0).length, decided = pnl.filter((v) => v !== 0).length;
if (num(stats["Total"]) !== run || num(stats["Best day"]) !== Math.max(...pnl) || num(stats["Worst day"]) !== Math.min(...pnl) || num(stats["Max drawdown"]) !== worst) return `figures: ${JSON.stringify(stats)}`;
if (stats["Winning days"] !== `${Math.round(wins * 100 / decided)}% (${wins} of ${decided})`) return `winning days: ${stats["Winning days"]}`;
if (!stats["Max drawdown"].startsWith("-") || !f.querySelector(".ui-pnl-stats div:last-child").classList.contains("ui-pnl-down")) return "the drawdown is not shown as a loss";
const cols = [...f.querySelectorAll(".ui-pnl-col")];
const zero = f.querySelector(".ui-pnl-bpane .ui-pnl-zero").getBoundingClientRect().top;
for (let i = 0; i < 64; i++) {
    if (cols[i].classList.contains("ui-pnl-up") !== pnl[i] >= 0) return `day ${i}'s bar is the wrong colour`;
    const b = cols[i].querySelector(".ui-pnl-bar").getBoundingClientRect();
    if (pnl[i] > 0 && Math.abs(b.bottom - zero) > 1.5 || pnl[i] < 0 && Math.abs(b.top - zero) > 1.5) return `day ${i}'s bar does not start at zero`;
}
const big = pnl.indexOf(Math.max(...pnl)), mid = pnl.findIndex((v) => v > 0 && v < Math.max(...pnl) / 2);
const h = (i) => cols[i].querySelector(".ui-pnl-bar").getBoundingClientRect().height;
if (Math.abs(h(mid) / h(big) - pnl[mid] / pnl[big]) > 0.05) return "bars are not as tall as the day's result";
const shade = f.querySelector(".ui-pnl-dd").getAttribute("d");
if (!shade.endsWith("Z") || !f.querySelector(".ui-pnl-peak")) return "no drawdown shading";
const tip = cols[40].querySelector(".ui-pnl-tip");
if (getComputedStyle(tip).display !== "none" || !tip.textContent.includes("Total" + (rows[40][1] > 0 ? "+" : "") + "$") || !tip.textContent.includes("Drawdown")) return `details: ${tip.textContent}`;
if (small.querySelector(".ui-pnl-stats")) return "stats={false} still shows the figures";
if (small.querySelectorAll(".ui-pnl-col")[5].querySelector(".ui-pnl-bar").getBoundingClientRect().height > 1.5) return "a day of 0 has a bar";
if (small.querySelector("tbody tr").cells[1].textContent !== "+$120.50") return "decimals";
const ys = [...f.querySelectorAll(".ui-pnl-y span")].map((s) => s.getBoundingClientRect());
if (ys.some((a, i) => ys.some((b, j) => j > i && a.bottom > b.top + 1 && b.bottom > a.top + 1))) return "axis labels overlap";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
