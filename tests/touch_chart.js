// mobile
await wait(200);
const ex = $("#touch-chart-exact");
const plot = ex.querySelector(".ui-tchart-plot");
const tip = () => ex.querySelector(".ui-tchart-tip");
const cross = () => ex.querySelector(".ui-tchart-cross");
const crossAt = () => parseFloat(cross().style.transform.slice(11));
const said = () => $("#touch-chart-said").textContent;
const range = () => $("#touch-chart-range").textContent;
const span = () => ex.querySelector(".ui-tchart-span").textContent;
const stats = () => [...ex.querySelectorAll(".ui-tchart-stats dd")].map((d) => d.textContent).join(" | ");
const rowsNow = () => [...ex.querySelectorAll("tbody tr")];
const btn = (s) => ex.querySelector(s);

// All 61: $100 to $160.
if (span() !== "D0 to D60") return "span: " + span();
if (stats() !== "$100 | $160 | $60") return "stats: " + stats();
if (rowsNow().length !== 61) return "the table has all: " + rowsNow().length;
if (rowsNow()[3].textContent !== "D3$103") return "a row: " + rowsNow()[3].textContent;
if (ex.querySelector("caption").textContent !== "Worked by hand, D0 to D60") return "caption: " + ex.querySelector("caption").textContent;
// The line: first at 0, last at 1000; the scale runs 94 to 166, so $100 sits (166 - 100) * 300 / 72 = 275 down.
const d0 = ex.querySelector(".ui-tchart-line").getAttribute("d");
if (!d0.startsWith("M0 275")) return "first point: " + d0.slice(0, 20);
if (!d0.endsWith("L1000 25")) return "last point: " + d0.slice(-20);
if ((d0.match(/L/g) ?? []).length !== 60) return "sixty joins";

// Before a touch.
if (!cross().hidden || !tip().hidden) return "nothing shows before a touch";

// A drag to the right: 75% is point 45.
const w = plot.getBoundingClientRect().width;
await drag(plot, 0.25 * w, 0, 300);
if (said() !== "45 D45 145") return "drag: " + said();
if (tip().textContent !== "D45: $145") return "the value: " + tip().textContent;
if (cross().hidden || tip().hidden) return "they show now";
if (crossAt() !== 75) return "crosshair at 75%: " + crossAt();
if (tip().style.left !== "75%" || tip().style.transform !== "translateX(-75%)") return "the label: " + tip().style.left + " " + tip().style.transform;
if (plot.getAttribute("aria-valuetext") !== "D45: $145") return "aria-valuetext: " + plot.getAttribute("aria-valuetext");
if (Math.abs(parseFloat(ex.querySelector(".ui-tchart-pt").style.top) - (166 - 145) * 100 / 72) > 0.01) return "the dot on the line: " + ex.querySelector(".ui-tchart-pt").style.top;

// At each end the label stays inside the plot.
await drag(plot, 0.5 * w, 0, 200);
if (said() !== "60 D60 160") return "right end: " + said();
const t1 = tip().getBoundingClientRect(), p1 = plot.getBoundingClientRect();
if (t1.right > p1.right + 0.5) return "the label runs off the right: " + t1.right + " over " + p1.right;
await drag(plot, -0.5 * w, 0, 200);
if (said() !== "0 D0 100") return "left end: " + said();
if (tip().getBoundingClientRect().left < plot.getBoundingClientRect().left - 0.5) return "the label runs off the left";

// A cancelled drag puts back what was there, and tells nobody.
const m = middle(plot);
await fingers("touchStart", [m]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: m.x + 0.05 * w * i, y: m.y }]); await wait(16); }
await wait(30);
if (tip().textContent !== "D48: $148") return "during a drag: " + tip().textContent;
if (said() !== "0 D0 100") return "the choice waits for the lift: " + said();
await fingers("touchCancel", []);
await wait(100);
if (tip().textContent !== "D0: $100") return "cancel goes back: " + tip().textContent;
if (crossAt() !== 0) return "the line goes back: " + crossAt();

// Up and down is the page's. Clear first, by key.
plot.focus();
const press = (k) => plot.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
press("Escape");
await wait(50);
if (said() !== "Cleared.") return "Escape: " + said();
if (!cross().hidden) return "Escape hides the line";
await drag(plot, 2, 110, 200);
if (!cross().hidden) return "a vertical drag should not scrub";
window.scrollTo(0, 0);
await wait(50);

// A pinch to double: half the range, about the middle: 15 to 45.
await pinch(plot, 2);
await wait(100);
if (range() !== "15 to 45") return "pinch out: " + range();
if (span() !== "D15 to D45") return "span after a pinch: " + span();
if (stats() !== "$115 | $145 | $30") return "stats follow the range: " + stats();
if (rowsNow().length !== 31 || rowsNow()[0].textContent !== "D15$115") return "the table follows: " + rowsNow().length;
// The scale fits what is in view: 112 to 148, so $115 is at (148 - 115) * 300 / 36 = 275.
const d1 = ex.querySelector(".ui-tchart-line").getAttribute("d");
if (!d1.startsWith("M0 275")) return "the scale should fit the range: " + d1.slice(0, 20);
if (ex.querySelector(".ui-tchart-plot svg").style.transform !== "") return "nothing stretched is left after the lift: " + ex.querySelector(".ui-tchart-plot svg").style.transform;
if (plot.classList.contains("ui-tchart-pinching")) return "the pinch is over";
if (btn(".ui-tchart-out").disabled !== false || btn(".ui-tchart-back").disabled !== false) return "Zoom out and Earlier are on now";

// A pinch in: back to all of it, and no further.
await pinch(plot, 0.25);
await wait(100);
if (range() !== "0 to 60") return "pinch in: " + range();
await pinch(plot, 0.5);
await wait(100);
if (range() !== "0 to 60") return "no further out: " + range();

// A hard pinch stops at the fewest allowed points: 5, about the middle: 60 / 2 - 2.5, rounded.
await pinch(plot, 3);
await wait(50);
await pinch(plot, 3);
await wait(50);
await pinch(plot, 3);
await wait(100);
const [a, b] = range().split(" to ").map(Number);
if (b - a !== 5) return "least: " + range();
if (!btn(".ui-tchart-in").disabled) return "no further in";

// A pinch cancelled by the system leaves the range as it was.
await tap(btn(".ui-tchart-out"));
await tap(btn(".ui-tchart-out"));
await tap(btn(".ui-tchart-out"));
await tap(btn(".ui-tchart-out"));
if (range() !== "0 to 60") return "Zoom out by button: " + range();
const pm = middle(plot);
await fingers("touchStart", [{ x: pm.x - 40, y: pm.y, id: 1 }, { x: pm.x + 40, y: pm.y, id: 2 }]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: pm.x - 40 - 8 * i, y: pm.y, id: 1 }, { x: pm.x + 40 + 8 * i, y: pm.y, id: 2 }]); await wait(16); }
await wait(30);
const moving = ex.querySelector(".ui-tchart-plot svg").style.transform;
if (!moving.includes("scaleX")) return "the picture follows the fingers: " + moving;
await fingers("touchCancel", []);
await wait(100);
if (range() !== "0 to 60") return "a cancelled pinch: " + range();
if (ex.querySelector(".ui-tchart-plot svg").style.transform !== "") return "a cancelled pinch leaves no stretch";
if (span() !== "D0 to D60") return "the words go back: " + span();

// Two fingers apart and sliding: a pinch with a slide keeps what was under them under them.
await fingers("touchStart", [{ x: pm.x - 40, y: pm.y, id: 1 }, { x: pm.x + 40, y: pm.y, id: 2 }]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: pm.x - 40 - 5 * i, y: pm.y, id: 1 }, { x: pm.x + 40 + 5 * i, y: pm.y, id: 2 }]); await wait(16); }
const before = range();
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: pm.x - 80 + 0.05 * w * i, y: pm.y, id: 1 }, { x: pm.x + 80 + 0.05 * w * i, y: pm.y, id: 2 }]); await wait(16); }
await fingers("touchEnd", []);
await wait(150);
// 40 to 80 between the fingers is a scale of 2: a span of 30. A slide of 0.3 widths to the right shows what is 0.3 * 30 = 9 points earlier.
if (range() !== "6 to 36") return "slide: " + range();

// The range buttons, and pressed state.
const chips = ex.querySelectorAll(".ui-tchart-keys button");
await tap(chips[0]);
if (range() !== "51 to 60") return "Last 10: " + range();
if (chips[0].getAttribute("aria-pressed") !== "true") return "pressed";
if (!btn(".ui-tchart-on").disabled) return "no later than the end";
await tap(chips[1]);
if (range() !== "0 to 60") return "All: " + range();
if (chips[1].getAttribute("aria-pressed") !== "true") return "All pressed";

// Zoom, Earlier and Later by button.
await tap(btn(".ui-tchart-in"));
if (range() !== "15 to 45") return "Zoom in: " + range();
await tap(btn(".ui-tchart-back"));
if (range() !== "0 to 30") return "Earlier, half a screen: " + range();
await tap(btn(".ui-tchart-on"));
if (range() !== "15 to 45") return "Later: " + range();

// A choice outside a new range goes.
press("End");
await wait(30);
if (said() !== "45 D45 145") return "End: " + said();
await tap(btn(".ui-tchart-back"));
if (!cross().hidden) return "a point out of view should go";

// Keys.
press("Home");
await wait(30);
if (said() !== "0 D0 100") return "Home: " + said();
press("ArrowRight");
await wait(30);
press("ArrowRight");
await wait(30);
if (said() !== "2 D2 102") return "Right: " + said();
press("ArrowLeft");
await wait(30);
if (said() !== "1 D1 101") return "Left: " + said();
press("+");
await wait(30);
// Zoomed about the chosen point, 1/30 across: 1 - 15/30 = 0.5, rounded up to 1 to 16, and clipped to start at 0 or 1.
if (range() !== "1 to 16" && range() !== "0 to 15") return "+: " + range();
press("-");
await wait(30);
press("-");
await wait(30);
if (range() !== "0 to 60") return "-: " + range();
press("Escape");
await wait(30);

// Holes: the line lifts over them, the lone 7 keeps a dot, the table says so, nothing throws.
const holes = $("#touch-chart-holes");
const d2 = holes.querySelector(".ui-tchart-line").getAttribute("d");
if ((d2.match(/M/g) ?? []).length !== 3) return "three pieces: " + d2;
if ((d2.match(/h\.01/g) ?? []).length !== 1) return "a lone point gets a dot: " + d2;
const cell = [...holes.querySelectorAll("tbody tr")].map((r) => r.lastChild.textContent).join();
if (cell !== "5,6,no value,no value,7,no value,8,9") return "table with holes: " + cell;
const hp = holes.querySelector(".ui-tchart-plot");
await drag(hp, -1, 0, 50);
const hw = hp.getBoundingClientRect().width, hm = middle(hp);
await tap(hp);
// The middle of 0 to 7 is 3.5, rounded to 4: the 7. Three-sevenths across is 3, a hole.
await fingers("touchStart", [{ x: hp.getBoundingClientRect().left + hw * 3 / 7, y: hm.y }]);
await fingers("touchEnd", []);
await wait(200);
if (holes.querySelector(".ui-tchart-tip").textContent !== "4: no value") return "a hole reads as one: " + holes.querySelector(".ui-tchart-tip").textContent;
if (!holes.querySelector(".ui-tchart-pt").hidden) return "no dot in a hole";

// The thinned long line and bad data.
const season = $("#touch-chart-season");
if (season.querySelector(".ui-tchart-plot svg path") === null) return "the season draws";
// Far down a phone's page the visual viewport can stand off the layout's at scale 1, and touches
// count from the visual one, so harness's tap lands low. Allow for it.
const chip30 = season.querySelector(".ui-tchart-keys button");
chip30.scrollIntoView({ block: "center" });
await wait(80);
const r30 = chip30.getBoundingClientRect();
await fingers("touchStart", [{ x: r30.left + r30.width / 2 - visualViewport.offsetLeft, y: r30.top + r30.height / 2 - visualViewport.offsetTop }]);
await fingers("touchEnd", []);
await wait(300);
if (season.querySelector(".ui-tchart-span").textContent !== "28 Sep to 27 Oct") return "30 days: " + season.querySelector(".ui-tchart-span").textContent;
// 5000 points thin to 300 stretches, a low and a high each, and the one spike of 100 at point 2345 stays.
const long = $("#touch-chart-long");
const dl = long.querySelector(".ui-tchart-line").getAttribute("d");
const count = (dl.match(/[ML]/g) ?? []).length;
if (count > 602 || count < 500) return "thinned: " + count;
const lys = [...dl.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((x) => +x[1]);
// The scale runs -10 to 110: 100 sits (110 - 100) * 300 / 120 = 25 down.
if (Math.min(...lys) !== 25) return "the spike should survive: " + Math.min(...lys);
const none = $("#touch-chart-none");
if (none.querySelector(".ui-tchart-none").textContent !== "Nothing to show yet.") return "empty: " + none.textContent;
if (none.querySelector(".ui-tchart-plot")) return "no plot for nothing";

// A tablet sets the numbers beside the chart.
const cols = getComputedStyle(ex.querySelector(".ui-tchart-body")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns on " + device + ": " + cols;

// A second finger during a scrub is a pinch: what the first was reading goes.
{
    const ex2 = $("#touch-chart-exact"), pl = ex2.querySelector(".ui-tchart-plot");
    ex2.scrollIntoView({ block: "center" });
    await wait(80);
    const b = pl.getBoundingClientRect(), mid = { x: b.left + b.width / 2 - visualViewport.offsetLeft, y: b.top + b.height / 2 - visualViewport.offsetTop };
    await fingers("touchStart", [{ x: mid.x - 40, y: mid.y, id: 1 }]);
    for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: mid.x - 40 + 4 * i, y: mid.y, id: 1 }]); await wait(16); }
    await wait(30);
    if (ex2.querySelector(".ui-tchart-cross").hidden) return "a scrub shows the line";
    await fingers("touchStart", [{ x: mid.x - 24, y: mid.y, id: 1 }, { x: mid.x + 40, y: mid.y, id: 2 }]);
    await wait(30);
    await fingers("touchEnd", []);
    await wait(150);
    if (!ex2.querySelector(".ui-tchart-cross").hidden) return "the line goes with a second finger";
}

// New data arrives with a finger on the chart: the line, the dot and the value stay with the finger, not with what was chosen.
{
    const ex3 = $("#touch-chart-exact"), pl = ex3.querySelector(".ui-tchart-plot");
    ex3.scrollIntoView({ block: "center" });
    await wait(80);
    pl.focus();
    pl.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true, cancelable: true }));
    await wait(50);
    const b = pl.getBoundingClientRect(), mid = { x: b.left + b.width / 2 - visualViewport.offsetLeft, y: b.top + b.height / 2 - visualViewport.offsetTop };
    await fingers("touchStart", [mid]);
    for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: mid.x + 0.05 * b.width * i, y: mid.y }]); await wait(16); }
    await wait(30);
    const t = ex3.querySelector(".ui-tchart-tip"), c = ex3.querySelector(".ui-tchart-cross");
    if (t.textContent !== "D42: $142") return "before the data: " + t.textContent;
    const at = c.style.transform;
    $("#touch-chart-stir").click();
    await wait(120);
    if (c.style.transform !== at) return "new data moved the line under a finger: " + c.style.transform;
    if (t.textContent !== "D42: $142") return "new data changed the value under a finger: " + t.textContent;
    await fingers("touchEnd", []);
    await wait(120);
    if ($("#touch-chart-said").textContent !== "42 D42 142") return "the lift after new data: " + $("#touch-chart-said").textContent;
}

