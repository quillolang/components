// mobile
const box0 = () => $(".ui-spirit");
const say = () => $(".ui-spirit-say").textContent;
const big = () => $(".ui-spirit-big").textContent;
const note = () => $("#spirit-level-demo-note").textContent;
const bubble = () => { const m = new DOMMatrix(getComputedStyle($(".ui-spirit-bubble")).transform); return { x: m.e, y: m.f }; };
const near = (a, b, d = 0.6) => Math.abs(a - b) <= d;
// A real reading from Chrome's own override, sent enough times to settle. Chrome drops one
// within 0.1° of the last, so alpha, which a level does not read, moves each time.
const tilt = async (beta, gamma, n = 14) => {
    for (let i = 0; i < n; i++) {
        await cdp("DeviceOrientation.setDeviceOrientationOverride", { alpha: 10 + (i % 2) * 0.2, beta, gamma });
        await new Promise((r) => setTimeout(r, 18));
    }
    await wait(60);
};
const metric = (extra = {}) => cdp("Emulation.setDeviceMetricsOverride", { width: innerWidth, height: innerHeight, deviceScaleFactor: 2, mobile: true, ...extra });
const felt = [];
try {
    // No sensor here yet: Chrome sends one empty event, which is the answer.
    if (!say().startsWith("There is no motion sensor here")) return "no sensor: " + say();
    if ($(".ui-spirit-zero")) return "nothing to zero yet";

    // Sensor on, with the haptic through the app.
    window.quilloNative = { haptic: async (k) => { felt.push(k); return k; } };
    // A double tap on "Try again": "Set zero" appears where it was, and the second tap must not zero anything.
    // The listener stays on through "no sensor", so the first reading may even beat the first tap.
    const at = middle($(".ui-spirit-start"));
    await cdp("DeviceOrientation.setDeviceOrientationOverride", { alpha: 10, beta: 3, gamma: -4 });
    for (let i = 0; i < 2; i++) { await fingers("touchStart", [at]); await fingers("touchEnd", []); await wait(90); }
    await wait(100);
    await tilt(3, -4);
    if ($(".ui-spirit-clear")) return "a double tap set the zero";

    // Flat, off level: top up 3 (bubble up), left low 4 (bubble left... to the high, right, side).
    if (box0().dataset.mode !== "flat") return "mode: " + box0().dataset.mode;
    const d3 = Math.atan2(Math.sin(4 * Math.PI / 180) * Math.cos(3 * Math.PI / 180), Math.cos(4 * Math.PI / 180) * Math.cos(3 * Math.PI / 180)) * 180 / Math.PI;
    if (Math.abs(d3 - 4) > 0.01) return "the worked answer is off: " + d3;
    if (say() !== "Left side 4.0° low, Bottom 3.0° low") return "words: " + say();
    if (big() !== "5.0°") return "big: " + big();
    const box = $(".ui-spirit-dial").clientWidth / 2 - 30;
    const b = bubble();
    if (!near(b.x, box * 0.4) || !near(b.y, -box * 0.3)) return "bubble: " + JSON.stringify(b) + " in " + box;
    if (box0().hasAttribute("data-level")) return "level at 5°";
    if (felt.length) return "felt off level";

    // Reaches level: felt once, called, shown.
    await tilt(0.2, -0.2);
    if (!box0().hasAttribute("data-level") || say() !== "Level") return "level: " + say() + " " + big();
    if (felt.join() !== "success") return "felt: " + felt.join();
    if (!note().includes("Reached 1 times") || !note().startsWith("Level in flat")) return "callback: " + note();

    // Hysteresis: 0.8 is past the tolerance but inside twice it, so it stays level.
    await tilt(0.8, 0);
    if (!box0().hasAttribute("data-level")) return "left level at 0.8°: " + big();
    await tilt(0.2, 0);
    if (felt.length !== 1) return "felt again without leaving: " + felt.length;
    await tilt(1.5, 0);
    if (box0().hasAttribute("data-level")) return "still level at 1.5°";
    if (!note().startsWith("Off level")) return "off callback: " + note();
    await tilt(0, 0);
    if (felt.length !== 2) return "felt on coming back: " + felt.length;

    // Zero: a table that is not true counts as level, and back again.
    await tilt(2, 1);
    if (box0().hasAttribute("data-level")) return "2,1 should not be level";
    await tap($(".ui-spirit-zero"));
    await wait(80);
    if (!box0().hasAttribute("data-level") || big() !== "0.0°") return "zeroed: " + big();
    if (!near(bubble().x, 0) || !near(bubble().y, 0)) return "bubble after zero: " + JSON.stringify(bubble());
    await tilt(2, 3);
    if (say() !== "Right side 2.0° low") return "from the new zero: " + say() + " " + big();
    await tap($(".ui-spirit-clear"));
    await wait(80);
    if ($(".ui-spirit-clear")) return "clear should go";
    await tilt(0, 0);
    if (!box0().hasAttribute("data-level")) return "cleared: " + big();

    // Far past the range: held inside the dial, along the same line.
    await tilt(30, -30);
    const edge = bubble();
    if (!near(Math.hypot(edge.x, edge.y), box, 0.8)) return "clamped: " + JSON.stringify(edge) + " in " + box;

    // Rotation: the screen turned 90, the bubble's way is turned with it, and the zero stays.
    await tilt(0, 0);
    await tilt(0, 4);
    await tap($(".ui-spirit-zero"));
    await wait(80);
    await tilt(0, 8);
    await metric({ screenOrientation: { type: "landscapePrimary", angle: 90 } });
    await wait(150);
    await tilt(0, 8.0001, 4);
    const turned = bubble();
    await metric({ screenOrientation: { type: "portraitPrimary", angle: 0 } });
    await wait(150);
    if (!near(turned.x, 0) || !near(turned.y, box * 0.4)) return "after turning: " + JSON.stringify(turned);
    if (say() !== "Right side 4.0° low") return "zero across rotation: " + say();
    await tap($(".ui-spirit-clear"));

    // Stood on its bottom edge, 2° off: a tube, not a dial, and one number.
    await tilt(90, 0, 3);
    await tilt(88, 0, 3);
    await cdp("DeviceOrientation.setDeviceOrientationOverride", { alpha: 10, beta: 90, gamma: 0 });
    await wait(60);
    if (box0().dataset.mode !== "edge" || !$(".ui-spirit-tube")) return "edge: " + box0().dataset.mode;
    if (!$(".ui-spirit-bubble")) return "edge bubble";
    // Turned in its own plane by 2 degrees: beta 90 gives gamma no meaning, so go near it.
    const b2 = 80, g2 = 2;
    await tilt(b2, g2);
    const down = { x: Math.sin(g2 * Math.PI / 180) * Math.cos(b2 * Math.PI / 180), y: -Math.sin(b2 * Math.PI / 180) };
    const off = Math.atan2(down.x, -down.y) * 180 / Math.PI;
    if (Math.abs(off - 0.3527) > 0.01) return "the edge's worked answer: " + off;
    if (big() !== "0.4°") return "edge big: " + big();
    if (!box0().hasAttribute("data-level")) return "0.35 is level on an edge";
    await tilt(70, 20);
    // sin 20 cos 70 = 0.117 across, sin 70 = 0.940 down: atan(0.117 / 0.940) = 7.1°.
    if (say() !== "Turn 7.1° left") return "edge words: " + say() + " " + big();
    await tap($(".ui-spirit-zero"));
    await wait(80);
    if (!box0().hasAttribute("data-level")) return "edge zero";

    // Back to lying down: a zero of its own, so the flat reading is untouched.
    await tilt(0, 0);
    if (box0().dataset.mode !== "flat" || !$(".ui-spirit-dial")) return "back to flat: " + box0().dataset.mode;
    if (big() !== "0.0°") return "the edge's zero leaked: " + big();

    // A haptic through vibrate where the app is not.
    delete window.quilloNative;
    const v = Object.getOwnPropertyDescriptor(Navigator.prototype, "vibrate");
    const shook = [];
    Object.defineProperty(Navigator.prototype, "vibrate", { configurable: true, value: (p) => { shook.push(p); return true; } });
    await tilt(5, 0);
    await tilt(0, 0);
    Object.defineProperty(Navigator.prototype, "vibrate", v);
    if (JSON.stringify(shook) !== "[15]") return "vibrate: " + JSON.stringify(shook);

    // Tablet: readings beside the dial. Phone: under it.
    const dial = $(".ui-spirit-dial").getBoundingClientRect(), read = $(".ui-spirit-read").getBoundingClientRect();
    if (device === "tablet" && !(read.left >= dial.right)) return "tablet layout";
    if (device === "phone" && !(read.top >= dial.bottom)) return "phone layout";
    const px = dial.width;
    if (px < (device === "tablet" ? 350 : 150)) return "dial too small: " + px;
    const ring = $(".ui-spirit-ring").getBoundingClientRect();
    if (Math.round(ring.width) !== 68) return "the ring should not grow with the dial: " + ring.width;
    // The number and its words stay one above the other, in the middle of the dial's height.
    const n = $(".ui-spirit-big").getBoundingClientRect(), w = $(".ui-spirit-say").getBoundingClientRect();
    if (!(w.top >= n.bottom)) return "the words should be under the number";
    if (device === "tablet" && Math.abs((read.top + read.bottom) / 2 - (dial.top + dial.bottom) / 2) > dial.height / 3) return "tablet: the readings should sit by the dial's middle";

    // Empty readings after real ones are ignored.
    window.dispatchEvent(new DeviceOrientationEvent("deviceorientation", { alpha: null, beta: null, gamma: null }));
    await wait(40);
    if (say().startsWith("There is no")) return "one empty reading is not no sensor";
} finally {
    delete window.quilloNative;
    await cdp("DeviceOrientation.clearDeviceOrientationOverride");
    await metric({ screenOrientation: { type: "portraitPrimary", angle: 0 } });
}
