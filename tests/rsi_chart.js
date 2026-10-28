const figs = $$("figure.ui-rsi");
if (figs.length !== 2) return `expected 2 RSI charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#rsi_chart-demo-price figure"), alone = $("#rsi_chart-demo-alone figure");
const num = (s) => Number(s.replace(/[$,]/g, ""));
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => ({ close: num(r.cells[1].textContent), rsi: r.cells[2].textContent }));
if (rows.length !== 120) return `${rows.length} rows for 120 candles`;
if (rows.slice(0, 14).some((r) => r.rsi !== "—") || rows[14].rsi === "—") return "RSI 14 does not start at the 15th close";
// Wilder's RSI, worked out again from the closes shown.
const c = rows.map((r) => r.close);
let g = 0, l = 0;
for (let i = 1; i < c.length; i++) {
    const d = c[i] - c[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= 14) { g += up / 14; l += dn / 14; } else { g = (g * 13 + up) / 14; l = (l * 13 + dn) / 14; }
    if (i >= 14) {
        const want = l === 0 ? 100 : 100 - 100 / (1 + g / l);
        if (Math.abs(parseFloat(rows[i].rsi) - want) > 0.06) return `RSI at ${i} is ${rows[i].rsi}, not ${want.toFixed(1)}`;
        const st = want >= 70 ? "overbought" : want <= 30 ? "oversold" : "";
        if (st && Math.abs(want - (want >= 70 ? 70 : 30)) > 0.1 && !rows[i].rsi.includes(st)) return `row ${i} (${want.toFixed(1)}) does not say ${st}`;
    }
}
if (!f.querySelector(".ui-rsi-pane") || alone.querySelector(".ui-rsi-pane")) return "price={false} should leave out the price pane, and only it";
const levels = [...f.querySelectorAll(".ui-rsi-level")].map((e) => e.style.top);
if (levels.join() !== "30%,70%") return `the 70 and 30 lines are at ${levels}`;
if ([...alone.querySelectorAll(".ui-rsi-level")].map((e) => e.style.top).join() !== "20%,80%") return "overbought={80} oversold={20} lines";
const hot = f.querySelector(".ui-rsi-hot"), cold = f.querySelector(".ui-rsi-cold");
if (!hot || !cold || getComputedStyle(hot.querySelector("path")).stroke === getComputedStyle(f.querySelector(".ui-rsi-line")).stroke) return "the line does not change colour past the lines";
const cols = [...f.querySelectorAll(".ui-rsi-col")];
if (cols.length !== 120) return "not a hover column per close";
const tip = cols[60].querySelector(".ui-rsi-tip");
if (getComputedStyle(tip).display !== "none" || !tip.textContent.includes("Close" + f.querySelectorAll("table.ui-sr tbody tr")[60].cells[1].textContent) || !tip.textContent.includes("RSI 14" + parseFloat(rows[60].rsi).toFixed(1))) return `hover details: ${tip.textContent}`;
// The RSI dot sits at its value on the 0 to 100 pane.
const pane = f.querySelector(".ui-rsi-ipane").getBoundingClientRect(), dot = cols[60].querySelector(".ui-rsi-di");
if (Math.abs(parseFloat(dot.style.top) - (100 - parseFloat(rows[60].rsi))) > 0.06) return "the RSI dot is not at its value";
if (f.querySelectorAll(".ui-rsi-yi .ui-rsi-tag").length !== 1 || parseFloat(f.querySelector(".ui-rsi-yi .ui-rsi-tag").textContent) !== parseFloat(rows[119].rsi)) return "the last RSI is not on the axis";
if (f.querySelector(".ui-rsi-name").textContent !== "RSI 14" || alone.querySelector(".ui-rsi-name").textContent !== "RSI 5") return "the pane is not named";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
