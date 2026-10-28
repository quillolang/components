const figs = $$("figure.ui-ohlc");
if (figs.length !== 2) return `expected 2 OHLC charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const daily = $("#ohlc_chart-demo-daily figure"), fx = $("#ohlc_chart-demo-fx figure");
const rows = [...daily.querySelectorAll("table.ui-sr tbody tr")];
const cols = [...daily.querySelectorAll(".ui-ohlc-col")];
if (rows.length !== 90 || cols.length !== 90) return `90 bars made ${cols.length} columns and ${rows.length} table rows`;
const num = (s) => Number(s.replace(/[$,]/g, ""));
for (let i = 0; i < cols.length; i++) {
    const [o, h, l, c] = [...rows[i].querySelectorAll("td")].slice(0, 4).map((td) => num(td.textContent));
    if (cols[i].classList.contains("ui-ohlc-up") !== (c >= o)) return `bar ${i} is coloured the wrong way`;
    const bar = cols[i].querySelector(".ui-ohlc-bar").getBoundingClientRect();
    const open = cols[i].querySelector(".ui-ohlc-open").getBoundingClientRect();
    const close = cols[i].querySelector(".ui-ohlc-close").getBoundingClientRect();
    if (!(open.left < bar.left - 1 && open.right <= bar.right && close.right > bar.right + 1 && close.left >= bar.left)) return `bar ${i}: the open tick is not on the left and the close on the right`;
    const oy = open.top + open.height / 2, cy = close.top + close.height / 2;
    if (oy < bar.top - 1 || oy > bar.bottom + 1 || cy < bar.top - 1 || cy > bar.bottom + 1) return `bar ${i}'s ticks are outside its high and low`;
    if ((c > o) !== (cy < oy) && Math.abs(cy - oy) > 1) return `bar ${i}'s close tick is on the wrong side of its open`;
}
const tip = cols[40].querySelector(".ui-ohlc-tip");
if (getComputedStyle(tip).display !== "none") return "the details show before hover";
const cells = [...rows[40].querySelectorAll("td")].map((td) => td.textContent);
for (const [name, v] of [["Open", cells[0]], ["High", cells[1]], ["Low", cells[2]], ["Close", cells[3]]])
    if (!tip.textContent.includes(name + v)) return `the hover details lack ${name} ${v}: ${tip.textContent}`;
if (daily.querySelectorAll(".ui-ohlc-ma").length !== 1 || daily.querySelector(".ui-ohlc-legend").textContent.trim() !== "SMA 10") return "sma={[10]} has no line or legend";
if (!daily.querySelector(".ui-ohlc-vpane")) return "no volume pane";
if (fx.querySelector(".ui-ohlc-vpane")) return "volume={false} has a volume pane";
if (!/^\d\.\d{4}$/.test(fx.querySelector(".ui-ohlc-tag").textContent)) return `decimals={4} shows ${fx.querySelector(".ui-ohlc-tag").textContent}`;
const xs = [...daily.querySelectorAll(".ui-ohlc-x span")];
const plot = daily.querySelector(".ui-ohlc-plot").getBoundingClientRect();
if (xs.some((s) => s.getBoundingClientRect().right > plot.right + 1)) return "a date label runs past the plot";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
