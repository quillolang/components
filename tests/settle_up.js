// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#settle-up-demo-title").closest(".ui-settle-up");
const bal = (s = c) => [...s.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((x) => x.textContent).join(" ")).join("|");
const plan = (s = c) => [...s.querySelectorAll(".ui-settle-up-plan li")].map((l) => l.textContent).join("|");
const head = (s = c) => s.querySelectorAll(".ui-settle-up-out h4")[1]?.textContent;
if (bal() !== "Ana $300.00 $100.00 +$200.00|Ben $100.00 $100.00 $0.00|Cy $20.00 $110.00 -$90.00|Dee $0.00 $110.00 -$110.00") return `balances: ${bal()}`;
if (plan() !== "Dee pays Ana $110.00|Cy pays Ana $90.00" || head() !== "2 transfers settle everyone") return `plan: ${plan()} ${head()}`;
// Odd cents: 100.00 + 100.01 + 20.00 of shares that do not divide.
const amt = (i) => c.querySelectorAll("input[name=settle_amount]")[i];
type(amt(1), "100.01"); await tick();
if (!bal().includes("Ana $300.00 $100.01 +$199.99") || !bal().includes("Ben $100.01 $100.00 +$0.01")) return `an odd cent: ${bal()}`;
const cents = [...c.querySelectorAll("tbody td:last-child")].map((x) => Math.round(Number(x.textContent.replace(/[$,+]/g, "")) * 100)).reduce((a, b) => a + b, 0);
if (cents !== 0) return `balances sum to ${cents}`;
if (plan() !== "Dee pays Ana $110.00|Cy pays Ana $89.99|Cy pays Ben $0.01") return `plan with a cent: ${plan()}`;
type(amt(1), "100.00"); await tick();
// A bad amount, and an expense nobody shares.
const alert = () => c.querySelector("[role=alert]")?.textContent ?? "";
for (const t of ["abc", "-4", "1e9", "12,50", "９９"]) {
    type(amt(0), t); await tick();
    if (!alert().includes("amount of Hotel") || c.querySelector(".ui-settle-up-out")) return `${t}: ${alert()}`;
}
type(amt(0), "300"); await tick();
const taxi = c.querySelectorAll(".ui-settle-up-who")[2].querySelectorAll("input");
taxi[2].click(); taxi[3].click(); await tick();
if (!alert().includes("Nobody shares Taxi")) return `nobody shares: ${alert()}`;
taxi[2].click(); await tick();
if (!bal().includes("Cy $20.00 $120.00 -$100.00") || !bal().includes("Dee $0.00 $100.00 -$100.00")) return `one sharer: ${bal()}`;
// Changing who paid, by the select.
const payer = c.querySelectorAll("select[name=settle_paid_by]")[1];
payer.value = [...payer.options].find((o) => o.textContent === "Dee").value; payer.dispatchEvent(new Event("change", { bubbles: true })); await tick();
if (!bal().includes("Ben $0.00 $100.00 -$100.00") || !bal().includes("Dee $100.00 $100.00 $0.00")) return `new payer: ${bal()}`;
// A person who paid cannot be removed, one who only shared can.
const btn = (l) => [...c.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent) === l);
btn("Remove Ana").click(); await tick();
if (!c.querySelector("[role=status]")?.textContent.includes("Ana paid for Hotel") || c.querySelectorAll("input[name=settle_person]").length !== 4) return "removing a payer";
payer.value = [...payer.options].find((o) => o.textContent === "Ben").value; payer.dispatchEvent(new Event("change", { bubbles: true })); await tick();
btn("Add a person").click(); await tick();
if (c.querySelectorAll("input[name=settle_person]").length !== 5) return "add a person";
const fifth = c.querySelectorAll("input[name=settle_person]")[4];
type(fifth, "Fay"); await tick();
if (!bal().includes("Fay $0.00 $90.00 -$90.00")) return `a new person shares what everyone shares: ${bal()}`;
btn("Remove Fay").click(); await tick();
btn("Add an expense").click(); await tick();
const last = c.querySelectorAll("input[name=settle_what]").length;
if (last !== 4) return `add an expense: ${last}`;
// Nothing owed.
for (let i = 0; i < 4; i++) type(amt(i), "");
await tick();
if (head() !== "Everyone is settled" || plan() !== "") return `settled: ${head()}`;
// The fewest: +8 +7 -5 -3 -7 takes 3 transfers because 7 cancels 7; largest-first takes 4.
const d = $("#settle-up-demo-few-title").closest(".ui-settle-up");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (head(d) !== "3 transfers settle everyone") return `fewest: ${head(d)} ${plan(d)}`;
const pairs = plan(d).split("|").map((l) => l.split(" $")[0]);
if (new Set(pairs).size !== 3) return `someone pays twice: ${plan(d)}`;
if (![...plan(d).split("|")].sort().join("|").includes("Eli pays Ben $7.00")) return `seven to seven: ${plan(d)}`;
const pay = plan(d).split("|").map((l) => l.split(" pays ")[0]), get = plan(d).split("|").map((l) => l.split(" pays ")[1].split(" ")[0]);
if (pay.some((p) => get.includes(p))) return `someone both pays and receives: ${plan(d)}`;
// With Dee sharing the tickets nothing cancels any more: five balances, four transfers. The callback.
d.querySelectorAll(".ui-settle-up-who")[2].querySelectorAll("input")[3].click(); await tick();
if (head(d) !== "4 transfers settle everyone") return `no longer cancels: ${head(d)} ${plan(d)}`;
if (!note().startsWith("on_change: 4 transfers, the first")) return `on_change: ${note()}`;
// Up to 14 open balances are searched exactly and stay quick; past that it says so.
const add = [...d.querySelectorAll("button")].find((b) => b.textContent === "Add a person");
for (let i = 0; i < 9; i++) { add.click(); await tick(); }
await tick();
if (head(d) !== "13 transfers settle everyone" || d.querySelector(".ui-settle-up-note")) return `14 open: ${head(d)}`;
const t0 = performance.now();
type(d.querySelectorAll("input[name=few_amount]")[0], "5.37"); await tick();
const took = performance.now() - t0;
if (took > 400) return `the exact search took ${took} ms`;
add.click(); await tick();
add.click(); await tick();
if (!d.querySelector(".ui-settle-up-note")?.textContent.includes("may not be the shortest")) return "past 14 open balances it should say so";
if (plan(d).split("|").length !== 15) return `16 open: ${plan(d).split("|").length}`;
