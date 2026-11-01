// mobile
const host = () => $("#phone-shell-demo");
const head = () => $(".ui-phone-shell-head"), scroll = () => $(".ui-phone-shell-scroll"), bar = () => $(".ui-phone-shell-tabs");
const tabs = () => $$(".ui-phone-shell-tab"), tab = (t) => tabs().find((b) => b.querySelector(".ui-phone-shell-text").firstChild.textContent === t);
const sub = () => $(".ui-phone-shell-words p").textContent;
const W = innerWidth, H = innerHeight;
const rect = (el) => el.getBoundingClientRect();
const rail = device === "tablet";
const resize = async (w, h) => { await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300); };
const pressed = () => tabs().filter((b) => b.getAttribute("aria-current") === "page").map((b) => b.querySelector(".ui-phone-shell-text").firstChild.textContent).join();
const settle = () => wait(160);

// One screen: the header on top, the bar or rail, the middle between, and nothing else scrolls.
const r = rect(host());
if (r.width !== W || r.height !== H || r.top !== 0) return `the frame: ${r.width}x${r.height} at ${r.top}`;
if (Math.round(rect(head()).top) !== 0) return "the header";
if (rail) {
    if (Math.round(rect(bar()).left) !== 0 || rect(bar()).height !== H || !(rect(bar()).right <= rect(scroll()).left)) return "a tablet's rail: " + JSON.stringify(rect(bar()));
    if (rect(bar()).width !== 97) return "the rail's width: " + rect(bar()).width;
} else {
    if (Math.round(rect(bar()).bottom) !== H || !(rect(scroll()).bottom <= rect(bar()).top + 0.5)) return "the bar: " + JSON.stringify(rect(bar()));
    if (Math.abs(rect(scroll()).top - rect(head()).bottom) > 1) return "the scroller's top";
}
if (!document.documentElement.classList.contains("ui-phone-shell-locked")) return "the page is not locked";
if (getComputedStyle(document.documentElement).overflowY !== "hidden" || getComputedStyle(document.body).overscrollBehaviorY !== "none") return "the page can bounce";
if (getComputedStyle(scroll()).overscrollBehaviorY !== "contain") return "the scroller chains";
if (getComputedStyle(host()).overscrollBehaviorY !== "none") return "the frame chains";

// Badges: a count, a cap, a dot; and words for screen readers.
const badge = (t) => tab(t).querySelector(".ui-phone-shell-badge");
if (badge("Inbox").textContent !== "3" || badge("Search").textContent !== "99+" || badge("You").textContent !== "" || !badge("You").classList.contains("ui-phone-shell-dot") || badge("Home")) return "badges";
if (tab("Inbox").querySelector(".ui-sr").textContent !== ", 3 new" || tab("You").querySelector(".ui-sr").textContent !== ", new items") return "badge words";
if (pressed() !== "Home") return "the current tab: " + pressed();

// A real finger scrolls the middle and only that.
const headTop = rect(head()).top, barTop = rect(bar()).top;
await drag(scroll(), 0, -300, 240); await settle();
const after = scroll().scrollTop;
if (after < 150) return `a finger scrolled ${after}`;
if (rect(head()).top !== headTop || rect(bar()).top !== barTop || document.scrollingElement.scrollTop !== 0) return "the frame moved";
if (!head().classList.contains("ui-phone-shell-scrolled")) return "the header's edge";
// A drag on the header moves nothing at all.
await drag($(".ui-phone-shell-words"), 0, 200, 240); await settle();
if (scroll().scrollTop !== after || document.scrollingElement.scrollTop !== 0) return "a drag on the header scrolled";

// Each tab keeps its own place, set exactly, on content drawn after the change.
scroll().scrollTop = 700; await settle();
await tap(tab("Inbox")); await settle();
if (pressed() !== "Inbox" || $(".ui-phone-shell-words h1").textContent !== "Inbox") return "Inbox: " + pressed();
if (scroll().scrollTop !== 0) return `a new tab starts at the top: ${scroll().scrollTop}`;
scroll().scrollTop = 333; await settle();
await tap(tab("Home")); await wait(300);
if (scroll().scrollTop !== 700) return `Home's place: ${scroll().scrollTop}`;
if (document.activeElement !== tab("Home") && document.activeElement.tagName !== "BODY") return "the focus left the tab";
await tap(tab("Inbox")); await wait(300);
if (scroll().scrollTop !== 333) return `Inbox's place: ${scroll().scrollTop}`;
// The tab you are on goes to the top, and says so.
await tap(tab("Inbox")); await wait(700);
if (scroll().scrollTop !== 0) return `to the top: ${scroll().scrollTop}`;
if (!sub().startsWith("1 times")) return "on_again: " + sub();
await tap(tab("Home")); await wait(300);

// A detail inside a tab has its own place, and Back finds the list's.
if (scroll().scrollTop !== 700) return `Home again: ${scroll().scrollTop}`;
const row = $$(".phone-shell-demo-row").find((b) => { const q = rect(b); return q.top > rect(scroll()).top + 20 && q.bottom < rect(scroll()).bottom - 20; });
const name = row.textContent;
if ($(".ui-phone-shell-back")) return "a back button at the top level";
await tap(row); await wait(300);
if (scroll().scrollTop !== 0 || !$(".ui-phone-shell-back")) return `the detail: ${scroll().scrollTop}`;
await tap($(".ui-phone-shell-back")); await wait(300);
if (scroll().scrollTop !== 700) return `Back: ${scroll().scrollTop}`;
if ($(".ui-phone-shell-back")) return "Back stays";

// Actions in the header work, and do not disturb a scroll.
await tap($("#phone-shell-demo-mark")); await settle();
if (!sub().endsWith("1 marks")) return "an action: " + sub();
if (scroll().scrollTop !== 700) return "an action moved the scroll";

// The safe areas, from the system itself.
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 0, right: 0, bottom: 34 } }); await settle();
const hs = getComputedStyle(head()), bs = getComputedStyle(bar());
if (hs.paddingTop !== "47px") return "the header's inset: " + hs.paddingTop;
if (!rail && bs.paddingBottom !== "34px") return "the bar's inset: " + bs.paddingBottom;
if (rail && bs.paddingTop !== "47px") return "the rail's inset: " + bs.paddingTop;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 59, right: 59, bottom: 21 } }); await settle();
if (getComputedStyle(head()).paddingRight !== "59px") return "the header's side: " + getComputedStyle(head()).paddingRight;
if (getComputedStyle(scroll()).paddingRight !== "59px") return "the content's side: " + getComputedStyle(scroll()).paddingRight;
if (!rail && getComputedStyle(scroll()).paddingLeft !== "59px") return "the content's left: " + getComputedStyle(scroll()).paddingLeft;
if (rail && getComputedStyle(bar()).paddingLeft !== "59px") return "the rail's left: " + getComputedStyle(bar()).paddingLeft;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } }); await settle();

// The keyboard, the Android app's way, for real: the window shrinks.
await tap(tab("Search")); await wait(300);
const field = (n) => $(`#phone-shell-demo-f${n}`);
scroll().scrollTop = 0; await settle();
await tap(field(5)); await settle();
if (document.activeElement !== field(5)) return "a field does not take the focus";
const barH = rect(bar()).height;
await resize(W, H - 300);
if (rect(host()).height !== H - 300) return `Android: the frame ${rect(host()).height}`;
if (!rail && getComputedStyle(bar()).display !== "none") return "Android: the bar stays over the keyboard";
if (rail && getComputedStyle(bar()).display === "none") return "a rail need not go";
if (!host().classList.contains("ui-phone-shell-typing")) return "Android: not typing";
if (host().style.height !== "" || host().style.bottom !== "") return "Android needs nothing set: " + host().style.cssText;
await resize(W, H);
if (host().classList.contains("ui-phone-shell-typing")) return "Android closed: still typing";
if (!rail && getComputedStyle(bar()).display === "none") return "Android closed: no bar";
document.activeElement.blur(); await settle();

// iOS, on a stand-in: the layout stays, the visual viewport shrinks and pans.
const real = window.visualViewport, vv = new EventTarget();
Object.assign(vv, { height: innerHeight, offsetTop: 0, width: innerWidth, scale: 1 });
Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
// Listeners were set on the real one at the start, so the shell is made again on the stand-in.
const leave = $("#phone-shell-demo-leave");
leave.click(); await settle();
try {
    if (document.documentElement.classList.contains("ui-phone-shell-locked")) return "leaving keeps the page locked";
    leave.click(); await wait(350);
    const keyboard = async (h, top = 0) => { vv.height = innerHeight - h - top; vv.offsetTop = top; vv.dispatchEvent(new Event("resize")); await settle(); };
    if (!document.documentElement.classList.contains("ui-phone-shell-locked")) return "back: not locked";
    await tap(tab("Search")); await wait(300);
    scroll().scrollTop = 0; await settle();
    const f12 = field(12);
    f12.scrollIntoView({ block: "end" }); await settle();
    f12.focus({ preventScroll: true }); await settle();
    await keyboard(336);
    if (rect(host()).height !== H - 336) return `iOS: the frame is ${rect(host()).height}, not ${H - 336}`;
    if (!rail && getComputedStyle(bar()).display !== "none") return "iOS: the bar stays";
    const rf = rect(f12);
    if (rf.bottom > H - 336 - 12 + 1 || rf.top < rect(scroll()).top) return `iOS: the field is at ${rf.top}-${rf.bottom}, the keyboard at ${H - 336}`;
    // A change of state while the keyboard is up leaves what was set by hand alone.
    $("#phone-shell-demo-mark").click(); await settle();
    if (!sub().endsWith("2 marks") && !sub().endsWith("1 marks")) return "mark: " + sub();
    if (host().style.height !== `${H - 336}px`) return "a state change undid the keyboard's height: " + host().style.cssText;
    // iOS pans the view: the header stays in sight.
    await keyboard(336, 80);
    if (Math.round(rect(host()).top) !== 80 || rect(host()).height !== H - 336 - 80) return `panned: ${rect(host()).top}, ${rect(host()).height}`;
    if (host().style.transform !== "translateY(80px)") return "panned: " + host().style.transform;
    $("#phone-shell-demo-mark").click(); await settle();
    if (host().style.transform !== "translateY(80px)") return "a state change undid the pan: " + host().style.transform;
    // A pinch is not a keyboard.
    await keyboard(0);
    vv.scale = 2; vv.height = innerHeight / 2; vv.offsetTop = 100; vv.dispatchEvent(new Event("resize")); await settle();
    if (host().style.height !== "" || host().classList.contains("ui-phone-shell-typing")) return "a pinch: " + host().style.cssText;
    vv.scale = 1; vv.height = innerHeight; vv.offsetTop = 0; vv.dispatchEvent(new Event("resize")); await settle();
    // Gone: everything set by hand goes with it.
    await keyboard(336); await keyboard(0);
    if (host().style.cssText !== "") return "closed: " + host().style.cssText;
    if (rect(host()).height !== H) return "closed: the height";
    f12.blur();
} finally {
    Object.defineProperty(window, "visualViewport", { value: real, configurable: true });
}
leave.click(); await settle(); leave.click(); await wait(350);

// Turning keeps what is typed, the focus and the scroll, and gives a rail where there is room.
await tap(tab("Search")); await wait(300);
const typed = field(3);
typed.focus({ preventScroll: true }); document.execCommand("insertText", false, "kept"); await settle();
scroll().scrollTop = 120; await settle();
const top = scroll().scrollTop;
await resize(H, W);
if (field(3) !== typed || typed.value !== "kept" || document.activeElement !== typed) return "turned: the field";
if (rect(host()).width !== H) return "turned: the frame";
if (H >= 700 ? !(rect(bar()).right <= rect(scroll()).left) : false) return "turned: a rail where there is room";
await resize(W, H);
if (scroll().scrollTop !== top) return `turned and back, the scroll: ${scroll().scrollTop}, not ${top}`;
typed.blur(); await settle();
if (typed.value !== "kept") return "turned back: the field";

// In a frame of a page it leaves the page alone: the frame is smaller than the window.
$("#phone-shell-demo-leave").click(); await settle();
const frame = $("#phone-shell-demo-frame");
frame.style.height = "500px"; frame.style.width = "300px";
$("#phone-shell-demo-leave").click(); await wait(350);
if (document.documentElement.classList.contains("ui-phone-shell-locked")) return "a shell in a frame locked the page";
if (rect(host()).height !== 500 || rect(host()).width !== 300) return "held to the frame: " + rect(host()).height;
