// mobile
const frame = $("#story-viewer-demo");
const dlg = $("#story-viewer-live");
const open = frame.querySelector(".ui-story-viewer-open");
const stage = dlg.querySelector(".ui-story-viewer-stage");
const status = () => dlg.querySelector("[role=status]").textContent;
const note = $("#story-viewer-note");
const seen = () => note.textContent.replace("Seen: ", "").trim();
const closed = () => +note.dataset.closed;
const nextZ = dlg.querySelector(".ui-story-viewer-next"), backZ = dlg.querySelector(".ui-story-viewer-back");
const fill = () => { const s = dlg.querySelector(".ui-story-viewer-seg:not(.ui-story-viewer-seg-done):not(.ui-story-viewer-seg-todo) i"); return s ? +(s.style.transform.match(/scaleX\(([\d.]+)\)/)?.[1] ?? 0) : -1; };
frame.scrollIntoView({ block: "end" }); await wait(120);

if (dlg.open) return "it starts open";
await tap(open); await wait(120);
if (!dlg.open) return "the button did not open it";
if (status() !== "Ana Silva, 1 of 3") return "it should start on Ana's first: " + status();
if (dlg.querySelectorAll(".ui-story-viewer-seg").length !== 3) return "three segments, found " + dlg.querySelectorAll(".ui-story-viewer-seg").length;
const f0 = dlg.getBoundingClientRect();
if (Math.abs(f0.width - frame.clientWidth) > 2) return "with modal off it should fill its frame";
if (getComputedStyle(stage).touchAction !== "none") return "the whole stage is gestures";

// It preloads what comes next: the two pictures ahead and the next person's.
const ahead = [...dlg.querySelectorAll(".ui-story-viewer-ahead img")];
if (ahead.length !== 2) return "two pictures ahead of the first, found " + ahead.length;
if (!decodeURIComponent(ahead[0].src).includes("Noon") || !decodeURIComponent(ahead[1].src).includes("Lift")) return "the wrong ones are fetched ahead";
if (dlg.querySelector(".ui-story-viewer-ahead video") === null) return "the next video is not fetched ahead";

// It runs: the bar fills and goes on by itself after a second and a half.
const a = fill(); await wait(400); const b = fill();
if (!(b > a) || b >= 1) return `the segment did not fill: ${a} to ${b}`;
if (status() !== "Ana Silva, 1 of 3") return "it went on too soon";
await wait(1300);
if (status() !== "Ana Silva, 2 of 3") return "it did not go on by itself: " + status();
if (!dlg.querySelectorAll(".ui-story-viewer-seg")[0].classList.contains("ui-story-viewer-seg-done")) return "the first segment should be full";

// Held: it stops, and the bar stays, and letting go is not a tap.
{
    const r = nextZ.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await fingers("touchStart", [{ x, y }]);
    await wait(120);
    const h0 = fill();
    await wait(600);
    const h1 = fill();
    if (Math.abs(h1 - h0) > 0.02) return `held, it should stop: ${h0} to ${h1}`;
    if (!dlg.classList.contains("ui-story-viewer-held")) return "held, the top should hide";
    await fingers("touchEnd", []); await wait(120);
    if (status() !== "Ana Silva, 2 of 3") return "letting go of a hold counted as a tap: " + status();
    if (fill() < h1 - 0.02) return "a hold lost its place";
}

// A tap on the right goes on, on the left goes back.
await tap(nextZ); await wait(100);
if (status() !== "Ana Silva, 3 of 3") return "a tap on the right: " + status();
await tap(backZ); await wait(100);
if (status() !== "Ana Silva, 2 of 3") return "a tap on the left: " + status();
if (fill() > 0.3) return "going back starts the item again: " + fill();
await tap(backZ); await wait(60);
await tap(backZ); await wait(60);
if (status() !== "Ana Silva, 1 of 3") return "back at the very start, it stays: " + status();
await tap(nextZ); await tap(nextZ); await wait(60);
// The next person, past the one with nothing to show.
await tap(nextZ); await wait(120);
if (status() !== "Ben Oduya, 1 of 2") return "a story with nothing to show should be left out: " + status();
if (dlg.querySelectorAll(".ui-story-viewer-seg").length !== 2) return "Ben has two segments";
await tap(backZ); await wait(100);
if (status() !== "Ana Silva, 3 of 3") return "back from a person's first goes to the last person's last: " + status();
await tap(nextZ); await wait(100);

// A swipe sideways: short springs back, far goes to a person, a flick too.
await drag(stage, -40, 0, 500); await wait(60);
if (stage.style.transform !== "" || status() !== "Ben Oduya, 1 of 2") return "a short swipe should spring back: " + status();
await drag(stage, -200, 0, 200); await wait(100);
if (status() !== "Cleo, 1 of 1") return "a swipe left is the next person: " + status();
await drag(stage, 200, 0, 200); await wait(100);
if (status() !== "Ben Oduya, 1 of 2") return "a swipe right is the last person: " + status();
await drag(stage, 70, 0, 30); await wait(100);
if (status() !== "Ana Silva, 1 of 3") return "a flick right: " + status();

// A swipe down: short springs back.
await drag(stage, 0, 70, 500); await wait(80);
if (!dlg.open || stage.style.transform !== "") return "a short swipe down should spring back";
if (dlg.style.getPropertyValue("--ui-story-viewer-dim") !== "") return "the dimming stayed";
// While going down it follows the finger and pauses.
{
    const r = stage.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await fingers("touchStart", [{ x, y }]);
    for (const d of [20, 50, 80]) { await fingers("touchMove", [{ x, y: y + d }]); await wait(30); }
    await wait(50);
    if (!stage.style.transform.startsWith("translateY(80px)")) return "it should follow the finger: " + stage.style.transform;
    // Cancelled by the system: back it comes.
    await fingers("touchCancel", []); await wait(100);
    if (stage.style.transform !== "" || !dlg.open) return "a cancelled swipe should spring back";
    if (dlg.classList.contains("ui-story-viewer-held")) return "a cancelled swipe left it paused";
}
const c0 = closed();
await drag(stage, 0, 240, 250); await wait(120);
if (dlg.open) return "a long swipe down should leave";
if (closed() !== c0 + 1) return "on_close: " + closed();
if (document.activeElement !== open) return "focus should go back to the button";

// A flick down leaves too.
await tap(open); await wait(120);
await drag(stage, 0, 60, 30); await wait(120);
if (dlg.open) return "a flick down should leave";

// Keys and buttons: all of it without a gesture.
await tap(open); await wait(120);
{
    const e = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true });
    dlg.dispatchEvent(e);
    if (!e.defaultPrevented) return "ArrowRight was not stopped at once";
}
await wait(60);
if (status() !== "Ana Silva, 2 of 3") return "ArrowRight: " + status();
key(dlg, "ArrowLeft"); await wait(60);
if (status() !== "Ana Silva, 1 of 3") return "ArrowLeft: " + status();
key(dlg, "ArrowDown"); await wait(60);
if (status() !== "Ben Oduya, 1 of 2") return "ArrowDown: " + status();
key(dlg, "ArrowUp"); await wait(60);
if (status() !== "Ana Silva, 1 of 3") return "ArrowUp: " + status();
const pause = dlg.querySelector("[aria-label=Pause]");
await tap(pause); await wait(80);
if (pause.getAttribute("aria-label") !== "Play" || pause.getAttribute("aria-pressed") !== "true") return "the pause button";
{ const p0 = fill(); await wait(400); if (Math.abs(fill() - p0) > 0.02) return "paused, it ran on"; }
key(dlg, " "); await wait(100);
if (pause.getAttribute("aria-label") !== "Pause") return "Space should play again";
key(dlg, " "); await wait(60);
key(dlg, " "); await wait(60);
nextZ.focus(); nextZ.click(); await wait(80);
if (status() !== "Ana Silva, 2 of 3") return "the zone is a button for keys too: " + status();
key(dlg, "Escape"); await wait(100);
if (dlg.open) return "Escape should leave";

// A picture that cannot load says so and moves on.
await tap(open); await wait(150);
dlg.querySelector(".ui-story-viewer-media img").dispatchEvent(new Event("error")); await wait(120);
if (!dlg.textContent.includes("This one could not be loaded. The bridge at dawn")) return "a broken picture should say so";
await wait(1600);
if (status() !== "Ana Silva, 2 of 3") return "a broken picture should not stop it: " + status();
key(dlg, "ArrowDown"); await wait(60);
// Ben's first says "soon" for its seconds, so it has the default, a second and a half.
await wait(1000);
if (status() !== "Ben Oduya, 1 of 2") return "it went on too soon: " + status();
await wait(750);
// The video runs for its own length of a second, not for seconds, and the clock waits for it.
if (status() !== "Ben Oduya, 2 of 2") return "to the video: " + status();
const v = dlg.querySelector(".ui-story-viewer-media video");
if (!v) return "the video is not shown";
if (!v.muted) return "the video should really be muted, or a phone will not start it";
await wait(350);
if (v.paused) return "the video should play";
if (!(fill() > 0.1)) return "the video's bar: " + fill();
await tap(pause); await wait(100);
if (!v.paused) return "pause should pause the video";
await tap(pause); await wait(100);
await wait(1100);
if (status() !== "Cleo, 1 of 1") return "the video's end should go on: " + status();
if (dlg.querySelector(".ui-story-viewer-ahead img, .ui-story-viewer-ahead video")) return "at the last story, nothing should stay fetched ahead";
// After the last it leaves by itself.
const c1 = closed();
await wait(1800);
if (dlg.open || closed() !== c1 + 1) return "the last story should leave";
if (!seen().startsWith("ana0 ana1")) return "on_seen: " + seen();
if (!seen().endsWith("ben1 cleo0")) return "on_seen at the end: " + seen();

// Open from the start of the page, and left by the person: it stays closed with `open` still true.
{
    const m = $("#story-viewer-load");
    if (!m.open) return "open={true} at load should show it";
    if (m.querySelector("[role=status]").textContent !== "Cleo, 1 of 1") return "at load: " + m.querySelector("[role=status]").textContent;
    key(m, "Escape"); await wait(300);
    if (m.open) return "closed with open still true, it came straight back";
}

// Opened from state, as the real thing: <dialog> over the page, on the story asked for.
{
    const m = $("#story-viewer-modal");
    $("#story-viewer-state").click(); await wait(200);
    if (!m.open || !m.matches(":modal")) return "open={...} should show it as a modal";
    if (m.querySelector("[role=status]").textContent !== "Ben Oduya, 1 of 2") return "start={2} counts the stories as given: " + m.querySelector("[role=status]").textContent;
    key(m, "Escape"); await wait(150);
    if (m.open) return "Escape should leave the modal";
    await wait(250);
    if (m.open) return "on_close should have settled it, not opened it again";
    $("#story-viewer-state").click(); await wait(200);
    if (!m.open) return "it should open a second time";
    key(m, "Escape"); await wait(200);
}

// Turned: where it was stays.
await tap(open); await wait(150);
key(dlg, "ArrowRight"); await wait(80);
await tap(dlg.querySelector("[aria-label=Pause]")); await wait(80);
{
    const [w, h] = [innerWidth, innerHeight];
    await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(300);
    const still = status(), up = dlg.open;
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (!up || still !== "Ana Silva, 2 of 3") return "turning the screen lost its place: " + still;
    if (dlg.querySelector("[aria-label=Play]") === null) return "turning the screen lost the pause";
}
key(dlg, "Escape"); await wait(120);

// On a tablet the story keeps its shape, with the people's arrows beside it.
await tap(open); await wait(150);
const arrow = dlg.querySelector(".ui-story-viewer-arrow-next");
if (device === "tablet") {
    const s = stage.getBoundingClientRect(), d = dlg.getBoundingClientRect();
    if (s.width >= d.width - 100) return `on a tablet the story should not fill the width: ${s.width} of ${d.width}`;
    if (Math.abs(s.height / s.width - 16 / 9) > 0.03) return "on a tablet it should keep 9:16: " + s.width + "x" + s.height;
    if (getComputedStyle(arrow).display === "none") return "the arrows should show on a tablet";
    await tap(arrow); await wait(100);
    if (status() !== "Ben Oduya, 1 of 2") return "the arrow: " + status();
} else {
    if (getComputedStyle(arrow).display !== "none") return "a phone has no room for the arrows";
}
key(dlg, "Escape"); await wait(100);
if (dlg.open) return "it should be closed at the end";
