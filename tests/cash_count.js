// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#cash-count-demo-title").closest(".ui-cash-count");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent.trim().replace(/\s+/g, " ");
const f = (n, id = "cash-count-demo") => $(`#${id}-${n}`);
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
const chg = (x = c) => { const e = x.querySelector("[data-key=change]"); return e ? `${e.textContent.split(":")[0]}: ${[...e.querySelectorAll("li")].map((l) => l.textContent).join(", ")}` : null; };
const line = (i, x = c) => x.querySelectorAll("[data-line]")[i].textContent;
// By hand: 50 + 60 + 50 + 20 + 20 + 3.00 + 1.00 + 0.40 + 0.30.
if (s("total") !== "$204.70") return `total: ${s("total")}`;
if (line(2) !== "$60.00" || line(6) !== "$3.00" || line(9) !== "$0.30") return `lines: ${line(2)} ${line(6)} ${line(9)}`;
if (s("status") !== "Short by $0.30") return `short: ${s("status")}`;
if (!c.querySelector(".ui-cash-count-short")) return "short class";
if (chg() !== "Change of $0.30 in 2 pieces: 1 × $0.25, 1 × $0.05") return `change: ${chg()}`;
if (f("count-25").labels[0].textContent !== "Count of $0.25" || f("count-25").name !== "cash_25") return "label or name of a count";
// Over and balanced.
type(f("count-1"), "60"); await tick();
if (s("total") !== "$205.00" || s("status") !== "Balanced") return `balanced: ${s("total")} ${s("status")}`;
type(f("count-5"), "11"); await tick();
if (s("status") !== "Over by $0.15") return `over: ${s("status")}`;
type(f("count-5"), "8"); type(f("count-1"), "30"); await tick();
// No expected amount, no verdict; an expected of 0 does give one.
type(f("expected"), ""); await tick();
if (s("status")) return "no expected";
type(f("expected"), "0"); await tick();
if (s("status") !== "Over by $204.70") return `expected 0: ${s("status")}`;
type(f("expected"), "205"); await tick();
// The arrow keys, and a count cannot go below 0.
const dime = f("count-10");
key(dime, "ArrowUp"); await tick();
if (dime.value !== "11" || s("total") !== "$204.80") return `up: ${dime.value} ${s("total")}`;
key(dime, "ArrowDown"); await tick();
const hundred = f("count-10000");
key(hundred, "ArrowDown"); await tick();
if (hundred.value !== "0") return `below 0: ${hundred.value}`;
// Fewest pieces, big and small: 87.65 is 50 + 20 + 10 + 5 + 1 + 1 + 0.25 x 2 + 0.10 + 0.05 from this stock.
type(f("change"), "87.66"); await tick();
if (chg() !== "Change of $87.66 in 11 pieces: 1 × $50.00, 1 × $20.00, 1 × $10.00, 1 × $5.00, 2 × $1.00, 2 × $0.25, 1 × $0.10, 1 × $0.05, 1 × $0.01") return `change 87.66: ${chg()}`;
// Stock runs out: only one 50.00.
type(f("change"), "100"); await tick();
if (chg() !== "Change of $100.00 in 4 pieces: 1 × $50.00, 2 × $20.00, 1 × $10.00") return `stock: ${chg()}`;
// Cannot: more than the drawer holds, and no pennies for a cent.
type(f("change"), "500"); await tick();
if (s("cannot") !== "Cannot make $500.00: the drawer holds only $204.70.") return `too much: ${s("cannot")}`;
type(f("change"), "204.70"); await tick();
if (!chg().startsWith("Change of $204.70 in 93 pieces")) return `everything: ${chg()}`;
type(f("count-1"), "0"); type(f("change"), "1.03"); await tick();
if (s("cannot") !== "Cannot make $1.03: what is in the drawer only comes in steps of $0.05.") return `steps: ${s("cannot")}`;
type(f("count-1"), "30"); type(f("change"), ""); await tick();
if (chg() || s("cannot")) return "no change asked";
// Bad input.
for (const [n, t, want] of [["count-500", "abc", "count of $5.00"], ["count-500", "-1", "count of $5.00"], ["count-500", "1.5", "count of $5.00"], ["count-500", "2000000", "count of $5.00"], ["count-500", "٣", "count of $5.00"],
    ["expected", "lots", "expected amount"], ["expected", "12,50", "expected amount"], ["change", "-3", "change to make"], ["change", "1e4", "change to make"]]) {
    const was = f(n).value;
    type(f(n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-cash-count-out") || f(n).getAttribute("aria-invalid") !== "true") return `${n} ${t}: ${alert()}`;
    type(f(n), was);
}
await tick();
// An arrow on a bad count does nothing and throws nothing.
type(dime, "x"); key(dime, "ArrowUp"); await tick();
if (dime.value !== "x") return `arrow on bad text: ${dime.value}`;
type(dime, ""); await tick();
if (s("total") !== "$203.70") return `an empty count is 0: ${s("total")}`;
// Where largest-first fails: 0.40 + ... has no 0.20 to go with it, so 0.30 x 2; with dimes it would take three pieces.
const d = $("#cash-count-demo-live-title").closest(".ui-cash-count");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
const g = (n) => f(n, "cash-count-demo-live");
if (s("total", d) !== "$1.30" || s("status", d) !== "Balanced") return `custom: ${s("total", d)}`;
if (chg(d) !== "Change of $0.60 in 2 pieces: 2 × $0.30") return `no greedy: ${chg(d)}`;
type(g("count-10"), "5"); await tick();
if (chg(d) !== "Change of $0.60 in 2 pieces: 2 × $0.30") return `fewest beats largest first: ${chg(d)}`;
if (note() !== "on_change: 1.80 is over, 1 kinds of piece.") return `on_change: ${note()}`;
type(g("count-30"), "1"); await tick();
if (chg(d) !== "Change of $0.60 in 3 pieces: 1 × $0.40, 2 × $0.10") return `stock changes the answer: ${chg(d)}`;
type(g("count-40"), "0"); type(g("count-30"), "1"); type(g("count-10"), "2"); type(g("change"), "0.60"); await tick();
if (s("cannot", d) !== "Cannot make $0.60: the drawer holds only $0.50.") return `not enough: ${s("cannot", d)}`;
type(g("count-40"), "1"); type(g("count-30"), "1"); type(g("count-10"), "0"); type(g("change"), "0.60"); await tick();
if (s("cannot", d) !== "Cannot make $0.60: no mix of what is in the drawer comes to it exactly.") return `no mix: ${s("cannot", d)}`;
if (note() !== "on_change: 0.70 is short, no change.") return `on_change, no change: ${note()}`;
// A drawer with no answer among a million pieces, then a hard search: both stay quick.
type(g("count-40"), "1000000"); type(g("count-30"), "1"); type(g("count-10"), "0");
const t1 = performance.now();
type(g("change"), "400000.20"); await tick();
if (performance.now() - t1 > 300) return `no answer took ${performance.now() - t1} ms`;
await tick();
if (s("cannot", d) !== "Cannot make $400,000.20: no mix of what is in the drawer comes to it exactly.") return `no answer: ${s("cannot", d)} ${chg(d)}`;
type(g("count-40"), "1000000"); type(g("count-30"), "1000000"); type(g("count-10"), "1000000");
const t0 = performance.now();
type(g("change"), "799999.90"); await tick();
if (performance.now() - t0 > 500) return `too slow: ${performance.now() - t0}`;
await tick();
if (!chg(d)?.startsWith("Change of $799,999.90 in 2999999 pieces")) return `a large amount: ${chg(d) ?? s("cannot", d)}`;
// Against a table worked out separately: random small stocks, the same fewest pieces or the same refusal.
const coins = [10000, 5000, 2000, 1000, 500, 100, 25, 10, 5, 1];
const fewest = (amount, stock) => {
    let best = new Array(amount + 1).fill(Infinity); best[0] = 0;
    coins.forEach((v, i) => { for (let n = 0; n < stock[i]; n++) for (let a = amount; a >= v; a--) best[a] = Math.min(best[a], best[a - v] + 1); });
    return best[amount];
};
let seed = 12345;
const rnd = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return Math.floor(seed / 2147483648 * n); };
for (let round = 0; round < 25; round++) {
    const stock = coins.map(() => rnd(4));
    const amount = 1 + rnd(1500);
    coins.forEach((v, i) => type(f(`count-${v}`), String(stock[i])));
    type(f("change"), (amount / 100).toFixed(2)); await tick();
    const want = fewest(amount, stock);
    const text = chg();
    if (want === Infinity) { if (text) return `round ${round}: ${amount} from ${stock} cannot be made, but ${text}`; }
    else if (!text || Number(text.match(/in (\d+) piece/)[1]) !== want) return `round ${round}: ${amount} from ${stock} takes ${want}, not ${text}`;
}
