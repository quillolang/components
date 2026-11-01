// mobile
const a = $("#voice-message-a"), b = $("#voice-message-b"), c = $("#voice-message-c");
const au = (r) => r.querySelector("audio"), wave = (r) => r.querySelector("[role=slider]");
const play = (r) => r.querySelector(".ui-voice-message-play"), speed = (r) => r.querySelector(".ui-voice-message-speed");
const note = () => $("#voice-message-note").textContent;
const dot = (r) => r.querySelector(".ui-voice-message-dot");
const foot = (r) => r.querySelector(".ui-voice-message-foot").textContent;
await wait(500);

// The waveform measured from the sound: half a second of nothing, a second of tone, half a second of nothing.
const heights = (r) => [...r.querySelectorAll(".ui-voice-message-bars:not(.ui-voice-message-over) i")].map((i) => parseInt(i.style.height));
const hs = heights(a);
if (hs.length !== 36) return "36 bars, found " + hs.length;
if (hs[4] !== 8 || hs[31] !== 8) return "the silence should be the smallest bar: " + hs.join();
if (hs[10] !== 100 || hs[18] !== 100 || hs[25] !== 100) return "the tone should be the loudest: " + hs.join();
// Peaks given: stretched to the bars, bad ones as nothing, and 2 held to 1.
if (heights(b).join() !== "20,90,100,40,8,70,100") return "given peaks: " + heights(b).join();

// Lengths, from the sound, and what is told when there is no sound.
if (au(a).duration !== 2) return "the clip should be 2 s: " + au(a).duration;
if (!foot(a).includes("0:02") || !foot(a).includes("Ana Silva") || !foot(a).includes("09:41")) return "the line under it: " + foot(a);
if (wave(a).getAttribute("aria-valuetext") !== "0:00 of 0:02") return "the slider says " + wave(a).getAttribute("aria-valuetext");
if (!foot(c).includes("1:15") || !play(c).disabled) return "with no sound: " + foot(c);
if (!dot(a) || dot(b)) return "the dot should be on what was not heard";
// With no `seconds`, the length comes from the sound, which may have loaded before the component started.
{
    const d = $("#voice-message-d");
    if (wave(d).getAttribute("aria-valuetext") !== "0:00 of 0:02" || !foot(d).includes("0:02")) return "the length from the sound: " + wave(d).getAttribute("aria-valuetext");
}

// A tap on the waveform seeks: at the middle of the bars, a second in.
await tap(wave(a)); await wait(100);
if (Math.abs(au(a).currentTime - 1) > 0.02) return "a tap at the middle should seek to 1 s: " + au(a).currentTime;
if (wave(a).getAttribute("aria-valuenow") !== "1") return "aria-valuenow: " + wave(a).getAttribute("aria-valuenow");
if (getComputedStyle(wave(a)).touchAction !== "pan-y") return "the waveform should leave up and down to the page";

// A drag: from the middle a quarter of the way along.
const w = wave(a).getBoundingClientRect().width;
const cue = (r) => r.querySelector(".ui-voice-message-wave").style.getPropertyValue("--ui-voice-message-at");
await drag(wave(a), w / 4, 0, 200);
if (Math.abs(au(a).currentTime - 1.5) > 0.03) return "a drag a quarter along should reach 1.5 s: " + au(a).currentTime;
if (cue(a) !== "75%") return "the drawing should be at 75%: " + cue(a);
// Past the end it stops at the end.
await drag(wave(a), -w * 2, 0, 200);
if (au(a).currentTime !== 0 || cue(a) !== "0%") return "dragged past the start: " + au(a).currentTime;
// Up and down leaves it alone.
await tap(wave(a)); await wait(50);
await drag(wave(a), 0, 60, 150);
if (Math.abs(au(a).currentTime - 1) > 0.02) return "a vertical drag sought: " + au(a).currentTime;
// A cancelled scrub goes back to where it was.
{
    const r = wave(a).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    await fingers("touchStart", [{ x, y }]);
    for (const d of [20, 40, 60]) { await fingers("touchMove", [{ x: x + d, y }]); await wait(30); }
    await fingers("touchCancel", []); await wait(100);
    if (cue(a) !== "50%" || Math.abs(au(a).currentTime - 1) > 0.02) return "a cancelled scrub: " + cue(a);
}
if (dot(a) === null) return "seeking is not hearing";

// Speed: 1, 1.5, 2, and round.
if (speed(a).textContent !== "1×") return "speed starts at " + speed(a).textContent;
await tap(speed(a));
if (speed(a).textContent !== "1.5×" || au(a).playbackRate !== 1.5 || note() !== "Speed 1.5") return "one press of speed: " + speed(a).textContent;
await tap(speed(a));
if (speed(a).textContent !== "2×" || au(a).playbackRate !== 2) return "two presses of speed";
await tap(speed(a));
if (speed(a).textContent !== "1×" || au(a).playbackRate !== 1) return "three presses of speed";

// Playing past the half marks it heard, once; at the end it goes back to the start.
await tap(wave(a)); await wait(50);
au(a).currentTime = 0.9; await wait(50);
await tap(play(a));
if (play(a).getAttribute("aria-label") !== "Pause") return "it did not start: " + (a.querySelector("[role=status]").textContent);
await wait(500);
if (dot(a)) return "past half way, the dot should go";
if (note() !== "Heard") return "on_played: " + note();
await wait(1000);
if (play(a).getAttribute("aria-label") !== "Play") return "it did not stop at the end";
if (au(a).currentTime !== 0 || cue(a) !== "0%") return "at the end it should go back to the start: " + au(a).currentTime;
if (!foot(a).includes("0:02")) return "at rest it shows the whole length: " + foot(a);

// One at a time.
au(a).currentTime = 0;
await tap(play(a)); await wait(200);
await tap(play(b)); await wait(200);
if (!au(a).paused) return "two are playing";
if (au(b).paused) return "the second did not play";
if (play(a).getAttribute("aria-label") !== "Play") return "the first still says Pause";
// A sound elsewhere on the page stops it too.
const other = new Audio(au(a).src); other.volume = 0; document.body.append(other);
await other.play(); await wait(150);
if (!au(b).paused) return "another sound on the page did not stop it";
other.pause(); other.remove();

// Keys on the slider: five seconds on, held to the ends.
const s = wave(b);
au(b).currentTime = 0;
key(s, "ArrowRight"); await wait(60);
if (au(b).currentTime !== 4) return "ArrowRight is held to the end of a clip of 4 s: " + au(b).currentTime;
key(s, "Home"); await wait(60);
if (au(b).currentTime !== 0) return "Home: " + au(b).currentTime;
key(s, "End"); await wait(60);
key(s, "ArrowLeft"); await wait(60);
if (au(b).currentTime !== 0) return "ArrowLeft is held to the start: " + au(b).currentTime;
key(s, " "); await wait(250);
if (au(b).paused) return "Space should play";
key(s, "Enter"); await wait(150);
if (!au(b).paused) return "Enter should pause";

// A browser's refusal is said, not thrown.
const real = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(play(a)); await wait(150);
HTMLMediaElement.prototype.play = real;
if (a.querySelector("[role=status]").textContent !== "This message cannot be played here.") return "a refused play: " + a.querySelector("[role=status]").textContent;
await tap(play(a)); await wait(150);
if (a.querySelector("[role=status]").textContent !== "") return "the word stayed after it played";
au(a).pause();
