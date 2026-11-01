const c = $("#timezone-overlap-demo-window").closest(".ui-tz-overlap");
const win = $("#timezone-overlap-demo-window");
const sum = (r = c) => r.querySelector(".ui-tz-overlap-sum").textContent;
const mean = (city, r = c) => r.querySelector(`.ui-tz-overlap-mean[data-city="${city}"]`).textContent;
const notes = (r) => [...r.querySelectorAll(".ui-tz-overlap-note")].map((n) => n.textContent);
const hours = (city, r = c) => [...r.querySelectorAll(`.ui-tz-overlap-track[data-city="${city}"] .ui-tz-overlap-hour`)].map((h) => h.textContent).join();
const note = () => c.closest(".demo-stack").querySelector(".demo-note").textContent;
// 3 Nov: Lisbon is UTC, 09-17. New York is UTC-5, 14-22 UTC. Mumbai is UTC+5:30, 10:00-18:30 is 04:30-13:00 UTC.
// Lisbon and Mumbai share 09:00-13:00, New York joins at 14:00: no time for all three.
if (sum() !== "No overlap. Most at work: 2 of 3, 09:00 to 13:00, Lisbon time (Lisbon, Mumbai).") return `three cities: ${sum()}`;
if (win.getAttribute("aria-valuetext") !== "09:00 to 10:00" || win.getAttribute("role") !== "slider") return `window: ${win.getAttribute("aria-valuetext")}`;
// What the hour means in each.
if (mean("Lisbon") !== "Lisbon: 09:00same day, at work") return mean("Lisbon");
if (mean("New York") !== "New York: 04:00same day, night") return mean("New York");
if (mean("Mumbai") !== "Mumbai: 14:30same day, at work") return mean("Mumbai");
// Half-hour row, as labels.
if (hours("Mumbai") !== "05:30,09:30,13:30,17:30,21:30,01:30") return `Mumbai's hours: ${hours("Mumbai")}`;
if (hours("New York") !== "19:00,23:00,03:00,07:00,11:00,15:00") return `New York's hours: ${hours("New York")}`;
// Working hours placed on the row: Lisbon 09-17 of 24 is 37.5% for 33.33%.
const w = c.querySelector('.ui-tz-overlap-track[data-city="Lisbon"] .ui-tz-overlap-work');
if (w.style.left !== "37.5%" || parseFloat(w.style.width) !== 33.34) return `Lisbon's span: ${w.style.left} ${w.style.width}`;
// New York's spans over the day: 00:00-03:00 from the evening before? 09-17 there is 14-22 UTC, one span only.
if (c.querySelectorAll('.ui-tz-overlap-track[data-city="New York"] .ui-tz-overlap-work').length !== 1) return "New York's spans";
// Keys.
win.focus(); key(win, "ArrowRight"); await wait();
if (win.getAttribute("aria-valuetext") !== "09:15 to 10:15") return `right: ${win.getAttribute("aria-valuetext")}`;
if (note() !== "on_change: 2026-11-03T09:15:00Z to 2026-11-03T10:15:00Z; New York 04:15, night.") return `on_change: ${note()}`;
key(win, "PageUp"); await wait(60);
if (win.getAttribute("aria-valuetext") !== "10:15 to 11:15") return `PageUp: ${win.getAttribute("aria-valuetext")}`;
key(win, "End"); await wait(60);
if (win.getAttribute("aria-valuetext") !== "23:00 to 00:00" || win.getAttribute("aria-valuenow") !== "1380") return `End: ${win.getAttribute("aria-valuetext")}`;
if (mean("Mumbai") !== "Mumbai: 04:30next day, night") return `next day: ${mean("Mumbai")}`;
key(win, "ArrowRight"); await wait(60);
if (win.getAttribute("aria-valuenow") !== "1380") return "past the end";
key(win, "Home"); await wait(60);
if (win.getAttribute("aria-valuenow") !== "0" || mean("New York") !== "New York: 19:00day before, after work") return `Home: ${mean("New York")}`;
key(win, "ArrowLeft"); await wait(60);
if (win.getAttribute("aria-valuenow") !== "0") return "past the start";
key(win, "o"); await wait(60);
if (win.getAttribute("aria-valuetext") !== "09:00 to 10:00") return "O goes back to the best time";
// A drag, by pointer, snapping to the step: half the width is noon.
const rows = c.querySelector(".ui-tz-overlap-rows"), r = rows.getBoundingClientRect(), wr = win.getBoundingClientRect();
const pe = (el, t, x) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 1, button: 0, isPrimary: true, clientX: x, clientY: wr.top + 5 }));
pe(win, "pointerdown", wr.left + 4); pe(win, "pointermove", wr.left + 4 + r.width * (3 / 24)); await wait(60);
if (win.getAttribute("aria-valuetext") !== "12:00 to 13:00") return `drag: ${win.getAttribute("aria-valuetext")}`;
pe(win, "pointermove", wr.left + 4 + r.width * (3.2 / 24)); await wait(60);
if (win.getAttribute("aria-valuetext") !== "12:15 to 13:15") return `the drag snaps: ${win.getAttribute("aria-valuetext")}`;
pe(win, "pointerup", wr.left); pe(win, "pointermove", wr.left + 100); await wait(60);
if (win.getAttribute("aria-valuetext") !== "12:15 to 13:15") return "still dragging after release";
if (c.querySelector("input[name=meeting]").value !== "2026-11-03T12:15:00Z") return "the form's field";
// The spring change: 29 Mar 2026 in Paris has 23 hours, and New York is on summer time (from 8 Mar), UTC-4.
const d = $("#timezone-overlap-demo-dst-window").closest(".ui-tz-overlap");
if (!notes(d).includes("Paris's day has 23 hours.") || !notes(d).includes("Paris: clocks go forward an hour today.")) return `DST notes: ${notes(d)}`;
if (hours("Paris", d) !== "00:00,05:00,09:00,13:00,17:00,21:00") return `Paris's hours skip 2 am: ${hours("Paris", d)}`;
// Kathmandu is +5:45: 03:15-11:15 UTC. Paris from 2 am is +2: 07:00-15:00 UTC. New York 13:00-21:00 UTC: not three at once; two overlap from Paris 09:00 to 13:15.
if (sum(d) !== "No overlap. Most at work: 2 of 3, 09:00 to 13:15, Paris time (Paris, Kathmandu).") return `DST sum: ${sum(d)}`;
if (hours("Kathmandu", d) !== "04:45,08:45,12:45,16:45,20:45,00:45") return `Kathmandu: ${hours("Kathmandu", d)}`;
const dw = $("#timezone-overlap-demo-dst-window");
if (dw.getAttribute("aria-valuemax") !== "1320") return `a 23-hour day: ${dw.getAttribute("aria-valuemax")}`;
// Bad cities, no overlap in reach, and a span that runs past midnight.
const n = $("#timezone-overlap-demo-none-window").closest(".ui-tz-overlap");
const p = [...n.querySelectorAll(".ui-tz-overlap-problems li")].map((l) => l.textContent);
if (p.join("|") !== 'Nowhere: the time zone "Mars/Base" is not known.|Odd: working hours must be times, like 09:00.') return `bad cities: ${p}`;
// The day is Auckland's, 11:00 UTC on 2 Nov to 11:00 UTC on 3 Nov. Its 09-17 is 20:00-04:00 UTC; the night desk's 22:00-06:00 UTC runs over the UTC midnight in one piece, 11 h in;
// London's 09-17 falls twice, 11:00-17:00 and 09:00-11:00 UTC. Auckland and the desk share 22:00-04:00 UTC, 11:00-17:00 in Auckland.
const desk = n.querySelectorAll('.ui-tz-overlap-track[data-city="Night desk"] .ui-tz-overlap-work');
if (desk.length !== 1 || desk[0].style.left !== "45.83%") return `the night desk: ${desk.length} ${desk[0]?.style.left}`;
if (n.querySelectorAll('.ui-tz-overlap-track[data-city="London"] .ui-tz-overlap-work').length !== 2) return "London's two pieces of the day";
if (sum(n) !== "No overlap. Most at work: 2 of 3, 11:00 to 17:00, Auckland time (Auckland, Night desk).") return `none: ${sum(n)}`;
// A real band, on a half-hour edge. Berlin is +1, 08:00-16:00 UTC; Mumbai 09-17 is 03:30-11:30 UTC: 3.5 h, from 09:00 Berlin time, where the window starts.
const b = $("#timezone-overlap-demo-band-window").closest(".ui-tz-overlap");
const bw = $("#timezone-overlap-demo-band-window");
if (sum(b) !== "All at work for 3 h 30 min: 09:00 to 12:30, Berlin time.") return `band: ${sum(b)}`;
const band = b.querySelector(".ui-tz-overlap-band");
if (b.querySelectorAll(".ui-tz-overlap-band").length !== 1 || band.style.left !== "37.5%" || parseFloat(band.style.width) !== 14.59) return `the band: ${band?.style.left} ${band?.style.width}`;
if (bw.getAttribute("aria-valuetext") !== "09:00 to 09:45" || mean("Mumbai", b) !== "Mumbai: 13:30same day, at work") return `band window: ${bw.getAttribute("aria-valuetext")} ${mean("Mumbai", b)}`;
key(bw, "End"); await wait(60);
b.querySelector(".ui-tz-overlap-btn").click(); await wait(60);
if (bw.getAttribute("aria-valuetext") !== "09:00 to 09:45") return "Back to the overlap";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
