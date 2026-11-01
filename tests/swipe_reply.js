// mobile
const box = $("#swipe-reply-demo");
const rows = [...box.querySelectorAll(".ui-swipe-reply")];
if (rows.length !== 3) return `expected 3 messages, found ${rows.length}`;
const [theirs, mine, last] = rows;
const body = (r) => r.querySelector(".ui-swipe-reply-body");
const note = () => $("#swipe-reply-note").textContent.trim();
const cue = (r) => r.querySelector(".ui-swipe-reply-cue");
const start = "Drag a message sideways, or use its menu.";
if (note() !== start) return "the note starts wrong: " + note();
if (getComputedStyle(body(theirs)).touchAction !== "pan-y") return "the message must leave vertical scrolling to the page";

// A stand-in for the app's bridge, to count the taps felt.
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); return true; } };

// Short and slow: springs back, says nothing, nothing felt.
await drag(body(theirs), 40, 0, 400);
if (body(theirs).style.transform !== "") return "a short drag did not spring back: " + body(theirs).style.transform;
if (note() !== start) return "a short drag replied: " + note();
if (felt.length) return "a short drag was felt";

// While held past the threshold, the message follows, more slowly past it, and the cue is ready.
{
    const r = body(theirs).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await fingers("touchStart", [{ x, y }]);
    for (const d of [20, 40, 64, 94, 124]) { await fingers("touchMove", [{ x: x + d, y: y + 1 }]); await wait(30); }
    await wait(60);
    if (body(theirs).style.transform !== "translateX(84px)") return "at 124 px it should sit at 64 + 60 / 3: " + body(theirs).style.transform;
    if (!cue(theirs).classList.contains("ui-swipe-reply-ready")) return "past the threshold the cue is not ready";
    if (getComputedStyle(body(theirs)).transitionDuration !== "0s") return "a dragged message should have no transition";
    // What the outer element's class reads changes under the finger, as a parent's rows do when a message
    // arrives: the attribute is written whole, and what the gesture marks must not be on it.
    const colour = getComputedStyle(cue(theirs)).backgroundColor;
    $("#swipe-reply-tint").click(); await wait(100);
    if (!theirs.className.includes("demo-other")) return "the prop did not reach the message";
    if (getComputedStyle(body(theirs)).transitionDuration !== "0s") return "a prop changing in mid-drag gave the message its spring back";
    if (getComputedStyle(cue(theirs)).backgroundColor !== colour) return "a prop changing in mid-drag lost the cue";
    if (body(theirs).style.transform !== "translateX(84px)") return "a prop changing in mid-drag moved the message: " + body(theirs).style.transform;
    if (felt.join() !== "light") return "the threshold was not felt once: " + felt.join();
    // Back under the threshold, and over again: felt a second time, and letting go short does not reply.
    await fingers("touchMove", [{ x: x + 30, y }]); await wait(40);
    if (cue(theirs).classList.contains("ui-swipe-reply-ready")) return "under the threshold the cue stays ready";
    await fingers("touchMove", [{ x: x + 80, y }]); await wait(40);
    if (felt.length !== 2) return "going over again was not felt: " + felt.length;
    await fingers("touchEnd", []); await wait();
}
if (!note().startsWith("Replying to Ana Silva (m1): Are we still on")) return "past the threshold it did not reply: " + note();
if (body(theirs).style.transform !== "") return "it stayed where it was let go";
if (body(theirs).classList.contains("ui-swipe-reply-on")) return "the gesture's class stayed";

// Mine drags the other way: to the right does nothing.
await drag(body(mine), 120, 0, 200);
if (note().includes("(m2)")) return "my own message replied going right";
await drag(body(mine), -120, 0, 200);
if (!note().includes("(m2)")) return "my own message did not reply going left: " + note();

// A flick, under the threshold in distance.
await drag(body(last), 52, 0, 24);
if (!note().includes("(m3)")) return "a flick of 52 px did not reply: " + note();

// Up and down is not ours: nothing moves, and a cancelled gesture does nothing.
const before = note();
await drag(body(theirs), 6, 60, 200);
if (body(theirs).style.transform !== "" || note() !== before) return "a vertical drag moved it";
{
    const r = body(theirs).getBoundingClientRect(), x = r.left + 60, y = r.top + r.height / 2;
    await fingers("touchStart", [{ x, y }]);
    for (const d of [30, 60, 90]) { await fingers("touchMove", [{ x: x + d, y }]); await wait(30); }
    await fingers("touchCancel", []); await wait();
    if (body(theirs).style.transform !== "" || body(theirs).classList.contains("ui-swipe-reply-on")) return "a cancelled drag did not spring back";
    if (note() !== before) return "a cancelled drag replied";
}

// The equal of the gesture: the menu, by finger and by keys.
const more = last.querySelector(".ui-swipe-reply-more");
if (more.getAttribute("aria-expanded") !== "false") return "the menu starts open";
await tap(more); await wait(100);
const menu = last.querySelector("[role=menu]");
if (!menu.matches(":popover-open") || more.getAttribute("aria-expanded") !== "true") return "the button did not open the menu";
const items = [...menu.querySelectorAll("[role=menuitem]")];
if (items.map((i) => i.textContent).join() !== "Reply,Copy text,Forward") return "the menu has " + items.map((i) => i.textContent).join();
if (document.activeElement !== items[0]) return "the menu did not take the focus";
// The browser must be stopped at once, before anything waits, or the arrow scrolls the page too.
const stopped = (k) => { const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(e); return e.defaultPrevented; };
if (!stopped("ArrowDown")) return "ArrowDown was not stopped at once";
await wait(50);
if (document.activeElement !== items[1]) return "ArrowDown did not move";
key(menu, "ArrowDown"); await wait(50);
if (document.activeElement !== items[2]) return "ArrowDown did not reach the third, past where a first-row answer stops";
key(menu, "ArrowDown"); await wait(50);
if (document.activeElement !== items[0]) return "ArrowDown did not wrap";
key(menu, "ArrowUp"); await wait(50);
if (document.activeElement !== items[2]) return "ArrowUp did not wrap";
key(menu, "ArrowUp"); await wait(50);
const r = menu.getBoundingClientRect();
if (r.right > innerWidth || r.bottom > innerHeight || r.left < 0) return "the menu is off the screen";
await tap(items[1]); await wait(100);
if (!note().startsWith("copy: Good. The gate code changed")) return "the menu's own row did not reach on_action: " + note();
if (menu.matches(":popover-open")) return "the menu stayed open";
if (document.activeElement !== more) return "focus did not go back to the button";

const other = theirs.querySelector(".ui-swipe-reply-more");
other.focus(); other.click(); await wait(100);
theirs.querySelector("[role=menuitem]").click(); await wait(100);
if (!note().includes("(m1)")) return "Reply in the menu did not reply: " + note();

// The app answers later, and may refuse: nothing is left unhandled, and the reply stands.
window.quilloNative = { haptic: () => Promise.reject(new Error("no")) };
await drag(body(theirs), 120, 0, 200);
if (!note().includes("(m1)")) return "a refused tap stopped the reply: " + note();
// In a browser with no app, the web's own: Android's vibrate, which iOS does not have.
delete window.quilloNative;
const buzz = []; const realV = navigator.vibrate;
navigator.vibrate = (ms) => { buzz.push(ms); return true; };
await drag(body(last), 120, 0, 200);
navigator.vibrate = realV;
if (buzz.join() !== "12") return "with no app it should use vibrate: " + buzz.join();

// Right to left swaps the sides.
await drag(body(theirs), 120, 0, 200);
if (!note().includes("(m1)")) return "the first message should be the one quoted: " + note();
box.setAttribute("dir", "rtl");
await drag(body(last), 120, 0, 200);
if (note().includes("(m3)")) return "in a right-to-left page, going right replied";
await drag(body(last), -120, 0, 200);
if (!note().includes("(m3)")) return "in a right-to-left page, going left did not reply: " + note();
box.removeAttribute("dir");
