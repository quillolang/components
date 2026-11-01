// mobile
const main = $("section.ui-balcard");
const view = main.querySelector(".ui-balcard-view"), track = main.querySelector(".ui-balcard-track");
const amts = () => [...main.querySelectorAll(".ui-balcard-amt")];
const cur = () => amts()[+track.style.getPropertyValue("--ui-balcard-at")];
const seen = () => $("#balcard-seen").textContent, told = () => $("#balcard-told").textContent;
const eye = main.querySelector(".ui-balcard-eye");
const next = main.querySelector('[aria-label="Next account"]'), prev = main.querySelector('[aria-label="Previous account"]');
// Exact amounts, in decimals; the updated-at from the prop, five minutes back.
if (amts()[0].textContent !== "$2,481.07") return "first balance: " + amts()[0].textContent;
if (amts()[1].textContent !== "$15,200.50") return "balance given as text: " + amts()[1].textContent;
if (amts()[2].textContent !== "€318.40") return "euros: " + amts()[2].textContent;
if (amts()[3].textContent !== "-$642.19" || !amts()[3].classList.contains("ui-balcard-neg")) return "a negative: " + amts()[3].textContent;
if (main.querySelector(".ui-balcard-title").textContent !== "Updated 5 min ago") return "updated: " + main.querySelector(".ui-balcard-title").textContent;
// Totals: 2481.07 + 15200.50 - 642.19 = 17039.38, exactly.
if (!/Total USD \$17,039\.38/.test(main.querySelector(".ui-balcard-totals").textContent)) return "totals: " + main.querySelector(".ui-balcard-totals").textContent;
if (!/Total EUR €318\.40/.test(main.querySelector(".ui-balcard-totals").textContent)) return "euro total";
// Bad data shows dashes and throws nothing; none at all says so.
const bad = $("#balcard-bad");
if (bad.querySelector(".ui-balcard-title").textContent !== "") return "a bad time says nothing";
if (bad.querySelector(".ui-balcard-amt").textContent !== "••••••") return "hidden from the start";
await tap(bad.querySelector(".ui-balcard-eye"));
if (bad.querySelector(".ui-balcard-amt").textContent !== "—") return "bad balance: " + bad.querySelector(".ui-balcard-amt").textContent;
if (!/No accounts/.test($("#balcard-none").textContent)) return "no accounts";
// A tap on the amount hides it, and the number leaves the page text.
await tap(amts()[0]);
if (cur().textContent !== "••••••" || told() !== "Hidden") return "tap hides: " + cur().textContent + " " + told();
if (/2,481/.test(main.textContent)) return "the number stays on the page while hidden";
if (eye.getAttribute("aria-pressed") !== "true") return "the eye says hidden";
// The stroke across the eye is made in the browser, and must be SVG to draw at all.
const slash = eye.querySelectorAll("path")[1];
if (slash?.namespaceURI !== "http://www.w3.org/2000/svg" || !(slash.getBBox().width > 10)) return "the slash on the eye: " + slash?.namespaceURI;
// A hold shows it while held and hides at the lift, with no toggle.
const r = cur().getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
const down = () => cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
const up = () => cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await down(); await wait(150);
if (cur().textContent !== "••••••") { await up(); return "too early to show"; }
await wait(450);
if (cur().textContent !== "$2,481.07") { await up(); return "a hold shows it: " + cur().textContent; }
await up(); await wait(150);
if (cur().textContent !== "••••••") return "lifting hides it: " + cur().textContent;
if (told() !== "Hidden") return "a hold changes nothing: " + told();
// A short press is a tap: it does show.
await down(); await wait(120); await up(); await wait(150);
if (cur().textContent !== "$2,481.07" || told() !== "Shown") return "a tap after a hold: " + cur().textContent + " " + told();
// The eye and keys do the same: Enter is a click.
await tap(eye);
if (cur().textContent !== "••••••") return "the eye hides";
cur().focus(); cur().click(); await wait(100);
if (cur().textContent !== "$2,481.07") return "a key's click shows";
// A hold that drifts is not a hold, and a cancel ends a peek.
await tap(eye);
await down(); await wait(100);
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y + 2 }] });
await wait(500);
if (cur().textContent !== "$2,481.07") { await up(); return "a little shake keeps the hold"; }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(120);
if (cur().textContent !== "••••••") return "a cancel hides again";
await tap(eye);
if (device === "phone") {
    const w = view.clientWidth;
    const at = () => +track.style.getPropertyValue("--ui-balcard-at");
    const home = () => getComputedStyle(track).transform;
    // A drag that falls short: 80 px in 390 and held still before the lift, so no flick.
    const v = view.getBoundingClientRect(), m = { x: v.left + v.width / 2, y: v.top + 60 };
    const f = (type, q) => cdp("Input.dispatchTouchEvent", { type, touchPoints: q ? [q] : [] });
    await f("touchStart", m);
    for (let i = 1; i <= 8; i++) { await f("touchMove", { x: m.x - i * 10, y: m.y }); await wait(16); }
    await wait(200);
    if (!/translateX\(-80px\)/.test(track.style.transform)) { await f("touchEnd"); return "it follows the finger: " + track.style.transform; }
    await f("touchEnd"); await wait(400);
    if (at() !== 0 || track.style.transform !== "") return "short and slow springs back: " + at();
    if (seen() !== "main") return "no change on a spring back";
    // Past the threshold.
    await drag(view, -w * 0.5, 0, 500); await wait(350);
    if (at() !== 1 || seen() !== "save") return "half way turns: " + at() + " " + seen();
    if (cur().textContent !== "$15,200.50") return "the second balance";
    // A flick: short and quick.
    await drag(view, -50, 0, 40); await wait(350);
    if (at() !== 2 || seen() !== "eur") return "a flick turns: " + at() + " " + seen();
    // Back the other way.
    await drag(view, w * 0.5, 0, 400); await wait(350);
    if (at() !== 1) return "back: " + at();
    // A vertical drag is the page's: no account changes.
    await drag(view, 0, -60, 200); await wait(350);
    if (at() !== 1) return "up and down turns nothing";
    // A drag that the system takes is cancelled and springs back.
    await f("touchStart", m);
    for (let i = 1; i <= 8; i++) { await f("touchMove", { x: m.x - i * 25, y: m.y }); await wait(16); }
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(400);
    if (at() !== 1 || track.style.transform !== "") return "a cancel springs back: " + at();
    // A swipe does not count as a tap on the amount under it.
    if (told() !== "Shown") return "a swipe toggled the amount: " + told();
    // Buttons and keys: the equal of a swipe.
    await tap(next); await wait(300);
    if (at() !== 2 || !/3 of 4: Euro wallet/.test($(".ui-balcard-where").textContent)) return "next: " + $(".ui-balcard-where").textContent;
    await tap(prev); await wait(300);
    if (at() !== 1) return "previous";
    view.focus();
    key(view, "ArrowRight"); await wait(300);
    key(view, "ArrowRight"); await wait(300);
    key(view, "ArrowRight"); await wait(300);
    if (at() !== 3 || !next.disabled) return "keys to the end: " + at();
    // At the far end it gives a little and stays.
    await drag(view, -w * 0.6, 0, 400); await wait(350);
    if (at() !== 3) return "past the end stays";
    // Only the shown card can be reached.
    if (!amts()[0].closest("article").inert || amts()[3].closest("article").inert) return "others are inert";
    // Turning the phone keeps the account.
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await wait(400);
    if (at() !== 3 || cur().textContent !== "-$642.19") return "rotation keeps the account";
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(400);
    if (at() !== 3) return "and back";
} else {
    // A tablet has them side by side, totals shown, nothing to page through, nothing inert.
    if (getComputedStyle(main.querySelector(".ui-balcard-nav")).display !== "none") return "no paging on a tablet";
    if (getComputedStyle(main.querySelector(".ui-balcard-totals")).display === "none") return "totals show on a tablet";
    const a = amts()[0].getBoundingClientRect(), b = amts()[1].getBoundingClientRect();
    if (!(b.left > a.right - 1) || Math.abs(a.top - b.top) > 2) return "side by side: " + a.left + " " + b.left;
    if (amts().some((x) => x.closest("article").inert)) return "all can be reached";
    await drag(view, -300, 0, 300); await wait(300);
    if (+track.style.getPropertyValue("--ui-balcard-at") !== 0) return "no swiping on a tablet";
    if (getComputedStyle(track).transform !== "none") return "no transform on a tablet";
}
