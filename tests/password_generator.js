const c = $("#password-generator-demo");
const v = () => $("#password-generator-demo-value").value;
const len = $("#password-generator-demo-length");
const bits = () => c.querySelector(".ui-pwgen-strength b")?.textContent;
const rating = () => c.querySelector(".ui-pwgen-strength span")?.textContent;
const reasons = () => [...c.querySelectorAll(".ui-pwgen-reasons li")].map((l) => l.textContent);
const tickbox = (t) => [...c.querySelectorAll(".ui-pwgen-tick")].find((l) => l.textContent.startsWith(t)).querySelector("input");
const ticks = async (lower, capitals, digits, symbols) => {
    for (const [t, on] of [["a to z", lower], ["A to Z", capitals], ["0 to 9", digits], ["Symbols", symbols]]) if (tickbox(t).checked !== on) tickbox(t).click();
    await wait(30);
};
const similar = async (on) => { if (tickbox("Allow look-alikes").checked !== on) tickbox("Allow look-alikes").click(); await wait(30); };
const mode = async (m) => { const s = $("#password-generator-demo-mode"); s.value = m; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(40); };
const again = async () => { c.querySelector("[data-new]").click(); await wait(10); };
await wait(50);
// Exact entropy, worked out here: 88 characters, 20 long, each of 4 classes present.
const iex = (sizes, L) => { const N = sizes.reduce((a, b) => a + b, 0); let share = 0; for (let m = 0; m < 1 << sizes.length; m++) { let gone = 0, k = 0; sizes.forEach((s, i) => { if (m >> i & 1) { gone += s; k++; } }); share += (k % 2 ? -1 : 1) * ((N - gone) / N) ** L; } return L * Math.log2(N) + Math.log2(share); };
const cut = (x) => (Math.floor(x * 10) / 10).toFixed(1);
if (v().length !== 20) return `generated once started: "${v()}"`;
if (bits() !== `${cut(iex([26, 26, 10, 26], 20))} bits` || rating() !== "Very strong") return `${bits()} ${rating()}`;
// Every class appears, however short; nothing else does.
type(len, "4"); await wait(30);
for (let i = 0; i < 60; i++) {
    await again();
    const p = v();
    if (p.length !== 4 || !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/[0-9]/.test(p) || !/[!@#$%^&*()\-_=+\[\]{};:,.<>?/]/.test(p)) return `class missing in ${p}`;
}
if (bits() !== `${cut(iex([26, 26, 10, 26], 4))} bits` || rating() !== "Weak") return `the count takes off strings lacking a class: ${bits()}`;
// A box keeps the focus when it is ticked.
const box = tickbox("Symbols"); box.focus(); box.click(); await wait(30);
if (document.activeElement !== box || tickbox("Symbols") !== box) return "ticking a box lost the focus";
box.click(); await wait(30);
// By hand: lower and digits, length 2: 2 x 26 x 10 = 520 strings, 9.02 bits.
await ticks(true, false, true, false); type(len, "2"); await wait(30);
if (bits() !== "9.0 bits") return `520 strings: ${bits()}`;
// Refused, and why.
const refused = [
    ["0", "The length must be from 1 to 256."], ["257", "The length must be from 1 to 256."], ["abc", "The length must be a whole number."], ["", "The length must be a whole number."], ["-5", "The length must be a whole number."], ["1.5", "The length must be a whole number."], ["99999999999", "The length must be a whole number."],
    ["1", "A length of 1 cannot hold one each of 2 kinds of character: make it at least 2, or turn one off."],
];
for (const [t, why] of refused) {
    type(len, t); await wait(30);
    if (reasons().join() !== why || v() !== "" || bits() !== undefined) return `${t}: ${reasons()} / ${v()}`;
    if (!c.querySelector("[data-copy]").disabled || !c.querySelector("[data-new]").disabled) return "nothing to copy";
}
type(len, "12"); await wait(30);
await ticks(false, false, false, false);
if (reasons().join() !== "Choose at least one kind of character.") return reasons().join();
await ticks(false, false, true, false);
type($("#password-generator-demo-exclude"), "0123456789"); await wait(30);
if (reasons().join() !== "Digits are on, but every one of them is left out.") return reasons().join();
type($("#password-generator-demo-exclude"), "123456789"); await wait(30);
if (v() !== "000000000000" || bits() !== "0.0 bits") return `one character left: ${v()} ${bits()}`;
type($("#password-generator-demo-exclude"), ""); await wait(30);
// Look-alikes and exclusions never appear.
await ticks(true, true, true, false); await similar(false);
type($("#password-generator-demo-exclude"), "aeiouAEIOU"); type(len, "256"); await wait(30);
for (let i = 0; i < 5; i++) { await again(); if (/[il1Lo0OaeiuAEIU]/.test(v())) return `left out, yet there: ${v()}`; }
// a to z less a e i o u and l is 20; A to Z less A E I O U and L is 20; 0 to 9 less 0 and 1 is 8.
if (bits() !== `${cut(iex([20, 20, 8], 256))} bits`) return `the alphabet: ${bits()}`;
type($("#password-generator-demo-exclude"), ""); await wait(20);
await similar(true);
// Bias: the scripted source. A draw at or past the last whole round is thrown away.
const real = Crypto.prototype.getRandomValues;
let script = [];
Crypto.prototype.getRandomValues = function (a) { for (let i = 0; i < a.length; i++) a[i] = script.length ? script.shift() : 0; return a; };
try {
    await ticks(false, false, true, false);
    type(len, "2"); await wait(30);
    // Digits only: the last whole round of 10 below 2^32 ends at 4294967289.
    script = [4294967295, 4294967290, 4294967289, 7];
    await again();
    if (v() !== "97") return `rejection: ${v()}, wanted 97 (two draws thrown away)`;
    // A policy needing both classes draws again rather than patching: "aa" has no digit.
    await ticks(true, false, true, false);
    script = [0, 0, 0, 26]; // a, a; then a, 0 (index 26 is the first digit)
    await again();
    if (v() !== "a0") return `drawn again: ${v()}`;
} finally { Crypto.prototype.getRandomValues = real; }
// Not all in one place: 10,000 digits come out about even.
await ticks(false, false, true, false); type(len, "256"); await wait(30);
const seen = Array(10).fill(0);
for (let i = 0; i < 40; i++) { await again(); for (const d of v()) seen[+d]++; }
if (Math.min(...seen) < 800 || Math.max(...seen) > 1250) return `digits unevenly drawn: ${seen}`;
// Two tries differ.
await ticks(true, true, true, true); type(len, "32"); await wait(30);
const one = v(); await again();
if (one === v() || one.length !== 32) return "the same twice";
// Pronounceable.
await ticks(true, false, false, false);
await mode("pronounceable");
if (!/^(?:[bcdfghjklmnprstvwz][aeiou])+$/.test(v())) return `consonant, vowel in turn: ${v()}`;
if (bits() !== `${cut(16 * Math.log2(18) + 16 * Math.log2(5))} bits`) return `pronounceable: ${bits()}`;
await ticks(true, false, true, true); type(len, "9"); await wait(30);
if (!/^[bcdfghjklmnprstvwz][aeiou][bcdfghjklmnprstvwz][aeiou][bcdfghjklmnprstvwz][aeiou][bcdfghjklmnprstvwz][0-9][!@#$%^&*()\-_=+\[\]{};:,.<>?/]$/.test(v())) return `the tail: ${v()}`;
type(len, "3"); await wait(30);
if (reasons().join() !== "A length of 3 leaves 1 letter after the digit and symbol; pronounceable needs at least 2.") return reasons().join();
type(len, "12"); await wait(20);
type($("#password-generator-demo-exclude"), "aeiou"); await wait(30);
if (reasons().join() !== "Every vowel is left out, so nothing can be said.") return reasons().join();
type($("#password-generator-demo-exclude"), ""); await wait(20);
await ticks(false, false, true, true);
if (reasons().join() !== "A pronounceable password needs letters: turn on lower case or capitals.") return reasons().join();
await mode("random");
if (v().length !== 12) return `back to random: ${v()}`;
// Passphrase: its own component, on_change, and the word list.
const pc = $("#password-generator-demo-phrase");
const pv = () => $("#password-generator-demo-phrase-value").value;
const pbits = () => pc.querySelector(".ui-pwgen-strength b")?.textContent;
const size = pv().split("-").length;
if (size !== 5 || !/^[a-z]+(-[a-z]+){4}$/.test(pv())) return `a passphrase: ${pv()}`;
if (pbits() !== `${cut(5 * Math.log2(1368))} bits`) return `five of 1,368 words: ${pbits()}`;
const pcount = $("#password-generator-demo-phrase-count");
type($("#password-generator-demo-phrase-separator"), " "); await wait(30);
if (pv().split(" ").length !== 5) return `the separator: ${pv()}`;
type(pcount, "25"); await wait(30);
if (pc.querySelector(".ui-pwgen-reasons li")?.textContent !== "A passphrase has 1 to 24 words.") return "the words' cap";
if (pv() !== "") return "refused: no password";
type(pcount, "3"); await wait(30);
if (pv().split(" ").length !== 3) return pv();
if (!$("[data-said]").textContent.startsWith("on_change has been called")) return "on_change";
const n = +$("[data-said]").textContent.match(/\d+/)[0];
if (n !== 4) return `on_change once at the start and once for each of three changes: ${n}`;
if ($("#password-generator-demo-phrase-value").name !== "password") return "the field's name";
// Copy works or says it did not.
c.querySelector("[data-copy]").click(); await wait(120);
const s = c.querySelector(".ui-pwgen-said").textContent;
if (s !== "Copied" && s !== "Could not copy: select it instead") return `copy: ${s}`;
