// mobile
const audio = $("#lyrics-demo-audio");
const box = $(".ui-lyrics-scroll"), lines = () => [...box.querySelectorAll(".ui-lyrics-line")];
const lit = () => lines().findIndex((b) => b.getAttribute("aria-current") === "true");
const offset = (b) => b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2 - box.getBoundingClientRect().top - box.clientHeight / 2;
const settled = async () => { let was = -1; for (let i = 0; i < 40; i++) { await wait(60); if (box.scrollTop === was) return; was = box.scrollTop; } };

// LRC, worked by hand: [offset:+500] brings each stamp half a second earlier, 00:11.50 and
// 00:12.50 are one line twice, the blank at 8.5 is a pause.
if (lines().length !== 14) return "fourteen lines: " + lines().length;
const words = lines().map((b) => b.textContent);
if (words[0] !== "Harbour lights across the water" || words[4] !== "..." || words[6] !== "Hold it steady, hold it long" || words[7] !== words[6]) return "lines in time order: " + words.join("|");
if (lines()[4].getAttribute("aria-label") !== "A pause in the words") return "a pause has a name";
if ($(".ui-lyrics-side strong").textContent !== "Harbour Lights" || $(".ui-lyrics-side span").textContent !== "The Low Tides") return "[ti:] and [ar:] show: " + $(".ui-lyrics-side").textContent;

// Lit by time. At 0 the first (stamp 0.0) is lit; the line starts in the middle, with nothing moved.
if (lit() !== 0) return "the first line is lit: " + lit();
if (Math.abs(offset(lines()[0])) > 2) return "the first line is in the middle: " + offset(lines()[0]);
if (audio.readyState < 1) { audio.load(); await wait(300); }
audio.currentTime = 4.2;
await wait(300); await settled();
if (lit() !== 2) return "4.2 s is the third line (stamp 4.0): " + lit();
if (Math.abs(offset(lines()[2])) > 3) return "it is centred: " + offset(lines()[2]);
audio.currentTime = 11.2;
await wait(300); await settled();
if (lit() !== 6) return "11.2 s: " + lit();
// Going on by itself as the music plays.
audio.currentTime = 2.3;
await wait(300); await settled();
if (lit() !== 1) return "2.3 s, backwards: " + lit();

// No jump: growing the lit line moves nothing around it.
const before = lines().map((b) => b.offsetTop);
audio.currentTime = 6.1; await wait(250); await settled();
if (lines().map((b) => b.offsetTop).join() !== before.join()) return "lit lines leave the layout alone";
if (getComputedStyle(lines()[3]).transform === "none") return "the lit line grows by a transform";

// The scroll goes smoothly: during it the place is between the two, not at either end.
audio.currentTime = 13.2; await wait(100);
const seen = [];
for (let i = 0; i < 12; i++) { seen.push(box.scrollTop); await wait(30); }
await settled();
if (new Set(seen).size < 3) return "a smooth scroll: " + seen.join();

// A tap goes there, without losing the place.
const target = lines()[3];
await tap(target);
await wait(250); await settled();
if (Math.abs(audio.currentTime - 6) > 0.1) return "a tap seeks: " + audio.currentTime;
if ($("#lyrics-demo-note").textContent !== "Last tap went to 6") return "on_seek: " + $("#lyrics-demo-note").textContent;
if (lit() !== 3 || Math.abs(offset(lines()[3])) > 3) return "and it is centred: " + lit() + " " + offset(lines()[3]);

// A real scroll takes over: the words stay where the finger left them while the song goes on.
const top0 = box.scrollTop;
const bm = box.getBoundingClientRect();
await drag(lines()[3], 0, 130, 300);
await wait(150);
if (Math.abs(box.scrollTop - top0) < 40) return "a finger scrolls the words: " + box.scrollTop + " from " + top0;
if (!$(".ui-lyrics-back")) return "there is a way back";
const held = box.scrollTop;
audio.currentTime = 12.2; await wait(350);
if (lit() !== 7) return "still lit by time: " + lit();
if (Math.abs(box.scrollTop - held) > 2) return "nothing pulls the words from under the finger: " + box.scrollTop + " " + held;
// The button brings it back.
await tap($(".ui-lyrics-back"));
await wait(250); await settled();
if ($(".ui-lyrics-back")) return "the button goes";
if (Math.abs(offset(lines()[lit()])) > 3) return "back at the lit line: " + offset(lines()[lit()]);
// And so do a few quiet seconds, here 2.
await drag(lines()[lit()], 0, -120, 300);
await wait(150);
if (!$(".ui-lyrics-back")) return "taken over again";
await wait(2800); await settled();
if ($(".ui-lyrics-back")) return "quiet seconds bring it back";
if (Math.abs(offset(lines()[lit()])) > 3) return "at the lit line: " + offset(lines()[lit()]);

// The keys walk the lines; one tab stop.
if (lines().filter((b) => b.tabIndex === 0).length !== 1) return "one tab stop";
lines()[lit()].focus();
key(lines()[lit()], "ArrowDown"); await wait(120);
if (document.activeElement !== lines()[lit() + 1]) return "ArrowDown walks: " + document.activeElement.textContent;
if (!$(".ui-lyrics-back")) return "keys take over too";
key(document.activeElement, "End"); await wait(120);
if (document.activeElement !== lines()[13]) return "End: " + document.activeElement.textContent;
key(document.activeElement, "ArrowDown"); await wait(120);
if (document.activeElement !== lines()[13]) return "stops at the end";
key(document.activeElement, "Home"); await wait(120);
if (document.activeElement !== lines()[0]) return "Home";
document.activeElement.click(); await wait(200); await settled();
if (Math.abs(audio.currentTime) > 0.1) return "Enter or a click goes there: " + audio.currentTime;
if ($(".ui-lyrics-back")) return "seeking follows again";
document.activeElement.blur();

// A turn keeps the lit line in the middle, at once.
audio.currentTime = 9.1; await wait(250); await settled();
const w = innerWidth, h = innerHeight, lit0 = lit();
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (lit() !== lit0 || Math.abs(offset(lines()[lit()])) > 3) { await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); return "turned, it stays centred: " + offset(lines()[lit()]); }
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (Math.abs(offset(lines()[lit()])) > 3) return "turned back, it stays centred: " + offset(lines()[lit()]);

// Wide: the song beside the words, which are larger.
const side = getComputedStyle($(".ui-lyrics-in")).gridTemplateColumns.split(" ").length;
if (side !== (device === "tablet" ? 2 : 1)) return "columns: " + side;
if (getComputedStyle(lines()[0]).fontSize !== (device === "tablet" ? "32px" : "22px")) return "type size: " + getComputedStyle(lines()[0]).fontSize;

// A list with bad rows, sorted, on a time prop, with an offset of -1: at 3 s the clock says 2.
const own = $("#lyrics-demo-own");
const ol = [...own.querySelectorAll(".ui-lyrics-line")];
if (ol.map((b) => b.textContent).join() !== "Two,...,Six") return "a list, cleaned and sorted: " + ol.map((b) => b.textContent).join();
const ownLit = () => [...own.querySelectorAll(".ui-lyrics-line")].findIndex((b) => b.getAttribute("aria-current") === "true");
if (ownLit() !== 0) return "time and offset: " + ownLit();
await tap($("#lyrics-demo-later"));
if (ownLit() !== 1) return "5 s, less 1, is the second: " + ownLit();
await tap($("#lyrics-demo-later"));
if (ownLit() !== 2) return "7 s, less 1, is the third: " + ownLit();
await tap(ol[0]);
if ($("#lyrics-demo-own .ui-lyrics-back")) return "a tap keeps following";
if ($("#lyrics-demo-plain .ui-lyrics-plain").textContent !== "Words with no times\nstay plain.") return "no stamps: plain words: " + $("#lyrics-demo-plain").textContent;
if ($("#lyrics-demo-none .ui-lyrics-empty").textContent !== "No lyrics for this one.") return "nothing: it says so";
