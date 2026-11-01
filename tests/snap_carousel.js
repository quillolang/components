// mobile
try { sessionStorage.removeItem("ui-snapc-snap-demo"); } catch {}
await tap($("#snap-demo-back")); await wait(300);
const track = () => $(".ui-snapc-track"), dots = () => $$(".ui-snapc-dot"), viewer = () => $("dialog.ui-snapc-viewer");
const cur = () => dots().findIndex((d) => d.getAttribute("aria-current") === "true");
const w = () => track().firstElementChild.offsetWidth;
const on = () => Math.round(track().scrollLeft / w());
// Works without script: the server's HTML alone has the snapping, the links and the count.
const html = await (await fetch(location.pathname + "?only=snap_carousel")).text();
const page = new DOMParser().parseFromString(html, "text/html");
const s = page.querySelector(".ui-snapc");
if (!s) return "the server writes it";
if (s.querySelectorAll(".ui-snapc-slide").length !== 5) return "five slides from the server";
if ([...s.querySelectorAll(".ui-snapc-count")].map((c) => c.textContent).join() !== "1 / 5,2 / 5,3 / 5,4 / 5,5 / 5") return "each picture has its count from the server";
if (s.querySelector('.ui-snapc-dot[href="#snap-demo-3"]') == null || !page.getElementById("snap-demo-3")) return "a dot is a link to its picture";
if (!s.querySelector(".ui-snapc-zoom").getAttribute("href").startsWith("data:image")) return "a picture is a link to the large one";
if (getComputedStyle(track()).scrollSnapType !== "x mandatory") return "CSS snaps it: " + getComputedStyle(track()).scrollSnapType;
if (dots().length !== 5 || cur() !== 0) return "five dots, the first on: " + cur();
// A real swipe: the browser scrolls and snaps; the dot follows.
const span = w();
await drag(track(), -Math.round(span * 0.7), 0, 250);
await wait(700);
if (on() !== 1) return "a swipe goes on one: " + on() + " at " + track().scrollLeft;
if (track().scrollLeft % span !== 0) return "it snaps: " + track().scrollLeft;
if (cur() !== 1) return "the dot follows: " + cur();
if ($("#snap-demo-pic").textContent !== "On picture 2") return "on_change: " + $("#snap-demo-pic").textContent;
// A small drag comes back.
// (The finger stops before it lifts: a moving finger is a fling, and the browser's snap goes on with it.)
const tr = track().getBoundingClientRect(), tp = { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [tp] });
for (let i = 1; i <= 8; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: tp.x - i * 4, y: tp.y }] }); await wait(16); }
await wait(250);
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(700);
if (on() !== 1 || track().scrollLeft % span !== 0) return "a small drag springs back: " + track().scrollLeft;
// A swipe down is the page's, not ours.
const y0 = scrollY;
await drag(track(), 0, -120, 250);
await wait(300);
if (scrollY <= y0 && document.documentElement.scrollHeight > innerHeight + 130) return "up and down scroll the page";
scrollTo(0, y0);
// A dot goes there.
await tap(dots()[3]);
await wait(700);
if (on() !== 3 || cur() !== 3) return "a dot goes to its picture: " + on() + " " + cur();
// The keys.
key(track(), "ArrowLeft");
await wait(700);
if (on() !== 2) return "ArrowLeft goes back: " + on();
// Open the viewer on what shows.
const zoomA = $$(".ui-snapc-zoom")[2];
await tap(zoomA); await wait(200);
const v = viewer(), big = $(".ui-snapc-big"), stage = $(".ui-snapc-stage"), level = $(".ui-snapc-level"), where = $(".ui-snapc-where");
if (!v.open) return "a tap opens the viewer";
if (where.textContent !== "3 / 5") return "the viewer starts where it was: " + where.textContent;
if (big.alt !== "The sole") return "it shows that picture: " + big.alt;
if (getComputedStyle(stage).touchAction !== "none") return "the stage is the finger's";
const r = v.getBoundingClientRect();
if (r.width !== innerWidth || r.height !== innerHeight) return "it fills the screen: " + r.width + "x" + r.height;
// Pinch: from 80 px apart to 160 is 2x.
await pinch(stage, 2);
if (level.textContent !== "200%") return "pinch to 2x: " + level.textContent + " " + big.style.transform;
await pinch(stage, 3);
if (level.textContent !== "400%") return "the zoom stops at 4x: " + level.textContent;
await pinch(stage, 0.1);
if (level.textContent !== "100%") return "and at 1x: " + level.textContent;
// A double tap zooms there, and again back.
const sr = stage.getBoundingClientRect(), mid = { x: sr.left + sr.width / 2, y: sr.top + sr.height / 2 };
const touch = async (p) => { await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] }); await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); };
await touch(mid); await touch(mid); await wait(300);
if (level.textContent !== "250%") return "a double tap zooms: " + level.textContent;
// A drag now pans, and stops at the edge: at 2.5x the most is 0.75 of the width.
await drag(stage, 60, 0, 250);
if (big.style.transform !== "translate(60px, 0px) scale(2.5)") return "a drag pans: " + big.style.transform;
await drag(stage, 4000, 0, 250);
const most = sr.width * 0.75;
if (big.style.transform !== `translate(${most}px, 0px) scale(2.5)`) return "panning stops at the edge: " + big.style.transform;
if (where.textContent !== "3 / 5") return "panning does not turn";
await touch(mid); await touch(mid); await wait(300);
if (level.textContent !== "100%") return "a double tap goes back: " + level.textContent;
// A short swipe springs back; a long one turns; a flick turns; the end stops it.
await drag(stage, -40, 0, 500); await wait(260);
if (where.textContent !== "3 / 5" || big.style.transform !== "translate(0px, 0px) scale(1)") return "a short swipe stays: " + where.textContent + big.style.transform;
await drag(stage, -Math.round(sr.width * 0.4), 0, 400);
if (where.textContent !== "4 / 5") return "a long swipe turns: " + where.textContent;
await drag(stage, -80, 0, 40);
if (where.textContent !== "5 / 5") return "a flick turns: " + where.textContent;
await drag(stage, -Math.round(sr.width * 0.4), 0, 300); await wait(260);
if (where.textContent !== "5 / 5" || big.style.transform !== "translate(0px, 0px) scale(1)") return "the last stops: " + big.style.transform;
// A cancelled finger goes back.
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [mid] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: mid.x + 50, y: mid.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: mid.x + 120, y: mid.y }] });
await wait(30);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(260);
if (where.textContent !== "5 / 5" || big.style.transform !== "translate(0px, 0px) scale(1)") return "a cancel puts it back: " + big.style.transform;
// Buttons and keys are the equal of each gesture.
const tool = (l) => $(`.ui-snapc-tool[aria-label="${l}"]`);
await tap(tool("Previous picture"));
if (where.textContent !== "4 / 5") return "the button goes back: " + where.textContent;
await tap(tool("Zoom in"));
if (level.textContent !== "150%") return "the button zooms: " + level.textContent;
key(v, "+"); await wait(60);
if (level.textContent !== "200%") return "+ zooms: " + level.textContent;
key(v, "-"); await wait(60);
key(v, "0"); await wait(60);
if (level.textContent !== "100%") return "0 fits: " + level.textContent;
key(v, "ArrowRight"); await wait(60);
if (where.textContent !== "5 / 5") return "the arrow turns: " + where.textContent;
key(v, "ArrowLeft"); await wait(60);
key(v, "ArrowLeft"); await wait(60);
// A short pull stays, a long one closes, and the carousel is on the picture it left.
await drag(stage, 0, 60, 500); await wait(260);
if (!v.open) return "a short pull stays";
await drag(stage, 0, 220, 300); await wait(200);
if (v.open) return "a long pull closes";
await wait(200);
if (on() !== 2 || cur() !== 2) return "it left on picture 3: " + on();
if (document.activeElement !== $$(".ui-snapc-zoom")[2]) return "focus comes back to that picture";
// Close on another picture: the carousel is there.
await tap($$(".ui-snapc-zoom")[2]); await wait(200);
await tap(tool("Next picture"));
await tap(tool("Next picture"));
await tap(tool("Close")); await wait(300);
// Two in view on a tablet: the scroll ends with the last two showing, and both dots are lit.
const end = device === "tablet" ? 3 : 4;
const lit = () => dots().map((d, i) => d.hasAttribute("data-seen") ? i : -1).filter((i) => i >= 0).join();
if (on() !== end || cur() !== end) return "the carousel follows the viewer: " + on() + " " + cur();
if (lit() !== (device === "tablet" ? "3,4" : "4")) return "the dots show what is in view: " + lit();
// From there a swipe still moves the dot: nothing is left waiting for a scroll that cannot come.
await tap(dots()[4]); await wait(700);
await drag(track(), Math.round(w() * 0.7), 0, 250); await wait(700);
if (cur() !== on() || on() !== end - 1) return "a swipe after the end moves the dot: " + on() + " " + cur();
// The same when the viewer closes where it opened, with no scroll at all.
await tap($$(".ui-snapc-zoom")[end - 1]); await wait(200);
await tap(tool("Close")); await wait(300);
await drag(track(), -Math.round(w() * 0.7), 0, 250); await wait(700);
if (cur() !== end || on() !== end) return "a swipe after the viewer moves the dot: " + on() + " " + cur();
await tap(dots()[1]);
await wait(700);
// A turn of the phone keeps the picture.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(500);
if (on() !== 1 || track().scrollLeft !== w()) return "turned, it keeps: " + on() + " " + track().scrollLeft + " " + w();
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(500);
if (on() !== 1 || cur() !== 1 || track().scrollLeft !== w()) return "turned back, it keeps: " + on() + " " + cur();
// A tablet shows two at a time.
if (device === "phone" && track().clientWidth !== w()) return "one on a phone";
if (device === "tablet") {
    if (Math.round(track().clientWidth / w()) !== 2) return "two on a tablet: " + track().clientWidth + " " + w();
    if (on() !== 1 || track().scrollLeft !== w()) return "a wider pane keeps the picture: " + track().scrollLeft + " " + w();
}
// Coming back in the tab finds the same picture; a kept place that is nonsense is the first.
await tap($("#snap-demo-back")); await wait(400);
if (on() !== 1 || cur() !== 1) return "it comes back on the same picture: " + on() + " " + cur();
sessionStorage.setItem("ui-snapc-snap-demo", "99");
await tap($("#snap-demo-back")); await wait(400);
if (cur() !== (device === "tablet" ? 3 : 4)) return "a place too far is the last that can show: " + cur();
sessionStorage.setItem("ui-snapc-snap-demo", "junk");
await tap($("#snap-demo-back")); await wait(400);
if (cur() !== 0 || on() !== 0) return "a place that is no number is the first: " + cur();
sessionStorage.removeItem("ui-snapc-snap-demo");
// Storage that throws: the carousel still works, with nothing in the console.
const ss = Storage.prototype.setItem, gs = Storage.prototype.getItem;
Storage.prototype.setItem = () => { throw new DOMException("no", "SecurityError"); };
Storage.prototype.getItem = () => { throw new DOMException("no", "SecurityError"); };
await tap($("#snap-demo-back")); await wait(400);
await tap(dots()[2]); await wait(700);
Storage.prototype.setItem = ss; Storage.prototype.getItem = gs;
if (cur() !== 2 || on() !== 2) return "with storage refused it still goes: " + cur();
await tap($("#snap-demo-back")); await wait(400);
