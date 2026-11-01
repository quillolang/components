const dd = (root, cls) => root.querySelector(`.ui-proration-${cls} dd`)?.textContent.replace(/\s+/g, "");
const c = $("#proration-calc-demo-from").closest(".ui-proration");
const f = (n) => $(`#proration-calc-demo-${n}`);
const next = () => c.querySelector(".ui-proration-next")?.textContent.trim();
const alert = () => c.querySelector("[role=alert]")?.textContent;
const how = (cls) => c.querySelector(`.ui-proration-${cls} .ui-proration-how`)?.textContent;
// 10 Jan to 10 Feb is 31 days; the 23rd leaves 18. 30 x 18/31 = 17.4193..., 50 x 18/31 = 29.0322...
if (dd(c, "credit") !== "−minus$17.42" || dd(c, "charge") !== "$29.03" || dd(c, "total") !== "$11.61") return `start: ${dd(c, "credit")} ${dd(c, "charge")} ${dd(c, "total")}`;
if (how("credit") !== "18 of 31 days left, Jan 10, 2026 to Feb 10, 2026") return `the days: ${how("credit")}`;
if (next() !== "Next bill on Feb 10, 2026: $50.00.") return `next: ${next()}`;
if (!c.querySelector(".ui-proration-skipped").textContent.includes("Broken has no price it can read.")) return "a bad plan is not reported";
if (c.querySelectorAll("#proration-calc-demo-from option").length !== 6) return "the bad plan should be left out";
if (f("from").name !== "from" || f("change").name !== "change" || !f("anchor").labels[0]) return "fields";
// The first day of a period: the whole of both.
type(f("change"), "2026-01-10"); await wait();
if (dd(c, "credit") !== "−minus$30.00" || dd(c, "charge") !== "$50.00" || dd(c, "total") !== "$20.00") return `first day: ${dd(c, "credit")}`;
// The renewal itself belongs to the next period: 10 Feb to 10 Mar is 28 days.
type(f("change"), "2026-02-10"); await wait();
if (how("credit") !== "28 of 28 days left, Feb 10, 2026 to Mar 10, 2026") return `renewal day: ${how("credit")}`;
type(f("change"), "2026-03-09"); await wait();
// One day of 28: 30/28 = 1.0714..., 50/28 = 1.7857...
if (dd(c, "credit") !== "−minus$1.07" || dd(c, "charge") !== "$1.79" || dd(c, "total") !== "$0.72") return `last day: ${dd(c, "credit")} ${dd(c, "total")}`;
// A leap February, in a period of 29 days.
type(f("anchor"), "2024-02-10"); type(f("change"), "2024-03-09"); await wait();
if (how("credit") !== "1 of 29 days left, Feb 10, 2024 to Mar 10, 2024") return `leap: ${how("credit")}`;
// Begun on the 31st: renews on 29 Feb, then on 31 March, not on the 29th.
type(f("anchor"), "2024-01-31"); type(f("change"), "2024-03-01"); await wait();
if (how("credit") !== "30 of 31 days left, Feb 29, 2024 to Mar 31, 2024") return `month ends: ${how("credit")}`;
type(f("change"), "2024-03-31"); await wait();
if (how("credit") !== "30 of 30 days left, Mar 31, 2024 to Apr 30, 2024") return `month ends 2: ${how("credit")}`;
// Half a cent exactly, rounded up: 1.35 x 1/30 = 0.045 (a division first gives 0.0449...).
type(f("anchor"), "2026-04-01"); type(f("change"), "2026-04-30"); await wait();
f("from").value = "small"; f("from").dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (how("credit") !== "1 of 30 days left, Apr 1, 2026 to May 1, 2026" || dd(c, "credit") !== "−minus$0.05") return `half a cent: ${dd(c, "credit")}`;
// Annual to annual: a year holding 29 February has 366 days. 300 x 183/366 = 150.
f("from").value = "yearly"; f("from").dispatchEvent(new Event("change", { bubbles: true }));
f("to").value = "max"; f("to").dispatchEvent(new Event("change", { bubbles: true }));
type(f("anchor"), "2023-03-01"); type(f("change"), "2023-08-31"); await wait();
if (how("credit") !== "183 of 366 days left, Mar 1, 2023 to Mar 1, 2024" || dd(c, "credit") !== "−minus$150.00" || dd(c, "charge") !== "$300.00") return `366 days: ${how("credit")} ${dd(c, "credit")}`;
type(f("anchor"), "2024-02-29"); type(f("change"), "2027-03-01"); await wait();
if (how("credit") !== "364 of 365 days left, Feb 28, 2027 to Feb 29, 2028".replace("364 of 365", "365 of 366")) return `anchored on the 29th: ${how("credit")}`;
// Monthly to annual: a period of its own from the day of the change.
f("from").value = "pro"; f("from").dispatchEvent(new Event("change", { bubbles: true }));
f("to").value = "yearly"; f("to").dispatchEvent(new Event("change", { bubbles: true }));
type(f("anchor"), "2026-01-10"); type(f("change"), "2026-01-25"); await wait();
// 16 of 31 days left: 30 x 16/31 = 15.4838...
if (dd(c, "credit") !== "−minus$15.48" || dd(c, "charge") !== "$300.00" || dd(c, "total") !== "$284.52" || how("charge") !== "A full period from the change") return `to annual: ${dd(c, "total")} ${how("charge")}`;
if (next() !== "Next bill on Jan 25, 2027: $300.00.") return `to annual, next: ${next()}`;
// Annual to monthly: the credit lasts many bills. 300 x 365/365 = 300 from the first day, less 30.
f("from").value = "yearly"; f("from").dispatchEvent(new Event("change", { bubbles: true }));
f("to").value = "pro"; f("to").dispatchEvent(new Event("change", { bubbles: true }));
type(f("anchor"), "2026-01-10"); type(f("change"), "2026-01-10"); await wait();
if (dd(c, "total") !== "$270.00" || !c.querySelector(".ui-proration-total dt").textContent.startsWith("Credit kept")) return `credit kept: ${dd(c, "total")}`;
if (next() !== "Next bill on Feb 10, 2026: $0.00. The credit covers 9 bills in full, with $240.00 left after the next one.") return `the credit's bills: ${next()}`;
// Bad input.
type(f("change"), "2025-12-31"); await wait();
if (alert() !== "The change comes before the subscription began." || c.querySelector(".ui-proration-out")) return `before: ${alert()}`;
type(f("change"), ""); await wait();
if (alert() !== "Give the day of the change.") return `no day: ${alert()}`;
type(f("change"), "2026-01-10"); type(f("anchor"), ""); await wait();
if (alert() !== "Give the day the subscription began.") return `no start: ${alert()}`;
type(f("anchor"), "2026-01-10"); await wait();
f("to").value = "yearly"; f("to").dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (next() !== "That is the plan already on: nothing changes." || c.querySelector(".ui-proration-out")) return `same plan: ${next()}`;
// A downgrade refunded, in a leap February, and on_change.
const l = $("#proration-calc-demo-live-from").closest(".ui-proration");
// 10 Feb to 10 Mar 2024: 29 days, 19 left. 50 x 19/29 = 32.7586..., 10 x 19/29 = 6.5517...
if (dd(l, "credit") !== "−minus$32.76" || dd(l, "charge") !== "$6.55" || dd(l, "total") !== "$26.21" || !l.querySelector(".ui-proration-total dt").textContent.startsWith("Refund")) return `refund: ${dd(l, "total")}`;
if ($("#proration-calc-demo-live-from").name !== "sub_from") return "name does not prefix the fields";
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
type($("#proration-calc-demo-live-change"), "2024-02-21"); await wait();
// 18 left: 50 x 18/29 = 31.0344..., 10 x 18/29 = 6.2068...: 6.21 - 31.03 = -24.82.
if (seen() !== "on_change: net -24.82, 18 of 29 days left.") return `on_change: ${seen()}`;
// At renewal: nothing now.
const w = $("#proration-calc-demo-wait-from").closest(".ui-proration");
if (w.querySelector(".ui-proration-next").textContent.trim() !== "Basic starts when this period ends: nothing to pay until Feb 10, 2026, then $10.00.") return `renewal: ${w.querySelector(".ui-proration-next").textContent}`;
f("to").focus();
if (document.activeElement !== f("to")) return "a field cannot take the focus";
