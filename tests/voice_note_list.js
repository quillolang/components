// mobile
await wait(300);
const box = $(".ui-voice-notes");
const audio = box.querySelector("audio");
const row = (id) => box.querySelector(`.ui-voice-notes-row[data-id="${id}"]`);
const play = (id) => row(id).querySelector(".ui-voice-notes-play");
const open = (id) => row(id).querySelector(".ui-voice-notes-open");
const player = () => box.querySelector(".ui-voice-notes-player");
const scrub = () => box.querySelector(".ui-voice-notes-scrub");
const times = () => [...box.querySelectorAll(".ui-voice-notes-times span")].map((s) => s.textContent).join(" ");
const log = () => $("#voice-notes-log").textContent;
const btn = (l) => box.querySelector(`.ui-voice-notes-btn[aria-label="${l}"]`);
const seeked = async () => { for (let i = 0; i < 40 && audio.seeking; i++) await wait(25); await wait(40); };

// Bad data: what can be listed, with a title.
const bad = $("#voice-notes-bad");
const lists = [...bad.querySelectorAll(".ui-voice-notes")];
if (lists[0].querySelector(".ui-voice-notes-none").textContent !== "No recordings yet.") return "an empty list";
const badNames = [...lists[1].querySelectorAll(".ui-voice-notes-title")].map((t) => t.textContent);
if (badNames.join() !== "Recording 1,No id") return "bad notes: " + badNames.join();
if (lists[1].querySelector(".ui-voice-notes-play").disabled !== true) return "no source, no play";
bad.remove();

// The rows: a title made from the time when there is none, words for when, lengths.
const titles = $$(".ui-voice-notes-title").map((t) => t.textContent);
if (titles.join("|") !== "Standup ideas|Recording, 31 Oct at 18:05|Old memo|Lost file") return "titles: " + titles.join("|");
const metas = $$(".ui-voice-notes-meta").map((t) => t.textContent);
if (metas.join("|") !== "Today 09:12 · Transcript|Yesterday 18:05|Wed 4 Mar · Transcript|24 Dec 2025") return "metas: " + metas.join("|");
const lens = () => $$(".ui-voice-notes-len").map((t) => t.textContent).join(" ");
if (lens() !== "0:04 0:09 1:05 1:02:05") return "lengths: " + lens();
if (!play(4).disabled) return "a note with no source cannot play";
if (player()) return "no player until a note is chosen";
if (audio.hasAttribute("src")) return "no audio is loaded for a list";

// Opening shows the player, loaded, not playing.
await tap(open(1));
await wait(100);
if (!player() || !audio.src.startsWith("data:audio/wav")) return "the player should open with the note";
if (!audio.paused) return "opening should not play";
if (row(1).getAttribute("aria-current") !== "true") return "the row is marked";
if (box.querySelector(".ui-voice-notes-name").textContent !== "Standup ideas") return "the player's title";
for (let i = 0; i < 40 && !audio.duration; i++) await wait(50);
if (audio.duration !== 4) return "the demo's audio: " + audio.duration;
await wait(60);
if (times() !== "0:00 0:04") return "times: " + times();

// The bar's touch rule and its slider.
if (getComputedStyle(scrub()).touchAction !== "pan-y") return "touch-action: " + getComputedStyle(scrub()).touchAction;
if (scrub().offsetHeight < 44) return "the bar is under 44: " + scrub().offsetHeight;
if (scrub().getAttribute("role") !== "slider" || scrub().getAttribute("aria-valuetext") !== "0:00 of 0:04") return "the slider: " + scrub().getAttribute("aria-valuetext");

// A tap on the bar goes there.
const barW = scrub().getBoundingClientRect().width;
await tap(scrub());
await seeked();
if (Math.abs(audio.currentTime - 2) > 0.1) return "a tap at the middle: " + audio.currentTime;
if (times() !== "0:02 0:04") return "after the tap: " + times();
if (scrub().getAttribute("aria-valuenow") !== "2") return "aria-valuenow: " + scrub().getAttribute("aria-valuenow");

// Mid-drag the bar follows, the time shows, and the audio stays until the release.
const fill = box.querySelector(".ui-voice-notes-fill"), thumb = box.querySelector(".ui-voice-notes-thumb");
const p = middle(scrub());
await fingers("touchStart", [p]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: p.x + barW * 0.05 * i, y: p.y }]); await wait(30); }
await wait(40);
const fillShare = () => new DOMMatrix(getComputedStyle(fill).transform).a;
const thumbShare = () => (thumb.getBoundingClientRect().left + thumb.offsetWidth / 2 - scrub().getBoundingClientRect().left) / barW;
if (Math.abs(fillShare() - 0.75) > 0.012) return "mid-drag fill: " + fillShare();
if (Math.abs(thumbShare() - 0.75) > 0.012) return "mid-drag thumb: " + thumbShare();
if (times() !== "0:03 0:04") return "mid-drag time: " + times();
if (Math.abs(audio.currentTime - 2) > 0.1) return "the audio should wait for the release: " + audio.currentTime;
if (!scrub().classList.contains("ui-voice-notes-held")) return "the thumb grows while held";

// State changing under the finger must leave the bar where the finger is: a new speed, then a new title.
const midSpeed = box.querySelector('.ui-voice-notes-keys .ui-voice-notes-btn[aria-label^="Speed"]');
midSpeed.click();
await wait(60);
if (midSpeed.textContent !== "1.5×") return "the state should have changed: " + midSpeed.textContent;
if (Math.abs(fillShare() - 0.75) > 0.012) return "a state change moved the fill: " + fillShare();
if (Math.abs(thumbShare() - 0.75) > 0.012) return "a state change moved the thumb: " + thumbShare();
midSpeed.click();
midSpeed.click();
await wait(60);
if (Math.abs(fillShare() - 0.75) > 0.012) return "more state changes moved the fill: " + fillShare();
// And the very value the bar shows: a seek under the finger changes it, and the finger still wins until it lifts.
const midSegs = [...box.querySelectorAll(".ui-voice-notes-seg")];
midSegs[0].click();
await wait(80);
if (Math.abs(fillShare() - 0.75) > 0.012) return "a seek under the finger moved the fill: " + fillShare();
if (Math.abs(thumbShare() - 0.75) > 0.012) return "a seek under the finger moved the thumb: " + thumbShare();
midSegs[1].click();
await wait(80);

// Cancelled: back to where it was.
await fingers("touchCancel", []);
await wait(100);
if (Math.abs(audio.currentTime - 2) > 0.1) return "a cancelled scrub moved: " + audio.currentTime;
if (Math.abs(fillShare() - 0.5) > 0.03) return "a cancelled scrub should go back: " + fillShare();
if (Math.abs(thumbShare() - 0.5) > 0.03) return "a cancelled scrub's thumb should go back: " + thumbShare();
if (times() !== "0:02 0:04") return "cancelled time: " + times();

// A real drag past the end stops at the end's edge of the bar.
await drag(scrub(), barW * 0.25, 0, 300);
await seeked();
if (Math.abs(audio.currentTime - 3) > 0.15) return "a drag to 75%: " + audio.currentTime;

// Up and down is the page's.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(open(4)), scrollY);
const before = audio.currentTime;
await drag(scrub(), 3, -120, 250);
await wait(60);
if (Math.abs(audio.currentTime - before) > 0.01) return "a vertical drag should not seek: " + audio.currentTime;
document.body.style.paddingBottom = "";
scrollTo(0, 0);
await wait(100);

// Keys.
const k = async (n) => { scrub().focus(); key(scrub(), n); await seeked(); };
await k("Home");
if (audio.currentTime !== 0) return "Home: " + audio.currentTime;
await k("ArrowRight");
if (Math.abs(audio.currentTime - 4) > 0.1 && audio.currentTime !== 0) return "ArrowRight, past the end, stops at it: " + audio.currentTime;
await k("Home");

// Play, by the row's button: it runs, says so, the lock screen knows it.
await tap(play(1));
await wait(300);
if (audio.paused || play(1).getAttribute("aria-pressed") !== "true") return "should be playing: " + audio.paused;
if (log() !== "play 1") return "on_play: " + log();
if (navigator.mediaSession.metadata?.title !== "Standup ideas") return "the lock screen: " + navigator.mediaSession.metadata?.title;
if (navigator.mediaSession.playbackState !== "playing") return "the lock screen's state: " + navigator.mediaSession.playbackState;
const t1 = audio.currentTime;
await wait(400);
if (audio.currentTime <= t1) return "the time should run";
const barNow = box.querySelector(".ui-voice-notes-keys .ui-voice-notes-play");
if (barNow.getAttribute("aria-pressed") !== "true") return "the player's button agrees";

// The other button pauses. The place shows on the row's line.
await tap(barNow);
await wait(100);
if (!audio.paused || play(1).getAttribute("aria-pressed") !== "false") return "should pause";
if (!row(1).querySelector(".ui-voice-notes-line")) return "the row shows how far";
const kept = audio.currentTime;

// Another note: one at a time, the first keeps its place.
await tap(play(2));
for (let i = 0; i < 40 && audio.paused; i++) await wait(50);
await wait(200);
if (audio.paused || play(1).getAttribute("aria-pressed") !== "false" || play(2).getAttribute("aria-pressed") !== "true") return "only the second should play";
if (Math.abs(audio.duration - 8) > 0.01) return "the second note's audio: " + audio.duration;
if (lens() !== "0:04 0:08 1:05 1:02:05") return "the audio's own length wins over the prop: " + lens();
await tap(play(2));
await wait(100);
await tap(play(1));
for (let i = 0; i < 40 && audio.paused; i++) await wait(50);
await wait(120);
if (audio.currentTime < kept - 0.05) return "the first note should go on from its place: " + audio.currentTime + " kept " + kept;
await tap(play(1));
await wait(100);

// Speed, kept across notes, and in the player's words.
const speed = () => box.querySelector('.ui-voice-notes-keys .ui-voice-notes-btn[aria-label^="Speed"]');
if (speed().textContent !== "1×") return "speed: " + speed().textContent;
await tap(speed());
if (audio.playbackRate !== 1.5 || speed().textContent !== "1.5×") return "1.5: " + audio.playbackRate;
await tap(speed());
if (audio.playbackRate !== 2) return "2: " + audio.playbackRate;

// The end: it stops, and starts over from the start next time.
await k("Home");
await tap(play(1));
for (let i = 0; i < 60 && !audio.paused; i++) await wait(100);
await wait(150);
if (!audio.paused || play(1).getAttribute("aria-pressed") !== "false") return "it should stop at the end";
if (times() !== "0:00 0:04") return "the end goes back to the start: " + times();
await tap(speed());
if (audio.playbackRate !== 1) return "back to 1: " + audio.playbackRate;

// Skips, kept inside the note.
await tap(btn("On 15 seconds"));
await seeked();
await tap(btn("Back 15 seconds"));
await seeked();
if (audio.currentTime !== 0) return "back 15 stops at the start: " + audio.currentTime;

// The transcript: in time order, a tap goes there, and the part spoken is marked.
const segs = () => [...box.querySelectorAll(".ui-voice-notes-seg")];
if (segs().map((s) => s.textContent).join("|") !== "0:00Morning, everyone.|0:02The build is green.") return "segments: " + segs().map((s) => s.textContent).join("|");
await tap(segs()[1]);
await seeked();
if (Math.abs(audio.currentTime - 2) > 0.1) return "a tap on a part: " + audio.currentTime;
if (segs()[1].getAttribute("aria-current") !== "true" || segs()[0].getAttribute("aria-current") !== "false") return "the part spoken";

// Plain text; and a slot waiting: the first ask refused, the second answered.
await tap(open(2));
await wait(150);
const ask = () => box.querySelector(".ui-voice-notes-ask");
if (ask().textContent !== "Get a transcript") return "the ask: " + ask()?.textContent;
await tap(ask());
if (ask().textContent !== "Try the transcript again") return "refused: " + ask()?.textContent;
await tap(ask());
await wait(100);
if (ask()) return "the ask should go while it waits";
if (box.querySelector(".ui-voice-notes-script .ui-voice-notes-say")?.textContent !== "Waiting for the transcript.") return "waiting: " + box.querySelector(".ui-voice-notes-script").textContent;
$("#voice-notes-deliver").click();
await wait(100);
if (box.querySelector(".ui-voice-notes-text")?.textContent !== "Buy stamps on the way home.") return "the transcript should arrive: " + box.querySelector(".ui-voice-notes-script").textContent;
if (ask()) return "the ask should leave";
if (!row(2).querySelector(".ui-voice-notes-meta").textContent.endsWith("· Transcript")) return "the row knows";

// Rename: focus at once, Enter saves, Escape leaves it, empty keeps it.
await tap(btn("Rename"));
const field = box.querySelector(".ui-voice-notes-field");
if (document.activeElement !== field || field.value !== "Recording, 31 Oct at 18:05") return "rename should focus the title: " + field.value;
type(field, "  Stamps  ");
key(field, "Enter");
await wait(80);
if (row(2).querySelector(".ui-voice-notes-title").textContent !== "Stamps" || log() !== "rename 2 Stamps") return "rename: " + log();
if (box.querySelector(".ui-voice-notes-name").textContent !== "Stamps" || !field.hidden) return "the player should show it";
await tap(btn("Rename"));
type(field, "Nope");
key(field, "Escape");
await wait(80);
if (box.querySelector(".ui-voice-notes-name").textContent !== "Stamps") return "Escape keeps it";
await tap(btn("Rename"));
type(field, "   ");
await tap(btn("Save title"));
if (box.querySelector(".ui-voice-notes-name").textContent !== "Stamps") return "an empty title keeps the old";

// A recording that will not play says so, and the rest goes on.
await tap(play(3));
for (let i = 0; i < 40 && !box.querySelector('.ui-voice-notes-say[data-bad]'); i++) await wait(50);
if (box.querySelector('.ui-voice-notes-say[data-bad]')?.textContent !== "This recording cannot be played.") return "a bad source: " + box.querySelector(".ui-voice-notes-player").textContent;
if (!play(3).disabled) return "its play should go off";
if (box.querySelector(".ui-voice-notes-text").textContent !== "Remember the keys.") return "its transcript still reads";
await wait(150);
await tap(play(1));
for (let i = 0; i < 40 && audio.paused; i++) await wait(50);
if (audio.paused) return "the next note should still play";
await tap(play(1));
await wait(100);

// Layout.
const l = box.querySelector(".ui-voice-notes-list").getBoundingClientRect(), pl = player().getBoundingClientRect();
if (device === "tablet") {
    if (pl.left < l.right) return "a tablet puts the player beside the list";
} else {
    if (pl.top < l.top + 10) return "a phone puts the player under the list";
    if (getComputedStyle(player()).position !== "sticky") return "the player stays in sight";
}
