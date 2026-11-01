// mobile
const rootEl = $("#selmode-demo");
const rows = () => [...rootEl.querySelectorAll(".ui-selmode-row")];
const row = (id) => rootEl.querySelector(`[data-id="${id}"]`);
const head = () => rootEl.querySelector(".ui-selmode-head").textContent;
const v = (k) => $(`[data-${k}]`).textContent;
const modeBtn = () => rootEl.querySelector(".ui-selmode-mode");
const picking = () => rootEl.classList.contains("ui-selmode-on");
const hist0 = history.length;
if (rows().length !== 12) return `expected 12 rows, found ${rows().length}`;
if (head() !== "Inbox" || modeBtn().textContent !== "Select") return `the top bar reads ${head()} / ${modeBtn().textContent}`;
if (rootEl.querySelector(".ui-selmode-acts")) return "the toolbar shows before selecting";
// A short tap opens, and starts nothing.
await tap(row(3));
if (v("opened") !== "3" || picking()) return `a tap gave ${v("opened")}, mode ${picking()}`;
// A press too short: nothing. Real fingers held for 200 ms.
await hold(row(2), 200);
if (picking()) return "a short press started selecting";
if (v("opened") !== "2" && v("opened") !== "3") return `a short press gave ${v("opened")}`;
// A press that wanders ends: past 10 px the row stops being pressed, though the finger stays.
const r1 = row(1).getBoundingClientRect(), p1 = { x: r1.left + 80, y: r1.top + 20 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p1] });
await wait(80);
if (!row(1).classList.contains("ui-selmode-press")) return "a press does not show";
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p1.x + 26, y: p1.y }] });
await wait(600);
if (row(1).classList.contains("ui-selmode-press") || picking()) return "a press that moved went on";
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait();
if (picking()) return "a moved press started selecting at the end";
// A scroll started on a row is a scroll.
const list = rootEl.querySelector(".ui-selmode-list");
await drag(row(4), 0, -140, 200); await wait(200);
if (list.scrollTop < 40) return `a drag scrolled ${list.scrollTop}`;
if (picking()) return "a scroll started selecting";
list.scrollTop = 0; await wait(80);
// A cancelled press: the system takes it, and nothing starts.
const r2 = row(2).getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r2.left + 80, y: r2.top + 20 }] });
await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(650);
if (picking() || row(2).classList.contains("ui-selmode-press")) return "a cancelled press went on";
// The long press, with a haptic through the app's stand-in.
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); } };
const mark = v("opened");
await hold(row(3), 650);
delete window.quilloNative;
if (!picking()) return "a long press did not start selecting";
if (v("mode") !== "on" || v("ids") !== "3" || head() !== "1 selected") return `the long press gave ${v("mode")} ${v("ids")} ${head()}`;
if (felt.join() !== "medium") return `the haptic was ${felt.join()}`;
if (v("opened") !== mark) return "the long press also opened the row";
if (row(3).getAttribute("aria-pressed") !== "true" || row(1).getAttribute("aria-pressed") !== "false") return "aria-pressed is wrong";
if (getComputedStyle(row(3)).webkitUserSelect !== "none") return "text can be selected while selecting";
// The status for screen readers, and the toolbar.
if (rootEl.querySelector("[role=status]").textContent !== "1 selected") return "the status is wrong";
const acts = () => [...rootEl.querySelectorAll(".ui-selmode-act")];
if (acts().map((a) => a.textContent).join() !== "Archive,Delete") return "the actions are wrong";
// Tap adds, tap removes, and the order is the list's, whatever order they came in.
await tap(row(1));
await tap(row(7));
if (head() !== "3 selected" || v("ids") !== "1,3,7") return `after two tags: ${head()} ${v("ids")}`;
await tap(row(3));
if (head() !== "2 selected" || v("ids") !== "1,7") return `after taking one off: ${head()} ${v("ids")}`;
if (v("opened") !== mark) return "a tap while selecting opened a row";
// A disabled row cannot be taken, and Select all leaves it out.
const all = [...rootEl.querySelectorAll(".ui-selmode-top .ui-selmode-btn")].find((b) => /Select/.test(b.textContent));
await tap(all);
if (head() !== "11 selected" || v("ids").split(",").includes("5")) return `Select all gave ${head()} ${v("ids")}`;
if (all.textContent !== "Select none") return "Select all does not turn to Select none";
await tap(all);
if (head() !== "Select items" || v("ids") !== "") return `Select none gave ${head()} ${v("ids")}`;
if (!picking()) return "Select none left the mode";
if (!acts().every((a) => a.disabled)) return "the actions work with nothing chosen";
// The browser's real Back leaves the mode and stays on the page.
await tap(row(2));
const nav = await cdp("Page.getNavigationHistory");
const url0 = location.href;
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await wait(400);
if (picking() || v("mode") !== "off") return "Back did not leave the mode";
if (location.href !== url0) return "Back left the page";
if (rows().some((r) => r.hasAttribute("aria-pressed"))) return "rows stayed selectable after Back";
await tap(row(3));
if (v("opened") !== "3") return "after Back a tap does not open";
// Cancel leaves, and takes its history entry off again.
await hold(row(1), 650);
if (!picking()) return "the second long press did not start";
const n1 = (await cdp("Page.getNavigationHistory")).currentIndex;
await tap(modeBtn()); await wait(150);
if (picking()) return "Cancel did not leave";
const n2 = (await cdp("Page.getNavigationHistory")).currentIndex;
if (n2 !== n1 - 1) return `Cancel left the history at ${n2}, from ${n1}`;
// The keyboard route, through the Select button, Space, Control A and Escape.
modeBtn().focus();
modeBtn().click(); await wait(80);
if (!picking() || head() !== "Select items" || v("ids") !== "") return "the Select button did not start with nothing";
if (document.activeElement !== modeBtn()) return "focus left the button";
row(4).focus(); row(4).click(); await wait(60);
if (v("ids") !== "4") return "a keyboard press did not add";
const down = (el, k, o = {}) => { const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }); el.dispatchEvent(e); return e; };
if (!down(row(4), "a", { ctrlKey: true }).defaultPrevented) return "Control A did not take";
await wait(60);
if (head() !== "11 selected") return `Control A gave ${head()}`;
down(row(4), "Escape"); await wait(150);
if (picking()) return "Escape did not leave";
down(row(6), "ContextMenu"); await wait(120);
if (!picking() || v("ids") !== "6") return `the menu key gave ${v("ids")}`;
down(row(6), "Escape"); await wait(150);
down(row(6), "F10", { shiftKey: true }); await wait(120);
if (!picking() || v("ids") !== "6") return "Shift F10 did not start";
// An action gets the ids in the list's order, and ends the mode. Delete takes them off.
await tap(row(2));
await tap(acts()[1]); await wait(200);
if (v("log") !== "delete:2,6") return `Delete gave ${v("log")}`;
if (picking() || rows().length !== 10 || row(2) || row(6)) return "Delete left the rows or the mode";
await hold(row(1), 650);
await tap(row(3));
await tap(acts()[0]); await wait(200);
if (v("log") !== "archive:1,3" || picking()) return `Archive gave ${v("log")}`;
if (rows().length !== 10) return "Archive took rows off";
// A long press brings the toolbar up, maybe under the finger: the click that ends that press is no press on it.
const r9 = row(1).getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r9.left + 80, y: r9.top + 20 }] });
await wait(620);
if (!picking()) return "the held press did not start";
const logWas = v("log");
acts()[1].click(); await wait(120);
if (v("log") !== logWas || !picking()) return `a click during the press acted: ${v("log")}`;
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(120);
// (Chrome ends this press with its own click on the row too, which the made-up click has used the guard up for.)
if (v("ids") !== "1") await tap(row(1));
// The next press is a press.
await tap(acts()[0]); await wait(200);
if (v("log") !== "archive:1" || picking()) return `the next press gave ${v("log")}`;
// on_action comes once the history entry is gone, so what it does to the address stays.
await hold(row(1), 650);
const hist = (await cdp("Page.getNavigationHistory")).currentIndex;
await tap(acts()[0]); await wait(200);
if ((await cdp("Page.getNavigationHistory")).currentIndex !== hist - 1) return "an action left its history entry";
// Bad input, and the empty list.
const none = $("#selmode-none");
if (none.querySelector(".ui-selmode-empty").textContent !== "No mail") return "the empty text is wrong";
if (!none.querySelector(".ui-selmode-mode").disabled) return "Select works on nothing";
// Turning the device keeps the mode and what is chosen; a phone keeps the toolbar at the bottom, a wide pane on top.
await hold(row(1), 650);
await tap(row(3));
const size = device === "phone" ? [390, 844] : [820, 1180];
await cdp("Emulation.setDeviceMetricsOverride", { width: size[1], height: size[0], deviceScaleFactor: 2, mobile: true });
await wait(300);
await cdp("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 2, mobile: true });
await wait(300);
if (!picking() || v("ids") !== "1,3") return "turning the device lost the selection";
const bar = rootEl.querySelector(".ui-selmode-acts").getBoundingClientRect(), box = rootEl.getBoundingClientRect();
if (device === "phone" && Math.abs(bar.bottom - box.bottom) > 2) return `the toolbar ends at ${bar.bottom}, the frame at ${box.bottom}`;
if (device === "tablet") {
    await wait(200);
    const t = rootEl.querySelector(".ui-selmode-top").getBoundingClientRect(), a = rootEl.querySelector(".ui-selmode-acts").getBoundingClientRect();
    if (a.top > t.bottom || a.left < t.right - 1) return `in a wide pane the actions stand at ${a.top}, ${a.left}; the top bar ends at ${t.bottom}, ${t.right}`;
    await wait(100);
}
await tap(modeBtn()); await wait(150);
