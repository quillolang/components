// tablet
await wait(300);
const odd = $("#kiosk-screen-odd");
const oddFacts = [...odd.querySelectorAll(".ui-kiosk-screen-facts li:first-child")].map((l) => l.textContent);
if (oddFacts[0] !== "Goes back to the start after 3 seconds untouched, with 2 seconds' warning.") return "odd times: " + oddFacts[0];
if (oddFacts[1] !== "Goes back to the start after 90 seconds untouched, with 15 seconds' warning.") return "times that are not numbers: " + oddFacts[1];
odd.remove();

const kiosk = $(".ui-kiosk-screen");
const note = () => $("#kiosk-screen-note").textContent;
const step = () => $("#kiosk-screen-step").textContent;
const go = $(".ui-kiosk-screen-go");
if (!go || go.textContent !== "Start kiosk") return "no start button";
if ($("#kiosk-screen-next").offsetParent !== null) return "the content shows before it starts";
const calls = [];
window.quilloNative = { keepAwake: async (on) => { calls.push(on); return true; } };

await tap(go);
await wait(200);
if (note() !== "Started.") return "on_start: " + note();
if (document.fullscreenElement !== kiosk) return "it did not go full screen: " + document.fullscreenElement;
if (calls.join() !== "true") return "keepAwake: " + calls.join();
const cs = getComputedStyle(kiosk);
if (cs.touchAction !== "pan-x pan-y") return "pinch should be off: " + cs.touchAction;
if (cs.userSelect !== "none") return "selection should be off: " + cs.userSelect;

// A right-click or long press gives no menu, and a browser key is held back.
let held = null;
const seen = (e) => { held = e.defaultPrevented; };
document.addEventListener("contextmenu", seen);
await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: 300, y: 300, pointerType: "mouse", button: "right", buttons: 2, clickCount: 1 });
await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: 300, y: 300, pointerType: "mouse", button: "right", buttons: 0, clickCount: 1 });
await wait(50);
document.removeEventListener("contextmenu", seen);
if (held !== true) return "the menu was not stopped: " + held;
let reload = null;
const keySeen = (e) => { if (e.key === "r") reload = e.defaultPrevented; };
window.addEventListener("keydown", keySeen);
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "r", code: "KeyR", windowsVirtualKeyCode: 82, modifiers: 2 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "r", code: "KeyR", windowsVirtualKeyCode: 82, modifiers: 2 });
await wait(30);
window.removeEventListener("keydown", keySeen);
if (reload !== true) return "Ctrl+R was not held back: " + reload;

// Those touches count, so let the clock run out to the start before going on.
await wait(4400);
if (note() !== "Reset 1.") return "a touch and a wait: " + note();
// Untouched, nothing counts down however long it stands.
await wait(2500);
if ($(".ui-kiosk-screen-left")) return "an untouched kiosk counted down";
if (note() !== "Reset 1.") return "an untouched kiosk reset: " + note();

// Someone starts, and walks off: a countdown, then all is as it was.
await tap($("#kiosk-screen-next"));
const name = $("#kiosk-screen-name");
await tap(name);
type(name, "Ada");
await wait(100);
if (step() !== "Step 2 of 2") return "the step: " + step();
await wait(2300);
const left = $(".ui-kiosk-screen-left");
if (!left) return "no countdown after 2 seconds of 4";
if (left.textContent !== "2" && left.textContent !== "1") return "the countdown: " + left.textContent;
await wait(100);
// Keep going goes on where they were, with nothing lost.
await tap($(".ui-kiosk-screen-layer .ui-kiosk-screen-go"));
if ($(".ui-kiosk-screen-left")) return "Keep going did not end the countdown";
if (step() !== "Step 2 of 2" || name.value !== "Ada") return "Keep going lost something: " + step() + " " + name.value;
await wait(2200);
if (!$(".ui-kiosk-screen-left")) return "no second countdown";
await wait(2200);
if ($(".ui-kiosk-screen-left")) return "the countdown stayed after the reset";
if (step() !== "Step 1 of 2") return "on_reset: " + step();
if (name.value !== "") return "the field was not cleared: " + name.value;
if (note() !== "Reset 2.") return "resets: " + note();

// The hidden corner: not fewer taps than asked; five in time open the pad.
const corner = $(".ui-kiosk-screen-corner");
const r = corner.getBoundingClientRect();
if (Math.round(r.right) !== innerWidth || Math.round(r.top) !== 0) return "the corner: " + r.right + "," + r.top;
if (corner.textContent !== "" || corner.getAttribute("aria-hidden") !== "true") return "the corner should not show";
const tapHere = async () => { await fingers("touchStart", [{ x: r.left + 30, y: r.top + 30 }]); await fingers("touchEnd", []); await wait(60); };
for (let i = 0; i < 4; i++) await tapHere();
await wait(100);
if ($(".ui-kiosk-screen-pad")) return "four taps opened the pad";
await tapHere();
await wait(100);
const pad = $(".ui-kiosk-screen-pad");
if (!pad) return "five taps did not open the pad";
const digits = (s) => $$(".ui-kiosk-screen-digit").find((b) => b.textContent === s);
const typePin = async (s) => { for (const c of s) { await tap(digits(c)); } };
await typePin("12");
if ($$(".ui-kiosk-screen-dot-on").length !== 2) return "the dots: " + $$(".ui-kiosk-screen-dot-on").length;
await tap(digits("Delete"));
if ($$(".ui-kiosk-screen-dot-on").length !== 1) return "Delete: " + $$(".ui-kiosk-screen-dot-on").length;
await tap(digits("Cancel"));
if ($(".ui-kiosk-screen-pad")) return "Cancel did not close the pad";

// A pad left open goes when the clock runs out: Cancel counted as a touch.
await tapHere(); await tapHere(); await tapHere(); await tapHere(); await tapHere();
await wait(4300);
if ($(".ui-kiosk-screen-pad")) return "the pad stayed open after going back to the start";

// The keys for a keyboard open it, digits work, and three wrong lock it (tries={3}).
const combo = async (k, code, vk, modifiers) => {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk, modifiers });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk, modifiers });
};
await combo("k", "KeyK", 75, 1 + 2 + 8);
await wait(120);
if (!$(".ui-kiosk-screen-pad")) return "the staff keys did not open the pad";
for (const d of "9999") await combo(d, "Digit" + d, 57, 0);
await wait(120);
const msg = () => $(".ui-kiosk-screen-note").textContent;
if (msg() !== "Wrong PIN. 2 left.") return "a wrong PIN: " + msg();
if ($$(".ui-kiosk-screen-dot-on").length !== 0) return "a wrong PIN should empty the dots";
await typePin("0000");
await typePin("1111");
await wait(350);
if (!msg().startsWith("Locked. Try again in ")) return "locked: " + msg();
if (!digits("5").disabled) return "the digits should be disabled while locked";
await tap(digits("1"));
if ($$(".ui-kiosk-screen-dot-on").length !== 0) return "a locked pad took a digit";
// A lock is two seconds here; then it opens again, and the right PIN leaves.
await wait(2200);
if (digits("5").disabled) return "the lock did not end: " + msg();
await typePin("1234");
await wait(300);
if (note() !== "Staff left.") return "the right PIN: " + note();
if (document.fullscreenElement) return "it stayed full screen after leaving";
if (kiosk.classList.contains("ui-kiosk-screen-on")) return "it stayed locked";
if (calls.join() !== "true,false") return "keepAwake after leaving: " + calls.join();
if (!$(".ui-kiosk-screen-start")) return "the start page did not come back";

// In a browser with no quilloNative, leaving full screen asks for it back with a button.
delete window.quilloNative;
await tap($(".ui-kiosk-screen-go"));
await wait(200);
if (document.fullscreenElement !== kiosk) return "a second start: not full screen";
await document.exitFullscreen();
await wait(200);
const lost = $(".ui-kiosk-screen-lost");
if (!lost) return "leaving full screen was not noticed";
await tap(lost);
await wait(200);
if (document.fullscreenElement !== kiosk || $(".ui-kiosk-screen-lost")) return "the button did not bring it back";
// And Back is held.
const href = location.href;
history.back();
await wait(200);
if (!kiosk.classList.contains("ui-kiosk-screen-on") || location.href !== href) return "Back left the kiosk";
await combo("k", "KeyK", 75, 1 + 2 + 8);
await wait(120);
for (const d of "1234") await combo(d, "Digit" + d, 49, 0);
await wait(300);
if (kiosk.classList.contains("ui-kiosk-screen-on")) return "the keys did not leave";
