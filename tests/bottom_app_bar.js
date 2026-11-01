// mobile
const box = $(".ui-bottombar"), bar = $(".ui-bottombar-bar"), fab = $(".ui-bottombar-fab"), scroller = $(".ui-bottombar-scroll");
const hidden = () => box.classList.contains("ui-bottombar-hidden");
const r = box.getBoundingClientRect();
const last = () => /Last: (.+)/.exec($(".demo-note").textContent)[1];
const at = async (y) => { scroller.scrollTop = y; await wait(60); };
const actions = $$(".ui-bottombar-action");
if (actions.length !== 3) return "actions: " + actions.length;
if (actions[2].getAttribute("aria-label") !== "Inbox, 4") return "badge's name: " + actions[2].getAttribute("aria-label");
if ($(".ui-bottombar-badge").textContent !== "4") return "badge";
if (Math.round(bar.getBoundingClientRect().bottom) !== Math.round(r.bottom) && device === "phone") return "not at the bottom";

if (device === "phone") {
    // The notch: the floating button sits half over the bar's top edge, in a hole cut for it.
    const b = bar.getBoundingClientRect(), f = fab.getBoundingClientRect();
    if (Math.round(f.top + f.height / 2) !== Math.round(b.top)) return `fab's middle ${f.top + f.height / 2}, bar's top ${b.top}`;
    if (Math.round(r.right - (f.left + f.width / 2)) !== 52) return "the notch is not over the fab: " + (r.right - (f.left + f.width / 2));
    const m = getComputedStyle($(".ui-bottombar-shape"));
    if (!/radial-gradient/.test(m.maskImage ?? m.webkitMaskImage)) return "no notch: " + m.maskImage;
    // Actions stay clear of it.
    if (actions[2].getBoundingClientRect().right > f.left) return "an action under the fab";
} else {
    // On a tablet a floating toolbar in the middle, not a bar across.
    const b = bar.getBoundingClientRect();
    if (b.width > r.width * 0.8) return "a tablet's bar is " + b.width + " wide";
    if (Math.abs((b.left + b.right) / 2 - (r.left + r.right) / 2) > 1) return "not in the middle";
    if (r.bottom - b.bottom < 16) return "not floating: " + (r.bottom - b.bottom);
    if (getComputedStyle($(".ui-bottombar-shape")).maskImage !== "none") return "a notch on a tablet";
    if (getComputedStyle($(".ui-bottombar-shape")).borderRadius === "0px") return "not a pill";
    const f = fab.getBoundingClientRect();
    if (f.left < b.right) return "the fab is on the toolbar";
}

// Room to scroll clear: the last row ends above the bar.
scroller.scrollTop = scroller.scrollHeight;
await wait(80);
const rows = scroller.querySelectorAll("p");
if (rows[rows.length - 1].getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 8) return "the last row stays under the bar";
// And at the end the bar shows, whichever way it got there.
if (hidden()) return "hidden at the end";
await at(0);

// A real finger scrolling down hides it; the floating button stays on the screen.
const mid = { x: r.left + 60, y: r.top + r.height / 2 };
await fingers("touchStart", [mid]);
for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: mid.x, y: mid.y - 25 * i }]); await wait(16); }
await wait(320);
if (scroller.scrollTop < 200) return "the finger did not scroll: " + scroller.scrollTop;
if (!hidden()) return "scrolling down did not hide it";
if (bar.getBoundingClientRect().top < r.bottom - 1) return "hidden but on the screen: " + bar.getBoundingClientRect().top;
const f2 = fab.getBoundingClientRect();
if (f2.bottom > r.bottom || f2.top < r.top) return "the floating button went";
if (device === "phone" && Math.round(r.bottom - f2.bottom) !== 16) return "the sunken fab: " + (r.bottom - f2.bottom);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: mid.x, y: mid.y - 300 + 15 * i }]); await wait(16); }
await wait(320);
await fingers("touchEnd", []);
await wait(100);
if (hidden()) return "scrolling up did not bring it back";

// The focus brings it back, and a tap does what it says.
await at(500);
await at(800);
if (!hidden()) return "not hidden at 800";
actions[1].focus();
await wait(260);
if (hidden()) return "the focus did not bring it back";
await tap(actions[1]);
if (last() !== "search") return "action: " + last();
await tap(fab);
if (last() !== "new note") return "fab: " + last();
if (scroller.querySelector("p").textContent !== "Note 53") return "the fab's work: " + scroller.querySelector("p").textContent;
await at(0);

// iOS's bounce past the end does not hide it.
await at(scroller.scrollHeight);
if (hidden()) return "the end";

// Safe area: the bar stands clear of the home indicator, by what the system says.
document.querySelector("meta[name=viewport]").content += ", viewport-fit=cover";
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 34 } });
await wait(300);
const plain = device === "phone";
const bh = bar.offsetHeight, pad = getComputedStyle(bar).paddingBottom, room = getComputedStyle(scroller).paddingBottom;
const gapBelow = box.getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } });
await wait(300);
if (plain && (bh !== 98 || pad !== "34px")) return `with a home indicator: ${bh} tall, padding ${pad}`;
if (!plain && gapBelow !== 50) return "a tablet's toolbar over the home indicator: " + gapBelow;
if (room !== "146px") return "the scroller's room: " + room;

// The button in the middle: the notch follows, and the actions go each side of it.
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Move the button").click();
await wait(300);
if (device === "phone") {
    const f = fab.getBoundingClientRect(), mid2 = (r.left + r.right) / 2;
    if (Math.abs(f.left + f.width / 2 - mid2) > 1) return "the middle's fab: " + (f.left + f.width / 2);
    if (!box.classList.contains("ui-bottombar-notch-center")) return "the middle's notch";
    const a = $$(".ui-bottombar-action").map((e) => e.getBoundingClientRect());
    if (a[1].right > f.left || a[2].left < f.right) return "actions under the middle's fab";
} else if (fab.getBoundingClientRect().left < bar.getBoundingClientRect().right) return "the fab on the toolbar";
