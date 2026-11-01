// mobile
const legs = () => $$(".ui-triptl-leg");
const leg = (id) => $(`.ui-triptl-leg[data-id="${id}"]`);
const txt = (el) => el.textContent.replace(/\s+/g, " ").trim();
const mark = (id) => leg(id).dataset.mark;
const next = () => txt($(".ui-triptl-next"));

// In the order they really happen, whatever the order given; the unreadable leg left out and counted.
if (legs().map((l) => l.dataset.id).join() !== "t1,t2,s1,t3,t4,t5,t6,odd") return "order: " + legs().map((l) => l.dataset.id);
if (!$(".ui-triptl").textContent.includes("One leg has no time that can be read.")) return "the bad leg is not counted";

// Each in its own local time, as written: Lisbon at UTC, Dubai at UTC+4, a day on.
const t2 = txt(leg("t2"));
if (!t2.includes("22:40From LisbonUTC")) return "t2 leaves: " + t2;
if (!t2.includes("09:15To DubaiUTC+4, next day")) return "t2 lands: " + t2;
// Real time: 22:40 UTC to 05:15 UTC is 6 h 35 min, though the clocks say 10 h 35; clocks go forward 4 h.
if (!t2.includes("6 h 35 min. Clocks go forward 4 h. Seat 14A Bag through to Tokyo.")) return "t2 more: " + t2;
const t3 = txt(leg("t3"));
if (!t3.includes("9 h 45 min. Clocks go forward 5 h. Seat 31K")) return "t3: " + t3;
if (t3.includes("next day")) return "t3 lands the same local day: " + t3;
// Eastward over the date line a flight lands earlier on the clock, and the same day here.
const t6 = txt(leg("t6"));
if (!t6.includes("12:30To Los AngelesUTC-8")) return "t6 lands: " + t6;
if (!t6.includes("12 h 30 min. Clocks go back 21 h")) return "t6: " + t6;
if (t6.includes("next day") || t6.includes("previous day")) return "t6 stays on the 8th: " + t6;
const t5 = txt(leg("t5"));
if (!t5.includes("08:45To AucklandUTC+13, next day") || !t5.includes("10 h 45 min. Clocks go forward 4 h")) return "t5: " + t5;

// An arrival before the departure is treated as not given, and a leg with none shows one time.
const odd = txt(leg("odd"));
if (odd.includes("08:00")) return "the arrival before departure shows: " + odd;
if (txt(leg("t4")).includes("To ")) return "t4 has no arrival: " + txt(leg("t4"));

// Between legs: waits by real time, and only where a place changes the clock.
const gaps = $$(".ui-triptl-gap").map(txt);
if (gaps[0] !== "3 h 35 min between") return "gap 1: " + gaps[0];
if (gaps[1] !== "1 h 45 min between") return "gap 2: " + gaps[1];
if (gaps[2] !== "3 h 50 min between") return "gap 3: " + gaps[2];

// Days by local date, one heading each.
const days = $$(".ui-triptl-day").map((d) => d.textContent);
if (days.join("|") !== "Tuesday 3 November|Wednesday 4 November|Thursday 5 November|Friday 6 November|Saturday 7 November|Sunday 8 November|Monday 9 November") return "days: " + days.join("|");

// At 14:05 on the 3rd the next leg is the metro, 4 h 25 min off, or a minute less as the clock runs.
if (mark("t1") !== "next" || mark("t2") !== "later") return "marks: " + mark("t1") + mark("t2");
if (!/^Next: Metro to the airport in 4 h 2[45] minTue 3 Nov, 18:30 in Rossio$/.test(next())) return "next: " + next();
if (leg("t1").getAttribute("aria-current") !== "step") return "the next leg is not marked for screen readers";
const shown = getComputedStyle(leg("t1")).borderColor, plain = getComputedStyle(leg("t2")).borderColor;
if (shown === plain) return "the next leg does not stand out";

// On the first flight, from the page: it is under way, the stay after it is next.
await tap($(".trip-timeline-demo-onboard"));
if (mark("t1") !== "past" || mark("t2") !== "now" || mark("s1") !== "next" || mark("t3") !== "later") return "on board: " + [mark("t1"), mark("t2"), mark("s1"), mark("t3")];
// 23:30 UTC to 07:00 UTC is 7 h 30 min, less a moment.
if (!/^Next: Airport hotel in 7 h (29|30) min/.test(next())) return "on board next: " + next();

// The route that does not need a scroll: focus lands on the next leg.
await tap($(".ui-triptl-go"));
await wait(500);
if (document.activeElement !== leg("s1")) return "focus: " + document.activeElement.className;

// A leg pressed.
await tap(leg("t3"));
if ($(".trip-timeline-demo-picked").textContent !== "EK 318") return "on_pick: " + $(".trip-timeline-demo-picked").textContent;

// The clock runs by itself: a day and a half on, past the hotel's check-in.
const realNow = Date.now;
Date.now = () => realNow.call(Date) + 8 * 3600 * 1000;
await wait(1300);
Date.now = realNow;
if (mark("s1") !== "now" || mark("t3") !== "next") return "the clock: " + mark("s1") + mark("t3");

// After it all.
await tap($(".trip-timeline-demo-after"));
if (legs().some((l) => l.dataset.mark !== "past")) return "after: " + legs().map((l) => l.dataset.mark);
if (next() !== "That was the last leg.") return "done: " + next();
if ($(".ui-triptl-go")) return "nothing to go to";

const cols = getComputedStyle($(".ui-triptl-in")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
