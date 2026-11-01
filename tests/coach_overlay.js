// mobile
const name = "ui-demo-coach";
const clear = () => { document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name); };
const frame = $("#coach-overlay-demo-frame"), scroller = $("#coach-overlay-demo-scroll");
const add = $("#coach-overlay-demo-add"), search = $("#coach-overlay-demo-search"), far = $("#coach-overlay-demo-far");
const said = () => $("#coach-overlay-demo-said").textContent;
const pressed = () => Number($("#coach-overlay-demo-said").dataset.pressed);
const open = $("#coach-overlay-demo-open"), forget = $("#coach-overlay-demo-forget");
const on = () => $(".ui-coach-overlay"), hole = () => $(".ui-coach-overlay-hole"), card = () => $(".ui-coach-overlay-card");
const count = () => $(".ui-coach-overlay-count")?.textContent;
const btn = (t) => [...card().querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
const key2 = async (k) => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: k, code: k, windowsVirtualKeyCode: k === "Escape" ? 27 : 39 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: k === "Escape" ? 27 : 39 }); await wait(150); };
// The hole sits on the element, with the room asked for, to the pixel.
const lit = (el) => {
    const h = hole().getBoundingClientRect(), r = el.getBoundingClientRect();
    return Math.abs(h.left - (r.left - 6)) < 1 && Math.abs(h.top - (r.top - 6)) < 1 && Math.abs(h.width - (r.width + 12)) < 1 && Math.abs(h.height - (r.height + 12)) < 1;
};
const where = (el) => JSON.stringify([hole().getBoundingClientRect(), el.getBoundingClientRect()]);
clear(); scroller.scrollTop = 0; await tap(forget); await wait(300);

if (!on()) return "shows on a first run";
if (count() !== "1 of 3") return "the missing step is left out: " + count();
if (!lit(add)) return "lights the element: " + where(add);
if (card().querySelector("h3").textContent !== "Start here") return "the step's title";
if (document.activeElement !== btn("Next")) return "focus on Next: " + document.activeElement?.className;
if (getComputedStyle(on()).pointerEvents !== "none") return "lets touches through";

// Follows a real finger's scroll: the overlay does not stop it.
await tap(forget); await wait(300);
await drag(scroller, 0, -160, 300); await wait(300);
if (scroller.scrollTop < 100) return "the page should scroll under it: " + scroller.scrollTop;
if (!on() || count() !== "1 of 3") return "a scroll is no tap: " + count();
if (!lit(add)) return "follows the scroll: " + where(add);
// The element gone off the top: the light goes with it, the card stays on the screen.
scroller.scrollTop = 500; await wait(100);
if (!lit(add)) return "follows it off screen: " + where(add);
const fr = frame.getBoundingClientRect(), cr = card().getBoundingClientRect();
if (cr.top < fr.top || cr.bottom > fr.bottom || cr.left < fr.left || cr.right > fr.right) return "the card stays on the screen: " + JSON.stringify(cr);
scroller.scrollTop = 0; await wait(100);
if (!lit(add)) return "and back";

// Turned: it stays on the element, and keeps its place.
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(350);
if (!lit(add) || count() !== "1 of 3") return "rotation: " + where(add);
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(350);
if (!lit(add)) return "rotated back: " + where(add);

// A layout change nothing announces.
add.style.marginTop = "30px"; await wait(350);
if (!lit(add)) return "a shift nothing told of: " + where(add);
add.style.marginTop = ""; await wait(350);

// A tap anywhere goes on, and the app does not get it: on the lit button itself.
await tap(add); await wait(150);
if (count() !== "2 of 3" || pressed() !== 0) return "a tap on the element goes on, unpressed: " + count() + " pressed " + pressed();
if (!lit(search)) return "the next element: " + where(search);
// A tap on the dim part.
const fx = frame.getBoundingClientRect();
await fingers("touchStart", [{ x: fx.left + 60, y: fx.top + 400 }]); await fingers("touchEnd", []); await wait(250);
if (count() !== "3 of 3") return "a tap on the dim part goes on: " + count();
// Brought into view, as it was far down.
const fr2 = frame.getBoundingClientRect(), fa = far.getBoundingClientRect();
if (fa.top < fr2.top || fa.bottom > fr2.bottom) return "a far element is scrolled to: " + JSON.stringify(fa);
if (!lit(far)) return "lit: " + where(far);
if (!btn("Got it")) return "the last step's button";
// Under its element when there is room, over it when not: it never covers it.
await wait(120);
const a = card().getBoundingClientRect(), b = far.getBoundingClientRect();
if (a.bottom > b.top && a.top < b.bottom && a.right > b.left && a.left < b.right) return "the card covers the element: " + JSON.stringify([a, b]);
// The app outside the frame is left alone: a tap there is the demo's own.
await tap(btn("Got it")); await wait(200);
if (on() || said() !== "Done: finished.") return "finished: " + said();
if (localStorage.getItem(name) !== "1" || !document.cookie.includes(name + "=1")) return "remembered";
// The app works again.
scroller.scrollTop = 0; await wait(100);
await tap(add); await wait(150);
if (pressed() !== 1) return "the button works once it is over";

// One time.
await tap(open); await wait(300);
if (on()) return "shown once";

// Skip, from the card, at once, and a tap on the card is no tap on the dim.
await tap(forget); await wait(300);
await tap(card().querySelector("h3")); await wait(150);
if (count() !== "1 of 3") return "a tap on the card itself does not go on";
await tap(btn("Skip")); await wait(200);
if (on() || said() !== "Done: skipped.") return "Skip ends it: " + said();
if (localStorage.getItem(name) !== "1") return "a skip is remembered too";

// Keys, with the real ones.
await tap(forget); await wait(300);
await key2("ArrowRight");
if (count() !== "2 of 3") return "ArrowRight goes on: " + count();
await key2("Escape");
if (on() || said() !== "Done: skipped.") return "Escape skips";

// Tab stays in the card.
await tap(forget); await wait(300);
const send = (type, s) => cdp("Input.dispatchKeyEvent", { type, key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, modifiers: s ? 8 : 0 });
btn("Next").focus(); await send("keyDown"); await send("keyUp"); await wait(80);
if (document.activeElement !== btn("Skip")) return "Tab from Next: " + document.activeElement?.textContent;
await send("keyDown"); await send("keyUp"); await wait(80);
if (document.activeElement !== btn("Next")) return "Tab from Skip: " + document.activeElement?.textContent;
await send("keyDown", true); await send("keyUp", true); await wait(80);
if (document.activeElement !== btn("Skip")) return "Shift Tab from Next: " + document.activeElement?.textContent;
await send("keyDown", true); await send("keyUp", true); await wait(80);
if (document.activeElement !== btn("Next")) return "Shift Tab from Skip: " + document.activeElement?.textContent;

// A tablet: beside the element, as there is room.
const side = card().dataset.side;
if (side !== (innerWidth >= 600 ? "right" : "below")) return "the card's side at " + innerWidth + ": " + side;
if (innerWidth >= 600 && card().getBoundingClientRect().left < add.getBoundingClientRect().right) return "the card should sit beside the element";

// Nothing to show: says so, remembers nothing, and blocks nothing.
await tap(btn("Skip")); await wait(150);
add.style.display = "none"; search.style.display = "none"; far.style.display = "none";
clear(); await tap(open); await wait(300);
add.style.display = ""; search.style.display = ""; far.style.display = "";
if (on()) return "nothing to light: nothing shown";
if (said() !== "Done: none.") return "on_done(none): " + said();
if (localStorage.getItem(name)) return "nothing was seen, so nothing is remembered";
clear();
await tap(open); await wait(300);
await tap(btn("Skip")); await wait(150);
clear();
