// mobile
const main = $$("section.ui-qrpay")[0], short = $("#qrpay-short"), linked = $("#qrpay-link");
const log = () => $("#qrpay-log").textContent;
const q = (s) => main.querySelector(s);
const btn = (el, t) => [...el.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
const status = (el) => el.querySelector(".ui-qrpay-status").textContent.trim();
if (!/Pay Cafe Luz/.test(q(".ui-qrpay-sum").textContent) || q(".ui-qrpay-sum strong").textContent !== "$12.50") return "the amount: " + q(".ui-qrpay-sum").textContent;
if (status(main) !== "Waiting for payment") return "status: " + status(main);
// The code says what it should: the same drawing as a code of the known text.
const known = $("#qrpay-same path").getAttribute("d");
if (q(".ui-qrpay-code path").getAttribute("d") !== known) return "the code's text is not the known text";
// The clock: 300 s, read from time. A little under five minutes now.
if (!/^Runs out in 4:5\d|^Runs out in 5:00/.test(q(".ui-qrpay-clock p").textContent)) return "the clock: " + q(".ui-qrpay-clock p").textContent;
// Bad amount: any amount; every value in the text encoded; `ann bo` stays as `to` gives it.
if (short.querySelector(".ui-qrpay-sum strong").textContent !== "Any amount") return "bad amount: " + short.querySelector(".ui-qrpay-sum strong").textContent;
if (!/Pay Ann & Bo/.test(short.querySelector(".ui-qrpay-sum").textContent)) return "a payee with &";
// A link, with a query added, and no time limit.
if (!/no time limit/.test(linked.textContent) || linked.querySelector(".ui-qrpay-clock")) return "no limit";
// The short one runs out by the clock, the code leaves the page.
await wait(2300);
if (status(short) !== "Expired" || short.querySelector("svg")) return "ran out: " + status(short);
if (!/run out/.test(short.querySelector(".ui-qrpay-code").textContent)) return "says so";
// The first renewal is refused and it says so; the second gives a new code.
await tap(btn(short, "New code")); await wait(100);
if (!/could not be made/.test(short.textContent) || status(short) !== "Expired") return "a refused renewal: " + status(short);
// While it is up the screen is asked to stay on; where that is refused the page says so.
window.quilloNative = { keepAwake: () => Promise.reject(new Error("no")) };
await tap(btn(short, "New code")); await wait(150);
delete window.quilloNative;
if (status(short) !== "Waiting for payment" || !short.querySelector("svg")) return "renewed: " + status(short);
if (!/may go dark/.test(short.textContent)) return "says the screen may sleep: " + short.textContent;
if (!/Ref S-2/.test(short.textContent) || /could not/.test(short.textContent)) return "new reference: " + short.textContent;
// Share: the app first, with the text and no https address, as this has none.
const calls = [];
window.quilloNative = {
    share: (t, u) => { calls.push(["share", t, u]); return Promise.resolve({ shared: true }); },
    keepAwake: (v) => { calls.push(["awake", v]); return Promise.resolve(true); },
    haptic: (k) => { calls.push(["haptic", k]); return Promise.resolve(true); },
};
const gone = () => { delete window.quilloNative; };
await tap(btn(main, "Share")); await wait(150);
const shared = calls.find((c) => c[0] === "share");
if (!shared || shared[1] !== "Pay Cafe Luz $12.50 (R-1042): pay:cafe@luz?amount=12.50&cur=USD&ref=R-1042") { gone(); return "app share: " + JSON.stringify(calls); }
if (log() !== "Shared: " + shared[1]) { gone(); return "on_share: " + log(); }
// iOS says when the person backed out, which is not a share; Android only ever says true.
window.quilloNative.share = () => Promise.resolve({ shared: false, to: null });
const had = log();
await tap(btn(main, "Share")); await wait(150);
if (log() !== had) { gone(); return "backed out of the sheet: " + log(); }
window.quilloNative.share = (t, u) => { calls.push(["android", t, u]); return Promise.resolve(true); };
await tap(btn(main, "Share")); await wait(150);
if (!calls.some((c) => c[0] === "android" && c[2] === undefined)) { gone(); return "no empty address goes to the sheet: " + JSON.stringify(calls); }
// Refused there, it goes on to the clipboard.
window.quilloNative.share = () => Promise.reject(new Error("no screen"));
let clip = null;
const realClip = Object.getOwnPropertyDescriptor(Navigator.prototype, "clipboard");
const fakeClip = (fn) => Object.defineProperty(navigator, "clipboard", { configurable: true, value: fn });
fakeClip({ writeText: (t) => { clip = t; return Promise.resolve(); } });
await tap(btn(main, "Share")); await wait(150);
if (clip !== shared[1] || !/Copied/.test(main.textContent)) { gone(); return "the clipboard next: " + clip; }
gone();
// The browser's sheet, and a person changing their mind says nothing.
let sent = null;
Object.defineProperty(navigator, "share", { configurable: true, value: (d) => { sent = d; return Promise.reject(new DOMException("Share canceled", "AbortError")); } });
await tap(btn(main, "Share")); await wait(150);
if (sent?.text !== shared[1] || /Copied|Nothing here/.test(main.textContent)) return "web share cancelled: " + JSON.stringify(sent) + main.textContent;
// With nothing at all, the text is there to copy by hand.
Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
fakeClip(undefined);
await tap(btn(main, "Share")); await wait(150);
if (q(".ui-qrpay-copy")?.value !== shared[1]) return "by hand: " + q(".ui-qrpay-copy")?.value;
delete navigator.share; delete navigator.clipboard;
// Status from the page: paid stops the clock and takes the code away.
window.quilloNative = { keepAwake: (v) => { calls.push(["awake", v]); return Promise.resolve(true); }, haptic: (k) => { calls.push(["haptic", k]); return Promise.resolve(true); } };
await tap($("#qrpay-pay")); await wait(150);
if (status(main) !== "Paid" || q("svg") || !/Paid/.test(q(".ui-qrpay-code").textContent)) { gone(); return "paid: " + status(main); }
if (q(".ui-qrpay-clock")) { gone(); return "no clock once paid"; }
if (!calls.some((c) => c[0] === "haptic" && c[1] === "success")) { gone(); return "a tap felt: " + JSON.stringify(calls); }
if (!calls.some((c) => c[0] === "awake" && c[1] === false)) { gone(); return "the screen lets go: " + JSON.stringify(calls); }
gone();
if (device === "tablet") {
    const a = q(".ui-qrpay-code").getBoundingClientRect(), b = q(".ui-qrpay-side").getBoundingClientRect();
    if (!(b.left >= a.right)) return "beside on a tablet: " + a.right + " " + b.left;
}
