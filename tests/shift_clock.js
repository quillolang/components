// mobile
const main = $(".ui-punch-main"), other = $(".ui-punch-other");
const said = () => $(".ui-punch-said").textContent;
const state = () => $(".ui-punch-state").textContent;
const sum = () => $$(".ui-punch-sum dd").map((d) => d.textContent).join(" | ");
const log = () => $$(".ui-punch-log li").map((l) => l.textContent).join(" | ");
const sent = () => $("#punch-demo-sent").textContent;
const btn = (t) => $$(".ui-punch .ui-btn").find((b) => b.textContent.trim() === t);
const now0 = Date.now, off0 = Date.prototype.getTimezoneOffset;
// 2026-11-02 08:00 at -04:00 is 12:00 UTC.
const T = (h, m = 0, s = 0, d = 2) => Date.UTC(2026, 10, d, h + 4, m, s);
const clock = (ms) => { Date.now = () => ms; };
const place = (latitude, longitude, accuracy = 10) => cdp("Emulation.setGeolocationOverride", { latitude, longitude, accuracy });
const done = async () => {
    Date.now = now0; Date.prototype.getTimezoneOffset = off0; delete window.quilloNative; localStorage.removeItem("ui-punch-demo");
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp("Emulation.clearGeolocationOverride");
};
const fail = async (m) => { await done(); return m; };
localStorage.removeItem("ui-punch-demo");
Date.prototype.getTimezoneOffset = () => 240;
document.dispatchEvent(new Event("visibilitychange"));
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await place(45.5017, -73.5673, 10);
if (main.textContent !== "Punch in" || getComputedStyle(other).display !== "none") return fail("starts out: " + main.textContent);
if (main.getBoundingClientRect().height < 96) return fail("big enough for a glove: " + main.getBoundingClientRect().height);
// A real double tap: two taps as close as the browser takes them. The first punches in, and
// the same button now says Punch out: the second must do nothing.
clock(T(8, 2));
const p = main.getBoundingClientRect();
const at = { x: p.left + p.width / 2, y: p.top + p.height / 2 };
const finger = (type, points) => cdp("Input.dispatchTouchEvent", { type, touchPoints: points });
await finger("touchStart", [at]); await finger("touchEnd", []);
await finger("touchStart", [at]); await finger("touchEnd", []);
for (let n = 0; n < 30 && !/Punch in: /.test(said()); n++) await wait(100);
await wait(200);
if (said() !== "Punch in: 08:02 at Depot" && !/already done/.test(said())) return fail("in: " + said());
if ($$(".ui-punch-log li").length !== 1) return fail("a double tap punches once: " + log());
if (main.textContent !== "Punch out" || other.textContent !== "Start break" || other.hidden) return fail("then: " + main.textContent);
if (!/On shift/.test(state()) || !/Since 08:02/.test(state())) return fail("state: " + state());
if (!/08:02In/.test(log()) || !/Depot/.test(log())) return fail("log: " + log());
// Within the guard, a press on the next button is the same press.
clock(T(8, 2, 3));
await tap(main);
if (said() !== "That was already done at 08:02." || !/On shift/.test(state())) return fail("guard: " + said());
// Past it, a break. No place is asked for a break.
clock(T(12, 0));
await tap(other);
if (!/On break/.test(state()) || main.textContent !== "End break" || other.textContent !== "Punch out") return fail("break: " + state() + main.textContent);
// Known answer: 08:02 to 12:00 is 3 h 58 min.
if (sum() !== "3 h 58 min | 0 min") return fail("worked to the break: " + sum());
clock(T(12, 30));
await tap(main);
if (!/On shift/.test(state())) return fail("back: " + state());
if (sum() !== "3 h 58 min | 30 min") return fail("after the break: " + sum());
// The clock goes on by itself while on shift (it ticks every 20 s, so a stand-in time and a hidden-and-back are quicker).
clock(T(17, 2));
document.dispatchEvent(new Event("visibilitychange"));
await wait(50);
// 08:02 to 17:02 is 9 h, less the 30 min break: 8 h 30 min.
if (sum() !== "8 h 30 min | 30 min") return fail("hours go on: " + sum());
// Too far: 45.5100 is 923 m north, by hand 0.0083 deg x 111.19 km; North yard is further.
await place(45.51, -73.5673, 10);
clock(T(17, 3));
await tap(main);
for (let n = 0; n < 40 && !$(".ui-punch-ask"); n++) await wait(100);
const ask = () => $(".ui-punch-ask").textContent;
if (!/You are 923 m from Depot\. Allowed: 150 m\./.test(ask())) return fail("far: " + ask());
if (!/On shift/.test(state())) return fail("not punched while asking");
await tap(main);
if ($$(".ui-punch-log li").length !== 3) return fail("the main button does nothing while asking: " + log());
// Cancel is nothing, and frees the button.
await tap(btn("Cancel"));
if (said() !== "Nothing was punched." || $(".ui-punch-ask")) return fail("cancel: " + said());
clock(T(17, 3, 2));
await tap(main);
for (let n = 0; n < 40 && !$(".ui-punch-ask"); n++) await wait(100);
// Moved back: Try again finds the place, with the time of the first press.
await place(45.5017, -73.5673, 10);
clock(T(17, 9));
await tap(btn("Try again"));
for (let n = 0; n < 40 && /Checking/.test(said()); n++) await wait(100);
await wait(100);
if (said() !== "Punch out: 17:03 at Depot") return fail("the press's own time: " + said());
if (!/Not on shift/.test(state()) || main.textContent !== "Punch in") return fail("out: " + state());
// 8 h 31 min worked: 08:02 to 12:00, 12:30 to 17:03.
if (sum() !== "8 h 31 min | 30 min") return fail("final: " + sum());
if (sent() !== "Sent: in, break, back, out") return fail("sent in order: " + sent());
// A place too rough to tell: 300 m from a 150 m fence, known within 400 m.
await place(45.5044, -73.5673, 400);
clock(T(18, 0));
await tap(main);
for (let n = 0; n < 40 && !$(".ui-punch-ask"); n++) await wait(100);
if (!$(".ui-punch-ask")) return fail("no ask: " + said() + " / " + log() + " / " + state());
if (!/too rough to tell: about 300 m from Depot/.test(ask())) return fail("rough: " + ask());
await tap(btn("Punch anyway"));
if (!/Off site/.test(log()) || !/300 m from Depot/.test(log())) return fail("marked for a manager: " + log());
// Offline: it punches at once, and waits.
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(150);
await place(45.5017, -73.5673, 10);
clock(T(19, 0));
await tap(main);
for (let n = 0; n < 40 && /Checking/.test(said()); n++) await wait(100);
await wait(100);
if (!/1 punch waiting to send/.test($(".ui-punch-note")?.textContent ?? "")) return fail("waits: " + $(".ui-punch-note")?.textContent);
if (!/Waiting/.test(log())) return fail("marked waiting: " + log());
if (sent() !== "Sent: in, break, back, out, in") return fail("nothing goes offline: " + sent());
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
if (sent() !== "Sent: in, break, back, out, in, out") return fail("goes when back: " + sent());
if (/Waiting/.test(log())) return fail("no longer waiting");
// A reload brings the day back.
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:400px;opacity:0;pointer-events:none"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await wait(400);
const fd = frame.contentDocument;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
for (let n = 0; n < 40 && fd.querySelectorAll(".ui-punch-log li").length < 6 && !fd.querySelector(".ui-punch-log"); n++) await wait(100);
await wait(300);
const kept = JSON.parse(localStorage.getItem("ui-punch-demo") ?? "[]").length; frame.remove();
if (kept !== 6) return fail("kept: " + kept);
// A refusal in the app: why, Settings, and Punch anyway marks No place.
clock(T(20, 0));
let settings = 0;
window.quilloNative = { location: () => Promise.reject(new Error("Location is turned off for this app")), wait: () => new Promise(() => {}), openSettings: () => { settings++; return Promise.resolve(true); }, haptic: () => Promise.resolve(true) };
await tap(main);
for (let n = 0; n < 40 && !$(".ui-punch-ask"); n++) await wait(100);
if (!/Location is off for this app/.test(ask())) return fail("refused: " + ask());
await tap(btn("Open Settings"));
if (settings !== 1) return fail("Settings");
await tap(btn("Punch anyway"));
if (!/No place/.test(log())) return fail("no place: " + log());
// The app's place, in reach.
window.quilloNative = { location: () => Promise.resolve({ lat: 45.56, lon: -73.6, accuracy: 5 }), wait: () => new Promise(() => {}), haptic: () => Promise.resolve(true) };
clock(T(21, 0));
await tap(main);
for (let n = 0; n < 40 && /Checking/.test(said()); n++) await wait(100);
await wait(100);
if (said() !== "Punch out: 21:00 at North yard") return fail("second site: " + said());
delete window.quilloNative;
// A shift left open into the next day says so, and counts from midnight. 2026-11-03 02:00 is 2 h in.
clock(T(22, 0));
await tap(main);
for (let n = 0; n < 40 && /Checking/.test(said()); n++) await wait(100);
await wait(100);
clock(T(2, 0, 0, 3));
document.dispatchEvent(new Event("visibilitychange"));
await wait(60);
if (sum() !== "2 h 0 min | 0 min") return fail("from midnight: " + sum());
if (!/On shift since 2026-11-02 22:00\. Did you forget/.test($(".ui-punch-note")?.textContent ?? "")) return fail("left open: " + $(".ui-punch-note")?.textContent);
if ($$(".ui-punch-log li").length !== 0 || !/No punches today/.test($(".ui-punch").textContent)) return fail("today is a new day: " + log());
// More than the limit is marked. 10 h past 02:00 is noon, 12 h in.
clock(T(12, 0, 0, 3));
document.dispatchEvent(new Event("visibilitychange"));
await wait(60);
if (sum() !== "12 h 0 min | 0 min" || $(".ui-punch-sum div").dataset.over === undefined) return fail("past the limit: " + sum());
// Columns on a tablet.
const cols = $$(".ui-punch-col"), a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
await done();
