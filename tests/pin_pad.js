// mobile
const stored = () => (document.cookie.match(/(?:^|; )pin-pad-demo=([^;]*)/) || [])[1];
const forget = () => { document.cookie = "pin-pad-demo=; path=/; max-age=0"; };
forget();
const main = document.getElementById("pin-pad-demo-main");
const k = (x) => main.querySelector(`[data-key="${x}"]`);
const dots = () => main.querySelector(".ui-pin-pad-dots");
const lit = () => main.querySelectorAll(".ui-pin-pad-on").length;
const said = () => main.querySelector(".ui-pin-pad-said").textContent;
const out = () => $("#pin-pad-demo-out").textContent;
const enter = async (code) => { for (const d of code) await tap(k(d)); };
const clean = (code) => !document.documentElement.outerHTML.includes(code) && ![...document.querySelectorAll("input")].some((i) => i.value.includes(code));
// Bring the pad back from away, so that it reads what was stored.
const again = $("#pin-pad-demo-again");
const remake = async () => { await tap(again); await tap(again); await wait(100); };
const felt = []; window.quilloNative = { haptic: (x) => { felt.push(x); return Promise.resolve(); } };
try {
if (main.querySelectorAll(".ui-pin-pad-dot").length !== 4 || dots().getAttribute("aria-label") !== "0 of 4 digits entered") return "dots";
if (main.querySelector("input")) return "there is a field that could hold the code";
// Dots follow; delete takes one back; only counts are in the page.
await tap(k("1")); await tap(k("3"));
if (lit() !== 2 || dots().getAttribute("aria-label") !== "2 of 4 digits entered") return `2 digits: ${lit()}`;
await tap(k("back"));
if (lit() !== 1) return `delete: ${lit()}`;
await tap(k("back")); await tap(k("back"));
if (lit() !== 0) return `delete on empty: ${lit()}`;
// Wrong: a shake, cleared dots, tries counted down.
await enter("9734");
if (lit() !== 0 || !clean("9734") || !clean("973")) return "the wrong code is in the page";
if (!/ui-pin-pad-shake-[12]/.test(dots().className)) return "no shake on a wrong code";
if (said() !== "Wrong code. 2 tries left.") return `said: ${said()}`;
if (!felt.includes("error")) return `no answer from the phone: ${felt}`;
const shaking = dots().className;
// Typing again clears the message; the tries are kept over a remake.
await tap(k("1"));
if (said() !== "") return `typing again: ${said()}`;
await tap(k("back"));
await remake();
if (stored() !== "1.0.0") return `stored: ${stored()}`;
await enter("0000");
if (said() !== "Wrong code. 1 try left.") return `after a remake the tries were lost: ${said()}`;
if (!clean("0000")) return "the code is in the page";
// The third locks it, with a countdown; keys are off.
await enter("1111");
if (!k("1").disabled) return "the keys work while locked";
if (!/^Try again in 0:0[1-3]$/.test(said())) return `locked: ${said()}`;
if (out() !== "The code is the middle column, top to bottom. Locked for 3 s") return `on_locked: ${out()}`;
await tap(k("2"));
if (lit() !== 0) return "a digit went in while locked";
// It survives being made again.
await remake();
if (!/^Try again in 0:0[1-3]$/.test(said()) || !k("1").disabled) return `a remake escapes the lock: ${said()}`;
// The countdown ends by the clock.
for (let i = 0; i < 60 && k("1").disabled; i++) await wait(100);
if (k("1").disabled || said() !== "") return `after the lock-out: ${said()}`;
// The next lock-out is twice as long.
await enter("1111"); await enter("1112"); await enter("1113");
const twice = said();
if (!/^Try again in 0:0[4-6]$/.test(twice)) return `the second lock-out: ${twice}`;
// A clock set forward by the phone sleeping ends it; the keys need no timer to catch up.
const real = Date.now; Date.now = () => real() + 3600000;
await wait(500);
Date.now = real;
if (k("1").disabled) return "a clock past the end does not end the lock-out";
// Right.
felt.length = 0;
await enter("2580");
if (!clean("2580")) return "the right code is in the page";
await wait(100);
if (!$("#pin-pad-demo-open")) return "the right code did not open it";
if (document.querySelector("#pin-pad-demo-quick .ui-pin-pad-dots").getAttribute("aria-label") !== "0 of 2 digits entered") return "the click ending the last tap landed on what came up under the finger";
if (!felt.includes("success")) return `success: ${felt}`;
if (stored() !== "0.0.0") return `stored after success: ${stored()}`;
await tap(again); await tap(again); await wait(100);
if (!dots()) return "the pad did not come back";
// Junk in storage is ignored.
document.cookie = "pin-pad-demo=junk; path=/";
await remake();
if (said() !== "" || k("1").disabled) return `junk in storage: ${said()}`;
// A real keyboard, with no digit in the page.
k("5").focus();
for (const d of "12") {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: d, code: "Digit" + d, text: d });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: d, code: "Digit" + d }); await wait(60);
}
if (lit() !== 2) return `keyboard: ${lit()}`;
await tap(k("back")); await tap(k("back"));
} finally { delete window.quilloNative; forget(); }
// A check that answers on the spot, and no storage.
const quick = document.getElementById("pin-pad-demo-quick"), qk = (x) => quick.querySelector(`[data-key="${x}"]`);
await tap(qk("4")); await tap(qk("1"));
if (quick.querySelector(".ui-pin-pad-said").textContent !== "Wrong code. 4 tries left.") return `a wrong quick code: ${quick.querySelector(".ui-pin-pad-said").textContent}`;
if (quick.querySelector(".ui-pin-pad-dots").getAttribute("aria-label") !== "0 of 2 digits entered") return "the dots of a wrong quick code";
await tap(qk("4")); await tap(qk("2"));
if ($("#pin-pad-demo-quick-out").textContent !== "Quick code right.") return `a right quick code: ${$("#pin-pad-demo-quick-out").textContent}`;
if (!qk("1").disabled) return "the keys go on after it opened";
if (/(^|; )(null|quillo-pin-pad)=/.test(document.cookie)) return `remember={null} stored something: ${document.cookie}`;
// A check whose Promise gives nothing is a wrong code, not a stopped pad.
await tap($("#pin-pad-demo-nothing")); await wait(100);
const blank = document.getElementById("pin-pad-demo-blank"), bk = (x) => blank.querySelector(`[data-key="${x}"]`);
await tap(bk("1")); await wait(200);
if (blank.querySelector(".ui-pin-pad-said").textContent !== "Wrong code. 4 tries left.") return `a Promise of nothing: ${blank.querySelector(".ui-pin-pad-said").textContent}`;
// A check that fails to answer costs no try.
await tap(bk("2")); await wait(200);
if (blank.querySelector(".ui-pin-pad-said").textContent !== "Could not check it. Try again.") return `a refused Promise: ${blank.querySelector(".ui-pin-pad-said").textContent}`;
await tap(bk("3")); await wait(200);
if (blank.querySelector(".ui-pin-pad-said").textContent !== "Wrong code. 3 tries left.") return `after a refusal: ${blank.querySelector(".ui-pin-pad-said").textContent}`;
// Space: on a tablet the dots stand beside the keys.
const pad = document.getElementById("pin-pad-demo-main");
const wide = pad.clientWidth >= 440;
if (wide !== (device === "tablet")) return `the pane is ${pad.clientWidth}`;
const h = main.querySelector(".ui-pin-pad-head").getBoundingClientRect(), ks = main.querySelector(".ui-number-pad-keys").getBoundingClientRect();
if ((h.right <= ks.left) !== wide) return `side by side at ${pad.clientWidth}`;
