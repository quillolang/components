// mobile
const box = $(".ui-largetitle"), scroller = $(".ui-largetitle-scroll"), big = $(".ui-largetitle-big"), little = $(".ui-largetitle-small");
const p = () => Number(getComputedStyle(box).getPropertyValue("--ui-largetitle-p"));
const scale = () => new DOMMatrix(getComputedStyle(big).transform).a;
const fade = (el) => Number(getComputedStyle(el).opacity);
const at = async (y) => { scroller.scrollTop = y; await wait(60); };
const reach = big.offsetHeight;
if (reach < 40) return "large title's height: " + reach;
if (getComputedStyle(big).fontSize !== (device === "tablet" ? "40px" : "34px")) return "large size: " + getComputedStyle(big).fontSize;
if (big.tagName !== "H1" || big.textContent !== "Settings") return "the heading";
if (little.getAttribute("aria-hidden") !== "true") return "both titles reach a screen reader";
if (p() !== 0 || fade(big) !== 1 || fade(little) !== 0) return `start: ${p()} ${fade(big)} ${fade(little)}`;

// Half way: 1 - 0.25 / 2 of the size, and the small title not there yet.
await at(reach / 2);
if (Math.abs(p() - 0.5) > 0.03) return "half: " + p();
if (Math.abs(scale() - 0.875) > 0.01) return "half's scale: " + scale();
if (Math.abs(fade(big) - 0.3) > 0.05) return "half's fade: " + fade(big);
if (fade(little) !== 0) return "the small title came early: " + fade(little);

// At rest in the bar, the line under the bar on.
await at(reach);
if (p() !== 1) return "full: " + p();
if (Math.abs(scale() - 0.75) > 0.001) return "full scale: " + scale();
if (fade(big) !== 0 || fade(little) !== 1) return `full: ${fade(big)} ${fade(little)}`;
if (!box.classList.contains("ui-largetitle-done")) return "not done at full";
await at(reach + 300);
if (p() !== 1) return "past full: " + p();
await at(0);
if (p() !== 0 || box.classList.contains("ui-largetitle-done")) return "back at the top: " + p();

// A real finger, and the title follows the scroller, not the other way round.
const r = box.getBoundingClientRect(), mid = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
const top0 = big.getBoundingClientRect().bottom;
await fingers("touchStart", [mid]);
for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: mid.x, y: mid.y - 15 * i }]); await wait(16); }
await wait(80);
const y = scroller.scrollTop;
if (y < 80) return "the finger did not scroll: " + y;
if (Math.abs(p() - Math.min(1, y / reach)) > 0.02) return `at ${y}: ${p()}`;
await fingers("touchEnd", []);
await wait(300);
if (p() !== Math.min(1, scroller.scrollTop / reach)) return "after the finger: " + p();
await at(0);
if (big.getBoundingClientRect().bottom !== top0) return "the title did not come back";

// Slots.
await tap($(".ui-largetitle-back"));
await tap($(".ui-largetitle-end button"));
if (!/Back pressed 1, Edit pressed 1/.test($(".demo-note").textContent)) return $(".demo-note").textContent;
if ($(".ui-largetitle-back").getAttribute("aria-label") !== "Back to Home") return "back's name";

// On a phone on its side there is no room: small from the start, and the place kept.
if (device === "phone") {
    await at(240);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await wait(300);
    const side = getComputedStyle(big).display, f = fade(little), hid = little.getAttribute("aria-hidden"), kept = scroller.scrollTop;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await wait(300);
    if (side !== "none" || f !== 1) return `on its side: ${side} ${f}`;
    if (hid !== null) return "on its side the small title is hidden from screen readers";
    if (kept < 150) return "rotation lost the place: " + kept;
    if (getComputedStyle(big).display === "none" || big.offsetHeight !== reach) return "upright again: " + big.offsetHeight;
    if (little.getAttribute("aria-hidden") !== "true") return "upright: both reach a screen reader";
    await at(0);
    if (p() !== 0) return "upright, at the top: " + p();
}
