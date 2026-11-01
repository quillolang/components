// mobile
// Chrome's own pinch, whose fingers can be asked to move very little.
const pinchBy = async (el, scale) => {
    const c = middle(el);
    await cdp("Input.synthesizePinchGesture", { x: c.x, y: c.y, scaleFactor: scale, gestureSourceType: "touch" });
    await wait(200);
};
await wait(300);
const pick = async (k) => {
    const b = $$(".demo-tut-pick").find((x) => x.textContent === k);
    await tap(b);
    await wait(120);
};
const said = () => $("#gesture-tut-said").textContent;
const card = () => $(".ui-gesture-tut-card");
const spot = () => $(".demo-tut-spot");
const again = $("#gesture-tut-again");
const words = () => $(".ui-gesture-tut-title")?.textContent;
const why = () => $(".ui-gesture-tut-why")?.textContent ?? "";
const seen = (k) => document.cookie.split("; ").find((c) => c.startsWith("quillo_tutorial_demo-" + k + "="))?.split("=")[1] ?? null;
const twice = async (p, gap = 40) => {
    await fingers("touchStart", [p]); await fingers("touchEnd", []); await wait(gap);
    await fingers("touchStart", [p]); await fingers("touchEnd", []); await wait(120);
};
const clearAll = () => { for (const c of document.cookie.split("; ")) if (c) document.cookie = c.split("=")[0] + "=; max-age=0; path=/"; };

// Earlier runs on this device may have seen it: start from nothing.
clearAll();
// Bad data: an unknown gesture is taught as a tap, and with no target the whole of it counts.
await pick("tap");
const odd = $("#gesture-tut-bad");
if (!odd.querySelector(".ui-gesture-tut-real")) return "the bad instance is missing";
odd.remove();
// With less motion the hand stands still, and the words do the work.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await pick("tap");
await pick("swipe-right");
if ($(".ui-gesture-tut-hand").getAnimations().length !== 0) return "with less motion the hand should stand still";
if (words() !== "Swipe right here") return "the words with less motion: " + words();
await cdp("Emulation.setEmulatedMedia", { features: [] });
await wait(60);
await pick("tap");
await pick("swipe-left");
if (!card()) return "a tutorial never seen should show";
if (words() !== "Swipe left here") return "the words: " + words();

// A looping hand, over the real spot, that takes no touch.
const hand = $(".ui-gesture-tut-hand");
if (!hand.querySelector("svg path")) return "there should be a hand to see, not just a dot";
const anims = hand.getAnimations();
if (anims.length !== 1) return "the hand should be animated: " + anims.length;
if (anims[0].effect.getTiming().iterations !== Infinity) return "the hand should loop";
if (anims[0].animationName !== "ui-gesture-tut-left") return "the hand's motion: " + anims[0].animationName;
const ringR = $(".ui-gesture-tut-ring").getBoundingClientRect(), spotR = spot().getBoundingClientRect();
if (Math.abs(ringR.left - spotR.left) > 1 || Math.abs(ringR.top - spotR.top) > 1 || Math.abs(ringR.width - spotR.width) > 1) return "the ring should sit on the spot";
if (getComputedStyle($(".ui-gesture-tut-layer")).pointerEvents !== "none") return "the layer must let touches through";
if (document.elementFromPoint(spotR.left + 20, spotR.top + 20) !== spot()) return "the real thing should stay reachable under the hand";

// Short, the wrong way, crooked: each says so, and none counts.
await drag(spot(), -30, 0, 300);
if (why() !== "A little further") return "too short: " + why();
await drag(spot(), 90, 0, 300);
if (why() !== "The other way") return "the wrong way: " + why();
await drag(spot(), -70, 70, 300);
if (why() !== "Keep it straight") return "crooked: " + why();
if (seen("swipe-left") !== null || said() !== "Not done yet.") return "a wrong try counted";

// Done elsewhere than the spot: not the real target.
const out = $("#gesture-tut-outside");
await drag(out, -100, 0, 300);
if (why() !== "On the marked spot") return "off the spot: " + why();
if (seen("swipe-left") !== null) return "a swipe off the spot counted";

// A cancelled try is no try.
const p = middle(spot());
await fingers("touchStart", [p]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: p.x - 30 * i, y: p.y }]); await wait(16); }
await fingers("touchCancel", []);
await wait(80);
if (seen("swipe-left") !== null) return "a cancelled swipe counted";

// Done on the spot: it says so, remembers, tells the callback once, and goes.
await drag(spot(), -100, 0, 300);
if (said() !== "swipe-left: done") return "on_done: " + said();
if (seen("swipe-left") !== "done") return "not remembered: " + seen("swipe-left");
if (!$(".ui-gesture-tut-good")) return "it should say it was right";
if ($(".ui-gesture-tut-hand")) return "the hand should stop once it is done";
await wait(1400);
if (card()) return "the tutorial should go";

// It does not come back, not even after a phone app's new launch, which empties localStorage.
await pick("tap");
await pick("swipe-left");
if (card()) return "a tutorial done should not come back";
localStorage.clear();
await pick("tap");
await pick("swipe-left");
if (card()) return "a tutorial done should not come back after a new launch of an app";

// Each gesture on its own real input.
const swipeRight = "swipe-right";
await pick(swipeRight);
await drag(spot(), 100, 0, 300);
if (seen(swipeRight) !== "done") return "swipe-right: " + seen(swipeRight);

await pick("tap");
if ($(".ui-gesture-tut-hand").getAnimations()[0].animationName !== "ui-gesture-tut-tap") return "the tap's own motion";
await drag(spot(), 60, 0, 200);
if (seen("tap") !== null) return "a drag is no tap";
await tap(spot());
if (seen("tap") !== "done") return "tap: " + seen("tap");

await pick("double-tap");
const c = middle(spot());
await tap(spot());
await wait(450);
if (seen("double-tap") !== null) return "one tap is no double tap";
await twice(c, 500);
if (why() !== "A little quicker") return "two slow taps: " + why();
await wait(450);
await twice(c);
if (seen("double-tap") !== "done") return "double-tap: " + seen("double-tap");

await pick("long-press");
await hold(spot(), 200);
if (why() !== "Hold it a little longer") return "a short press: " + why();
await hold(spot(), 620);
if (seen("long-press") !== "done") return "long-press: " + seen("long-press");

await pick("pinch");
await drag(spot(), 90, 0, 200);
if (why() !== "Use two fingers") return "one finger: " + why();
await pinchBy(spot(), 1.02);
if (why() !== "Move them further") return "a small pinch: " + why();
await pinchBy(spot(), 1.8);
if (seen("pinch") !== "done") return "pinch: " + seen("pinch");

// Up and down, where the browser takes the gesture for a scroll and ends the pointer.
await pick("swipe-up");
const list = $(".demo-tut-scroll");
await drag(list, 0, -120, 300);
if (list.scrollTop <= 0) return "the real list should have scrolled";
if (seen("swipe-up") !== "done") return "swipe-up during a real scroll: " + seen("swipe-up") + " " + why();
await wait(1400);
await pick("swipe-down");
if (card() === null) return "swipe-down should show";
if ($(".ui-gesture-tut-title").textContent !== "Swipe down here") return "words: " + words();

// Skip: for anyone, and it counts as seen.
await tap($(".ui-gesture-tut-skip"));
if (card()) return "Skip should end it";
if (seen("swipe-down") !== "skipped") return "Skip should be remembered: " + seen("swipe-down");
if (said() !== "swipe-down: skipped") return "on_done after Skip: " + said();

// Cookies refused: nothing stops, it just shows, and a done still says so.
await pick("tap");
Object.defineProperty(document, "cookie", { configurable: true, get() { throw new DOMException("denied", "SecurityError"); }, set() { throw new DOMException("denied", "SecurityError"); } });
await pick("swipe-right");
const refused = card() !== null && words() === "Swipe right here";
await tap($(".ui-gesture-tut-skip"));
await wait(100);
const afterRefused = said();
delete document.cookie;
if (!refused) return "with cookies refused the tutorial should show";
if (afterRefused !== "swipe-right: skipped") return "with cookies refused, on_done: " + afterRefused;
await pick("swipe-down");

// Show it again.
await tap(again);
await wait(100);
if (!card()) return "replay should show it again";
if (seen("swipe-down") !== null) return "replay should forget";
await tap($(".ui-gesture-tut-skip"));
await wait(50);
clearAll();
