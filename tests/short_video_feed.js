// mobile
const box = () => $(".ui-svfeed-scroll");
const vids = () => $$("video");
const vid = (i) => $(`video[data-i="${i}"]`);
const playing = () => vids().filter((v) => !v.paused).map((v) => v.dataset.i).join();
const note = () => $("#svfeed-demo-note").textContent;
const on = () => Math.round(box().scrollTop / box().clientHeight);
const stage = () => $$(".ui-svfeed-stage")[on()];
const tool = (name) => $(`.ui-svfeed-tool[aria-label="${name}"]`);
const windowIs = () => vids().map((v) => v.dataset.i).join();
const settle = () => wait(800);
const fail = async (m) => m;
// A swipe with the finger stopped before it lifts, for a move short of a clip.
const hold_then_lift = async (dy) => {
    const p = middle(box());
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + dy * i / 8 }]); await wait(16); }
    await wait(250);
    await fingers("touchEnd", []);
    await settle();
};

await wait(500);
// Only what is near holds a video; the first plays silently, by itself.
if (windowIs() !== "0,1,2") return "videos near the start: " + windowIs();
if (playing() !== "0") return "the first plays by itself: " + playing();
if (!vid(0).muted) return "without sound until asked";
if (vid(0).currentTime <= 0) return "and really goes: " + vid(0).currentTime;
if (vid(0).getAttribute("preload") !== "auto" || vid(1).getAttribute("preload") !== "auto" || vid(2).getAttribute("preload") !== "metadata") return "the next loads ahead: " + vids().map((v) => v.getAttribute("preload")).join();
if (!vid(0).hasAttribute("playsinline")) return "inline on iOS";
if ($$(".ui-svfeed-slide")[4].querySelector("img") == null) return "further ones are a picture";
if (getComputedStyle(box()).scrollSnapType !== "y mandatory" || getComputedStyle($(".ui-svfeed-slide")).scrollSnapStop !== "always") return "the browser snaps it, clip by clip";
if (getComputedStyle(box()).overscrollBehaviorY !== "contain") return "and leaves the page out of it";

// A real swipe up: the next plays, the last stops, goes back to its start and silent.
await drag(box(), 0, -Math.round(box().clientHeight * 0.6), 250);
await settle();
if (on() !== 1) return "a swipe goes on one: " + on();
if (note().indexOf("Settled on 1") < 0) return "on_change: " + note();
if (playing() !== "1") return "one at a time: " + playing();
if (vid(0).currentTime !== 0) return "the last goes back to its start: " + vid(0).currentTime;
if (windowIs() !== "0,1,2,3") return "the window moves: " + windowIs();

// Short of half a clip it comes back, and what was playing goes on.
await hold_then_lift(-Math.round(box().clientHeight * 0.2));
if (on() !== 1 || box().scrollTop % box().clientHeight !== 0) return "a short swipe comes back: " + box().scrollTop;
if (playing() !== "1") return "the clip goes on: " + playing();

// A hard flick stops at the next clip, not two on.
await drag(box(), 0, -Math.round(box().clientHeight * 0.9), 90);
await settle();
if (on() !== 2) return "a flick is one clip: " + on();
if (playing() !== "2") return "the third plays: " + playing();
await drag(box(), 0, Math.round(box().clientHeight * 0.6), 250);
await settle();
if (on() !== 1) return "a swipe down goes back: " + on();

// The buttons and keys do the same.
if (tool("Previous clip").disabled) return "Previous is on";
await tap(tool("Next clip"));
await settle();
if (on() !== 2) return "Next: " + on();
await tap(tool("Next clip"));
await settle();
if (on() !== 3) return "Next again: " + on();
if (windowIs() !== "2,3,4,5") return "those behind let go: " + windowIs();
key(box(), "ArrowUp"); await settle();
if (on() !== 2) return "ArrowUp: " + on();
key(box(), "PageDown"); await settle();
if (on() !== 3) return "PageDown: " + on();
await tap(tool("Previous clip")); await settle();
await tap(tool("Previous clip")); await settle();
await tap(tool("Previous clip")); await settle();
if (on() !== 0 || !tool("Previous clip").disabled) return "the top: Previous goes off";

// A tap pauses, and says so with a button; that or another tap goes on.
await tap(stage());
await wait(350);
if (playing() !== "") return "a tap pauses: " + playing();
if ($(".ui-svfeed-big")?.getAttribute("aria-label") !== "Play") return "with a play button";
await tap($(".ui-svfeed-big"));
await wait(350);
if (playing() !== "0") return "its button goes on: " + playing();
if ($(".ui-svfeed-big")) return "and goes";
key(box(), " "); await wait(300);
if (playing() !== "") return "Space pauses";
key(box(), " "); await wait(300);
if (playing() !== "0") return "and goes on";

// A person's pause stays through a turn away and back, and a swipe forgets it.
await tap(stage()); await wait(350);
await tap(tool("Next clip")); await settle();
if (playing() !== "1") return "the next clip plays though the last was paused: " + playing();
await tap(tool("Previous clip")); await settle();

// Two taps like it, without stopping it. The count says so, and on_like.
const cnt = () => $(".ui-svfeed-count").textContent;
if (cnt() !== "950") return "the count: " + cnt();
const sm = middle(stage());
await fingers("touchStart", [sm]); await fingers("touchEnd", []);
await wait(60);
await fingers("touchStart", [sm]); await fingers("touchEnd", []);
await wait(120);
if (cnt() !== "951") return "two taps like: " + cnt();
if (tool("Like").getAttribute("aria-pressed") !== "true") return "the heart is on";
if (!$(".ui-svfeed-beat")) return "and shows";
await wait(350);
if (playing() !== "0") return "still playing: " + playing();
if (!note().endsWith("1 likes")) return "on_like: " + note();
await fingers("touchStart", [sm]); await fingers("touchEnd", []);
await wait(60);
await fingers("touchStart", [sm]); await fingers("touchEnd", []);
await wait(300);
if (cnt() !== "951") return "a second double tap does not take it back: " + cnt();
await tap(tool("Like"));
if (cnt() !== "950" || !note().endsWith("0 likes")) return "the button takes it back: " + cnt() + " " + note();
await tap(tool("Next clip")); await settle();
if (cnt() !== "1.2K") return "1249 is 1.2K: " + cnt();
await tap(tool("Next clip")); await settle();
if (cnt() !== "3.4M") return "3412000 is 3.4M: " + cnt();
await tap(tool("Next clip")); await settle();
if (cnt() !== "0") return "none: " + cnt();
await tap(tool("Previous clip")); await settle();
await tap(tool("Previous clip")); await settle();
await tap(tool("Previous clip")); await settle();

// Sound follows the person, not the clip; only the one playing is heard.
if (!tool("Turn sound on")) return "sound off to start";
await tap(tool("Turn sound on")); await wait(120);
if (vid(0).muted) return "the button brings sound";
await tap(tool("Next clip")); await settle();
if (vid(1).muted) return "the next has sound too";
if (!vid(0).muted) return "the last is silent";
if (vid(2).muted === false) return "the one ahead is silent";
await tap(tool("Turn sound off")); await wait(120);
if (!vid(1).muted) return "and it goes";

// Sound refused: it plays silent, says so, and a press brings it back.
const realPlay = HTMLMediaElement.prototype.play;
await tap(tool("Turn sound on")); await wait(120);
HTMLMediaElement.prototype.play = function () { return this.muted ? realPlay.call(this) : Promise.reject(new DOMException("no", "NotAllowedError")); };
await tap(tool("Next clip")); await settle();
HTMLMediaElement.prototype.play = realPlay;
if (playing() !== "2") return "refused sound still plays: " + playing();
if (!vid(2).muted) return "silent";
if ($(".ui-svfeed-chip")?.textContent !== "Tap for sound") return "and says so: " + $(".ui-svfeed-chip")?.textContent;
await tap($(".ui-svfeed-chip")); await wait(150);
if (vid(2).muted || $(".ui-svfeed-chip")) return "a press brings it back";
await tap(tool("Turn sound off")); await wait(120);

// Refused altogether, even silent: a button on the clip, never a clip that sits there.
HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(tool("Next clip")); await settle();
HTMLMediaElement.prototype.play = realPlay;
if (playing() !== "") return "nothing plays: " + playing();
if ($(".ui-svfeed-big")?.getAttribute("aria-label") !== "Play this clip") return "a button says what to do: " + $(".ui-svfeed-big")?.getAttribute("aria-label");
await tap($(".ui-svfeed-big")); await wait(350);
if (playing() !== "3") return "and works: " + playing();

// The app leaving the screen pauses, and back it goes on; unless the person had paused.
Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
document.dispatchEvent(new Event("visibilitychange")); await wait(150);
if (playing() !== "") { delete document.hidden; return "hidden, it pauses"; }
delete document.hidden;
document.dispatchEvent(new Event("visibilitychange")); await wait(350);
if (playing() !== "3") return "back, it goes on: " + playing();
await tap(stage()); await wait(350);
Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
document.dispatchEvent(new Event("visibilitychange")); await wait(100);
delete document.hidden;
document.dispatchEvent(new Event("visibilitychange")); await wait(350);
if (playing() !== "") return "a person's pause stays: " + playing();
await tap($(".ui-svfeed-big")); await wait(300);

// Out of view it pauses.
const top0 = scrollY;
scrollTo(0, 100000); await wait(350);
if (scrollY > 0) {
    if (scrollY > innerHeight * 0.55 && playing() !== "") return "scrolled away it pauses: " + playing() + " at " + scrollY;
    scrollTo(0, 0); await wait(400);
    if (playing() !== "3") return "and comes back: " + playing();
}

// A turn keeps the clip and the place.
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(400);
const turned = [on(), box().scrollTop === 3 * box().clientHeight, playing()];
const stageBox = stage().getBoundingClientRect();
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(400);
if (turned.join() !== "3,true,3") return "turned, the clip stays: " + turned.join();
if (Math.abs(stageBox.width / stageBox.height - 9 / 16) > 0.02) return "turned, it keeps its shape: " + stageBox.width + "x" + stageBox.height;
if (on() !== 3 || box().scrollTop !== 3 * box().clientHeight) return "turned back: " + on();

// A wide box shows what it is and what comes next beside it.
const info = $$(".ui-svfeed-info")[3];
if (device === "tablet") {
    if (getComputedStyle(info).display === "none") return "a tablet has the words beside the clip";
    const sb = stage().getBoundingClientRect();
    if (Math.abs(sb.width / sb.height - 9 / 16) > 0.02) return "the clip keeps its shape: " + sb.width + "x" + sb.height;
    await tap(info.querySelector(".ui-svfeed-up")); await settle();
    if (on() !== 4) return "Up next goes there: " + on();
    await tap(tool("Previous clip")); await settle();
} else if (getComputedStyle(info).display !== "none") return "a phone has them on the clip";

// Reduced motion: nothing starts by itself, a press does.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await tap($("#svfeed-demo-again")); await wait(600);
const quiet = playing(), asked = $(".ui-svfeed-big")?.getAttribute("aria-label");
if (quiet === "" && asked) { await tap($(".ui-svfeed-big")); await wait(350); }
const pressed = playing();
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (quiet !== "") return "reduce motion: nothing starts: " + quiet;
if (asked !== "Play this clip") return "reduce motion: a button: " + asked;
if (pressed !== "0") return "reduce motion: a press plays: " + pressed;

// Saving data: only the next is kept, and it does not load ahead.
const had = Object.getOwnPropertyDescriptor(Navigator.prototype, "connection");
Object.defineProperty(Navigator.prototype, "connection", { configurable: true, get: () => ({ saveData: true }) });
await tap($("#svfeed-demo-again")); await wait(600);
const saved = [windowIs(), vid(1)?.getAttribute("preload")].join();
Object.defineProperty(Navigator.prototype, "connection", had);
if (saved !== "0,1,metadata") return "Save-Data: " + saved;

// A clip that cannot be played says so and offers the next.
await tap($("#svfeed-demo-bad")); await wait(600);
await tap(tool("Next clip")); await settle(); await wait(200);
if ($$(".ui-svfeed-slide")[1].querySelector(".ui-svfeed-bad p")?.textContent !== "This clip cannot be played.") return "a bad clip says so";
await tap($$(".ui-svfeed-slide")[1].querySelector(".ui-svfeed-bad .ui-svfeed-up")); await settle();
if (on() !== 2 || playing() !== "2") return "and offers the next: " + on() + " " + playing();

// Nothing usable.
if ($("#svfeed-demo-none").textContent !== "No clips yet.") return "nothing: " + $("#svfeed-demo-none").textContent;
