// mobile
const scope = (id) => document.getElementById(id);
const usd = scope("amount-pad-demo-usd"), jpy = scope("amount-pad-demo-jpy"), kwd = scope("amount-pad-demo-kwd"), odd = scope("amount-pad-demo-odd");
const k = (p, x) => p.querySelector(`[data-key="${x}"]`);
const fig = (p) => p.querySelector("output").textContent;
const note = (p) => p.querySelector("[role=status]").textContent;
const out = () => $("#amount-pad-demo-out").textContent;
const field = (p) => p.querySelector("input[type=hidden]").value;
const done = usd.querySelector(".ui-amount-pad-done");
const norm = (s) => s.replace(/\s/g, " ");
const felt = []; window.quilloNative = { haptic: (x) => { felt.push(x); return Promise.resolve(); } };
try {
if (fig(usd) !== "$0.00" || !usd.querySelector("output").classList.contains("ui-amount-pad-zero")) return `empty: ${fig(usd)}`;
if (!done.disabled) return "Send is on with nothing typed";
if (note(usd) !== "Up to $5,000.00") return `note: ${note(usd)}`;
// From the right.
await tap(k(usd, "0"));
if (fig(usd) !== "$0.00" || field(usd) !== "") return `a leading zero: ${fig(usd)}`;
await tap(k(usd, "1"));
if (fig(usd) !== "$0.01" || field(usd) !== "0.01" || out() !== "Amount: 0.01") return `1: ${fig(usd)}, ${field(usd)}, ${out()}`;
if (note(usd) !== "Least is $1.00" || !done.disabled) return `below the least: ${note(usd)}, ${done.disabled}`;
await tap(k(usd, "2"));
if (fig(usd) !== "$0.12") return `12: ${fig(usd)}`;
await tap(k(usd, "3"));
if (fig(usd) !== "$1.23" || field(usd) !== "1.23") return `123: ${fig(usd)}`;
if (done.disabled || note(usd) !== "Up to $5,000.00") return "at the least it is not ready";
await tap(k(usd, "00"));
if (fig(usd) !== "$123.00" || field(usd) !== "123.00") return `00: ${fig(usd)}`;
await tap(k(usd, "back"));
if (fig(usd) !== "$12.30") return `delete: ${fig(usd)}`;
// Past the limit: refused, a shake that starts again each time, the phone answers.
await tap(k(usd, "back")); await tap(k(usd, "4")); await tap(k(usd, "00"));
if (fig(usd) !== "$1,234.00") return `to 1234: ${fig(usd)}`;
const root = usd.querySelector(".ui-amount-pad-figure").closest(".ui-amount-pad");
felt.length = 0;
await tap(k(usd, "0"));
if (fig(usd) !== "$1,234.00") return `past the limit: ${fig(usd)}`;
const first = root.className;
if (!/ui-amount-pad-shake-[12]/.test(first)) return "no shake";
if (note(usd) !== "Most is $5,000.00" || !usd.querySelector("[role=status]").hasAttribute("data-bad")) return `refused: ${note(usd)}`;
if (!felt.includes("error")) return `the phone did not answer: ${felt}`;
await tap(k(usd, "0"));
if (root.className === first) return "a second refusal does not shake again";
if (!usd.querySelector(".ui-amount-pad-figure").getAnimations().length && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    await tap(k(usd, "0"));
}
// An accepted key clears the refusal; exactly the limit is allowed.
await tap(k(usd, "back"));
if (note(usd) !== "Up to $5,000.00") return `after a good key: ${note(usd)}`;
await hold(k(usd, "back"), 900);
if (fig(usd) !== "$0.00" || out() !== "Amount: none") return `hold to empty: ${fig(usd)}, ${out()}`;
for (const d of ["5", "0", "0", "0"]) await tap(k(usd, d));
await tap(k(usd, "00"));
if (fig(usd) !== "$5,000.00") return `the limit itself: ${fig(usd)}`;
await tap(done);
if (out() !== "Amount: 5000.00; sent 5000.00") return `on_done: ${out()}`;
} finally { delete window.quilloNative; }
// Yen: no decimals, no 00 key, digits are whole yen.
if (norm(fig(jpy)) !== "￥1,200") return `yen: ${fig(jpy)}`;
if (k(jpy, "00")) return "yen have a 00 key";
await tap(k(jpy, "5"));
if (norm(fig(jpy)) !== "￥12,005") return `yen, one more: ${fig(jpy)}`;
await tap(k(jpy, "9"));
if (norm(fig(jpy)) !== "￥12,005" || !/50,000/.test(note(jpy))) return `yen limit: ${fig(jpy)}, ${note(jpy)}`;
// Dinars: three decimals, and a value of 1.5 is 1.500.
if (norm(fig(kwd)) !== "KWD 1.500") return `dinars: ${fig(kwd)}`;
await tap(k(kwd, "7"));
if (norm(fig(kwd)) !== "KWD 15.007") return `dinars, one more: ${fig(kwd)}`;
// No limit but 15 digits, which stay exact.
for (const d of "123456789012345") await tap(k(kwd, d));
if (norm(fig(kwd)).replace(/[^0-9]/g, "").length !== 15) return `15 digits: ${fig(kwd)}`;
// What it does not know does not stop it.
if (fig(odd) !== "XQQ 0.00") return `an unknown currency: ${fig(odd)}`;
await tap(k(odd, "4"));
if (fig(odd) !== "XQQ 0.04") return `typed in it: ${fig(odd)}`;
// A real keyboard.
k(odd, "5").focus();
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "7", code: "Digit7", text: "7" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "7", code: "Digit7" }); await wait(100);
if (fig(odd) !== "XQQ 0.47") return `a typed 7: ${fig(odd)}`;
// A tablet has the amount beside the keys; the figure stays inside.
const wide = usd.clientWidth >= 440;
if (wide !== (device === "tablet")) return `the pane is ${usd.clientWidth}`;
const fr = usd.querySelector(".ui-amount-pad-show").getBoundingClientRect(), kr = usd.querySelector(".ui-number-pad-keys").getBoundingClientRect();
if ((fr.right <= kr.left) !== wide) return `side by side at ${usd.clientWidth}`;
const f = kwd.querySelector("output").getBoundingClientRect(), s = kwd.querySelector(".ui-amount-pad-show").getBoundingClientRect();
if (f.width > s.width + 1) return `the figure is ${f.width} in ${s.width}`;
