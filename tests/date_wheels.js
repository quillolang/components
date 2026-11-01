// mobile
const scope = (id) => document.getElementById(id);
const sel = (id, l) => scope(id).querySelector(`select[aria-label="${l}"]`);
const free = "date-wheels-demo-free", lim = "date-wheels-demo-limits";
const out = () => $("#date-wheels-demo-out").textContent;
const field = () => scope(free).querySelector("input[name=start]").value;
const rest = () => wait(750);
const opts = (id, l) => [...sel(id, l).options].map((o) => o.value);
const shown = (id) => scope(id).querySelector(".ui-date-wheels-line").textContent;
if (field() !== "2028-01-31") return `it starts on ${field()}`;
if (shown(free) !== "Monday, January 31, 2028") return `shown: ${shown(free)}`;
if (sel(free, "Day").value !== "31" || sel(free, "Month").value !== "1" || sel(free, "Year").value !== "2028") return "the wheels do not agree with the value";
if (opts(free, "Day").length !== 31) return `January has ${opts(free, "Day").length} days`;
// January 31, then February in a leap year: the day comes down to 29, and one wheel moves another.
sel(free, "Month").focus(); key(sel(free, "Month"), "ArrowDown"); await wait(900);
if (field() !== "2028-02-29" || out() !== "Value: 2028-02-29") return `31 January to February: ${field()}, ${out()}`;
if (opts(free, "Day").length !== 29) return `February 2028 has ${opts(free, "Day").length} days`;
if (sel(free, "Day").value !== "29") return `the day wheel shows ${sel(free, "Day").value}`;
const dayList = sel(free, "Day").closest(".ui-wheel-picker").querySelector(".ui-wheel-picker-list");
if (dayList.scrollTop !== 28 * 44) return `the day wheel rests at ${dayList.scrollTop}`;
// A year that is not a leap year.
sel(free, "Year").focus(); key(sel(free, "Year"), "ArrowDown"); await wait(900);
if (field() !== "2029-02-28") return `29 February into 2029: ${field()}`;
if (opts(free, "Day").length !== 28) return `February 2029 has ${opts(free, "Day").length} days`;
// By finger: the month wheel, three rows on, and the day stays.
const monthList = sel(free, "Month").closest(".ui-wheel-picker").querySelector(".ui-wheel-picker-list");
await drag(monthList, 0, -132, 1200); await wait(900);
if (field() !== "2029-05-28" || shown(free) !== "Monday, May 28, 2029") return `three months on: ${field()}, ${shown(free)}`;
// The value set from outside moves all three.
await tap($("#date-wheels-demo-set")); await wait(900);
if (field() !== "2024-02-29" || sel(free, "Year").value !== "2024" || sel(free, "Month").value !== "2" || sel(free, "Day").value !== "29") return `set from outside: ${field()}`;
// A longer month from outside: the day wheel grows and still reaches the 31st.
await tap($("#date-wheels-demo-long")); await wait(900);
if (field() !== "2031-12-31" || sel(free, "Day").value !== "31" || out() !== "Value: 2029-05-28") return `to 31 December: ${field()}, day ${sel(free, "Day").value}, ${out()}`;
if (dayList.scrollTop !== 30 * 44) return `the 31st rests at ${dayList.scrollTop}`;
// Limits take away what is past them: 10 March 2026 to 5 February 2027.
if (sel(lim, "Day").value !== "20") return `limits start on ${sel(lim, "Day").value}`;
if (opts(lim, "Month").join() !== "3,4,5,6,7,8,9,10,11,12") return `2026's months: ${opts(lim, "Month")}`;
if (opts(lim, "Day")[0] !== "10" || opts(lim, "Day").length !== 22) return `March's days: ${opts(lim, "Day")}`;
if (opts(lim, "Year").join() !== "2026,2027") return `years: ${opts(lim, "Year")}`;
sel(lim, "Year").focus(); key(sel(lim, "Year"), "ArrowDown"); await wait(1000);
if (sel(lim, "Year").value !== "2027") return `year: ${sel(lim, "Year").value}`;
if (sel(lim, "Month").value !== "2" || opts(lim, "Month").join() !== "1,2") return `2027's months: ${opts(lim, "Month")} on ${sel(lim, "Month").value}`;
if (sel(lim, "Day").value !== "5" || opts(lim, "Day").length !== 5) return `past the last day: ${sel(lim, "Day").value} of ${opts(lim, "Day").length}`;
if (shown(lim) !== "Friday, February 5, 2027") return `shown: ${shown(lim)}`;
// day first means the day's wheel comes first.
if (scope(lim).querySelector("select").getAttribute("aria-label") !== "Day") return "dmy: the day is not first";
if (scope(free).querySelector("select").getAttribute("aria-label") !== "Month") return "mdy: the month is not first";
// Bad input: a date that does not exist goes to today, limits the wrong way round are swapped.
const bad = scope("date-wheels-demo-bad");
if (bad.querySelector("input[name=odd]").value !== "2026-11-01") return `31 February: ${bad.querySelector("input[name=odd]").value}`;
if (bad.querySelector("input[name=swapped]").value !== "2030-01-15") return `swapped limits: ${bad.querySelector("input[name=swapped]").value}`;
// A phone stacks; a tablet's pane has the date in a panel beside the wheels.
const body = scope(free).querySelector(".ui-date-wheels-body"), big = scope(free).querySelector(".ui-date-wheels-big");
const wide = scope(free).clientWidth >= 440;
if (wide !== (device === "tablet")) return `the pane is ${scope(free).clientWidth} wide on a ${device}`;
const beside = body.querySelector("output").getBoundingClientRect().right <= body.querySelector(".ui-date-wheels-set").getBoundingClientRect().left;
if (beside !== wide) return `at ${scope(free).clientWidth} px the panel is ${beside ? "beside" : "above"} the wheels`;
if ((getComputedStyle(big).display !== "none") !== wide) return "the big date is wrong for this width";
// A tablet does not stretch the wheels across the screen.
if (wide && scope(free).querySelector(".ui-date-wheels-set").getBoundingClientRect().width > 421) return `wheels ${scope(free).querySelector(".ui-date-wheels-set").getBoundingClientRect().width} wide`;
