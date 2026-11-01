// mobile
const bar = $(".ui-apptabs-bar"), tabs = [...bar.querySelectorAll(".ui-apptabs-tab")];
const rail = device === "tablet";
const panel = (id) => $(`#app-tab-demo-panel-${id}`), tab = (id) => $(`#app-tab-demo-tab-${id}`);
const showing = () => [...$(".ui-apptabs").querySelectorAll(".ui-apptabs-panel")].filter((p) => getComputedStyle(p).visibility === "visible").map((p) => p.id.split("-").pop()).join();
const note = () => $(".demo-note").textContent;
if (tabs.length !== 4) return "tabs: " + tabs.length;
if (showing() !== "home") return "showing: " + showing();
if (tab("home").getAttribute("aria-selected") !== "true" || tab("inbox").getAttribute("aria-selected") !== "false") return "aria-selected";
if (bar.getAttribute("role") !== "tablist" || panel("home").getAttribute("role") !== "tabpanel") return "roles";
if (tab("home").getAttribute("aria-controls") !== panel("home").id) return "aria-controls";

// Badges: a count, a cap, a dot, and words for screen readers.
const badge = (id) => tab(id).querySelector(".ui-apptabs-badge");
if (badge("home")) return "a badge on home";
if (badge("inbox").textContent !== "3") return "inbox badge: " + badge("inbox").textContent;
if (badge("map").textContent !== "99+") return "map badge: " + badge("map").textContent;
if (badge("me").textContent !== "" || !badge("me").classList.contains("ui-apptabs-dot")) return "me badge";
if (tab("inbox").querySelector(".ui-sr").textContent !== ", 3 new") return "badge's words: " + tab("inbox").querySelector(".ui-sr").textContent;
if (tab("me").querySelector(".ui-sr").textContent !== ", new items") return "dot's words";
if (badge("map").getAttribute("aria-hidden") !== "true") return "the badge is read twice";

// Each screen is built when first opened.
if (panel("inbox").childElementCount !== 0 || panel("home").childElementCount === 0) return "screens built too early";

// Layout: a bar along the bottom on a phone, a rail down the side on a tablet.
const r = $(".ui-apptabs").getBoundingClientRect(), b = bar.getBoundingClientRect();
if (device === "phone") {
    if (Math.round(b.bottom) !== Math.round(r.bottom) || b.width !== r.width) return `not a bottom bar: ${b.bottom} ${b.width}`;
    if (panel("home").getBoundingClientRect().bottom > b.top) return "the screen goes under the bar";
} else {
    if (b.width !== 84 || b.left !== r.left || Math.round(b.height) !== Math.round(r.height)) return `not a rail: ${b.width}x${b.height} at ${b.left}`;
    if (panel("home").getBoundingClientRect().left !== b.right) return "the screen is not beside the rail";
    if (tab("inbox").getBoundingClientRect().top <= tab("home").getBoundingClientRect().bottom - 1) return "tabs not stacked";
}

// Each keeps its place, and what is typed.
panel("home").scrollTop = 500;
const homeInput = panel("home").querySelector("input");
homeInput.value = "typed here";
await tap(tab("inbox"));
if (showing() !== "inbox") return "tap on inbox: " + showing();
if (panel("inbox").childElementCount === 0) return "inbox not built";
if (!panel("home").hasAttribute("inert") || panel("inbox").hasAttribute("inert")) return "inert";
panel("inbox").scrollTop = 240;
await tap(tab("map"));
await tap(tab("home"));
if (panel("home").scrollTop !== 500) return "home's place: " + panel("home").scrollTop;
if (panel("home").querySelector("input") !== homeInput || homeInput.value !== "typed here") return "home's field";
await tap(tab("inbox"));
if (panel("inbox").scrollTop !== 240) return "inbox's place: " + panel("inbox").scrollTop;
if (!note().includes("Moved to: inbox map home inbox ;")) return note();

// A press on the tab showing goes to the top, and is not a move.
await tap(tab("inbox"));
await wait(700);
if (panel("inbox").scrollTop !== 0) return "a second press: " + panel("inbox").scrollTop;
if (!note().endsWith("pressed again 1")) return note();
if (!note().includes("Moved to: inbox map home inbox ;")) return "a second press moved: " + note();
if (panel("home").scrollTop !== 500) return "a second press moved another tab";

// A badge changes and the screen stays: same elements, same state.
const count = panel("inbox").querySelector(".ui-btn");
await tap(count);
if (count.textContent.trim() !== "Counted 1") return "counter: " + count.textContent;
const inboxScreen = panel("inbox").querySelector("[data-screen]");
const read = [...panel("inbox").querySelectorAll(".ui-btn")].find((x) => x.textContent.trim() === "Mark read");
await tap(read);
if (badge("inbox")) return "a badge of 0 still shows";
if (panel("inbox").querySelector("[data-screen]") !== inboxScreen) return "a badge remade the screen";
if (count.textContent.trim() !== "Counted 1" || !count.isConnected) return "a badge reset the screen's state";

// The keyboard's route: arrows, Home, End, moving the focus too, wrapping at the ends.
tab("inbox").focus();
key(tab("inbox"), "ArrowRight");
await wait(60);
if (showing() !== "map" || document.activeElement !== tab("map")) return "ArrowRight: " + showing();
key(tab("map"), "End");
await wait(60);
if (showing() !== "me") return "End";
key(tab("me"), "ArrowRight");
await wait(60);
if (showing() !== "home" || document.activeElement !== tab("home")) return "wrap: " + showing();
key(tab("home"), "ArrowLeft");
await wait(60);
if (showing() !== "me") return "wrap back";
if (tab("me").getAttribute("tabindex") !== "0" || tab("home").getAttribute("tabindex") !== "-1") return "roving tabindex";
key(tab("me"), "Home");
await wait(60);

// A keyboard that shrinks the page, as a web view that resizes does: real resize, real focus.
const w = innerWidth, h = innerHeight, input = panel("home").querySelector("input");
panel("home").scrollTop = 0;
const barShown = () => getComputedStyle(bar).display !== "none";
const size = (height) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height, deviceScaleFactor: 2, mobile: true });
await size(h - 300);
await wait(150);
if (!barShown()) return "a shorter page with no field in focus hid the bar";
input.focus();
await wait(150);
const hiddenByResize = !barShown(), left0 = panel("home").getBoundingClientRect().left;
await size(h);
await wait(150);
// A bar would ride on the keyboard; a rail is beside it, and going would move everything.
if (hiddenByResize === rail) return rail ? "the rail went for a keyboard" : "the bar stayed over a keyboard (page resized)";
if (rail && left0 !== 84) return "the screen moved for the keyboard: " + left0;
if (!barShown()) return "the bar did not come back when the keyboard went";

// One that shrinks only what is visible, as iOS and Chrome do. There is no keyboard here to
// raise, so visualViewport says what it would, and sends the event it would.
const vv = visualViewport, fake = (height, scale) => {
    Object.defineProperty(vv, "height", { configurable: true, get: () => height });
    Object.defineProperty(vv, "scale", { configurable: true, get: () => scale });
    vv.dispatchEvent(new Event("resize"));
};
fake(h - 320, 1);
await wait(60);
if (barShown() !== rail) return "over a keyboard (visible part), shown: " + barShown();
if (document.activeElement !== input) return "the field lost its focus";
fake(h - 60, 1);
await wait(60);
if (!barShown()) return "a browser's bar counted as a keyboard";
// Zoomed in, what is visible shrinks too, and that is no keyboard.
fake(h / 2, 2);
await wait(60);
if (!barShown()) return "zooming counted as a keyboard";
fake(h - 320, 1);
await wait(60);
if (barShown() !== rail) return "again";
input.blur();
await wait(60);
if (!barShown()) return "the bar did not come back on blur";
delete vv.height; delete vv.scale;

// Bad rows and a tab given twice are dropped, on the server and after.
const bad = $("#app-tab-demo-bad-tab-only");
if ($$(".ui-apptabs")[1].querySelectorAll(".ui-apptabs-tab").length !== 1 || bad.querySelector(".ui-apptabs-text").textContent.trim() !== "Only") return "bad rows: " + $$(".ui-apptabs")[1].textContent;
if ($("#app-tab-demo-bad-panel-only").textContent.trim() !== "Tab only") return "the bad list's screen";

// current: a change from outside moves there, and is not reported as someone's move.
const moved = note();
[...document.querySelectorAll(".g-stage button")].find((x) => x.textContent.trim() === "Open the map").click();
await wait(60);
if (showing() !== "map") return "current: " + showing();
if (note() !== moved) return "current was reported: " + note();
await tap(tab("home"));

// The safe area: the bar stands clear of the home indicator, a rail of the side.
document.querySelector("meta[name=viewport]").content += ", viewport-fit=cover";
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 44, right: 0, bottom: 34 } });
await wait(200);
const inset = getComputedStyle(bar).paddingBottom, inset2 = getComputedStyle(bar).paddingLeft;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } });
await wait(100);
if (inset !== "34px" || inset2 !== "44px") return `safe area: ${inset} ${inset2}`;

// Rotation: the same screen, in the same place.
panel("home").scrollTop = 300;
await tap(tab("home"));
await wait(700);
panel("home").scrollTop = 300;
await size(h);
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await wait(250);
const side = panel("home").scrollTop, shown = showing();
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await wait(250);
if (shown !== "home" || side < 250) return `rotation: ${shown} at ${side}`;
if (!barShown()) return "rotation hid the bar";
