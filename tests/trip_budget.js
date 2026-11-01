const c = $("#trip-budget-demo-people").closest(".ui-tripb");
const out = (cls, box = c) => box.querySelector(`.ui-tripb-${cls} dd`)?.textContent;
const say = (box = c) => box.querySelector(".ui-tripb-say")?.textContent;
const sum = (n, box = c) => box.querySelectorAll(".ui-tripb-row")[n].querySelector(".ui-tripb-sum")?.textContent;
const kind = (k, box = c) => { const r = [...box.querySelectorAll(".ui-tripb-kinds tbody tr")].find((x) => x.children[0].textContent === k); return r && [...r.children].slice(1).map((x) => x.textContent).join(" "); };
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
// By hand: 1260.00 + 583.20 + 486.00 + 301.50 + 70.49 (55.50 × 1.27 = 70.485, half up) = 2701.19.
if (sum(0) !== "$420.00 × 3 people = $1,260.00") return `line 1: ${sum(0)}`;
if (sum(1) !== "€135.00 × 4 nights = €540.00 = $583.20") return `line 2: ${sum(1)}`;
if (sum(2) !== "€30.00 × 3 people × 5 days = €450.00 = $486.00") return `line 3: ${sum(2)}`;
if (sum(3) !== "¥15,000 × 3 people = ¥45,000 = $301.50") return `line 4: ${sum(3)}`;
if (sum(4) !== "£18.50 × 3 people = £55.50 = $70.49") return `line 5: ${sum(4)}`;
if (out("total") !== "$2,701.19") return `total: ${out("total")}`;
// 2701.19 / 3 is 900.3966...: 900.39 each and two cents over.
if (out("each") !== "2 at $900.40, 1 at $900.39") return `the split: ${out("each")}`;
if (out("left") !== "$298.81") return `left: ${out("left")}`;
// 298.81 / 5 = 59.762 and / 15 = 19.9206..., both rounded down.
if (out("daily") !== "$59.76" || out("daily-each") !== "$19.92") return `daily: ${out("daily")} ${out("daily-each")}`;
if (say() !== "$298.81 left of $3,000.00: $59.76 a day, or $19.92 a day each.") return say();
// Transport 1260 + 301.50 = 1561.50 against 1500.
if (kind("Transport") !== "$1,561.50 $1,500.00 $61.50" || kind("Food") !== "$486.00 $600.00 —" || kind("Stay") !== "$583.20 — —") return `kinds: ${kind("Transport")} / ${kind("Food")} / ${kind("Stay")}`;
if (!c.querySelector(".ui-tripb-is-over")?.textContent.startsWith("Transport")) return "the kind over its limit is not marked";
if (!c.querySelector(".ui-tripb-rates").textContent.includes("1 EUR = 1.08 USD") || !c.querySelector(".ui-tripb-rates").textContent.includes("As given on 1 November.")) return c.querySelector(".ui-tripb-rates").textContent;
// A person more: flights 1680, food 600 EUR = 648, rail 60000 JPY = 402, museum 74 GBP = 93.98. 3407.18, over 3000.
type($("#trip-budget-demo-people"), "4"); await wait(100);
if (out("total") !== "$3,407.18") return `four: ${out("total")}`;
if (out("past") !== "$407.18" || out("daily") || !say().startsWith("Over budget by $407.18: $3,407.18 against $3,000.00") || !c.querySelector(".ui-tripb-over")) return `over: ${out("past")} ${say()}`;
// 3407.18 / 4 = 851.795: two at 851.80 and two at 851.79 add up exactly.
if (out("each") !== "2 at $851.80, 2 at $851.79") return `four's split: ${out("each")}`;
type($("#trip-budget-demo-people"), "3"); await wait(100);
// Days: empty is nights + 1, and may be set.
if ($("#trip-budget-demo-days").placeholder !== "5") return "days' placeholder";
type($("#trip-budget-demo-days"), "6"); await wait(100);
// Food 540 EUR = 583.20, so 2798.39, 201.61 left, 33.60 a day (33.60166).
if (out("total") !== "$2,798.39" || out("left") !== "$201.61" || out("daily") !== "$33.60") return `days: ${out("total")} ${out("left")} ${out("daily")}`;
type($("#trip-budget-demo-days"), ""); await wait(100);
// Changing a line's basis and currency.
await pick($("#trip-budget-demo-basis-1"), "trip");
if (sum(1) !== "€135.00 = €135.00 = $145.80") return `by the trip: ${sum(1)}`;
await pick($("#trip-budget-demo-currency-1"), "USD");
if (sum(1) !== "$135.00 = $135.00") return `in dollars: ${sum(1)}`;
await pick($("#trip-budget-demo-basis-1"), "night"); await pick($("#trip-budget-demo-currency-1"), "EUR");
await pick($("#trip-budget-demo-basis-2"), "person_night");
if (sum(2) !== "€30.00 × 3 people × 4 nights = €360.00 = $388.80") return `per person per night: ${sum(2)}`;
await pick($("#trip-budget-demo-basis-2"), "day");
if (sum(2) !== "€30.00 × 5 days = €150.00 = $162.00") return `per day: ${sum(2)}`;
await pick($("#trip-budget-demo-basis-2"), "person_day");
// Zero-decimal currencies round to the yen first: 0.5 JPY half up is 1.
type($("#trip-budget-demo-amount-3"), "100.5"); await wait(100);
if (sum(3) !== "¥101 × 3 people = ¥302 = $2.02") return `yen: ${sum(3)}`;
type($("#trip-budget-demo-amount-3"), "15,000"); await wait(100);
// Bad input in a row names itself and leaves it out; the rest stands.
type($("#trip-budget-demo-amount-0"), "abc"); await wait(100);
if (c.querySelectorAll(".ui-tripb-row")[0].querySelector(".ui-tripb-bad")?.textContent !== "An amount is a number of 0 or more." || $("#trip-budget-demo-amount-0").getAttribute("aria-invalid") !== "true") return "bad text";
if (out("total") !== "$1,441.19" || !c.textContent.includes("1 line is not counted")) return `without flights: ${out("total")}`;
type($("#trip-budget-demo-amount-0"), "-5"); await wait(100);
if (out("total") !== "$1,441.19") return "a negative amount";
type($("#trip-budget-demo-amount-0"), "99999999999999999999"); await wait(100);
if (c.querySelectorAll(".ui-tripb-row")[0].querySelector(".ui-tripb-bad")?.textContent !== "That amount is too large to count.") return `huge: ${c.querySelectorAll(".ui-tripb-row")[0].querySelector(".ui-tripb-bad")?.textContent}`;
type($("#trip-budget-demo-amount-0"), ""); await wait(100);
if (c.querySelectorAll(".ui-tripb-row")[0].querySelector(".ui-tripb-bad") || out("total") !== "$1,441.19") return "an empty amount is no error";
type($("#trip-budget-demo-amount-0"), "420"); await wait(100);
// Trip fields.
for (const [f, v, msg] of [["people", "0", "People is"], ["people", "2.5", "People is"], ["nights", "-1", "Nights is"], ["days", "0", "Days is"], ["budget", "x", "The budget is"]]) {
    const el = $(`#trip-budget-demo-${f}`), was = el.value;
    type(el, v); await wait(80);
    if (!c.querySelector("p[role=alert]")?.textContent.startsWith(msg) || el.getAttribute("aria-invalid") !== "true" || c.querySelector(".ui-tripb-out")) return `${f} of ${v}: ${c.querySelector("p[role=alert]")?.textContent}`;
    type(el, was); await wait(80);
}
type($("#trip-budget-demo-nights"), "0"); await wait(100);
// No nights: the hotel is nothing, and a day trip is one day.
if (sum(1) !== "€135.00 × 0 nights = €0.00 = $0.00" || sum(2) !== "€30.00 × 3 people × 1 day = €90.00 = $97.20") return `no nights: ${sum(1)} / ${sum(2)}`;
type($("#trip-budget-demo-nights"), "4"); await wait(100);
type($("#trip-budget-demo-budget"), ""); await wait(100);
if (say() !== "Total $2,701.19." || out("left") || out("daily")) return `no budget: ${say()}`;
type($("#trip-budget-demo-budget"), "2,701.19"); await wait(100);
if (out("left") !== "$0.00" || out("past")) return `exactly on budget: ${out("left")}`;
type($("#trip-budget-demo-budget"), "3000"); await wait(100);
// Adding takes focus; removing gives it to the button.
c.querySelector(".ui-tripb-add").click(); await wait(150);
if (document.activeElement !== $("#trip-budget-demo-label-5")) return "a new row does not take focus";
type($("#trip-budget-demo-label-5"), "Snacks"); type($("#trip-budget-demo-amount-5"), "20.05"); await wait(100);
await pick($("#trip-budget-demo-category-5"), "Food");
if (out("total") !== "$2,721.24" || kind("Food") !== "$506.05 $600.00 —") return `a new row: ${out("total")} ${kind("Food")}`;
c.querySelector('[aria-label="Remove Snacks"]').click(); await wait(120);
if (out("total") !== "$2,701.19" || document.activeElement !== c.querySelector(".ui-tripb-add")) return "removing";
for (const b of c.querySelectorAll(".ui-tripb-remove")) b.click();
await wait(150);
if (out("total") !== "$0.00" || out("each") !== "$0.00 each") return `no rows: ${out("total")} ${out("each")}`;
// Rates that cannot be used, a cost with none, one person, and the callback.
const w = $("#trip-budget-demo-weekend-people").closest(".ui-tripb");
const alerts = [...w.querySelectorAll(".ui-tripb-error")].map((p) => p.textContent).join(" / ");
if (!alerts.includes("The rate for XYZ is not usable: that is not a currency.") || !alerts.includes("The rate for GBP is not usable: a rate is a number above 0.") || !alerts.includes("1 line is not counted")) return `rates: ${alerts}`;
if (w.querySelectorAll(".ui-tripb-row")[1].querySelector(".ui-tripb-bad")?.textContent !== "No rate for THB, so this is not in the total.") return "a cost with no rate";
if ($("#trip-budget-demo-weekend-currency-1").value !== "THB") return `the select keeps THB: ${$("#trip-budget-demo-weekend-currency-1").value}`;
// Two nights at 50 is exactly the budget of 100.
if (out("total", w) !== "€100.00" || out("left", w) !== "€0.00" || out("daily", w) !== "€0.00" || out("each", w) !== "€100.00 each" || w.querySelector(".ui-tripb-daily-each")) return `the weekend: ${out("total", w)} ${out("each", w)}`;
await pick($("#trip-budget-demo-weekend-currency-1"), "USD");
// 300 USD × 0.92 = 276.
if (out("total", w) !== "€376.00" || out("past", w) !== "€276.00") return `with a rate given as text: ${out("total", w)}`;
if (w.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: the total is 376.00.") return w.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#trip-budget-demo-weekend-people").name !== "weekend_people" || $("#trip-budget-demo-weekend-amount-0").name !== "weekend_amount_0") return "name prefix";
