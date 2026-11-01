// mobile
const given = () => $$(".ui-batbadge")[0];
const real = () => $("#battery-badge-demo-real .ui-batbadge");
const realBox = () => $("#battery-badge-demo-real");
const range = $("#battery-badge-demo-level");
const asked = () => $("#battery-badge-demo-asked").textContent;
const html = document.documentElement;
const set = async (n) => { type(range, String(n)); await wait(60); };
const back = async () => { document.dispatchEvent(new Event("visibilitychange")); await wait(150); };

// A level given, which reads as it should and asks nothing.
await wait(100);
if (given().textContent.replace(/\s+/g, " ").trim() !== "64%") return "given: " + given().textContent;
if (given().getAttribute("aria-label") !== "Battery 64 percent") return "aria: " + given().getAttribute("aria-label");
if (Math.abs(given().querySelector(".ui-batbadge-fill").getAttribute("width") - 12.2) > 0.01) return "fill: " + given().querySelector(".ui-batbadge-fill").getAttribute("width");
if (html.hasAttribute("data-go-easy")) return "asked at 64%";
if (!["0.1s", "1s"].includes(getComputedStyle($(".ui-batbadge-demo-spin")).animationDuration)) return "spin duration";

// Falls to the low line: asks once, in all three ways, and the page's CSS follows.
let events = [];
const on = (e) => events.push(e.detail);
document.addEventListener("ui-go-easy", on);
await set(21);
if (html.hasAttribute("data-go-easy")) return "asked at 21%";
await set(20);
if (html.getAttribute("data-go-easy") !== "battery") return "no request at 20%";
if (events.length !== 1 || events[0].on !== true || events[0].level !== 0.2) return "event: " + JSON.stringify(events);
if (asked() !== "Go easy at 20%. (1)") return "callback: " + asked();
if (getComputedStyle($(".ui-batbadge-demo-spin")).animationName !== "none") return "the page's CSS did not follow";
if (!given().classList.contains("ui-batbadge-low")) return "tone at 20: " + given().className;
if ($(".ui-batbadge-ask").textContent !== "Battery low: this page is doing less to save it.") return "words";

// Wavering above the line does not let go: up to 25 it holds, at 26 it ends.
await set(21); await set(20); await set(25);
if (asked() !== "Go easy at 20%. (1)") return "wavering: " + asked();
await set(26);
if (html.hasAttribute("data-go-easy") || asked() !== "Back to normal at 26%. (2)") return "letting go: " + asked();

// Charging never asks, even at 5%.
$("#battery-badge-demo-plug").click();
await wait(60);
await set(5);
if (html.hasAttribute("data-go-easy")) return "asked while charging";
if (!given().textContent.includes("Charging")) return "charging word: " + given().textContent;
if (!given().classList.contains("ui-batbadge-good")) return "tone charging: " + given().className;
if (given().getAttribute("aria-label") !== "Battery 5 percent, charging") return "aria charging: " + given().getAttribute("aria-label");
// Unplugged at 5 asks.
await tap($("#battery-badge-demo-plug"));
if (asked() !== "Go easy at 5%. (3)") return "unplugged: " + asked();
await set(80);
if (html.hasAttribute("data-go-easy")) return "still asking at 80";

// Low Power Mode asks at any level.
await tap($("#battery-badge-demo-save"));
if (html.getAttribute("data-go-easy") !== "battery" || asked() !== "Go easy at 80%. (5)") return "low power: " + asked();
if (!given().textContent.includes("Low power")) return "low power word: " + given().textContent;
if (!given().classList.contains("ui-batbadge-power")) return "tone power: " + given().className;
await tap($("#battery-badge-demo-save"));
if (html.hasAttribute("data-go-easy")) return "low power off";
document.removeEventListener("ui-go-easy", on);

// The web's own API, read from Chrome's object.
const b = await navigator.getBattery();
const pct = Math.round(b.level * 100);
await back();
if (!real().textContent.includes(pct + "%")) return "real: " + real().textContent;

// The same object, its values set: a real event from it updates the badge.
const fake = { level: 0.42, charging: false, chargingTime: Infinity, dischargingTime: 7500 };
const desc = {};
for (const k of Object.keys(fake)) { desc[k] = Object.getOwnPropertyDescriptor(BatteryManager.prototype, k); Object.defineProperty(BatteryManager.prototype, k, { configurable: true, get: () => fake[k] }); }
try {
    b.dispatchEvent(new Event("levelchange"));
    await wait(100);
    if (!real().textContent.includes("42%")) return "levelchange: " + real().textContent;
    if (real().querySelector(".ui-batbadge-more").textContent !== "2 h 5 min left") return "time left: " + real().querySelector(".ui-batbadge-more").textContent;
    const shows = getComputedStyle(real().querySelector(".ui-batbadge-more")).display;
    if (device === "tablet" && shows === "none") return "tablet shows the time: " + shows;
    if (device === "phone" && shows !== "none") return "phone keeps it short: " + shows;
    fake.charging = true; fake.chargingTime = 1500; fake.dischargingTime = Infinity;
    b.dispatchEvent(new Event("chargingchange"));
    await wait(100);
    if (!real().textContent.includes("Charging") || real().querySelector(".ui-batbadge-more").textContent !== "25 min to full") return "charging: " + real().textContent;
    fake.level = 1; fake.chargingTime = 0;
    b.dispatchEvent(new Event("chargingchange"));
    await wait(100);
    if (!real().textContent.includes("100%") || !real().textContent.includes("Full") || real().querySelector(".ui-batbadge-more")) return "full: " + real().textContent;
    fake.charging = false; fake.level = 0.1; fake.dischargingTime = Infinity;
    b.dispatchEvent(new Event("chargingchange"));
    await wait(100);
    if (html.getAttribute("data-go-easy") !== "battery" || !realBox().querySelector(".ui-batbadge-ask")) return "web low: " + html.getAttribute("data-go-easy");
    fake.level = 0.9;
    b.dispatchEvent(new Event("levelchange"));
    await wait(100);
    if (html.hasAttribute("data-go-easy")) return "web back";
} finally {
    for (const k of Object.keys(fake)) Object.defineProperty(BatteryManager.prototype, k, desc[k]);
}

// The app first, with low power. A level of null is said so; odd values do not throw.
let answer = { level: 0.33, state: "unplugged", low_power: true };
window.quilloNative = { battery: async () => answer };
await back();
if (!real().textContent.includes("33%") || !real().textContent.includes("Low power")) return "app: " + real().textContent;
if (html.getAttribute("data-go-easy") !== "battery") return "app low power should ask";
answer = { level: null, state: "unknown", low_power: false };
await back();
if (!real().textContent.includes("Level not said")) return "app null: " + real().textContent;
if (html.hasAttribute("data-go-easy")) return "no level, no request";
answer = { level: 7, state: "weird", low_power: "yes" };
await back();
if (!real().textContent.includes("100%")) return "a level past 1: " + real().textContent;
// The app has no events: asked again on its clock, here each 5 s.
answer = { level: 0.51, state: "unplugged", low_power: false };
await wait(5200);
if (!real().textContent.includes("51%")) return "the clock: " + real().textContent;
delete window.quilloNative;

// Nothing says: Safari and Firefox.
const gb = Navigator.prototype.getBattery;
delete Navigator.prototype.getBattery;
await back();
Navigator.prototype.getBattery = gb;
if (!real().textContent.includes("Level not available here")) return "none: " + real().textContent;
if (real().getAttribute("aria-label") !== "Battery level not known") return "none aria: " + real().getAttribute("aria-label");
