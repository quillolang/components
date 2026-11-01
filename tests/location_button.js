// mobile
const go = () => $(".ui-locbtn-go");
const say = () => $(".ui-locbtn-say").textContent.trim();
const note = () => $("#location-button-demo-seen").textContent;
const field = () => $("input[name=place]").value;
delete window.quilloNative;

// Nothing has been asked.
if (go().textContent.trim() !== "Use my location") return "starts as: " + go().textContent;
if ($(".ui-locbtn-place")) return "a place before asking";

// The web's geolocation, with a place set in Chrome itself.
await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
await cdp("Emulation.setGeolocationOverride", { latitude: 14.5995, longitude: 120.9842, accuracy: 12 });
await tap(go());
await wait(300);
if ($(".ui-locbtn-coords")?.textContent !== "14.59950° N, 120.98420° E") return "web coords: " + $(".ui-locbtn-coords")?.textContent;
if ($(".ui-locbtn-near").textContent.trim() !== "Within 12 mgood") return "near: " + $(".ui-locbtn-near").textContent;
if (field() !== "14.5995,120.9842,12") return "hidden field: " + field();
if (!note().includes("on_locate gave 14.5995, 120.9842 from the web") || !note().startsWith("State: found")) return "callback: " + note();
if (go().textContent.trim() !== "Update location") return "after a place: " + go().textContent;

// South and west, poor accuracy in km.
await cdp("Emulation.setGeolocationOverride", { latitude: -33.8688, longitude: -70.5, accuracy: 2400 });
await tap(go());
await wait(300);
if ($(".ui-locbtn-coords").textContent !== "33.86880° S, 70.50000° W") return "south west: " + $(".ui-locbtn-coords").textContent;
if ($(".ui-locbtn-near").textContent.trim() !== "Within 2.4 kmpoor") return "km: " + $(".ui-locbtn-near").textContent;

// Fair, at the edge of each grade.
await cdp("Emulation.setGeolocationOverride", { latitude: 1, longitude: 2, accuracy: 100 });
await tap(go());
await wait(300);
if ($(".ui-locbtn-grade").textContent !== "fair") return "100 m is fair: " + $(".ui-locbtn-grade").textContent;

// No fix: Chrome says position unavailable.
await cdp("Emulation.clearGeolocationOverride");
await cdp("Emulation.setGeolocationOverride", {});
await tap(go());
await wait(300);
if (!say().startsWith("No location came")) return "off: " + say();
if (go().textContent.trim() !== "Try again") return "after off: " + go().textContent;
if (!$(".ui-locbtn-place").hasAttribute("data-old")) return "the old place should show as old";
if ($(".ui-locbtn-settings")) return "no Settings button in a browser";

// Refused in the browser: told where to go, no button for it.
await cdp("Browser.setPermission", { permission: { name: "geolocation" }, setting: "denied" });
await cdp("Emulation.setGeolocationOverride", { latitude: 1, longitude: 2, accuracy: 5 });
await tap(go());
await wait(300);
if (!say().startsWith("Location is blocked for this page")) return "refused: " + say();
if (!note().startsWith("State: refused")) return "on_state: " + note();
await cdp("Browser.resetPermissions");

// The web's own timeout.
const real = navigator.geolocation.getCurrentPosition;
Object.defineProperty(navigator.geolocation, "getCurrentPosition", { configurable: true,
    value: (ok, bad, opts) => { window.__opts = opts; bad({ code: 3, message: "timed out" }); } });
await tap(go());
await wait(200);
if (!say().startsWith("This is taking too long")) return "timeout: " + say();
if (window.__opts.timeout !== 3000 || window.__opts.enableHighAccuracy !== true || window.__opts.maximumAge !== 0) return "options: " + JSON.stringify(window.__opts);
// A place that makes no sense is not a place.
Object.defineProperty(navigator.geolocation, "getCurrentPosition", { configurable: true,
    value: (ok) => ok({ coords: { latitude: 200, longitude: 10, accuracy: 5 }, timestamp: 1 }) });
await tap(go());
await wait(200);
if (!say().startsWith("No location came")) return "bad place: " + say();
delete navigator.geolocation.getCurrentPosition;

// The app: quilloNative comes first, and the web is not touched.
let calls = 0, settings = 0, answer = async () => ({ lat: 51.5, lon: -0.125, accuracy: 8.4, altitude: 11, speed: -1, course: -1, at: 1700000000000 });
window.quilloNative = { location: () => { calls++; return answer(); }, openSettings: async () => { settings++; return true; } };
await tap(go());
await wait(200);
if (calls !== 1) return "the app was called " + calls + " times";
if ($(".ui-locbtn-coords").textContent !== "51.50000° N, 0.12500° W") return "app coords: " + $(".ui-locbtn-coords").textContent;
if ($(".ui-locbtn-near").textContent.trim() !== "Within 8 mgood") return "app accuracy: " + $(".ui-locbtn-near").textContent;
if (!note().includes("from the app")) return "from: " + note();

// Refused in the app: a way to Settings, and it asks again on coming back.
answer = async () => { throw new Error("location is turned off for this app"); };
await tap(go());
await wait(200);
if (!say().includes("allow it in Settings")) return "app refused: " + say();
if (!$(".ui-locbtn-settings")) return "no Settings button in the app";
answer = async () => ({ lat: 2, lon: 3, accuracy: 30 });
await tap($(".ui-locbtn-settings"));
await wait(100);
if (settings !== 1) return "openSettings was called " + settings + " times";
const before = calls;
document.dispatchEvent(new Event("visibilitychange"));
await wait(200);
if (calls !== before + 1) return "should ask again on coming back from Settings";
if ($(".ui-locbtn-coords").textContent !== "2.00000° N, 3.00000° E") return "after Settings: " + $(".ui-locbtn-coords").textContent;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (calls !== before + 1) return "asked again with no trip to Settings";

// Location services off (Android says so).
answer = async () => { throw new Error("location services are turned off"); };
await tap(go());
await wait(200);
if (!say().startsWith("No location came") || $(".ui-locbtn-settings")) return "services off: " + say();

// The app's call never answers: the component's own clock (3 s here). Then it does.
let done;
answer = () => new Promise((r) => { done = r; });
await tap(go());
await wait(150);
if (!$(".ui-btn[aria-busy]")) return "should be busy while asking";
if (say() !== "Asking for your location.") return "asking: " + say();
if (!$(".ui-locbtn-cancel")) return "no Cancel while asking";
await wait(3300);
if (!say().startsWith("This is taking too long")) return "own clock: " + say();
done({ lat: 7, lon: 8, accuracy: 3 });
await wait(150);
if ($(".ui-locbtn-coords").textContent !== "7.00000° N, 8.00000° E") return "a late answer should be taken: " + $(".ui-locbtn-coords").textContent;

// Cancelled: the answer is dropped, however late.
answer = () => new Promise((r) => { done = r; });
await tap(go());
await wait(150);
await tap($(".ui-locbtn-cancel"));
await wait(100);
if (say() !== "" || $(".ui-locbtn-cancel")) return "after cancel: " + say();
done({ lat: 9, lon: 9, accuracy: 3 });
await wait(150);
if ($(".ui-locbtn-coords").textContent !== "7.00000° N, 8.00000° E") return "a cancelled answer was taken";

// Nothing at all can give a place.
delete window.quilloNative;
const geo = Object.getOwnPropertyDescriptor(Navigator.prototype, "geolocation");
Object.defineProperty(Navigator.prototype, "geolocation", { configurable: true, get: () => undefined });
await tap(go());
await wait(150);
const none = say();
Object.defineProperty(Navigator.prototype, "geolocation", geo);
if (none !== "This browser cannot give a location.") return "none: " + none;

// With room the answer stands beside the button; on a phone, under it.
const a = $(".ui-locbtn-bar").getBoundingClientRect(), b = $(".ui-locbtn-place").getBoundingClientRect();
if (device === "tablet" && !(b.left >= a.right)) return "tablet: the place should stand beside the button";
if (device === "phone" && !(b.top >= a.bottom)) return "phone: the place should be under the button";
await cdp("Emulation.clearGeolocationOverride");
