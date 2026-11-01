// mobile
const frame = $("#keyboard-bar-demo-frame"), bar = $(".ui-keyboard-bar");
const f = (x) => $(`#keyboard-bar-demo-${x}`);
const prev = () => $('[aria-label="Previous"]'), next = () => $('[aria-label="Next"]'), done = () => $(".ui-keyboard-bar-done");
const on = () => getComputedStyle(bar).visibility === "visible";
const out = () => $("#keyboard-bar-demo-out").textContent;
const where = () => $(".ui-keyboard-bar-where").textContent;
const pressKey = async (key, code, vk) => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: vk }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: vk }); await wait(120); };
if (on()) return "the bar shows with no field in use";
if (bar.getAttribute("role") !== "toolbar") return "not a toolbar";
// A stand-in for the system's keyboard: on iOS and in Android's Chrome the layout stays and
// the visual viewport shrinks.
const real = window.visualViewport, vv = new EventTarget();
Object.assign(vv, { height: innerHeight, offsetTop: 0, width: innerWidth, scale: 1 });
Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
const keyboard = (h, top = 0) => { vv.height = innerHeight - h - top; vv.offsetTop = top; vv.dispatchEvent(new Event("resize")); };
try {
await tap(f("name")); await wait(120);
if (document.activeElement !== f("name")) return "a tap does not focus the field";
if (!on()) return "no bar with a field in use";
// Measured from the frame, which holds position: fixed here and which the page may scroll.
const barBottom = () => frame.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom;
if (Math.abs(barBottom()) > 1.5) return `no keyboard: the bar is ${barBottom()} above the frame's bottom`;
// iOS: up with the keyboard, each pixel of it.
keyboard(336); await wait(60);
if (bar.style.transform !== "translateY(-336px)" || Math.abs(barBottom() - 336) > 2) return `the keyboard is 336: ${bar.style.transform}, ${barBottom()} above`;
if (bar.classList.contains("ui-keyboard-bar-low")) return "the safe area is added above a keyboard";
// iOS moves the visual viewport as the page is dragged under it.
keyboard(336, 120); await wait(60);
if (bar.style.transform !== "translateY(-336px)") return `the view moved 120: ${bar.style.transform}`;
vv.offsetTop = 40; vv.height = innerHeight - 336 - 40 - 20; vv.dispatchEvent(new Event("scroll")); await wait(60);
if (bar.style.transform !== "translateY(-356px)") return `scroll: ${bar.style.transform}`;
// A resized page (Android's web view): the keyboard takes no lift.
keyboard(0); await wait(60);
if (bar.style.transform !== "" || !bar.classList.contains("ui-keyboard-bar-low")) return `the keyboard gone: ${bar.style.transform}`;
keyboard(300); await wait(60);
// What the bar's class reads changes under its lift, which was set by hand: Next changes the
// field, and the keyboard going and coming changes `raised`. The lift stays.
await tap(next()); await wait(80);
if (bar.style.transform !== "translateY(-300px)") return `moving on lost the lift: "${bar.style.transform}"`;
await tap(prev()); await wait(80);
// Next and previous keep the keyboard: the field never loses focus to the bar.
let blurs = 0; const count = () => blurs++;
f("name").addEventListener("blur", (e) => { if (!e.relatedTarget) count(); });
await tap(next()); await wait(80);
if (document.activeElement !== f("mail")) return `Next: ${document.activeElement.id}`;
if (blurs) return "the bar took the focus, which drops the keyboard";
if (prev().getAttribute("aria-disabled") !== null) return "Previous is off on the second field";
await tap(prev()); await wait(80);
if (document.activeElement !== f("name")) return `Previous: ${document.activeElement.id}`;
if (prev().getAttribute("aria-disabled") !== "true") return "Previous is on at the first field";
await tap(prev()); await wait(80);
if (document.activeElement !== f("name")) return "Previous at the first moved";
// A disabled field is passed over, and the count leaves it out.
await tap(next()); await tap(next()); await wait(80);
if (document.activeElement !== f("town")) return `past the disabled: ${document.activeElement.id}`;
if (where() !== "Town, 3 of 5") return `where: ${where()}`;
// The keyboard's own key says what Enter does.
await tap(next()); await wait(120);
if (document.activeElement !== f("note")) return `a textarea: ${document.activeElement.id}`;
await tap(next()); await wait(120);
if (f("code").enterKeyHint !== "done" || f("name").enterKeyHint !== "next") return `enterkeyhint: ${f("code").enterKeyHint}, ${f("name").enterKeyHint}`;
if (next().getAttribute("aria-disabled") !== "true") return "Next is on at the last field";
// A field the keyboard would cover comes into view, above the bar.
const top = vv.height + vv.offsetTop - bar.offsetHeight;
if (f("code").getBoundingClientRect().bottom > top) return `the last field is hidden: ${f("code").getBoundingClientRect().bottom} against ${top}`;
// Enter on the last is Done; on the others it goes on.
await pressKey("Enter", "Enter", 13); 
if (out() !== "Done pressed 1 times. Tap a field: on a phone the bar rides on the keyboard.") return `Enter on the last: ${out()}`;
if (document.activeElement === f("code") || on()) return "Done left the field in use";
await tap(f("name")); await wait(120);
await pressKey("Enter", "Enter", 13);
if (document.activeElement !== f("mail")) return `Enter on the first: ${document.activeElement.id}`;
// A textarea keeps its Enter.
f("note").focus(); await wait(100);
await pressKey("Enter", "Enter", 13);
if (document.activeElement !== f("note")) return "Enter left the textarea";
// Done.
await tap(done()); await wait(120);
if (document.activeElement === f("note") || on() || !out().startsWith("Done pressed 2 times.")) return `Done: ${out()}`;
if (document.activeElement.closest?.(".ui-keyboard-bar")) return "the focus went to the bar";
// Escape is Done, and leaving the box hides it.
await tap(f("name")); await wait(120);
await pressKey("Escape", "Escape", 27);
if (on() || !out().startsWith("Done pressed 3 times.")) return `Escape: ${out()}`;
await tap(f("name")); await wait(120);
f("name").blur(); await wait(120);
if (on()) return "the bar stays after the field is left";
// The listeners go with the field.
let added = 0, removed = 0; const a = vv.addEventListener.bind(vv), r = vv.removeEventListener.bind(vv);
vv.addEventListener = (...x) => { added++; a(...x); }; vv.removeEventListener = (...x) => { removed++; r(...x); };
await tap(f("name")); await wait(120); await tap(next()); await wait(120); f("mail").blur(); await wait(120);
if (added !== 2 || removed !== 2) return `listeners: ${added} on, ${removed} off`;
// Keyboard route: Tab reaches the bar's buttons, and it stays up there.
f("code").focus(); await wait(120);
prev().focus(); await wait(120);
if (!on()) return "the bar hides when Tab reaches it";
done().click(); await wait(120);
if (on()) return "Done by click";
// Rotated: a new size, the same field, the bar follows.
f("name").focus(); await wait(120);
keyboard(200); await wait(60);
vv.height = innerHeight - 260; vv.dispatchEvent(new Event("resize")); await wait(60);
if (bar.style.transform !== "translateY(-260px)") return `rotated: ${bar.style.transform}`;
if (document.activeElement !== f("name")) return "rotating lost the field";
f("name").blur(); await wait(100);
} finally {
    Object.defineProperty(window, "visualViewport", { value: real, configurable: true });
}
// The real visual viewport, changed for real: a page zoomed in has a smaller one, which is
// the one change to it Chrome can be made to give here.
f("name").focus(); await wait(120);
if (!on()) return "no bar on the real visual viewport";
await cdp("Emulation.setPageScaleFactor", { pageScaleFactor: 2 }); await wait(250);
const zoomed = bar.style.transform;
await cdp("Emulation.setPageScaleFactor", { pageScaleFactor: 1 }); await wait(250);
if (!/^translateY\(-\d+px\)$/.test(zoomed)) return `the real viewport shrank and the bar stayed: "${zoomed}"`;
if (bar.style.transform !== "") return `it did not come down: "${bar.style.transform}"`;
f("name").blur(); await wait(100);
// A tablet's wide bar says which field it is; a phone's has no room.
f("name").focus(); await wait(120);
const wide = bar.clientWidth >= 440, label = getComputedStyle($(".ui-keyboard-bar-where")).visibility;
f("name").blur(); await wait(100);
if (wide !== (device === "tablet")) return `the bar is ${bar.clientWidth} on a ${device}`;
if ((label === "visible") !== wide) return `the name of the field at ${bar.clientWidth} px is ${label}`;
