const c = $("#cron-builder-demo");
const line = $("#cron-builder-demo-line");
const says = () => c.querySelector(".ui-crontab-says")?.textContent;
const runs = () => [...c.querySelectorAll("time")].map((t) => t.getAttribute("datetime"));
const texts = () => [...c.querySelectorAll("time")].map((t) => t.textContent);
const err = () => c.querySelector(".ui-crontab-error span")?.textContent ?? null;
const zone = (z) => { const s = $("#cron-builder-demo-zone"); s.value = z; s.dispatchEvent(new Event("change", { bubbles: true })); };
if (says() !== "At 09:00 on Monday to Friday") return says();
// From Sunday 2026-11-01 12:00 UTC.
if (runs().join() !== "2026-11-02T09:00:00Z,2026-11-03T09:00:00Z,2026-11-04T09:00:00Z,2026-11-05T09:00:00Z,2026-11-06T09:00:00Z") return runs().join();
if (texts()[0] !== "Mon 2 Nov 2026, 09:00 (UTC)") return texts()[0];
// English and next runs, worked out by hand against a calendar.
const table = [
    ["* * * * *", "Every minute", "2026-11-01T12:01:00Z,2026-11-01T12:02:00Z,2026-11-01T12:03:00Z,2026-11-01T12:04:00Z,2026-11-01T12:05:00Z"],
    ["*/15 * * * *", "Every 15 minutes", "2026-11-01T12:15:00Z,2026-11-01T12:30:00Z,2026-11-01T12:45:00Z,2026-11-01T13:00:00Z,2026-11-01T13:15:00Z"],
    ["0 * * * *", "At the start of every hour", "2026-11-01T13:00:00Z,2026-11-01T14:00:00Z,2026-11-01T15:00:00Z,2026-11-01T16:00:00Z,2026-11-01T17:00:00Z"],
    ["5,35 * * * *", "At minute 5 and 35 of every hour", "2026-11-01T12:05:00Z,2026-11-01T12:35:00Z,2026-11-01T13:05:00Z,2026-11-01T13:35:00Z,2026-11-01T14:05:00Z"],
    ["0 */6 * * *", "Every 6 hours, at minute 0", "2026-11-01T18:00:00Z,2026-11-02T00:00:00Z,2026-11-02T06:00:00Z,2026-11-02T12:00:00Z,2026-11-02T18:00:00Z"],
    ["10-40/10 12 * * *", "At 12:10, 12:20, 12:30 and 12:40", "2026-11-01T12:10:00Z,2026-11-01T12:20:00Z,2026-11-01T12:30:00Z,2026-11-01T12:40:00Z,2026-11-02T12:10:00Z"],
    ["30 8,17 * * *", "At 08:30 and 17:30", "2026-11-01T17:30:00Z,2026-11-02T08:30:00Z,2026-11-02T17:30:00Z,2026-11-03T08:30:00Z,2026-11-03T17:30:00Z"],
    ["0 0 1 * *", "At 00:00 on day 1 of the month", "2026-12-01T00:00:00Z,2027-01-01T00:00:00Z,2027-02-01T00:00:00Z,2027-03-01T00:00:00Z,2027-04-01T00:00:00Z"],
    ["0 0 1,15 1 *", "At 00:00 on day 1 and 15 of January", "2027-01-01T00:00:00Z,2027-01-15T00:00:00Z,2028-01-01T00:00:00Z,2028-01-15T00:00:00Z,2029-01-01T00:00:00Z"],
    ["0 12 * JAN-MAR MON", "At 12:00 on Monday in January to March", "2027-01-04T12:00:00Z,2027-01-11T12:00:00Z,2027-01-18T12:00:00Z,2027-01-25T12:00:00Z,2027-02-01T12:00:00Z"],
    ["0 8 * * 0,6", "At 08:00 on Saturday and Sunday", "2026-11-07T08:00:00Z,2026-11-08T08:00:00Z,2026-11-14T08:00:00Z,2026-11-15T08:00:00Z,2026-11-21T08:00:00Z"],
    ["0 8 * * 7", "At 08:00 on Sunday", "2026-11-08T08:00:00Z,2026-11-15T08:00:00Z,2026-11-22T08:00:00Z,2026-11-29T08:00:00Z,2026-12-06T08:00:00Z"],
    ["0 0 29 2 *", "At 00:00 on day 29 of February", "2028-02-29T00:00:00Z,2032-02-29T00:00:00Z,2036-02-29T00:00:00Z,2040-02-29T00:00:00Z,2044-02-29T00:00:00Z"],
    // Either, as crontab: each Friday and each 13th (the 13th of November is itself a Friday).
    ["0 0 13 * 5", "At 00:00 on day 13 of the month or on Friday", "2026-11-06T00:00:00Z,2026-11-13T00:00:00Z,2026-11-20T00:00:00Z,2026-11-27T00:00:00Z,2026-12-04T00:00:00Z"],
    // A field starting with * counts as not given: every other day, if it is a Monday.
    ["0 0 */2 * 1", "At 00:00 on every 2nd day of the month, if it is a Monday", "2026-11-09T00:00:00Z,2026-11-23T00:00:00Z,2026-12-07T00:00:00Z,2026-12-21T00:00:00Z,2027-01-11T00:00:00Z"],
    ["@daily", "At 00:00", "2026-11-02T00:00:00Z,2026-11-03T00:00:00Z,2026-11-04T00:00:00Z,2026-11-05T00:00:00Z,2026-11-06T00:00:00Z"],
    ["@hourly", "At the start of every hour", "2026-11-01T13:00:00Z,2026-11-01T14:00:00Z,2026-11-01T15:00:00Z,2026-11-01T16:00:00Z,2026-11-01T17:00:00Z"],
    ["  1   2   3   4   *  ", "At 02:01 on day 3 of April", "2027-04-03T02:01:00Z,2028-04-03T02:01:00Z,2029-04-03T02:01:00Z,2030-04-03T02:01:00Z,2031-04-03T02:01:00Z"],
];
for (const [t, english, next] of table) {
    type(line, t); await wait(40);
    if (err()) return `${t}: refused: ${err()}`;
    if (says() !== english) return `${t}: "${says()}"`;
    if (runs().join() !== next) return `${t}: ${runs().join()}`;
}
type(line, "0 0 29 2 *"); await wait(40);
if (c.querySelector(".ui-crontab-note")?.textContent !== "29 February comes only in leap years.") return "the leap note";
// Refused, saying where.
const bad = [
    ["", "Enter five fields: minute, hour, day of the month, month, weekday.", 0],
    ["   ", "Enter five fields: minute, hour, day of the month, month, weekday.", 0],
    ["* * * *", "A cron line has five fields; this has 4.", 7],
    ["* * * * * *", "A cron line has five fields; this has 6.", 10],
    ["60 * * * *", "Minute: 60 is above 59.", 0],
    ["* 24 * * *", "Hour: 24 is above 23.", 2],
    ["* * 0 * *", "Day of the month: 0 is below 1.", 4],
    ["* * 32 * *", "Day of the month: 32 is above 31.", 4],
    ["* * * 13 *", "Month: 13 is above 12.", 6],
    ["* * * * 8", "Weekday: 8 is above 7.", 8],
    ["* * * * FUN", "Weekday: \"FUN\" is not a value here.", 8],
    ["a * * * *", "Minute: \"a\" is not a value here.", 0],
    ["1,,2 * * * *", "Minute: a value is missing here.", 2],
    ["*/0 * * * *", "Minute: a step of 0 never moves on.", 2],
    ["*/x * * * *", "Minute: a step is a whole number, not \"x\".", 2],
    ["5/2 * * * *", "Minute: a step goes on * or a range: write 5-59/2.", 0],
    ["40-20 * * * *", "Minute: 40-20 runs backwards: write the lower one first.", 0],
    ["1-2-3 * * * *", "Minute: \"1-2-3\" has more than one -.", 0],
    ["* * 1,32 * *", "Day of the month: 32 is above 31.", 6],
    ["@reboot", "@reboot runs at start-up, so it has no times to show.", 0],
    ["@sometimes", "@sometimes is not one of @yearly, @monthly, @weekly, @daily and @hourly.", 0],
    ["😀 * * * *", "Minute: \"😀\" is not a value here.", 0],
    ["-1 * * * *", "Minute: a value is missing here.", 0],
    // The days that never come.
    ["0 0 31 2 *", "Day 31 never comes in February.", 4],
    ["0 0 30 2 *", "Day 30 never comes in February.", 4],
    ["0 0 30,31 2 *", "Days 30 and 31 never come in February.", 4],
    ["0 0 31 4,6,9,11 *", "Day 31 never comes in April, June, September and November.", 4],
    ["0 0 31 FEB *", "Day 31 never comes in February.", 4],
];
for (const [t, msg, at] of bad) {
    type(line, t); await wait(35);
    if (err() !== msg) return `${JSON.stringify(t)}: ${err()}`;
    if (says() !== undefined || line.getAttribute("aria-invalid") !== "true") return `${t} still described`;
    const caret = c.querySelector(".ui-crontab-error pre").textContent.split("\n")[1];
    if (caret.indexOf("^") !== at + (t.length - t.trimStart().length)) return `${t}: the caret at ${caret.indexOf("^")}, wanted ${at}`;
}
type(line, "x".repeat(600)); await wait(40);
if (err() !== "That is 600 characters; a line here is at most 500.") return err();
// Fine: only one of the months lacks the day; a weekday rescues it.
type(line, "0 0 31 1,2 *"); await wait(40);
if (err() || runs()[0] !== "2027-01-31T00:00:00Z" || runs()[1] !== "2028-01-31T00:00:00Z") return `${err()} ${runs()}`;
type(line, "0 0 31 2 1"); await wait(40);
if (err() || runs()[0] !== "2027-02-01T00:00:00Z") return `a Monday in February will do: ${err()} ${runs()[0]}`;
// Dropdowns build the line and follow it; keyboard is the select's own.
const sel = (n) => $(`#cron-builder-demo-${n}`);
const pick = async (n, v) => { sel(n).value = v; sel(n).dispatchEvent(new Event("change", { bubbles: true })); await wait(40); };
type(line, "0 9 * * 1-5"); await wait(40);
if (sel("minute").value !== "0" || sel("hour").value !== "9" || sel("weekday").value !== "1-5") return "the dropdowns follow the line";
await pick("minute", "*/15"); await pick("hour", "*/6"); await pick("day", "1"); await pick("month", "6"); await pick("weekday", "*");
if (line.value !== "*/15 */6 1 6 *") return line.value;
if (says() !== "At minute 0, 15, 30 and 45 of 00:00, 06:00, 12:00 and 18:00 on day 1 of June") return says();
type(line, "3,7 9-17 * * MON-FRI"); await wait(40);
if (sel("minute").value !== "3,7" || sel("minute").selectedOptions[0].textContent !== "As typed: 3,7" || sel("weekday").value !== "MON-FRI") return `what no option says: ${sel("minute").selectedOptions[0]?.textContent}`;
if (says() !== "At minute 3 and 7 of 09:00 to 17:00 on Monday to Friday") return says();
// A dropdown on a broken line starts over from stars.
type(line, "not a cron"); await wait(30);
await pick("hour", "12");
if (line.value !== "* 12 * * *" || says() !== "Every minute from 12:00 to 12:59") return `${line.value}: ${says()}`;
// Time zones, against known changes of the clock. New York left summer time on 1 Nov 2026.
type(line, "0 9 * * *"); await wait(30);
zone("America/New_York"); await wait(50);
if (runs().slice(0, 2).join() !== "2026-11-01T09:00:00-05:00,2026-11-02T09:00:00-05:00") return runs().join();
if (texts()[0] !== "Sun 1 Nov 2026, 09:00 (-05:00)") return texts()[0];
zone("Asia/Kolkata"); await wait(50);
if (runs()[0] !== "2026-11-02T09:00:00+05:30") return runs()[0];
// Paris's clocks go forward on 28 March 2027: 02:30 does not exist that day, so that year has no run.
zone("Europe/Paris"); type(line, "30 2 28 3 *"); await wait(50);
if (runs()[0] !== "2028-03-28T02:30:00+02:00") return `a skipped time: ${runs()[0]}`;
// On 31 October 2027 Paris goes back: 02:30 happens twice, and runs once, the first.
type(line, "30 2 31 10 *"); await wait(50);
if (runs()[0] !== "2027-10-31T02:30:00+02:00") return `a doubled time: ${runs()[0]}`;
zone("UTC"); await wait(30);
if (line.name !== "cron" || line.labels[0].textContent !== "Cron line") return "the field's name and label";
// The zones grow once started.
if ($("#cron-builder-demo-zone").options.length < 100) return `the browser's zones: ${$("#cron-builder-demo-zone").options.length}`;
// A zone not known is said, and does not throw.
const z = $("#cron-builder-demo-zone-line").closest(".ui-crontab");
if (z.querySelector(".ui-crontab-note[role=alert]").textContent !== "Mars/Base is not a known time zone, so these are in UTC.") return "the unknown zone";
if (z.querySelectorAll("time")[0].getAttribute("datetime") !== "2026-11-02T09:00:00Z") return z.querySelectorAll("time")[0].getAttribute("datetime");
// on_change.
const live = $("#cron-builder-demo-live-line");
const note = () => live.closest(".demo-stack").querySelector("[data-said]").textContent;
if (live.name !== "backup_cron") return live.name;
type(live, "0 12 * * *"); await wait(50);
if (note() !== "on_change: 0 12 * * *, next 2026-11-02T12:00:00+01:00") return note();
type(live, "61 * * * *"); await wait(50);
if (note() !== "on_change: Minute: 61 is above 59.") return note();
