// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#debt-payoff-demo-title").closest(".ui-debt-payoff");
const plans = (x = c) => [...x.querySelectorAll(".ui-debt-payoff-compare tbody tr")].map((r) => [...r.cells].map((d) => d.textContent).join(" ; ")).join("|");
const verdict = (x = c) => x.querySelector("[data-verdict]")?.textContent;
const warn = (x = c) => [...x.querySelectorAll(".ui-debt-payoff-warn li")].map((l) => l.textContent).join("|");
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
const month = (i, x = c) => [...x.querySelectorAll(".ui-debt-payoff-months tbody tr")[i].cells].map((d) => d.textContent).join(" ");
const months = (x = c) => x.querySelectorAll(".ui-debt-payoff-months tbody tr").length;
const cell = (i, n, x = c, p = "debt") => x.querySelectorAll(`input[name=${p}_${n}]`)[i];
// Worked by an independent simulation in Python's decimals.
if (plans() !== "Avalanche ; 19 months ; $928.53 ; Card (month 16), Store (month 17), Car (month 19)|Snowball ; 19 months ; $1,213.52 ; Store (month 4), Car (month 10), Card (month 19)") return `plans: ${plans()}`;
if (verdict() !== "The avalanche saves $284.99 over the snowball.") return `verdict: ${verdict()}`;
if (month(0) !== "1 $455.00 $98.87 $7,043.87 ") return `month 1: ${month(0)}`;
if (months() !== 19) return `rows: ${months()}`;
if (month(15).split(" ").slice(4).join(" ") !== "Card") return `cleared in month 16: ${month(15)}`;
// The table follows the plan, and what is paid is the balances plus the interest.
c.querySelector("input[value=snowball]").click(); await tick();
if (month(3).split(" ").slice(4).join(" ") !== "Store") return `snowball table: ${month(3)}`;
const cents = (t) => Math.round(Number(t.replace(/[^0-9.-]/g, "")) * 100);
const paid = [...c.querySelectorAll(".ui-debt-payoff-months tbody tr")].reduce((a, r) => a + cents(r.cells[1].textContent), 0);
if (paid !== 861352) return `paid: ${paid}`;
c.querySelector("input[value=avalanche]").click(); await tick();
// Without the extra: 39 months both ways, 2,491.27 and 2,500.36.
type($("#debt-payoff-demo-extra"), ""); await tick();
if (!plans().includes("39 months ; $2,491.27") || !plans().includes("39 months ; $2,500.36")) return `no extra: ${plans()}`;
if (verdict() !== "The avalanche saves $9.09 over the snowball.") return `no extra verdict: ${verdict()}`;
// Long plans show 24 months until asked, by a real button.
const more = () => [...c.querySelectorAll(".ui-debt-payoff-out button")][0];
if (months() !== 24 || more().textContent.trim() !== "Show all 39 months") return `the first 24: ${months()}`;
more().click(); await tick();
if (months() !== 39 || more().getAttribute("aria-expanded") !== "true") return `all months: ${months()}`;
more().click(); await tick();
type($("#debt-payoff-demo-extra"), "200"); await tick();
// Bad input names the debt.
for (const [n, t, want] of [["balance", "abc", "balance of Card"], ["balance", "-5", "balance of Card"], ["rate", "2000", "rate of Card"], ["rate", "x%", "rate of Card"], ["minimum", "12,50", "minimum of Card"], ["balance", "1e12", "balance of Card"]]) {
    const was = cell(0, n).value;
    type(cell(0, n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-debt-payoff-out") || cell(0, n).getAttribute("aria-invalid") !== "true") return `${n} ${t}: ${alert()}`;
    type(cell(0, n), was);
}
await tick();
type($("#debt-payoff-demo-extra"), "many"); await tick();
if (!alert().includes("extra payment")) return `extra: ${alert()}`;
type($("#debt-payoff-demo-extra"), "200"); await tick();
// A debt of nothing is left out, and no debts at all shows no answer.
for (let i = 0; i < 3; i++) type(cell(i, "balance"), "");
await tick();
if (c.querySelector(".ui-debt-payoff-out") || alert()) return "nothing owed";
type(cell(0, "balance"), "1000"); type(cell(0, "rate"), "0"); type(cell(0, "minimum"), "333.33"); type($("#debt-payoff-demo-extra"), ""); await tick();
if (plans() !== "Avalanche ; 4 months ; $0.00 ; Card (month 4)|Snowball ; 4 months ; $0.00 ; Card (month 4)") return `no interest, odd payment: ${plans()}`;
if (verdict() !== "Both plans cost the same.") return `same: ${verdict()}`;
if (month(3) !== "4 $0.01 $0.00 $0.00 Card") return `the last payment: ${month(3)}`;
// Add a debt, remove it.
[...c.querySelectorAll("button")].find((b) => b.textContent === "Add a debt").click(); await tick();
if (c.querySelectorAll("input[name=debt_name]").length !== 4) return "add";
[...c.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove this debt").click(); await tick();
if (c.querySelectorAll("input[name=debt_name]").length !== 3) return "remove";
// A minimum below the interest is flagged though the other debt's freed minimum clears it.
const d = $("#debt-payoff-demo-live-title").closest(".ui-debt-payoff");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (warn(d) !== "The minimum of €50.00 on Payday does not cover its €100.00 of interest a month: on its own it never clears.") return `warning: ${warn(d)}`;
if (plans(d) !== "Avalanche ; 28 months ; €2,672.65 ; Card (month 6), Payday (month 28)|Snowball ; 28 months ; €2,672.65 ; Card (month 6), Payday (month 28)") return `rollover: ${plans(d)}`;
if (!d.querySelector("input[value=snowball]").checked) return "plan prop";
// With an extra the two differ, and the callback gets it.
type($("#debt-payoff-demo-live-extra"), "100"); await tick();
if (plans(d) !== "Avalanche ; 9 months ; €642.31 ; Card (month 6), Payday (month 9)|Snowball ; 9 months ; €735.93 ; Card (month 3), Payday (month 9)") return `extra: ${plans(d)}`;
if (note() !== "on_change: avalanche 9 months, 642.31 interest, first Card.") return `on_change: ${note()}`;
// Payments below the interest never clear: no answer, a reason, and no hang.
type($("#debt-payoff-demo-live-extra"), ""); type(cell(1, "minimum", d, "loans"), "5"); await tick();
if (!plans(d).startsWith("Avalanche ; Never ; No end") || verdict(d) !== "Neither plan clears the debts.") return `never: ${plans(d)} ${verdict(d)}`;
if (!d.querySelector("[role=status]")?.textContent.includes("Interest is €108.33 a month now")) return `the reason: ${d.querySelector("[role=status]")?.textContent}`;
if (!warn(d).includes("€5.00 on Card")) return warn(d);
const t0 = performance.now();
type(cell(0, "rate", d, "loans"), "1000"); await tick();
type(cell(0, "rate", d, "loans"), "0.5"); type(cell(0, "minimum", d, "loans"), "0"); type(cell(1, "rate", d, "loans"), "0"); type(cell(1, "minimum", d, "loans"), "0"); await tick();
if (performance.now() - t0 > 800) return `too slow: ${performance.now() - t0}`;
await tick();
if (!plans(d).startsWith("Avalanche ; Never")) return `nothing paid: ${plans(d)}`;
