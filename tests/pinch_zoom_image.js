// mobile
await wait(400);
const stage = $(".ui-pinch-zoom-stage");
const img = $(".ui-pinch-zoom-img");
const level = () => $(".ui-pinch-zoom-level").textContent;
const said = () => $("#pinch-zoom-said").textContent;
const view = () => {
    const m = img.style.transform.match(/translate\((-?[\d.]+)(?:px)?, (-?[\d.]+)(?:px)?\) scale\(([\d.]+)\)/);
    return m ? { x: +m[1], y: +m[2], s: +m[3] } : { x: 0, y: 0, s: 1 };
};
const near = (a, b) => Math.abs(a - b) < 0.6;
const W = stage.clientWidth, H = stage.clientHeight;
if (img.naturalWidth !== 1200) return "the demo's image did not load: " + img.naturalWidth;
const by = Math.min(W / 1200, H / 800), cw = 1200 * by, ch = 800 * by;
const edge = (s, c, box) => Math.max(0, (s * c - box) / 2);
const reset = async () => { $(".ui-pinch-zoom-reset").click(); await wait(280); };
// Chrome's own pinch, for many fingers' moves to check. Its fingers do not end exactly where asked, so what the
// scale should be is worked out here from where the pointers really were, at each move.
const gapOf = (m) => { const [a, b] = [...m.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
const fingersOn = new Map();
let start = 0, moves = [];
const held = (e) => ({ x: e.clientX, y: e.clientY });
// On the box: a finger that lands outside it is not on the image, and only those on it count.
stage.addEventListener("pointerdown", (e) => { fingersOn.set(e.pointerId, held(e)); if (fingersOn.size === 2) { start = gapOf(fingersOn); moves = []; } }, true);
// On the document, in the bubble phase: after the component has handled the move.
document.addEventListener("pointermove", (e) => {
    if (!fingersOn.has(e.pointerId)) return;
    fingersOn.set(e.pointerId, held(e));
    if (fingersOn.size === 2 && start) moves.push({ ratio: gapOf(fingersOn) / start, s: view().s });
});
for (const t of ["pointerup", "pointercancel"]) document.addEventListener(t, (e) => fingersOn.delete(e.pointerId), true);
const pinchBy = async (scale, dx = 0) => {
    const c = middle(stage);
    moves = [];
    await cdp("Input.synthesizePinchGesture", { x: c.x + dx, y: c.y, scaleFactor: scale, gestureSourceType: "touch" });
    await wait(320);
    if (moves.length < 3) throw new Error("the pinch did not reach the page: " + moves.length + " moves");
    return moves[moves.length - 1].ratio;
};
const stretch = (s, hi) => s > hi ? hi + (s - hi) * 0.25 : s < 1 ? 1 - (1 - s) * 0.25 : s;
const follows = (s0) => { for (const m of moves) { const want = stretch(s0 * m.ratio, 4); if (Math.abs(m.s - want) > 0.01) return m.s + " where the fingers ask " + want; } return null; };

// A known answer, from the harness's own fingers: twice the gap is twice the scale.
await pinch(stage, 2);
await wait(280);
if (!near(view().s, 2)) return "twice the gap should give 2: " + view().s;
await reset();

// A pinch scales by exactly as much as the fingers moved apart, about the middle of the box.
let r0 = await pinchBy(2);
if (r0 <= 1.5) return "the fingers should have moved apart: " + r0;
let off = follows(1);
if (off) return "during a pinch: " + off;
if (!near(view().s, r0)) return "a pinch should end at " + r0 + ": " + view().s + " " + img.style.transform;
if (view().x !== 0 || view().y !== 0) return "a pinch at the middle should not move it: " + img.style.transform;
if (level() !== Math.round(view().s * 100) + "%") return "level: " + level();
if (said().indexOf("Settled at " + view().s + ".") !== 0) return "on_zoom: " + said();
if (getComputedStyle(stage).touchAction !== "none") return "zoomed, every finger is the image's: " + getComputedStyle(stage).touchAction;

// And in again, from there. Chrome starts a pinch in with the fingers far apart, so a gentle one stays on the box.
const s1 = view().s;
const r1 = await pinchBy(0.6);
off = follows(s1);
if (off) return "pinching in: " + off;
if (r1 >= 1) return "the fingers should have come together: " + r1;
if (!near(view().s, Math.max(1, s1 * r1))) return "pinching in should end at " + s1 * r1 + ": " + view().s;
// Again, past the normal size, and it comes back there.
const s2 = view().s;
await pinchBy(0.6);
off = follows(s2);
if (off) return "pinching in again: " + off;
if (s2 * moves[moves.length - 1].ratio >= 1.01) { await pinchBy(0.6); }
if (img.style.transform !== "") return "back to normal should clear the transform: " + img.style.transform;
if (level() !== "100%") return "level after pinching in: " + level();
if (getComputedStyle(stage).touchAction !== "pan-y") return "at normal size the page keeps its scroll: " + getComputedStyle(stage).touchAction;

// Past the limit it gives a quarter of the excess, and comes back on release.
await pinchBy(9);
const top = moves[moves.length - 1];
if (top.ratio <= 4) return "the test should go past the limit: " + top.ratio;
off = follows(1);
if (off) return "past the limit: " + off;
if (!near(view().s, 4)) return "it should come back to the limit: " + view().s;
if (level() !== "400%") return "level at the limit: " + level();
if ($(".ui-pinch-zoom-more").getAttribute("aria-disabled") !== "true") return "Zoom in should be off at the limit";
await reset();

// Below 1 too, then back to normal. (follows covers the quarter given below 1.)
await pinchBy(0.6);
if (moves[moves.length - 1].ratio >= 1) return "the test should go below 1: " + moves[moves.length - 1].ratio;
off = follows(1);
if (off) return "below 1: " + off;
if (img.style.transform !== "") return "it should come back to normal";

// Off centre, what is between the fingers stays there, as near as the edges let it.
await pinchBy(1.6, 30);
const sx = view().s;
const ex0 = edge(sx, cw, W);
if (Math.abs(view().x - Math.max(-ex0, Math.min(ex0, 30 - 30 * sx))) > 1.5) return "an off-centre pinch: x " + view().x + " at scale " + sx + " (edge " + ex0 + ")";
await reset();

// A double tap zooms in on that spot: what was under the finger stays under it, or as near as the edges let.
const r = stage.getBoundingClientRect();
const spot = { x: r.left + r.width / 2 + 40, y: r.top + r.height / 2 + 20 };
const tapAt = async (p) => { await fingers("touchStart", [p]); await fingers("touchEnd", []); };
await tapAt(spot); await wait(60); await tapAt(spot);
await wait(320);
const ex = edge(2.5, cw, W), ey = edge(2.5, ch, H);
const want = (f, e) => Math.max(-e, Math.min(e, f - f * 2.5));
if (!near(view().s, 2.5)) return "a double tap should go to 2.5: " + view().s;
if (!near(view().x, want(40, ex))) return "x after a double tap: " + view().x + ", wanted " + want(40, ex);
if (!near(view().y, want(20, ey))) return "y after a double tap: " + view().y + ", wanted " + want(20, ey);

// One finger moves it, and it stops at the picture's edge: over the edge it gives 30%, then comes back.
await drag(stage, 30, 0, 300);
await wait(280);
const left = want(40, ex);
if (!near(view().x, Math.min(ex, left + 30))) return "a slow pan of 30: " + view().x + " from " + left;
const from = view();
const m = middle(stage);
const far = 500;
await fingers("touchStart", [m]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: m.x + far * i / 10 , y: m.y }]); await wait(16); }
await wait(120);
const over = from.x + far;
if (!near(view().x, ex + (over - ex) * 0.3)) return "past the edge it should give 30%: " + view().x + ", edge " + ex + ", asked " + over;
await fingers("touchEnd", []);
await wait(320);
if (!near(view().x, ex)) return "it should come back to the edge: " + view().x + ", edge " + ex;

// A flick carries on: 90 px in about 60 ms goes further than 90.
const before = view().x;
await fingers("touchStart", [m]);
for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: m.x - 30 * i, y: m.y }]); await wait(6); }
await fingers("touchEnd", []);
await wait(320);
if (view().x >= before - 90 - 1) return "a flick should carry on: " + before + " to " + view().x;

// A double tap goes back.
await tapAt(m); await wait(60); await tapAt(m);
await wait(320);
if (img.style.transform !== "") return "a second double tap should go back: " + img.style.transform;

// Two taps far apart, or slow, are not a double tap.
await tapAt(m); await wait(420); await tapAt(m);
await wait(450);
if (img.style.transform !== "") return "two slow taps zoomed";
await tapAt(m); await wait(40); await tapAt({ x: m.x + 90, y: m.y });
await wait(300);
if (img.style.transform !== "") return "two taps far apart zoomed";

// At normal size one finger is the page's.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(stage), scrollY);
await drag(stage, 0, -140, 250);
if (scrollY <= y0) return "a finger on the image at normal size should scroll the page";
if (img.style.transform !== "") return "the scroll moved the image";
document.body.style.paddingBottom = "";
await wait(50);

// The system taking a pinch: where it had got to stands, within the limits, and no finger is left behind.
const c3 = middle(stage);
const two = (g) => [{ x: c3.x - g, y: c3.y, id: 1 }, { x: c3.x + g, y: c3.y, id: 2 }];
await fingers("touchStart", two(40));
for (let i = 1; i <= 3; i++) { await fingers("touchMove", two(40 + 20 * i)); await wait(16); }
await wait(40);
const asked = 2.5;
if (!near(view().s, asked)) return "the pinch to cancel should have reached " + asked + ": " + view().s;
await fingers("touchCancel", []);
await wait(320);
if (!near(view().s, asked)) return "a cancelled pinch keeps what it had reached: " + view().s;
if ($(".ui-pinch-zoom-live")) return "a cancelled pinch left the box live";
await reset();
await tapAt(c3);   // a finger left in its list would make this a pinch
await wait(420);
if (img.style.transform !== "") return "a tap after a cancelled pinch moved the picture";

// And a real cancel of a pan past the edge sends it back inside.
await tap($(".ui-pinch-zoom-more"));
await tap($(".ui-pinch-zoom-more"));
const c2 = middle(stage);
await fingers("touchStart", [c2]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: c2.x + 60 * i, y: c2.y }]); await wait(16); }
await wait(40);
const edge2 = edge(view().s, cw, W);
if (view().x <= edge2) return "the cancel test should be past the edge: " + view().x + " of " + edge2;
await fingers("touchCancel", []);
await wait(320);
if (!near(view().x, edge2)) return "a cancelled pan should come back to the edge: " + view().x + " of " + edge2;
if ($(".ui-pinch-zoom-live")) return "a cancelled pan left the box live";
await reset();

// The buttons.
await tap($(".ui-pinch-zoom-more"));
if (!near(view().s, 1.5)) return "Zoom in: " + view().s;
await tap($(".ui-pinch-zoom-more"));
if (!near(view().s, 2)) return "Zoom in again: " + view().s;
await tap($(".ui-pinch-zoom-out"));
if (!near(view().s, 1.5)) return "Zoom out: " + view().s;
await tap($(".ui-pinch-zoom-reset"));
await wait(100);
if (img.style.transform !== "" || level() !== "100%") return "Reset: " + img.style.transform;
if ($(".ui-pinch-zoom-out").getAttribute("aria-disabled") !== "true") return "Zoom out should be off at normal size";
await tap($(".ui-pinch-zoom-out"));
if (level() !== "100%") return "Zoom out at normal size did something";

// The keys.
stage.focus();
key(stage, "+");
await wait(280);
if (!near(view().s, 1.5)) return "the + key: " + view().s;
key(stage, "=");
await wait(280);
if (!near(view().s, 2)) return "the = key: " + view().s;
key(stage, "ArrowRight");
await wait(280);
if (!near(view().x, -Math.min(40, edge(2, cw, W)))) return "ArrowRight should pan: " + view().x;
key(stage, "-");
await wait(280);
if (!near(view().s, 1.5)) return "the - key: " + view().s;
key(stage, "0");
await wait(280);
if (img.style.transform !== "") return "the 0 key should reset";

// Turned: the box changes and the picture stays inside its new edges, at the same scale, with focus kept.
stage.focus();
stage.style.height = "200px";
key(stage, "+"); await wait(40); key(stage, "+"); await wait(40); key(stage, "+"); await wait(280);
key(stage, "ArrowUp"); key(stage, "ArrowUp"); key(stage, "ArrowUp"); await wait(280);
stage.style.height = "";
const vw = innerWidth, vh = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: vh, height: vw, deviceScaleFactor: 2, mobile: true });
await wait(350);
const W2 = stage.clientWidth, H2 = stage.clientHeight, by2 = Math.min(W2 / 1200, H2 / 800);
if (W2 === W) return "the turn did not change the box";
if (!near(view().s, 2.5)) return "turning should keep the scale: " + view().s;
if (Math.abs(view().y) > edge(2.5, 800 * by2, H2) + 0.6) return "after turning the picture is outside its edges: " + view().y;
if (document.activeElement !== stage) return "turning lost focus";
await cdp("Emulation.setDeviceMetricsOverride", { width: vw, height: vh, deviceScaleFactor: 2, mobile: true });
await wait(350);
key(stage, "0");
await wait(280);

// What differs on a tablet: the buttons stand beside the image.
const bar = $(".ui-pinch-zoom-bar").getBoundingClientRect(), box = stage.getBoundingClientRect();
if (device === "tablet" && bar.left < box.right - 1) return "a tablet's buttons stand beside the image";
if (device === "phone" && bar.top < box.bottom - 1) return "a phone's buttons stand under the image";

// Bad data: an image that will not load says so, and a limit below 1 means no zoom.
const bad = $("#pinch-zoom-bad");
if (bad.querySelector(".ui-pinch-zoom-bad")?.textContent !== "This image could not be loaded.") return "a broken image: " + bad.textContent;
if (bad.querySelector(".ui-pinch-zoom-more").getAttribute("aria-disabled") !== "true") return "a limit below 1 allows no zoom";
// No address at all fires no error event, and an image can fail before the component starts.
const none = bad.querySelectorAll(".ui-pinch-zoom")[1];
if (none.querySelector(".ui-pinch-zoom-bad")?.textContent !== "This image could not be loaded.") return "an image with no address: " + none.textContent;
if (none.querySelector(".ui-pinch-zoom-more").getAttribute("aria-disabled") !== "true") return "nothing to zoom on a missing image";
