// mobile
const row = () => $(".ui-keepawake-row");
const on = () => row().getAttribute("aria-checked");
const say = () => $(".ui-keepawake-say").textContent;
const note = () => $("#keep-awake-toggle-demo-note").textContent;
const req = WakeLock.prototype.request;
const vis = (v) => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v }); document.dispatchEvent(new Event("visibilitychange")); };
let locks = [], asked = 0;
WakeLock.prototype.request = function (...a) { asked++; return req.apply(this, a).then((s) => { locks.push(s); return s; }); };
try {
    // `start`: holding from the page's first moment, with no tap.
    const first = $$(".ui-keepawake-row")[1], line = $$(".ui-keepawake-say")[1];
    if (first.getAttribute("aria-checked") !== "true" || line.textContent !== "The screen stays on while this page is showing.") return "start at load: " + first.getAttribute("aria-checked") + " " + line.textContent;
    await tap(first);
    await wait(120);
    if (first.getAttribute("aria-checked") !== "false" || line.textContent !== "") return "start, turned off: " + line.textContent;

    if (on() !== "false" || say() !== "") return "starts on: " + on() + " " + say();

    // A real Wake Lock, from a real tap.
    await tap(row());
    await wait(150);
    if (on() !== "true" || locks.length !== 1 || locks[0].released) return "no lock: " + on() + " " + locks.length + " " + say();
    if (say() !== "The screen stays on while this page is showing.") return "held: " + say();
    if (!note().startsWith("on_change: true, web.")) return "on_change: " + note();

    // Off releases it.
    await tap(row());
    await wait(150);
    if (on() !== "false" || !locks[0].released || say() !== "") return "off: " + on() + " " + locks[0].released + " " + say();
    if (!note().startsWith("on_change: false, none.")) return "on_change off: " + note();

    // The page leaves the screen, the browser lets go, and it comes back: taken again.
    await tap(row());
    await wait(150);
    const n = asked;
    vis("hidden");
    await locks.at(-1).release();
    await wait(100);
    if (say() !== "The page left the screen. It will hold the screen again on coming back.") return "away: " + say();
    if (on() !== "true") return "the switch should stay on while away";
    if (!note().startsWith("on_change: false")) return "away on_change: " + note();
    vis("visible");
    await wait(200);
    if (asked !== n + 1 || locks.at(-1).released) return "not taken again: " + asked + " vs " + n;
    if (say() !== "The screen stays on while this page is showing." || !note().startsWith("on_change: true, web.")) return "again: " + say();
    // Coming back with the lock still held asks for nothing.
    vis("visible");
    await wait(100);
    if (asked !== n + 1) return "asked again with the lock held";

    // The system lets go with the page on the screen: said, and not fought.
    await locks.at(-1).release();
    await wait(100);
    if (say() !== "The system let the screen go. Turn this on to hold it again." || on() !== "false") return "lost: " + say() + " " + on();
    if (!$(".ui-keepawake-say").hasAttribute("data-bad")) return "lost should stand out";

    // Refused, as iOS does in Low Power Mode.
    WakeLock.prototype.request = () => Promise.reject(new DOMException("Wake Lock permission request denied: low battery", "NotAllowedError"));
    await tap(row());
    await wait(150);
    if (say() !== "Refused: the phone is saving power. Low Power Mode or a low battery can do this.") return "power: " + say();
    if (on() !== "false") return "a refused switch should not stay on";
    if (!note().includes("Last refused: power.")) return "on_refused: " + note();

    // Refused for being hidden comes right on return.
    let tries = 0;
    WakeLock.prototype.request = function (...a) { tries++; return tries === 1 ? Promise.reject(new DOMException("The requesting page is not visible", "NotAllowedError")) : req.apply(this, a).then((s) => { locks.push(s); return s; }); };
    await tap(row());
    await wait(150);
    if (say() !== "Refused: the page must be showing. It will try again on coming back.") return "hidden: " + say();
    if (on() !== "true") return "wanted should stay after a hidden refusal";
    vis("visible");
    await wait(200);
    if (say() !== "The screen stays on while this page is showing.") return "after hidden: " + say();
    await tap(row());
    await wait(150);

    // No Wake Lock at all.
    const desc = Object.getOwnPropertyDescriptor(Navigator.prototype, "wakeLock");
    Object.defineProperty(Navigator.prototype, "wakeLock", { configurable: true, get: () => undefined });
    await tap(row());
    await wait(150);
    Object.defineProperty(Navigator.prototype, "wakeLock", desc);
    if (say() !== "This browser cannot hold the screen on, so it will dim as usual.") return "none: " + say();
    if (on() !== "false") return "none leaves it off";

    // A person turning it off while the browser answers: the lock is given straight back.
    WakeLock.prototype.request = function (...a) { return wait(120).then(() => req.apply(this, a)).then((s) => { locks.push(s); return s; }); };
    await tap(row());
    await tap(row());
    await wait(250);
    if (on() !== "false" || !locks.at(-1).released) return "turned off while asking: " + on() + " " + locks.at(-1).released;

    // The app: quilloNative first; the web's lock is not touched; off says false.
    const calls = [];
    let keep = async (v) => { calls.push(v); return v; };
    window.quilloNative = { keepAwake: (v) => keep(v) };
    WakeLock.prototype.request = () => { throw new Error("the web's lock was used in the app"); };
    await tap(row());
    await wait(150);
    if (calls.join() !== "true" || on() !== "true") return "app on: " + calls.join();
    if (say() !== "The screen stays on while this app is open.") return "app say: " + say();
    if (!note().startsWith("on_change: true, app.")) return "app on_change: " + note();
    // Back from elsewhere, it says it again.
    vis("visible");
    await wait(150);
    if (calls.join() !== "true,true") return "app again: " + calls.join();
    await tap(row());
    await wait(150);
    if (calls.join() !== "true,true,false" || on() !== "false") return "app off: " + calls.join();

    // The app refusing.
    keep = async () => { throw new Error("not now"); };
    await tap(row());
    await wait(150);
    if (say() !== "Refused: this browser did not allow it just now." || on() !== "false") return "app refused: " + say();

    // The keyboard: it is a button.
    keep = async (v) => v;
    row().focus();
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(150);
    if (on() !== "true") return "Enter should flip it";
    await tap(row());
    await wait(100);
    if (row().getBoundingClientRect().height < 56) return "row height: " + row().getBoundingClientRect().height;
    // On a tablet the words stand beside the switch, which does not run the whole width.
    window.quilloNative = { keepAwake: async (v) => v };
    await tap(row());
    await wait(100);
    const r = row().getBoundingClientRect(), s = $(".ui-keepawake-say").getBoundingClientRect();
    if (device === "tablet" && !(s.left >= r.right && r.width <= 420)) return "tablet: " + r.width + " " + s.left;
    if (device === "phone" && !(s.top >= r.bottom)) return "phone: the words go under the switch";
    await tap(row());
} finally {
    delete window.quilloNative;
    delete document.visibilityState;
    WakeLock.prototype.request = req;
}
