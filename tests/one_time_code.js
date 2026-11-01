// mobile
const a = $("#one-time-code-demo-a"), b = $("#one-time-code-demo-b");
const row = (i) => i.closest(".ui-one-time-code");
const boxes = (i) => [...row(i).querySelectorAll(".ui-one-time-code-box")];
const shown = (i) => boxes(i).map((e) => e.textContent || "_").join("");
const out = () => $("#one-time-code-demo-out").textContent;
const insert = (text) => cdp("Input.insertText", { text });
const back = async () => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Backspace", code: "Backspace", windowsVirtualKeyCode: 8 }); await wait(80); };
const form = $("#one-time-code-demo-form");
form.addEventListener("submit", (e) => e.preventDefault());
let submits = 0; form.addEventListener("submit", () => submits++);
// What the system needs.
if (a.tagName !== "INPUT" || a.autocomplete !== "one-time-code" || a.inputMode !== "numeric" || a.name !== "code") return `the field: ${a.autocomplete}, ${a.inputMode}, ${a.name}`;
if ($$("#one-time-code-demo-form input").length !== 1) return "more than one field: the system fills only one";
if (a.maxLength !== -1) return "a maxlength cuts a paste short";
if (parseFloat(getComputedStyle(a).fontSize) < 16) return "under 16 px iOS zooms on focus";
if (boxes(a).length !== 6 || !boxes(a).every((e) => e.getAttribute("aria-hidden") === "true")) return "the boxes";
if (row(a).querySelector("label").htmlFor !== a.id) return "no label";
// A real tap focuses the field, and the first box shows it.
await tap(a); await wait(60);
if (document.activeElement !== a) return "a tap does not focus the field";
if (!boxes(a)[0].classList.contains("ui-one-time-code-at")) return "the first box is not marked";
// Typing goes box by box, deletion goes back.
await insert("1"); await insert("2"); await insert("3"); await wait(60);
if (shown(a) !== "123___" || !boxes(a)[3].classList.contains("ui-one-time-code-at")) return `typed: ${shown(a)}`;
await back();
if (shown(a) !== "12____" || a.value !== "12" || !boxes(a)[2].classList.contains("ui-one-time-code-at")) return `Backspace: ${shown(a)}`;
await back(); await back(); await back();
if (shown(a) !== "______") return `Backspace past the start: ${shown(a)}`;
// A letter in a digits field goes.
await insert("x"); await wait(60);
if (a.value !== "" || shown(a) !== "______") return `a letter: "${a.value}"`;
// The system's offer: the whole code at once, one submit, once.
await insert("987654"); await wait(120);
if (shown(a) !== "987654" || a.value !== "987654") return `filled at once: ${shown(a)}`;
if (submits !== 1 || !out().startsWith("Sent 987654.")) return `auto-submit: ${submits}, ${out()}`;
if (!row(a).querySelector("[role=alert]")?.textContent.includes("not the code")) return "the error is not shown";
if (a.getAttribute("aria-invalid") !== "true") return "aria-invalid";
await wait(60);
// The error selects it all: the next digit starts afresh.
if (a.selectionStart !== 0 || a.selectionEnd !== 6) return `selected ${a.selectionStart}-${a.selectionEnd}`;
await back();
if (shown(a) !== "______") return `after an error: ${shown(a)}`;
// A paste of the message as sent: only its code.
await insert("Your code is 424242. It expires in 10 minutes."); await wait(150);
if (a.value !== "424242" || submits !== 2 || !out().startsWith("Verified 424242.")) return `a message pasted: ${a.value}, ${submits}, ${out()}`;
if (row(a).querySelector("[role=alert]")) return "the error stays";
// The same code does not go twice for nothing; deleting and retyping sends it again.
await back(); await insert("2"); await wait(120);
if (a.value !== "424242" || submits !== 3) return `retyped: ${a.value}, ${submits}`;
// Spaces and dashes in a paste, and too much.
await tap(a); a.select(); await insert("12 34-5678"); await wait(150);
if (a.value !== "123456") return `spaces in a paste: ${a.value}`;
// Tapping a filled box retypes it, and moves on, without shifting the others.
const r = boxes(a)[2].getBoundingClientRect();
const hit = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [hit] }); await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(250);
if (a.selectionStart !== 2 || a.selectionEnd !== 3) return `box 3 selected ${a.selectionStart}-${a.selectionEnd}`;
await insert("9"); await wait(80);
if (a.value !== "129456") return `retyped box 3: ${a.value}`;
if (a.selectionStart !== 3 || a.selectionEnd !== 4) return `then box 4 ${a.selectionStart}-${a.selectionEnd}`;
// Delete in the middle closes up: no holes for the system to trip on.
await back();
if (a.value !== "12956") return `delete in the middle: ${a.value}`;
await a.blur(); await wait(60);
if (boxes(a).some((e) => e.classList.contains("ui-one-time-code-at"))) return "still marked after blur";
// Countdown: refused until it ends, by the clock, and told once.
const send = row(a).querySelector(".ui-one-time-code-resend"), live = row(a).querySelector("[aria-live]");
for (let i = 0; i < 40 && send.getAttribute("aria-disabled") === "true"; i++) await wait(100);
if (send.getAttribute("aria-disabled") !== null || send.textContent !== "Send a new code") return `after the countdown: ${send.textContent}`;
if (live.textContent !== "You can ask for a new code now.") return `told: ${live.textContent}`;
await tap(send); await wait(100);
if (!out().endsWith("Texts sent: 2.")) return `resend: ${out()}`;
if (a.value !== "" || shown(a) !== "______") return "resend keeps the old code";
if (document.activeElement !== a) return "resend does not go back to the field";
if (!/^Send a new code in 0:0[12]$/.test(send.textContent) || send.getAttribute("aria-disabled") !== "true") return `counting again: ${send.textContent}`;
if (live.textContent !== "") return "a screen reader hears the countdown";
await tap(send); await wait(60);
if (!out().endsWith("Texts sent: 2.")) return "resend works during the countdown";
// A phone that slept: the clock moved on, and the page catches up at its next tick.
const real = Date.now; Date.now = () => real() + 60000;
await wait(700); Date.now = real;
if (send.getAttribute("aria-disabled") !== null) return "the countdown does not go by the clock";
// WebOTP: a stand-in for what Chrome on Android gives, asked when the field is touched.
const cred = navigator.credentials, realGet = cred.get;
let asked = null;
cred.get = (o) => { asked = o; return Promise.resolve({ code: "424242", type: "otp" }); };
Object.defineProperty(window, "OTPCredential", { value: function () {}, configurable: true });
await tap(send); await wait(200);
cred.get = realGet;
if (!asked || asked.otp?.transport?.[0] !== "sms" || !asked.signal) return `WebOTP: ${JSON.stringify(asked)}`;
if (a.value !== "424242" || !out().startsWith("Verified 424242.")) return `WebOTP filled ${a.value}, ${out()}`;
// Letters: capitals, four boxes, no form, on_complete.
await tap(b); await insert("ab1"); await wait(80);
if (b.value !== "AB1" || shown(b) !== "AB1_") return `letters: ${b.value}`;
if (b.inputMode !== "text") return "letters on a number keyboard";
await insert("c"); await wait(100);
if (!out().startsWith("Key AB1C.")) return `on_complete: ${out()}`;
if (row(b).querySelector(".ui-one-time-code-resend")) return "resend_after 0 has a button";
