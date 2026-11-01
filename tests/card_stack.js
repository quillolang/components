// mobile
const main = $$("section.ui-cardstack")[0];
const q = (s) => main.querySelector(s), qq = (s) => [...main.querySelectorAll(s)];
const log = () => $("#cardstack-log").textContent;
const cards = () => qq(".ui-cardstack-card");
const f = (type, a) => cdp("Input.dispatchTouchEvent", { type, touchPoints: a ? [a] : [] });
// A real finger on the strip that shows, not the middle, which another card covers.
const strip = async (el) => { el.closest(".ui-cardstack").scrollIntoView({ block: "start" }); await wait(80); const r = el.getBoundingClientRect(); const p = { x: r.left + r.width / 2, y: r.top + 24 }; await f("touchStart", p); await f("touchEnd"); await wait(350); };
const field = (n) => q(`dd[data-field="${n}"]`);
const mini = (t) => qq(".ui-cardstack-mini").find((b) => b.getAttribute("aria-label") === t);
const btn = (t) => qq(".ui-btn").find((b) => b.textContent.trim() === t);
const sw = () => q(".ui-cardstack-freeze");
// Fanned: each shows a strip of at least 44 px, leaning from one side to the other.
const rs = cards().map((c) => c.getBoundingClientRect());
for (let i = 1; i < rs.length; i++) if (rs[i].top - rs[i - 1].top < 44) return "a strip too thin: " + (rs[i].top - rs[i - 1].top);
if (document.elementFromPoint(rs[0].left + rs[0].width / 2, rs[0].top + 24)?.closest(".ui-cardstack-card") !== cards()[0]) return "the first strip can be touched";
const lean = (el) => new DOMMatrix(getComputedStyle(el.closest("li")).transform).b;
if (!(lean(cards()[0]) < 0 && lean(cards()[3]) > 0)) return "they fan: " + lean(cards()[0]) + " " + lean(cards()[3]);
// Frozen from data, in words.
if (!/Frozen/.test(cards()[1].textContent) || !/, frozen$/.test(cards()[1].getAttribute("aria-label"))) return "frozen from the start";
// A colour that is not one is not written into the style.
if (/not a colour/.test(cards()[3].closest("li").getAttribute("style"))) return "a bad colour went into a style";
if (!/No cards/.test($("#cardstack-none").textContent)) return "no cards";
// A strip's tap lifts that card, up to the top and square.
await strip(cards()[2]);
if (log() !== "Lifted c") return "lift: " + log();
if (cards()[2].getAttribute("aria-expanded") !== "true") return "says it is lifted";
const up = cards()[2].getBoundingClientRect(), deck = q(".ui-cardstack-deck").getBoundingClientRect();
if (Math.abs(up.top - deck.top) > 2) return "lifted to the top: " + up.top + " " + deck.top;
// The others wait below it, a strip each, and a tap there moves on to that card.
const below = cards()[0].getBoundingClientRect();
if (below.top < up.bottom) return "below the lifted";
if (document.elementFromPoint(below.left + below.width / 2, below.top + 24)?.closest(".ui-cardstack-card") !== cards()[0]) return "a card below can be touched";
await strip(cards()[0]);
if (log() !== "Lifted a") return "lift another: " + log();
if (cards()[2].getAttribute("aria-expanded") !== "false") return "the other went back";
// A tap on it puts it back.
await tap(cards()[0]); await wait(300);
if (q(".ui-cardstack-panel") || log() !== "Lifted null") return "put back: " + log();
// Keys: Enter is a click, Escape puts back.
cards()[0].focus(); cards()[0].click(); await wait(300);
if (!q(".ui-cardstack-panel")) return "a key lifts";
key(cards()[0], "Escape"); await wait(300);
if (q(".ui-cardstack-panel")) return "Escape puts back";
await strip(cards()[0]);
// Nothing is on the page until asked for.
if (/4242 4242|737/.test(main.textContent)) return "details on the page unasked";
// Refused details say so.
$("#cardstack-lost").click(); await wait(80);
await tap(btn("Show card details")); await wait(150);
if (!/could not be fetched/.test(main.textContent) || field("number")) return "refused details";
$("#cardstack-lost").click(); await wait(80);
await tap(btn("Show card details")); await wait(200);
// Fields stay masked; each shows by itself.
if (field("number").textContent !== "•••• •••• •••• 4242" || field("cvv").textContent !== "•••") return "masked: " + field("number").textContent;
await tap(mini("Show card number"));
if (field("number").textContent !== "4242 4242 4242 4242") return "shown: " + field("number").textContent;
if (field("cvv").textContent !== "•••") return "showing one leaves the others";
await tap(mini("Hide card number"));
if (field("number").textContent !== "•••• •••• •••• 4242") return "hidden again";
// Copy gives the digits, with no spaces, per field, without showing them.
let clip = null;
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { clip = t; return Promise.resolve(); } } });
await tap(mini("Copy card number")); await wait(100);
if (clip !== "4242424242424242" || log() !== "Copied number of a") return "copy number: " + clip + " " + log();
if (field("number").textContent !== "•••• •••• •••• 4242") return "copying does not show it";
await tap(mini("Copy security code")); await wait(100);
if (clip !== "737" || log() !== "Copied cvv of a") return "copy cvv: " + clip;
if (!/Security code copied/.test(main.textContent)) return "says so";
// With no clipboard, it is put in plain sight to select.
Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
await tap(mini("Copy expires")); await wait(100);
if (field("expiry").textContent !== "04/28" || !/could not copy/.test(main.textContent)) return "no clipboard: " + field("expiry").textContent;
delete navigator.clipboard;
// Leaving the app takes them away.
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange")); await wait(120);
delete document.visibilityState;
if (field("number")) return "leaving hides them";
// They go by themselves: hide_after is 3.
await tap(btn("Show card details")); await wait(150);
if (!field("cvv")) return "details again";
await tap(mini("Show security code"));
if (field("cvv").textContent !== "737") return "cvv shown";
await wait(3300);
if (field("cvv") || !/hidden again/.test(main.textContent)) return "they run out";
// Freeze: the switch moves, says so, tells the program; refused, it goes back.
await tap(sw()); await wait(150);
if (sw().getAttribute("aria-checked") !== "true" || log() !== "Froze a") return "freeze: " + log();
if (!/Unfreeze this card/.test(q(".ui-cardstack-panel").textContent) || btn("Show card details")) return "frozen hides details";
if (!/Frozen/.test(cards()[0].textContent)) return "the card shows it";
$("#cardstack-refuse").click(); await wait(80);
await tap(sw()); await wait(150);
if (sw().getAttribute("aria-checked") !== "true" || !/could not be unfrozen/.test(main.textContent)) return "refused: " + sw().getAttribute("aria-checked");
$("#cardstack-refuse").click(); await wait(80);
await tap(sw()); await wait(150);
if (sw().getAttribute("aria-checked") !== "false" || log() !== "Unfroze a") return "unfreeze: " + log();
await tap(btn("Put back")); await wait(300);
// Details held in `cards`, with no on_reveal.
const own = $("#cardstack-own");
await tap(own.querySelector(".ui-cardstack-card")); await wait(300);
await tap([...own.querySelectorAll(".ui-btn")].find((b) => /Show card/.test(b.textContent))); await wait(150);
if (own.querySelector('dd[data-field="number"]').textContent !== "•••• •••• •••• 4444") return "own details";
if (own.querySelector('dd[data-field="expiry"]')) return "a field with nothing is left out";
await strip(cards()[1]);
if (device === "tablet") {
    const a = q(".ui-cardstack-deck").getBoundingClientRect(), b = q(".ui-cardstack-panel").getBoundingClientRect();
    if (!(b.left >= a.right) || b.top > a.top + 8) return "side by side on a tablet: " + a.right + " " + b.left + " " + (b.top - a.top);
} else {
    // Turning the phone keeps the lifted card.
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await wait(400);
    if (cards()[1].getAttribute("aria-expanded") !== "true") return "rotation keeps it";
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(300);
}
