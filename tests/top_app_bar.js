// mobile
const bar = $(".ui-topbar-bar"), scroller = $(".ui-topbar-scroll"), frame = $(".ui-topbar");
const hidden = () => bar.classList.contains("ui-topbar-hidden");
const tinted = () => bar.classList.contains("ui-topbar-tinted");
const hides = () => Number(/went or came back (\d+)/.exec(document.body.textContent)[1]);
const at = async (y) => { scroller.scrollTop = y; await wait(60); };
const H = device === "tablet" ? 64 : 56;
if (bar.offsetHeight !== H) return `bar is ${bar.offsetHeight} tall, wanted ${H}`;
if (hidden() || tinted()) return "starts hidden or tinted";
if (bar.getBoundingClientRect().top !== frame.getBoundingClientRect().top) return "not at the top";
const flat = getComputedStyle(bar).backgroundColor;

// The first row is clear of the bar.
const first = scroller.querySelector("p");
if (Math.round(first.getBoundingClientRect().top - frame.getBoundingClientRect().top) !== H) return "the first row is under the bar";

// A little scroll: tinted, not gone. Inside the bar's own height it never goes.
await at(30);
if (!tinted()) return "no tint with content under it";
await wait(260);
if (getComputedStyle(bar).backgroundColor === flat) return "the tint changed nothing";
if (hidden()) return "hid within its own height";
await at(0);
if (tinted()) return "tinted at the top";

// A real finger: up the screen scrolls the content down, and the bar goes.
const r = frame.getBoundingClientRect(), mid = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
await fingers("touchStart", [mid]);
for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: mid.x, y: mid.y - 25 * i }]); await wait(16); }
await wait(80);
if (scroller.scrollTop < 200) return "the finger did not scroll: " + scroller.scrollTop;
if (!hidden()) return "scrolling down did not hide it at " + scroller.scrollTop;
// ... and with the same finger still down, back down the screen brings it back.
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: mid.x, y: mid.y - 300 + 15 * i }]); await wait(16); }
await wait(80);
await fingers("touchEnd", []);
await wait(300);
if (hidden()) return "scrolling up did not bring it back at " + scroller.scrollTop;
if (hides() !== 2) return "on_hide called " + hides() + " times, wanted 2";
if (Math.round(bar.getBoundingClientRect().top - r.top) !== 0) return "not back in place: " + bar.getBoundingClientRect().top;

// Under the slop a wobble does nothing, each way.
await at(400);
await at(420);
const was = hidden();
if (!was) return "420 past a bar: not hidden";
await at(412);
await at(415);
await at(410);
if (!hidden()) return "a wobble of 10 px brought it back";
await at(398);
if (hidden()) return "a turn of 22 px did not bring it back";
await at(405);
if (hidden()) return "a wobble of 7 px hid it";

// Hidden, it is above the frame, and the focus brings it back.
await at(800);
await wait(300);
if (Math.round(bar.getBoundingClientRect().bottom - r.top) !== 0) return "hidden, but its bottom is at " + (bar.getBoundingClientRect().bottom - r.top);
$(".ui-topbar-nav").focus();
await wait(300);
if (hidden()) return "the focus did not bring it back";
if (Math.round(bar.getBoundingClientRect().top - r.top) !== 0) return "focus: not in place";

// A tap: the nav button and the action.
await at(0);
await wait(250);
await tap($(".ui-topbar-nav"));
await tap($(".ui-topbar-actions button"));
if (!document.body.textContent.includes("Pressed 11")) return "taps: " + /Pressed \d+/.exec(document.body.textContent);

// To the very end the scroller stays hidden; reaching the top shows it.
scroller.scrollTop = scroller.scrollHeight;
await wait(100);
if (!hidden()) return "at the end, shown";
await at(0);
if (hidden() || tinted()) return "at the top again";

// Reduced motion hides at once.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(50);
await at(600);
await at(900);
const still = getComputedStyle(bar).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return "transition with reduced motion: " + still;
await at(0);

// hide={false}: a tint and no more; and the other icon.
const icon = () => $(".ui-topbar-nav path").getAttribute("d");
const menu = icon();
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Keep the bar").click();
await wait(60);
if (icon() === menu || $(".ui-topbar-nav").getAttribute("aria-label") !== "Back") return "nav_icon back";
await at(500);
await at(900);
if (hidden()) return "hide={false} hid it";
if (!tinted()) return "hide={false} has no tint";
await at(0);

// On its side a phone gives it less room; the place is kept.
if (device === "phone") {
    await at(300);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await wait(300);
    const low = bar.offsetHeight, kept = scroller.scrollTop;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await wait(300);
    if (low !== 48) return "on its side the bar is " + low;
    if (kept < 200) return "rotation lost the place: " + kept;
    await at(0);
}

// The safe area: the bar's own height, and the notch's on top of it.
document.querySelector("meta[name=viewport]").content += ", viewport-fit=cover";
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 0, right: 0, bottom: 34 } });
await wait(200);
const safe = bar.offsetHeight;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } });
if (safe !== H + 47) return `with a notch the bar is ${safe}, wanted ${H + 47}`;
