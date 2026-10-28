const box = $("#live_candles-demo-live"), lc = box.querySelector(".ui-lvc");
if (!lc) return "no live candles";
const cols = () => [...lc.querySelectorAll(".ui-lvc-col")];
const starts = () => cols().map((c) => Number(c.dataset.start));
const read = () => lc.querySelector(".ui-lvc-read").textContent;
if (cols().length < 20 || cols().length > 36) return `limit={36} shows ${cols().length} candles`;
const s0 = starts();
if (s0.some((v, i) => i > 0 && v - s0[i - 1] !== 5000)) return "candles are not 5 seconds apart";
if (!cols().at(-1).classList.contains("ui-lvc-open") || lc.querySelectorAll(".ui-lvc-open").length !== 1) return "the last candle is not marked open";
for (const c of cols()) {
    const w = c.querySelector(".ui-lvc-wick").getBoundingClientRect(), b = c.querySelector(".ui-lvc-body").getBoundingClientRect();
    if (b.top < w.top - 1 || b.bottom > w.bottom + 2) return "a body is outside its wick";
}
if (!/^Open candle \d\d:\d\d:\d\d/.test(read()) || !/Closes in 0:0[1-5]/.test(read())) return `readout: ${read()}`;
const tag = lc.querySelector(".ui-lvc-tag");
if (!/^\$\d+\.\d\d0:0[1-5]$/.test(tag.textContent.trim())) return `the price label: ${tag.textContent}`;
// Ticks come: the open candle takes them, and every 5 simulated seconds a new candle starts.
const tickCount = () => Number([...lc.querySelectorAll(".ui-lvc-read > span")].find((e) => / ticks?$/.test(e.textContent)).textContent.split(" ")[0]);
const ticks0 = tickCount();
await wait(260);
const ticks1 = tickCount();
if (!(ticks1 === ticks0 + 1 || ticks1 === 1)) return `a tick did not reach the open candle (${ticks0} then ${ticks1})`;
await wait(1400);
const s1 = starts();
if (!(s1.at(-1) > s0.at(-1))) return "no new candle started";
if (s1.length > 36) return "more candles than the limit";
// The crosshair: the pointer, then the keyboard.
const plot = lc.querySelector(".ui-lvc-plot"), r = plot.getBoundingClientRect();
plot.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: r.left + r.width * 0.1, clientY: r.top + 50 })); await wait(60);
const hov = lc.querySelector(".ui-lvc-hover");
if (!hov || cols().indexOf(hov) !== Math.floor(0.1 * cols().length) || !read().startsWith("Candle ")) return `the pointer's candle: ${read()}`;
plot.dispatchEvent(new PointerEvent("pointerleave", {})); await wait(60);
if (lc.querySelector(".ui-lvc-hover")) return "the crosshair stays after the pointer leaves";
$("#live_candles-demo-toggle").click(); await wait(300);
plot.focus(); key(plot, "ArrowLeft"); key(plot, "ArrowLeft"); await wait(60);
if (cols().indexOf(lc.querySelector(".ui-lvc-hover")) !== cols().length - 2) return "two ArrowLefts from the end are not on the candle before the open one";
const frozen = starts().join();
await wait(700);
if (starts().join() !== frozen) return "the ticks did not stop";
key(plot, "Escape"); await wait(60);
if (lc.querySelector(".ui-lvc-hover") || !read().startsWith("Open candle")) return "Escape";
if (plot.getAttribute("tabindex") !== "0" || !plot.getAttribute("aria-label").startsWith("ACME, 5-second candles:")) return "the chart is not named and focusable";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
