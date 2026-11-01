// mobile
const again = $("#phone-sign-in-demo-again");
const who = () => $("#phone-sign-in-demo-who").textContent;
const sent = () => $("#phone-sign-in-demo-who").dataset.sent.split(",").filter(Boolean);
const num = () => $("#phone-sign-in-number"), box = () => $("#phone-sign-in-code");
const said = () => $(".ui-phone-sign-in-error")?.textContent ?? "";
const btn = (t) => $$(".ui-phone-sign-in .ui-btn").find((b) => b.textContent.trim().startsWith(t));
const country = (c) => { const s = $("#phone-sign-in-country"); s.value = c; s.dispatchEvent(new Event("change", { bubbles: true })); };
const put = async (el, text) => { type(el, text); await wait(80); };
// Typing at the end, one key at a time, with what a keyboard leaves in the box.
const keys = async (el, text) => { for (const c of text) { el.focus(); el.value += c; el.setSelectionRange(el.value.length, el.value.length); el.dispatchEvent(new Event("input", { bubbles: true })); await wait(20); } };
const start = async () => { await tap(again); await wait(200); };
const tiny = (box) => [...box.querySelectorAll("button, a[href], select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((e) => e.tagName + " " + e.textContent.trim().slice(0, 20));
await start();

// Formatting, by country, and the attributes that bring the right keyboard and autofill.
if (num().type !== "tel" || num().autocomplete !== "tel" || num().inputMode !== "tel") return "the number's keyboard and autofill";
if (parseFloat(getComputedStyle(num()).fontSize) < 16) return "under 16 px, iOS zooms in";
await keys(num(), "912345678");
if (num().value !== "912 345 678") return "Portugal's format: " + num().value;
country("US"); await wait(80);
if (num().value !== "(912) 345-678") return "another country's format: " + num().value;
await keys(num(), "9");
if (num().value !== "(912) 345-6789") return "America's: " + num().value;
await keys(num(), "9");
if (num().value !== "(912) 345-6789") return "no digit past the country's most: " + num().value;
country("GB"); await put(num(), "");
await keys(num(), "07700900123");
if (num().value !== "07700 900123") return "a leading 0 is kept while typing: " + num().value;
// An edit in the middle keeps the caret, by digits and not by place.
country("US"); await put(num(), "4155550100");
if (num().value !== "(415) 555-0100") return "formatted: " + num().value;
const n = num(); n.focus(); n.value = "(415) 55-0100"; n.setSelectionRange(7, 7); n.dispatchEvent(new Event("input", { bubbles: true })); await wait(80);
if (num().value !== "(415) 550-100" || num().selectionStart !== 7) return "deleted mid-way: " + num().value + " at " + num().selectionStart;
// Backspace on a separator takes the digit before it, or it would never go.
await put(num(), "4155550100");
n.value = "(415) 555-0100".slice(0, 9) + "0100"; n.setSelectionRange(9, 9); n.dispatchEvent(new Event("input", { bubbles: true })); await wait(80);
if (num().value !== "(415) 550-100" || num().selectionStart !== 8) return "backspace over a dash: " + num().value + " at " + num().selectionStart;
// An emoji pasted ahead of the caret is two units to the browser and one character to Quillo. The caret goes by digits.
await put(num(), "4155550100");
n.value = "😀(415) 555-0100"; n.setSelectionRange(5, 5); n.dispatchEvent(new Event("input", { bubbles: true })); await wait(80);
if (num().value !== "(415) 555-0100" || num().selectionStart !== 3) return "an emoji ahead of the caret: " + num().value + " at " + num().selectionStart;
// Autofilled or pasted whole: the country follows.
await put(num(), "+351 912 345 678");
if ($("#phone-sign-in-country").value !== "PT" || num().value !== "912 345 678") return "a whole number: " + $("#phone-sign-in-country").value + " " + num().value;
await put(num(), "+1 (415) 555-0100");
if ($("#phone-sign-in-country").value !== "US") return "+1 stays or goes to US: " + $("#phone-sign-in-country").value;
country("CA"); await put(num(), "+1 416 555 0100");
if ($("#phone-sign-in-country").value !== "CA") return "+1 stays on Canada when it is there: " + $("#phone-sign-in-country").value;
await put(num(), "00351912345678");
if ($("#phone-sign-in-country").value !== "PT" || num().value !== "912 345 678") return "00 as +: " + num().value;
// Junk.
country("PT"); await put(num(), "abc");
if (num().value !== "") return "no letters: " + num().value;

// Every refusal before anything goes out.
await tap(btn("Send code")); await wait(150);
if (said() !== "Enter your phone number.") return "empty: " + said();
if (sent().length) return "nothing sent yet";
await put(num(), "9123");
if (said() !== "") return "typing clears the message";
await tap(btn("Send code")); await wait(150);
if (said() !== "That number is too short for this country.") return "short: " + said();
await put(num(), "+999 123");
await tap(btn("Send code")); await wait(150);
if (said() !== "Pick the country from the list, then enter the rest of the number.") return "unknown code: " + said();

// Answers from the app.
await put(num(), "912340000"); await tap(btn("Send code")); await wait(200);
if (said() !== "Too many codes asked for. Try again in 0:02.") return "rate: " + said();
if (!btn("Send code").disabled || !$(".ui-phone-sign-in-wait")) return "Send waits out a limit";
await wait(2300);
if (btn("Send code").disabled) return "Send opens after the wait";
await put(num(), "912341111"); await tap(btn("Send code")); await wait(200);
if (said() !== "We cannot send a code to this number. Try another one.") return "blocked: " + said();
await put(num(), "912342222"); await tap(btn("Send code")); await wait(200);
if (said() !== "That did not go through. Check your connection and try again.") return "lost: " + said();
// Never answered: it gives up, and a late answer changes nothing.
const lost = sent().length;
await put(num(), "912343333");
// Two taps on Send: the second finds it busy, and one code goes.
await tap(btn("Send code")); await wait(100);
const again2 = btn("Send code").getBoundingClientRect();
await fingers("touchStart", [{ x: again2.left + 30, y: again2.top + 20 }]); await fingers("touchEnd", []); await wait(100);
if (sent().length !== lost + 1) return "two taps should send one: " + (sent().length - lost);
if (btn("Send code").getAttribute("aria-busy") !== "true") return "busy while waiting";
await wait(2600);
if (said() !== "That took too long. Check your connection and try again.") return "timeout: " + said();
if (btn("Send code").getAttribute("aria-busy") === "true") return "busy after the timeout";

// Offline, told by the browser, and back.
await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(200);
if (!$(".ui-phone-sign-in-off")) return "says it is offline";
await put(num(), "912345678"); await tap(btn("Send code")); await wait(150);
if (said() !== "You are offline. Connect, then try again.") return "offline: " + said();
const before = sent().length;
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(200);
if ($(".ui-phone-sign-in-off") || said() !== "") return "back online clears it";

await tap(btn("Send code")); await wait(200);
if (sent().length !== before + 1) return "one send: " + sent();
if (sent().at(-1) !== "+351912345678") return "the international form: " + sent().at(-1);

// The code step.
if (!box()) return "the code step";
if (tiny($(".ui-phone-sign-in")).length) return "too small on the code step: " + tiny($(".ui-phone-sign-in"));
if (box().autocomplete !== "one-time-code" || box().inputMode !== "numeric") return "autofill of the code: " + box().autocomplete;
if (document.activeElement !== box()) return "the code box has the focus";
if (!$(".ui-phone-sign-in-lead").textContent.includes("+351912345678")) return "says where it went";
if (!btn("Send again in 0:0") || !btn("Send again").disabled) return "resend waits: " + $$(".ui-phone-sign-in .ui-btn").map((b) => b.textContent);
// Pasted with a space, and wrong.
await put(box(), "111 222");
await wait(100);
if (said() !== "That code is not right. 2 tries left.") return "wrong: " + said();
if (box().value !== "" || document.activeElement !== box()) return "a wrong code empties the box, with focus: " + box().value;
await put(box(), "000000"); await wait(100);
if (said() !== "That code has run out. Ask for a new one.") return "expired: " + said();
await keys(box(), "12a3"); await wait(50);
if (box().value !== "123") return "only digits: " + box().value;
// Resend after the wait; change the number and come back within the wait: no new code.
await wait(3100);
const resend = btn("Send a new code");
if (!resend || resend.disabled) return "resend opens: " + $$(".ui-phone-sign-in .ui-btn").map((b) => b.textContent);
const c0 = sent().length;
await tap(resend); await wait(200);
if (sent().length !== c0 + 1) return "resend sends";
if (box().value !== "") return "a new code empties the box";
await tap(btn("Change number")); await wait(200);
if (num().value !== "912 345 678") return "Change number keeps it: " + num().value;
await tap(btn("Send code")); await wait(200);
if (!box() || sent().length !== c0 + 1) return "the same number within the wait: no new code: " + sent().length;
// A third, the last.
await wait(3100); await tap(btn("Send a new code")); await wait(200);
if (!btn("No more codes") || !btn("No more codes").disabled) return "the limit on codes: " + $$(".ui-phone-sign-in .ui-btn").map((b) => b.textContent);
if (!$(".ui-phone-sign-in a[href='#help']")) return "help is offered";
if (tiny($(".ui-phone-sign-in")).length) return "too small with help showing: " + tiny($(".ui-phone-sign-in"));

// Locked.
await put(box(), "999999"); await wait(150);
if (said() !== "Too many wrong codes. Try again in 0:02, or use another number.") return "locked: " + said();
if (!box().disabled) return "the box waits";
await wait(2300);
if (box().disabled) return "the box opens";

// The keyboard coming up: visualViewport says so, as on both systems.
const vv = visualViewport, h = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => h - 300 });
vv.dispatchEvent(new Event("resize")); await wait(60);
const pad = getComputedStyle($(".ui-phone-sign-in")).paddingBottom;
delete vv.height;
vv.dispatchEvent(new Event("resize")); await wait(60);
if (pad !== "300px") return "room for the keyboard: " + pad;

// Right, autofilled whole.
box().focus(); await put(box(), "123456"); await wait(200);
if (box()) return "signed in moves on";
if (!$(".ui-phone-sign-in-done").textContent.includes("You are signed in")) return "says so";
if (!who().startsWith("+351912345678 with true")) return "on_signed_in: " + who();

// The same answers as Promises, as a `server fn` gives them, through an inline function and a named one.
const slow = $("#phone-sign-in-demo-slow");
const setSlow = async (on) => { slow.checked = on; slow.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
await start(); await setSlow(true);
await put(num(), "912341111"); await tap(btn("Send code")); await wait(200);
if (said() !== "We cannot send a code to this number. Try another one.") return "a Promise of a refusal: " + said();
await put(num(), "912345678"); await tap(btn("Send code")); await wait(200);
if (!box()) return "a Promise of ok should reach the code step: " + said();
await put(box(), "111111"); await wait(200);
if (said() !== "That code is not right. 2 tries left.") return "a Promise of wrong: " + said();
await put(box(), "123456"); await wait(250);
if (!$(".ui-phone-sign-in-done")) return "a Promise of ok should sign in: " + said();
if (!who().startsWith("+351912345678 with true")) return "on_signed_in with a Promise: " + who();
await setSlow(false);

// A wait that is not a number stops nothing.
await start();
await put(num(), "912344444"); await tap(btn("Send code")); await wait(200);
if (said() !== "Too many codes asked for. Try again later.") return "a retry of no use: " + said();

// Android's browser hands the code over, and no typing is needed.
const real = navigator.credentials.get;
let asked = null, give;
window.OTPCredential = class {};
navigator.credentials.get = (o) => { asked = o; return new Promise((r) => { give = r; }); };
await start();
await put(num(), "912345678"); await tap(btn("Send code")); await wait(200);
if (!asked || asked.otp.transport[0] !== "sms" || !asked.signal) return "WebOTP should be asked: " + JSON.stringify(asked);
give({ code: "123456" }); await wait(250);
if (!$(".ui-phone-sign-in-done")) return "the code handed over should sign in";
// Leaving the step stops it.
await start();
await put(num(), "912345678"); await tap(btn("Send code")); await wait(200);
const signal = asked.signal;
await tap(btn("Change number")); await wait(150);
if (!signal.aborted) return "leaving the code step should stop waiting for the message";
navigator.credentials.get = real; delete window.OTPCredential;
await start();

// A tablet: country beside number, in a form that does not run across the screen.
const pair = getComputedStyle($(".ui-phone-sign-in-pair")).gridTemplateColumns.split(" ").length;
if (pair !== (innerWidth >= 560 ? 2 : 1)) return "fields at " + innerWidth + ": " + pair;
if (innerWidth >= 560) {
    const f = $(".ui-phone-sign-in-form").getBoundingClientRect();
    if (f.width > 481 || Math.abs(f.left + f.width / 2 - innerWidth / 2) > 2) return "a centred form: " + f.width + " at " + f.left;
}
