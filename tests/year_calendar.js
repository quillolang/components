const cal = $("#year-calendar-demo");
if (!cal || cal.tagName !== "SECTION" || cal.getAttribute("aria-label") !== "2026") return "the year is not a section named by its year";
const months = [...cal.querySelectorAll("table.ui-year-calendar-month")];
if (months.length !== 12 || months[0].querySelector("caption").textContent !== "January" || months[11].querySelector("caption").textContent !== "December") return "expected twelve months as tables with captions";
const counts = months.map((m) => m.querySelectorAll("[data-day]").length);
if (counts.join() !== "31,28,31,30,31,30,31,31,30,31,30,31") return `month lengths: ${counts}`;
if ([...months[0].querySelectorAll("th")].map((t) => t.getAttribute("abbr")).join() !== "Mo,Tu,We,Th,Fr,Sa,Su") return "the week does not start on Monday";
// 1 January 2026 is a Thursday: three empty cells before it.
const firstRow = [...months[0].querySelector("tbody tr").children];
if (firstRow.slice(0, 3).some((td) => td.children.length) || firstRow[3].textContent !== "1") return "1 January 2026 is not in the Thursday column";
const day = (d) => cal.querySelector(`[data-day="${d}"]`);
if (!day("2026-12-25").classList.contains("ui-year-calendar-danger") || day("2026-12-25").getAttribute("aria-label") !== "25 December, Christmas") return `Christmas: ${day("2026-12-25").getAttribute("aria-label")}`;
const leave = [...cal.querySelectorAll(".ui-year-calendar-day.ui-year-calendar-success")];
if (leave.length !== 12 || leave[0].dataset.day !== "2026-08-03" || leave.at(-1).dataset.day !== "2026-08-14") return `a run of days marked ${leave.length} days`;
if (!day("2026-10-28").classList.contains("ui-year-calendar-today") || day("2026-10-28").getAttribute("aria-label") !== "28 October, today") return "today is not ringed and named";
if (day("2026-05-05").tagName !== "A" || day("2026-05-05").getAttribute("href") !== "#year_calendar-2026-05-05") return "href does not link each day";
if (!day("2026-10-31").classList.contains("ui-year-calendar-weekend") || day("2026-10-30").classList.contains("ui-year-calendar-weekend")) return "weekends are not muted";
if (day("2026-11-20").getAttribute("title") !== "Release") return "a mark's label is not in the title";
const keyText = [...cal.querySelectorAll(".ui-year-calendar-legend li")].map((l) => l.textContent);
if (keyText.join() !== "Public holiday,Leave,Travel,Deadline") return `the key reads ${keyText}`;
const sun = $("#year-calendar-demo-sunday .ui-year-calendar");
if (sun.getAttribute("aria-label") !== "2027, weeks from Sunday" || sun.querySelector("th").getAttribute("abbr") !== "Su") return "week_start={7} or label is not applied";
// 1 January 2027 is a Friday: five empty cells before it when weeks start on Sunday.
const r = [...sun.querySelector("tbody tr").children];
if (r[5].textContent !== "1" || r.slice(0, 5).some((td) => td.children.length)) return "1 January 2027 is not in the Friday column";
if (sun.querySelector("a") || sun.querySelector(".ui-year-calendar-legend")) return "without href or legend, links or a key show";
