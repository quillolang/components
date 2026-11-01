// mobile
await wait(300);
const area = $(".ui-long-press-area");
const dlg = $("dialog");
const more = $(".ui-long-press-more");
const said = () => $("#long-press-demo-said").textContent;
const felt = () => $("#long-press-demo-felt").textContent;
const items = () => [...dlg.querySelectorAll(".ui-long-press-item")];
const shut = async () => { if (dlg.open) dlg.close(); await wait(60); };
const near = (a, b) => Math.abs(a - b) < 1;

// A tap does nothing, however often.
await tap(area);
if (dlg.open) return "a tap opened the menu";

// A press short of the delay does nothing.
await hold(area, 250);
if (dlg.open) return "a 250 ms press opened the menu";

// Moved before its time: that is a scroll, not a press.
const p = middle(area);
await fingers("touchStart", [p]);
await fingers("touchMove", [{ x: p.x, y: p.y + 30 }]);
await wait(700);
await fingers("touchEnd", []);
await wait(100);
if (dlg.open) return "a moved press opened the menu";

// Cancelled by the system.
await fingers("touchStart", [p]);
await wait(150);
await fingers("touchCancel", []);
await wait(600);
if (dlg.open) return "a cancelled press opened the menu";

// The press itself: it opens under a finger still down, without selecting anything.
const q = middle(area);
await fingers("touchStart", [q]);
await wait(60);
if (!area.classList.contains("ui-long-press-pressing")) return "a press should show";
if (getComputedStyle(area).userSelect !== "none") return "selection should be off during a press";
await wait(560);
if (!dlg.open) return "the press did not open the menu";
if (String(getSelection()) !== "") return "the press selected text: " + getSelection();
if (getComputedStyle(area).webkitTouchCallout !== undefined && getComputedStyle(area).webkitTouchCallout !== "none") return "the callout is not off";
// Where: on a phone above the finger, centred; on a tablet beside it, to the right.
const vw = document.documentElement.clientWidth;
const r = dlg.getBoundingClientRect();
const clamp = (v, s, room) => Math.max(12, Math.min(v, room - s - 12));
const px = parseFloat(dlg.style.left), py = parseFloat(dlg.style.top);
if (device === "phone") {
    if (!near(px, clamp(q.x - r.width / 2, r.width, vw))) return "phone: left " + px + " for a finger at " + q.x;
    const above = q.y - 16 - r.height;
    if (!near(py, clamp(above < 12 ? q.y + 16 : above, r.height, innerHeight))) return "phone: top " + py + " for a finger at " + q.y;
} else {
    if (!near(px, q.x + r.width + 16 > vw - 12 ? q.x - 16 - r.width : q.x + 16)) return "tablet: left " + px + " for a finger at " + q.x;
    if (!near(py, clamp(q.y - r.height / 2, r.height, innerHeight))) return "tablet: top " + py;
}
if (r.left < 0 || r.right > vw || r.top < 0 || r.bottom > innerHeight) return "the menu leaves the screen";

// Slide to an item and lift: it is chosen. The disabled one is not.
const share = items()[1].getBoundingClientRect();
await fingers("touchMove", [{ x: share.left + 30, y: share.top + 20 }]);
await wait(80);
if (!items()[1].classList.contains("ui-long-press-hot")) return "the item under the finger should light up";
await fingers("touchEnd", []);
await wait(120);
if (said() !== "Chose share.") return "sliding to an item: " + said();
if (dlg.open) return "choosing should close the menu";

// A press lifted where it was leaves the menu open, to tap.
await hold(area, 650);
if (!dlg.open) return "hold() should open it";
if (said() !== "Chose share.") return "lifting in place chose something: " + said();
await tap(items()[0]);
if (said() !== "Chose copy.") return "a tapped item: " + said();
if (dlg.open) return "a tapped item should close it";

// A disabled item does nothing, by slide or by tap.
await hold(area, 650);
if (!items()[2].disabled) return "Pin should be disabled";
items()[2].click();
await wait(60);
if (said() !== "Chose copy." || !dlg.open) return "a disabled item did something";

// Its edge, inside it and on no item, is not outside it.
// A mouse: a finger this near an item is moved onto it by the browser, which is a choice and not this.
const box = dlg.getBoundingClientRect();
const edge = { x: box.left + 3, y: box.top + box.height / 2 };
if (document.elementFromPoint(edge.x, edge.y) !== dlg) return "the test should be on the menu's edge";
const chosen = said();
for (const type of ["mousePressed", "mouseReleased"]) await cdp("Input.dispatchMouseEvent", { type, x: edge.x, y: edge.y, button: "left", clickCount: 1 });
await wait(200);
if (!dlg.open) return "a click on the menu's own edge closed it";
if (said() !== chosen) return "a click on the menu's edge chose something: " + said();

// The backdrop closes it.
const off = device === "phone" ? { x: 8, y: 8 } : { x: vw - 8, y: 8 };
await fingers("touchStart", [off]);
await fingers("touchEnd", []);
await wait(200);
if (dlg.open) return "a touch outside should close the menu";

// What a hand gets, in a browser and in the app. After the taps above, Chrome allows vibrate.
window.quilloNative = { haptic: (k) => { window.__felt = k; return null; } };
await hold(area, 650);
delete window.quilloNative;
if (window.__felt !== "medium") return "the app's haptic was not called: " + window.__felt;
if (felt() !== "Tap felt through: native.") return "felt: " + felt();
await shut();
const real = navigator.vibrate;
navigator.vibrate = (ms) => { window.__ms = ms; return true; };
await hold(area, 650);
navigator.vibrate = real;
if (window.__ms !== 14) return "vibrate should have been asked for 14 ms: " + window.__ms;
if (felt() !== "Tap felt through: vibrate.") return "felt: " + felt();
await shut();
// Neither there, as on iOS: it says so.
navigator.vibrate = () => false;
await hold(area, 650);
navigator.vibrate = real;
if (felt() !== "This device gave no tap: the menu opening is the signal.") return "felt without a vibrator: " + felt();
await shut();

// The keyboard route: More opens it, arrows walk past the disabled one, Escape closes.
more.focus();
more.click();
await wait(100);
if (!dlg.open) return "More should open the menu";
const on = () => document.activeElement;
if (on() !== items()[0]) return "focus should start on the first item: " + on().textContent;
key(on(), "ArrowDown");
if (on() !== items()[1]) return "ArrowDown: " + on().textContent;
key(on(), "ArrowDown");
if (on() !== items()[3]) return "ArrowDown should skip the disabled item: " + on().textContent;
key(on(), "ArrowDown");
if (on() !== items()[0]) return "ArrowDown should wrap: " + on().textContent;
key(on(), "ArrowUp");
if (on() !== items()[3]) return "ArrowUp should wrap: " + on().textContent;
key(on(), "Home");
if (on() !== items()[0]) return "Home: " + on().textContent;
key(on(), "End");
if (on() !== items()[3]) return "End: " + on().textContent;
on().click();
await wait(100);
if (said() !== "Chose delete.") return "Enter on an item: " + said();
if (document.activeElement !== more) return "focus should return to More, is on " + document.activeElement.tagName;
area.focus();
key(area, "ContextMenu");
await wait(100);
if (!dlg.open) return "the Menu key should open it";
await shut();
area.dispatchEvent(new KeyboardEvent("keydown", { key: "F10", shiftKey: true, bubbles: true, cancelable: true }));
await wait(100);
if (!dlg.open) return "Shift+F10 should open it";
await shut();

// Bad data: only what has a label.
const bad = [...$("#long-press-bad").querySelectorAll("dialog")].map((d) => [...d.querySelectorAll("button")].map((b) => b.textContent).join());
if (bad.join("|") !== "Only|") return "bad items: " + bad.join("|");
