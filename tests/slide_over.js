// tablet
const W = innerWidth, H = innerHeight;
const panel = $(".ui-slide-over-panel"), top_ = $(".ui-slide-over-top"), tab = $(".ui-slide-over-tab");
const across = $(".ui-slide-over-across"), hide = $(".ui-slide-over-hide"), open = $(".ui-slide-over-open");
const rect = (el) => el.getBoundingClientRect();
const said = () => $("#over-demo-said").textContent;
const atRight = () => Math.abs(rect(panel).right - (innerWidth - 12)) < 1.5 && panel.dataset.edge === "right";
const atLeft = () => Math.abs(rect(panel).left - 12) < 1.5 && panel.dataset.edge === "left";
const settled = () => wait(380);
const away = () => getComputedStyle(panel).visibility === "hidden" && (rect(panel).left >= innerWidth || rect(panel).right <= 0);

// It starts floating on the right, the height of the screen less a margin, and 320 wide.
if (!atRight()) return `it starts at ${rect(panel).left}, on the ${panel.dataset.edge}`;
if (rect(panel).width !== 320) return `it is ${rect(panel).width} wide`;
if (rect(panel).top !== 12 || rect(panel).bottom !== innerHeight - 12) return `it runs ${rect(panel).top} to ${rect(panel).bottom}`;
if (document.querySelector("dialog[open]") || panel.closest("[inert]")) return "something holds the page";
if (getComputedStyle($(".ui-slide-over")).pointerEvents !== "none") return "its host would swallow the page's taps";

// The page behind goes on working, with the panel staying where it is.
const count = $("#over-demo-count"), field = $("#over-demo-field");
await tap(count); await tap(count);
if (!count.textContent.includes("Counted 2")) return `the page's button says ${count.textContent}`;
await tap(field);
if (document.activeElement !== field) return "the page's field did not take the focus";
field.value = "B-12";
if (!atRight() || panel.dataset.away !== "false") return "a tap on the page moved the panel";
await tap($("#over-demo-note"));
if (document.activeElement !== $("#over-demo-note")) return "a field in the panel did not take the focus";
await tap(field);
if (document.activeElement !== field) return "the focus is held in the panel";

// Drag short: a spring back. Past the threshold only by a little.
await drag(top_, -100, 0, 400);
await settled();
if (!atRight() || panel.style.transform !== "") return `a short drag left it at ${rect(panel).left}, ${panel.style.transform}`;
// Up and down does not move it.
await drag(top_, 6, 120, 250);
await settled();
if (!atRight()) return "an upright drag moved it";
// Under the threshold, nothing starts.
await drag(top_, -6, 0, 100);
await settled();
if (!atRight()) return "six px moved it";

// It follows the finger, at once, by transform; a cancelled touch goes back.
const r0 = rect(top_), p = { x: r0.left + 60, y: r0.top + 20 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
for (let n = 1; n <= 8; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - n * 20, y: p.y }] }); await wait(16); }
await wait(80);
if (Math.abs(rect(panel).right - (innerWidth - 12 - 160)) > 3) return `it did not follow the finger: ${rect(panel).right}`;
// State changing mid-drag, even the width its style is made from: it stays under the finger.
const moved = panel.style.transform, hostStyle = $(".ui-slide-over").getAttribute("style");
$("#over-demo-wider").click(); await wait(80);
if ($(".ui-slide-over").getAttribute("style") === hostStyle) return "the width did not change, so this proves nothing";
if (panel.style.transform !== moved) return `a change of width took the drag from ${moved} to ${panel.style.transform}`;
$("#over-demo-count").click(); await wait(80);
if (panel.style.transform !== moved) return `a change on the page took the drag to ${panel.style.transform}`;
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - 180, y: p.y }] });
await wait(80);
if (panel.style.transform !== "translateX(-180px)") return `it stopped following: ${panel.style.transform}`;
$("#over-demo-wider").click(); await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await settled();
if (!atRight()) return "a cancelled drag did not go back";

// A long drag crosses, and says so.
await drag(top_, -(innerWidth - 300), 0, 500);
await settled();
if (!atLeft()) return `a long drag left it at ${rect(panel).left}, on the ${panel.dataset.edge}`;
if (said() !== "Panel on the left, open") return `on_edge: ${said()}`;
if (rect(panel).width !== 320) return "it changed width on the way";
// A flick back across, though it stops short of half way.
await drag(top_, 120, 0, 50);
await settled();
if (!atRight()) return `a flick did not cross: ${panel.dataset.edge}, ${rect(panel).left}`;

// Out past its own edge: put away, with a tab left there.
await drag(top_, 200, 0, 300);
await settled();
if (!away()) return `a drag out left it at ${rect(panel).left}`;
if (said() !== "Panel on the right, put away") return `on_close: ${said()}`;
if (rect(tab).right !== innerWidth || rect(tab).width !== 44) return `the tab is at ${rect(tab).right}, ${rect(tab).width} wide`;
if (open.getAttribute("aria-expanded") !== "false") return "the trigger still says it is out";
// The tab, by a tap.
await tap(tab);
await settled();
if (!atRight() || said() !== "Panel on the right, brought back") return `the tab: ${said()}, ${rect(panel).left}`;
if (document.activeElement !== panel.querySelector("h2")) return "the focus did not go to the panel";
// A flick out, then the tab by a drag: short does nothing, longer brings it.
await drag(top_, 90, 0, 40);
await settled();
if (!away()) return "a flick out did not put it away";
await drag(tab, -30, 0, 300);
await settled();
if (!away()) return "a short drag on the tab brought it out";
await drag(tab, -120, 0, 300);
await settled();
if (!atRight()) return "a drag on the tab did not bring it out";

// Every drag has a button.
await tap(across); await settled();
if (!atLeft()) return "Move across did not move it";
if (across.getAttribute("aria-label") !== "Move to the right edge") return `its label is ${across.getAttribute("aria-label")}`;
await tap(hide); await settled();
if (!away()) return "Hide did not hide it";
if (rect(tab).left !== 0) return "on the left the tab is not at the left edge";
await tap(tab); await settled();
if (!atLeft()) return "it came back on the wrong edge";
await tap(across); await settled();
await tap(open); await settled();
if (!away()) return "the trigger did not hide it";
await tap(open); await settled();
if (!atRight()) return "the trigger did not bring it back";

// Escape, a real key, only with the focus inside; the focus lands on the tab.
await tap(field);
const esc = async () => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await settled(); };
await esc();
if (!atRight()) return "Escape on the page hid the panel";
hide.focus(); await esc();
if (!away()) return "Escape in the panel did not hide it";
if (document.activeElement !== tab) return `the focus went to ${document.activeElement.tagName}`;
await tap(tab); await settled();

// The panel's own list scrolls without moving the page.
const body = $(".ui-slide-over-body");
const before = scrollY;
await drag(body, 0, -240, 200);
await wait(200);
if (body.scrollTop < 100) return `the panel did not scroll: ${body.scrollTop}`;
if (scrollY !== before) return "the page moved with the panel";

// The keyboard, by a stand-in: it rises above it. The page's size stays.
const vv = visualViewport, tall = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => tall - 300 });
vv.dispatchEvent(new Event("resize"));
await settled();
if (Math.abs(rect(panel).bottom - (tall - 300 - 12)) > 1) return `over the keyboard it ends at ${rect(panel).bottom}`;
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await settled();
if (Math.abs(rect(panel).bottom - (tall - 12)) > 1) return "it did not go back down with the keyboard";

// A real turn: it keeps its edge, its scroll, and what is focused.
await tap(across); await settled();
const note = $("#over-demo-note");
note.scrollIntoView({ block: "nearest" });
await tap(note);
note.value = "Side door";
const scrolled = body.scrollTop;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(450);
if (!atLeft() || document.activeElement !== note || note.value !== "Side door") return "a turn lost its place";
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(450);
if (!atLeft() || rect(panel).width !== 320) return `on a phone: ${rect(panel).left}, ${rect(panel).width}`;
await tap(across); await settled();
if (!atRight()) return "on a phone it did not cross";
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(450);
if (!atRight()) return "the trip lost its edge";
