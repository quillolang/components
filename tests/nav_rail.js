// tablet
const W = innerWidth, H = innerHeight;
const view = $(".ui-nav-rail"), frame = view.closest(".demo-tablet");
const side = view.querySelector(".ui-nav-rail-side"), page = view.querySelector(".ui-nav-rail-page");
const fab = view.querySelector(".ui-nav-rail-action"), dlg = view.querySelector("dialog");
const rect = (el) => el.getBoundingClientRect();
const item = (id) => view.querySelector(`.ui-nav-rail-item[data-id="${id}"]`);
const row = (id) => dlg.querySelector(`[data-row="${id}"]`);
const more = view.querySelector(".ui-nav-rail-more");
const menu = side.querySelector(".ui-nav-rail-menu");
const on = (el) => el.getClientRects().length > 0;
const width = async (w) => { frame.style.width = w == null ? "" : w + "px"; await wait(120); };
const asked = () => $("#rail-demo-page").textContent;

// Badges: count, cap, dot, nothing for 0 and for what is not a number.
const badge = (id) => { const b = item(id).querySelector(".ui-nav-rail-badge"); return b ? b.textContent + (b.classList.contains("ui-nav-rail-dot") ? "dot" : "") : "none"; };
if ([badge("inbox"), badge("calls"), badge("team"), badge("files"), badge("plans"), badge("stats")].join() !== "4,99+,dot,none,none,none") return `badges: ${["inbox", "calls", "team", "files", "plans", "stats"].map(badge)}`;
if (!item("calls").textContent.includes("99+ new") || !item("team").textContent.includes("something new")) return "a screen reader is not told of the badges";

const asRail = () => {
    if (view.dataset.shape !== "rail") return `shape ${view.dataset.shape}`;
    const s = rect(side), p = rect(page);
    if (s.width !== 80 && s.width !== 81) return `the rail is ${s.width} wide`;
    if (s.height !== rect(view).height) return "the rail does not run the height of the box";
    if (Math.abs(s.right - p.left) > 1) return "the page does not start at the rail";
    if (!on(menu)) return "no menu at the top of the rail";
    if (!(rect(menu).bottom <= rect(fab).top + 1 && rect(fab).bottom <= rect(item("inbox")).top + 1)) return "menu, action and places are not in that order";
    if (on(more)) return "More has no place on a rail";
    if (!on(item("stats"))) return "the rail left out a place";
    if (rect(item("inbox")).left < s.left || rect(item("inbox")).right > s.right) return "a place stands out of the rail";
};
const asBar = () => {
    if (view.dataset.shape !== "bar") return `shape ${view.dataset.shape}`;
    const s = rect(side), v = rect(view);
    if (Math.abs(s.bottom - v.bottom) > 1 || Math.abs(s.width - v.width) > 1) return `the bar is not along the bottom: ${s.bottom}, ${v.bottom}`;
    if (rect(page).bottom > s.top + 1) return "the page runs under the bar";
    if (on(menu)) return "the rail's menu stayed in the bar";
    if (!on(more)) return "no More in the bar";
    const places = ["inbox", "calls", "team", "files"].map(item);
    if (!places.every(on) || on(item("plans")) || on(item("stats"))) return "the bar should hold four places and More";
    if (!(rect(places[0]).right <= rect(places[1]).left + 1 && Math.abs(rect(places[0]).top - rect(places[1]).top) < 1)) return "the bar's places are not in a row";
    const f = rect(fab);
    if (!(f.bottom <= s.top)) return `the action does not float above the bar: ${f.bottom} over ${s.top}`;
    if (!(f.right <= v.right && f.right > v.right - 40)) return "the action is not at the right";
};

let bad = asRail();
if (bad) return `at ${W}: ${bad}`;
if (item("inbox").getAttribute("aria-current") !== "page") return "the current place is not marked";
if (getComputedStyle(item("inbox").querySelector(".ui-nav-rail-pill")).backgroundColor === "rgba(0, 0, 0, 0)") return "the current place has no pill";

// A press: marked, told, and the keys.
await tap(item("calls"));
if (asked() !== "Calls" || item("calls").getAttribute("aria-current") !== "page" || item("inbox").hasAttribute("aria-current")) return `a press gave ${asked()}`;
await tap(fab);
if ($("#rail-demo-drafts").textContent !== "1 drafts started") return `the action: ${$("#rail-demo-drafts").textContent}`;
item("inbox").focus();
key(item("inbox"), "ArrowDown"); await wait(40);
if (document.activeElement !== item("calls")) return "ArrowDown did not move down the rail";
key(item("calls"), "End"); await wait(40);
if (document.activeElement !== item("stats")) return "End did not reach the last place";
key(item("stats"), "ArrowDown"); await wait(40);
if (document.activeElement !== item("stats")) return "ArrowDown ran off the end";
key(item("stats"), "Home"); await wait(40);
if (document.activeElement !== item("inbox")) return "Home did not reach the first place";

// The menu.
await tap(menu); await wait(320);
if (!dlg.open) return "the menu button did not open the menu";
if (Math.abs(rect(dlg).left) > 1 || rect(dlg).width !== Math.min(320, innerWidth * 0.86)) return `the menu is at ${rect(dlg).left}, ${rect(dlg).width} wide`;
if (!row("stats") || !row("settings") || !row("help")) return "the menu does not hold every place";
if (row("calls").getAttribute("aria-current") !== "page") return "the menu does not mark the current place";
if (row("inbox").querySelector(".ui-nav-rail-badge").textContent !== "4") return "the menu lost the badge";
await tap(row("settings")); await wait(200);
if (dlg.open) return "a press in the menu left it open";
if (asked() !== "Settings") return `from the menu: ${asked()}`;
if (side.querySelector("[aria-current]:not(.ui-nav-rail-more)")) return "a place in the bar stayed marked";

// Swiping the menu: short springs back; across and cancelled stay; far and a flick close it.
await tap(menu); await wait(320);
const list = dlg.querySelector(".ui-nav-rail-drawer-top");
await drag(list, -50, 0, 300); await wait(300);
if (!dlg.open || dlg.style.transform !== "" || Math.abs(rect(dlg).left) > 1) return `a short swipe: open ${dlg.open}, ${rect(dlg).left}`;
await drag(list, -4, 90, 200); await wait(300);
if (!dlg.open) return "an upright pull closed it";
const mid = rect(list), p = { x: mid.left + mid.width / 2, y: mid.top + mid.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
for (let n = 1; n <= 6; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - n * 20, y: p.y }] }); await wait(16); }
await wait(80);
if (Math.abs(rect(dlg).left + 120) > 3) return `the menu did not follow the finger: ${rect(dlg).left}`;
// State changing mid-swipe: it stays under the finger.
fab.click(); await wait(80);
if (Math.abs(rect(dlg).left + 120) > 3) return `a change of state moved the swipe: ${rect(dlg).left}`;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(320);
if (!dlg.open || Math.abs(rect(dlg).left) > 1) return "a cancelled swipe did not spring back";
await drag(list, -180, 0, 260); await wait(320);
if (dlg.open) return "a long swipe did not close it";
await tap(menu); await wait(320);
await drag(list, -50, 0, 30); await wait(320);
if (dlg.open) return "a flick did not close it";
// Escape, and a tap beside it.
await tap(menu); await wait(320);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(200);
if (dlg.open) return "Escape did not close it";
await tap(menu); await wait(320);
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: innerWidth - 20, y: 300 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(300);
if (dlg.open) return "a tap beside it did not close it";

// By its own box: the edge of a phone's shape, with the screen the same.
await width(600); bad = asRail(); if (bad) return `at 600: ${bad}`;
await width(599); bad = asBar(); if (bad) return `at 599: ${bad}`;
await tap(more); await wait(320);
if (!dlg.open) return "More did not open the menu";
await tap(row("plans")); await wait(200);
if (asked() !== "Plans") return `from More: ${asked()}`;
if (more.getAttribute("aria-current") !== "true") return "More is not marked for a place under it";
await tap(item("inbox"));
if (more.hasAttribute("aria-current")) return "More stayed marked";

// A place with the focus that goes under More: the focus goes to More, not to nowhere.
await width(null);
item("stats").focus();
await width(500);
if (document.activeElement !== more) return `the focus went to ${document.activeElement.tagName}.${document.activeElement.className}`;
await width(null);

// A real phone, then back: a real turn on the way.
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(400);
bad = asRail(); if (bad) return `turned: ${bad}`;
if (item("inbox").getAttribute("aria-current") !== "page") return "a turn lost the place";
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(400);
bad = asBar(); if (bad) return `on a phone: ${bad}`;
if (rect(side).bottom !== 844) return `the bar ends at ${rect(side).bottom}`;
const under = rect(item("inbox")); if (under.height < 44 || under.width < 44) return "a bar's place is too small";
await tap(fab);
if ($("#rail-demo-drafts").textContent !== "3 drafts started") return `the floating action did not press on a phone: ${$("#rail-demo-drafts").textContent}`;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(400);
bad = asRail(); if (bad) return `back: ${bad}`;
