// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#budget-planner-demo-title").closest(".ui-budget-planner");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent;
const rule = (x = c) => [...x.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((d) => d.textContent).join(" ")).join("|");
const left = (x = c) => [...x.querySelectorAll("[data-left]")].map((d) => d.textContent.trim()).join(" ");
const warn = (x = c) => [...x.querySelectorAll(".ui-budget-planner-warn li")].map((l) => l.textContent).join("|");
const btn = (t, x = c) => [...x.querySelectorAll("button")].find((b) => b.textContent === t);
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
if (s("left") !== "$1,100.00" || s("assigned") !== "$3,900.00" || s("spent") !== "$3,550.00") return `start: ${s("left")} ${s("assigned")} ${s("spent")}`;
if (rule() !== "Needs $2,400.00 48.0% 50% On track|Wants $700.00 14.0% 30% On track|Savings $800.00 16.0% 20% $200.00 short") return `rule: ${rule()}`;
if (left() !== "$0.00 -$40.00 $180.00 -$40.00 $250.00 $0.00") return `left: ${left()}`;
if (warn() !== "Groceries is overspent by $40.00.Cover from Fun|Dining is overspent by $40.00.Cover from Fun") return `advice: ${warn()}`;
// Needs running over: 2,900 of 5,000 is 58.0%, 400 over 2,500.
const a = (i) => c.querySelectorAll("input[name=budget_assigned]")[i];
type(a(0), "2000"); await tick();
if (!rule().startsWith("Needs $2,900.00 58.0% 50% $400.00 over")) return `over: ${rule()}`;
type(a(0), "6000"); await tick();
if (s("left") !== "-$3,400.00" || !warn().startsWith("Assigned $3,400.00 more than the income.")) return `over-assigned: ${s("left")} ${warn()}`;
type(a(0), "1500"); await tick();
// One click covers an overspend; the total assigned does not move.
btn("Cover from Fun").click(); await tick();
if (left() !== "$0.00 $0.00 $180.00 -$40.00 $210.00 $0.00") return `covered: ${left()}`;
if (s("assigned") !== "$3,900.00") return `the total moved: ${s("assigned")}`;
if (a(1).value !== "640.00" || a(4).value !== "360.00") return `the fields: ${a(1).value} ${a(4).value}`;
if (!c.querySelector("[role=status]").textContent.startsWith("Moved $40.00 from Fun to Groceries. Assigned in all stays $3,900.00")) return c.querySelector("[role=status]").textContent;
// The form: cents survive, and only what is left can leave.
const from = $("#budget-planner-demo-from"), to = $("#budget-planner-demo-to");
const pick = (el, t) => { el.value = [...el.options].find((o) => o.textContent === t).value; el.dispatchEvent(new Event("change", { bubbles: true })); };
pick(from, "Transport"); pick(to, "Savings"); await tick();
type($("#budget-planner-demo-amount"), "180.01"); await tick();
btn("Move").click(); await tick();
if (!alert().includes("Transport has only $180.00 left to move")) return `too much: ${alert()}`;
type($("#budget-planner-demo-amount"), "0.07"); await tick();
key($("#budget-planner-demo-amount"), "Enter"); await tick();
if (a(2).value !== "299.93" || a(5).value !== "800.07" || s("assigned") !== "$3,900.00") return `cents: ${a(2).value} ${a(5).value} ${s("assigned")}`;
pick(to, "Transport"); await tick();
type($("#budget-planner-demo-amount"), "1"); btn("Move").click(); await tick();
if (!alert().includes("two different envelopes")) return `same envelope: ${alert()}`;
pick(to, "Savings"); type($("#budget-planner-demo-amount"), ""); btn("Move").click(); await tick();
if (!alert().includes("above 0")) return `nothing to move: ${alert()}`;
type($("#budget-planner-demo-amount"), "lots"); btn("Move").click(); await tick();
if (!alert().includes("amount to move must be a number")) return `bad amount: ${alert()}`;
type($("#budget-planner-demo-amount"), ""); await tick();
// Bad input in the fields names the envelope; no income hides the check.
for (const t of ["abc", "-1", "12,50", "1e4"]) {
    type(c.querySelectorAll("input[name=budget_spent]")[1], t); await tick();
    if (!alert().includes("spent from Groceries") || c.querySelector(".ui-budget-planner-out")) return `${t}: ${alert()}`;
}
type(c.querySelectorAll("input[name=budget_spent]")[1], "640"); await tick();
type($("#budget-planner-demo-income"), "x"); await tick();
if (!alert().includes("income must be")) return `bad income: ${alert()}`;
type($("#budget-planner-demo-income"), ""); await tick();
if (!c.querySelector(".ui-budget-planner-note")?.textContent.includes("50/30/20")) return "no income";
if (c.querySelector(".ui-budget-planner-rule")) return "the check without income";
type($("#budget-planner-demo-income"), "5000"); await tick();
// No envelope can cover it.
const sp = (i) => c.querySelectorAll("input[name=budget_spent]")[i];
type(sp(0), "9000"); await tick();
if (!warn().includes("Rent is overspent by $7,500.00. No envelope has enough left to cover it.")) return `nobody can: ${warn()}`;
if ([...c.querySelectorAll(".ui-budget-planner-warn li")].find((l) => l.textContent.startsWith("Rent")).querySelector("button")) return "a button for what cannot be covered";
type(sp(0), "1500"); await tick();
// Kinds change the check, a new envelope counts.
const kind = c.querySelectorAll("select[name=budget_kind]")[4];
kind.value = "savings"; kind.dispatchEvent(new Event("change", { bubbles: true }));
await tick();
if (!rule().includes("Savings $1,160.07 23.2% 20% On track")) return `kind: ${rule()}`;
btn("Add an envelope").click(); await tick();
if (c.querySelectorAll("input[name=budget_envelope]").length !== 7) return "add";
[...c.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove this envelope").click(); await tick();
// The second: a rule of 60/25/15 and on_change.
const d = $("#budget-planner-demo-live-title").closest(".ui-budget-planner");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("left", d) !== "€600.00") return `live: ${s("left", d)}`;
if (rule(d) !== "Needs €1,200.00 60.0% 60% On track|Wants €0.00 0.0% 25% On track|Savings €200.00 10.0% 15% €100.00 short") return `60/25/15: ${rule(d)}`;
if (!d.querySelector("caption").textContent.includes("60/25/15")) return d.querySelector("caption").textContent;
type($("#budget-planner-demo-live-income"), "2,500.50"); await tick();
if (note() !== "on_change: 1100.50 left to assign of 2500.50, 2 envelopes.") return `on_change: ${note()}`;
