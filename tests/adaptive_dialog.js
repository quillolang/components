// mobile
const [info, rename] = $$("dialog.ui-adaptive-dialog");
const read = $$("button.ui-btn").find((b) => b.textContent === "Read more");
const ask = $$("button.ui-btn").find((b) => b.textContent === "Rename the route");
const widen = $$("button.ui-btn").find((b) => b.textContent === "Change the width");
const saved = () => $(".adaptive-dialog-demo-saved").textContent;
const closes = () => +$(".adaptive-dialog-demo-closes").textContent;
const settle = () => wait(340);
const size = async (w, h) => { await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(400); };
const W = innerWidth, H = innerHeight;
const isSheet = (d) => d.classList.contains("ui-adaptive-dialog-sheet");
const atFoot = (d) => Math.abs(d.getBoundingClientRect().bottom - innerHeight) <= 1 && Math.abs(d.getBoundingClientRect().width - innerWidth) <= 1;
const centred = (d) => {
    const r = d.getBoundingClientRect();
    return Math.abs(r.left + r.width / 2 - innerWidth / 2) <= 1 && Math.abs(r.top + r.height / 2 - innerHeight / 2) <= 1;
};
await tap(ask); await settle();
if (!rename.open) return "open={state} does not open it";
if (device === "phone") {
    if (!isSheet(rename) || !atFoot(rename)) return `on a phone it is not a sheet at the foot: ${JSON.stringify(rename.getBoundingClientRect())}`;
} else {
    if (isSheet(rename) || !centred(rename)) return `on a tablet it is not centred: ${JSON.stringify(rename.getBoundingClientRect())}`;
    if (rename.getBoundingClientRect().width !== 520) return `the dialog is ${rename.getBoundingClientRect().width} wide`;
}

// It changes shape live, keeping what was typed, focus and the very element.
const input = rename.querySelector("input");
input.focus();
input.value = "Hill loop"; input.dispatchEvent(new Event("input", { bubbles: true }));
await wait(100);
const other = device === "phone" ? [H, W] : [500, 900];
await size(...other); await settle();
if (!rename.open) return "turning closed it";
if (device === "phone") {
    if (isSheet(rename) || !centred(rename)) return "a phone turned on its side (844 wide) did not become a dialog";
} else {
    if (!isSheet(rename) || !atFoot(rename)) return "a tablet in Split View at 500 did not become a sheet";
}
if (input.value !== "Hill loop") return "turning lost what was typed";
if (document.activeElement !== input) return "turning lost focus";
if (rename.style.transform !== "") return "turning left a transform";
// At exactly the breakpoint it is a dialog; one pixel under, a sheet.
await size(600, 900); await settle();
if (isSheet(rename)) return "at 600 it is a sheet";
await size(599, 900); await settle();
if (!isSheet(rename)) return "at 599 it is not a sheet";
await size(W, H); await settle();
if (device === "phone" ? !isSheet(rename) : isSheet(rename)) return "turning back did not change it back";
if (input.value !== "Hill loop" || document.activeElement !== input) return "turning back lost the field";

// The footer's buttons work, and the state comes back.
await tap($$("dialog.ui-adaptive-dialog")[1].querySelectorAll(".ui-adaptive-dialog-foot button")[1]); await settle();
if (rename.open) return "Save did not close it";
if (saved() !== "Hill loop") return `Save gave ${saved()}`;
if (closes() !== 1) return `on_close ran ${closes()} times`;
await tap(ask); await settle();
if (!rename.open) return "it does not open again";
if (rename.querySelector("input").value !== "Hill loop") return "it did not open on the saved name";
rename.querySelector(".ui-adaptive-dialog-close").click(); await settle();
if (rename.open) return "Close does not close it";

await tap(read); await settle();
if (!info.open) return "the trigger does not open it";
const grip = info.querySelector(".ui-adaptive-dialog-head h2");
if (device === "phone") {
    // Dragged: follows, springs back when short, goes when long, and on a flick.
    const top = info.getBoundingClientRect().top;
    let p = middle(grip);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
    await wait(30);
    if (Math.abs(info.getBoundingClientRect().top - top - 60) > 2) return `it does not follow the finger: ${info.getBoundingClientRect().top - top}`;
    // The width prop changing under the finger must not move it.
    widen.click(); await wait(200);
    if (Math.abs(info.getBoundingClientRect().top - top - 60) > 2) return `a new width under a finger moved it: ${info.getBoundingClientRect().top - top}`;
    widen.click(); await wait(200);
    await wait(130);
    await fingers("touchEnd", []); await settle();
    if (!info.open || Math.abs(info.getBoundingClientRect().top - top) > 1) return "a short drag did not spring back";
    // Up it resists: pulled 100 it moves 28.46.
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 10 * i }]); await wait(16); }
    await wait(30);
    if (Math.abs(top - info.getBoundingClientRect().top - 28.46) > 0.6) return `pulled up it moved ${top - info.getBoundingClientRect().top}`;
    // Turned in the middle of a drag: the transform does not stay.
    await size(H, W); await settle();
    if (info.style.transform !== "") return "turning in the middle of a drag left the transform";
    await fingers("touchCancel", []);
    await size(W, H); await settle();
    if (!info.open) return "that closed it";
    // Cancelled.
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
    await fingers("touchCancel", []); await settle();
    if (!info.open || Math.abs(info.getBoundingClientRect().top - top) > 1) return "a cancelled drag did not go back";
    // Far enough.
    const tall = info.offsetHeight;
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + tall * .45 * i / 12 }]); await wait(16); }
    await wait(130);
    await fingers("touchEnd", []); await settle();
    if (info.open) return "a long drag did not close it";
    // The body gives its finger to the drag at its top: a flick.
    await tap(read); await settle();
    p = middle(info.querySelector(".ui-adaptive-dialog-body p"));
    await fingers("touchStart", [p]);
    await fingers("touchMove", [{ x: p.x, y: p.y + 8 }]);
    await fingers("touchMove", [{ x: p.x, y: p.y + 60 }]);
    await fingers("touchEnd", []); await settle();
    if (info.open) return "a flick on the body did not close it";
    // Tap above.
    await tap(read); await settle();
    await fingers("touchStart", [{ x: 10, y: 10 }]); await fingers("touchEnd", []); await settle();
    if (info.open) return "a tap above does not close it";
} else {
    // A dialog does not move.
    const top = info.getBoundingClientRect().top;
    await drag(grip, 0, 120, 240); await settle();
    if (!info.open || info.getBoundingClientRect().top !== top) return "a drag moved the dialog";
    await fingers("touchStart", [{ x: 10, y: 10 }]); await fingers("touchEnd", []); await settle();
    if (info.open) return "a tap outside does not close the dialog";
}

// The on-screen keyboard: the dialog or sheet rises, and is no taller than what is left.
const fake = new EventTarget();
Object.assign(fake, { height: innerHeight, offsetTop: 0, scale: 1 });
Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
await tap(ask); await settle();
fake.height = innerHeight - 340; fake.dispatchEvent(new Event("resize")); await settle();
const box = rename.getBoundingClientRect();
// A new width must not lose the keyboard's lift.
widen.click(); await wait(320);
const boxAfter = rename.getBoundingClientRect();
widen.click(); await wait(320);
if (device === "tablet" && boxAfter.width !== 460) return `the new width did not arrive: ${boxAfter.width}`;
if (Math.abs(boxAfter.top - box.top) > 2 || boxAfter.bottom > innerHeight - 340 + 1) return `a new width lost the keyboard's lift: ${box.top} became ${boxAfter.top}`;
delete window.visualViewport;
if (box.bottom > innerHeight - 340 + 1) return `the keyboard covers it: ${box.bottom} of ${innerHeight - 340}`;
rename.querySelector(".ui-adaptive-dialog-close").click(); await settle();

// Back gesture.
await tap(read); await settle();
const nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (info.open) return "the back gesture does not close it";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(info).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
