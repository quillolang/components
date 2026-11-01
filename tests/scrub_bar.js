// mobile
const T = 3725;
// Room above, as a bar near the top leaves the finger nowhere to go: a player's sits low.
$(".demo-stack").style.paddingTop = "330px";
await wait(60);
const rail = $(".ui-scrubbar-rail");
const now = () => Number(rail.getAttribute("aria-valuenow"));
const note = () => $("#scrub-demo-note").textContent;
const r = () => rail.getBoundingClientRect();
const y0 = () => r().top + r().height / 2;
const lift = async () => { await fingers("touchEnd", []); await wait(120); };
const seeks = () => Number(note().match(/(\d+) seeks/)[1]);

// The pure parts, by what shows.
if (rail.getAttribute("aria-valuetext") !== "12:34 of 1:02:05") return "time as text: " + rail.getAttribute("aria-valuetext");
if ($(".ui-scrubbar-now").textContent !== "12:34") return "time so far: " + $(".ui-scrubbar-now").textContent;
if ($(".ui-scrubbar-left").textContent !== "-49:31") return "time left: " + $(".ui-scrubbar-left").textContent;
if (r().height < 56) return "the strip takes the finger: " + r().height;
if (getComputedStyle(rail).touchAction !== "pan-y") return "up and down stay the page's: " + getComputedStyle(rail).touchAction;
const fill = $(".ui-scrubbar-fill");
if (Math.abs(new DOMMatrix(getComputedStyle(fill).transform).a - 754 / T) > 0.0001) return "the fill shows the time: " + getComputedStyle(fill).transform;
if (rail.querySelectorAll(".ui-scrubbar-got").length !== 2 || Math.abs(parseFloat($(".ui-scrubbar-got").style.width) - 1200 / T * 100) > 0.001) return "what is loaded shows: " + $(".ui-scrubbar-got")?.style.width;

// A tap goes where it lands, once, and nothing moved before the lift.
const tx = r().left + r().width * 0.75;
const hit = document.elementFromPoint(tx, y0());
if (!rail.contains(hit)) return "the bar is under the finger: " + hit?.className + " " + JSON.stringify(r());
await fingers("touchStart", [{ x: tx, y: y0() }]);
await wait(120);
if (!$(".ui-scrubbar-held")) return "a press holds it: " + $(".ui-scrubbar").className + " " + rail.getAttribute("aria-disabled") + " " + (document.elementFromPoint(tx, y0())?.className);
if (now() !== 754) return "a press moves nothing yet: " + now();
if (seeks() !== 0) return "a press seeks nothing yet";
await lift();
if (now() !== Math.floor(0.75 * T)) return "a tap goes there: " + now() + " wanted " + Math.floor(0.75 * T);
if (seeks() !== 1) return "one seek: " + note();
if ($(".ui-scrubbar-held")) return "lifted";

// A drag from the thumb takes it where it is, at full speed: pixels count as they are.
const w = r().width, start = 0.75 * T, thumbX = r().left + w * 0.75, y = y0();
await fingers("touchStart", [{ x: thumbX, y }]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: thumbX - i * 12, y }]); await wait(16); }
await wait(40);
const tipEl = $(".ui-scrubbar-tip");
if (getComputedStyle(tipEl).display === "none") return "the bubble shows while dragging";
const want = start - 60 / w * T;
const clock = (s) => { s = Math.floor(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), c = s % 60; return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(c).padStart(2, "0"); };
if ($(".ui-scrubbar-tip-time").textContent !== clock(want)) return "the bubble says the time: " + $(".ui-scrubbar-tip-time").textContent + " wanted " + clock(want);
if (!note().includes("preview " + clock(want))) return "on_scrub on each move: " + note();
if (seeks() !== 1) return "a drag seeks nothing until the lift";
if (now() !== Math.floor(start)) return "the value waits for the lift: " + now();
const tipBox = tipEl.getBoundingClientRect();
if (tipBox.bottom > r().top + 8) return "the bubble is above the bar: " + tipBox.bottom + " " + r().top;
await lift();
if (Math.abs(now() - want) > 1) return "a drag seeks at the lift: " + now() + " wanted " + want;
if (seeks() !== 2) return "two seeks: " + note();

// The time changing under a held thumb moves nothing: a player's time changes all the time.
const held0 = now();
const hx = r().left + held0 / T * w;
await fingers("touchStart", [{ x: hx, y }]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: hx + i * 12, y }]); await wait(16); }
await wait(40);
const dragged = new DOMMatrix(getComputedStyle(fill).transform).a;
$("#scrub-demo-tick").click();
await wait(120);
const heldNow = new DOMMatrix(getComputedStyle(fill).transform).a;
if (now() !== held0 + 5) { await lift(); return "the value did change: " + now(); }
if (Math.abs(heldNow - dragged) > 0.0001) { await lift(); return "a state change mid-drag moved the thumb: " + heldNow + " from " + dragged; }
await lift();
if (Math.abs(now() - (held0 + 60 / w * T)) > 1) return "the drag still lands where it was going: " + now();

// Moving away counts for less. Up 250 px is a tenth: sideways there moves little.
key(rail, "Home"); await wait(60);
key(rail, "PageUp"); await wait(60);
for (let i = 0; i < 20; i++) key(rail, "PageUp");
await wait(120);
const at0 = now();
const x0 = r().left + at0 / T * w;
await fingers("touchStart", [{ x: x0, y }]);
// Sideways first, past the system's slop: a finger going up from the start is the page's scroll.
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: x0 + i * 10, y }]); await wait(16); }
const levels = [[-70, "Half speed"], [-140, "Quarter speed"], [-210, "Fine scrubbing"], [70, "Half speed"], [0, ""]];
for (const [dy, name] of levels) {
    await fingers("touchMove", [{ x: x0 + 40, y: y + dy }]); await wait(30);
    if ($(".ui-scrubbar-tip-rate").textContent !== name) return "at " + dy + " px it says '" + name + "': " + $(".ui-scrubbar-tip-rate").textContent;
}
await fingers("touchMove", [{ x: x0 + 40, y: y - 210 }]); await wait(30);
const tipUp = tipEl.getBoundingClientRect();
if (tipUp.bottom > y - 210 - 20) return "the bubble stays above the finger: " + tipUp.bottom;
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: x0 + 40 + i * 10, y: y - 210 }]); await wait(16); }
await wait(40);
await lift();
const fine = at0 + (40 + 100 * 0.1) / w * T;
if (Math.abs(now() - fine) > 1.5) return "a tenth up there: " + now() + " wanted " + fine + " (full speed would be " + (at0 + 140 / w * T) + ")";

// A system that takes the gesture leaves the time as it was.
const before = now(), seeksBefore = seeks();
await fingers("touchStart", [{ x: r().left + 30, y }]);
await fingers("touchMove", [{ x: r().left + 90, y }]); await wait(40);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(120);
if (now() !== before || seeks() !== seeksBefore) return "a cancelled drag changes nothing: " + now() + " " + note();
if ($(".ui-scrubbar-held") || rail.style.getPropertyValue("--ui-scrubbar-drag") !== "") return "a cancelled drag lets go";

// A finger going up or down first is the page's: the browser cancels it, no seek.
const px = r().left + 20;
await fingers("touchStart", [{ x: px, y }]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: px, y: y - i * 12 }]); await wait(16); }
await lift();
if (now() !== before || seeks() !== seeksBefore) return "a scroll is not a seek: " + now() + " " + note();
scrollTo(0, 0);

// The keys, the same way to every time.
rail.focus();
key(rail, "End"); await wait(60);
if (now() !== T) return "End: " + now();
key(rail, "ArrowRight"); await wait(60);
if (now() !== T) return "it stops at the end: " + now();
if ($(".ui-scrubbar-left").textContent !== "-0:00") return "nothing left: " + $(".ui-scrubbar-left").textContent;
key(rail, "Home"); await wait(60);
if (now() !== 0) return "Home: " + now();
key(rail, "ArrowLeft"); await wait(60);
if (now() !== 0) return "it stops at the start: " + now();
key(rail, "ArrowRight"); await wait(60);
if (now() !== 5) return "an arrow is the step: " + now();
key(rail, "PageUp"); await wait(60);
if (now() !== 35) return "PageUp is 30: " + now();
key(rail, "PageDown"); await wait(60);
if (now() !== 5) return "PageDown is 30: " + now();
key(rail, "ArrowDown"); await wait(60);
if (now() !== 0) return "ArrowDown goes back: " + now();

// Bad input: nothing to seek in.
const bad = $("#scrub-demo-bad .ui-scrubbar-rail");
if (bad.getAttribute("aria-disabled") !== "true" || bad.getAttribute("aria-valuetext") !== "0:00 of 0:00") return "no duration, nothing to do: " + bad.getAttribute("aria-valuetext");
const n0 = seeks();
await tap(bad);
if (seeks() !== n0 || $("#scrub-demo-bad .ui-scrubbar-held")) return "a disabled bar takes no finger";

// Following an element: it seeks it, and follows when it plays.
const audio = $("#scrub-demo-audio"), mr = $("#scrub-demo-media .ui-scrubbar-rail");
if (audio.readyState < 1) { audio.load(); await wait(400); }
if (mr.getAttribute("aria-valuemax") !== "14") return "it reads the duration: " + mr.getAttribute("aria-valuemax");
const mb = mr.getBoundingClientRect();
await fingers("touchStart", [{ x: mb.left + mb.width / 2, y: mb.top + 28 }]); await lift();
await wait(200);
if (Math.abs(audio.currentTime - 7) > 0.2) return "a tap seeks the element: " + audio.currentTime;
if (Math.abs(Number(mr.getAttribute("aria-valuenow")) - 7) > 1) return "it follows the element: " + mr.getAttribute("aria-valuenow");
key(mr, "ArrowRight"); await wait(200);
if (Math.abs(audio.currentTime - 9) > 0.2) return "step is a prop: " + audio.currentTime;
audio.currentTime = 12; await wait(250);
if (mr.getAttribute("aria-valuenow") !== "12") return "it follows a seek from elsewhere: " + mr.getAttribute("aria-valuenow");
// Dragging while it plays: timeupdate arrives four times a second, and the thumb stays with the finger.
audio.currentTime = 0; await audio.play(); await wait(150);
const mfill = mr.querySelector(".ui-scrubbar-fill"), mx = mb.left + mb.width * 0.2, my = mb.top + 28;
await fingers("touchStart", [{ x: mx, y: my }]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: mx + i * 15, y: my }]); await wait(16); }
await wait(40);
const atDrag = new DOMMatrix(getComputedStyle(mfill).transform).a;
await wait(700);
const atLater = new DOMMatrix(getComputedStyle(mfill).transform).a;
await lift();
audio.pause();
if (Math.abs(atLater - atDrag) > 0.0001) return "playing moved a held thumb: " + atLater + " from " + atDrag;
if (getComputedStyle($(".ui-scrubbar-times")).display === "contents" !== (device === "tablet")) return "times at the ends on a wide bar: " + getComputedStyle($(".ui-scrubbar-times")).display;
