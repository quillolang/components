// tablet
await wait(300);
const bad = $("#hover-cursor-row-bad");
const titles = [...bad.querySelectorAll(".ui-hover-cursor-row-title")].map((t) => t.textContent).join();
if (titles !== "Two,No id") return "bad rows: " + titles;
bad.remove();
const rows = $$(".ui-hover-cursor-row-item");
const note = () => $("#hover-cursor-row-note").textContent;
const menu = $(".ui-hover-cursor-row-menu");
const open = () => menu.matches(":popover-open");
const lifted = (r) => r.classList.contains("ui-hover-cursor-row-lifted");
const mouse = (type, x, y, o = {}) => cdp("Input.dispatchMouseEvent", { type, x, y, pointerType: "mouse", button: "none", buttons: 0, ...o });

// A mouse lifts the row it is on, and it leans by where the pointer is.
const box = rows[0].getBoundingClientRect();
await mouse("mouseMoved", box.left + box.width * 0.75, box.top + box.height / 2);
await wait(60);
if (!lifted(rows[0])) return "a mouse did not lift the row";
if (rows[0].style.transform !== "translate(1.5px, 0px) scale(1.012)") return "the lean at three quarters: " + rows[0].style.transform;
await mouse("mouseMoved", box.left + box.width * 0.25, box.top + box.height * 0.25);
await wait(60);
// The event's y is in whole pixels, so the lean down the row is a hair off a clean -1.
const lean = rows[0].style.transform.match(/^translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(1\.012\)$/);
if (!lean || lean[1] !== "-1.5" || Math.abs(parseFloat(lean[2]) + 1) > 0.1) return "the lean at a quarter: " + rows[0].style.transform;
if (lifted(rows[1])) return "a row the mouse is not on lifted";
// A state changing under the pointer leaves the row leaning as it was.
const leant = rows[0].style.transform;
rows[5].querySelector(".ui-hover-cursor-row-main").click();
await wait(60);
if (rows[0].style.transform !== leant || !lifted(rows[0])) return "a state change moved the lifted row: " + rows[0].style.transform;
// To the next row: the first settles.
const box2 = rows[2].getBoundingClientRect();
await mouse("mouseMoved", box2.left + box2.width / 2, box2.top + box2.height / 2);
await wait(60);
if (lifted(rows[0]) || rows[0].style.transform !== "") return "the row left stayed lifted";
if (!lifted(rows[2])) return "the row entered did not lift";
await mouse("mouseMoved", 2, innerHeight - 2);
await wait(60);
if (lifted(rows[2])) return "leaving did not settle the row";

// Reduced motion: marked, not moved.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await mouse("mouseMoved", box.left + box.width * 0.75, box.top + 10);
await wait(60);
if (!lifted(rows[0]) || rows[0].style.transform !== "") return "reduced motion: " + rows[0].style.transform;
await mouse("mouseMoved", 2, innerHeight - 2);
await cdp("Emulation.setEmulatedMedia", { features: [] });
await wait(60);

// A touch lifts nothing, during the press or after, and a tap opens the row.
const p = middle(rows[1]);
await fingers("touchStart", [p]);
await wait(80);
if (lifted(rows[1])) return "a finger lifted a row";
await fingers("touchEnd", []);
await wait(200);
if (lifted(rows[1]) || rows[1].style.transform !== "") return "a tap left a row lifted";
if (note() !== "Opened 2.") return "a tap: " + note();
if (!rows[1].querySelector(".ui-hover-cursor-row-main").hasAttribute("aria-current")) return "the row opened is not marked";

// A pen in the air lifts only where the system says it can hover. Here it does not, then a stand-in says it does.
const pen = (x, y) => cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, pointerType: "pen", button: "none", buttons: 0 });
await pen(box.left + 20, box.top + 20);
await wait(60);
if (lifted(rows[0])) return "a pen lifted a row with no hover";
await pen(2, innerHeight - 2);
await wait(40);
const real = window.matchMedia;
window.matchMedia = (q) => (q === "(any-hover: hover)" ? { matches: true } : real.call(window, q));
await pen(box.left + 20, box.top + 20);
await wait(60);
window.matchMedia = real;
if (!lifted(rows[0])) return "a pen in the air did not lift a row with hover";
await pen(2, innerHeight - 2);
await wait(60);

// A right-click: a menu at the pointer, in place, and the row is not opened.
const x0 = box.left + 100, y0 = box.top + 20;
await mouse("mouseMoved", x0, y0);
await mouse("mousePressed", x0, y0, { button: "right", buttons: 2, clickCount: 1 });
await mouse("mouseReleased", x0, y0, { button: "right", buttons: 0, clickCount: 1 });
await wait(100);
if (!open()) return "a right-click did not open the menu";
let m = menu.getBoundingClientRect();
if (Math.round(m.left) !== Math.round(x0) || Math.round(m.top) !== Math.round(y0)) return "the menu at the pointer: " + m.left + "," + m.top + " for " + x0 + "," + y0;
if (note() !== "Opened 2.") return "a right-click opened a row: " + note();
// A press outside closes it.
await tap($("#hover-cursor-row-note"));
if (open()) return "a press outside did not close the menu";
// Near the bottom right it flips rather than leaves the screen.
const low = rows[rows.length - 1].getBoundingClientRect();
const x1 = innerWidth - 20, y1 = Math.min(innerHeight - 20, low.bottom - 4);
await mouse("mouseMoved", x1, y1);
const on = document.elementFromPoint(x1, y1).closest(".ui-hover-cursor-row-item");
if (on) {
    await mouse("mousePressed", x1, y1, { button: "right", buttons: 2, clickCount: 1 });
    await mouse("mouseReleased", x1, y1, { button: "right", buttons: 0, clickCount: 1 });
    await wait(100);
    m = menu.getBoundingClientRect();
    if (m.right > innerWidth || m.bottom > innerHeight) return "the menu left the screen: " + m.right + "," + m.bottom;
    if (Math.round(m.right) !== Math.round(x1)) return "the menu should flip left: " + m.right;
    await mouse("mouseMoved", 2, innerHeight - 2);
    await tap($("#hover-cursor-row-note"));
}

// A long press gives the menu and it stays when the finger lifts. No row opens.
await tap(rows[3].querySelector(".ui-hover-cursor-row-main"));
if (note() !== "Opened 4.") return "a tap on the fourth: " + note();
await hold(rows[4].querySelector(".ui-hover-cursor-row-main"), 600);
await wait(100);
if (!open()) return "a long press did not leave the menu open";
if (note() !== "Opened 4.") return "a long press opened the row: " + note();
const items = () => [...menu.querySelectorAll("[role=menuitem]")];
await tap(items()[1]);
if (open() || note() !== "rename on 5.") return "an item after a long press: " + note();
// A finger that moves is scrolling, not pressing.
const q = middle(rows[2].querySelector(".ui-hover-cursor-row-main"));
await fingers("touchStart", [q]);
await fingers("touchMove", [{ x: q.x, y: q.y + 30 }]);
await wait(600);
await fingers("touchEnd", []);
await wait(100);
if (open()) return "a moving finger opened the menu";
if (rows[2].classList.contains("ui-hover-cursor-row-pressing")) return "a moved press stayed marked";

// The More button is the equal: it opens from the row, on the first item, and Escape gives focus back.
const more = rows[1].querySelector(".ui-hover-cursor-row-more");
await tap(more);
await wait(60);
if (!open()) return "More did not open the menu";
if (document.activeElement !== items()[0]) return "More should focus the first item";
if (menu.getAttribute("aria-label") !== "Actions for Site photos") return "the menu's name: " + menu.getAttribute("aria-label");
const press = async (k, code, vk) => {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
    await wait(50);
};
await press("ArrowDown", "ArrowDown", 40);
if (document.activeElement !== items()[1]) return "ArrowDown";
await press("ArrowUp", "ArrowUp", 38);
await press("ArrowUp", "ArrowUp", 38);
if (document.activeElement !== items()[3]) return "ArrowUp wraps";
await press("Escape", "Escape", 27);
if (open() || document.activeElement !== more) return "Escape should close and give focus back";

// The keyboard's menu key on a row.
const main = rows[3].querySelector(".ui-hover-cursor-row-main");
main.focus();
await press("ContextMenu", "ContextMenu", 93);
await wait(60);
if (!open() || document.activeElement !== items()[0]) return "the menu key";
await press("End", "End", 35);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await wait(120);
if (note() !== "delete on 4." || document.activeElement !== main) return "Enter on an item: " + note();

// Wide and narrow.
const left = rows.map((r) => Math.round(r.getBoundingClientRect().left));
if (new Set(left).size !== 2) return "two columns in a wide pane: " + left.join();
