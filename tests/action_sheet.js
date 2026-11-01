// mobile
const dlg = $("dialog.ui-action-sheet");
const trig = $$("button.ui-btn").find((b) => b.textContent === "Photo options");
const did = () => $(".action-sheet-demo-did").textContent;
const closes = () => +$(".action-sheet-demo-closes").textContent;
const rows = () => [...dlg.querySelectorAll(".ui-action-sheet-row")];
const settle = () => wait(380);
// A flick: a finger gone in two moves, whatever the machine's load does to the timing.
const flick = async (el, dy) => {
    const p = middle(el);
    await fingers("touchStart", [p]);
    await fingers("touchMove", [{ x: p.x, y: p.y + Math.sign(dy) * 8 }]);
    await fingers("touchMove", [{ x: p.x, y: p.y + dy }]);
    await fingers("touchEnd", []);
    await wait();
};
const start = history.state;
if (dlg.open) return "it starts open";
await tap(trig); await settle();
if (!dlg.open) return "the trigger does not open it";
if (dlg.getAttribute("aria-label") !== "Holiday photo") return "it is not named by its title";
if (rows().length !== 5) return `${rows().length} rows`;
if (rows().map((r) => r.textContent).join() !== "Share,Duplicate,Move to album,Print,Delete photo") return "the rows are wrong: " + rows().map((r) => r.textContent);
const del = rows()[4];
if (!del.classList.contains("ui-action-sheet-danger")) return "the destructive row is not styled so";
if (getComputedStyle(del).color === getComputedStyle(rows()[0]).color) return "the destructive row has the same colour";
if (!rows()[3].disabled) return "a disabled row is not disabled";
if (!dlg.querySelector(".ui-action-sheet-cancel")) return "no Cancel";
const box = dlg.getBoundingClientRect(), tr = trig.getBoundingClientRect();
if (device === "phone") {
    if (Math.abs(box.bottom - innerHeight) > 1) return `it is not at the bottom: ${box.bottom}`;
    if (Math.abs(box.width - innerWidth) > 1) return `not the phone's width: ${box.width}`;
    // A swipe that falls short springs back, and no action fires.
    let before = box.top;
    const p = middle(rows()[1]);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
    await wait(30);
    if (Math.abs(dlg.getBoundingClientRect().top - before - 60) > 2) return `it does not follow the finger: ${dlg.getBoundingClientRect().top - before}`;
    await wait(140);
    await fingers("touchEnd", []); await settle();
    if (!dlg.open) return "a short swipe closed it";
    if (Math.abs(dlg.getBoundingClientRect().top - before) > 1) return "a short swipe did not spring back";
    if (did() !== "nothing yet") return "a swipe from a row picked it";
    // Up: it resists. Pulled 100 it moves 28.46.
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
    await wait(30);
    const up = before - dlg.getBoundingClientRect().top;
    if (Math.abs(up - 28.46) > 0.5) return `pulled up 100 it moved ${up}, not 28.46`;
    await fingers("touchCancel", []); await settle();
    if (Math.abs(dlg.getBoundingClientRect().top - before) > 1) return "a cancelled gesture did not go back";
    if (!dlg.open) return "a cancelled gesture closed it";
    // A sideways swipe is not this gesture.
    await drag(rows()[1], 100, 4, 240); await settle();
    if (!dlg.open || Math.abs(dlg.getBoundingClientRect().top - before) > 1) return "a sideways swipe moved it";
    if (did() !== "nothing yet") return "a sideways swipe picked a row";
    // Past the distance, slowly.
    const p2 = middle(rows()[0]);
    await fingers("touchStart", [p2]);
    for (let i = 1; i <= 20; i++) { await fingers("touchMove", [{ x: p2.x, y: p2.y + box.height * .42 * i / 20 }]); await wait(16); }
    await wait(130);
    await fingers("touchEnd", []); await settle();
    if (dlg.open) return "a long swipe does not close it";
    if (closes() !== 1) return `on_close ran ${closes()} times`;
    if (did() !== "nothing yet") return "closing by swipe picked something";
    // A flick, short as it is.
    await tap(trig); await settle();
    await flick(rows()[1], 60); await settle();
    if (dlg.open) return "a flick does not close it";
    if (closes() !== 2) return "the flick did not call on_close";
    if (history.state !== start) return "a swipe left its history entry behind";
    await tap(trig); await settle();
} else {
    // A tablet: a card beside what opened it, not a sheet.
    if (box.width !== 320) return `the card is ${box.width} wide`;
    if (Math.abs(box.top - (tr.bottom + 8)) > 1 && Math.abs(box.bottom - (tr.top - 8)) > 1) return `the card is not by the trigger: ${box.top}, ${tr.top}-${tr.bottom}`;
    if (box.left < 12 || box.right > innerWidth - 12) return "the card leaves the screen";
    // A drag does not move a card.
    const b = box.top;
    await drag(rows()[1], 0, 80, 240); await settle();
    if (dlg.getBoundingClientRect().top !== b || !dlg.open) return "a drag moved the card";
    // Rotation stands it again, still open.
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1180, height: 820, deviceScaleFactor: 2, mobile: true });
    await settle();
    const turned = dlg.getBoundingClientRect(), tr2 = trig.getBoundingClientRect();
    await cdp("Emulation.setDeviceMetricsOverride", { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true });
    await settle();
    if (!dlg.open) return "rotation closed it";
    if (Math.abs(turned.top - (tr2.bottom + 8)) > 1 && Math.abs(turned.bottom - (tr2.top - 8)) > 1) return `after rotation it is not by the trigger: ${turned.top}, ${tr2.top}`;
}
// The keyboard's route, on either.
rows()[0].focus();
key(rows()[0], "ArrowDown"); await wait(50);
if (document.activeElement !== rows()[1]) return "ArrowDown does not move on";
key(rows()[1], "ArrowDown"); key(rows()[2], "ArrowDown"); await wait(50);
if (document.activeElement !== rows()[4]) return "ArrowDown does not skip the disabled row";
key(rows()[4], "ArrowDown"); await wait(50);
if (document.activeElement !== rows()[0]) return "ArrowDown does not go round";
key(rows()[0], "ArrowUp"); await wait(50);
if (document.activeElement !== rows()[4]) return "ArrowUp does not go round";

// Cancel, and picking.
const closed = closes();
await tap(dlg.querySelector(".ui-action-sheet-cancel")); await settle();
if (dlg.open) return "Cancel does not close it";
if (did() !== "nothing yet") return "Cancel picked something";
if (closes() !== closed + 1) return "Cancel did not call on_close";
await tap(trig); await settle();
await tap(rows()[1]); await settle();
if (dlg.open) return "picking does not close it";
if (did() !== "Duplicate") return `a plain text action gave ${did()}`;
await tap(trig); await settle();
await tap(rows()[4]); await settle();
if (did() !== "delete") return `the destructive action gave ${did()}`;
await tap(trig); await settle();
await tap(rows()[3]); await settle();
if (did() !== "delete" || !dlg.open) return "a disabled row did something";

// The back gesture: the app goes back in the history.
if (history.state?.quillo_layer !== 1) return "no history entry while open";
let nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (dlg.open) return "the back gesture does not close it";
if (did() !== "delete") return "the back gesture picked something";
// Picking leaves no entry behind.
await tap(trig); await settle();
await tap(rows()[0]); await settle();
if (history.state !== start) return "picking left its history entry";
if (did() !== "share") return "the last pick did not arrive";
// A tap above closes it; Escape's <dialog> closes it.
await tap(trig); await settle();
await fingers("touchStart", [{ x: 8, y: 10 }]); await fingers("touchEnd", []); await settle();
if (dlg.open) return "a tap outside does not close it";

// Too many to fit: the list scrolls, and takes drags up; at its top a drag down closes it.
const big = $$("dialog.ui-action-sheet")[1], longTrig = $$("button.ui-btn").find((b) => b.textContent === "Long list");
await tap(longTrig); await settle();
const list = big.querySelector(".ui-action-sheet-list");
if (big.getBoundingClientRect().height > innerHeight) return `too tall: ${big.getBoundingClientRect().height}`;
if (device === "phone" && list.scrollHeight <= list.clientHeight) return "the long list does not scroll";
const row = big.querySelectorAll(".ui-action-sheet-row")[device === "phone" ? 4 : 3];
if (device === "phone") {
    const top = big.getBoundingClientRect().top;
    await drag(row, 0, -120, 500); await settle();
    if (list.scrollTop < 60) return `the long list did not scroll: ${list.scrollTop}`;
    if (Math.abs(big.getBoundingClientRect().top - top) > 1) return "a drag up in a long list moved the sheet";
    list.scrollTop = 40; await wait(60);
    await drag(row, 0, 30, 400); await settle();
    if (!big.open) return "a drag down in a scrolled list closed it";
    list.scrollTop = 0; await wait(60);
    await flick(row, 60); await settle();
    if (big.open) return "a flick down at the list's top does not close it";
} else {
    big.querySelector(".ui-action-sheet-cancel").click(); await settle();
}

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(dlg).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
