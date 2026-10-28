const [list, sounds] = $$(".ui-playlist");
if (!list || !sounds) return "expected two playlists";
if (list.getAttribute("role") !== "region" || list.getAttribute("aria-label") !== "Late Night Tapes") return "the playlist is not a named region";
if (list.querySelector(".ui-playlist-total").textContent !== "5 tracks · 20:02") return `the total reads ${list.querySelector(".ui-playlist-total").textContent}`;
const rows = () => [...list.querySelectorAll(".ui-playlist-track")];
if (rows().length !== 5) return `expected 5 tracks, found ${rows().length}`;
const lens = rows().map((r) => r.querySelector(".ui-playlist-len").textContent);
if (lens.join() !== "3:34,3:07,4:22,3:18,5:41") return `the lengths: ${lens}`;
if (rows()[1].getAttribute("aria-current") !== "true" || rows()[0].hasAttribute("aria-current")) return "playing={1} does not mark the second";
if (!rows()[1].querySelector(".ui-playlist-bars") || rows()[0].querySelector(".ui-playlist-n").textContent !== "1") return "the marked track shows no bars, or numbers are missing";
if (rows()[1].getAttribute("aria-label") !== "2. The Quiet Part, Lyra, 3:07 (playing)") return `the marked track is named ${rows()[1].getAttribute("aria-label")}`;
if (list.querySelector(".ui-playlist-play")) return "a list without sources has a play button";
rows()[3].click(); await wait();
if (rows()[3].getAttribute("aria-current") !== "true" || rows()[1].hasAttribute("aria-current")) return "clicking does not move the mark";
if ($("#playlist-demo-note").textContent !== "Picked track 4: Salt.") return `on_pick: ${$("#playlist-demo-note").textContent}`;
const play = sounds.querySelector(".ui-playlist-play");
if (!play || play.getAttribute("aria-label") !== "Play") return "a list with sources has no play button";
// Headless Chrome will not play sound without a real click: picking is tested by the source it
// sets, and moving on by the element's own events.
const audio = sounds.querySelector("audio");
const srows = () => [...sounds.querySelectorAll(".ui-playlist-track")];
srows()[0].click(); await wait(300);
if (!audio.src.endsWith("t-rex-roar.mp3") || srows()[0].getAttribute("aria-current") !== "true") return "picking a track with src does not load it";
audio.dispatchEvent(new Event("play")); await wait();
if (play.getAttribute("aria-label") !== "Pause" || !sounds.classList.contains("ui-playlist-on")) return "playing is not shown";
audio.dispatchEvent(new Event("ended")); await wait(300);
if (srows()[1].getAttribute("aria-current") !== "true") return "the next track does not follow when one ends";
audio.dispatchEvent(new Event("pause")); await wait();
if (play.getAttribute("aria-label") !== "Play" || sounds.classList.contains("ui-playlist-on")) return "pausing is not shown";
