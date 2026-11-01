const c = $("#habit-tracker-demo-title").closest(".ui-habit-tracker");
const cards = () => [...c.querySelectorAll(".ui-habit-tracker-card")];
const fig = (i) => { const k = cards()[i]; return ["current", "longest", "rate"].map((n) => k.querySelector(`.ui-habit-tracker-${n}`).textContent).join(" | "); };
const notes = (i) => [...cards()[i].querySelectorAll(".ui-habit-tracker-note")].map((n) => n.textContent);
const cell = (r, d) => c.querySelector(`tbody tr:nth-child(${r + 1}) [data-date="${d}"]`);
const mark = (r, d) => [...cell(r, d).classList].find((k) => k !== "ui-habit-tracker-cell").replace("ui-habit-tracker-", "");
// Read: 26 Oct to 10 Nov is 16 days due, today pending, 13 done: runs of 3, 5 and 5.
if (fig(0) !== "Current 5 days | Longest 5 days | 81% of 16 due") return `Read: ${fig(0)}`;
if (mark(0, "2026-10-29") !== "missed" || mark(0, "2026-11-11") !== "pending" || mark(0, "2026-10-25") !== "before") return "Read's marks";
if (notes(0)[0] !== "Broken on Wed 4 Nov, 2 times in all.") return `Read's breaks: ${notes(0)}`;
if (notes(0)[1] !== "Streaks: 26 Oct to 28 Oct (3), 30 Oct to 3 Nov (5), 6 Nov to 10 Nov (5)") return `Read's streaks: ${notes(0)[1]}`;
// Run, Mon, Wed, Fri: 7 due before today; Wed 4 Nov missed ends the run of 4; rest days do not; Sat 7 Nov is an extra.
if (fig(1) !== "Current 2 days | Longest 4 days | 86% of 7 due") return `Run: ${fig(1)}`;
if (mark(1, "2026-10-27") !== "off" || mark(1, "2026-11-07") !== "extra" || mark(1, "2026-11-04") !== "missed") return "Run's marks";
if (!notes(1).includes("1 extra on rest day, not in the streak.")) return `Run's extra: ${notes(1)}`;
// Ticking Wed 4 Nov joins the two runs; the extra stays out of it.
cell(1, "2026-11-04").click(); await wait();
if (fig(1) !== "Current 7 days | Longest 7 days | 100% of 7 due") return `joined: ${fig(1)}`;
cell(1, "2026-11-04").click(); await wait();
// Today done counts at once, and pending never breaks.
cell(1, "2026-11-11").click(); await wait();
if (fig(1) !== "Current 3 days | Longest 4 days | 88% of 8 due") return `today done: ${fig(1)}`;
if (!c.querySelector(".ui-habit-tracker-said[aria-live]").textContent.includes("Run, Wed 11 Nov done. Current streak 3 days.")) return "the tick is not announced";
cell(1, "2026-11-11").click(); await wait();
// Stretch, Tue and Thu, 1 grace: 3 Nov missed is forgiven and adds nothing: 4 in a row of 5 due.
if (fig(2) !== "Current 4 days | Longest 4 days | 80% of 5 due") return `Stretch: ${fig(2)}`;
if (mark(2, "2026-11-03") !== "grace") return `a forgiven day: ${mark(2, "2026-11-03")}`;
// Clearing Tue 10 Nov: the last scheduled day is missed, the streak lives on grace.
cell(2, "2026-11-10").click(); await wait();
if (fig(2) !== "Current 3 days | Longest 3 days | 60% of 5 due") return `on grace: ${fig(2)}`;
if (mark(2, "2026-11-10") !== "grace" || !notes(2)[0].startsWith("On grace:")) return `on grace mark: ${mark(2, "2026-11-10")} ${notes(2)}`;
// Clearing Thu 5 Nov too: 3, 5 and 10 Nov in a row is past the grace, so the streak ended after 29 Oct.
cell(2, "2026-11-05").click(); await wait();
if (fig(2) !== "Current 0 days | Longest 2 days | 40% of 5 due") return `broken: ${fig(2)}`;
if (mark(2, "2026-11-03") !== "missed" || notes(2)[0] !== "Broken on Tue 3 Nov.") return `a forgiven miss taken back: ${mark(2, "2026-11-03")} ${notes(2)}`;
cell(2, "2026-11-05").click(); cell(2, "2026-11-10").click(); await wait();
// Before the start: a tick on Thu 22 Oct moves the start back to it, one more due and one more done.
cell(2, "2026-10-22").click(); await wait();
if (fig(2) !== "Current 5 days | Longest 5 days | 83% of 6 due") return `before the start: ${fig(2)}`;
cell(2, "2026-10-22").click(); await wait();
// Keyboard: one tab stop, on the last cell; arrows move it.
const first = c.querySelector('.ui-habit-tracker-cell[tabindex="0"]');
if (c.querySelectorAll('.ui-habit-tracker-cell[tabindex="0"]').length !== 1 || first.dataset.date !== "2026-11-11") return "not one tab stop";
first.focus(); key(first, "ArrowLeft"); await wait(60);
if (document.activeElement.dataset.date !== "2026-11-10") return `ArrowLeft: ${document.activeElement.dataset.date}`;
key(document.activeElement, "ArrowDown"); await wait(60);
if (document.activeElement.dataset.cell !== "1-19") return `ArrowDown: ${document.activeElement.dataset.cell}`;
key(document.activeElement, "Home"); await wait(60);
if (document.activeElement.dataset.cell !== "1-0" || c.querySelector('.ui-habit-tracker-cell[tabindex="0"]') !== document.activeElement) return "Home, and the tab stop follows";
if (!cell(0, "2026-11-10").getAttribute("aria-label").includes("Read, Tue 10 Nov, done")) return "a cell's name";
if (JSON.parse(c.querySelector("input[name=habits]").value)[0].done.length !== 13) return "the form's field";
// on_change, and a habit that is only on two days.
const l = $("#habit-tracker-demo-live-title").closest(".ui-habit-tracker");
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
l.querySelector('[data-date="2026-11-07"]').click(); await wait();
if (note() !== "on_change: 2 ticked.") return `on_change: ${note()}`;
if (l.querySelector(".ui-habit-tracker-current").textContent !== "Current 2 days") return "Wed and Sat in a row";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
