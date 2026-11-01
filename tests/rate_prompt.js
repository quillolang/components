// mobile
const name = "ui-demo-rate", day = 86400000, t0 = 1793000000000;
const clear = () => { document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name); };
const task = $("#rate-prompt-demo-task"), start = $("#rate-prompt-demo-start"), later = $("#rate-prompt-demo-week");
const why = () => $("#rate-prompt-demo-why").textContent;
const sent = () => $("#rate-prompt-demo-why").dataset.sent;
const box = () => $(".ui-rate-prompt");
const btn = (t) => [...box().querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
const stats = () => JSON.parse(localStorage.getItem(name));
const tiny = (box) => [...box.querySelectorAll("button, a[href], select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((e) => e.tagName + " " + e.textContent.trim().slice(0, 20));
const seed = async (s) => { const text = JSON.stringify(s); localStorage.setItem(name, text); document.cookie = name + "=" + encodeURIComponent(text) + "; path=/"; await tap(start); await wait(250); };
// A person who has used it for a long time: all rules met on the day the test stands at.
const well = (over) => ({ first: 1000000000000, last_use: 1000000000000, uses: 50, moments: 50, asked: [], rated: null, never: false, problem: 0, ...over });
clear(); await tap(start); await wait(250);

// A new person: never asked, and it says why not.
await tap(task); await wait(120);
if (box()) return "must not ask on the first day";
if (why() !== "Not yet: days.") return "first day: " + why();
const first = stats();
if (first.uses !== 1 || first.moments !== 1 || first.asked.length !== 0) return "counts: " + JSON.stringify(first);
// Starts of the app count; the same half hour does not. Two starts a day apart are two.
await tap(start); await wait(250);
if (stats().uses !== 2) return "another start: " + stats().uses;
// The rule, row by row. `now` in the demo moves with `day`, so a seed's times are relative to a far past.
const cases = [
    [{ never: true }, "never"],
    [{ rated: "2.3.0" }, "rated"],
    [{ first: 8e15 }, "days"],
    [{ uses: 3 }, "uses"],     // a start is added on the way in, so 4
    [{ moments: 1 }, "moments"],
];
for (const [over, want] of cases) {
    await seed(well(over));
    await tap(task); await wait(120);
    if (box()) return "asked when " + want;
    if (why() !== `Not yet: ${want}.`) return JSON.stringify(over) + " should be " + want + ": " + why();
}
// A rating for an old version does not stop a new one.
await seed(well({ rated: "2.2.0" }));
await tap(task); await wait(150);
if (!box() || why() !== "It asked.") return "a rating of an older version: " + why();
const nowish = stats().asked.at(-1);
await tap(btn("Not now")); await wait(120);
if (box()) return "Not now closes";
// It counted as asking: the gap holds even with more good moments.
await tap(task); await wait(120);
if (box() || why() !== "Not yet: gap.") return "asked too soon after asking: " + why();
// 100 days on is under the gap of 120.
later.click(); await wait(250);
await tap(task); await wait(120);
if (box() || why() !== "Not yet: gap.") return "100 days is under the gap: " + why();
await tap(later); await wait(250);
await tap(task); await wait(150);
if (!box()) return "past the gap it asks: " + why();
await tap(btn("Not now")); await wait(120);
// Three in a year is the limit, even with a short gap asked for by nobody: seeded times in the last year.
const n = stats().asked.at(-1);
await seed(well({ asked: [n - 300 * day, n - 200 * day, n - 130 * day] }));
await tap(task); await wait(120);
if (box() || why() !== "Not yet: year.") return "three in a year: " + why();
// After a problem was sent, quiet.
await seed(well({ problem: n - 10 * day }));
await tap(task); await wait(120);
if (box() || why() !== "Not yet: problem.") return "quiet after a problem: " + why();
// Held back while busy.
const busy = $("#rate-prompt-demo-busy");
await seed(well({}));
busy.checked = true; busy.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
await tap(task); await wait(120);
if (box() || why() !== "Not yet: held.") return "while busy: " + why();
busy.checked = false; busy.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);

// Bad storage is a fresh start, and no error.
document.cookie = name + "=%7Bbad; path=/"; localStorage.setItem(name, "{bad");
await tap(start); await wait(250);
if (stats().uses !== 1) return "bad storage: " + JSON.stringify(stats());

// High stars: the store, and both routes.
await seed(well({}));
await tap(task); await wait(150);
const starButtons = () => [...box().querySelectorAll(".ui-rate-prompt-star")];
if (starButtons().length !== 5) return "five stars";
if (!btn("Report a problem instead")) return "the problem route is there before any stars";
if (tiny(box()).length) return "too small asking: " + tiny(box());
await tap(starButtons()[4]); await wait(150);
if ($("#rate-prompt-demo-why").dataset.stars !== "5") return "on_rated";
if (tiny(box()).length) return "too small at the store step: " + tiny(box());
const store = [...box().querySelectorAll("a.ui-btn")].find((a) => a.textContent.trim() === "Rate in the store");
if (!store) return "the store's link";
// With touch on, this Chrome on a Mac reads as an iPad, which says it is a Mac (force_update.js tests the rest).
if (!store.href.startsWith(navigator.userAgent.includes("Macintosh") ? "https://apps.apple.com/" : "https://quillolang.org/rate")) return "the page for this system: " + store.href;
if (!btn("Report a problem")) return "a person who likes it can still report a problem";
await tap(btn("I have done it")); await wait(120);
if (box()) return "done closes";
if (stats().rated !== "2.3.0") return "a rating is kept for its version: " + stats().rated;
await tap(task); await wait(120);
if (why() !== "Not yet: rated.") return "no more for this version: " + why();

// Low stars: a problem first, and the store still there. Failing keeps the words.
await seed(well({}));
await tap(task); await wait(150);
await tap(starButtons()[1]); await wait(150);
if (box().querySelector("h2").textContent !== "What went wrong?") return "low stars ask what went wrong";
if (![...box().querySelectorAll("a.ui-btn")].some((a) => a.textContent.trim() === "Rate in the store")) return "low stars are not kept from the store";
await tap(btn("Send")); await wait(120);
if (box().querySelector(".ui-rate-prompt-bad")?.textContent !== "Write what went wrong first.") return "blank";
const area = () => box().querySelector("textarea");
if (parseFloat(getComputedStyle(area()).fontSize) < 16) return "16 px, or iOS zooms";
type(area(), "It lost a note"); await wait(100);
const fail = $("#rate-prompt-demo-fail"); fail.checked = true; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
await tap(btn("Send")); await wait(150);
if (box().querySelector(".ui-rate-prompt-bad")?.textContent !== "That did not send. Your words are still here. Try again.") return "failing: " + box().querySelector(".ui-rate-prompt-bad")?.textContent;
if (area().value !== "It lost a note") return "the words stay: " + area().value;
fail.checked = false; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
await tap(btn("Send")); await wait(150);
if (sent() !== "2: It lost a note") return "on_problem: " + sent();
if (!box().textContent.includes("We have it")) return "says it was received";
if (stats().problem === 0) return "the date of the problem is kept";
await tap(btn("Close")); await wait(120);
if (box()) return "Close closes";

// The same with answers as Promises: false keeps the words, true sends.
const slow = $("#rate-prompt-demo-slow");
const setSlow = async (on) => { slow.checked = on; slow.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
await setSlow(true);
await seed(well({}));
await tap(task); await wait(150);
await tap(btn("Report a problem instead")); await wait(150);
type(area(), "Slow failing"); await wait(100);
fail.checked = true; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
await tap(btn("Send")); await wait(200);
if (box().querySelector(".ui-rate-prompt-bad")?.textContent !== "That did not send. Your words are still here. Try again.") return "a Promise of false: " + box().querySelector(".ui-rate-prompt-bad")?.textContent;
if (area().value !== "Slow failing") return "the words stay with a Promise too";
fail.checked = false; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
await tap(btn("Send")); await wait(200);
if (sent() !== "0: Slow failing") return "a Promise of true: " + sent();
await tap(btn("Close")); await wait(120);
await setSlow(false);

// The problem route with no stars.
await seed(well({}));
await tap(task); await wait(150);
await tap(btn("Report a problem instead")); await wait(150);
type(area(), "Crashes"); await wait(100);
await tap(btn("Send")); await wait(150);
if (sent() !== "0: Crashes") return "no stars: " + sent();
await tap(btn("Close")); await wait(120);

// Do not ask again, for good.
await seed(well({}));
await tap(task); await wait(150);
await tap(btn("Do not ask again")); await wait(120);
if (stats().never !== true) return "never is kept";
await tap(later); await wait(250);
await tap(task); await wait(120);
if (box() || why() !== "Not yet: never.") return "never means never: " + why();

// Escape, the real key, and the keyboard coming up lifts the card.
await seed(well({}));
await tap(task); await wait(150);
const vv = visualViewport, h = vv.height, b0 = box().getBoundingClientRect().bottom;
Object.defineProperty(vv, "height", { configurable: true, get: () => h - 200 });
vv.dispatchEvent(new Event("resize")); await wait(300);
const b1 = box().getBoundingClientRect().bottom;
delete vv.height; vv.dispatchEvent(new Event("resize")); await wait(60);
if (Math.round(b0 - b1) !== 200) return "lifted clear of the keyboard: " + (b0 - b1);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(150);
if (box()) return "Escape closes";

// A tablet: a card in the corner, not a bar across.
await seed(well({}));
await tap(task); await wait(150);
const c = box().getBoundingClientRect();
if (innerWidth >= 700 ? (Math.round(c.width) !== 380 || c.right < innerWidth - 40) : c.width < 300) return "the card's place: " + JSON.stringify(c);
await tap(btn("Not now")); await wait(100);
clear();
