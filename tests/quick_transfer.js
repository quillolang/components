// mobile
const box = $$("section.ui-qtransfer")[0];
const q = (s) => box.querySelector(s), qq = (s) => [...box.querySelectorAll(s)];
const keyOf = (t) => qq(".ui-qtransfer-key").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const typeKeys = async (s) => { for (const c of s) await tap(keyOf(c === "." ? "Decimal point" : c === "<" ? "Delete" : c)); };
const amount = () => q(".ui-qtransfer-amount").textContent, check = () => q(".ui-qtransfer-check").textContent, log = () => $("#qtransfer-log").textContent;
const person = (n) => qq(".ui-qtransfer-person").find((b) => b.getAttribute("aria-label") === n);
const thumb = () => q(".ui-qtransfer-thumb");
if (amount() !== "$0.00" || check() !== "Enter an amount") return "start: " + amount() + " / " + check();
if (!thumb().disabled) return "the slide is shut with nothing chosen";
if (person("Ana Reyes").querySelector(".ui-qtransfer-face").textContent !== "AR") return "initials";
if (person("Sam").querySelector(".ui-qtransfer-face").textContent !== "S") return "one name's initial";
// The keypad: leading zero, one point, two places, delete.
await typeKeys("0");
await typeKeys("5");
if (amount() !== "$5.00") return "a zero goes: " + amount();
await typeKeys("<<");
await typeKeys(".");
if (amount() !== "$0.00") return "a point on nothing: " + amount();
await typeKeys("5.123");
if (amount() !== "$0.51") return "after a second point: " + amount();
await typeKeys("<<<<");
if (amount() !== "$0.00") return "deleted: " + amount();
// Nine digits at most, whatever is pressed.
for (let i = 0; i < 11; i++) await tap(keyOf("9"));
if (amount() !== "$999,999,999.00") return "nine digits: " + amount();
if (check() !== "More than your balance of $2,481.07") return "over balance: " + check();
if (!q(".ui-qtransfer-check").classList.contains("ui-qtransfer-check-bad")) return "it shows as bad";
for (let i = 0; i < 9; i++) await tap(keyOf("Delete"));
// Each limit, by name and amount: 2000 passes the balance, then fails per transfer; 800 the day.
await typeKeys("2000");
if (check() !== "Over the limit of $1,000.00 a transfer") return "per transfer: " + check();
await typeKeys("<<<<800");
if (check() !== "Only $750.00 left of today's limit") return "daily: " + check();
await typeKeys("<<<");
// 12.34 from 2481.07 leaves 2468.73.
await typeKeys("12.34");
if (amount() !== "$12.34" || check() !== "$2,468.73 left after this") return "leaves: " + check();
// With no person, the slide stays shut.
if (!thumb().disabled) return "no person, no slide";
await tap(person("Ana Reyes"));
if (person("Ana Reyes").getAttribute("aria-pressed") !== "true") return "picked";
await wait(50);
if (thumb().disabled) return "ready to slide";
const words = thumb().getAttribute("aria-label");
if (words !== "Slide to send $12.34 to Ana Reyes") return "words: " + words;
// A slide that falls short springs back, and sends nothing.
const t = thumb().getBoundingClientRect(), p = { x: t.left + t.width / 2, y: t.top + t.height / 2 };
const room = q(".ui-qtransfer-slide").clientWidth - 58;
const f = (type, a) => cdp("Input.dispatchTouchEvent", { type, touchPoints: a ? [a] : [] });
await f("touchStart", p);
for (let i = 1; i <= 8; i++) { await f("touchMove", { x: p.x + room * 0.5 * i / 8, y: p.y }); await wait(16); }
await wait(200);
const mid = +thumb().getAttribute("aria-valuenow");
if (mid !== 50) { await f("touchEnd"); return "half way: " + mid; }
await f("touchEnd"); await wait(350);
if (thumb().style.transform !== "" || log() !== "Nothing sent") return "falls short: " + thumb().style.transform + " " + log();
// Cancelled by the system at nearly the end: nothing goes.
await f("touchStart", p);
for (let i = 1; i <= 8; i++) { await f("touchMove", { x: p.x + room * i / 8, y: p.y }); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(350);
if (thumb().style.transform !== "" || log() !== "Nothing sent") return "a cancel sends nothing: " + log();
// A vertical wander does not move it.
await drag(thumb(), 0, 80, 200); await wait(200);
if (log() !== "Nothing sent") return "a vertical drag sends nothing";
// A refusal keeps the amount and says so.
$("#qtransfer-refuse").click(); await wait(100);
await drag(thumb(), room + 20, 0, 400); await wait(300);
if (q(".ui-qtransfer-fail")?.textContent !== "Your bank declined this.") return "refused: " + q(".ui-qtransfer-fail")?.textContent;
if (amount() !== "$12.34" || thumb().style.transform !== "") return "refused keeps it: " + amount();
$("#qtransfer-refuse").click(); await wait(100);
// All the way, by hand.
await drag(thumb(), room + 20, 0, 400); await wait(300);
if (log() !== "Sent 12.34 USD to ana ($12.34)") return "sent: " + log();
if (!/\$12\.34 to Ana Reyes/.test(q(".ui-qtransfer-done").textContent)) return "the result: " + q(".ui-qtransfer-done").textContent;
// Back to the start, by a tap, clear of the release.
await wait(500);
await tap(q(".ui-qtransfer-done .ui-btn"));
if (amount() !== "$0.00" || !thumb().disabled) return "another: " + amount();
// The way without sliding, and a flick that goes past half way.
await typeKeys("7"); await tap(person("Joe Park")); await wait(60);
await tap(qq(".ui-qtransfer-other .ui-btn").find((b) => /without/.test(b.textContent)));
if (!/Send \$7\.00 to Joe Park/.test(q(".ui-qtransfer-other").textContent)) return "asks first";
await tap(qq(".ui-qtransfer-other .ui-btn").find((b) => /Yes/.test(b.textContent))); await wait(200);
if (log() !== "Sent 7 USD to joe ($7.00)") return "no slide: " + log();
await wait(500); await tap(q(".ui-qtransfer-done .ui-btn"));
await typeKeys("9"); await tap(person("Mia Lindqvist")); await wait(60);
await drag(thumb(), room * 0.7, 0, 60); await wait(300);
if (log() !== "Sent 9 USD to mia ($9.00)") return "a flick: " + log();
await wait(500); await tap(q(".ui-qtransfer-done .ui-btn"));
// By keys: digits on the pad, arrows on the thumb.
const pad = q(".ui-qtransfer-pad");
pad.focus(); key(pad, "4"); key(pad, "2"); key(pad, "."); key(pad, "5"); key(pad, "Backspace"); await wait(100);
if (amount() !== "$42.00") return "keys: " + amount();
await tap(person("Sam")); await wait(60);
thumb().focus();
key(thumb(), "ArrowRight"); key(thumb(), "ArrowRight"); key(thumb(), "ArrowRight"); await wait(60);
if (thumb().getAttribute("aria-valuenow") !== "75" || !/Sent 9 USD/.test(log())) return "three steps do not send: " + thumb().getAttribute("aria-valuenow");
key(thumb(), "ArrowLeft"); key(thumb(), "ArrowRight"); key(thumb(), "ArrowRight"); await wait(200);
if (log() !== "Sent 42 USD to sam ($42.00)") return "arrows to the end: " + log();
await wait(500); await tap(q(".ui-qtransfer-done .ui-btn"));
// A currency with no cents has no point.
const yen = $("#qtransfer-yen");
const dot = [...yen.querySelectorAll(".ui-qtransfer-key")].find((b) => b.getAttribute("aria-label") === "Decimal point");
if (!dot.disabled) return "yen has no decimals";
if (!/￥0/.test(yen.querySelector(".ui-qtransfer-amount").textContent)) return "yen: " + yen.querySelector(".ui-qtransfer-amount").textContent;
if (device === "tablet") {
    const a = q(".ui-qtransfer-who").getBoundingClientRect(), b = q(".ui-qtransfer-pay").getBoundingClientRect();
    if (!(b.left >= a.right) || b.top > a.top + 4) return "columns on a tablet: " + a.right + " " + b.left;
    if (getComputedStyle(q(".ui-qtransfer-sub")).display === "none") return "notes show on a tablet";
} else {
    // The row scrolls sideways under a thumb, and stays with the page.
    const row = q(".ui-qtransfer-people");
    if (row.scrollWidth <= row.clientWidth) return "the row scrolls: " + row.scrollWidth;
    const a = q(".ui-qtransfer-who").getBoundingClientRect(), b = q(".ui-qtransfer-pay").getBoundingClientRect();
    if (b.top < a.bottom - 1) return "stacked on a phone";
}
