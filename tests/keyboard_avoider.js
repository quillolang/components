// mobile
const scroll = $("#keyboard-avoider-demo-scroll"), avoider = $("#keyboard-avoider-demo"), status = $("#keyboard-avoider-demo-status");
const f = (n) => $(`#keyboard-avoider-demo-f${n}`), note = $("#keyboard-avoider-demo-note");
const changes = () => +status.dataset.changes;
const W = innerWidth, H = innerHeight;
const blur = async () => { document.activeElement?.blur?.(); await wait(60); };

// First the Android app's way, for real: the window itself gets shorter, so innerHeight and the
// visual viewport both shrink, and nothing is faked here.
const android = async (keyboard) => { await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H - keyboard, deviceScaleFactor: 2, mobile: true }); await wait(250); };
const lowest = f(9);
const gapBelow = (el) => scroll.getBoundingClientRect().bottom - el.getBoundingClientRect().bottom;
scroll.scrollTop = 0; await wait(60);
// A field near the end, tapped for real, with the keyboard then coming.
scroll.scrollTop = 500; await wait(60);
const startTop = scroll.scrollTop;
await tap(f(7)); await wait(60);
if (document.activeElement !== f(7)) return "a tap does not focus the field";
await android(330);
if (innerHeight !== H - 330) return `the window did not shrink: ${innerHeight}`;
if (status.textContent.trim() !== "Keyboard up: 330 px") return `Android, the height: ${status.textContent}`;
if (avoider.style.paddingBottom !== "") return `Android needs no room: ${avoider.style.paddingBottom}`;
if (getComputedStyle(avoider).getPropertyValue("--ui-keyboard-height") !== "330px") return "--ui-keyboard-height, Android";
const r7 = f(7).getBoundingClientRect();
if (r7.bottom > innerHeight - 16 + 1 || r7.top < 0) return `Android: the field is at ${r7.top}-${r7.bottom} in ${innerHeight}`;
await android(0);
if (status.textContent.includes("Keyboard up")) return "Android, closed: " + status.textContent;
if (Math.abs(scroll.scrollTop - startTop) > 2) return `Android: handed back to ${scroll.scrollTop}, not ${startTop}`;
await blur();

// Now iOS, on a stand-in: the layout stays and only the visual viewport shrinks, which headless
// Chrome cannot do by itself. Then the last field has nothing under it to scroll to.
const real = window.visualViewport, vv = new EventTarget();
Object.assign(vv, { height: innerHeight, offsetTop: 0, width: innerWidth, scale: 1 });
Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
const keyboard = async (h, top = 0) => { vv.height = innerHeight - h - top; vv.offsetTop = top; vv.dispatchEvent(new Event("resize")); await wait(60); };
try {
    scroll.scrollTop = 0; await wait(60);
    const end = scroll.scrollHeight - scroll.clientHeight;
    // The note at the very end of the form: tall, and with no room under it.
    scroll.scrollTop = end; await wait(60);
    const was = scroll.scrollTop;
    const check = $("#keyboard-avoider-demo-box"), last = f(9);
    last.scrollIntoView({ block: "center" }); await wait(60);
    const at = scroll.scrollTop;
    await tap(last); await wait(60);
    const n0 = changes();
    await keyboard(336);
    if (avoider.style.paddingBottom !== "336px") return `iOS: the room is ${avoider.style.paddingBottom}`;
    if (status.textContent.trim() !== "Keyboard up: 336 px") return `iOS, the height: ${status.textContent}`;
    if (changes() !== n0 + 1) return `one change for one keyboard: ${changes() - n0}`;
    const visibleEnd = () => vv.offsetTop + vv.height;
    const rl = last.getBoundingClientRect();
    if (rl.bottom > visibleEnd() - 16 + 1) return `iOS: the field ends at ${rl.bottom}, the keyboard at ${visibleEnd()}`;
    if (rl.bottom < visibleEnd() - 16 - 1 && at + 0 !== scroll.scrollTop) return `iOS: moved further than needed: ${rl.bottom} and ${visibleEnd() - 16}`;
    // Field to field: a field already clear does not move the page, one under the keyboard does.
    const before = scroll.scrollTop;
    const above = [...$$("input")].filter((i) => { const r = i.getBoundingClientRect(); return r.top > 60 && r.bottom < visibleEnd() - 30; })[0];
    above.focus({ preventScroll: true }); await wait(60);
    if (scroll.scrollTop !== before) return "a field in view moved the page";
    note.focus({ preventScroll: true }); await wait(60);
    const rn = note.getBoundingClientRect(), roomTop = scroll.getBoundingClientRect().top + 16;
    // The note is tall: with a low view it shows its start, else its end.
    if (rn.height > visibleEnd() - 16 - roomTop) { if (Math.abs(rn.top - roomTop) > 1.5) return `a tall field shows its start: ${rn.top}, ${roomTop}`; }
    else if (rn.bottom > visibleEnd() - 16 + 1) return `the note ends at ${rn.bottom}`;
    // iOS moves the visual viewport as well.
    last.focus({ preventScroll: true }); await wait(60);
    await keyboard(336, 80);
    const rl2 = last.getBoundingClientRect();
    if (rl2.bottom > visibleEnd() - 16 + 1 || rl2.top < 80 + 16 - 1) return `panned: ${rl2.top}-${rl2.bottom}, the view ${vv.offsetTop}-${visibleEnd()}`;
    if (avoider.style.paddingBottom !== "336px") return `panned, the room: ${avoider.style.paddingBottom}`;
    await keyboard(336, 0);
    // A smaller keyboard: suggestions going, a new height, one more change.
    const n1 = changes();
    await keyboard(291);
    if (avoider.style.paddingBottom !== "291px" || changes() !== n1 + 1) return `a new height: ${avoider.style.paddingBottom}`;
    // Handing back: the room goes and the scroller returns, with the focus gone first.
    await blur();
    await keyboard(0);
    if (avoider.style.paddingBottom !== "") return `closed, the room: ${avoider.style.paddingBottom}`;
    if (getComputedStyle(avoider).getPropertyValue("--ui-keyboard-height") !== "") return "closed: --ui-keyboard-height stays";
    if (Math.abs(scroll.scrollTop - at) > 2) return `closed: at ${scroll.scrollTop}, it stood at ${at}`;
    if (!status.textContent.includes("tap a field")) return "closed, the status: " + status.textContent;

    // Scrolled by hand while open: left there.
    await tap(last); await wait(60);
    await keyboard(336);
    const moved = Math.max(0, scroll.scrollTop - 120);
    scroll.scrollTop = moved; await wait(60);
    await blur(); await keyboard(0);
    if (Math.abs(scroll.scrollTop - moved) > 2) return `scrolled by hand: moved back to ${scroll.scrollTop}, not ${moved}`;

    // Kept focus, with the keyboard dismissed by the system's own key, and opened again.
    scroll.scrollTop = at; await wait(60);
    await tap(last); await wait(60);
    await keyboard(336);
    await keyboard(0);
    if (avoider.style.paddingBottom !== "") return "dismissed: room stays";
    if (document.activeElement !== last) return "dismissing lost the focus";
    await keyboard(336);
    if (avoider.style.paddingBottom !== "336px") return "opened again in the same field: no room";
    await blur(); await keyboard(0);

    // A pinch shrinks the visual viewport, and is no keyboard.
    await tap(last); await wait(60);
    vv.scale = 2; vv.height = innerHeight / 2; vv.offsetTop = 100; vv.dispatchEvent(new Event("resize")); await wait(60);
    if (avoider.style.paddingBottom !== "") return `a pinch was taken for a keyboard: ${avoider.style.paddingBottom}`;
    vv.scale = 1; vv.height = innerHeight; vv.offsetTop = 0; vv.dispatchEvent(new Event("resize")); await wait(60);
    await blur();

    // What brings up no keyboard is not followed.
    const n2 = changes();
    const box = $("#keyboard-avoider-demo-box");
    box.focus({ preventScroll: true }); await wait(60);
    await keyboard(336);
    if (avoider.style.paddingBottom !== "" || changes() !== n2) return "a checkbox was treated as a field";
    await keyboard(0); await blur();
} finally {
    Object.defineProperty(window, "visualViewport", { value: real, configurable: true });
}

// Turning with the keyboard up, for real, in the Android app's way: the field stays in view,
// and closing afterwards still hands back.
scroll.scrollTop = 300; await wait(60);
const top0 = scroll.scrollTop;
await tap(f(6)); await wait(60);
await android(330);
if (!status.textContent.includes("330")) return "turning: the keyboard is not up";
await cdp("Emulation.setDeviceMetricsOverride", { width: H - 330 + 0, height: W - 150, deviceScaleFactor: 2, mobile: true }); await wait(300);
const rt = f(6).getBoundingClientRect();
if (rt.bottom > innerHeight - 16 + 1 || rt.top < 0) return `turned: the field is at ${rt.top}-${rt.bottom} in ${innerHeight}`;
if (document.activeElement !== f(6)) return "turned: the focus went";
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(300);
if (status.textContent.includes("Keyboard up")) return "turned back and closed: " + status.textContent;
await blur();
