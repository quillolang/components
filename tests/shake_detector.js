// mobile
const note = () => $("#shake-detector-demo-note").textContent;
const status = () => $(".ui-shake-note")?.textContent ?? "";
const show = () => $("#shake-detector-demo-show");
const remount = async () => { await tap(show()); await tap(show()); await wait(100); };
const meta = { available: true, minimumFrequency: 1, maximumFrequency: 60 };
const sensors = ["accelerometer", "linear-acceleration", "gyroscope"];
// Sends a run of samples through a real DeviceMotionEvent at about 60 a second: a test
// cannot get an exact series past the real sensor's sampling.
const sample = (x, y, z) => window.dispatchEvent(new DeviceMotionEvent("devicemotion", { accelerationIncludingGravity: { x, y, z }, interval: 16 }));
const run = async (list) => { for (const [x, y, z] of list) { sample(x, y, z); await new Promise((r) => requestAnimationFrame(r)); } };
const still = (n) => Array.from({ length: n }, () => [0, 0, 9.8]);
const swing = (peaks, size, gap = 6) => peaks.flatMap((_, i) => [...Array.from({ length: gap }, () => [i % 2 ? size : -size, 0, 9.8])]);
try {
    // No sensor in this Chrome: said, and the button is the way.
    if (status() !== "No motion sensor here. Use the button.") return "no sensor: " + status();
    await tap($(".ui-shake-do"));
    if (note() !== "Undone 1 times; the last by button.") return "button: " + note();

    // The keyboard reaches the same thing.
    $(".ui-shake-do").focus();
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(150);
    if (note() !== "Undone 2 times; the last by button.") return "keyboard: " + note();

    // A real sensor, through Chrome's own: three reversals is a shake.
    for (const type of sensors) await cdp("Emulation.setSensorOverrideEnabled", { enabled: true, type, metadata: meta });
    const read = (x, y, z) => cdp("Emulation.setSensorOverrideReadings", { type: "accelerometer", reading: { xyz: { x, y, z } } });
    await read(0, 0, 9.8);
    await cdp("Emulation.setSensorOverrideReadings", { type: "linear-acceleration", reading: { xyz: { x: 0, y: 0, z: 0 } } });
    await cdp("Emulation.setSensorOverrideReadings", { type: "gyroscope", reading: { xyz: { x: 0, y: 0, z: 0 } } });
    // The button under a finger on "Try again" must not take its place when that goes: it may undo something.
    const gone = $(".ui-shake-start").getBoundingClientRect();
    await tap($(".ui-shake-start"));
    await wait(300);
    if (status() !== "") return "listening: " + status();
    const now = $(".ui-shake-do").getBoundingClientRect();
    if (now.bottom > gone.top && now.top < gone.bottom && now.right > gone.left && now.left < gone.right) return "the main button moved into the other's place";
    if (!note().startsWith("Undone 2 times")) return "sitting still shook: " + note();
    for (const x of [-20, 20, -20, 20, -20]) { await read(x, 0, 9.8); await wait(70); }
    await wait(150);
    if (!note().startsWith("Undone 3 times") || !note().endsWith("by motion.")) return "real shake: " + note();
    await read(0, 0, 9.8);
    await wait(1200);
    // Chrome's sensors off again: from here the samples are exact.
    await tap(show());
    for (const type of sensors) await cdp("Emulation.setSensorOverrideEnabled", { enabled: false, type });
    await tap(show());
    await wait(150);
    await run(still(20));
    const n = () => Number(note().match(/Undone (\d+)/)[1]);
    const base = n();

    // A bump: one hard jolt, in one direction, is not a shake.
    await run([[25, 0, 9.8], [25, 0, 9.8], [25, 0, 9.8], [0, 0, 9.8]]);
    await run(still(30));
    if (n() !== base) return "a bump counted: " + note();

    // Steady shaking under the threshold: walking.
    await run(swing([1, 2, 3, 4, 5, 6], 8, 3));
    await run(still(30));
    if (n() !== base) return "under the threshold counted: " + note();

    // Hard jolts too slow to be one shake: 3 jolts a second apart each.
    await run([[20, 0, 9.8]]); await wait(1000);
    await run([[-20, 0, 9.8]]); await wait(1000);
    await run([[20, 0, 9.8]]);
    await run(still(30));
    if (n() !== base) return "slow jolts counted: " + note();

    // Hard and quick: one shake.
    await run([[20, 0, 9.8], [20, 0, 9.8], [-20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [20, 0, 9.8], [0, 0, 9.8]]);
    await wait(60);
    if (n() !== base + 1 || !note().endsWith("by motion.")) return "a shake: " + note();
    if (!$(".ui-shake-card").hasAttribute("data-hit")) return "should show the hit";
    if (!status().startsWith("Shake ")) return "says: " + status();

    // Debounce: shaking goes straight on, and it does not count again inside `rest`.
    await run([[20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [-20, 0, 9.8]]);
    if (n() !== base + 1) return "inside the rest: " + note();
    await wait(1100);
    await run(still(30));
    await run([[20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [0, 0, 9.8]]);
    if (n() !== base + 2) return "after the rest: " + note();

    // On another axis, and with the signs of iOS: only the change of direction counts.
    await wait(1100);
    await run(still(90).map(([x, y, z]) => [x, y, -z]));
    await run([[0, 22, -9.8], [0, -22, -9.8], [0, 22, -9.8], [0, 0, -9.8]]);
    if (n() !== base + 3) return "y axis, gravity negative: " + note();
    if (!(new DOMMatrix(getComputedStyle($(".ui-shake-fill")).transform).a >= 0)) return "meter: " + getComputedStyle($(".ui-shake-fill")).transform;

    // The meter moves by transform, in the handler: full at the threshold.
    await wait(1100);
    await run(still(30));
    sample(30, 0, 9.8);
    await wait(30);
    if (new DOMMatrix(getComputedStyle($(".ui-shake-fill")).transform).a !== 1) return "meter at the top: " + getComputedStyle($(".ui-shake-fill")).transform;
    await run(still(40));

    // Bad readings do nothing and throw nothing.
    window.dispatchEvent(new DeviceMotionEvent("devicemotion", { accelerationIncludingGravity: { x: null, y: null, z: null }, interval: 16 }));
    await wait(50);
    if (n() !== base + 3) return "bad readings counted";

    // Paused: says so, motion does not count, the button does.
    await wait(1100);
    await tap($("#shake-detector-demo-pause"));
    if (status() !== "Not listening for a shake.") return "paused: " + status();
    await run(still(20));
    await run([[20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [0, 0, 9.8]]);
    if (n() !== base + 3) return "paused still counted: " + note();
    await tap($(".ui-shake-do"));
    if (n() !== base + 4) return "the button while paused: " + note();
    await wait(1100);
    await tap($("#shake-detector-demo-pause"));
    await run(still(20));
    await run([[20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [0, 0, 9.8]]);
    if (n() !== base + 5) return "listening again: " + note();

    // Gone from the page, it listens no more.
    await tap(show());
    await run([[20, 0, 9.8], [-20, 0, 9.8], [20, 0, 9.8], [-20, 0, 9.8]]);
    if (n() !== base + 5) return "still listening after leaving";

    // iOS: no tap, it fails, so a button shows; the tap turns it on.
    const real = DeviceMotionEvent.requestPermission;
    let asks = 0, answer = async () => { if (++asks === 1) throw new DOMException("Requesting device motion access requires a user gesture", "NotAllowedError"); return "granted"; };
    DeviceMotionEvent.requestPermission = () => answer();
    // The sensor stays on through this, or Chrome's empty event says there is none.
    for (const type of sensors) await cdp("Emulation.setSensorOverrideEnabled", { enabled: true, type, metadata: meta });
    await read(0, 0, 9.8);
    await cdp("Emulation.setSensorOverrideReadings", { type: "linear-acceleration", reading: { xyz: { x: 0, y: 0, z: 0 } } });
    await cdp("Emulation.setSensorOverrideReadings", { type: "gyroscope", reading: { xyz: { x: 0, y: 0, z: 0 } } });
    await show().click();
    await wait(200);
    if (!status().startsWith("This phone asks before")) return "ios at first: " + status();
    if ($(".ui-shake-start").textContent.trim() !== "Turn on shake") return "ios button: " + $(".ui-shake-start").textContent;
    await tap($(".ui-shake-start"));
    await wait(100);
    if (status() !== "" || $(".ui-shake-start")) return "ios on: " + status();
    await wait(200);
    for (const x of [-20, 20, -20, 20, -20]) { await read(x, 0, 9.8); await wait(70); }
    await read(0, 0, 9.8);
    await wait(150);
    if (n() !== base + 6) return "ios shake: " + note();
    await tap(show());
    for (const type of sensors) await cdp("Emulation.setSensorOverrideEnabled", { enabled: false, type });
    await tap(show());
    await wait(100);

    // iOS, refused: the button stays the way, and a way to try again.
    answer = async () => "denied";
    await tap(show()); await tap(show());
    await wait(100);
    if (!status().startsWith("Motion was refused.")) return "ios refused: " + status();
    if (!$(".ui-shake-do")) return "the button should stay";
    await tap($(".ui-shake-do"));
    if (n() !== base + 7) return "the button after a refusal: " + note();
    DeviceMotionEvent.requestPermission = real;

    // No events at all for 2.5 s: a browser that never says.
    const add = window.addEventListener;
    window.addEventListener = function (t, ...a) { return t === "devicemotion" ? undefined : add.call(this, t, ...a); };
    await tap($(".ui-shake-start"));
    await wait(100);
    const quiet = status();
    await wait(2600);
    window.addEventListener = add;
    if (quiet !== "") return "before the clock: " + quiet;
    if (status() !== "No motion sensor here. Use the button.") return "silence: " + status();
    if (device === "tablet") {
        const b = $(".ui-shake-do").getBoundingClientRect(), s = $(".ui-shake-say").getBoundingClientRect();
        if (!(b.left >= s.right)) return "tablet: the buttons should stand beside the words";
    }
} finally {
    for (const type of sensors) await cdp("Emulation.setSensorOverrideEnabled", { enabled: false, type });
}
