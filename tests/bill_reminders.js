// mobile
const box = $$("section.ui-billrem")[0];
const q = (s) => box.querySelector(s), qq = (s) => [...box.querySelectorAll(s)];
const log = () => $("#billrem-log").textContent;
const names = () => qq(".ui-billrem-name").map((n) => n.textContent);
const item = (n) => qq(".ui-billrem-item").find((i) => i.querySelector(".ui-billrem-name").textContent === n);
const face = (n) => item(n).querySelector(".ui-billrem-face");
const tag = (n) => item(n).querySelector(".ui-billrem-tag").textContent;
const btn = (el, t) => [...el.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
const picks = (n) => [...item(n).querySelectorAll(".ui-billrem-pick")];
// In order, soonest first, late at the top. "Broken bill" has day 99, so no day: left out.
// "Odd one": a bad date but a good day 5: Nov 5, later than soon. Electricity: day 2, Nov 2.
if (names().join() !== "Water,Rent,Electricity,Car tax,Odd one,Gym,Credit card") return "order: " + names().join();
// The marks, in words: Water was due Oct 28, 4 days back.
if (tag("Water") !== "4 days late" || !item("Water").classList.contains("ui-billrem-late")) return "late: " + tag("Water");
if (tag("Rent") !== "Due today") return "today: " + tag("Rent");
if (tag("Electricity") !== "Due tomorrow" || !item("Electricity").classList.contains("ui-billrem-soon")) return "tomorrow: " + tag("Electricity");
if (tag("Car tax") !== "Due in 2 days") return "in 2 days: " + tag("Car tax");
if (tag("Odd one") !== "Due Nov 5" || !item("Odd one").classList.contains("ui-billrem-later")) return "later: " + tag("Odd one");
// Month ends: its day is the 31st, November has 30.
if (tag("Credit card") !== "Due Nov 30" || !/the 31st, is not in this month/.test(item("Credit card").textContent)) return "month end: " + item("Credit card").textContent;
// The total of the next 30 days: 120.40 + 41.17 + 950 + 88 + 63.05 + 5 + 30 = 1297.62.
if (q(".ui-billrem-sum strong").textContent !== "$1,297.62") return "the sum: " + q(".ui-billrem-sum strong").textContent;
// Bad input: no good day, nothing thrown; none.
if (!/No bills coming up/.test($("#billrem-none").textContent)) return "no bills";
if (!/need today's date/.test($("#billrem-noday").textContent)) return "no today";
// January 31 in a leap year: paying moves to Feb 29, then Mar 31.
const leap = $("#billrem-leap");
if (leap.querySelector(".ui-billrem-tag").textContent !== "Due today") return "leap start";
const leapPay = async () => { await tap(btn(leap, "Pay")); await tap(btn(leap, "Yes, pay")); await wait(100); };
await leapPay();
if (leap.querySelector(".ui-billrem-tag").textContent !== "Due Feb 29") return "leap: " + leap.querySelector(".ui-billrem-tag").textContent;
if (!/next is due Feb 29/.test(leap.querySelector(".ui-billrem-said").textContent)) return "says so";
await leapPay();
if (leap.querySelector(".ui-billrem-tag").textContent !== "Due Mar 31") return "back to the 31st: " + leap.querySelector(".ui-billrem-tag").textContent;
// A swipe that falls short springs back and asks nothing.
const f = (type, a) => cdp("Input.dispatchTouchEvent", { type, touchPoints: a ? [a] : [] });
const fr = () => { face("Rent").scrollIntoView({ block: "center" }); const r = face("Rent").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + 18 }; };
const p = fr();
await wait(60);
await f("touchStart", p);
for (let i = 1; i <= 5; i++) { await f("touchMove", { x: p.x - i * 10, y: p.y }); await wait(16); }
await wait(200);
if (!/translateX\(-50px\)/.test(face("Rent").style.transform)) { await f("touchEnd"); return "follows: " + face("Rent").style.transform; }
await f("touchEnd"); await wait(300);
if (face("Rent").style.transform !== "" || picks("Rent").length) return "springs back";
// A cancel too.
await f("touchStart", p);
for (let i = 1; i <= 8; i++) { await f("touchMove", { x: p.x - i * 20, y: p.y }); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(300);
if (face("Rent").style.transform !== "" || picks("Rent").length) return "a cancel asks nothing";
// Up and down is the page's.
await drag(face("Rent"), 0, -50, 200); await wait(200);
if (picks("Rent").length || btn(item("Rent"), "Yes, pay")) return "a vertical drag asks nothing";
// Left past the threshold asks when, with the dates worked out; these cross into nothing odd.
await drag(face("Rent"), -160, 0, 300); await wait(250);
if (picks("Rent").map((b) => b.textContent).join("|") !== "TomorrowMon, Nov 2|In 3 daysWed, Nov 4|In a weekSun, Nov 8") return "snoozes: " + picks("Rent").map((b) => b.textContent).join("|");
await tap(picks("Rent")[1]); await wait(150);
if (log() !== "Snoozed rent to 2026-11-04") return "snoozed: " + log();
// A snoozed bill goes down, still says when it was due.
if (!/Snoozed to Nov 4/.test(item("Rent").textContent) || tag("Rent") !== "Due today") return "snoozed row: " + item("Rent").textContent;
if (names().indexOf("Rent") <= names().indexOf("Car tax") || names().indexOf("Rent") >= names().indexOf("Odd one")) return "snoozed order: " + names().join();
// A flick right asks to pay; the first answer is refused and it says so.
await drag(face("Electricity"), 60, 0, 40); await wait(250);
if (!btn(item("Electricity"), "Yes, pay")) return "a flick asks to pay";
if (!/Pay \$63\.05 to Electricity now/.test(item("Electricity").textContent)) return "pay words: " + item("Electricity").textContent;
await tap(btn(item("Electricity"), "Yes, pay")); await wait(200);
if (!/could not be paid/.test(item("Electricity").textContent) || tag("Electricity") !== "Due tomorrow") return "refused";
await tap(btn(item("Electricity"), "Yes, pay")); await wait(250);
if (log() !== "Paid power due 2026-11-02") return "paid: " + log();
// Monthly: the next one, Dec 2, so it moves down.
if (tag("Electricity") !== "Due Dec 2") return "next: " + tag("Electricity");
if (names().indexOf("Electricity") < names().indexOf("Credit card")) return "moved down: " + names().join();
// One-off: paid and gone. By the row's buttons, the equal of a swipe.
await tap(btn(item("Car tax"), "Pay"));
await tap(btn(item("Car tax"), "Not now"));
if (btn(item("Car tax"), "Yes, pay")) return "not now";
await tap(btn(item("Car tax"), "Pay"));
await tap(btn(item("Car tax"), "Yes, pay")); await wait(200);
if (item("Car tax")) return "a one-off goes";
if (log() !== "Paid tax due 2026-11-03") return "paid once: " + log();
// Snooze by button and by key.
await tap(btn(item("Water"), "Snooze"));
picks("Water")[0].focus(); picks("Water")[0].click(); await wait(100);
if (log() !== "Snoozed water to 2026-11-02") return "by key: " + log();
if (tag("Water") !== "4 days late") return "snoozing changes no date";
if (device === "tablet") {
    const g = qq(".ui-billrem-group").map((x) => x.getBoundingClientRect());
    if (!(g[1].left >= g[0].right) || Math.abs(g[0].top - g[1].top) > 2) return "columns on a tablet";
} else {
    const g = qq(".ui-billrem-group").map((x) => x.getBoundingClientRect());
    if (g[1].top < g[0].bottom - 1) return "stacked on a phone";
    // Turning keeps a question open.
    await tap(btn(item("Gym"), "Snooze"));
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (!picks("Gym").length) return "rotation keeps it";
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(300);
}
