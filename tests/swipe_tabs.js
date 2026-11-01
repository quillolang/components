// mobile
const box = $(".ui-swipetabs"), track = box.querySelector(".ui-swipetabs-track"), strip = box.querySelector(".ui-swipetabs-strip"), line = box.querySelector(".ui-swipetabs-line");
const tabs = [...box.querySelectorAll(".ui-swipetabs-tab")], W = () => track.clientWidth;
const place = () => track.scrollLeft / W();
const built = () => [...box.querySelectorAll("[data-built]")].map((d) => d.dataset.built).join();
const note = () => $(".demo-note").textContent;
const sel = () => tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
const spot = () => { const m = new DOMMatrix(getComputedStyle(line).transform); return { x: m.m41, w: m.a }; };
const near = (a, b, by = 1) => Math.abs(a - b) <= by;
if (W() < innerWidth - 2) return "the pages are " + W() + " wide";
if (built() !== "top") return "built at the start: " + built();
if (box.querySelectorAll(".ui-swipetabs-wait").length !== 4) return "pages waiting: " + box.querySelectorAll(".ui-swipetabs-wait").length;

// Starting on the third tab, from a list with a bad row and a tab given twice.
const third = $$(".ui-swipetabs")[1], t3 = third.querySelector(".ui-swipetabs-track"), tabs3 = [...third.querySelectorAll(".ui-swipetabs-tab")];
if (tabs3.length !== 3) return "the second list's tabs: " + tabs3.length;
if (tabs3.findIndex((t) => t.getAttribute("aria-selected") === "true") !== 2) return "the second list's selected";
if (t3.scrollLeft !== 2 * t3.clientWidth) return "start at the third: " + t3.scrollLeft;
if ([...third.querySelectorAll("[data-third]")].map((d) => d.dataset.third).join() !== "business") return "start at the third, built";
const sp3 = new DOMMatrix(getComputedStyle(third.querySelector(".ui-swipetabs-line")).transform);
if (!near(sp3.m41, tabs3[2].offsetLeft) || !near(sp3.a, tabs3[2].offsetWidth)) return `the line at the third: ${sp3.m41} ${sp3.a}`;
if (sel() !== 0) return "selected: " + sel();
if (tabs[0].getAttribute("aria-controls") !== "swipe-tabs-demo-page-top") return "aria-controls";
if ($("#swipe-tabs-demo-page-top").getAttribute("aria-labelledby") !== tabs[0].id) return "aria-labelledby";
if (!$("#swipe-tabs-demo-page-local").hasAttribute("inert")) return "a page off screen can take the focus";
if (!near(spot().x, tabs[0].offsetLeft) || !near(spot().w, tabs[0].offsetWidth)) return `line at the start: ${JSON.stringify(spot())}`;

if (device === "tablet") {
    // A tablet's tabs share the width.
    if (strip.scrollWidth > strip.clientWidth) return "a tablet's strip scrolls";
    if (!near(tabs[0].offsetWidth, 160, 1)) return "tab width: " + tabs[0].offsetWidth;
    if (!near(tabs[0].offsetLeft, (strip.clientWidth - 800) / 2, 1)) return "tabs not in the middle: " + tabs[0].offsetLeft;
} else {
    if (strip.scrollWidth <= strip.clientWidth) return "a phone's strip should scroll in this demo: " + strip.scrollWidth;
}

// A drag: the line follows, between the two tabs' places and widths, and the next page is built.
const r = track.getBoundingClientRect(), y = r.top + 300, sx = r.right - 30;
await fingers("touchStart", [{ x: sx, y }]);
const by = W() * 0.3, steps = 12;
for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: sx - by * i / steps, y }]); await wait(30); }
await wait(120);
const p = place();
if (p < 0.1 || p > 0.45) return "the finger did not move the pages: " + p;
const wantX = tabs[0].offsetLeft + (tabs[1].offsetLeft - tabs[0].offsetLeft) * p, wantW = tabs[0].offsetWidth + (tabs[1].offsetWidth - tabs[0].offsetWidth) * p;
if (!near(spot().x, wantX, 2) || !near(spot().w, wantW, 2)) return `line at ${p}: ${JSON.stringify(spot())}, wanted ${wantX} ${wantW}`;
if (built() !== "top,local") return "built during a drag: " + built();
if (sel() !== 0) return "selected changed before landing";
// Released short and slowly it goes back, and nothing is called.
await wait(150);
await fingers("touchEnd", []);
await wait(700);
if (place() !== 0) return "a short drag: " + place();
if (sel() !== 0 || note() !== "Showing top, after 0 changes") return note();
if (!near(spot().x, tabs[0].offsetLeft)) return "the line after a spring back";

// A drag past half lands on the next.
await drag(track, -W() * 0.7, 0, 250);
await wait(800);
if (place() !== 1) return "a long drag: " + place();
if (sel() !== 1) return "selected after a swipe: " + sel();
if (note() !== "Showing local, after 1 change") return note();
if (!near(spot().x, tabs[1].offsetLeft) || !near(spot().w, tabs[1].offsetWidth)) return "line after a swipe";
if ($("#swipe-tabs-demo-page-local").hasAttribute("inert") || !$("#swipe-tabs-demo-page-top").hasAttribute("inert")) return "inert after a swipe";

// A flick, short but quick.
await drag(track, -W() * 0.3, 0, 40);
await wait(800);
if (place() !== 2) return "a flick: " + place();
if (note() !== "Showing business, after 2 changes") return note();
await drag(track, W() * 0.7, 0, 200);
await wait(800);
if (place() !== 1) return "swiping back: " + place();

// Up and down belongs to the page: no sideways move, and it keeps its place.
const page = $("#swipe-tabs-demo-page-local");
page.scrollTop = 0;
await drag(page, 6, -240, 250);
await wait(200);
if (page.scrollTop < 100) return "a vertical drag did not scroll the page: " + page.scrollTop;
if (place() !== 1) return "a vertical drag changed the page";
const kept = page.scrollTop;

// A page's state lasts: a page once built is the same page.
const like = page.querySelector(".ui-btn");
like.click();
await wait(50);
await tap(tabs[0]);
await wait(800);
if (place() !== 0 || sel() !== 0) return "a tap on a tab: " + place();
await tap(tabs[1]);
await wait(800);
if (page.scrollTop !== kept) return "the page's place: " + page.scrollTop;
if (like.textContent.trim() !== "local liked 1" || !like.isConnected) return "the page's state: " + like.textContent;

// A tap far away builds that page only, and lands in one call.
const before = note();
tabs[4].scrollIntoView({ inline: "nearest", block: "nearest" });
await wait(100);
await tap(tabs[4]);
await wait(1200);
if (place() !== 4 || sel() !== 4) return "a far tap: " + place();
if (built().includes("sport")) return "a far tap built what it passed: " + built();
if (!built().includes("weather")) return "a far tap did not build: " + built();
if (Number(/after (\d+)/.exec(note())[1]) !== Number(/after (\d+)/.exec(before)[1]) + 1) return "a far tap called on_change more than once: " + note();
if (device === "phone") {
    await wait(500);
    const t = tabs[4].getBoundingClientRect();
    if (t.left < 0 || t.right > innerWidth + 1) return "the current tab is out of view";
}

// Keys: arrows wrap, Home, End, the focus going along.
tabs[4].focus();
key(tabs[4], "ArrowRight");
await wait(1200);
if (place() !== 0 || document.activeElement !== tabs[0]) return "ArrowRight wraps: " + place();
key(tabs[0], "ArrowRight");
await wait(800);
if (place() !== 1) return "ArrowRight: " + place();
key(tabs[1], "End");
await wait(1100);
if (place() !== 4) return "End: " + place();
key(tabs[4], "Home");
await wait(1400);
if (place() !== 0) return "Home: " + place();
if (tabs[0].getAttribute("tabindex") !== "0" || tabs[1].getAttribute("tabindex") !== "-1") return "roving tabindex";

// current: a change from outside goes there.
const noted = note();
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Go to sport").click();
await wait(1100);
if (place() !== 3 || sel() !== 3) return "current: " + place();
if (note() !== noted) return "current was reported as a move: " + note();

// Rotation: the same page, at the new width, and the line where its tab now is.
await tap(tabs[2]);
await wait(900);
const w0 = innerWidth, h0 = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(400);
const turned = place(), turnedSel = sel(), wide = W(), sx2 = spot().x, want2 = tabs[2].offsetLeft;
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (wide < h0 - 2) return "turned width: " + wide;
if (turned !== 2 || turnedSel !== 2) return `turned: on ${turned}, tab ${turnedSel}`;
if (!near(sx2, want2, 2)) return `line when turned: ${sx2}, wanted ${want2}`;
if (place() !== 2) return "upright again: " + place();
