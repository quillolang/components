// mobile
const lockBtn = () => $(".ui-paycode-hold"), said = () => $("#pay-demo-said").textContent;
const btn = (t) => $$(".ui-paycode .ui-btn").find((b) => b.textContent.trim() === t);
const qr = () => $(".ui-paycode-qr svg");
if (!/\$12\.50/.test($(".ui-paycode-sum").textContent)) return "the amount: " + $(".ui-paycode-sum").textContent;
if (!lockBtn() || qr()) return "it starts locked, with no code on the page";
const html = await (await fetch(location.pathname + "?only=pay_code")).text();
if (/ui-paycode-qr/.test(html.replace(/<style[\s\S]*?<\/style>/g, ""))) return "the server sends no code";
const gone = () => { delete window.quilloNative; };
// The app: brightness read, raised and put back, as Promises, as the real bridge answers.
const log = [];
window.quilloNative = {
    brightness: (v) => { log.push(v === undefined ? "read" : "set " + v); return Promise.resolve(v === undefined ? 0.4 : true); },
    keepAwake: (v) => { log.push("awake " + v); return Promise.resolve(true); },
};
// A hold too short does nothing.
const m = lockBtn().getBoundingClientRect(), p = { x: m.left + m.width / 2, y: m.top + m.height / 2 };
const down = () => cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
const up = () => cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await down(); await wait(180); await up(); await wait(700);
if (!lockBtn() || qr()) { gone(); return "a short hold shows nothing"; }
// A hold that slides away is cancelled.
await down(); await wait(100);
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + 60, y: p.y }] });
await wait(700); await up(); await wait(100);
if (!lockBtn()) { gone(); return "sliding away cancels"; }
// A cancelled one too, and one that slides away after it was long enough.
await down(); await wait(100);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(700);
if (!lockBtn()) { gone(); return "a cancel cancels"; }
await down(); await wait(700);
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + 60, y: p.y }] });
await wait(60); await up(); await wait(150);
if (qr()) { gone(); return "sliding off after a full hold cancels"; }
if (lockBtn().textContent !== "Hold to show the code") { gone(); return "and it starts again: " + lockBtn().textContent; }
if (log.length) { gone(); return "nothing yet: " + log.join(); }
// A full hold, by real touch: it opens when the finger lifts, so nothing appears under a held finger to take the release.
const pressed = [];
const spy = (e) => pressed.push(e.target.tagName + "." + e.target.className);
document.addEventListener("click", spy, true);
await down(); await wait(750);
if (qr()) { await up(); document.removeEventListener("click", spy, true); gone(); return "held, it waits for the finger"; }
if (lockBtn().textContent !== "Let go to show") { await up(); document.removeEventListener("click", spy, true); gone(); return "it says to let go: " + lockBtn().textContent; }
await up(); await wait(250);
document.removeEventListener("click", spy, true);
if (!qr()) { gone(); return "lifting after a full hold shows the code"; }
if (pressed.some((p) => /ui-btn/.test(p))) { gone(); return "the release pressed something: " + pressed.join(); }
if (!/Show digits/.test($(".ui-paycode").textContent)) { gone(); return "the buttons are there, unpressed"; }
if ($(".ui-paycode-digits")) { gone(); return "the release pressed Show digits"; }
if (log.join() !== "read,set 1,awake true") { gone(); return "brightness up: " + log.join(); }
if (!/brightness is up/.test($(".ui-paycode").textContent)) { gone(); return "it says so"; }
if (said() !== "Shown 1, locked 0") { gone(); return "on_show: " + said(); }
// The QR is the code: digits match the known mix for that step.
const label0 = qr().getAttribute("aria-label");
if (!/QR code to pay \$12\.50/.test(label0)) { gone(); return "a label: " + label0; }
const shape0 = $(".ui-paycode-qr path").getAttribute("d");
await tap(btn("Show digits"));
const d0 = $(".ui-paycode-digits").textContent;
if (!/^\d{4} \d{4} \d{4}$/.test(d0)) { gone(); return "digits in fours: " + d0; }
// Luhn over the twelve: the last digit makes it check.
const luhn = (s) => [...s].reverse().reduce((a, c, i) => { const d = +c * (i % 2 ? 2 : 1); return a + (d > 9 ? d - 9 : d); }, 0) % 10;
if (luhn(d0.replace(/ /g, "")) !== 0) { gone(); return "the check digit: " + d0; }
// It changes on the timer: period 2 s.
await wait(2200);
const d1 = $(".ui-paycode-digits").textContent;
if (d1 === d0) { gone(); return "a new code each period: " + d0; }
if (!/New code in [12] s/.test($(".ui-paycode-clock").textContent)) { gone(); return "the clock: " + $(".ui-paycode-clock").textContent; }
await tap(btn("Show QR code"));
if ($(".ui-paycode-qr path").getAttribute("d") === shape0) { gone(); return "the QR changes with it"; }
// Rotation keeps it open.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(300);
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (!qr()) { gone(); return "turning keeps the code"; }
// Leaving the app locks it, and brightness goes back to what it was.
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange"));
delete document.visibilityState;
await wait(150);
if (qr() || !lockBtn()) { gone(); return "leaving locks it"; }
if (log.slice(3).join() !== "set 0.4,awake false") { gone(); return "brightness back: " + log.join(); }
if (said() !== "Shown 1, locked 1") { gone(); return "on_lock: " + said(); }
// The route without holding.
await tap(btn("Show without holding"));
await tap(btn("Not now"));
if (qr() || !btn("Show without holding")) { gone(); return "Not now stays locked"; }
await tap(btn("Show without holding"));
await tap(btn("Yes, show it")); await wait(150);
if (!qr()) { gone(); return "the other route shows it"; }
await tap(btn("Lock")); await wait(150);
if (qr()) { gone(); return "Lock locks"; }
// The keyboard: Enter on the button.
lockBtn().focus(); lockBtn().click(); await wait(150);
if (!qr()) { gone(); return "a key press shows it"; }
// The till confirms: the code goes and brightness comes down.
const n = log.length;
await tap($("#pay-demo-till")); await wait(200);
if (qr() || lockBtn()) { gone(); return "paid: nothing to show"; }
if ($(".ui-paycode-paid").textContent !== "Paid") { gone(); return "it says Paid"; }
if (log.slice(n).join() !== "set 0.4,awake false") { gone(); return "brightness after paying: " + log.slice(n).join(); }
await tap($("#pay-demo-again")); await wait(250);
// It locks by itself after lock_after: 7 s.
await tap(btn("Show without holding"));
await tap(btn("Yes, show it")); await wait(150);
await wait(7300);
if (qr() || !lockBtn()) { gone(); return "it locks by itself"; }
// A refusal: said, and the code still shows.
window.quilloNative.brightness = () => Promise.reject(new Error("no"));
await tap(btn("Show without holding"));
await tap(btn("Yes, show it")); await wait(200);
if (!qr() || !/could not be changed/.test($(".ui-paycode").textContent)) { gone(); return "a refusal is said: " + $(".ui-paycode").textContent; }
// A tablet: the code beside its clock.
if (device === "tablet") {
    const a = $(".ui-paycode-qr").getBoundingClientRect(), b = $(".ui-paycode-clock").getBoundingClientRect();
    if (b.left < a.right) { gone(); return "beside on a tablet: " + a.right + " " + b.left; }
}
await tap(btn("Lock")); await wait(150);
// A plain browser: it asks the person, and takes a Wake Lock if there is one.
gone();
let asked = 0, released = 0;
const wl = navigator.wakeLock, desc = Object.getOwnPropertyDescriptor(Navigator.prototype, "wakeLock");
Object.defineProperty(navigator, "wakeLock", { configurable: true, value: { request: async () => { asked++; return { release: async () => { released++; } }; } } });
await tap(btn("Show without holding"));
await tap(btn("Yes, show it")); await wait(200);
const web = /cannot change brightness/.test($(".ui-paycode").textContent);
await tap(btn("Lock")); await wait(150);
delete navigator.wakeLock;
if (!web) return "a browser says to turn it up";
if (asked !== 1 || released !== 1) return "Wake Lock taken and given back: " + asked + " " + released;
// Codes from a service, which answers later; down, it says so and tries again.
await tap($("#pay-demo-service")); await wait(300);
await tap(btn("Show without holding"));
await tap(btn("Yes, show it")); await wait(200);
await tap(btn("Show digits")); await wait(100);
const code1 = $(".ui-paycode-digits").textContent.replace(/ /g, "");
if (!/^40000000\d{1,4}$/.test(code1)) return "the service's code: " + code1;
// Period 2 s: even steps answer at once, odd ones by a Promise. Both show.
await wait(2100);
const code2 = $(".ui-paycode-digits").textContent.replace(/ /g, "");
if (code2 === code1 || !/^40000000\d{1,4}$/.test(code2)) return "the other kind of answer: " + code1 + " " + code2;
await tap($("#pay-demo-down"));
await wait(2300);
if (!/could not be fetched/.test($(".ui-paycode").textContent)) return "a failed refresh says so";
await tap($("#pay-demo-down"));
await wait(1300);
if (/could not be fetched/.test($(".ui-paycode").textContent)) return "it recovers";
if ($(".ui-paycode-digits").textContent.replace(/ /g, "") === code1) return "and has a new code";
await tap(btn("Lock")); await wait(150);
await tap($("#pay-demo-again")); await wait(200);
