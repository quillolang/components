// tablet
const W = innerWidth, H = innerHeight;
const frame = $(".demo-tablet");
const bar = () => $(".ui-tablet-bar");
const rect = (el) => el.getBoundingClientRect();
const group = (id) => bar().querySelector(`.ui-tablet-bar-row [data-group="${id}"]`);
const tool = (id) => bar().querySelector(`[data-tool="${id}"]`);
const more = () => bar().querySelector(".ui-tablet-bar-more");
const groups = () => [...bar().querySelectorAll(".ui-tablet-bar-row .ui-tablet-bar-group")].map((g) => g.dataset.group);
const out = () => [...bar().querySelectorAll(".ui-tablet-bar-row .ui-tablet-bar-gone")].map((g) => g.dataset.group);
const said = () => $("#bar-demo-said").textContent;
const told = () => $("#bar-demo-told").textContent;
const pane = (suffix) => bar().querySelector(`[id$="-${suffix}"][popover]`);
const opened = (suffix) => pane(suffix).matches(":popover-open");
const width = async (w) => { frame.style.width = w == null ? "" : w + "px"; await wait(150); };
const settled = () => wait(120);
const esc = async () => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(); };
const tiedTo = (p, b) => {
    const a = p.querySelector(".ui-anchored-arrow"), r = rect(a), m = rect(b);
    if (getComputedStyle(a).display === "none") return "no arrow";
    const off = (r.left + r.width / 2) - (m.left + m.width / 2);
    return Math.abs(off) > 1.5 ? `the arrow is ${off} px off its button` : null;
};
// What should be in the menu, worked out here: groups kept by priority, as many as fit in turn.
const priority = { history: 3, text: 2, insert: 1, view: 0, share: 0 };
const expected = () => {
    const row = bar().querySelector(".ui-tablet-bar-row"), room = row.clientWidth;
    const names = groups(), ws = {};
    for (const n of names) ws[n] = bar().querySelector(`[data-measure="${n}"]`).offsetWidth;
    const all = names.reduce((t, n) => t + ws[n], 0) + (names.length - 1) * 12;
    if (all <= room) return [];
    const order = names.map((n, i) => [n, i]).sort((a, b) => priority[b[0]] - priority[a[0]] || a[1] - b[1]).map((x) => x[0]);
    const kept = []; let used = 0;
    for (const n of order) { const w = ws[n] + (kept.length ? 12 : 0); if (used + w > room) break; kept.push(n); used += w; }
    return names.filter((n) => !kept.includes(n));
};
const fits = () => {
    const want = expected().join(), got = out().join();
    if (want !== got) return `at ${rect(bar()).width} px the menu holds ${got}, not ${want}`;
    const row = bar().querySelector(".ui-tablet-bar-row");
    const shown = [...row.querySelectorAll(".ui-tablet-bar-group:not(.ui-tablet-bar-gone)")].pop();
    if (shown && rect(shown).right > rect(row).right + 0.5) return `the last group runs ${rect(shown).right - rect(row).right} px past the row`;
};

// A saved value that names what is not there is no trouble, and its order holds.
if (groups().join() !== "history,text,insert,view,share") return `the order is ${groups()}`;
if (tool("undo").getAttribute("aria-label") !== "Undo") return "a button has no name";

// The words go when there is less room, and what fits follows.
let bad = fits(); if (bad) return bad;
const word = tool("undo").querySelector(".ui-tablet-bar-word");
if (W >= 840 ? rect(word).width < 10 : rect(word).width > 2) return `at ${W} the word is ${rect(word).width} wide`;
for (const w of [700, 560, 430, 320, 240]) {
    await width(w);
    bad = fits(); if (bad) return bad;
}
if (out().join() !== "text,insert,view,share") return `at 240 px only History should stay: ${out()}`;
// The least needed went first, in order.
await width(430);
const narrow = out();
if (!narrow.includes("share") || !narrow.includes("view") || narrow.includes("history")) return `at 430 px: ${narrow}`;
if (rect(bar()).width !== 430) return "the box is not what it should be";

// The menu holds what has gone, by group; a press works as it would on the bar.
await tap(more());
if (!opened("menu")) return "More did not open";
const inMenu = [...pane("menu").querySelectorAll("[data-menu-group]")].map((d) => d.dataset.menuGroup).join();
if (inMenu !== out().join()) return `the menu shows ${inMenu}, gone are ${out()}`;
if (tiedTo(pane("menu"), more())) return tiedTo(pane("menu"), more());
await tap(pane("menu").querySelector('[data-menu-tool="send"]'));
if (said() !== "send null") return `a press in the menu: ${said()}`;
if (opened("menu")) return "a plain press left the menu open";
await tap(more());
const outline = pane("menu").querySelector('[data-menu-tool="outline"]');
await tap(outline);
if (said() !== "outline true" || outline.getAttribute("aria-pressed") !== "true") return `a toggle in the menu: ${said()}`;
if (!opened("menu")) return "a toggle should leave the menu open";
await esc();
if (opened("menu")) return "Escape did not close the menu";

// Its popover, with its button gone, ties to More.
await tap(more());
await tap(pane("menu").querySelector('[data-menu-tool="zoom"]')); await settled();
if (opened("menu") || !opened("panel-zoom")) return "the menu did not hand over to the popover";
bad = tiedTo(pane("panel-zoom"), more()); if (bad) return `tied to More: ${bad}`;
await tap(pane("panel-zoom").querySelector('[data-option="150"]')); await settled();
if (said() !== "zoom 150") return `a choice: ${said()}`;
if (opened("panel-zoom")) return "a choice left it open";

// Back to full width: the toggle made in the menu shows on the bar.
await width(null);
if (!out().includes("view") && tool("outline").getAttribute("aria-pressed") !== "true") return "the bar does not show what the menu toggled";

// On the bar: toggles, a plain press, a popover tied to its button.
await tap(tool("bold"));
if (tool("bold").getAttribute("aria-pressed") !== "true" || said() !== "bold true") return `a toggle: ${said()}`;
await tap(tool("bold"));
if (tool("bold").getAttribute("aria-pressed") !== "false" || said() !== "bold false") return `a toggle off: ${said()}`;
await tap(tool("undo"));
if (said() !== "undo null") return `a plain press: ${said()}`;
await tap(tool("size")); await settled();
if (!opened("panel-size") || tool("size").getAttribute("aria-expanded") !== "true") return "Size did not open its popover";
bad = tiedTo(pane("panel-size"), tool("size")); if (bad) return bad;
if (pane("panel-size").dataset.side !== "bottom") return `it opened on the ${pane("panel-size").dataset.side}`;
// A second press on its own button closes it, and does not open it again.
await tap(tool("size")); await settled();
if (opened("panel-size")) return "a second press left it open";
if (tool("size").getAttribute("aria-expanded") !== "false") return "the button still says open";
await tap(tool("size")); await settled();
if (!opened("panel-size")) return "a third press did not open it";
// One popover gives way to another.
await tap(tool("colour")); await settled();
if (!opened("panel-colour")) return "Colour did not open, with Size open";
if (opened("panel-size")) return "two popovers are open";
bad = tiedTo(pane("panel-colour"), tool("colour")); if (bad) return bad;
await tap(pane("panel-colour").querySelector('[data-swatch="#18794e"]'));
if (said() !== "colour #18794e") return `a panel of the page's own: ${said()}`;
await esc();

// A turn with one open: it stays open and tied.
await tap(tool("size")); await settled();
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(450);
bad = fits(); if (bad) return `turned: ${bad}`;
if (!opened("panel-size")) return "the turn closed it";
bad = tiedTo(pane("panel-size"), tool("size")); if (bad) return `turned: ${bad}`;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(450);
await esc();

// The keys: Tab lands on one control, the arrows go along the bar.
const tabbable = () => [...bar().querySelectorAll(".ui-tablet-bar-row button")].filter((b) => b.tabIndex === 0);
if (tabbable().length !== 1) return `${tabbable().length} controls take a Tab`;
tool("undo").focus(); await wait(40);
key(tool("undo"), "ArrowRight"); await wait(40);
if (document.activeElement !== tool("redo")) return "ArrowRight did not move along";
await wait(40);
if (tabbable()[0] !== tool("redo")) return "Tab does not come back to where it was";
key(tool("redo"), "Home"); await wait(40);
if (document.activeElement !== tool("undo")) return "Home did not reach the first";
key(tool("undo"), "End"); await wait(40);
if (document.activeElement !== more()) return "End did not reach More";
key(more(), "ArrowRight"); await wait(40);
if (document.activeElement !== tool("undo")) return "the arrows did not wrap";

// Customise: hide an item, and it is gone from the bar and the menu.
await tap(more());
await tap(pane("menu").querySelector("[data-customize]")); await settled();
if (!opened("custom") || opened("menu")) return "Customise did not open";
const check = (id) => pane("custom").querySelector(`[data-show="${id}"]`);
const rows = () => [...pane("custom").querySelectorAll("[data-custom-group]")];
const names = () => rows().map((r) => r.dataset.customGroup).join();
const save = () => JSON.parse(told());
if (names() !== "history,text,insert,view,share") return `Customise lists ${names()}`;
if (!check("redo").checked) return "a shown item is not ticked";
await tap(check("redo").closest("label"));
if (tool("redo")) return "a hidden item stayed on the bar";
if (save().hidden.join() !== "no-such-item,7,redo") return `on_customize: ${told()}`;
await tap(check("redo").closest("label"));
if (!tool("redo")) return "a shown item did not come back";
// The buttons reorder, and stop at the ends.
const up = (n) => rows().find((r) => r.dataset.customGroup === n).querySelector(`[aria-label^="Move"][aria-label$="up"]`);
const down = (n) => rows().find((r) => r.dataset.customGroup === n).querySelector(`[aria-label^="Move"][aria-label$="down"]`);
if (!up("history").disabled || !down("share").disabled) return "the ends should not move further";
await tap(down("history"));
if (names() !== "text,history,insert,view,share") return `Down: ${names()}`;
if (groups().join() !== "text,history,insert,view,share") return `the bar did not follow: ${groups()}`;
if (save().order.join() !== "text,history,insert,view,share") return `on_customize: ${told()}`;
await tap(up("history"));
if (names() !== "history,text,insert,view,share") return `Up: ${names()}`;

// The handle: short springs back, a row's length moves it, a flick moves one, cancelled stays.
const handle = (n) => rows().find((r) => r.dataset.customGroup === n).querySelector(".ui-tablet-bar-handle");
const row = (n) => rows().find((r) => r.dataset.customGroup === n);
await drag(handle("history"), 0, 20, 300); await settled(); await wait(200);
if (names() !== "history,text,insert,view,share") return `a short drag moved it: ${names()}`;
if (row("history").style.transform !== "") return `a short drag left ${row("history").style.transform}`;
const step = rect(row("text")).top - rect(row("history")).top;
await drag(handle("history"), 0, step * 1.1, 400); await settled();
if (names() !== "text,history,insert,view,share") return `a row's drag: ${names()}`;
await drag(handle("history"), 0, -60, 40); await settled();
if (names() !== "history,text,insert,view,share") return `a flick up: ${names()}`;
// Mid-drag a change of state leaves the row under the finger; then cancelled, nothing moved.
const hr = rect(handle("view")), hp = { x: hr.left + 20, y: hr.top + 20 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [hp] });
for (let n = 1; n <= 5; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: hp.x, y: hp.y - n * 12 }] }); await wait(16); }
await wait(80);
if (row("view").style.transform !== "translateY(-60px)") return `the row did not follow: ${row("view").style.transform}`;
check("print").click(); await wait(80);
if (row("view").style.transform !== "translateY(-60px)") return `a change of state moved the drag: ${row("view").style.transform}`;
if (!rows().includes(row("view"))) return "the row was made again";
check("print").click(); await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(300);
if (names() !== "history,text,insert,view,share" || row("view").style.transform !== "") return `a cancelled drag: ${names()}`;
// Keep a real change and come back: it is restored from `saved`.
await tap(up("share"));
await tap(check("bold").closest("label"));
const keptOrder = names();
if (keptOrder !== "history,text,insert,share,view") return `before leaving: ${keptOrder}`;
await esc();
$("#bar-demo-again").click(); await wait(400);
if (groups().join() !== keptOrder) return `coming back the bar is ${groups()}`;
if (tool("bold")) return "coming back a hidden item is shown";
// Reset.
await tap(more());
await tap(pane("menu").querySelector("[data-customize]")); await settled();
await tap(pane("custom").querySelector("[data-reset]"));
if (groups().join() !== "history,text,insert,view,share" || !tool("bold")) return `Reset gave ${groups()}`;
await esc();

// A phone: fewer on the bar, and popovers are sheets.
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(450);
bad = fits(); if (bad) return `on a phone: ${bad}`;
const inner = bar().querySelector(".ui-tablet-bar-measure");
if (rect(inner).width !== 0 || inner.scrollWidth <= 0) return "the measuring row takes up room, and could widen a page";
await tap(more());
const sheet = pane("menu");
if (sheet.dataset.side !== "sheet" || rect(sheet).width !== 390 || Math.abs(rect(sheet).bottom - 844) > 1) return `on a phone the menu is ${sheet.dataset.side}`;
await esc();
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(450);
bad = fits(); if (bad) return `back: ${bad}`;
