// mobile
await wait(300);
const box = $("#reminder-demo");
const say = () => box.querySelector(".ui-reminder-say").textContent;
const next = () => box.querySelector(".ui-reminder-next").textContent;
const radio = (v) => box.querySelector(`input[value="${v}"]`);
const hint = (v) => radio(v).closest("label").querySelector(".ui-reminder-hint").textContent;
const set = box.querySelector(".ui-reminder-set");
const tapRow = async (v) => { await tap(radio(v).closest("label").querySelector(".ui-reminder-name")); await wait(40); };
const field = (s) => box.querySelector(`#reminder-demo-${s}`);
const pick = async (s, v) => { type(field(s), v); await wait(40); };
const dayBtn = (n) => box.querySelector(`.ui-reminder-day[aria-label="${n}"]`);
const stepUp = () => box.querySelector('[aria-label="More"]');
const stepDown = () => box.querySelector('[aria-label="Fewer"]');

// 2026-11-01 is a Sunday, 10:20.
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00.") return "start: " + say();
if (!radio("tomorrow").checked) return "tomorrow starts chosen";
if (hint("later") !== "12:00") return "later today: a full hour at least an hour off: " + hint("later");
if (hint("tomorrow") !== "Mon 2 Nov") return "tomorrow's hint: " + hint("tomorrow");
if (hint("week") !== "Mon 9 Nov") return "next week from a Sunday: " + hint("week");
if (field("date")) return "no day field until asked for";

await tapRow("later");
if (!radio("later").checked) return "a tap on the row should choose it";
if (say() !== "Reminds you today at 12:00.") return "later: " + say();
if (field("time").value !== "12:00") return "the time should show: " + field("time").value;
await tapRow("week");
if (say() !== "Reminds you on Monday 9 November at 9:00.") return "next week: " + say();
if ($("#reminder-last").textContent !== say()) return "on_change: " + $("#reminder-last").textContent;

// A time of one's own, kept across choices.
await pick("time", "17:30");
if (say() !== "Reminds you on Monday 9 November at 17:30.") return "time: " + say();
await tapRow("tomorrow");
if (say() !== "Reminds you tomorrow, Monday 2 November, at 17:30.") return "the time should keep: " + say();

// A day of one's own: nothing until one is picked; none in the past, today's time gone.
await tapRow("custom");
if (say() !== "Pick a day." || !set.disabled) return "custom, empty: " + say();
if ($("#reminder-last").textContent !== "cannot be set") return "on_change null";
await pick("date", "2027-01-15");
if (say() !== "Reminds you on Friday 15 January 2027 at 17:30.") return "custom: " + say();
if (hint("custom") !== "Fri 15 Jan") return "custom's hint: " + hint("custom");
await pick("date", "2026-11-01");
await pick("time", "10:20");
if (say() !== "That time has gone. Pick a later one." || !set.disabled) return "gone: " + say();
await pick("time", "10:21");
if (say() !== "Reminds you today at 10:21.") return "just ahead: " + say();
await pick("date", "2026-10-31");
if (say() !== "That time has gone. Pick a later one.") return "yesterday: " + say();
await pick("date", "2026-11-15");
await pick("time", "09:00");
await tapRow("tomorrow");

// Repeats.
await pick("unit", "day");
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every day.") return "daily: " + say();
if (next() !== "Next: Mon 2 Nov, Tue 3 Nov, Wed 4 Nov") return "daily next: " + next();
await tap(stepUp());
await tap(stepUp());
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every 3 days.") return "every 3 days: " + say();
if (next() !== "Next: Mon 2 Nov, Thu 5 Nov, Sun 8 Nov") return "every 3 days next: " + next();
await tap(stepDown());
await tap(stepDown());
if (!stepDown().disabled) return "never under 1";

await pick("unit", "weekdays");
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every weekday.") return "weekdays: " + say();
await tapRow("custom");
await pick("date", "2026-11-06");
if (next() !== "Next: Fri 6 Nov, Mon 9 Nov, Tue 10 Nov") return "over a weekend: " + next();
await pick("date", "2026-11-07");
if (next() !== "Next: Mon 9 Nov, Tue 10 Nov, Wed 11 Nov") return "from a Saturday: " + next();
if (say() !== "Reminds you on Monday 9 November at 9:00, then every weekday.") return "the first one counts: " + say();
await tapRow("tomorrow");

await pick("unit", "week");
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every week on Monday.") return "weekly: " + say();
if (dayBtn("Monday").getAttribute("aria-pressed") !== "true") return "its own day starts pressed";
await tap(dayBtn("Thursday"));
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every week on Monday and Thursday.") return "two days: " + say();
if (next() !== "Next: Mon 2 Nov, Thu 5 Nov, Mon 9 Nov") return "two days next: " + next();
await tap(stepUp());
if (say() !== "Reminds you tomorrow, Monday 2 November, at 9:00, then every 2 weeks on Monday and Thursday.") return "every 2 weeks: " + say();
if (next() !== "Next: Mon 2 Nov, Thu 5 Nov, Mon 16 Nov") return "every 2 weeks next: " + next();
await tap(stepDown());
await tap(dayBtn("Saturday"));
if (!say().endsWith("on Monday, Thursday and Saturday.")) return "three days: " + say();
await tap(dayBtn("Saturday"));
await tap(dayBtn("Monday"));
if (say() !== "Reminds you on Thursday 5 November at 9:00, then every week on Thursday.") return "away from the start day: " + say();
await tap(dayBtn("Thursday"));
if (dayBtn("Monday").getAttribute("aria-pressed") !== "true") return "none left falls back on the start's day";

// The ends.
await pick("ends", "on");
if (say() !== "Pick the day it ends." || !set.disabled) return "no end yet: " + say();
await pick("until", "2026-11-20");
if (!say().endsWith("then every week on Monday, until 20 November.")) return "until: " + say();
await pick("until", "2027-03-01");
if (!say().endsWith(", until 1 March 2027.")) return "until next year: " + say();
await pick("until", "2026-11-09");
if (next() !== "Next: Mon 2 Nov, Mon 9 Nov") return "the end stops the list: " + next();
await pick("until", "2026-11-01");
if (say() !== "It ends before the first reminder.") return "until before: " + say();
await pick("ends", "after");
if (!say().endsWith("then every week on Monday, 5 times in all.")) return "times: " + say();
await pick("times", "2");
if (next() !== "Next: Mon 2 Nov, Mon 9 Nov") return "two times: " + next();
await pick("times", "1");
if (!say().endsWith(", once only.")) return "one time: " + say();
await pick("times", "abc");
if (say() !== "Say how many times, from 1 to 999." || !set.disabled) return "bad times: " + say();
await pick("times", "0");
if (say() !== "Say how many times, from 1 to 999.") return "no times: " + say();
await pick("times", "3");
await pick("ends", "never");

// A month's end, and a leap day.
await pick("unit", "month");
await tapRow("custom");
await pick("date", "2027-01-31");
if (say() !== "Reminds you on Sunday 31 January 2027 at 9:00, then every month on the 31st, or the last day of a shorter month.") return "monthly 31st: " + say();
if (next() !== "Next: Sun 31 Jan, Sun 28 Feb, Wed 31 Mar") return "monthly next: " + next();
await pick("date", "2026-12-22");
if (!say().endsWith("then every month on the 22nd.")) return "22nd: " + say();
await pick("date", "2026-12-13");
if (!say().endsWith("then every month on the 13th.")) return "13th: " + say();
await pick("unit", "year");
await pick("date", "2028-02-29");
if (say() !== "Reminds you on Tuesday 29 February 2028 at 9:00, then every year on 29 February, or 28 February in other years.") return "yearly: " + say();
if (next() !== "Next: Tue 29 Feb, Wed 28 Feb, Thu 28 Feb") return "yearly next: " + next();

// Set: the callback has it all.
await pick("unit", "none");
await pick("date", "2027-01-15");
await tap(set);
await wait(60);
if ($("#reminder-got").textContent !== "2027-01-15T09:00 | Reminds you on Friday 15 January 2027 at 9:00. | 2027-01-15") return "on_set: " + $("#reminder-got").textContent;
if (!next().includes("Set.")) return "it should say it was set: " + next();

// A value to start from, twelve-hour, too late for later today, its own radio group.
const late = $("#reminder-two");
const lateSay = late.querySelector(".ui-reminder-say").textContent;
if (lateSay !== "Reminds you tomorrow, Saturday 28 February, at 1:30 PM, then every 2 weeks on Tuesday and Saturday, 4 times in all.") return "a value: " + lateSay;
if (late.querySelector(".ui-reminder-next").textContent !== "Next: Sat 28 Feb, Tue 10 Mar, Sat 14 Mar") return "a value's next: " + late.querySelector(".ui-reminder-next").textContent;
if (!late.querySelector('input[value="later"]').disabled) return "23:10 has no later today";
if (late.querySelector('input[value="later"]').closest("label").querySelector(".ui-reminder-hint").textContent !== "Too late today") return "and says so";
if (!late.querySelector('input[value="custom"]').checked || !radio("custom").checked) return "two groups should keep their own";
if (late.querySelector('input[type="radio"]').name === radio("later").name) return "names should differ by id";
await tap(late.querySelector(".ui-reminder-clear"));
if ($("#reminder-cleared").textContent !== "cleared") return "Remove";

// Bad data shows the picker, at the given day's fallback.
if (!$("#reminder-three .ui-reminder-say")) return "bad data should still show";

const p = [...box.querySelectorAll(".ui-reminder-part")].map((e) => e.getBoundingClientRect());
if (device === "tablet") {
    if (p[1].left < p[0].right || Math.abs(p[1].top - p[0].top) > 2) return "a tablet puts them side by side";
} else if (p[1].top < p[0].bottom) return "a phone stacks them";
