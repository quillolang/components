const live = $("#order_book-demo-live .ui-obook"), still = $("#order_book-demo-still .ui-obook");
const num = (s) => Number(s.replace(/[^\d.-]/g, ""));
const side = (book, cls) => [...book.querySelectorAll(`.ui-obook-row.${cls}`)].map((r) => ({ price: num(r.querySelector("th").textContent.replace(/^(Ask|Bid) /, "")), size: num(r.cells[1].textContent), total: num(r.cells[2].textContent), row: r }));
let asks = side(live, "ui-obook-ask"), bids = side(live, "ui-obook-bid");
if (asks.length !== 8 || bids.length !== 8) return `depth={8} shows ${asks.length} asks and ${bids.length} bids`;
// Asks run down to the best (lowest) next to the middle, bids down from the best (highest).
if (asks.some((a, i) => i > 0 && a.price >= asks[i - 1].price) || bids.some((b, i) => i > 0 && b.price >= bids[i - 1].price)) return "the ladders are not in price order";
const fromMid = [...asks].reverse();
for (const [name, s] of [["asks", fromMid], ["bids", bids]])
    for (let i = 0; i < s.length; i++) if (s[i].total !== (i ? s[i - 1].total : 0) + s[i].size) return `${name}: the total is not the running sum from the middle`;
const mid = live.querySelector(".ui-obook-mid td");
if (mid.getAttribute("role") !== "status" || !mid.textContent.includes(`Spread $${(asks[7].price - bids[0].price).toFixed(2)}`)) return `the middle row: ${mid.textContent}`;
const deepest = [...asks, ...bids].reduce((a, b) => (b.total > a.total ? b : a));
if (deepest.row.style.getPropertyValue("--w") !== "100%") return "the deepest total's bar is not full";
if (!asks[0].row.querySelector(".ui-sr").textContent.startsWith("Ask")) return "screen readers are not told the side";
await wait(2200);
if (!live.querySelector(".ui-obook-grew, .ui-obook-shrank")) return "no level flashed as the book changed";
const flashed = live.querySelector(".ui-obook-grew, .ui-obook-shrank");
if (getComputedStyle(flashed.cells[1]).animationName === "none") return "a changed level has no flash";
// Group by 0.1: prices on the step, and the note the callback writes.
const btns = [...live.querySelectorAll(".ui-obook-steps button")];
if (btns.map((b) => b.textContent).join() !== "0.01,0.05,0.1" || btns[0].getAttribute("aria-pressed") !== "true") return "the steps";
btns[2].click(); await wait();
if (btns[2].getAttribute("aria-pressed") !== "true" || btns[0].getAttribute("aria-pressed") !== "false") return "the step picked is not pressed";
asks = side(live, "ui-obook-ask"); bids = side(live, "ui-obook-bid");
if ([...asks, ...bids].some((l) => Math.abs(l.price * 10 - Math.round(l.price * 10)) > 1e-6)) return `grouped prices are not on 0.1: ${asks.map((a) => a.price)}`;
if (!$("#order_book-demo-live .demo-note").textContent.startsWith("Grouped by $0.1;")) return "on_group did not reach the note";
$("#order_book-demo-toggle").click();
// The still book, grouped by 10: bids round down, asks up, sizes added.
still.querySelectorAll(".ui-obook-steps button")[2].click(); await wait();
const sb = side(still, "ui-obook-bid").map((l) => `${l.price}:${l.size}`), sa = side(still, "ui-obook-ask").map((l) => `${l.price}:${l.size}`);
if (sb.join() !== "61240:5.27,61230:2.9" || sa.join() !== "61270:1.5,61260:6.85") return `grouped by 10: bids ${sb}, asks ${sa}`;
if (still.querySelector(".ui-obook-grew, .ui-obook-shrank")) return "grouping made levels flash";
if (!still.querySelector(".ui-obook-mid").textContent.includes("Spread 20.0")) return `spread at 10: ${still.querySelector(".ui-obook-mid").textContent}`;
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
