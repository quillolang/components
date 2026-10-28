const box = $("#stock_chart-demo-main"), chart = box.querySelector(".ui-stk"), daily = $("#stock_chart-demo-daily .ui-stk");
if (!chart || !daily) return "the two charts are missing";
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const panes = chart.querySelector(".ui-stk-panes");
const note = () => box.querySelector(".demo-note").textContent;
const rows = (c = chart) => [...c.querySelectorAll("table.ui-sr tbody tr")].map((r) => r.cells[0].textContent);
const btn = (group, name, c = chart) => [...c.querySelectorAll(`[aria-label="${group}"] button`)].find((b) => b.textContent === name);
const pressed = (group, c = chart) => [...c.querySelectorAll(`[aria-label="${group}"] button[aria-pressed=true]`)].map((b) => b.textContent).join();
if (pressed("Range") !== "3M" || note() !== "Showing 3M.") return `starts at ${pressed("Range")}: ${note()}`;
if (pressed("Chart type") !== "Candles" || pressed("Indicators") !== "SMA 20,EMA 50") return "the starting type and indicators";
if (panes.getAttribute("tabindex") !== "0" || panes.getAttribute("role") !== "application" || !panes.getAttribute("aria-label").startsWith("ACME · hourly, ")) return "the chart is not a named, focusable widget";
// 3M of hourly candles is more than fit: about 160 bars, neighbours drawn as one.
const r3 = rows();
if (r3.length < 140 || r3.length > 161) return `3M shows ${r3.length} bars`;
if (!/\(\d bars\)/.test(chart.querySelector(".ui-stk-when").textContent)) return "the readout does not say a bar holds several";
// The readout and the axis label follow the last bar when nothing is hovered.
const lastClose = chart.querySelector(".ui-sr tbody tr:last-child").cells[4].textContent;
if (chart.querySelector(".ui-stk-tag").textContent !== chart.querySelector(".ui-stk-last").textContent) return "the last price label is not the last close";
if (!chart.querySelector(".ui-stk-read").textContent.includes(`C ${lastClose}`)) return `the readout does not show the last bar: ${chart.querySelector(".ui-stk-read").textContent}`;
const up = chart.querySelector(".ui-stk-body.ui-stk-up").getAttribute("d"), down = chart.querySelector(".ui-stk-body.ui-stk-down").getAttribute("d");
if ((up.match(/M/g) || []).length + (down.match(/M/g) || []).length !== r3.length) return "not a candle body per bar";
// Ranges.
btn("Range", "1W").click(); await wait();
const w = rows();
if (w.length < 28 || w.length > 42 || w.some((t) => /bars/.test(t)) || pressed("Range") !== "1W" || note() !== "Showing 1W.") return `1W: ${w.length} bars, ${pressed("Range")}, ${note()}`;
if (/\(\d+ bars\)/.test(chart.querySelector(".ui-stk-when").textContent)) return "a week of hours should be one candle a bar";
btn("Range", "1D").click(); await wait();
if (rows().length !== 7) return `1D of 7 hourly candles a day shows ${rows().length}`;
btn("Range", "1M").click(); await wait();
const m = rows();
// The crosshair follows the pointer: the bar under it, its readout, a line and a price label.
const r = panes.getBoundingClientRect();
const move = (fx, fy) => panes.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: r.left + r.width * fx, clientY: r.top + 340 * fy, pointerId: 1 }));
move(0.25, 0.4); await wait();
const j = Math.floor(0.25 * m.length);
if (!chart.querySelector(".ui-stk-vline") || !chart.querySelector(".ui-stk-hline") || !chart.querySelector(".ui-stk-ax .ui-stk-cross")) return "no crosshair under the pointer";
if (!chart.querySelector(".ui-stk-when").textContent.startsWith(m[j])) return `the readout says ${chart.querySelector(".ui-stk-when").textContent}, the bar under the pointer is ${m[j]}`;
if (chart.querySelector(".ui-stk-x .ui-stk-cross").textContent !== m[j]) return "the time label does not follow the crosshair";
const vline = chart.querySelector(".ui-stk-vline").getBoundingClientRect().left;
if (Math.abs(vline - (r.left + r.width * (j + 0.5) / m.length)) > 1.5) return "the line is not on the bar";
panes.dispatchEvent(new PointerEvent("pointerleave", { pointerId: 1 })); await wait();
if (chart.querySelector(".ui-stk-vline") || chart.querySelector(".ui-stk-hline")) return "the crosshair stays after the pointer leaves";
// The wheel zooms around the pointer; the ranges let go.
panes.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: -120, clientX: r.left + r.width * 0.5, clientY: r.top + 100 })); await wait();
const z = rows();
if (!(z.length < m.length) || pressed("Range") !== "" || note() !== "Zoomed or panned by hand.") return `the wheel did not zoom in: ${m.length} to ${z.length}, ${note()}`;
panes.dispatchEvent(new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY: 120, clientX: r.left + r.width * 0.5, clientY: r.top + 100 })); await wait();
if (!(rows().length > z.length)) return "the wheel did not zoom out";
// A drag to the right shows earlier candles.
const before = rows()[0];
panes.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerId: 1, clientX: r.left + 200, clientY: r.top + 100 }));
panes.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 1, pointerId: 1, clientX: r.left + 400, clientY: r.top + 100 }));
panes.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1, clientX: r.left + 400, clientY: r.top + 100 })); await wait();
const dragged = rows()[0];
if (dragged === before || new Date(Date.parse(dragged.replace(",", " 2026,"))) > new Date(Date.parse(before.replace(",", " 2026,")))) return `dragging right went from ${before} to ${dragged}`;
// The keyboard: arrows move the crosshair, + and − zoom, Home and End, Escape.
panes.dispatchEvent(new PointerEvent("pointerleave", { pointerId: 1 })); await wait();
btn("Range", "1W").click(); await wait();
panes.focus();
key(panes, "ArrowLeft"); key(panes, "ArrowLeft"); await wait();
const k = rows();
if (chart.querySelector(".ui-stk-x .ui-stk-cross").textContent !== k[k.length - 2]) return "two ArrowLefts are not on the bar before the last";
const spoken = chart.querySelector(".ui-stk-panes [aria-live]").textContent;
if (!spoken.startsWith(k[k.length - 2] + ": open ") || !spoken.includes("volume")) return `screen readers hear: ${spoken}`;
key(panes, "+"); await wait();
if (!(rows().length < k.length)) return "+ does not zoom in";
key(panes, "-"); key(panes, "-"); await wait();
if (!(rows().length > k.length)) return "− does not zoom out";
key(panes, "Home"); await wait();
if (!rows()[0].startsWith("Jul 1, 10:00")) return `Home shows ${rows()[0]}`;
key(panes, "End"); await wait();
if (chart.querySelector(".ui-sr tbody tr:last-child").cells[4].textContent !== lastClose) return "End does not reach the last candle";
key(panes, "Escape"); await wait();
if (chart.querySelector(".ui-stk-vline")) return "Escape does not let go of the crosshair";
// Chart type and indicators.
btn("Chart type", "Line").click(); await wait();
if (chart.querySelector(".ui-stk-body") || !chart.querySelector(".ui-stk-close") || chart.querySelector(".ui-stk-fill")) return "Line";
btn("Chart type", "Area").click(); await wait();
if (!chart.querySelector(".ui-stk-fill") || pressed("Chart type") !== "Area") return "Area";
btn("Indicators", "SMA 20").click(); btn("Indicators", "RSI").click(); btn("Indicators", "MACD").click(); btn("Indicators", "Bollinger").click(); await wait();
if (chart.querySelector(".ui-stk-sma") || !chart.querySelector(".ui-stk-ema") || !chart.querySelector(".ui-stk-band")) return "turning SMA 20 off and Bollinger on";
if ([...chart.querySelectorAll(".ui-stk-pane")].map((p) => p.dataset.pane).join() !== "price,rsi,macd") return "RSI and MACD panes";
if (!chart.querySelector(".ui-stk-rsi").getAttribute("d").startsWith("M") || !chart.querySelector(".ui-stk-hist")) return "the panes are empty";
btn("Range", "3M").click(); await wait();
if (pressed("Range") !== "3M" || note() !== "Showing 3M.") return "a range after zooming";
// The daily chart: 1D cannot be filled by daily candles; it starts as a line with three indicators.
if (!btn("Range", "1D", daily).disabled || btn("Range", "1W", daily).disabled) return "1D of daily candles should be disabled, 1W not";
if (pressed("Chart type", daily) !== "Line" || pressed("Indicators", daily) !== "Bollinger,RSI,MACD") return "the daily chart's start";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
