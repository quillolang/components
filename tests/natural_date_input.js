const $i = (id) => $(`#${id}`);
const box = $i("natural-date-demo");
const stage = (el) => el.closest(".ui-natdate");
const said = (el) => stage(el).querySelector(".ui-natdate-said").textContent.trim();
const hidden = (el) => stage(el).querySelector("input[type=hidden]")?.value;
const alts = (el) => [...stage(el).querySelectorAll(".ui-natdate-alt")].map((b) => b.dataset.value);
// Wednesday 4 November 2026, 09:30, in en-US (weeks start on Sunday).
if (box.value !== "next friday 5pm" || hidden(box) !== "2026-11-13T17:00") return `start: ${box.value} ${hidden(box)}`;
if (said(box) !== "Friday, November 13, 2026 at 5:00 PM") return `start said: ${said(box)}`;
if (alts(box).join() !== "2026-11-06T17:00") return `the other reading of next friday: ${alts(box)}`;
if (stage(box).querySelector("input[type=hidden]").name !== "due" || box.name) return "only the hidden field holds the form's value";
const cases = [
    ["in 3 days", "2026-11-07"], ["end of month", "2026-11-30"], ["tomorrow noon", "2026-11-05T12:00"],
    ["3 weeks ago", "2026-10-14"], ["today", "2026-11-04"], ["in 2 hours", "2026-11-04T11:30"], ["in 900 minutes", "2026-11-05T00:30"],
    ["2 hours ago", "2026-11-04T07:30"], ["december 25th", "2026-12-25"], ["3rd of December", "2026-12-03"], ["Dec 3 2027", "2027-12-03"],
    ["3/25", "2027-03-25"], ["25/3", "2027-03-25"], ["2026-12-03", "2026-12-03"], ["2026-12-03T08:15", "2026-12-03T08:15"], ["29 feb", "2028-02-29"],
    ["the 31st", "2026-12-31"], ["end of next month", "2026-12-31"], ["start of next week", "2026-11-08"], ["last friday", "2026-10-30"],
    ["this friday", "2026-11-06"], ["FRIDAY", "2026-11-06"], ["  tomorrow   morning ", "2026-11-05T09:00"], ["tonight", "2026-11-04T20:00"], ["5pm", "2026-11-04T17:00"],
    ["5 p.m. tomorrow", "2026-11-05T17:00"], ["next weekend", "2026-11-14"], ["last day of february", "2027-02-28"], ["12:30 am tomorrow", "2026-11-05T00:30"], ["12pm friday", "2026-11-06T12:00"],
];
for (const [text, want] of cases) {
    type(box, text); await wait(30);
    if (hidden(box) !== want) return `"${text}": ${hidden(box)}, not ${want}`;
}
type(box, "12/3"); await wait(50);
if (hidden(box) !== "2026-12-03" || alts(box).join() !== "2027-03-12") return `12/3 in en-US: ${hidden(box)} or ${alts(box)}`;
type(box, "friday at 5"); await wait(50);
if (hidden(box) !== "2026-11-06T17:00" || alts(box).join() !== "2026-11-06T05:00") return `at 5: ${hidden(box)} or ${alts(box)}`;
stage(box).querySelector(".ui-natdate-alt").click(); await wait(50);
if (hidden(box) !== "2026-11-06T05:00" || said(box) !== "Friday, November 6, 2026 at 5:00 AM") return `picking the other reading: ${hidden(box)} ${said(box)}`;
if (alts(box).join() !== "2026-11-06T17:00") return `what was the first reading is now the other: ${alts(box)}`;
type(box, "friday at 6"); await wait(50);
if (hidden(box) !== "2026-11-06T18:00") return `new text forgets the pick: ${hidden(box)}`;
for (const [text, says] of [
    ["2/30", "February has no day 30."], ["13pm", "13pm: a time with am or pm has hours from 1 to 12."], ["25:00", "25:00: hours go up to 23."],
    ["blorp", `Could not read "blorp". Try "next friday 5pm", "in 3 days" or "12/3".`], ["15/15", "15/15 is neither a month and day nor a day and month."],
    ["in 99999999 days", "That is further off than the calendar goes (years 1 to 9999)."], ["in 95700 months", "That is further off than the calendar goes (years 1 to 9999)."], ["in 7990 years", "That is further off than the calendar goes (years 1 to 9999)."],
    ["3000 years ago", "That is further off than the calendar goes (years 1 to 9999)."], ["12/3/0000", "Years go from 1 to 9999."], ["0000-01-01", "Years go from 1 to 9999."], ["dec 3 0000", "Years go from 1 to 9999."], ["2026-13-03", "There is no month 13."],
    ["😀".repeat(81), "That is too long to be a date (over 80 characters)."],
]) {
    type(box, text); await wait(50);
    if (said(box) !== says) return `"${text}" says: ${said(box)}`;
    if (hidden(box) !== "" || box.getAttribute("aria-invalid") !== "true") return `"${text}" keeps a value: ${hidden(box)}`;
}
type(box, "   "); await wait(50);
if (said(box) !== "" || hidden(box) !== "" || box.getAttribute("aria-invalid")) return `blank: ${said(box)}`;
const live = $i("natural-date-demo-live"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
type(live, "12/3 5pm"); await wait(50);
if (!said(live).startsWith("Friday, 12 March 2027")) return `en-GB reads day first: ${said(live)}`;
if (!said(live).includes("the time is left out")) return `a date-only field says the time went: ${said(live)}`;
if (note() !== "on_change: 2027-03-12" || alts(live).join() !== "2026-12-03") return `on_change and the other way round: ${note()} ${alts(live)}`;
stage(live).querySelector(".ui-natdate-alt").click(); await wait(50);
if (note() !== "on_change: 2026-12-03") return `on_change on a pick: ${note()}`;
type(live, "nonsense"); await wait(50);
if (note() !== "Type a date to see on_change.") return `on_change on bad text: ${note()}`;
const lim = $i("natural-date-demo-limited");
type(lim, "yesterday"); await wait(50);
if (said(lim) !== "That is before the earliest date, 2026-11-04." || hidden(lim) !== "") return `earliest: ${said(lim)}`;
type(lim, "next year"); await wait(50);
if (said(lim) !== "That is after the latest date, 2026-12-31.") return `latest: ${said(lim)}`;
const past = $i("natural-date-demo-past");
type(past, "3 May"); await wait(50);
if (!said(past).startsWith("Sunday, May 3, 2026")) return `prefer past: ${said(past)}`;
type(past, "friday"); await wait(50);
if (!said(past).startsWith("Friday, October 30, 2026")) return `prefer past on a weekday: ${said(past)}`;
const clock = $i("natural-date-demo-clock");
type(clock, "tomorrow"); await wait(50);
const d = new Date(); d.setDate(d.getDate() + 1);
const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
if (hidden(clock) !== iso) return `the browser's own clock: ${hidden(clock)}, not ${iso}`;
if (box.labels[0]?.textContent.trim() !== "Due") return "the label is not tied to the box";
if (stage(box).querySelector(".ui-natdate-said").getAttribute("aria-live") !== "polite") return "what it understood is not announced";
