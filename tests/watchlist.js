const live = $("#watchlist-demo-live .ui-wlist"), sorted = $("#watchlist-demo-sorted .ui-wlist");
const num = (s) => Number(s.replace(/[^\d.-]/g, ""));
const rows = (w) => [...w.querySelectorAll("tbody tr")].map((r) => ({ sym: r.dataset.symbol, price: num(r.cells[1].textContent), chg: num(r.cells[2].textContent), pct: num(r.cells[3].textContent), r }));
const s = rows(sorted);
if (s.map((x) => x.sym).join() !== "STRK,ACME,INIT,HOOL,GLBX,UMBR") return `sort="percent" desc: ${s.map((x) => x.sym)}`;
if (sorted.querySelector("[aria-sort]").textContent.trim() !== "% Chg" || sorted.querySelector("[aria-sort]").getAttribute("aria-sort") !== "descending") return "aria-sort";
const acme = s.find((x) => x.sym === "ACME");
if (acme.chg !== 2.25 || acme.pct !== 1.25 || !acme.r.classList.contains("ui-wlist-up")) return `ACME: ${acme.chg} ${acme.pct}`;
if (!s.find((x) => x.sym === "HOOL").r.classList.contains("ui-wlist-flat") || !s.find((x) => x.sym === "UMBR").r.classList.contains("ui-wlist-down")) return "flat and down rows";
if (sorted.querySelector(".ui-wlist-spark") || sorted.querySelectorAll("thead th").length !== 4) return "no values should mean no trend column";
// Sorting: Symbol ascending, then again descending; Last largest first.
const head = (w, i) => w.querySelectorAll("thead th")[i].querySelector("button");
head(sorted, 0).click(); await wait();
if (rows(sorted).map((x) => x.sym).join() !== "ACME,GLBX,HOOL,INIT,STRK,UMBR") return "Symbol does not sort A to Z";
head(sorted, 0).click(); await wait();
if (rows(sorted)[0].sym !== "UMBR" || sorted.querySelectorAll("thead th")[0].getAttribute("aria-sort") !== "descending") return "a second click does not reverse";
head(sorted, 1).click(); await wait();
const prices = rows(sorted).map((x) => x.price);
if (prices.some((p, i) => i > 0 && p > prices[i - 1])) return `Last sorts ${prices}`;
// Picking a row, by click and by Enter; the callback reaches the note.
const note = () => $("#watchlist-demo-live .demo-note").textContent;
if (!note().startsWith("Picked ACME.") || live.querySelector("[aria-selected=true]").dataset.symbol !== "ACME") return "selected=\"ACME\"";
live.querySelector("tr[data-symbol=GLBX]").click(); await wait();
if (!note().startsWith("Picked GLBX.") || live.querySelector("[aria-selected=true]").dataset.symbol !== "GLBX") return `click: ${note()}`;
const init = live.querySelector("tr[data-symbol=INIT]");
init.focus(); key(init, "Enter"); await wait();
if (!note().startsWith("Picked INIT.")) return "Enter does not pick a row";
key(init, "ArrowDown"); await wait();
if (document.activeElement !== init.nextElementSibling) return "ArrowDown does not move to the next row";
// Live prices: a changed price flashes, and the change follows the price.
const before = rows(live).map((x) => x.price).join();
await wait(2500);
if (rows(live).map((x) => x.price).join() === before) return "prices did not move";
if (!live.querySelector(".ui-wlist-tick-up, .ui-wlist-tick-down")) return "a changed price did not flash";
for (const x of rows(live)) {
    const prev = { ACME: 180.15, GLBX: 49.02, INIT: 114.39, UMBR: 59.14, STRK: 119.85, HOOL: 88.1 }[x.sym];
    if (Math.abs(x.price - prev - x.chg) > 0.006) return `${x.sym}'s change is not price less previous close`;
}
if (live.querySelectorAll(".ui-wlist-spark").length !== 6) return "no sparkline per row";
$("#watchlist-demo-toggle").click();
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
