const sec = (t) => [...$$(".ui-cohort-table")].find((s) => s.querySelector(".ui-cohort-table-title").textContent === t);
const c = sec("Weekly retention");
const cell = (row, p, s = c) => s.querySelector(`tr[data-cohort="${row}"] td[data-p="${p}"]`);
const line = (row, n, s = c) => [...Array(n).keys()].map((p) => cell(row, p, s).textContent.replace("Not ended", "")).join(" | ");
const size = (row, s = c) => s.querySelector(`tr[data-cohort="${row}"] [data-k=size]`).textContent;
const say = (s = c) => s.querySelector(".ui-cohort-table-say").textContent;
const radio = (v, s = c) => s.querySelector(`input[value=${v}]`);
// Today is Wednesday 4 Feb, in the week of 2 Feb. Worked out by hand in tests: 5 Jan holds a, b, c, d (d signs up on the Sunday).
if (!radio("week").checked || !radio("percent").checked || radio("week").name !== "weekly_period") return "the switches start on week and percent";
const heads = [...c.querySelectorAll("thead th")].map((t) => t.textContent).join(" | ");
if (heads !== "Cohort | People | Week 0 | Week 1 | Week 2 | Week 3") return `heads: ${heads}`;
const rows = [...c.querySelectorAll("tbody th")].map((t) => t.textContent).join(" | ");
if (rows !== "5 Jan 2026 | 12 Jan 2026 | 19 Jan 2026 | 26 Jan 2026 | 2 Feb 2026 | Weighted average") return `rows: ${rows}`;
if (size("2026-01-05") !== "4" || size("2026-01-12") !== "2" || size("2026-01-19") !== "1" || size("2026-01-26") !== "0" || size("2026-02-02") !== "1" || size("average") !== "8") return "sizes";
if (line("2026-01-05", 4) !== "100.0% | 75.0% | 25.0% | 25.0%") return `5 Jan: ${line("2026-01-05", 4)}`;
// A real 0 is written; a period not ended is blank.
if (line("2026-01-12", 4) !== "100.0% | 50.0% | 0.0% | ") return `12 Jan: ${line("2026-01-12", 4)}`;
if (line("2026-01-19", 4) !== "100.0% | 100.0% |  | ") return `19 Jan: ${line("2026-01-19", 4)}`;
if (line("2026-02-02", 4) !== " |  |  | ") return `2 Feb: ${line("2026-02-02", 4)}`;
if (!cell("2026-01-12", 3).classList.contains("ui-cohort-table-open") || cell("2026-01-12", 2).classList.contains("ui-cohort-table-open")) return "blank and zero look apart";
if (cell("2026-02-02", 0).querySelector(".ui-sr").textContent !== "Not ended") return "a blank cell says so to a screen reader";
// A cohort of nobody has an empty row, not divisions by 0.
if (cell("2026-01-26", 0).textContent !== "" || cell("2026-01-26", 0).classList.contains("ui-cohort-table-open")) return "the empty cohort";
// Weighted, not a mean of rows: week 1 is 5 of 7, week 2 is 1 of 6, week 3 is 1 of 4.
if (line("average", 4) !== "100.0% | 71.4% | 16.7% | 25.0%") return `average: ${line("average", 4)}`;
if (say() !== "8 users in 5 cohorts. 71.4% came back in week 1. Best 19 Jan 2026 at 100.0%, lowest 12 Jan 2026 at 50.0%.") return `say: ${say()}`;
// Heat follows the rate: half of it, so that text stays readable either way.
if (!cell("2026-01-05", 1).getAttribute("style").includes("var(--ui-accent) 38%") || !cell("2026-01-12", 2).getAttribute("style").includes("var(--ui-accent) 0%")) return `heat: ${cell("2026-01-05", 1).getAttribute("style")}`;
// What was left out: 4 unread; a's day before the signup; a's and h's after today... k signs up later.
const note = c.querySelector(".ui-cohort-table-note").textContent;
if (note !== "Left out: 4 events with no user or no readable date, 1 event before a signup, 1 event after today, 1 user signing up after today.") return `note: ${note}`;
// People.
radio("count").click(); await wait();
if (line("2026-01-05", 4) !== "4 | 3 | 1 | 1" || line("2026-01-12", 4) !== "2 | 1 | 0 | ") return `people: ${line("2026-01-05", 4)} / ${line("2026-01-12", 4)}`;
if (line("average", 4) !== "7 | 5 | 1 | 1" || !c.querySelector('tr[data-cohort="average"] th').textContent.startsWith("All cohorts")) return `people's row: ${line("average", 4)}`;
radio("percent").click(); await wait();
// By month: January's people, February not ended, so one column.
radio("month").click(); await wait();
if ([...c.querySelectorAll("thead th")].map((t) => t.textContent).join(" | ") !== "Cohort | People | Month 0") return "months' heads";
if ([...c.querySelectorAll("tbody th")][0].textContent !== "Jan 2026" || size("2026-01-01") !== "7" || size("2026-02-01") !== "1" || line("2026-01-01", 1) !== "100.0%") return `month: ${line("2026-01-01", 1)}`;
if (line("2026-02-01", 1) !== "") return "February is not over";
if (!say().endsWith("No month after signup has ended yet.")) return `month's say: ${say()}`;
radio("week").click(); await wait();
if (line("2026-01-05", 4) !== "100.0% | 75.0% | 25.0% | 25.0%") return "back to weeks";
// A later today, and the callback: month 1 is ended.
const live = sec("By month, in people");
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.querySelector("input[name=monthly_period]") == null || !radio("count", live).checked) return "the prefix, or the start in people";
// Jan: 7 in month 0 and a, h... a's 3 Feb is in month 1. Feb: h. Mar: k signed up 1 Mar, ended 0.
if (line("2026-01-01", 2, live) !== "7 | 1") return `months: ${line("2026-01-01", 2, live)}`;
if (line("2026-02-01", 2, live) !== "1 | " || line("2026-03-01", 2, live) !== " | ") return `young months: ${line("2026-02-01", 2, live)}`;
if (size("average", live) !== "9") return "k counts by then";
radio("percent", live).click(); await wait();
if (seen() !== "on_change: month, percent, 2 periods.") return `on_change: ${seen()}`;
radio("week", live).click(); await wait();
if (seen() !== "on_change: week, percent, 9 periods.") return `on_change weeks: ${seen()}`;
if (say(sec("Nothing yet")) !== "No signups to show yet." || sec("Nothing yet").querySelector("table")) return "no events";
if (sec("A bad day").querySelector(".ui-cohort-table-warn")?.textContent !== 'The date given as today cannot be read: "soon".' || sec("A bad day").querySelector("table")) return "a bad today";
