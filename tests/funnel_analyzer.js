const c = $("#funnel-analyzer-demo-count-0").closest(".ui-funnel-analyzer");
const cell = (i, k) => c.querySelector(`tr[data-step="${i}"] [data-k=${k}]`)?.textContent.trim();
const leak = () => c.querySelector(".ui-funnel-analyzer-leak")?.textContent.replace(/\s+/g, " ").trim();
const warn = () => c.querySelector(".ui-funnel-analyzer-warn")?.textContent.trim();
const err = () => [...c.querySelectorAll(".ui-funnel-analyzer-error")].map((e) => e.textContent).join(" | ");
const res = () => c.querySelector(".ui-funnel-analyzer-result")?.textContent.replace(/\s+/g, " ").trim();
const count = (i) => $(`#funnel-analyzer-demo-count-${i}`);
const rate = () => $("#funnel-analyzer-demo-rate"), at = () => $("#funnel-analyzer-demo-at");
// 10,000 > 6,000 > 1,800 > 900 > 630: kept 60, 30, 50, 70; lost 4,000, 4,200, 900, 270.
const rates = [1, 2, 3, 4].map((i) => cell(i, "rate")).join(" "), lost = [1, 2, 3, 4].map((i) => cell(i, "lost")).join(" ");
if (rates !== "60.0% 30.0% 50.0% 70.0%" || lost !== "4,000 4,200 900 270") return `rates: ${rates} / lost: ${lost}`;
if (cell(4, "overall") !== "6.3%" || cell(2, "overall") !== "18.0%") return `overall: ${cell(4, "overall")} ${cell(2, "overall")}`;
if (leak() !== "The biggest leak is Viewed a product to Added to cart: 4,200 people lost, 70.0% of those who got that far. 6.3% of Visited reach Paid.") return `leak: ${leak()}`;
if (!c.querySelector('tr[data-step="2"]').classList.contains("ui-funnel-analyzer-leaky")) return "the leak's row is not marked";
if (warn() != null) return "nothing grows here";
// The what-if starts on the leak.
if (at().selectedOptions[0].textContent !== "Viewed a product to Added to cart") return `what-if starts on: ${at().selectedOptions[0].textContent}`;
if (!at().labels[0] || rate().name !== "what_if_rate" || count(0).name !== "step_count") return "field names";
if (!c.textContent.includes("Rate instead of 30.0%")) return "says the rate today";
// 40% of 6,000 is 2,400, then 50% is 1,200, then 70% is 840: +210, +33.3%.
type(rate(), "40"); await wait();
if (res() !== "Paid: 840 instead of 630, +210 people (+33.3%).") return `what-if: ${res()}`;
if ([0, 1, 2, 3, 4].map((i) => cell(i, "whatif")).join(" ") !== "10,000 6,000 2,400 1,200 840") return "what-if column";
// Another step: checkout to paid at 80% of 900 is 720.
at().value = "4"; at().dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (res() !== "Paid: 720 instead of 630, +90 people (+14.3%)." && rate().value !== "40") return `at the end: ${res()}`;
type(rate(), "80"); await wait();
if (res() !== "Paid: 720 instead of 630, +90 people (+14.3%).") return `at the end: ${res()}`;
// A worse rate is a loss, 0 empties the end, 100 is allowed.
type(rate(), "35"); await wait();
if (res() !== "Paid: 315 instead of 630, -315 people (-50.0%).") return `worse: ${res()}`;
type(rate(), "0"); await wait();
if (res() !== "Paid: 0 instead of 630, -630 people (-100.0%).") return `zero: ${res()}`;
type(rate(), "100%"); await wait();
if (res() !== "Paid: 900 instead of 630, +270 people (+42.9%).") return `all: ${res()}`;
// A rate with no meaning.
for (const bad of ["101", "-5", "abc", "٥"]) {
    type(rate(), bad); await wait();
    if (err() !== "The rate must be a percentage from 0 to 100." || res() != null || rate().getAttribute("aria-invalid") !== "true") return `rate ${bad}: ${err()}`;
}
type(rate(), ""); await wait();
// A step that grows warns, and is not a leak.
type(count(3), "2,000"); await wait();
if (warn() !== "Checkout has more people than the step before. A funnel can only lose people: check the counts and the order of the steps.") return `grows: ${warn()}`;
if (cell(3, "rate") !== "111.1%" || cell(3, "lost") !== "-200") return `growth's figures: ${cell(3, "rate")} ${cell(3, "lost")}`;
type(count(3), "900"); await wait();
// Two steps tie for the leak.
type(count(1), "5900"); await wait();
if (!leak().startsWith("The biggest leaks tie: Viewed a product and Added to cart, each losing 4,100 people.")) return `tied: ${leak()}`;
type(count(0), "10000"); type(count(1), "6000"); type(count(2), "1800"); await wait();
// Nobody lost at all.
for (const i of [1, 2, 3, 4]) type(count(i), "10000");
await wait();
if (!leak().startsWith("Nobody is lost between these steps. 100.0% of Visited reach Paid.")) return `flat: ${leak()}`;
for (const [i, v] of [[1, "6000"], [2, "1800"], [3, "900"], [4, "630"]]) type(count(i), v);
await wait();
// A step nobody reaches: the rest cannot be carried through.
type(count(3), "0"); type(count(4), "0"); await wait();
at().value = "3"; at().dispatchEvent(new Event("change", { bubbles: true })); type(rate(), "50"); await wait();
if (!err().startsWith("Nobody reaches this step today") || cell(3, "rate") !== "0.0%" || cell(4, "rate") !== "None") return `dead step: ${err()} ${cell(4, "rate")}`;
type(rate(), ""); type(count(3), "900"); type(count(4), "630"); await wait();
// Bad counts name the step.
type(count(2), "abc"); await wait();
if (err() !== "Added to cart: the count must be a whole number of 0 or more." || count(2).getAttribute("aria-invalid") !== "true" || leak() != null) return `bad count: ${err()}`;
type(count(2), "-4"); type(count(3), "1.5"); await wait();
if (err() !== "Added to cart, Checkout: the counts must be a whole number of 0 or more.") return `two bad: ${err()}`;
type(count(2), "9999999999999"); type(count(3), "900"); await wait();
if (!err().startsWith("Added to cart:")) return `huge: ${err()}`;
type(count(2), "1800"); type(count(0), "0"); await wait();
if (err() !== "Visited has nobody in it, so there is nothing to follow.") return `first empty: ${err()}`;
type(count(0), "   "); await wait();
if (!err().startsWith("Visited: the count must")) return `blank: ${err()}`;
type(count(0), "999,999,999,999"); type(count(1), "999,999,999,999"); type(count(2), "999,999,999,998"); await wait();
at().value = "2"; at().dispatchEvent(new Event("change", { bubbles: true })); type(rate(), "99.5"); await wait();
if (res() == null) return `the largest counts: ${err()}`;
type(rate(), "");
for (const [i, v] of [[0, "10000"], [1, "6000"], [2, "1800"]]) type(count(i), v);
await wait();
// Add, name, remove; focus lands on Add.
const add = c.querySelector(".ui-funnel-analyzer-add");
add.click(); await wait();
if (c.querySelectorAll("tbody tr").length !== 6 || !err().startsWith("Step 6: the count must")) return `added: ${err()}`;
const newRow = c.querySelector('tr[data-step="5"]');
const inputs = newRow.querySelectorAll("input");
type(inputs[0], "Rébought 🎉"); type(inputs[1], "63"); await wait();
if (cell(5, "rate") !== "10.0%" || !leak().endsWith("0.6% of Visited reach Rébought 🎉.")) return `the new step: ${leak()}`;
newRow.querySelector("button").click(); await wait();
if (c.querySelectorAll("tbody tr").length !== 5 || document.activeElement !== add) return "removing keeps focus in the component";
if (count(4).value !== "630" || cell(4, "rate") !== "70.0%") return "rows left after removing";
// The callback and the prefix.
const live = $("#funnel-analyzer-demo-live-count-0").closest(".ui-funnel-analyzer");
const note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#funnel-analyzer-demo-live-count-0").name !== "signup_step_count") return "the prefix";
type($("#funnel-analyzer-demo-live-count-2"), "150"); await wait();
if (note() !== "on_change: 150 at the end, 18.8%, leak Started, what-if none.") return `on_change: ${note()}`;
type($("#funnel-analyzer-demo-live-rate"), "50"); await wait();
if (note() !== "on_change: 150 at the end, 18.8%, leak Started, what-if 200.") return `on_change's what-if: ${note()}`;
type($("#funnel-analyzer-demo-live-count-1"), "x"); await wait();
if (note() !== "on_change: a count is wrong.") return `on_change on bad input: ${note()}`;
