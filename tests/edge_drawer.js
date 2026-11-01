// mobile
// A drawer open from the start: phone only, as a tablet has room to dock it. It holds the
// focus and has its step of the history like any other, and goes as any other does.
const opened = $$(".ui-edgedrawer-in")[1], openPanel = opened.querySelector(".ui-edgedrawer-panel");
if (!opened.classList.contains("ui-edgedrawer-open")) return "open={true} at load";
if (device === "phone") {
    if (getComputedStyle(openPanel).visibility !== "visible") return "open at load, not shown";
    if (!opened.querySelector(".ui-edgedrawer-main").hasAttribute("inert")) return "open at load, the content is not inert";
    if (document.activeElement !== openPanel) return "open at load, the focus is on " + document.activeElement.tagName;
    if (!history.state?.ui_edge_drawer) return "open at load, no step of history";
    history.back();
    await wait(450);
    if (opened.classList.contains("ui-edgedrawer-open")) return "open at load, Back did not close it";
    if (history.state?.ui_edge_drawer) return "open at load, the step stayed";
} else {
    if (getComputedStyle(openPanel).position !== "static") return "open at load on a tablet: " + getComputedStyle(openPanel).position;
    if (history.state?.ui_edge_drawer) return "open at load and docked, a step of history";
}
const inner = $(".ui-edgedrawer-in"), panel = $(".ui-edgedrawer-panel"), scrim = $(".ui-edgedrawer-scrim"), main = $(".ui-edgedrawer-main");
const box = inner.getBoundingClientRect(), left = box.left, y = box.top + 200;
const isOpen = () => inner.classList.contains("ui-edgedrawer-open");
const x = () => new DOMMatrix(getComputedStyle(panel).transform).m41;
const changes = () => Number(/Opened or closed (\d+)/.exec(document.body.textContent)[1]);
const pull = async (fx, dx, dy, ms) => {
    const steps = Math.max(4, Math.round(ms / 16));
    await fingers("touchStart", [{ x: fx, y }]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: fx + dx * i / steps, y: y + dy * i / steps }]); await wait(ms / steps); }
};
const lift = async () => { await fingers("touchEnd", []); await wait(400); };

if (device === "tablet") {
    // Wide: it stands beside the content, and is no overlay.
    if (box.width < 700) return "the frame is " + box.width;
    if (getComputedStyle(panel).position !== "static") return "not docked: " + getComputedStyle(panel).position;
    if (getComputedStyle(panel).visibility !== "visible") return "docked but hidden";
    if (getComputedStyle(scrim).display !== "none") return "a scrim beside a docked drawer";
    if ($(".ui-edgedrawer-close").getClientRects().length) return "a Close button on a docked drawer";
    if ($(".ui-edgedrawer-menu").getClientRects().length) return "a menu button beside a docked drawer";
    if (panel.getAttribute("role") !== "navigation") return "docked role: " + panel.getAttribute("role");
    if (panel.getAttribute("aria-modal") !== null) return "docked but modal";
    if (main.hasAttribute("inert")) return "the content is inert beside a docked drawer";
    if (Math.abs(panel.getBoundingClientRect().width - 300) > 1) return "width: " + panel.getBoundingClientRect().width;
    if (main.getBoundingClientRect().left !== panel.getBoundingClientRect().right) return "the content is not beside it";
    await pull(left + 8, 200, 0, 200);
    await lift();
    if (isOpen() || changes() !== 0) return "a docked drawer swiped";
    await tap($$(".ui-edgedrawer-demo-list button")[2]);
    if ($(".ui-edgedrawer-demo-top h3").textContent !== "Photos") return "a docked drawer's item";
    // Docked off, a tablet has the phone's overlay, and the gesture.
    [...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Always an overlay").click();
    await wait(300);
    if (getComputedStyle(panel).position !== "absolute" || getComputedStyle(panel).visibility !== "hidden") return "dock={false}: " + getComputedStyle(panel).position;
    await pull(left + 8, 170, 0, 400);
    await wait(120);
    if (Math.abs(x() - (170 - 300)) > 3) return "dock={false} tracks: " + x();
    await lift();
    if (!isOpen() || !main.hasAttribute("inert")) return "dock={false} did not open modally";
    if (panel.getAttribute("role") !== "dialog") return "dock={false}'s role";
    await pull(left + 280, -60, 0, 40);
    await lift();
    if (isOpen()) return "dock={false} did not shut";
    [...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Dock it when there is room").click();
    await wait(300);
    return;
}
const W = panel.offsetWidth;
if (W !== 300) return "width: " + W;
if (isOpen() || getComputedStyle(panel).visibility !== "hidden") return "starts open";
if (panel.getAttribute("role") !== "dialog") return "role: " + panel.getAttribute("role");

// It follows the finger, and a slow release short of half springs shut.
await pull(left + 8, 100, 0, 500);
await wait(60);
if (Math.abs(x() - (100 - W)) > 3) return `tracks: ${x()}, wanted ${100 - W}`;
if (Math.abs(Number(scrim.style.opacity) - 100 / W) > 0.01) return "scrim: " + scrim.style.opacity;
if (getComputedStyle(panel).visibility !== "visible") return "hidden while it moves";
await wait(120);
await lift();
if (isOpen() || changes() !== 0) return "a short slow drag opened it";
if (panel.style.transform !== "" || getComputedStyle(panel).visibility !== "hidden") return "did not go back shut";

// Slow past half opens it, holding the focus, the rest of the screen inert.
await pull(left + 8, 170, 0, 500);
await wait(120);
await lift();
if (!isOpen()) return "a long slow drag did not open it";
if (changes() !== 1) return "on_change count: " + changes();
if (document.activeElement !== panel) return "the focus went to " + document.activeElement.tagName;
if (!main.hasAttribute("inert")) return "the content is not inert";
if (panel.getAttribute("aria-modal") !== "true") return "aria-modal";
if (Math.abs(x()) > 0.5) return "not fully open: " + x();
if (!history.state?.ui_edge_drawer) return "no history step while open";

// Pulled back a little, slowly, it stays open; a flick shuts it.
await pull(left + 280, -80, 0, 500);
await wait(60);
if (Math.abs(x() + 80) > 3) return "pulling it back tracks: " + x();
await wait(120);
await lift();
if (!isOpen() || changes() !== 1) return "a short slow pull shut it";
await pull(left + 280, -60, 0, 40);
await lift();
if (isOpen() || changes() !== 2) return "a flick did not shut it";
await wait(100);
if (history.state?.ui_edge_drawer) return "the history step stayed";

// A flick opens it, from short of half.
await pull(left + 8, 70, 0, 40);
await lift();
if (!isOpen() || changes() !== 3) return "a flick did not open it";
// Up and down inside it is no swipe.
await pull(left + 100, 6, 120, 250);
await lift();
if (!isOpen()) return "a vertical drag shut it";
// A tap beside it shuts it.
await fingers("touchStart", [{ x: left + 350, y }]);
await fingers("touchEnd", []);
await wait(500);
if (isOpen() || changes() !== 4) return "the tap beside it";
await wait(100);

// Away from the edge nothing starts, up and down from the edge neither.
await pull(left + 60, 170, 0, 300);
await lift();
if (isOpen() || changes() !== 4) return "a drag from the middle";
await pull(left + 8, 4, -120, 250);
await lift();
if (isOpen() || changes() !== 4) return "a vertical drag from the edge";

// The system takes the gesture.
await pull(left + 8, 200, 0, 200);
await fingers("touchCancel", []);
await wait(400);
if (isOpen() || changes() !== 4 || panel.style.transform !== "") return "a cancelled drag: " + isOpen() + " " + panel.style.transform;

// The menu button: focus goes in, stays in, and comes back.
const menu = $("#edge-drawer-demo-menu");
menu.focus();
menu.click();
await wait(400);
if (!isOpen() || changes() !== 5) return "the menu button";
if (document.activeElement !== panel) return "focus after the button";
const items = [...panel.querySelectorAll("a[href], button")];
const tabKey = (shift) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true }));
tabKey(false);
if (document.activeElement !== items[0]) return "Tab from the panel";
items[items.length - 1].focus();
tabKey(false);
if (document.activeElement !== items[0]) return "Tab did not wrap at the end";
tabKey(true);
if (document.activeElement !== items[items.length - 1]) return "Shift Tab did not wrap at the start";
// In the middle Tab is the browser's: nothing moved by hand, each way, and the default not stopped.
const midKey = (shift) => { const ev = new KeyboardEvent("keydown", { key: "Tab", shiftKey: shift, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(ev); return ev.defaultPrevented; };
// (The three links last: plain elements, which are the ones Quillo's == cannot tell apart.)
for (const i of [1, 2, 3, 4, 5, 6]) {
    items[i].focus();
    if (midKey(false) || document.activeElement !== items[i]) return `Tab at item ${i} was taken`;
    if (midKey(true) || document.activeElement !== items[i]) return `Shift Tab at item ${i} was taken`;
}
// Wrapping stops the default: the check above is worth nothing without this one.
items[0].focus();
if (!midKey(true) || document.activeElement !== items[items.length - 1]) return "Shift Tab on the first";
if (!midKey(false) || document.activeElement !== items[0]) return "Tab on the last";
// Focus outside it comes in.
document.activeElement.blur();
inner.focus?.();
{ const ev = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }); main.dispatchEvent(ev); }
if (document.activeElement !== items[0]) return "focus outside the drawer stayed out: " + document.activeElement.tagName;
key(document.activeElement, "Escape");
await wait(400);
if (isOpen() || changes() !== 6) return "Escape";
if (document.activeElement !== menu) return "the focus did not come back: " + document.activeElement.tagName;

// Back closes it, once, and a later Back is the page's own.
await wait(100);
menu.click();
await wait(400);
history.back();
await wait(500);
if (isOpen() || changes() !== 8) return "Back did not close it: " + isOpen() + " " + changes();
if (history.state?.ui_edge_drawer) return "Back left the step";

// An item: your code shuts it, through `open`.
menu.click();
await wait(400);
await tap(panel.querySelectorAll(".ui-edgedrawer-demo-list button")[1]);
await wait(400);
if (isOpen() || changes() !== 10) return "an item did not shut it: " + changes();
if ($(".ui-edgedrawer-demo-top h3").textContent !== "Field notes") return "the item";
await wait(100);
if (history.state?.ui_edge_drawer) return "the item left the step";

// A link shuts it too, and is followed, not undone.
menu.click();
await wait(400);
await tap(panel.querySelector(".ui-edgedrawer-demo-list a"));
await wait(500);
if (isOpen() || changes() !== 12) return "a link did not shut it: " + changes();
if (location.hash !== "#edge-drawer-help") return "the link was undone: " + location.hash;
history.replaceState(null, "", location.pathname + location.search);

// A second finger is no gesture.
await fingers("touchStart", [{ x: left + 8, y, id: 1 }, { x: left + 80, y, id: 2 }]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: left + 8 + 20 * i, y, id: 1 }, { x: left + 80 + 20 * i, y, id: 2 }]); await wait(16); }
await lift();
if (isOpen() || panel.style.transform !== "") return "two fingers opened it";
await pull(left + 8, 120, 0, 200);
await fingers("touchStart", [{ x: left + 128, y, id: 1 }, { x: left + 220, y, id: 2 }]);
await wait(40);
await lift();
if (isOpen() || panel.style.transform !== "") return "a second finger during a pull";

// Right to left: it comes from the right edge, and goes back there.
inner.setAttribute("dir", "rtl");
const right = box.right;
await wait(350);
if (x() !== W) return "right to left, shut: " + x();
await pull(right - 8, -170, 0, 300);
await wait(120);
if (Math.abs(x() - (W - 170)) > 3) return "right to left tracks: " + x();
await lift();
if (!isOpen()) return "right to left did not open";
if (Math.round(panel.getBoundingClientRect().right) !== Math.round(right)) return "right to left, its side";
await tap($(".ui-edgedrawer-close"));
await wait(400);
inner.removeAttribute("dir");
if (isOpen()) return "right to left: Close";
await wait(100);

// Turned on its side while open: the wider pane docks it, and upright it is as it was.
menu.click();
await wait(400);
await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
await wait(350);
const dockedThen = getComputedStyle(panel).position, freeThen = !main.hasAttribute("inert");
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(350);
if (dockedThen !== "static" || !freeThen) return `turned: ${dockedThen} ${freeThen}`;
if (!isOpen() || !main.hasAttribute("inert")) return "upright again it lost its place";
key(panel, "Escape");
await wait(400);
if (isOpen()) return "Escape after turning";
