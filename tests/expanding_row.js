// mobile
const row = (id) => $(`#exprow-${id}-head`).closest(".ui-exprow");
const head = (id) => $(`#exprow-${id}-head`);
const open = (id) => head(id).getAttribute("aria-expanded") === "true";
const panel = (id) => $(`#exprow-${id}-panel`);
const scroller = $("[data-scroller]");
const log = () => $("[data-log]").textContent.trim();
const quiet = async (el = scroller) => { let was = NaN; for (let i = 0; i < 40; i++) { await wait(60); if (el.scrollTop === was) break; was = el.scrollTop; } };
if ($$(".ui-exprow").length !== 12) return `expected 12 rows, found ${$$(".ui-exprow").length}`;
if (open("a1") || open("b1") || !open("b3")) return "the rows did not start as said";
if (panel("a1").getBoundingClientRect().height !== 0) return "a closed panel takes up room";
if (panel("b3").getBoundingClientRect().height < 30) return "the row open from the server shows nothing";
if (head("a1").getAttribute("aria-controls") !== "exprow-a1-panel") return "aria-controls is wrong";
if (panel("a1").getAttribute("aria-labelledby") !== "exprow-a1-head") return "the panel is not named by its head";
if (head("a1").getBoundingClientRect().height < 44) return "the head is under 44";
// What is in a closed row cannot be reached.
if (getComputedStyle(panel("a1")).visibility !== "hidden") return "a closed panel is still visible to Tab";
// A tap opens it, content pushed down, smoothly: partway through it is between 0 and full.
const below = head("a2");
const y0 = below.getBoundingClientRect().top;
const p = { x: head("a1").getBoundingClientRect().left + 40, y: head("a1").getBoundingClientRect().top + 20 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
let mid = null, full = null;
for (let i = 0; i < 40; i++) {
    await new Promise(requestAnimationFrame);
    const h = panel("a1").getBoundingClientRect().height;
    if (h > 5 && mid == null) mid = h;
    full = h;
}
await wait(300); full = panel("a1").getBoundingClientRect().height;
if (!open("a1") || log() !== "a1:open") return `a tap gave ${log()}`;
if (mid == null || mid >= full - 1) return `no smooth opening: first height ${mid}, full ${full}`;
if (Math.abs(below.getBoundingClientRect().top + scroller.scrollTop - (y0 + full)) > 2) return `the row below moved to ${below.getBoundingClientRect().top} from ${y0}, by ${full}`;
if (getComputedStyle(panel("a1")).visibility !== "visible") return "an open panel is hidden";
// One open among a group: the next takes over, and the first says so.
await tap(head("a2")); await wait(500);
if (open("a1") || !open("a2")) return "a group kept two open";
if (log() !== "a1:open a1:shut a2:open") return `the group's log is ${log()}`;
// Near the bottom of the frame, opening scrolls the row fully into view.
await tap(head("a2")); await wait(450);
scroller.scrollTop = 0; await wait(100);
const low = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `a${i}`).find((n) => { const r = head(n).getBoundingClientRect(), f = scroller.getBoundingClientRect(); return r.bottom <= f.bottom && r.bottom > f.bottom - 90; });
if (!low) return "no row stands at the bottom of the frame";
const r0 = head(low).getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r0.left + 40, y: r0.top + 20 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(450); await quiet();
const whole = row(low).getBoundingClientRect(), f = scroller.getBoundingClientRect();
if (!open(low)) return "the low row did not open";
if (scroller.scrollTop <= 0) return "the frame did not scroll";
if (whole.bottom > f.bottom + 1 || whole.top < f.top - 1) return `the open row stands at ${whole.top} to ${whole.bottom} in ${f.top} to ${f.bottom}`;
// A row taller than the view comes to its top, not its bottom.
await tap(head("tall")); await wait(450); await quiet();
const tall = head("tall").getBoundingClientRect();
if (!open("tall") || Math.abs(tall.top - scroller.getBoundingClientRect().top) > 1) return `the tall row's top is at ${tall.top}, the frame's at ${scroller.getBoundingClientRect().top}`;
if (open(low)) return "the tall row did not take over its group";
await tap(head("tall")); await wait(400);
// Scrolling by a finger on a head does not open it.
scroller.scrollTop = 0; await wait(150);
const was = log();
await drag(head("a2"), 0, -120, 250); await wait(300);
if (scroller.scrollTop < 40) return `a drag on a row scrolled ${scroller.scrollTop}`;
if (open("a2") || log() !== was) return "a drag on a row toggled it";
scroller.scrollTop = 0;
// Rows with no group stay as they are.
await tap(head("b2")); await wait(400);
if (!open("b2") || !open("b3")) return "rows with no group shut each other";
// Open from outside: the prop leads.
await tap($("#exprow-boss")); await wait(400);
if (!open("b1")) return "the open prop did not open the row";
await tap($("#exprow-boss")); await wait(400);
if (open("b1")) return "the open prop did not close the row";
// The keyboard: a real button, Enter comes as a click.
head("b2").focus();
head("b2").click(); await wait(400);
if (open("b2")) return "the keyboard's click did not close it";
if (document.activeElement !== head("b2")) return "focus left the row";
// Only the panel's own growth scrolls: the same transition ending on something inside it does not.
await tap(head("a1")); await wait(450);
scroller.scrollTop = 600; await wait(120);
const yHere = scroller.scrollTop;
// From a div, as a row nested in this one would be: two divs compare equal, a div and a p do not.
panel("a1").querySelector(".ui-exprow-clip").dispatchEvent(new TransitionEvent("transitionend", { propertyName: "grid-template-rows", bubbles: true }));
await wait(350);
if (Math.abs(scroller.scrollTop - yHere) > 1) return `a child's transition scrolled the row into view: ${yHere} to ${scroller.scrollTop}`;
panel("a1").dispatchEvent(new TransitionEvent("transitionend", { propertyName: "grid-template-rows", bubbles: true }));
await wait(500);
if (Math.abs(scroller.scrollTop - yHere) < 1) return "the panel's own transition did not scroll";
await tap(head("a1")); await wait(450);
// Reduced motion, asked for with the app open: no transition, so opening still scrolls, at once.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(80);
scroller.scrollTop = 0; await wait(100);
const low2 = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `a${i}`).find((n) => { const r = head(n).getBoundingClientRect(), fr = scroller.getBoundingClientRect(); return r.bottom <= fr.bottom && r.bottom > fr.bottom - 90; });
const r9 = head(low2).getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r9.left + 40, y: r9.top + 20 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(160);
if (getComputedStyle(panel(low2)).transitionDuration.split(",")[0] !== "0s") return "reduced motion still animates";
const rm = row(low2).getBoundingClientRect(), fm = scroller.getBoundingClientRect();
if (!open(low2) || rm.bottom > fm.bottom + 1) return `with reduced motion the row ends at ${rm.bottom}, the frame at ${fm.bottom}`;
await cdp("Emulation.setEmulatedMedia", { features: [] });
await tap(head(low2)); await wait(400);
// Turning the device keeps what is open.
scroller.scrollTop = 0; await wait(100);
await tap(head("a3")); await wait(450);
if (!open("a3")) return "a3 did not open";
const size = device === "phone" ? [390, 844] : [820, 1180];
await cdp("Emulation.setDeviceMetricsOverride", { width: size[1], height: size[0], deviceScaleFactor: 2, mobile: true });
await wait(350);
if (!open("a3")) return "turning the device closed the row";
await cdp("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 2, mobile: true });
await wait(350);
if (!open("a3") || panel("a3").getBoundingClientRect().height < 100) return "the row lost its height on turning back";
