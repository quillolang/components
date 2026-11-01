// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#refinance-calc-demo-title").closest(".ui-refinance-calc");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent.trim();
const f = (n, id = "refinance-calc-demo") => $(`#${id}-${n}`);
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
// Worked by an independent model in Python's decimals.
if (s("current") !== "$1,688.02" || s("new") !== "$1,498.12" || s("saving") !== "$189.90") return `payments: ${s("current")} ${s("new")} ${s("saving")}`;
if (s("break_even") !== "Month 20" || s("covered") !== "The lower payment alone repays the costs in month 27.") return `break-even: ${s("break_even")} ${s("covered")}`;
if (s("interest_current") !== "$106,400.77" || s("interest_new") !== "$84,900.19") return `interest: ${s("interest_current")} ${s("interest_new")}`;
if (s("verdict") !== "Worth it: after 84 months you are $16,500.58 ahead.") return `verdict: ${s("verdict")}`;
if (c.querySelector(".ui-refinance-calc-verdict").className.indexOf("good") < 0) return "verdict class";
if (s("whole")) return `whole: ${s("whole")}`;
// A stay shorter than the break-even.
type(f("stay"), "18"); await tick();
if (s("verdict") !== "Not worth it: it breaks even in month 20, but you leave after 18, $320.24 behind.") return `short stay: ${s("verdict")}`;
if (c.querySelector(".ui-refinance-calc-verdict").className.indexOf("poor") < 0) return "poor class";
type(f("stay"), "84"); await tick();
// The same rate never catches up, and a higher one with no costs neither.
type(f("new-rate"), "6.5"); await tick();
if (s("verdict") !== "Not worth it: the new loan never catches up with the current one." || s("break_even") !== "Never" || s("saving") !== "$0.00") return `same rate: ${s("verdict")}`;
if (s("covered")) return "no saving, no month the costs are covered";
if (s("whole") !== "Kept to the end, the new loan costs $5,000.00 more in interest and costs than the current one.") return `whole: ${s("whole")}`;
type(f("new-rate"), "7"); type(f("costs"), ""); await tick();
if (s("break_even") !== "Never" || s("new") !== "$1,766.95") return `higher: ${s("new")}`;
if (c.querySelector("[data-key=saving]").previousElementSibling.textContent !== "More each month") return "more each month";
type(f("new-rate"), "6.5"); await tick();
if (s("verdict") !== "Not worth it: the two come out the same over your stay.") return `identical: ${s("verdict")}`;
type(f("new-rate"), "5.25"); type(f("costs"), "5000"); await tick();
// Bad input.
for (const [n, t, want] of [["balance", "abc", "balance must"], ["balance", "", "still owed"], ["balance", "0", "still owed"], ["rate", "101", "current rate"], ["months", "0", "months left"], ["months", "12.5", "months left"], ["months", "601", "months left"],
    ["months", "", "months left"], ["new-rate", "-1", "new rate"], ["new-months", "x", "new term"], ["costs", "12,50", "closing costs"], ["stay", "", "months you will stay"], ["stay", "2000", "months you will stay"]]) {
    const was = f(n).value;
    type(f(n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-refinance-calc-out")) return `${n} "${t}": ${alert()}`;
    if (f(n).getAttribute("aria-invalid") !== "true") return `${n} "${t}": aria-invalid`;
    type(f(n), was);
}
await tick();
// No interest at all: 1,200 over 12 months is 100 a month.
type(f("balance"), "1200"); type(f("rate"), "0"); type(f("months"), "12"); type(f("new-rate"), "0"); type(f("new-months"), "12"); type(f("costs"), ""); type(f("stay"), "12"); await tick();
if (s("current") !== "$100.00" || s("interest_current") !== "$0.00") return `no interest: ${s("current")}`;
// The extreme ends must stay within a decimal and quick.
const t0 = performance.now();
type(f("balance"), "100000000000"); type(f("rate"), "100"); type(f("months"), "600"); type(f("new-rate"), "100"); type(f("new-months"), "600"); type(f("stay"), "600"); await tick();
if (performance.now() - t0 > 600) return `too slow: ${performance.now() - t0}`;
await tick();
if (alert() || !s("current")) return `extreme: ${alert()}`;
// Costs rolled in and a longer term: the payment drops at once, the new loan is ahead only in month 37.
const d = $("#refinance-calc-demo-live-title").closest(".ui-refinance-calc");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("current", d) !== "€1,395.54" || s("new", d) !== "€1,103.17" || s("break_even", d) !== "Month 37") return `rolled: ${s("current", d)} ${s("new", d)} ${s("break_even", d)}`;
if (s("verdict", d) !== "Worth it: after 120 months you are €1,294.49 ahead." || s("covered", d)) return `rolled verdict: ${s("verdict", d)}`;
if (s("whole", d) !== "Kept to the end, the new loan costs €62,215.48 more in interest and costs than the current one.") return `long term: ${s("whole", d)}`;
type(f("stay", "refinance-calc-demo-live"), "6"); await tick();
if (s("verdict", d) !== "Not worth it: it breaks even in month 37, but you leave after 6, €3,236.63 behind.") return `rolled, short: ${s("verdict", d)}`;
if (note() !== "on_change: saves 292.37 a month, month 37, not worth it.") return `on_change: ${note()}`;
d.querySelector("input[name=second_rolled]").click(); await tick();
if (s("new", d) !== "€1,079.19" || !s("covered", d).includes("month ")) return `paid up front: ${s("new", d)}`;
