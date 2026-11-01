// tablet
const W = innerWidth, H = innerHeight;
const big = W >= 840 ? "full" : "rail";
const view = $(".ui-tablet-side"), frame = view.closest(".demo-tablet");
const panel = view.querySelector(".ui-tablet-side-panel"), main = view.querySelector(".ui-tablet-side-main");
const rect = (el) => el.getBoundingClientRect();
const item = (id) => view.querySelector(`[data-id="${id}"]`);
const width = async (w) => { frame.style.width = w == null ? "" : w + "px"; await wait(350); };
const pin = view.querySelector(".ui-tablet-side-pin");
const menu = () => [...view.querySelectorAll(".ui-tablet-side-menu")].find((b) => getComputedStyle(b).display !== "none");
const close = view.querySelector(".ui-tablet-side-close");
const name = (id) => item(id).querySelector(".ui-tablet-side-name");
const reads = (el) => rect(el).width > 2;
try { localStorage.removeItem("ui-tablet-side:demo-field"); } catch {}

// Badges: a count, a cap, nothing for 0 or for what is not a number.
const badge = (id) => item(id).querySelector(".ui-tablet-side-badge")?.textContent;
if (badge("jobs") !== "3" || badge("chat") !== "99+" || badge("docs") !== undefined || badge("time") !== undefined || badge("map") !== undefined) return `badges: ${badge("jobs")} ${badge("chat")} ${badge("docs")} ${badge("time")} ${badge("map")}`;
if (item("jobs").getAttribute("aria-current") !== "page") return "the current place is not marked";

const startsFull = big === "full";
const inFull = () => { if (view.dataset.mode !== "full") return `mode ${view.dataset.mode}`; if (rect(panel).width !== 260) return `open it is ${rect(panel).width} wide`; if (!reads(name("jobs"))) return "open it hides its words"; if (rect(main).left !== rect(panel).right) return "the page does not start where it ends"; if (!view.querySelector(".ui-tablet-side-section h3").getClientRects().length) return "the headings have gone"; };
const inRail = () => { if (view.dataset.mode !== "rail") return `mode ${view.dataset.mode}`; if (rect(panel).width !== 76) return `the rail is ${rect(panel).width} wide`; if (reads(name("jobs"))) return "the rail shows words"; if (view.querySelector(".ui-tablet-side-section h3").getClientRects().length) return "the rail shows headings"; if (!item("jobs").querySelector("svg")) return "the rail has no icon"; if (!view.querySelector(".ui-tablet-side-badge").getClientRects().length) return "the rail lost its badges"; if (rect(main).left !== rect(panel).left + 76) return "the page does not start at the rail"; };
const inOverlay = () => { if (view.dataset.mode !== "overlay") return `mode ${view.dataset.mode}`; if (getComputedStyle(panel).visibility !== "hidden") return "it shows when it should be out of sight"; if (rect(main).left !== rect(view).left) return "the page does not have the width"; if (!menu() || !menu().closest(".ui-tablet-side-bar")) return "no menu in the bar"; };

let bad = (startsFull ? inFull : inRail)();
if (bad) return `at ${W}: ${bad}`;

// By its own box: the edges of each width.
await width(840); bad = inFull(); if (bad) return `at 840: ${bad}`;
await width(839); bad = inRail(); if (bad) return `at 839: ${bad}`;
await width(600); bad = inRail(); if (bad) return `at 600: ${bad}`;
await width(599); bad = inOverlay(); if (bad) return `at 599: ${bad}`;

// An overlay: the menu, a press that closes it, the marked place.
await tap(menu()); await wait(300);
if (getComputedStyle(panel).visibility !== "visible" || rect(panel).left !== rect(view).left) return "the menu did not bring it in";
if (!main.inert) return "the page behind can still be reached";
if (document.activeElement !== item("jobs")) return `the focus went to ${document.activeElement.tagName}`;
await tap(item("rota")); await wait(320);
if (getComputedStyle(panel).visibility !== "hidden") return "a press did not close it";
if ($("#side-demo-page").textContent !== "Rota" || item("rota").getAttribute("aria-current") !== "page" || item("jobs").hasAttribute("aria-current")) return "the press did not take";
if (main.inert) return "the page stayed locked";

// Each way of closing it.
await tap(menu()); await wait(300);
await tap(close); await wait(320);
if (getComputedStyle(panel).visibility !== "hidden") return "Close did not close it";
await tap(menu()); await wait(300);
const sr = view.querySelector(".ui-tablet-side-scrim");
const vr = rect(view);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: vr.right - 30, y: vr.top + 300 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(350);
if (getComputedStyle(panel).visibility !== "hidden") return "a tap beside it did not close it";
await tap(menu()); await wait(300);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(350);
if (getComputedStyle(panel).visibility !== "hidden") return "Escape did not close it";
await wait(100);
if (document.activeElement !== menu()) return "the focus did not come back to the menu button";

// The swipes. From the edge: short springs back, up and down does nothing, far opens, a flick opens.
const swipe = async (x, dx, dy, steps = 10, gap = 20, end = "touchEnd") => {
    const p = { x, y: vr.top + 240 };
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    for (let i = 1; i <= steps; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }] }); await wait(gap); }
    if (end) { await cdp("Input.dispatchTouchEvent", { type: end, touchPoints: [] }); await wait(380); }
};
await swipe(vr.left + 6, 60, 0);
if (getComputedStyle(panel).visibility !== "hidden" || panel.style.transform !== "") return "a short swipe from the edge did not spring back";
await swipe(vr.left + 6, 4, 140);
if (getComputedStyle(panel).visibility !== "hidden") return "an upright pull opened it";
await swipe(vr.left + 6, 120, 0, 8, 16, null);
await wait(80); // a touch move is handed over with the next frame
const fol = rect(panel).right - vr.left;
if (Math.abs(fol - 120) > 4) return `it did not follow the finger: ${fol}`;
// State changing mid-swipe, even what the root's class reads: it stays under the finger.
const before = view.className;
pin.click(); await wait(80);
if (view.className === before) return "the pin did not change the root's class, so this proves nothing";
if (Math.abs(rect(panel).right - vr.left - 120) > 4) return `a change of state moved the swipe: ${rect(panel).right - vr.left}`;
if (getComputedStyle(panel).visibility !== "visible") return "a change of state hid the panel under the finger";
pin.click(); await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(380);
if (getComputedStyle(panel).visibility !== "hidden") return "a cancelled swipe opened it";
await swipe(vr.left + 6, 220, 0);
if (!view.classList.contains("ui-tablet-side-peek")) return "a long swipe did not open it";
// A swipe left to put it away.
await drag(panel, -40, 0, 300); await wait(100);
if (!view.classList.contains("ui-tablet-side-peek")) return "a short swipe left closed it";
await wait(250);
if (rect(panel).left !== vr.left) return "a short swipe left did not spring back";
await drag(panel, -180, 0, 260); await wait(350);
if (view.classList.contains("ui-tablet-side-peek")) return "a swipe left did not close it";
await swipe(vr.left + 6, 50, 0, 3, 6);
if (!view.classList.contains("ui-tablet-side-peek")) return "a flick did not open it";
await tap(close); await wait(320);
await width(null);

// The rail: tapping the menu brings it over the page without moving the page.
if (big === "rail") {
    const left = rect(main).left;
    await tap(menu()); await wait(300);
    if (rect(panel).width !== 260 || rect(main).left !== left) return "the rail did not open over the page";
    if (!reads(name("jobs"))) return "open from the rail, the words did not show";
    if (!pin.getClientRects().length) return "the pin is not offered";
    await tap(close); await wait(320);
    if (rect(panel).width !== 76) return "it did not go back to a rail";
    await drag(panel, 150, 0, 300); await wait(350);
    if (!view.classList.contains("ui-tablet-side-peek")) return "a swipe along the rail did not open it";
    await tap(close); await wait(320);
}

// The pin: at a medium width it stands open; it goes in localStorage; a new load finds it.
await width(700);
await tap(menu()); await wait(300);
await tap(pin); await wait(320);
if (pin.getAttribute("aria-pressed") !== "true") return "the pin is not pressed";
bad = inFull(); if (bad) return `pinned at 700: ${bad}`;
if ($("#side-demo-pin").textContent !== "The pin: pinned") return `on_pin: ${$("#side-demo-pin").textContent}`;
if (localStorage.getItem("ui-tablet-side:demo-field") !== "1") return `stored: ${localStorage.getItem("ui-tablet-side:demo-field")}`;
// Too narrow for a pin to mean anything: still an overlay, and it is offered no pin.
await width(500); bad = inOverlay(); if (bad) return `pinned at 500: ${bad}`;
await width(700);
if (view.dataset.mode !== "full") return "pinned, back at 700, it did not stand open";

const again = document.createElement("iframe");
again.style.cssText = "position: fixed; left: 0; top: 0; width: 700px; height: 500px; border: 0; visibility: hidden";
again.src = location.href;
document.body.append(again);
await new Promise((r) => (again.onload = r));
await wait(1200);
const other = again.contentDocument.querySelector(".ui-tablet-side");
if (!other) return "the second load has no sidebar";
for (const i of again.contentDocument.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
await wait(800);
const loaded = other.dataset.mode + " " + other.classList.contains("ui-tablet-side-pinned");
again.remove();
if (loaded !== "full true") return `a new load at 700 finds ${loaded}`;
await tap(pin); await wait(320);
bad = inRail(); if (bad) return `unpinned at 700: ${bad}`;
if (localStorage.getItem("ui-tablet-side:demo-field") !== "0") return "unpinning was not stored";
await width(null);

// Keys along the places.
item("jobs").focus();
key(item("jobs"), "ArrowDown"); await wait(40);
if (document.activeElement !== item("map")) return "ArrowDown did not move";
key(item("map"), "End"); await wait(40);
if (document.activeElement !== item("help")) return "End did not reach the last place";
key(item("help"), "ArrowDown"); await wait(40);
if (document.activeElement !== item("help")) return "ArrowDown ran off the end";
key(item("help"), "Home"); await wait(40);
if (document.activeElement !== item("jobs")) return "Home did not reach the first";

// A real turn: the same state, the other mode, and a phone's width.
await tap(item("map"));
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(450);
bad = (startsFull ? inRail : inFull)(); if (bad) return `turned: ${bad}`;
if (item("map").getAttribute("aria-current") !== "page") return "a turn lost the current place";
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(450);
bad = inOverlay(); if (bad) return `on a phone: ${bad}`;
await tap(menu()); await wait(300);
const ph = rect(panel);
if (ph.width !== Math.min(280, 390 * 0.85)) return `on a phone it is ${ph.width} wide`;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(450);
if (startsFull && view.classList.contains("ui-tablet-side-peek")) return "with room to stand open it stayed over the page";
if (view.classList.contains("ui-tablet-side-peek")) { await tap(close); await wait(320); }
bad = (startsFull ? inFull : inRail)(); if (bad) return `back as it was: ${bad}`;
try { localStorage.removeItem("ui-tablet-side:demo-field"); } catch {}
