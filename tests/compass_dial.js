// mobile
const big = () => $(".ui-compass-big")?.textContent;
const say = () => $(".ui-compass-say")?.textContent ?? "";
const note = () => $("#compass-dial-demo-note").textContent;
const turn = () => $(".ui-compass-turn")?.textContent;
const angle = () => { const m = $(".ui-compass-rose").style.transform.match(/rotate\((-?[\d.]+)deg\)/); return m ? Number(m[1]) : null; };
const show = () => $("#compass-dial-demo-show");
const remount = async () => { await tap(show()); await tap(show()); await wait(120); };
const metric = (extra = {}) => cdp("Emulation.setDeviceMetricsOverride", { width: innerWidth, height: innerHeight, deviceScaleFactor: 2, mobile: true, ...extra });
const orient = (alpha, beta = 0, gamma = 0) => cdp("DeviceOrientation.setDeviceOrientationOverride", { alpha, beta, gamma });
// Real readings from Chrome, which drops any within 0.1° of the last: beta moves by a shade,
// and lying down the heading does not read it.
const keep = async (alpha, beta = 0, gamma = 0, n = 36) => {
    for (let i = 0; i < n; i++) { await orient(alpha, beta + (i % 2) * 0.2, gamma); await new Promise((r) => setTimeout(r, 18)); }
    await wait(60);
};
// The shape only iOS's WebKit gives: a real event with its extra fields.
const ios = (heading, accuracy) => { const e = new DeviceOrientationEvent("deviceorientation", { alpha: 100, beta: 0, gamma: 0, absolute: false });
    Object.defineProperty(e, "webkitCompassHeading", { value: heading }); Object.defineProperty(e, "webkitCompassAccuracy", { value: accuracy }); window.dispatchEvent(e); };
const meta = { available: true, minimumFrequency: 1, maximumFrequency: 60 };
const real = DeviceOrientationEvent.requestPermission;
try {
    // No sensor: Chrome's one empty event is the answer.
    if (say() !== "There is no compass here. Try it on a phone.") return "no sensor: " + say();
    if (big() !== "--") return "no reading: " + big();

    // A relative orientation, as Chrome's override gives: not north, and it says so.
    // The listener stays on through "no compass", so a reading can end that before the tap lands.
    const again = $(".ui-compass-start");
    await orient(30);
    if ($(".ui-compass-start")) await tap(again);
    await wait(120);
    await keep(30);
    if (big() !== "330° NW") return "alpha 30 lying down is 330: " + big();
    if ($(".ui-compass").dataset.source !== "relative") return "source: " + $(".ui-compass").dataset.source;
    if (!say().startsWith("This device reports only turns")) return "relative note: " + say();
    if (note() !== "on_heading: 330") return "callback: " + note();

    // Known headings and the eight points' edges.
    await keep(180);
    if (big() !== "180° S") return "south: " + big();
    await keep(360 - 22);
    if (big() !== "22° N") return "22 is N: " + big();
    await keep(360 - 23);
    if (big() !== "23° NE") return "23 is NE: " + big();
    await keep(360 - 338);
    if (big() !== "338° N") return "338 is N: " + big();

    // Crossing north: 350 to 10 goes by 360, and never through south.
    await keep(10);
    if (big() !== "350° N") return "start of the crossing: " + big();
    const from = -angle();
    const seen = [];
    for (let i = 0; i < 36; i++) { await orient(350, (i % 2) * 0.2); await new Promise((r) => setTimeout(r, 18)); seen.push(-angle()); }
    await wait(60);
    if (big() !== "10° N") return "end of the crossing: " + big();
    const low = Math.min(...seen), high = Math.max(...seen);
    if (low < from - 0.01 || high > from + 21 ) return "went the long way: " + low + " to " + high + " from " + from;
    if (seen.at(-1) < from + 18) return "should have gone on past 360: " + seen.at(-1) + " from " + from;
    // A reading moves it 4° at most here, and this samples slower than Chrome can send: up to three between looks.
    for (let i = 1; i < seen.length; i++) if (Math.abs(seen[i] - seen[i - 1]) > 12) return "jumped: " + seen[i - 1] + " to " + seen[i];

    // A hand's shake is eased: one reading 20 away moves it a fifth of the way.
    await keep(0);
    const a0 = -angle();
    await orient(340);
    await wait(40);
    const step = -angle() - a0;
    if (Math.abs(step - 4) > 0.3) return "ease step: " + step;

    // A bearing: which way to turn, from the shortest way round.
    await keep(360 - 100);
    if (turn() !== "Base camp: Turn 32° right") return "bearing: " + turn();
    await keep(360 - 200);
    if (turn() !== "Base camp: Turn 68° left") return "bearing left: " + turn();
    await keep(360 - 130);
    if (turn() !== "Base camp: Straight ahead") return "straight: " + turn();
    await keep(360 - 300);
    if (turn() !== "Base camp: Turn 168° left") return "the short way round: " + turn();

    // Held up to read, the heading comes from the way the back faces.
    await keep(0, 90, 0);
    if (big() !== "0° N") return "upright north: " + big();
    await keep(90, 90, 0);
    if (big() !== "270° W") return "upright, alpha 90: " + big();

    // Rotation: the dial shows where the top of the screen points.
    await keep(360 - 40);
    await metric({ screenOrientation: { type: "landscapePrimary", angle: 90 } });
    await wait(150);
    await keep(360 - 40);
    const turned = big();
    await metric({ screenOrientation: { type: "portraitPrimary", angle: 0 } });
    await wait(150);
    if (turned !== "130° SE") return "turned screen: " + turned;
    await keep(360 - 40);

    // iOS's own heading goes ahead of alpha, and its accuracy brings the advice.
    await cdp("DeviceOrientation.clearDeviceOrientationOverride");
    await remount();
    for (let i = 0; i < 12; i++) { ios(200, 8); await wait(8); }
    await wait(60);
    if (big() !== "200° S" && big() !== "200° SW") return "ios heading: " + big();
    if (big() !== "200° S") return "200 is south: " + big();
    if ($(".ui-compass").dataset.source !== "true" || say() !== "") return "ios source: " + say();
    for (let i = 0; i < 12; i++) { ios(200, 40); await wait(8); }
    await wait(40);
    if (say() !== "The compass needs calibrating: move the phone in a figure of eight.") return "poor accuracy: " + say();
    ios(200, -1);
    await wait(40);
    if (!say().startsWith("The compass needs calibrating")) return "accuracy -1: " + say();
    ios(200, 10);
    await wait(40);
    if (say() !== "") return "calibrated: " + say();

    // A heading that wanders, with no accuracy to go by. 120 readings, 60 degrees either way.
    for (let i = 0; i < 80; i++) { ios(i % 2 ? 140 : 260, 10); await new Promise((r) => setTimeout(r, 2)); }
    await wait(60);
    if (!say().startsWith("The reading is wandering.")) return "wandering: " + say();
    // A browser that never says anything is timed out.
    await tap(show());
    const add = window.addEventListener;
    window.addEventListener = function (t, ...a) { return t.startsWith("deviceorientation") ? undefined : add.call(this, t, ...a); };
    await tap(show());
    await wait(100);
    const quiet = say();
    await wait(2600);
    window.addEventListener = add;
    if (quiet !== "") return "before the clock: " + quiet;
    if (say() !== "There is no compass here. Try it on a phone.") return "silence: " + say();

    // Android's absolute sensor, through Chrome's own.
    await tap(show());
    await cdp("Emulation.setSensorOverrideEnabled", { enabled: true, type: "absolute-orientation", metadata: meta });
    // A quarter turn about z: alpha 90, so a heading of 270.
    await cdp("Emulation.setSensorOverrideReadings", { type: "absolute-orientation", reading: { quaternion: { x: 0, y: 0, z: Math.SQRT1_2, w: Math.SQRT1_2 } } });
    await tap(show());
    await wait(400);
    const abs = big(), src = $(".ui-compass").dataset.source;
    await tap(show());
    await cdp("Emulation.setSensorOverrideEnabled", { enabled: false, type: "absolute-orientation" });
    await tap(show());
    await wait(120);
    if (abs !== "270° W" || src !== "true") return "absolute: " + abs + " " + src;

    // Leaving the page stops it.
    await tap(show());
    const was = note();
    await keep(77, 0, 0, 4);
    if (note() !== was) return "still listening after leaving: " + note();

    // iOS's permission: no tap fails, so the button shows; the tap lets it in.
    let asks = 0, answer = async () => { if (++asks === 1) throw new DOMException("Requesting device orientation access requires a user gesture to prompt", "NotAllowedError"); return "granted"; };
    DeviceOrientationEvent.requestPermission = () => answer();
    await show().click();
    await wait(200);
    if (say() !== "This phone asks before a page can read the compass.") return "ios asks: " + say();
    if ($(".ui-compass-start").textContent.trim() !== "Turn on the compass") return "ios button: " + $(".ui-compass-start").textContent;
    await tap($(".ui-compass-start"));
    await wait(100);
    if ($(".ui-compass-start")) return "ios on: " + say();

    // Refused, and the way back.
    answer = async () => "denied";
    await tap(show()); await tap(show());
    await wait(100);
    if (!say().startsWith("The compass was refused.")) return "refused: " + say();
    answer = async () => "granted";
    await orient(45);
    await tap($(".ui-compass-start"));
    await wait(120);
    await keep(45);
    if (big() !== "315° NW") return "after trying again: " + big();
    DeviceOrientationEvent.requestPermission = real;

    // Tablet: readings beside the dial. Phone: under it.
    const f = $(".ui-compass-face").getBoundingClientRect(), r = $(".ui-compass-read").getBoundingClientRect();
    if (device === "tablet" && !(r.left >= f.right)) return "tablet layout";
    if (device === "phone" && !(r.top >= f.bottom)) return "phone layout";
    if (f.width < (device === "tablet" ? 350 : 200)) return "dial too small: " + f.width;
    if (device === "tablet" && Math.abs((r.top + r.bottom) / 2 - (f.top + f.bottom) / 2) > f.height / 3) return "tablet: the readings should sit by the dial's middle";
} finally {
    DeviceOrientationEvent.requestPermission = real;
    await cdp("DeviceOrientation.clearDeviceOrientationOverride");
    await cdp("Emulation.setSensorOverrideEnabled", { enabled: false, type: "absolute-orientation" });
    await metric({ screenOrientation: { type: "portraitPrimary", angle: 0 } });
}
