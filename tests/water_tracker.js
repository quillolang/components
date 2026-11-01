// mobile
await wait(200);
await cdp("Emulation.setTimezoneOverride", { timezoneId: "Asia/Tokyo" });
const realNow = Date.now;
// 2026-11-01 at 23:59:50 in Tokyo is 14:59:50 UTC, which is still 2026-11-01 in London and in Tokyo alike.
let clock = Date.UTC(2026, 10, 1, 14, 59, 50);
Date.now = () => clock;
const calls = [];
window.quilloNative = { haptic: (k) => { calls.push(k); return Promise.resolve(true); } };
const done = async (why) => {
    Date.now = realNow;
    delete window.quilloNative;
    localStorage.removeItem("demo-water-oz");
    await cdp("Emulation.setTimezoneOverride", { timezoneId: "" });
    return why;
};

const main = $("#water-tracker-main");
const glass = main.querySelector(".ui-water-glass");
const total = () => main.querySelector(".ui-water-total").textContent;
const note = () => main.querySelector(".ui-water-note").textContent;
const fill = () => main.querySelector(".ui-water-fill").style.transform;
const pct = () => main.querySelector(".ui-water-pct").textContent;
const undo = () => main.querySelector(".ui-water-undo");
const adds = () => [...main.querySelectorAll(".ui-water-add")];
const kept = () => $("#water-tracker-kept").textContent;
const told = () => $("#water-tracker-told").textContent;

// Kept: 750 of 2000, 37.5%, shown from what was saved.
if (total() !== "750 ml of 2 L") return done("start: " + total());
if (pct() !== "38%") return done("percent: " + pct());
if (fill() !== "translateY(62.5%)") return done("fill: " + fill());
if (note() !== "1.25 L to go.") return done("left: " + note());
if (adds().map((b) => b.textContent).join() !== "+150 ml,+250 ml,+500 ml") return done("sizes: " + adds().map((b) => b.textContent).join());
if (glass.getAttribute("aria-label") !== "Add 250 ml") return done("the glass adds the middle size: " + glass.getAttribute("aria-label"));
if (undo().textContent.trim() !== "Undo +500 ml") return done("undo says what: " + undo().textContent);

// A tap on the glass.
await tap(glass);
if (total() !== "1 L of 2 L") return done("tap: " + total());
if (fill() !== "translateY(50%)") return done("half full: " + fill());
if (calls.join() !== "light") return done("felt: " + calls);
if (kept() !== '{"day":"2026-11-01","entries":[250,500,250]}') return done("kept: " + kept());
if (main.querySelector(".ui-sr").textContent !== "Added 250 ml. 1 L today.") return done("told: " + main.querySelector(".ui-sr").textContent);

// Undo takes back the last, and again.
await tap(undo());
if (total() !== "750 ml of 2 L") return done("undo: " + total());
if (undo().textContent.trim() !== "Undo +500 ml") return done("undo again names the next: " + undo().textContent);
await tap(undo());
await tap(undo());
if (total() !== "0 ml of 2 L") return done("undone all: " + total());
if (!undo().disabled || undo().textContent.trim() !== "Nothing to undo") return done("nothing left: " + undo().textContent);
await tap(undo());
if (total() !== "0 ml of 2 L") return done("a press on nothing");

// To the goal and past: the goal is felt once, at the step that crosses it.
calls.length = 0;
for (let i = 0; i < 4; i++) await tap(adds()[2]);
if (total() !== "2 L of 2 L") return done("at the goal: " + total());
if (note() !== "Goal reached.") return done("note: " + note());
if (calls.join() !== "light,light,light,success") return done("felt: " + calls);
if (told() !== "goal 2000 (1)") return done("on_goal: " + told());
if (!main.querySelector(".ui-water").classList.contains("ui-water-done")) return done("marked done");
await tap(adds()[0]);
if (total() !== "2.15 L of 2 L") return done("past: " + total());
if (note() !== "Goal reached, 150 ml over.") return done("over: " + note());
if (fill() !== "translateY(0%)") return done("a full glass stays full: " + fill());
if (pct() !== "108%") return done("past 100: " + pct());
if (told() !== "goal 2000 (1)") return done("the goal is said once: " + told());

// Quick taps all count: three before the page has had a moment.
const before = kept();
const p = middle(adds()[0]);
for (let i = 0; i < 3; i++) { await fingers("touchStart", [p]); await fingers("touchEnd", []); }
await wait(150);
if (total() !== "2.6 L of 2 L") return done("three quick taps: " + total());

// A second before midnight in Tokyo nothing has happened. At midnight, with the page open, the next look clears it.
await wait(1100);
if (total() !== "2.6 L of 2 L") return done("before midnight: " + total());
clock += 11000;
await wait(1300);
if (total() !== "0 ml of 2 L") return done("midnight in Tokyo should clear it: " + total());
if (note() !== "A new day. The last one came to 2.6 L.") return done("says so: " + note());
if (told() !== "reset 2026-11-01 8 (1)") return done("on_reset: " + told());
if (kept() !== '{"day":"2026-11-02","entries":[]}') return done("kept: " + kept());
// Told once.
await wait(1200);
if (told() !== "reset 2026-11-01 8 (1)") return done("once: " + told());

// The day is the phone's: flying to Los Angeles it is 2026-11-01 there, earlier than kept. Nothing is cleared.
await tap(adds()[0]);
await cdp("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });
clock += 3600000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (total() !== "150 ml of 2 L") return done("flying west clears nothing: " + total());
await tap(adds()[0]);
if (kept() !== '{"day":"2026-11-02","entries":[150,150]}') return done("still that day: " + kept());
// Coming back after a long sleep clears it on sight, and a tap in the same moment adds to the new day.
clock += 2 * 24 * 3600000;
await tap(adds()[1]);
await wait(50);
if (total() !== "250 ml of 2 L") return done("the first tap of a new day starts it: " + total());
// 16:00 UTC on the 3rd is 08:00 there.
if (kept() !== '{"day":"2026-11-03","entries":[250]}') return done("that day: " + kept());
await cdp("Emulation.setTimezoneOverride", { timezoneId: "Asia/Tokyo" });

// Ounces, with no litres. Kept in localStorage, under its key. An empty glass shows no water at all.
const oz = $("#water-tracker-oz");
if (!oz.querySelector(".ui-water-fill").classList.contains("ui-water-dry")) return done("an empty glass is dry");
if (oz.querySelector(".ui-water-total").textContent !== "0 oz of 64 oz") return done("oz: " + oz.querySelector(".ui-water-total").textContent);
await tap(oz.querySelector(".ui-water-add"));
if (oz.querySelector(".ui-water-total").textContent !== "8 oz of 64 oz") return done("oz add: " + oz.querySelector(".ui-water-total").textContent);
if (oz.querySelector(".ui-water-note").textContent !== "56 oz to go.") return done("oz left");
const stored = JSON.parse(localStorage.getItem("demo-water-oz") ?? "null");
if (!stored || stored.entries.join() !== "8") return done("stored: " + localStorage.getItem("demo-water-oz"));
// Storage that refuses stops nothing.
const setItem = Storage.prototype.setItem;
Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
await tap(oz.querySelector(".ui-water-add"));
Storage.prototype.setItem = setItem;
if (oz.querySelector(".ui-water-total").textContent !== "16 oz of 64 oz") return done("full storage: " + oz.querySelector(".ui-water-total").textContent);
if (oz.querySelector(".ui-water-undo").textContent.trim() !== "Undo +8 oz") return done("still works: " + oz.querySelector(".ui-water-undo").textContent);

// Bad input: sizes fall back, no goal means no percent, what was saved is ignored.
const bad = $("#water-tracker-bad");
if (bad.querySelector(".ui-water-total").textContent !== "0 ml of 0 ml") return done("bad: " + bad.querySelector(".ui-water-total").textContent);
await tap(bad.querySelector(".ui-water-add"));
if (bad.querySelector(".ui-water-pct").textContent !== "0%") return done("no goal: " + bad.querySelector(".ui-water-pct").textContent);
if (bad.querySelector(".ui-water-total").textContent !== "250 ml of 0 ml") return done("bad add: " + bad.querySelector(".ui-water-total").textContent);

// In a browser: its own vibration; none of it on iOS, and nothing fails.
delete window.quilloNative;
const felt = [];
Object.defineProperty(navigator, "vibrate", { value: (p) => { felt.push(p); return true; }, configurable: true });
await tap(glass);
if (felt.join() !== "12") return done("vibrate: " + felt);
Object.defineProperty(navigator, "vibrate", { value: undefined, configurable: true });
await tap(glass);
delete navigator.vibrate;
// Back in Tokyo it is the 4th, so the 3rd's 250 went with the last look: two taps on a new day.
if (total() !== "500 ml of 2 L") return done("no vibration stops nothing: " + total());

// Beside the glass in a wide box, under it in a narrow one.
const glassBox = glass.getBoundingClientRect(), side = main.querySelector(".ui-water-side").getBoundingClientRect();
if (device === "tablet" && side.left < glassBox.right) return done("a tablet has them side by side");
if (device === "phone" && side.top < glassBox.bottom) return done("a phone stacks them");
const end = await done(null); if (end) return end;
