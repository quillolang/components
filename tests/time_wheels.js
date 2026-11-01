// mobile
const scope = (id) => document.getElementById(id);
const sel = (id, l) => scope(id).querySelector(`select[aria-label="${l}"]`);
const opts = (id, l) => [...sel(id, l).options].map((o) => o.textContent);
const a = "time-wheels-demo-alarm", n = "time-wheels-demo-night", p = "time-wheels-demo-late";
const field = (id) => scope(id).querySelector("input[type=hidden]").value;
const shown = (id) => scope(id).querySelector("output").textContent.replace(/\s+/g, " ").trim();
const out = () => $("#time-wheels-demo-out").textContent;
const push = async (id, l, k) => { sel(id, l).focus(); key(sel(id, l), k); await wait(900); };
// A 12-hour clock in steps of 5.
if (field(a) !== "07:30" || shown(a) !== "7:30 AM") return `it starts on ${field(a)}, ${shown(a)}`;
if (opts(a, "Hour").join() !== "12,1,2,3,4,5,6,7,8,9,10,11") return `hours: ${opts(a, "Hour")}`;
if (opts(a, "Minute").join() !== "00,05,10,15,20,25,30,35,40,45,50,55") return `minutes: ${opts(a, "Minute")}`;
if (opts(a, "AM or PM").join() !== "AM,PM") return `periods: ${opts(a, "AM or PM")}`;
// Afternoon: 7:30 AM to 7:30 PM, one field.
await push(a, "AM or PM", "ArrowDown");
if (field(a) !== "19:30" || shown(a) !== "7:30 PM" || out() !== "Value: 19:30") return `to PM: ${field(a)} ${shown(a)} ${out()}`;
// By finger: two rows of minutes.
const minutes = sel(a, "Minute").closest(".ui-wheel-picker").querySelector(".ui-wheel-picker-list");
await drag(minutes, 0, -88, 1200); await wait(900);
if (field(a) !== "19:40") return `two rows of minutes on: ${field(a)}`;
// 12 is noon or midnight.
await push(a, "Hour", "Home");
if (field(a) !== "12:40" || shown(a) !== "12:40 PM") return `the first hour of PM: ${field(a)} ${shown(a)}`;
await push(a, "AM or PM", "ArrowUp");
if (field(a) !== "00:40" || shown(a) !== "12:40 AM") return `12 AM: ${field(a)} ${shown(a)}`;
// A value off the steps goes to the nearest, set from outside.
await tap($("#time-wheels-demo-set")); await wait(900);
if (field(a) !== "18:10" || sel(a, "Hour").value !== "18" || sel(a, "Minute").value !== "10" || sel(a, "AM or PM").value !== "1") return `18:12 by steps of 5: ${field(a)}`;
// en-GB is a 24-hour clock with no AM or PM wheel.
if (sel(n, "AM or PM")) return "en-GB has an AM/PM wheel";
if (shown(n) !== "23:15") return `23:10 by steps of 15: ${shown(n)}`;
// The hours run across midnight, in order, and nothing else is there.
if (opts(n, "Hour").join() !== "22,23,00,01,02") return `hours: ${opts(n, "Hour")}`;
if (opts(n, "Minute").join() !== "00,15,30,45") return `minutes: ${opts(n, "Minute")}`;
await push(n, "Hour", "ArrowDown");
if (field(n) !== "00:15" || shown(n) !== "00:15 next day") return `past midnight: ${field(n)} ${shown(n)}`;
// The last hour has only its first quarter: 02:15 is past the limit.
await push(n, "Hour", "End");
if (field(n) !== "02:00" || opts(n, "Minute").join() !== "00") return `the last hour: ${field(n)}, ${opts(n, "Minute")}`;
// Back over midnight the note goes.
await push(n, "Hour", "Home");
if (field(n) !== "22:00" || shown(n) !== "22:00") return `back to the start: ${field(n)} ${shown(n)}`;
// 12-hour across midnight: PM has 10 and 11, AM has 12 and 1.
if (shown(p) !== "10:30 PM") return `shown: ${shown(p)}`;
if (opts(p, "Hour").join() !== "10,11") return `PM's hours: ${opts(p, "Hour")}`;
if (opts(p, "AM or PM").join() !== "PM,AM") return `the order of the day: ${opts(p, "AM or PM")}`;
await push(p, "AM or PM", "ArrowDown");
if (opts(p, "Hour").join() !== "12,1") return `AM's hours: ${opts(p, "Hour")}`;
if (sel(p, "AM or PM").value !== "0") return `the period wheel: ${sel(p, "AM or PM").value}`;
if (shown(p) !== "12:30 AM next day" && shown(p) !== "1:00 AM next day") return `over midnight: ${shown(p)}`;
// Bad input stops nothing.
const bad = scope("time-wheels-demo-bad"), val = (n) => bad.querySelector(`input[name=${n}]`).value;
if (val("odd") !== "00:00") return `25:99: ${val("odd")}`;
if (bad.querySelectorAll("select[aria-label=Minute]")[0].options.length !== 60) return "a step of 0 is not every minute";
if (val("tight") !== "10:00") return `limits nothing fits: ${val("tight")}`;
if (val("plain") !== "13:05") return `one by one: ${val("plain")}`;
// No locale: the browser's own says, and the hour survives the wheels being remade.
const plain = bad.querySelectorAll(".ui-time-wheels")[2];
const cycle = new Intl.DateTimeFormat(navigator.language, { hour: "numeric" }).resolvedOptions().hourCycle;
const says = cycle === "h23" || cycle === "h24" ? "13:05" : "1:05 PM";
if (plain.querySelector("output").textContent.trim() !== says) return `the browser's clock (${navigator.language}): ${plain.querySelector("output").textContent}`;
if (!!plain.querySelector('select[aria-label="AM or PM"]') === (says === "13:05")) return "the AM/PM wheel does not fit the clock";
// Space: a tablet's pane has the time beside the wheels.
const body = scope(a).querySelector(".ui-time-wheels-body");
const wide = scope(a).clientWidth >= 440;
if (wide !== (device === "tablet")) return `the pane is ${scope(a).clientWidth} wide`;
const beside = body.querySelector("output").getBoundingClientRect().right <= body.querySelector(".ui-time-wheels-set").getBoundingClientRect().left;
if (beside !== wide) return `at ${scope(a).clientWidth} px the panel is ${beside ? "beside" : "above"} the wheels`;
