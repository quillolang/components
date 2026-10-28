// Headless Chrome will not play sound without a real click, so playback is not tested here:
// the controls, seeking, speeds, and the state that follows the element's own events are.
const [main, compact, plain] = $$(".ui-audio-player");
if (!main || !compact || !plain) return "expected three players";
if (main.getAttribute("role") !== "region" || main.getAttribute("aria-label") !== "T. rex roar") return "the player is not a named region";
if (!main.querySelector(".ui-audio-player-title")?.textContent.includes("T. rex roar") || !main.querySelector(".ui-audio-player-artist")?.textContent.includes("MDN")) return "the title or artist is missing";
const a = main.querySelector("audio");
if (!a || !a.src.endsWith("t-rex-roar.mp3")) return "the audio element is missing";
main.scrollIntoView({ block: "center" });
const times = () => [...main.querySelectorAll(".ui-audio-player-time")].map((t) => t.textContent.trim());
for (let i = 0; i < 80 && times()[1] === "0:00"; i++) await wait(150);
if (!/^0:0[1-9]$/.test(times()[1])) return `the duration reads "${times()[1]}" (the sample is from mdn.github.io)`;
const seek = main.querySelector(".ui-audio-player-seek");
if (seek.getAttribute("aria-label") !== "Seek" || seek.disabled || +seek.max < 1) return "the seek bar is not ready";
type(seek, "1"); await wait(400);
if (Math.abs(a.currentTime - 1) > 0.3 || times()[0] !== "0:01") return `seeking to 1 gave ${a.currentTime}, "${times()[0]}"`;
if (!seek.getAttribute("aria-valuetext").startsWith("0:01 of 0:0")) return "the seek bar does not say the time";
const speed = main.querySelector(".ui-audio-player-speed");
if (speed.textContent !== "1×" || a.playbackRate !== 1) return "the speed does not start at 1×";
speed.click(); await wait();
if (speed.textContent !== "1.25×" || a.playbackRate !== 1.25 || speed.getAttribute("aria-label") !== "Speed: 1.25×") return `one click gives ${speed.textContent} / ${a.playbackRate}`;
speed.click(); speed.click(); speed.click(); await wait();
if (speed.textContent !== "1×" || a.playbackRate !== 1) return "the speeds do not cycle back to 1×";
const play = main.querySelector(".ui-audio-player-play");
if (play.getAttribute("aria-label") !== "Play") return "the play button is not named";
// A click asks the element to play; refused here, it stays Play, with no error on the page.
play.click(); await wait(400);
if (a.paused && play.getAttribute("aria-label") !== "Play") return "a refused play still says Pause";
// The element's own events drive the state.
a.dispatchEvent(new Event("play")); await wait();
if (play.getAttribute("aria-label") !== "Pause") return "while playing the button does not say Pause";
a.dispatchEvent(new Event("ended")); await wait();
if ($("#audio-player-demo-note").textContent !== "Ended 1 times." || play.getAttribute("aria-label") !== "Play") return `after the end: ${$("#audio-player-demo-note").textContent}`;
if (compact.querySelector(".ui-audio-player-title")) return "compact still shows the title";
if (compact.querySelector(".ui-audio-player-speed").textContent !== "1×") return "custom speeds do not start at the first";
compact.querySelector(".ui-audio-player-speed").click(); await wait();
if (compact.querySelector(".ui-audio-player-speed").textContent !== "2×") return "custom speeds are not used";
if (plain.querySelector(".ui-audio-player-speed")) return "speeds [] still shows the button";
