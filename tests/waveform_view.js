// mobile
const views = $$(".ui-waveform-view");
const [box, known, bad] = views;
const note = () => $("#waveform-view-demo-note").textContent;
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
const track = box.querySelector(".ui-waveform-view-track");
const sound = box.querySelector("audio");
const bars = (v) => [...v.querySelector(".ui-waveform-view-all path").getAttribute("d").matchAll(/v([\d.]+)h/g)].map((m) => parseFloat(m[1]));
const P = () => parseFloat(box.style.getPropertyValue("--ui-waveform-view-p") || "0");
const button = (l) => [...box.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === l);

// Decoded on the phone: 50 bars, a second of silence, a second of full height, half a second at half.
if (!await until(() => box.dataset.state === "ready")) return `not decoded: ${box.dataset.state}`;
if (!await until(() => sound.duration > 2)) return "the sound has no length";
const h = bars(box);
if (h.length !== 50) return `${h.length} bars, not 50`;
for (let i = 0; i < 19; i++) if (h[i] !== 2) return `bar ${i} of the silence is ${h[i]}`;
for (let i = 21; i < 39; i++) if (h[i] < 95) return `bar ${i} of the loud part is ${h[i]}`;
for (let i = 41; i < 50; i++) if (h[i] < 45 || h[i] > 55) return `bar ${i} of the half part is ${h[i]}`;
if (box.querySelector(".ui-waveform-view-played path").getAttribute("d") !== box.querySelector(".ui-waveform-view-all path").getAttribute("d")) return "the played part is another shape";

// Heights already known are used as they are, with bad ones flattened, and nothing decoded.
if (bars(known).join() !== "2,25,50,100,2,100,2,75") return `given peaks: ${bars(known)}`;
if (known.dataset.state !== "ready" || known.querySelector("svg").getAttribute("viewBox") !== "0 0 8 100") return "given peaks are not ready";
if (!known.querySelector("path").getAttribute("d").startsWith("M0.1 49h.8v2h-.8zM1.1 37.5h.8v25h-.8z")) return `the path: ${known.querySelector("path").getAttribute("d").slice(0, 60)}`;

// What cannot be decoded says so, and draws a line.
if (!await until(() => bad.dataset.state === "flat")) return `a bad file: ${bad.dataset.state}`;
if (!/could not be drawn/.test(bad.textContent) || bars(bad).some((x) => x !== 2) || bars(bad).length !== 96) return "a bad file is not a flat line";

const r = track.getBoundingClientRect();
track.scrollIntoView({ block: "center" });
await wait(60);

// A tap seeks to the place: 40 percent of 2.5 s is a second.
const place = (part) => { const q = track.getBoundingClientRect(); return { x: q.left + q.width * part, y: q.top + q.height / 2 }; };
await fingers("touchStart", [place(0.4)]);
await fingers("touchEnd", []);
await wait(150);
if (Math.abs(sound.currentTime - 1) > 0.05) return `a tap went to ${sound.currentTime}`;
if (note() !== "on_seek got 1 s" && note() !== "on_seek got 1.0 s") return `on_seek: ${note()}`;
if (Math.abs(P() - 40) > 2) return `the line is at ${P()}`;
const line = box.querySelector(".ui-waveform-view-line").getBoundingClientRect();
if (Math.abs(line.left + 1 - place(0.4).x) > 2) return `the line is drawn at ${line.left}, not ${place(0.4).x}`;

// A scrub moves the line without touching the sound, and lands on release.
await fingers("touchStart", [place(0.4)]);
const steps = [0.45, 0.5, 0.55, 0.6];
for (const s of steps) { await fingers("touchMove", [place(s)]); await wait(20); }
if (Math.abs(P() - 60) > 2) return `the line follows to ${P()}`;
if (Math.abs(sound.currentTime - 1) > 0.05) return "a scrub seeks on every move";
if (getComputedStyle(box.querySelector(".ui-waveform-view-tip")).opacity !== "1" || box.querySelector(".ui-waveform-view-tip").textContent !== "0:01") return "the time does not show while scrubbing";
await fingers("touchEnd", []);
await wait(150);
if (Math.abs(sound.currentTime - 1.5) > 0.05) return `a scrub landed at ${sound.currentTime}`;
if (note() !== "on_seek got 1.5 s") return `on_seek: ${note()}`;

// The root's class reads the reduced-motion setting: if that changes during a scrub, the
// time beside the finger stays.
await fingers("touchStart", [place(0.2)]);
for (const s of [0.25, 0.3, 0.35]) { await fingers("touchMove", [place(s)]); await wait(20); }
if (getComputedStyle(box.querySelector(".ui-waveform-view-tip")).opacity !== "1") return "no time beside the finger";
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(120);
const shown_tip = getComputedStyle(box.querySelector(".ui-waveform-view-tip")).opacity;
await cdp("Emulation.setEmulatedMedia", { features: [] });
await wait(120);
await fingers("touchEnd", []);
await wait(150);
if (shown_tip !== "1") return "the scrub was lost when the setting changed";
if (Math.abs(sound.currentTime - 0.875) > 0.05) return `that scrub landed at ${sound.currentTime}`;

// Past the end it holds at the end; before the start, at the start.
await fingers("touchStart", [place(0.9)]);
for (const s of [0.95, 1.2, 1.6]) { await fingers("touchMove", [{ x: Math.min(place(s).x, innerWidth - 2), y: place(s).y }]); await wait(20); }
await fingers("touchEnd", []);
await wait(150);
if (sound.currentTime < 2) return `dragged off the right it is at ${sound.currentTime}`;

// Cancelled by the system: back where the sound is.
const was = sound.currentTime;
await fingers("touchStart", [place(0.5)]);
await fingers("touchMove", [place(0.3)]);
await fingers("touchMove", [place(0.2)]);
await wait(30);
await fingers("touchCancel", []);
await wait(100);
if (sound.currentTime !== was || Math.abs(P() - was * 100 / 2.5) > 2) return `a cancelled scrub moved it: ${sound.currentTime} ${P()}`;
if (getComputedStyle(box.querySelector(".ui-waveform-view-tip")).opacity !== "0") return "a cancelled scrub stays on";

// Up or down is the page's: nothing is sought.
await drag(track, 0, 120);
if (sound.currentTime !== was) return `a vertical drag sought: ${sound.currentTime}`;
track.scrollIntoView({ block: "center" });
await wait(100);

// Keys, as on a slider: step 0.5 here.
if (track.getAttribute("role") !== "slider" || track.tabIndex !== 0) return "the waveform is not a slider";
key(track, "Home"); await wait(60);
if (sound.currentTime !== 0 || track.getAttribute("aria-valuetext") !== "0:00 of 0:02") return `Home: ${sound.currentTime} ${track.getAttribute("aria-valuetext")}`;
key(track, "ArrowRight"); await wait(60);
if (Math.abs(sound.currentTime - 0.5) > 0.01) return `ArrowRight: ${sound.currentTime}`;
key(track, "PageUp"); await wait(60);
if (Math.abs(sound.currentTime - 2.5) > 0.01) return `PageUp holds at the end: ${sound.currentTime}`;
key(track, "End"); await wait(60);
key(track, "ArrowLeft"); await wait(60);
if (Math.abs(sound.currentTime - 2) > 0.01) return `ArrowLeft: ${sound.currentTime}`;
if (track.getAttribute("aria-valuenow") !== "2") return `aria-valuenow: ${track.getAttribute("aria-valuenow")}`;

// The buttons, by a finger: the equal of the gesture.
await tap(button("Back 0.5 seconds"));
if (Math.abs(sound.currentTime - 1.5) > 0.01) return `Back: ${sound.currentTime}`;
await tap(button("Forward 0.5 seconds"));
if (Math.abs(sound.currentTime - 2) > 0.01) return `Forward: ${sound.currentTime}`;

// Playing moves the line smoothly: more than 1 place in 3 seen is off a bar's edge.
key(track, "Home"); await wait(60);
await tap(button("Play"));
if (!await until(() => !sound.paused)) return "Play does not play";
const places = [];
for (let i = 0; i < 16; i++) { await wait(50); places.push(P()); }
if (new Set(places).size < 8) return `the line is not gliding: ${places}`;
if (places.at(-1) <= places[0]) return "the line does not move";
await tap(button("Pause"));
if (!sound.paused) return "Pause does not pause";

// Reduced motion: the line goes bar by bar, on the player's own ticks.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(80);
try {
    if (!box.classList.contains("ui-waveform-view-still")) return "reduced motion is not noticed";
    key(track, "Home"); await wait(60);
    await tap(button("Play"));
    await until(() => !sound.paused);
    const seen = [];
    for (let i = 0; i < 14; i++) { await wait(60); seen.push(P()); }
    await tap(button("Pause"));
    for (const p of seen) if (Math.abs(p / 2 - Math.round(p / 2)) > 0.001) return `the line is off a bar: ${p}`;
    if (Math.max(...seen) === 0) return "the line does not move at all with reduced motion";
} finally {
    await cdp("Emulation.setEmulatedMedia", { features: [] });
    await wait(60);
}
if (box.classList.contains("ui-waveform-view-still")) return "the setting is not followed back";
if (r.width < 200) return `the waveform is ${r.width} wide`;
if (r.height !== (device === "tablet" ? 132 : 88)) return `on a ${device} the waveform is ${r.height} high`;
