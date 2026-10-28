const figs = $$("figure.ui-cs");
if (figs.length !== 3) return `expected 3 candlestick charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const daily = $("#candlestick_chart-demo-daily figure"), hourly = $("#candlestick_chart-demo-hourly figure"), small = $("#candlestick_chart-demo-small figure");
if (daily.getAttribute("aria-label") !== "ACME, daily") return "the label does not name the figure";
const rows = [...daily.querySelectorAll("table.ui-sr tbody tr")];
const cols = [...daily.querySelectorAll(".ui-cs-col")];
if (rows.length !== 120 || cols.length !== 120) return `120 candles made ${cols.length} columns and ${rows.length} table rows`;
const num = (s) => Number(s.replace(/[$,]/g, ""));
// Each column's colour follows its close against its open, and its body sits inside its wick.
for (let i = 0; i < cols.length; i++) {
    const [o, h, l, c] = [...rows[i].querySelectorAll("td")].slice(0, 4).map((td) => num(td.textContent));
    if (!(h >= Math.max(o, c) && l <= Math.min(o, c))) return `row ${i} is not a candle: ${rows[i].textContent}`;
    if (cols[i].classList.contains("ui-cs-up") !== (c >= o)) return `candle ${i} is coloured the wrong way`;
    const w = cols[i].querySelector(".ui-cs-wick").getBoundingClientRect(), b = cols[i].querySelector(".ui-cs-body").getBoundingClientRect();
    if (b.top < w.top - 0.5 || b.bottom > w.bottom + 1.5) return `candle ${i}'s body is outside its wick`;
}
if (getComputedStyle(cols[0].querySelector(".ui-cs-body")).backgroundColor === getComputedStyle(cols.find((c) => c.classList.contains("ui-cs-down")).querySelector(".ui-cs-body")).backgroundColor) return "up and down candles share a colour";
// Higher prices are higher up.
const hi = cols.map((c, i) => [num(rows[i].querySelectorAll("td")[1].textContent), c.querySelector(".ui-cs-wick").getBoundingClientRect().top]);
const top = hi.reduce((a, b) => (b[0] > a[0] ? b : a)), low = hi.reduce((a, b) => (b[0] < a[0] ? b : a));
if (!(top[1] < low[1])) return "the highest high is not drawn above the lowest";
const tip = cols[60].querySelector(".ui-cs-tip");
if (getComputedStyle(tip).display !== "none") return "the details show before hover";
const cells = [...rows[60].querySelectorAll("td")].map((td) => td.textContent);
for (const [name, v] of [["Open", cells[0]], ["High", cells[1]], ["Low", cells[2]], ["Close", cells[3]], ["Volume", cells[4]]])
    if (!tip.textContent.includes(name + v)) return `the hover details lack ${name} ${v}: ${tip.textContent}`;
if (!/Change[+-]?\d+\.\d\d%/.test(tip.textContent)) return `no change in the hover details: ${tip.textContent}`;
if (!cols[100].classList.contains("ui-cs-flip") || cols[10].classList.contains("ui-cs-flip")) return "details on the right half do not open to the left";
const legend = [...daily.querySelectorAll(".ui-cs-legend li")].map((l) => l.textContent.trim());
if (legend.join() !== "SMA 20,EMA 50") return `legend: ${legend}`;
const mas = daily.querySelectorAll(".ui-cs-ma");
if (mas.length !== 2) return "not a line per moving average";
const sma = mas[0].getAttribute("d").split(/ ?[ML]/).filter(Boolean);
const ema = mas[1].getAttribute("d").split(/ ?[ML]/).filter(Boolean);
if (sma.length !== 101 || ema.length !== 71) return `SMA 20 of 120 should have 101 points (has ${sma.length}), EMA 50 71 (has ${ema.length})`;
// The SMA's last point is the mean of the last 20 closes.
const closes = rows.map((r) => num(r.querySelectorAll("td")[3].textContent));
const mean = closes.slice(-20).reduce((a, b) => a + b) / 20;
if (Math.abs(num(cols[119].querySelector(".ui-cs-tip").textContent.match(/SMA 20\$([\d,.]+)/)[1]) - mean) > 0.006) return `SMA 20 is not the mean of 20 closes (${mean})`;
const tag = daily.querySelector(".ui-cs-tag");
if (!tag || tag.textContent !== rows[119].querySelectorAll("td")[3].textContent) return `the last price label says ${tag && tag.textContent}`;
const ticks = [...daily.querySelectorAll(".ui-cs-y > div:first-child > span:not(.ui-cs-tag)")].map((s) => num(s.textContent));
const step = ticks[1] - ticks[0];
if (ticks.length < 3 || ticks.some((t, i) => i > 0 && Math.abs(t - ticks[i - 1] - step) > 1e-9) || ticks[0] % step !== 0) return `price ticks are not round: ${ticks}`;
const months = [...daily.querySelectorAll(".ui-cs-x span")].map((s) => s.textContent);
if (months.join() !== "May,Jun,Jul,Aug,Sep") return `the date axis says ${months}`;
if (hourly.querySelector(".ui-cs-vpane") || hourly.querySelector(".ui-cs-vol")) return "volume={false} still has a volume pane";
if ([...hourly.querySelectorAll(".ui-cs-x span")].map((s) => s.textContent).join() !== "Oct 20,Oct 21,Oct 22,Oct 23") return "hourly candles are not labelled by day";
if (!/^Oct \d+, \d\d:00/.test(hourly.querySelector(".ui-cs-tip strong").textContent)) return "an hourly candle's time is not shown";
if (small.querySelector(".ui-cs-last") || small.querySelector(".ui-cs-tag")) return "last_line={false} still draws the last price";
if (small.querySelectorAll(".ui-cs-col").length !== 30) return "the small chart does not have 30 candles";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
