// mobile
const [bar, one, bad] = $$(".ui-chipsbar");
if (!bar || !one || !bad) return "three bars were expected";
const chips = (b) => [...b.querySelectorAll(".ui-chipsbar-chip")];
const row = bar.querySelector(".ui-chipsbar-chips");
if (chips(bar).length !== 9) return `expected 9 chips, found ${chips(bar).length}`;
const count = () => bar.querySelector(".ui-chipsbar-count")?.textContent;
const wanted = () => $("[data-wanted]").textContent;
if (count() !== "8 places") return `the count starts at ${count()}`;
if (chips(bar)[8].disabled !== true || chips(bar)[8].querySelector("small").textContent !== "0") return "a chip with no results is not disabled";
if (bar.querySelector(".ui-chipsbar-clear")) return "Clear shows with nothing on";
const scroller = $("[data-scroller]");
const inView = (c) => { const a = c.getBoundingClientRect(), b = row.getBoundingClientRect(); return a.left >= b.left - 0.5 && a.right <= b.right + 0.5; };
const settle = async () => { let was = -1; for (let i = 0; i < 40; i++) { await wait(50); if (row.scrollLeft === was) break; was = row.scrollLeft; } await wait(120); };

if (device === "phone") {
    if (row.scrollWidth <= row.clientWidth + 20) return "on a phone the chips should overflow";
    if (row.dataset.fade !== "right") return `at the start the row fades ${row.dataset.fade}`;
    // A real finger along the row scrolls it, and the page not at all.
    const pageX = scrollX;
    await drag(row, -180, 0, 300); await settle();
    if (row.scrollLeft < 120) return `a drag moved the row ${row.scrollLeft}`;
    if (scrollX !== pageX) return "dragging the chips moved the page";
    if (row.dataset.fade !== "both") return `in the middle the row fades ${row.dataset.fade}`;
    // A chip half out of view, pressed, comes fully into view.
    const part = chips(bar)[4];
    row.scrollLeft = part.offsetLeft + part.offsetWidth / 2 - row.clientWidth; await settle();
    const edge = row.getBoundingClientRect(), half = part.getBoundingClientRect();
    if (half.right <= edge.right || half.left >= edge.right) return "the chip does not stand half out of view";
    // tap() would scroll it into view itself, so the finger comes down on the part showing.
    const spot = { x: edge.right - 8, y: half.top + half.height / 2 };
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [spot] });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await wait(); await settle();
    if (part.getAttribute("aria-pressed") !== "true") return "a tap did not turn the chip on";
    if (!inView(part)) return `the pressed chip is not fully in view: ${JSON.stringify(part.getBoundingClientRect())} in ${JSON.stringify(row.getBoundingClientRect())}`;
    // The last one: as far as the row goes, which the arithmetic must not pass.
    await tap(bar.querySelector(".ui-chipsbar-clear")); await settle();
    await tap(chips(bar)[0]); await settle();
    if (row.scrollLeft !== 0 && !inView(chips(bar)[0])) return "the first chip did not come back";
    await tap(bar.querySelector(".ui-chipsbar-clear"));
    row.scrollLeft = 0; await settle();
    // Turned sideways, with the chip kept in view and what is on kept on.
    await tap(chips(bar)[5]); await settle();
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true });
    await wait(400);
    if (chips(bar)[5].getAttribute("aria-pressed") !== "true") return "turning the phone lost the chip";
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await wait(400); await settle();
    if (!inView(chips(bar)[5])) return "after turning the phone, the chip is out of view";
    if (wanted() !== "booking") return `wanted is ${wanted()}`;
    await tap(bar.querySelector(".ui-chipsbar-clear")); await settle();
    row.scrollLeft = 0; await settle();
}

// Known answers: Open now is 5 places, with Under 15 it is 2, and they stay in the chips' order.
await tap(chips(bar)[4]); await settle();
if (count() !== "3 places" || wanted() !== "cheap") return `Under 15 gave ${count()} ${wanted()}`;
await tap(chips(bar)[0]); await settle();
if (count() !== "2 places") return `Open now and Under 15 gave ${count()}`;
if (wanted() !== "open,cheap") return `the order is ${wanted()}`;
if ($$("[data-place]").length !== 2) return "the demo list did not follow";
// Second tap turns it off.
await tap(chips(bar)[4]); await settle();
if (wanted() !== "open" || chips(bar)[4].getAttribute("aria-pressed") !== "false") return `a second tap left ${wanted()}`;
// The singular.
await tap(chips(bar)[2]); await settle();
await tap(chips(bar)[1]); await settle();
if (count() !== "1 place") return `one place reads ${count()}`;
// Clear.
const clear = bar.querySelector(".ui-chipsbar-clear");
if (!clear) return "no Clear with chips on";
const clears = Number($("[data-cleared]").textContent);
await tap(clear); await settle();
if (wanted() !== "" || count() !== "8 places" || $("[data-cleared]").textContent !== String(clears + 1)) return `after Clear: ${wanted()} ${count()} ${$("[data-cleared]").textContent}`;
if (chips(bar).some((c) => c.getAttribute("aria-pressed") === "true")) return "a chip stayed on after Clear";
if (bar.querySelector(".ui-chipsbar-clear")) return "Clear stayed with nothing on";

// It stays under the header as the list scrolls, under a real finger.
const body = $$("[data-place]")[3];
scroller.scrollTop = 0;
await drag(body, 0, -260, 300); await wait(300);
if (scroller.scrollTop < 100) return `the list scrolled ${scroller.scrollTop}`;
const head = $("[data-head]").getBoundingClientRect(), b = bar.getBoundingClientRect();
if (Math.abs(b.top - head.bottom) > 1) return `the bar stands at ${b.top}, the header ends at ${head.bottom}`;
scroller.scrollTop = 0;

// One at a time: pressing another replaces it, and pressing it again turns it off.
const ones = chips(one);
if (ones.map((c) => c.getAttribute("aria-pressed")).join() !== "false,true,false,false") return "active did not start on Week";
await tap(ones[2]);
if (ones.map((c) => c.getAttribute("aria-pressed")).join() !== "false,false,true,false" || $("[data-picked]").textContent !== "Month") return "single choice did not replace";
await tap(ones[2]);
if ($("[data-picked]").textContent !== "All") return "the single chip did not turn off";
if (one.querySelector(".ui-chipsbar-count")) return "no results were given, and a count shows";
// Keys go along the chips, passing over what is disabled, and Enter presses.
ones[0].focus();
const press = (k) => { const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); document.activeElement.dispatchEvent(e); return e.defaultPrevented; };
if (!press("ArrowRight") || document.activeElement !== ones[1]) return "ArrowRight did not move";
press("End");
if (document.activeElement !== ones[3]) return "End did not go to the last";
press("Home");
if (document.activeElement !== ones[0]) return "Home did not go to the first";
press("ArrowLeft");
if (document.activeElement !== ones[0]) return "ArrowLeft went past the first";
// Bad input: nothing that cannot be shown, ids that are numbers, a duplicate gone, a count that is not one.
const left = chips(bad).map((c) => c.firstChild.textContent);
if (left.join() !== "Plain,Seven,Off") return `bad chips left ${left.join()}`;
if (chips(bad)[1].getAttribute("aria-pressed") !== "true") return "an id that is a number was not found";
if (!chips(bad)[2].disabled) return "the disabled chip can be pressed";
if (bad.querySelector(".ui-chipsbar-count")) return `a count shows for "many"`;
chips(bad)[0].focus();
press("End");
if (document.activeElement !== chips(bad)[1]) return "keys landed on a disabled chip";

if (device === "tablet") {
    await wait(150);
    // A wide pane has no need to scroll: the chips wrap, each in view. (The frame is a phone's, so use the plain bar.)
    const r2 = one.querySelector(".ui-chipsbar-chips");
    if (getComputedStyle(r2).flexWrap !== "wrap") return `a wide pane does not wrap: ${getComputedStyle(r2).flexWrap}`;
    if (r2.dataset.fade) return "a wrapping row has fading edges";
}
