// mobile
// A flick with its speed fixed by the events' own times, so a busy machine cannot slow it.
const flick = async (el, dx, dy = 0) => {
    const p = middle(el), t0 = Date.now() / 1000, steps = 5;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p], timestamp: t0 });
    for (let i = 1; i <= steps; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }], timestamp: t0 + i * 0.012 });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: t0 + 0.07 });
    await wait();
};
const dlg = () => $("dialog.ui-swipev"), stage = () => $(".ui-swipev-stage"), track = () => $(".ui-swipev-track");
const where = () => $(".ui-swipev-where").textContent, note = () => $("#swipev-demo-note").textContent;
const opener = (i) => $(`[data-open="${i}"]`);
const tool = (n) => $(`.ui-swipev-tool[aria-label="${n}"]`);
const level = () => $(".ui-swipev-level").textContent;
const slide = (i) => $(`.ui-swipev-slide[data-i="${i}"]`);
const img = (i) => slide(i).querySelector("img");
const scaleOf = (el) => new DOMMatrix(getComputedStyle(el).transform);
const settle = () => wait(320);
const cancel = () => cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
const down = async (p) => fingers("touchStart", [p]);
const along = async (p, dx, dy, n = 6) => { for (let i = 1; i <= n; i++) { await fingers("touchMove", [{ x: p.x + dx * i / n, y: p.y + dy * i / n }]); await wait(16); } await wait(50); };

if ($("#swipev-demo-none dialog").open) return "nothing to show: it stays shut";
if ($$("[data-open]").length !== 7) return "seven usable photos: " + $$("[data-open]").length;

await tap(opener(1)); await wait(200);
if (!dlg().open) return "it opens";
const box = dlg().getBoundingClientRect();
if (box.width !== innerWidth || box.height !== innerHeight) return "it fills the screen: " + box.width + "x" + box.height;
if (where() !== "2 / 7") return "on the photo pressed: " + where();
if ($(".ui-swipev-caption").textContent !== "The Mary Ann, home at last") return "its caption: " + $(".ui-swipev-caption").textContent;
if (getComputedStyle(stage()).touchAction !== "none") return "the stage is the finger's";
if (track().hasAttribute("style") && track().getAttribute("style").includes("left")) return "what moves carries no computed style";

// Those around it are there and loaded; those far off are not.
if ($$(".ui-swipev-slide").map((s) => s.dataset.i).join() !== "0,1,2,3") return "two each way: " + $$(".ui-swipev-slide").map((s) => s.dataset.i).join();
await wait(150);
if (!img(2).complete || img(2).naturalWidth === 0 || !img(3).complete || img(3).naturalWidth === 0) return "the next ones are loaded";

const w = stage().clientWidth, m = middle(stage());
// A short slow swipe follows the finger, shows the next beside it, and comes back.
await down(m); await along(m, -Math.round(w * 0.15), 0, 8);
const dx = Math.round(w * 0.15);
if (Math.abs(scaleOf(track()).e + dx) > 1) { await cancel(); return "the track follows: " + scaleOf(track()).e; }
const nextBox = slide(2).getBoundingClientRect();
if (Math.abs(nextBox.left - (w - dx)) > 2) { await cancel(); return "the next comes in beside it: " + nextBox.left; }
await wait(250); await fingers("touchEnd", []); await settle();
if (where() !== "2 / 7" || track().style.transform !== "") return "short of it, it comes back: " + where() + " " + track().style.transform;

// State changing mid-swipe leaves the track with the finger: a photo arrives, the count changes.
await down(m); await along(m, -60, 0);
const held0 = scaleOf(track()).e;
$("#swipev-demo-more").click(); await wait(200);
if (where() !== "2 / 8") { await cancel(); return "the state did change: " + where(); }
if (held0 === 0 || scaleOf(track()).e !== held0) { await cancel(); return "a state change mid-swipe moved the track: " + scaleOf(track()).e + " from " + held0; }
await cancel(); await settle();
if (where() !== "2 / 8" || track().style.transform !== "") return "a cancelled swipe stays: " + where();

// Past a quarter goes on; a flick goes on; back the same way. No image is loaded twice over.
const same = img(2);
await drag(stage(), -Math.round(w * 0.4), 0, 500); await settle();
if (where() !== "3 / 8") return "past a quarter: " + where();
if (!note().endsWith("on 2")) return "on_change: " + note();
if (img(2) !== same) return "the image is kept, not made again";
if (track().style.transform !== "") return "the track goes home: " + track().style.transform;
if (Math.abs(slide(2).getBoundingClientRect().left) > 1) return "with this photo in place";
await flick(stage(), -70); await settle();
if (where() !== "4 / 8") return "a flick: " + where();
await flick(stage(), 70); await settle();
if (where() !== "3 / 8") return "a flick back: " + where();
await drag(stage(), Math.round(w * 0.4), 0, 500); await settle();
await drag(stage(), Math.round(w * 0.4), 0, 500); await settle();
if (where() !== "1 / 8") return "back to the first: " + where();
// A start out of the end gives and stays.
await down(m); await along(m, 120, 0);
if (Math.abs(scaleOf(track()).e - 36) > 1) { await cancel(); return "a third of the drag at the edge: " + scaleOf(track()).e; }
await fingers("touchEnd", []); await settle();
if (where() !== "1 / 8" || !tool("Previous photo").disabled) return "nothing before the first";

// A short pull springs back, dimming on the way; a long one closes on this photo.
await down(m); await along(m, 0, 60, 8);
if (Math.abs(scaleOf(track()).f - 60) > 2) { await cancel(); return "a pull follows: " + scaleOf(track()).f; }
const dim = Number(getComputedStyle($(".ui-swipev-black")).opacity);
if (Math.abs(dim - 0.85) > 0.02) { await cancel(); return "the black thins: " + dim; }
// And held there while state changes.
const f0 = scaleOf(track()).f;
$("#swipev-demo-more").click(); await wait(200);
if (scaleOf(track()).f !== f0 || Math.abs(Number(getComputedStyle($(".ui-swipev-black")).opacity) - dim) > 0.001) { await cancel(); return "a state change mid-pull moved it"; }
await wait(250); await fingers("touchEnd", []); await settle();
if (!dlg().open || track().style.transform !== "") return "a short pull springs back";
if (getComputedStyle($(".ui-swipev-black")).opacity !== "1") return "and the black comes back";
await tap(tool("Next photo")); await settle();
if (where() !== "2 / 9") return "Next: " + where();
await drag(stage(), 0, 190, 500); await settle();
if (dlg().open) return "a long pull closes";
if (!note().startsWith("Closed on 1")) return "on_close says where: " + note();
if (track().style.transform !== "") return "and leaves nothing behind";

// Open again: the same place. A photo pressed: that one.
await tap($("#swipev-demo-again")); await wait(200);
if (where() !== "2 / 9") return "the place is kept: " + where();
await flick(stage(), 0, 90); await settle();
if (dlg().open) return "a flick down closes";
await tap($("#swipev-demo-again")); await wait(200);
await down(m); await along(m, 0, 200);
await cancel(); await settle();
if (!dlg().open) return "a cancelled pull stays";
if (getComputedStyle($(".ui-swipev-black")).opacity !== "1") return "whole again";
// Up is nothing.
await down(m); await along(m, 0, -200);
await fingers("touchEnd", []); await settle();
if (!dlg().open || where() !== "2 / 9") return "an upward drag does nothing";

// Pinch: fingers from 80 px apart to 160 is twice.
await pinch(stage(), 2); await settle();
if (level() !== "200%") return "pinch: " + level();
if (Math.abs(scaleOf(img(1)).a - 2) > 0.01) return "the photo grows: " + scaleOf(img(1)).a;
// Zoomed, a finger pans, inside the edges, and does not turn.
await drag(stage(), -5000 > 0 ? 0 : -150, 0, 300); await settle();
const panned = scaleOf(img(1)).e;
if (Math.abs(panned + 150) > 2) return "a drag pans: " + panned;
if (where() !== "2 / 9") return "and does not turn";
// Held mid-pan while state changes.
await down(m); await along(m, 40, 0);
const pan0 = scaleOf(img(1)).e;
$("#swipev-demo-more").click(); await wait(200);
const pan1 = scaleOf(img(1)).e;
await fingers("touchEnd", []); await settle();
if (pan1 !== pan0) return "a state change mid-pan moved the photo: " + pan1 + " from " + pan0;
await drag(stage(), -Math.min(w, 220), 0, 300); await settle();
await drag(stage(), -Math.min(w, 220), 0, 300); await settle();
const most = (2 - 1) * w / 2;
if (Math.abs(scaleOf(img(1)).e + most) > 2) return "a pan stops at the edge: " + scaleOf(img(1)).e + " of " + most;

// A double tap goes back to fit, and in again at 250%.
const dt = async () => { await fingers("touchStart", [m]); await fingers("touchEnd", []); await wait(70); await fingers("touchStart", [m]); await fingers("touchEnd", []); await settle(); };
await dt();
if (level() !== "100%") return "a double tap fits: " + level();
await dt();
if (level() !== "250%") return "a double tap zooms: " + level();
await dt();

// Buttons and keys for each.
await tap(tool("Zoom in"));
if (level() !== "150%") return "Zoom in: " + level();
key(dlg(), "+"); await wait(60);
if (level() !== "200%") return "+: " + level();
key(dlg(), "-"); await wait(60);
if (level() !== "150%") return "-: " + level();
key(dlg(), "0"); await wait(60);
if (level() !== "100%") return "0: " + level();
if (!tool("Zoom out").disabled) return "nothing to zoom out of";
key(dlg(), "ArrowRight"); await settle();
if (where() !== "3 / 10") return "ArrowRight: " + where();
key(dlg(), "ArrowLeft"); await settle();
if (where() !== "2 / 10") return "ArrowLeft: " + where();
// Two quick keys both count: the turn under way lands first.
key(dlg(), "ArrowRight"); key(dlg(), "ArrowRight"); await settle();
if (where() !== "4 / 10") return "two quick keys: " + where();

// A turn keeps the photo, and a zoom stays inside the new edges.
await tap(tool("Zoom in")); await wait(250);
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(350);
const turnedAt = where(), turnedBox = dlg().getBoundingClientRect(), turnedLevel = level();
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(350);
if (turnedAt !== "4 / 10" || turnedLevel !== "150%") return "turned: " + turnedAt + " " + turnedLevel;
if (turnedBox.width !== H || turnedBox.height !== W) return "turned, it fills the screen: " + turnedBox.width + "x" + turnedBox.height;
key(dlg(), "0"); await wait(100);

// A tablet has a strip of all of them; a phone has none.
const strip = $(".ui-swipev-strip");
if (device === "tablet") {
    if (getComputedStyle(strip).display === "none") return "a strip on a tablet";
    if ($('.ui-swipev-thumb[aria-current="true"]').dataset.t !== "3") return "marking this photo";
    await tap($('.ui-swipev-thumb[data-t="0"]')); await wait(150);
    if (where() !== "1 / 10") return "a thumbnail goes there: " + where();
} else if (getComputedStyle(strip).display !== "none") return "no strip on a phone";

// Closing by the button, and by Escape.
await tap(tool("Close")); await wait(200);
if (dlg().open) return "Close closes";
await tap($("#swipev-demo-again")); await wait(200);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(200);
if (dlg().open) return "Escape closes";
