// mobile
const btn = (text) => $$(".ui-btn").find((b) => b.textContent.trim() === text);
const wrap = (text) => btn(text).closest(".ui-hapbtn");
const note = () => $("#haptic-button-demo-note").textContent;
const names = ["Selection", "Light", "Medium", "Heavy", "Soft", "Rigid", "Success", "Warning", "Error"];
const vibrate = Object.getOwnPropertyDescriptor(Navigator.prototype, "vibrate");
const setVibrate = (f) => Object.defineProperty(Navigator.prototype, "vibrate", { configurable: true, writable: true, value: f });
try {
    // The app: each name goes to quilloNative as it is, and vibrate is not touched.
    const felt = [], shook = [];
    window.quilloNative = { haptic: async (k) => { felt.push(k); return k; } };
    setVibrate((p) => { shook.push(p); return true; });
    for (const n of names) {
        await tap(btn(n));
        if (wrap(n).dataset.pattern !== n.toLowerCase()) return "data-pattern of " + n + ": " + wrap(n).dataset.pattern;
        if (wrap(n).dataset.felt !== "app") return "data-felt of " + n + ": " + wrap(n).dataset.felt;
    }
    if (felt.join() !== names.join().toLowerCase()) return "the app was given: " + felt.join();
    if (shook.length) return "vibrate was called in the app";
    if (!note().startsWith("Pressed 9 times") || !note().endsWith("felt: app.")) return "callback: " + note();

    // An unknown name is medium, and the words say so.
    await tap(btn("A name it does not know"));
    if (felt.at(-1) !== "medium" || wrap("A name it does not know").dataset.pattern !== "medium") return "unknown name: " + felt.at(-1);
    if (wrap("A name it does not know").querySelector(".ui-hapbtn-say").textContent !== "Felt medium through the app") return "words: " + wrap("A name it does not know").querySelector(".ui-hapbtn-say").textContent;

    // The app failing falls to vibrate.
    window.quilloNative = { haptic: async () => { throw new Error("no feedback here"); } };
    await tap(btn("Heavy"));
    if (wrap("Heavy").dataset.felt !== "vibrate" || JSON.stringify(shook.at(-1)) !== "[40]") return "after the app failed: " + wrap("Heavy").dataset.felt;
    shook.length = 0;

    // No app: each name's vibrate pattern, exactly.
    delete window.quilloNative;
    const want = { Selection: [8], Light: [12], Medium: [20], Heavy: [40], Soft: [30], Rigid: [16], Success: [15, 60, 30], Warning: [30, 80, 30], Error: [50, 60, 50, 60, 50] };
    for (const n of names) {
        await tap(btn(n));
        if (JSON.stringify(shook.at(-1)) !== JSON.stringify(want[n])) return n + " vibrated " + JSON.stringify(shook.at(-1));
        if (wrap(n).dataset.felt !== "vibrate") return "felt " + wrap(n).dataset.felt;
    }
    await tap(btn("A name it does not know"));
    if (wrap("A name it does not know").querySelector(".ui-hapbtn-say").textContent !== "Vibrated medium: 20 ms") return "vibrate words: " + wrap("A name it does not know").querySelector(".ui-hapbtn-say").textContent;

    // vibrate refusing is nothing to feel, and the press still counts.
    setVibrate(() => false);
    const count = Number(note().match(/Pressed (\d+)/)[1]);
    await tap(btn("Success"));
    if (wrap("Success").dataset.felt !== "none") return "refused vibrate: " + wrap("Success").dataset.felt;
    if (!note().startsWith(`Pressed ${count + 1} times`) || !note().endsWith("felt: none.")) return "press not counted: " + note();

    // Neither there: iOS Safari. Nothing shows as wrong.
    delete Navigator.prototype.vibrate;
    await tap(btn("A name it does not know"));
    if (wrap("A name it does not know").dataset.felt !== "none") return "no vibrate: " + wrap("A name it does not know").dataset.felt;
    if (wrap("A name it does not know").querySelector(".ui-hapbtn-say").textContent !== "This device has no way to feel it") return "none words";

    // Muted: no call at all.
    window.quilloNative = { haptic: async (k) => { felt.push(k); } };
    setVibrate((p) => { shook.push(p); return true; });
    const f = felt.length, s = shook.length;
    await tap(btn("Muted"));
    if (felt.length !== f || shook.length !== s) return "muted still felt";
    if (wrap("Muted").dataset.felt !== "muted") return "muted: " + wrap("Muted").dataset.felt;
    // `muted` follows the state given to it, both ways.
    await tap($("#haptic-button-demo-quiet"));
    await tap(btn("Muted"));
    if (felt.length !== f + 1 || felt.at(-1) !== "medium" || wrap("Muted").dataset.felt !== "app") return "unmuted: " + wrap("Muted").dataset.felt;
    await tap($("#haptic-button-demo-quiet"));
    await tap(btn("Muted"));
    if (felt.length !== f + 1 || wrap("Muted").dataset.felt !== "muted") return "muted again: " + wrap("Muted").dataset.felt;

    // Disabled does nothing.
    const c2 = note();
    await tap(btn("Disabled"));
    if (note() !== c2 || felt.length !== f + 1) return "disabled pressed";

    // The keyboard: Enter on a focused button is a press, and is felt.
    btn("Rigid").focus();
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(200);
    if (felt.at(-1) !== "rigid") return "the keyboard's press: " + felt.at(-1);
    if (getComputedStyle(btn("Rigid")).touchAction !== "manipulation") return "touch-action: " + getComputedStyle(btn("Rigid")).touchAction;

    // A real tap and Chrome's own vibrate, with no stand-in.
    delete window.quilloNative;
    Object.defineProperty(Navigator.prototype, "vibrate", vibrate);
    await tap(btn("Light"));
    if (!["vibrate", "none"].includes(wrap("Light").dataset.felt)) return "real vibrate: " + wrap("Light").dataset.felt;
} finally {
    delete window.quilloNative;
    Object.defineProperty(Navigator.prototype, "vibrate", vibrate);
}
