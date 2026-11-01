// mobile
const box = $(".ui-swipeback"), front = $(".ui-swipeback-front"), behind = $(".ui-swipeback-behind");
const title = () => $(".ui-swipeback-title").textContent, note = () => $(".demo-note:last-of-type");
const again = () => [...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Start again");
const left = box.getBoundingClientRect().left, top = box.getBoundingClientRect().top + 200;
const shift = () => { const m = new DOMMatrix(getComputedStyle(front).transform); return m.m41; };
// A finger from x, y moved by dx in steps over ms, left down so the middle can be looked at.
const pull = async (x, y, dx, dy, ms) => {
    const steps = Math.max(4, Math.round(ms / 16));
    await fingers("touchStart", [{ x, y }]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: x + dx * i / steps, y: y + dy * i / steps }]); await wait(ms / steps); }
};
const lift = async () => { await fingers("touchEnd", []); await wait(450); };
if (title() !== "Invoice 2041") return "starts on " + title();
if (!$(".ui-swipeback-back")) return "no back button";

// Tracks the finger, the previous screen peeking behind, and a slow release short of
// half way springs back.
await pull(left + 8, top, 120, 0, 500);
if (getComputedStyle(behind).visibility !== "visible") return "the screen behind does not show during a drag";
if (Math.abs(shift() - 120) > 1) return "the screen does not follow the finger: " + shift();
const peek = new DOMMatrix(getComputedStyle(behind).transform).m41;
const w = box.clientWidth, full = Math.min(w * .3, 120);
if (Math.abs(peek + full * (1 - 120 / w)) > 1) return `peek is ${peek}, wanted ${-full * (1 - 120 / w)}`;
if (!behind.textContent.includes("Ana Reyes")) return "the previous screen is not behind";
if (!document.body.textContent.includes(`now ${Math.round(100 / w * 120)}% across`)) return "on_progress: " + /now \d+% across/.exec(document.body.textContent);
await wait(120);
await lift();
if (title() !== "Invoice 2041") return "a short slow drag went back";
if (shift() !== 0 || front.style.transform !== "") return "did not spring back: " + front.style.transform;
if (!document.body.textContent.includes("now 0% across")) return "on_progress on a spring back";
if (getComputedStyle(behind).visibility !== "hidden") return "the screen behind stayed after a spring back";

// A flick: short, but fast.
await pull(left + 8, top, 90, 0, 40);
await lift();
if (title() !== "Ana Reyes") return "a flick did not go back: " + title();
if (!document.body.textContent.includes("Went back 1 time")) return "on_back was not called once";
if (shift() !== 0) return "the new screen is not in place";

// A slow drag past the reach: half a phone, 200 px on a tablet, where half would be a long way.
if (device === "tablet" && w < 600) return "the tablet's frame is " + w;
const reach = Math.min(w * .5, 200);
if (device === "tablet") {
    await pull(left + 8, top, reach - 12, 0, 500);
    await wait(120);
    await lift();
    if (title() !== "Ana Reyes") return "short of 200 px on a tablet went back";
}
await pull(left + 8, top, reach + 10, 0, 500);
await wait(120);
await lift();
if (title() !== "Inbox") return `a drag past ${reach} did not go back: ` + title();
if (!document.body.textContent.includes("Went back 2 times")) return "on_back count";

// The first screen has nothing to go back to: no button, no swipe.
if ($(".ui-swipeback-back")) return "the first screen has a back button";
await pull(left + 8, top, 200, 0, 300);
await lift();
if (title() !== "Inbox" || shift() !== 0) return "the first screen swiped";
again().click();
await wait(100);
if (title() !== "Invoice 2041") return "start again";

// Past half way, but coming back towards the edge cancels.
await pull(left + 8, top, 220, 0, 300);
await pull2();
async function pull2() { for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: left + 8 + 220 - 20 * i, y: top }]); await wait(16); } }
await lift();
if (title() !== "Invoice 2041") return "coming back still went back";

// A tablet's edge is wider, a phone's stops at 24 px.
await pull(left + 28, top, 90, 0, 40);
await lift();
if (title() !== (device === "tablet" ? "Ana Reyes" : "Invoice 2041")) return "from 28 px: " + title();
if (device === "tablet") { again().click(); await wait(100); }

// From the bar too: it is not in the scroller, and a sideways drag there must still come here.
const barY = $(".ui-swipeback-bar").getBoundingClientRect().top + 24;
await pull(left + 8, barY, reach + 10, 0, 200);
await wait(120);
await lift();
if (title() !== "Ana Reyes") return "a swipe from the bar: " + title();
again().click();
await wait(100);

// Not from the edge: nothing moves.
await pull(left + 100, top, 200, 0, 300);
if (shift() !== 0) return "a drag from the middle moved the screen";
await lift();
if (title() !== "Invoice 2041") return "a drag from the middle went back";

// Mostly up and down: locked to the axis, and the scroller moves instead.
const body = $(".ui-swipeback-body");
body.scrollTop = 0;
await pull(left + 8, top + 100, 8, -160, 250);
if (shift() !== 0) return "a vertical drag moved the screen";
await lift();
if (body.scrollTop < 60) return "a vertical drag from the edge did not scroll: " + body.scrollTop;
if (title() !== "Invoice 2041") return "a vertical drag went back";

// The system takes the gesture: back where it was, nothing called.
await pull(left + 8, top, 180, 0, 200);
await fingers("touchCancel", []);
await wait(450);
if (title() !== "Invoice 2041" || shift() !== 0) return "a cancelled drag: " + title() + " " + shift();
if (getComputedStyle(behind).visibility !== "hidden") return "the screen behind stayed after a cancel";

// A second finger is no swipe, before the lock or after it.
await fingers("touchStart", [{ x: left + 8, y: top, id: 1 }, { x: left + 60, y: top, id: 2 }]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: left + 8 + 20 * i, y: top, id: 1 }, { x: left + 60 + 20 * i, y: top, id: 2 }]); await wait(16); }
await lift();
if (title() !== "Invoice 2041" || shift() !== 0) return "two fingers went back: " + title() + " " + shift();
await pull(left + 8, top, 120, 0, 200);
await fingers("touchStart", [{ x: left + 128, y: top, id: 1 }, { x: left + 200, y: top, id: 2 }]);
await wait(40);
await lift();
if (title() !== "Invoice 2041" || shift() !== 0) return "a second finger during a swipe: " + title() + " " + shift();

// The end of a transition in the screen's own content is not the end of the slide.
$(".ui-swipeback-back").click();
await wait(60);
const liner = $(".ui-swipeback-body p");
// (Given the one mark Quillo left on the screen, which is what Quillo's == compares.)
for (const k of Object.keys($(".ui-swipeback-front"))) liner[k] = $(".ui-swipeback-front")[k];
liner.dispatchEvent(new TransitionEvent("transitionend", { propertyName: "transform", bubbles: true }));
await wait(30);
if (title() !== "Invoice 2041") return "a child's transition finished the slide";
await wait(450);
if (title() !== "Ana Reyes") return "the slide did not finish: " + title();
again().click();
await wait(100);

// Taps inside still work, and do not stick a gesture.
await tap($(".ui-swipeback-back"));
await wait(450);
if (title() !== "Ana Reyes") return "the button did not go back: " + title();

// The keyboard's way.
box.querySelector(".ui-swipeback-back").focus();
box.querySelector(".ui-swipeback-back").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", altKey: true, bubbles: true, cancelable: true }));
await wait(450);
if (title() !== "Inbox") return "Alt + Left did not go back: " + title();

// Right to left: the same, from the right edge, moving left.
again().click();
await wait(100);
box.setAttribute("dir", "rtl");
const right = box.getBoundingClientRect().right;
await pull(right - 8, top, -90, 0, 40);
await lift();
box.removeAttribute("dir");
if (title() !== "Ana Reyes") return "right to left did not go back: " + title();
again().click();
await wait(100);

// Two rapid back presses are one go, not a skip.
const b = $(".ui-swipeback-back");
b.click(); b.click();
await wait(450);
if (title() !== "Ana Reyes") return "two presses: " + title();
again().click();
await wait(100);

// Reduced motion: no transition to wait for.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(50);
await tap($(".ui-swipeback-back"));
await wait(60);
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (title() !== "Ana Reyes") return "with reduced motion: " + title();
again().click();
await wait(100);
