const c = $("#slot-finder-demo-title").closest(".ui-slot-finder");
const slots = (r = c) => [...r.querySelectorAll(".ui-slot-finder-slot > span:first-child")].map((s) => s.textContent);
const head = (r = c) => r.querySelector(".ui-slot-finder-head")?.textContent;
const busy = () => [...c.querySelectorAll(".ui-slot-finder-busy")].map((s) => s.textContent);
const err = (r = c) => r.querySelector("p.ui-slot-finder-problems")?.textContent;
const box = (i) => $(`#slot-finder-demo-busy-${i}`);
const start = $("#slot-finder-demo-from"), end = $("#slot-finder-demo-to"), mins = $("#slot-finder-demo-minutes"), zone = $("#slot-finder-demo-zone");
const note = () => c.closest(".demo-stack").querySelector(".demo-note").textContent;
// Lisbon is on UTC in November. Mon: Ana 09-12, 13-17 leaves 12-13. Tue: Ana 09-10 UTC; Ben 06-08 in New York (EST) is 11-13 UTC; Cara 18:30-20:30 in Kolkata is 13-15 UTC. Free 10-11 and 15-17.
if (head() !== "3 slots suit everyone") return `head: ${head()}`;
if (slots().join("|") !== "Mon 2 Nov 12:00 to 13:00 (1 h)|Tue 3 Nov 10:00 to 11:00 (1 h)|Tue 3 Nov 15:00 to 17:00 (2 h)") return `slots: ${slots()}`;
// The map form was written into the box in Ana's zone.
if (box(0).value.split("\n")[2] !== "2026-11-03 09:00-10:00") return `a map's text: ${box(0).value}`;
// The chosen zone moves working hours, not busy times: in Tokyo, 09-17 is 00-08 UTC, before anyone's busy time on either day.
zone.value = "Asia/Tokyo"; zone.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (slots()[0] !== "Mon 2 Nov 09:00 to 17:00 (8 h)" || slots().length !== 2) return `Tokyo: ${slots()}`;
zone.value = "Europe/Lisbon"; zone.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (slots().length !== 3) return `back to Lisbon: ${slots()}`;
// Too long for any gap: ranked by fewest affected. 3 h: Tue 10-13 touches Ben; Tue 14-17 touches Cara; Mon 12-15 touches Ana.
type(mins, "180"); await wait();
if (head() !== "No slot suits everyone. Closest first:") return `partial head: ${head()}`;
if (slots()[0] !== "Mon 2 Nov 09:00 to 12:00") return `partial first: ${slots()}`;
if (busy()[0] !== "1 affected: Ana") return `partial busy: ${busy()}`;
if (busy().some((b, i) => i && parseInt(b) < parseInt(busy()[i - 1]))) return `not ranked: ${busy()}`;
const firsts = slots().map((s) => s.slice(0, 19));
if (new Set(firsts).size !== firsts.length) return `overlapping choices: ${firsts}`;
// Everyone busy all the time.
for (const i of [0, 1, 2]) type(box(i), "2026-11-02 00:00-23:59\n2026-11-03 00:00-23:59");
type(mins, "60"); await wait();
if (head() !== "No slot suits everyone. Closest first:") return `all busy: ${head()}`;
if (slots()[0] !== "Mon 2 Nov 09:00 to 10:00" || busy()[0] !== "3 affected: Ana, Ben, Cara") return `all busy: ${slots()[0]} ${busy()[0]}`;
// Busy times that overlap and touch, and one over midnight.
type(box(1), ""); type(box(2), "");
type(box(0), "2026-11-02 09:00-10:00\n2026-11-02 09:30-11:00\n2026-11-02 11:00-12:00\n2026-11-02 22:00-10:00"); type(mins, "30"); await wait();
if (slots().join("|") !== "Mon 2 Nov 12:00 to 17:00 (5 h)|Tue 3 Nov 10:00 to 17:00 (7 h)") return `merged: ${slots()}`;
// A busy time of several days, as a line.
type(box(0), "2026-11-02 13:00-2026-11-03 16:00"); type(mins, "60"); await wait();
if (slots().join("|") !== "Mon 2 Nov 09:00 to 13:00 (4 h)|Tue 3 Nov 16:00 to 17:00 (1 h)") return `over days: ${slots()}`;
type(box(0), "2026-11-02 13:00-2026-11-01 16:00"); await wait();
if (!c.querySelector("ul.ui-slot-finder-problems li")?.textContent.includes("ends before it starts")) return "a span that ends first";
// The bounds of a slot: exactly the length fits; a minute more does not.
type(box(0), "2026-11-02 09:00-16:00\n2026-11-03 09:00-17:00"); type(mins, "60"); await wait();
if (slots().join("|") !== "Mon 2 Nov 16:00 to 17:00 (1 h)") return `exact fit: ${slots()}`;
type(mins, "61"); await wait();
if (head() !== "No slot suits everyone. Closest first:") return `a minute more: ${head()}`;
type(mins, "60"); await wait();
// on_pick.
c.querySelector(".ui-slot-finder-pick").click(); await wait();
if (note() !== "on_pick: 2026-11-02T16:00:00Z to 2026-11-02T17:00:00Z, 0 affected.") return `on_pick: ${note()}`;
// Bad input, each with a message.
for (const [text, want] of [["abc", "whole number"], ["0", "whole number"], ["-5", "whole number"], ["1.5", "whole number"], ["", "whole number"]]) {
    type(mins, text); await wait(40);
    if (!err()?.includes(want) || mins.getAttribute("aria-invalid") !== "true") return `minutes "${text}": ${err()}`;
}
type(mins, "99999"); await wait(40);
if (head() !== "Nothing fits in these hours.") return `too long: ${head()}`;
type(mins, "60"); await wait(40);
type(end, "2026-10-01"); await wait(40);
if (err() !== "The last day comes before the first.") return `days: ${err()}`;
type(end, "2027-02-01"); await wait(40);
if (err() !== "That is more than 31 days to look through.") return `range: ${err()}`;
type(end, ""); await wait(40);
if (err() !== "Choose the first and last days to look at.") return `empty: ${err()}`;
type(end, "2026-11-03"); await wait(40);
type($("#slot-finder-demo-close"), "08:00"); await wait(40);
if (err() !== "Working hours must end after they start.") return `hours: ${err()}`;
// A Saturday and Sunday are left out unless asked for.
type($("#slot-finder-demo-close"), "17:00"); type(start, "2026-11-07"); type(end, "2026-11-08"); await wait(40);
if (head() !== "Nothing fits in these hours.") return `weekend: ${head()}`;
$("#slot-finder-demo-weekends").click(); await wait(40);
if (slots().length !== 2) return `weekend on: ${slots()}`;
// The spring change in Paris: 02:00 does not exist on 29 Mar 2026, so 00:00-06:00 is 5 hours, and Dee's 00:30-01:30 leaves 00:00-00:30 and 01:30-06:00.
const d = $("#slot-finder-demo-dst-from").closest(".ui-slot-finder");
if (slots(d).join("|") !== "Sun 29 Mar 01:30 to 06:00 (3 h 30 min)") return `DST: ${slots(d)}`;
const bad = [...d.querySelectorAll("ul.ui-slot-finder-problems li")].map((l) => l.textContent);
for (const want of ['Eli: the time zone "Mars/Base" is not known.', 'Eli, busy time 1: "bad line" is not written like', 'Eli, busy time 2: "x to y" is not written like', 'Eli, busy time 3: "2026-03-30 25:00-26:00" has no such time.']) if (!bad.some((b) => b.startsWith(want))) return `missing "${want}": ${bad}`;
// A bad zone from the page's own prop stops nothing; choosing a real one mends it. Fay's text stays in UTC, the fallback.
const z = $("#slot-finder-demo-bad-from").closest(".ui-slot-finder");
if (err(z) !== 'The time zone "Mars/Base" is not known.') return `bad zone: ${err(z)}`;
const zs = $("#slot-finder-demo-bad-zone");
zs.value = "UTC"; zs.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (slots(z).join("|") !== "Mon 2 Nov 09:00 to 10:00 (1 h)|Mon 2 Nov 11:00 to 17:00 (6 h)") return `mended: ${slots(z)}`;
// An offset as the zone, kept in the list; a person given as a bare name has no busy times.
const o = $("#slot-finder-demo-offset-from").closest(".ui-slot-finder");
if ($("#slot-finder-demo-offset-zone").value !== "+05:30") return `offset selected: ${$("#slot-finder-demo-offset-zone").value}`;
if (slots(o).join("|") !== "Mon 2 Nov 09:00 to 12:00 (3 h)") return `offset: ${slots(o)}`;
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
