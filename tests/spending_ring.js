// mobile
const box = $$("section.ui-spendring")[0];
const q = (s) => box.querySelector(s), qq = (s) => [...box.querySelectorAll(s)];
const log = () => $("#spendring-log").textContent;
const lines = () => qq(".ui-spendring-line");
const names = () => qq(".ui-spendring-name").map((n) => n.textContent);
const mid = () => q(".ui-spendring-mid").textContent;
const cmp = () => q(".ui-spendring-cmp").textContent;
const word = () => q(".ui-spendring-word")?.textContent;
// Sorted, bad and negative ones left out. Total 950 + 212.40 + 96.15 + 41.20 + 3.25 = 1303.00.
if (names().join() !== "Rent,Food,Travel,Fun,Coffee") return "parts: " + names().join();
if (!/Spent so far\$1,303\.00/.test(mid())) return "the middle: " + mid();
// Percents that add to exactly 100: 72.9, 16.3, 7.4, 3.2, 0.2 floor to 72, 16, 7, 3, 0, and the two left go to .9 and .4.
const pc = qq(".ui-spendring-sub").map((s) => parseInt(s.textContent));
if (qq(".ui-spendring-sub").map((s) => s.textContent).join() !== "73%,16%,8%,3%,under 1%") return "percents: " + qq(".ui-spendring-sub").map((s) => s.textContent).join();
// 1, 1, 1 of 3: 34, 33, 33.
const three = [...$("#spendring-three").querySelectorAll(".ui-spendring-sub")].map((s) => s.textContent).join();
if (three !== "34%,33%,33%") return "thirds: " + three;
if (!/Nothing spent yet/.test($("#spendring-none").textContent)) return "nothing spent";
// Against last month: 1303 - 1120 = 183, 16.3 per cent (16.339).
if (word() !== "$183.00 more than this time last month (16.3%)") return "compare: " + word();
// The 31st of March looks back to the end of February.
if (!/Last month, to Feb 28/.test(cmp()) || !/to Mar 31/.test(cmp())) return "month end: " + cmp();
if (!/All of last month came to \$2,480\.55/.test(cmp())) return "last month's total: " + cmp();
// The ring's parts, drawn: each dash the right length, in order round the ring.
const circles = qq("circle");
if (circles.length !== 5) return "five parts: " + circles.length;
const len0 = parseFloat(circles[0].getAttribute("stroke-dasharray"));
if (Math.abs(len0 - (950 / 1303 * 100 - 0.7)) > 0.01) return "rent's arc: " + len0;
const off1 = parseFloat(circles[1].getAttribute("stroke-dashoffset"));
if (Math.abs(off1 + 950 / 1303 * 100) > 0.01) return "food's start: " + off1;
// A real finger on the ring: a point at a known turn. Food runs from 72.9% to 89.2%, so 80% round.
const svg = q("svg");
const point = (turn, radius = 46) => { svg.scrollIntoView({ block: "center" }); const r = svg.getBoundingClientRect(); const a = turn * 2 * Math.PI; return { x: r.left + r.width / 2 + Math.sin(a) * radius * r.width / 120, y: r.top + r.height / 2 - Math.cos(a) * radius * r.height / 120 }; };
const touch = async (p) => { await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] }); await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(260); };
await touch(point(0.8));
if (log() !== "Food") return "tap on food: " + log();
if (lines()[1].getAttribute("aria-pressed") !== "true") return "the list follows";
if (!/Food, 16%\$212\.40/.test(mid())) return "the middle follows: " + mid();
// Food against its own last month: 212.40 - 180.10 = 32.30, 17.9%.
if (word() !== "$32.30 more than this time last month (17.9%)") return "food compared: " + word();
if (!q(".ui-spendring-part-on") || circles[1].getAttribute("stroke-width") !== "20") return "marked";
// Rent, just past the top of the ring, and a tap by a wide finger, outside the drawn band.
await touch(point(0.05, 56));
if (log() !== "Rent") return "tap on rent: " + log();
if (word() !== "The same as this time last month") return "the same: " + word();
// A second tap on it lets go; a tap in the hole does too.
await touch(point(0.05));
if (log() !== "All") return "tap again: " + log();
await touch(point(0.05));
await touch(point(0, 0));
if (log() !== "All") return "the hole: " + log();
// A category with no last month says so.
await tap(lines()[2]);
if (log() !== "Travel" || !/Nothing to compare Travel with/.test(cmp())) return "no last month: " + cmp();
// A sliver of a part, by the list; less than last month for Fun: 41.20 against 60 is 18.80 less, 31.3%.
await tap(lines()[3]);
if (word() !== "$18.80 less than this time last month (31.3%)") return "less: " + word();
await tap(lines()[4]);
if (log() !== "Coffee") return "the thin one by the list: " + log();
// Keys: Enter on a line is a click.
lines()[0].focus(); lines()[0].click(); await wait(80);
if (log() !== "Rent") return "keys";
await tap(lines()[0]);
if (device === "tablet") {
    const a = q(".ui-spendring-ring").getBoundingClientRect(), b = q(".ui-spendring-list").getBoundingClientRect();
    if (!(b.left >= a.right - 1)) return "beside on a tablet";
} else {
    const a = q(".ui-spendring-ring").getBoundingClientRect(), b = q(".ui-spendring-list").getBoundingClientRect();
    if (b.top < a.bottom - 1) return "below on a phone";
}
