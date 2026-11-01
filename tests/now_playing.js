// mobile
// A flick with its speed fixed by the events' own times, so a busy machine cannot slow it.
const flick = async (el, dx, dy = 0) => {
    const p = middle(el), t0 = Date.now() / 1000, steps = 5;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p], timestamp: t0 });
    for (let i = 1; i <= steps; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }], timestamp: t0 + i * 0.012 });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: t0 + 0.07 });
    await wait();
};
let audio = $("#nowp-demo");
const note = () => $("#nowp-demo-note").textContent;
const where = () => $(".ui-nowp-where").textContent;
const titleNow = () => $(".ui-nowp-title").textContent;
const btn = (name) => $(`.ui-nowp-btn[aria-label="${name}"]`);
const playBtn = () => $(".ui-nowp-play");
const session = navigator.mediaSession;
const artBox = () => $(".ui-nowp-art");
const stage = () => $(".ui-nowp-stage");

if (where() !== "1 of 4" || titleNow() !== "Harbour Lights" || $(".ui-nowp-artist").textContent !== "The Low Tides") return "the first track shows: " + where() + " " + titleNow();
if (session.metadata?.title !== "Harbour Lights" || session.metadata.artist !== "The Low Tides" || session.metadata.album !== "Salt") return "the media session has the track: " + session.metadata?.title;
if (!session.metadata.artwork[0].src.startsWith("data:image") || session.metadata.artwork[0].sizes !== "512x512") return "and its art";
if (getComputedStyle($(".ui-scrubbar-rail")).touchAction !== "none") return "a player's bar has no page to give way to: " + getComputedStyle($(".ui-scrubbar-rail")).touchAction;
if (audio.readyState < 1) { await wait(400); }

// Play, by a real tap.
await tap(playBtn());
await wait(350);
if (audio.paused) return "a tap plays";
if (playBtn().getAttribute("aria-label") !== "Pause") return "the button turns to Pause";
if (session.playbackState !== "playing") return "the session says playing: " + session.playbackState;
if (!note().startsWith("0 Harbour Lights playing at 1")) return "on_change: " + note();

// The speed goes round, and stays through a change of track.
const speedBtn = () => $('.ui-nowp-btn[aria-label^="Speed"]');
await tap(speedBtn());
if (speedBtn().textContent !== "1.25×" || audio.playbackRate !== 1.25) return "1.25: " + speedBtn().textContent + " " + audio.playbackRate;
await tap(speedBtn());
if (audio.playbackRate !== 1.5) return "1.5: " + audio.playbackRate;

// Next and Previous, as buttons.
await tap(btn("Next"));
await wait(300);
if (where() !== "2 of 4" || titleNow() !== "Night Ferry") return "Next: " + where();
if (session.metadata.title !== "Night Ferry") return "the session follows: " + session.metadata.title;
if (audio.paused) return "playing goes on";
if (audio.playbackRate !== 1.5) return "the speed stays: " + audio.playbackRate;
await tap(speedBtn()); await tap(speedBtn());
if (audio.playbackRate !== 1) return "round to the start: " + audio.playbackRate;
audio.currentTime = 6; await wait(150);
await tap(btn("Previous"));
await wait(150);
if (where() !== "2 of 4" || audio.currentTime > 1) return "past 3 s Previous is the start of this track: " + where() + " " + audio.currentTime;
await tap(btn("Previous"));
await wait(250);
if (where() !== "1 of 4") return "before 3 s it is the one before: " + where();
await tap(btn("Previous"));
await wait(150);
if (where() !== "1 of 4" || audio.currentTime > 1) return "the first has none before it: " + where();

// The art: a short drag springs back, one past a quarter goes on, a flick goes on.
const w = stage().clientWidth;
await drag(stage(), -Math.round(w * 0.15), 0, 500);
await wait(300);
if (where() !== "1 of 4") return "a short drag stays: " + where();
if (new DOMMatrix(getComputedStyle(artBox()).transform).e !== 0) return "and springs back: " + getComputedStyle(artBox()).transform;
await drag(stage(), -Math.round(w * 0.4), 0, 500);
await wait(350);
if (where() !== "2 of 4") return "past a quarter goes on: " + where();
await drag(stage(), Math.round(w * 0.4), 0, 500);
await wait(350);
if (where() !== "1 of 4") return "the other way goes back: " + where();
await flick(stage(), -70);
await wait(350);
if (where() !== "2 of 4") return "a flick goes on: " + where();
await flick(stage(), 70);
await wait(350);
if (where() !== "1 of 4") return "a flick goes back: " + where();
// At the end of the list it gives a little and stays.
const pm = middle(stage());
await fingers("touchStart", [pm]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: pm.x + i * 20, y: pm.y }]); await wait(16); }
await wait(60);
const given = new DOMMatrix(getComputedStyle(artBox()).transform).e;
if (Math.abs(given - 36) > 2) return "a third of the drag at the edge: " + given;
await fingers("touchEnd", []); await wait(350);
if (where() !== "1 of 4") return "nothing before the first";
// The system taking it springs back.
await fingers("touchStart", [pm]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: pm.x - i * 20, y: pm.y }]); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(350);
if (where() !== "1 of 4" || new DOMMatrix(getComputedStyle(artBox()).transform).e !== 0) return "a cancelled swipe stays: " + where();
// Going up or down on the art moves nothing.
await fingers("touchStart", [pm]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: pm.x + 2, y: pm.y - i * 15 }]); await wait(16); }
await fingers("touchEnd", []); await wait(300);
if (where() !== "1 of 4") return "an upward drag is no swipe";

// Held in mid-swipe while it plays: the time changes state, and the art stays with the finger.
if (audio.paused) { await audio.play(); await wait(150); }
await fingers("touchStart", [pm]);
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: pm.x - i * 15, y: pm.y }]); await wait(16); }
await wait(60);
const swiped = new DOMMatrix(getComputedStyle(artBox()).transform).e;
await wait(700);
const swipedLater = new DOMMatrix(getComputedStyle(artBox()).transform).e;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(350);
if (swiped === 0 || swipedLater !== swiped) return "playing moved the art under the finger: " + swipedLater + " from " + swiped;

// A track ending goes on by itself.
audio.currentTime = 13.8;
await wait(900);
if (where() !== "2 of 4") return "the next plays at the end: " + where();
await wait(300);
if (audio.paused) return "and plays";

// Space, on what is not a button.
key($(".ui-nowp-where"), " ");
await wait(150);
if (!audio.paused) return "Space pauses";
if (session.playbackState !== "paused") return "the session says paused";
if (playBtn().getAttribute("aria-label") !== "Play") return "the button goes back";

// The queue: on a phone behind a button, on a tablet beside the player.
const queue = () => $(".ui-nowp-queue");
const items = () => $$(".ui-nowp-item");
const cols = getComputedStyle($(".ui-nowp-wrap")).gridTemplateColumns.split(" ").length;
if (device === "phone") {
    if (cols !== 1 || getComputedStyle(queue()).display !== "none") return "a phone: one column, the queue behind a button: " + cols;
    await tap($(".ui-nowp-qbtn"));
    if (getComputedStyle(queue()).display === "none") return "the button shows it";
    if ($(".ui-nowp-qbtn").getAttribute("aria-pressed") !== "true") return "and says so";
    if (getComputedStyle(stage()).visibility !== "hidden") return "in place of the art";
    const qb = queue().getBoundingClientRect(), sb = stage().getBoundingClientRect();
    if (Math.abs(qb.top - sb.top) > 1 || Math.abs(qb.height - sb.height) > 1) return "the same place: " + qb.height + " " + sb.height;
} else {
    if (cols !== 2 || getComputedStyle(queue()).display === "none") return "a tablet: two columns, the queue always there: " + cols;
    if (getComputedStyle($(".ui-nowp-qbtn")).display !== "none") return "and no button for it";
    if (queue().getBoundingClientRect().left < stage().getBoundingClientRect().right) return "beside the art";
    if (getComputedStyle(stage()).visibility === "hidden") return "the art stays";
}
if (items().map((i) => i.querySelector("b").textContent).join() !== "Harbour Lights,Night Ferry,A Long Way Round,Static") return "the queue's names";
if (items()[1].getAttribute("aria-current") !== "true") return "the current one is marked";
await tap(items()[2].querySelector(".ui-nowp-jump"));
await wait(200);
if (where() !== "3 of 4" || titleNow() !== "A Long Way Round") return "a tap jumps: " + where();
if (device === "phone" && getComputedStyle(queue()).display !== "none") return "and the queue closes on a phone";
if (!audio.paused) return "a jump while paused stays paused";
if (device === "phone") await tap($(".ui-nowp-qbtn"));
// Removing one before the current keeps the current; removing the current goes on to the next.
await tap(items()[0].querySelector('[aria-label^="Remove"]'));
await wait(200);
if (where() !== "2 of 3" || titleNow() !== "A Long Way Round") return "removing one before: " + where() + " " + titleNow();
await tap(items()[1].querySelector('[aria-label^="Remove"]'));
await wait(300);
if (where() !== "2 of 2" || titleNow() !== "Static") return "removing this one: " + where() + " " + titleNow();
if (device === "phone") await tap($(".ui-nowp-qbtn"));

// A track that cannot be played says so. It is the last, so Next is off.
await wait(300);
if (!$(".ui-nowp-said").textContent.includes("cannot be played")) return "a bad track says so: " + $(".ui-nowp-said").textContent;
if (!btn("Next").disabled) return "Next is off on the last";

// A new queue from the page, without the current: its first, not playing.
await tap($("#nowp-demo-swap"));
await wait(300);
if (where() !== "1 of 2" || titleNow() !== "Night Ferry") return "a new queue: " + where() + " " + titleNow();

// Tie to the media session: each action, by the handlers the page gave.
await tap($("#nowp-demo-again")); await wait(300);
const hands = {};
const realSet = session.setActionHandler.bind(session);
session.setActionHandler = (k, f) => { hands[k] = f; if (k === "seekforward") throw new TypeError("not on this system"); realSet(k, f); };
await tap($("#nowp-demo-again")); await wait(400);
audio = $("#nowp-demo");
delete session.setActionHandler;
for (const k of ["play", "pause", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"]) if (!hands[k]) return "the session gets " + k;
if (session.metadata.title !== "Night Ferry") return "the session has the first of the queue: " + session.metadata?.title;
let pos = null;
const realPos = session.setPositionState.bind(session);
session.setPositionState = (s) => { pos = s; realPos(s); };
await wait(300);
hands.play({ action: "play" }); await wait(350);
if (audio.paused) { delete session.setPositionState; return "the lock screen's play plays"; }
hands.seekto({ action: "seekto", seekTime: 9 }); await wait(250);
if (Math.abs(audio.currentTime - 9) > 0.4) { delete session.setPositionState; return "seekto: " + audio.currentTime; }
if (pos == null || pos.duration !== 14 || Math.abs(pos.position - 9) > 0.4 || pos.playbackRate !== 1) { delete session.setPositionState; return "the position is told: " + JSON.stringify(pos); }
hands.seekforward({ action: "seekforward", seekOffset: 2 }); await wait(250);
if (Math.abs(audio.currentTime - 11) > 0.5) { delete session.setPositionState; return "seekforward: " + audio.currentTime; }
hands.seekbackward({ action: "seekbackward" }); await wait(250);
if (audio.currentTime > 1) { delete session.setPositionState; return "seekbackward, 15 s with no offset: " + audio.currentTime; }
hands.nexttrack({ action: "nexttrack" }); await wait(300);
if (where() !== "2 of 2") { delete session.setPositionState; return "nexttrack: " + where(); }
hands.previoustrack({ action: "previoustrack" }); await wait(300);
if (where() !== "1 of 2") { delete session.setPositionState; return "previoustrack: " + where(); }
hands.pause({ action: "pause" }); await wait(200);
delete session.setPositionState;
if (!audio.paused) return "the lock screen's pause pauses";

// The last track ending: on_end, and no more.
await tap(btn("Next")); await wait(300);
await tap(playBtn()); await wait(300);
audio.currentTime = 13.8;
await wait(900);
if (!note().includes("ended 1")) return "on_end: " + note();
if (where() !== "2 of 2") return "stays on the last: " + where();

// A device that wants a tap first.
const realPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(playBtn()); await wait(200);
HTMLMediaElement.prototype.play = realPlay;
if (!$(".ui-nowp-said").textContent.includes("press play")) return "a refusal says so: " + $(".ui-nowp-said").textContent;
if (playBtn().getAttribute("aria-label") !== "Play") return "and the button stays Play";

// Turning keeps the track and the time.
audio.currentTime = 5; await wait(200);
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(250);
const after = [where(), Math.round(audio.currentTime), getComputedStyle($(".ui-nowp-wrap")).gridTemplateColumns.split(" ").length];
const artLeft = stage().getBoundingClientRect().left < $(".ui-nowp-ctrl").getBoundingClientRect().left;
const fits = $(".ui-nowp").scrollHeight <= $(".ui-nowp").clientHeight + 1;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (after.join() !== "2 of 2,5,2") return "turned: " + after.join();
if (device === "phone" && !artLeft) return "a phone on its side has the art beside the controls";
if (!fits) return "turned, it fits";

// The sleep timer is there and works its element.
await tap($(".ui-sleept-open")); await wait(100);
if (!$(".ui-sleept-sheet").open) return "Sleep opens its sheet";
await tap($(".ui-sleept-close"));

// Close.
await tap(btn("Close player"));
if (!note().includes("closed 1")) return "on_close: " + note();

// No session on this browser: it says so, and the player still works.
const had = Object.getOwnPropertyDescriptor(Navigator.prototype, "mediaSession");
Object.defineProperty(Navigator.prototype, "mediaSession", { configurable: true, get: () => undefined });
await tap($("#nowp-demo-again")); await wait(400);
const told = $$(".ui-nowp-said").map((p) => p.textContent).join();
const stillPlays = (await (async () => { await tap(playBtn()); await wait(300); return !$("#nowp-demo").paused; })());
Object.defineProperty(Navigator.prototype, "mediaSession", had);
$("#nowp-demo").pause();
if (!told.includes("no lock-screen controls")) return "no session: it says so: " + told;
if (!stillPlays) return "no session: it plays";

// An empty queue, and props that make no sense.
const none = $("#nowp-demo-none");
if (none.querySelector(".ui-nowp-title").textContent !== "Nothing playing" || !none.querySelector(".ui-nowp-play").disabled) return "nothing to play";
if (none.querySelector('[aria-label^="Speed"]') || none.querySelector(".ui-sleept-open")) return "one speed and no sleep hide their buttons";
