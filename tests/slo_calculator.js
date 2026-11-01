const c = $("#slo-calculator-demo-target").closest(".ui-slo-calc");
const dd = (cls) => c.querySelector(`[data-stat=${cls}] dd`)?.firstChild.textContent;
const small = (cls) => c.querySelector(`[data-stat=${cls}] dd small`)?.textContent;
const say = () => c.querySelector(".ui-slo-calc-say")?.textContent;
const alert = () => c.querySelector("[role=alert]")?.textContent;
const f = (n) => $(`#slo-calculator-demo-${n}`);
// 99.9% of 30 days: 0.001 x 43,200 min = 43.2 min, or 43 min 12 s.
if (dd("allowed") !== "43 min 12 s" || small("allowed") !== "in 30 days at 99.9%") return `allowed: ${dd("allowed")} / ${small("allowed")}`;
if (dd("week") !== "10 min 5 s" || dd("day") !== "1 min 26 s") return `week and day: ${dd("week")} ${dd("day")}`;
// 20 of 43.2 minutes spent: 46.296% used, 53.7% left, 23.2 minutes left.
if (dd("left") !== "53.7%" || small("left") !== "23 min 12 s of it") return `left: ${dd("left")} ${small("left")}`;
// 20 bad of 14,400 minutes is 0.1389%, 1.39 times the 0.1%.
if (dd("burn") !== "1.39" || small("burn") !== "0.1389% errors") return `burn: ${dd("burn")} ${small("burn")}`;
// 30 / 1.3889 = 21.6 days from the start, 11.6 from now: 11 days 14 h 24 min, 12 Nov.
if (say() !== "At this rate the budget runs out in 11 days 14 h 24 min, around 2026-11-12, before the window ends.") return say();
const rows = () => [...c.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((x) => x.textContent).join("|"));
const want = ["Page|2%|1 h|5 min|14.4|1.44%|2 days 2 h", "Page|5%|6 h|30 min|6|0.6%|5 days", "Ticket|10%|3 days|6 h|1|0.1%|30 days"];
if (rows().join("\n") !== want.join("\n")) return `rules: ${rows().join(" / ")}`;
if (f("target").name !== "target" || !f("target").labels[0].textContent.includes("Target")) return "the field's name and label";
if (!c.querySelector("[aria-live]")) return "not announced";
// Other targets, known answers: 99.95% of 30 days is 21.6 min; 99.99% of 28 days is 4.032 min.
type(f("target"), "99.95"); await wait();
if (dd("allowed") !== "21 min 36 s") return `99.95: ${dd("allowed")}`;
type(f("target"), "99.99"); type(f("window"), "28"); await wait();
if (dd("allowed") !== "4 min 2 s") return `99.99 of 28: ${dd("allowed")}`;
type(f("target"), "99"); type(f("window"), "30"); await wait();
if (dd("allowed") !== "7 h 12 min") return `99: ${dd("allowed")}`;
if (rows()[0] !== "Page|2%|1 h|5 min|14.4|14.4%|2 days 2 h") return `rule at 99: ${rows()[0]}`;
// At 90% a burn of 14.4 needs 144% errors: the rule cannot fire and says so.
type(f("target"), "90"); await wait();
if (rows()[0].split("|")[5] !== "144%" || !c.querySelector(".ui-slo-calc-problem").textContent.includes("over 100% errors")) return `impossible rule: ${rows()[0]}`;
type(f("elapsed"), "1"); type(f("bad"), "1"); type(f("target"), "99.999999"); type(f("window"), "1"); await wait();
if (dd("allowed") !== "under a second") return `a tiny budget: ${dd("allowed")}`;
// A window shorter than the ticket rule's 3 days.
type(f("target"), "99.9"); await wait();
if (!c.textContent.includes("Its long window is longer than the SLO window.")) return "a rule longer than the window";
type(f("window"), "30"); type(f("elapsed"), "10"); await wait();
// Overspent: 50 of 43.2 min.
type(f("bad"), "50"); await wait();
if (dd("left") !== "-15.7%" || say() !== "The budget is gone: overspent by 6 min 48 s.") return `overspent: ${dd("left")} ${say()}`;
if (!c.classList.contains("ui-slo-calc-gone")) return "overspent is not marked";
type(f("bad"), "5"); await wait();
if (say() !== "At this rate the budget lasts the window, with 65.3% of it to spare.") return `safe: ${say()}`;
type(f("bad"), ""); await wait();
if (say() !== "Nothing spent yet: the budget is whole." || dd("left") !== "100%") return `nothing spent: ${say()}`;
type(f("elapsed"), ""); await wait();
if (say() !== "Enter days elapsed to see the burn rate." || dd("burn") !== "—") return `no elapsed: ${say()}`;
type(f("elapsed"), "0"); await wait();
if (dd("burn") !== "—") return `no time gone: ${dd("burn")}`;
// Bad input says what is wrong, and where.
for (const [field, text, msg] of [["target", "100", "A target of 100% allows no failure at all, so there is no budget to work out."], ["target", "abc", "The target must be a number, such as 99.9."],
    ["target", "", "The target must be a number, such as 99.9."], ["target", "-1", "The target must be above 0%."], ["window", "0", "The window must be a number of days above 0."],
    ["window", "😀", "The window must be a number of days above 0."], ["window", "99999", "The window is limited to 3660 days, about ten years."],
    ["elapsed", "31", "Days elapsed cannot be more than the 30 day window."], ["bad", "-1", "Bad minutes must be a number of 0 or more."],
    ["target", "1e400", "The target must be a number, such as 99.9."], ["target", "9".repeat(400), "The target must be a number, such as 99.9."]]) {
    const was = f(field).value;
    type(f(field), text); await wait();
    if (alert() !== msg) return `${field} = ${text.slice(0, 20)}: ${alert()}`;
    if (text !== "" && f(field).getAttribute("aria-invalid") !== "true") return `${field} is not marked`;
    if (c.querySelector(".ui-slo-calc-out")) return "figures beside an error";
    type(f(field), was); await wait();
}
type(f("elapsed"), "1"); type(f("bad"), "1441"); await wait();
if (alert() !== "1441 bad minutes is more than the 1440 minutes elapsed.") return `more bad than elapsed: ${alert()}`;
// Events: 1,200 of 4,000,000 at 99.95% over 7 of 28 days. Rate 0.03%, burn 0.6; the
// window carries 16,000,000 events, so 8,000 may fail: 15% used, 6,800 left.
const l = $("#slo-calculator-demo-live-target").closest(".ui-slo-calc");
const ld = (cls) => l.querySelector(`[data-stat=${cls}] dd`)?.firstChild.textContent;
const ls = (cls) => l.querySelector(`[data-stat=${cls}] dd small`)?.textContent;
if (ld("burn") !== "0.6" || ls("burn") !== "0.03% errors" || ld("left") !== "85%" || ls("left") !== "6,800 of 8,000 events") return `events: ${ld("burn")} ${ls("burn")} ${ld("left")} ${ls("left")}`;
if (l.querySelector(".ui-slo-calc-say").textContent !== "At this rate the budget lasts the window, with 40% of it to spare.") return l.querySelector(".ui-slo-calc-say").textContent;
const total = $("#slo-calculator-demo-live-total");
if (total.name !== "checkout_total") return `name prefix: ${total.name}`;
type($("#slo-calculator-demo-live-bad"), "2000"); await wait();
const note = l.closest(".demo-stack").querySelector(".demo-note");
if (note.textContent !== "on_change: the burn rate is 1.00.") return `on_change: ${note.textContent}`;
type($("#slo-calculator-demo-live-bad"), "4000001"); await wait();
if (l.querySelector("[role=alert]")?.textContent !== "4000001 bad events is more than the 4000000 events in all.") return "more bad than all";
type($("#slo-calculator-demo-live-bad"), "0"); type(total, "0"); await wait();
if (ld("burn") !== "—") return `no events: ${ld("burn")}`;
l.querySelector("input[value=minutes]").click(); await wait();
if (!$("#slo-calculator-demo-live-bad").labels[0].textContent.includes("Bad minutes") || $("#slo-calculator-demo-live-total")) return "switching to minutes";
