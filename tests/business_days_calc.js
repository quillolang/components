const c = $("#business-days-calc-demo-start").closest(".ui-business-days");
const out = (r = c) => r.querySelector(".ui-business-days-answer")?.textContent;
const sum = (r = c) => r.querySelector(".ui-business-days-sum")?.textContent;
const skipped = (r = c) => [...r.querySelectorAll(".ui-business-days-skipped li")].map((l) => l.textContent.trim());
const err = (r = c) => r.querySelector("[role=alert]")?.textContent;
const start = $("#business-days-calc-demo-start"), end = () => $("#business-days-calc-demo-end");
// 3 Mar to 3 Apr 2026 is 32 days, over both the US and the EU clock changes: 8 weekend days and 2 holidays.
if (out() !== "22 working days") return `between: ${out()}`;
if (sum() !== "32 calendar days, skipping 8 weekend days and 2 holidays.") return `sum: ${sum()}`;
const s = skipped();
if (s.length !== 10 || s[0] !== "Sat 7 Mar 2026: weekend" || !s.includes("Tue 17 Mar 2026: St Patrick's Day") || s[9] !== "Fri 3 Apr 2026: Good Friday") return `skipped: ${s}`;
if (start.name !== "start" || c.querySelector("textarea").name !== "holidays") return "field names";
// The first day counted.
$("#business-days-calc-demo-first").click(); await wait();
if (out() !== "23 working days") return `count first: ${out()}`;
$("#business-days-calc-demo-first").click(); await wait();
// Back in time: from 3 Apr to 2 Mar. Good Friday is where it starts and is not walked to.
type(start, "2026-04-03"); type(end(), "2026-03-02"); await wait();
if (out() !== "-23 working days") return `backward: ${out()}`;
// Over the spring clock change alone: Fri 6 to Mon 9 Mar 2026 is one working day.
type(start, "2026-03-06"); type(end(), "2026-03-09"); await wait();
if (out() !== "1 working day") return `across the clock change: ${out()}`;
// Same day, and no dates.
type(end(), "2026-03-06"); await wait();
if (out() !== "0 working days") return `same day: ${out()}`;
type(end(), ""); await wait();
if (err() !== "Choose the second date.") return `no end: ${err()}`;
type(end(), "2026-03-09"); await wait();
// Weekend sets: Sunday only makes Saturday work.
const box = (n, r = c) => r.querySelector(`input[name$=weekend][value="${n}"]`);
box(6).click(); await wait();
if (out() !== "2 working days") return `Sunday alone: ${out()}`;
for (const n of [1, 2, 3, 4, 5, 6]) box(n).click();
await wait();
if (!/no working days/.test(err() ?? "")) return `every day a weekend: ${err()}`;
for (const n of [1, 2, 3, 4, 5]) box(n).click();
await wait();
if (out() !== "1 working day") return `back to Sat and Sun: ${out()} ${err()}`;
// Holidays as data: yearly, on a weekend, bad lines.
const hol = c.querySelector("textarea");
type(hol, "03-09 Yearly day\n2026-03-07 On a Saturday\n2026-02-30 Nope\nfoo"); await wait();
if (out() !== "0 working days") return `yearly holiday: ${out()}`;
if (sum() !== "3 calendar days, skipping 2 weekend days and 1 holiday.") return `a holiday on a weekend counts once: ${sum()}`;
if (!skipped().includes("Sat 7 Mar 2026: On a Saturday")) return `weekend holiday named: ${skipped()}`;
const list = c.querySelector("ul.ui-business-days-error")?.textContent ?? "";
if (!list.includes('Holiday 3: "2026-02-30" is not a date') || !list.includes('Holiday 4: "foo"') || hol.getAttribute("aria-invalid") !== "true") return `bad holiday lines: ${list}`;
type(hol, "   "); await wait();
if (c.querySelector("ul.ui-business-days-error") || out() !== "1 working day") return "blank holidays";
// A limit, said plainly; 100 years stays quick.
type(start, "1200-01-01"); await wait();
if (!/days apart, and the limit is 36,600/.test(err() ?? "")) return `too far: ${err()}`;
type(start, "2026-01-01"); type(end(), "2126-01-01");
const t0 = performance.now(); await wait(50);
if (out() !== "26,088 working days") return `a century: ${out()} ${err()}`;
if (performance.now() - t0 > 1500) return "a century took too long";
if (c.querySelectorAll(".ui-business-days-skipped li").length !== 100) return "the list is not capped at 100";
// Plus working days, on the second calculator: Wed 30 Dec, Fri and Sat off, Thu 31 Dec and Fri 1 Jan holidays.
const a = $("#business-days-calc-demo-add-start").closest(".ui-business-days");
if (out(a) !== "Tue 5 Jan 2027") return `add: ${out(a)}`;
if (sum(a) !== "6 calendar days, skipping 2 weekend days and 1 holiday.") return `add sum: ${sum(a)}`;
if (skipped(a).join("|") !== "Thu 31 Dec 2026: New Year's Eve|Fri 1 Jan 2027: New Year's Day|Sat 2 Jan 2027: weekend") return `add skipped: ${skipped(a)}`;
const n = $("#business-days-calc-demo-add-count");
const note = () => a.closest(".demo-stack").querySelector(".demo-note").textContent;
type(n, "-3"); await wait();
if (out(a) !== "Sun 27 Dec 2026") return `back 3: ${out(a)}`;
if (note() !== "on_change: the date is 2026-12-27.") return `on_change: ${note()}`;
type(n, "−1"); await wait();
if (out(a) !== "Tue 29 Dec 2026") return `typographic minus: ${out(a)}`;
type(n, "0"); await wait();
if (out(a) !== "Wed 30 Dec 2026") return `plus 0: ${out(a)}`;
type($("#business-days-calc-demo-add-start"), "2027-01-01"); await wait();
if (out(a) !== "Fri 1 Jan 2027" || !sum(a).includes("is not itself a working day")) return `plus 0 on a day off: ${sum(a)}`;
type(n, "1"); await wait();
if (out(a) !== "Sun 3 Jan 2027") return `from a day off: ${out(a)}`;
for (const bad of ["abc", "1.5", "", " "]) {
    type(n, bad); await wait(60);
    if (!/is not a whole number/.test(err(a) ?? "") || n.getAttribute("aria-invalid") !== "true") return `bad count ${JSON.stringify(bad)}: ${err(a)}`;
}
type(n, "99999999999"); await wait(60);
if (!/more than 10,000 working days/.test(err(a) ?? "")) return `huge count: ${err(a)}`;
if (n.name !== "promise_count") return "name does not prefix the fields";
