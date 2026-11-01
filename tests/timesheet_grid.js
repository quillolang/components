const c = $("#timesheet-grid-demo-title").closest(".ui-timesheet-grid");
const foot = (n) => [...c.querySelectorAll(`tfoot tr:nth-child(${n}) td`)].map((t) => t.textContent);
const sum = () => ["regular", "overtime", "total"].map((k) => c.querySelector(`.ui-timesheet-grid-${k}`).textContent).join(" ");
const cell = (r, d) => $(`#timesheet-grid-demo-${r}-${d}`);
const probs = () => [...c.querySelectorAll(".ui-timesheet-grid-problems li")].map((l) => l.textContent);
const notes = () => [...c.querySelectorAll(".ui-timesheet-grid-notes li")].map((l) => l.textContent);
// Mon 7:30, Tue 4 + 4:30 = 8:30, Wed 8:30, Thu 9, Fri 3:15 + 4:07 rounded 4:00 = 7:15. Breaks past 6 h: 30 min each.
if (foot(1).join() !== "7:30,8:30,8:30,9:00,7:15,0:00,0:00,40:45") return `entered: ${foot(1)}`;
if (foot(2).join() !== "−0:30,−0:30,−0:30,−0:30,−0:30,–,–,−2:30") return `breaks: ${foot(2)}`;
if (foot(3).join() !== "7:00,8:00,8:00,8:30,6:45,0:00,0:00,38:15") return `worked: ${foot(3)}`;
// Daily rule: Thu 8:30 is 0:30 over. Both: regular 37:45 is under 40.
if (sum() !== "37:45 0:30 38:15") return `figures: ${sum()}`;
if (c.querySelector(".ui-timesheet-grid-sum").textContent.indexOf("(38.25 h)") < 0) return "decimal hours";
if (!notes().includes("Support, Fri: 4:07 rounded to 4:00.")) return `rounding note: ${notes()}`;
if (c.querySelector("tbody tr:nth-child(2) .ui-timesheet-grid-row-total").textContent !== "17:30") return "row total";
if (cell(0, 0).name !== "hours_0_0" || cell(0, 0).getAttribute("aria-label") !== "Website, Mon") return "cell name and label";
// Every way of writing it.
for (const [text, want] of [["7.5", "7:30"], ["7,5", "7:30"], ["7:30", "7:30"], ["7h30", "7:30"], ["7h", "7:00"], [".5", "0:30"], ["45m", "0:45"], ["7.1", "7:00"], ["7.13", "7:15"], ["09:00-17:30", "8:30"], ["9-17", "8:00"], ["22:00-06:00", "8:00"], ["23:30–00:15", "0:45"]]) {
    type(cell(1, 5), text); await wait(40);
    const got = c.querySelector("tfoot tr:nth-child(1) td:nth-child(7)").textContent;
    if (got !== want) return `"${text}" read as ${got}, not ${want}`;
}
type(cell(1, 5), "22:00-06:00"); await wait(50);
if (!notes().includes("Support, Sat: 8:00 overnight, counted on the day it starts.")) return `overnight note: ${notes()}`;
// The break needs more than 6 hours: exactly 6 keeps it all.
type(cell(1, 5), "6"); await wait(50);
if (foot(2)[5] !== "–" || foot(3)[5] !== "6:00") return `six hours: ${foot(2)[5]} ${foot(3)[5]}`;
type(cell(1, 5), "6:15"); await wait(50);
if (foot(2)[5] !== "−0:30" || foot(3)[5] !== "5:45") return `past six: ${foot(3)[5]}`;
// The quarter's edges: 7 minutes down, 8 up.
type(cell(1, 5), "1:07"); await wait(50);
if (foot(1)[5] !== "1:00") return `1:07: ${foot(1)[5]}`;
type(cell(1, 5), "1:08"); await wait(50);
if (foot(1)[5] !== "1:15") return `1:08: ${foot(1)[5]}`;
// Weekly overtime on top of daily: Sat 7:15 is 6:45 net, 45:00 in all; 0:30 is over Thursday, and of the 44:30 left 4:30 is past 40.
type(cell(1, 5), "7:15"); await wait(50);
if (sum() !== "40:00 5:00 45:00") return `weekly on top: ${sum()}`;
type(cell(1, 5), ""); await wait(50);
// Bad cells: each named, the rest still add up.
for (const [text, want] of [["abc", "is not a time"], ["-3", "is below zero"], ["7:75", "more than 59 minutes"], ["25", "more than a day"], ["25:00-26:00", "a time that does not exist"], ["09:00-09:00", "the same time"], ["٣", "is not a time"], ["1e3", "is not a time"], ["9".repeat(200), "is not a time"]]) {
    type(cell(0, 6), text); await wait(40);
    if (!probs().some((p) => p.startsWith("Website, Sun:") && p.includes(want))) return `"${text.slice(0, 10)}": ${probs()}`;
    if (cell(0, 6).getAttribute("aria-invalid") !== "true") return `"${text.slice(0, 10)}" not marked`;
}
if (sum() !== "37:45 0:30 38:15") return `bad cell changed the sums: ${sum()}`;
type(cell(0, 6), ""); await wait(50);
if (c.querySelector(".ui-timesheet-grid-problems")) return "problem stays";
// A day of more than 24 hours across projects.
type(cell(0, 5), "14"); type(cell(1, 5), "12"); await wait(50);
if (!probs().join().includes("Sat adds up to 26:00, more than a day.")) return `26 h: ${probs()}`;
type(cell(0, 5), ""); type(cell(1, 5), ""); await wait(50);
// Up, Down and Enter.
cell(0, 2).focus(); key(cell(0, 2), "Enter"); await wait(40);
if (document.activeElement !== cell(1, 2)) return "Enter does not go down";
key(cell(1, 2), "ArrowUp"); await wait(40);
if (document.activeElement !== cell(0, 2)) return "ArrowUp";
key(cell(0, 2), "ArrowUp"); await wait(40);
if (document.activeElement !== cell(0, 2)) return "ArrowUp at the top moved";
// The weekly rule alone, week given by a Wednesday, and on_submit.
const l = $("#timesheet-grid-demo-live-title").closest(".ui-timesheet-grid");
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (l.querySelector("thead th:nth-child(2)").textContent !== "Mon 2") return "the week's Monday";
const li = (r, d) => $(`#timesheet-grid-demo-live-${r}-${d}`);
for (const d of [1, 2, 3, 4]) type(li(0, d), "9:30");
await wait(60);
// 7:30 and four days of 9:00 net is 43:30; daily rule off, 37:30 the limit.
const lsum = () => ["regular", "overtime", "total"].map((k) => l.querySelector(`.ui-timesheet-grid-${k}`).textContent).join(" ");
if (lsum() !== "37:30 6:00 43:30") return `weekly: ${lsum()}`;
type(li(0, 0), "zzz"); await wait(50);
const btn = l.querySelector(".ui-timesheet-grid-submit");
btn.click(); await wait();
if (note() !== "Submit to see on_submit." || !l.querySelector(".ui-timesheet-grid-said").textContent.startsWith("Not submitted: 1") || document.activeElement !== li(0, 0)) return `bad sheet sent: ${note()}`;
type(li(0, 0), "22:00-06:00"); await wait(50);
btn.click(); await wait();
if (note() !== "on_submit: week of 2026-11-02, 43.50 hours, 6.00 overtime.") return `on_submit: ${note()}`;
if (l.querySelector(".ui-timesheet-grid-said").textContent !== "Submitted 43:30 hours.") return "submit is not announced";
