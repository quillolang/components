// mobile
const name = "ui-demo-welcome";
const forget = $("#welcome-carousel-demo-forget"), open = $("#welcome-carousel-demo-open");
const how = () => $("#welcome-carousel-demo-how").textContent;
document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name);
await tap(forget); await wait(300);
const box = () => $(".ui-welcome-carousel");
if (!box()) return "not shown on a first run";
const view = () => $(".ui-welcome-carousel-view"), track = () => $(".ui-welcome-carousel-track");
const current = () => $$(".ui-welcome-carousel-dot").findIndex((d) => d.getAttribute("aria-current") === "true");
// Where the track is: by hand during a drag, and from the box around it at rest.
const place = () => track().style.transform || `translateX(${view().style.getPropertyValue("--ui-welcome-carousel-at")})`;
const off = () => Math.round(track().getBoundingClientRect().left - view().getBoundingClientRect().left);
if ($$(".ui-welcome-carousel-dot").length !== 4) return "four dots for four pages";
if (current() !== 0 || place() !== "translateX(0%)") return "starts on the first page: " + place();

// Short of the threshold: springs back.
await drag(view(), -40, 0, 400); await wait(400);
if (current() !== 0 || place() !== "translateX(0%)") return "a short slow drag should spring back: " + current() + " " + place();
// Past a quarter of the width.
const width = view().clientWidth;
await drag(view(), -Math.round(width * 0.4), 0, 400); await wait(400);
if (current() !== 1 || place() !== "translateX(-100%)") return "a drag past a quarter should turn the page: " + current() + " " + place();
if (off() !== -width) return "the track should rest a whole page along: " + off() + " of " + width;
// A flick: far short of a quarter, but quick.
await drag(view(), -Math.round(width * 0.16), 0, 30); await wait(400);
if (current() !== 2 || place() !== "translateX(-200%)") return "a flick should turn the page: " + current() + " " + place();
// Back the other way.
await drag(view(), Math.round(width * 0.4), 0, 300); await wait(400);
if (current() !== 1) return "a drag to the right goes back: " + current();
// Up and down belongs to the page: no page turns, and the track never moved.
await drag(view(), 12, 120, 300); await wait(300);
if (current() !== 1 || place() !== "translateX(-100%)") return "a vertical drag must not turn the page: " + place();
// While a drag is on, it follows the finger, by style and not by state.
const m = (() => { const r = view().getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })();
await fingers("touchStart", [m]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: m.x - i * 10, y: m.y }]); await wait(16); }
await wait(120);       // the last move reaches the page a frame or two later
if (!place().includes("- 60px")) return "the track should follow the finger: " + place();
if (!box().classList.contains("ui-welcome-carousel-held")) return "held class while dragging";
// What the place at rest is worked out from, changed under the finger: the page must not turn, nor the track jump.
key(box(), "ArrowRight"); await wait(120);
if (current() !== 1) return "a page turned under a finger: " + current();
if (!place().includes("- 60px")) return "a key during a drag moved the track: " + place();
if (getComputedStyle(view()).touchAction !== "pan-y") return "touch-action: " + getComputedStyle(view()).touchAction;
// The system takes the gesture: back, with no page turned.
await fingers("touchCancel", []); await wait(400);
if (current() !== 1 || place() !== "translateX(-100%)") return "a cancelled gesture should spring back: " + place();
if (box().classList.contains("ui-welcome-carousel-held")) return "still held after a cancel";
// Past the first page's end it does not move on, and comes back.
await tap($$(".ui-welcome-carousel-dot")[0]); await wait(350);
if (current() !== 0) return "a dot goes to its page";
await drag(view(), 160, 0, 300); await wait(400);
if (current() !== 0 || place() !== "translateX(0%)") return "nothing before the first page: " + place();

// The keyboard's route.
key(box(), "ArrowRight"); await wait(100);
if (current() !== 1) return "ArrowRight goes forward";
key(box(), "End"); await wait(100);
if (current() !== 3) return "End goes to the last";
key(box(), "ArrowRight"); await wait(100);
if (current() !== 3) return "nothing past the last";
key(box(), "ArrowLeft"); await wait(100);
if (current() !== 2) return "ArrowLeft goes back";
key(box(), "Home"); await wait(100);
if (current() !== 0) return "Home goes to the first";

// Next, and only the current page can be reached.
const buttons = () => $$(".ui-welcome-carousel .ui-btn");
const named = (t) => buttons().find((b) => b.textContent.trim() === t);
await tap(named("Next")); await wait(350);
if (current() !== 1) return "Next turns the page";
const pages = $$(".ui-welcome-carousel-page");
if (!pages[0].inert || pages[1].inert || pages[0].getAttribute("aria-hidden") !== "true") return "pages not showing should be out of reach";
if (!$(".ui-welcome-carousel [aria-live]").textContent.includes("Page 2 of 4: Remember where you were")) return "says the page: " + $(".ui-welcome-carousel [aria-live]").textContent;

// Turned: state and place stay, the track still fits.
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(300);
if (current() !== 1 || place() !== "translateX(-100%)") return "rotation lost the page: " + place();
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300);

// Skip ends it, and it is remembered.
await tap(named("Skip")); await wait(300);
if (box()) return "Skip should close it";
if (how() !== "Done: skipped") return "on_done(skipped): " + how();
if (localStorage.getItem(name) !== "1" || !document.cookie.includes(name + "=1")) return "should be kept in both: " + document.cookie;
await tap(open); await wait(300);
if (box()) return "shown once: it came back";
// Only the cookie, as a phone app has at its next launch, on a new port.
localStorage.removeItem(name);
await tap(open); await wait(300);
if (box()) return "the cookie alone should do";
// Only localStorage, as where a cookie has run out.
localStorage.setItem(name, "1"); document.cookie = name + "=; max-age=0; path=/";
await tap(open); await wait(300);
if (box()) return "localStorage alone should do";

// Get started on the last page, and Skip is gone there.
await tap(forget); await wait(300);
if (!box()) return "forgetting should show it again";
key(box(), "End"); await wait(350);
if (!named("Skip") || getComputedStyle(named("Skip")).visibility !== "hidden") return "no Skip on the last page";
if (named("Next")) return "no Next on the last page";
await tap(named("Get started")); await wait(300);
if (box() || how() !== "Done: finished") return "Get started ends it: " + how();

// Right to left: forward is a swipe to the right, and the track runs the other way.
const framed = $("#welcome-carousel-demo-frame");
framed.dir = "rtl"; await tap(forget); await wait(300);
if (place() !== "translateX(0%)") return "rtl starts on the first page: " + place();
await drag(view(), Math.round(view().clientWidth * 0.4), 0, 400); await wait(400);
if (current() !== 1 || place() !== "translateX(100%)") return "rtl: a swipe right goes forward: " + current() + " " + place();
await drag(view(), -Math.round(view().clientWidth * 0.4), 0, 400); await wait(400);
if (current() !== 0) return "rtl: a swipe left goes back: " + current();
key(box(), "ArrowLeft"); await wait(100);
if (current() !== 1) return "rtl: ArrowLeft goes forward: " + current();
framed.dir = "";

// A tablet: picture beside words.
await tap(forget); await wait(300);
const page = $$(".ui-welcome-carousel-page")[0], dir = getComputedStyle(page).flexDirection;
const wide = innerWidth >= 600;
if (dir !== (wide ? "row" : "column")) return "layout at " + innerWidth + ": " + dir;
if (wide) {
    const a = page.querySelector(".ui-welcome-carousel-art").getBoundingClientRect(), t = page.querySelector(".ui-welcome-carousel-words").getBoundingClientRect();
    if (a.right > t.left) return "the picture should sit beside the words";
    if (page.querySelector(".ui-welcome-carousel-art").offsetWidth !== 180) return "a larger picture";
}
await tap(open); await wait(200);
localStorage.removeItem(name); document.cookie = name + "=; max-age=0; path=/";
