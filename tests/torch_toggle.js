// mobile
const box = () => $(".ui-torch-toggle");
const btn = () => box().querySelector(".ui-torch-toggle-btn");
const note = () => $("#torch-toggle-demo-note").textContent;
const leave = () => [...$$("button")].find((b) => /Leave the page|Come back/.test(b.textContent));
const until = async (f, ms = 2000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
if (btn().getAttribute("aria-pressed") !== "false" || btn().getAttribute("aria-label") !== "Torch") return "the button does not start off";
// Chrome's fake camera has no light: a real answer, in words.
await tap(btn());
if (!await until(() => box().dataset.state === "none")) return `the fake camera: ${box().dataset.state}`;
if (!/does not let a page reach its light/.test(box().textContent) || btn().getAttribute("aria-pressed") !== "false") return "no light is not explained";

// A camera with a light: a real stream whose track says it has one.
const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
const asked = [], tracks = [];
let refuse_light = false, caps = { torch: true };
navigator.mediaDevices.getUserMedia = async (c) => {
    const s = await real(c), t = s.getVideoTracks()[0];
    t.getCapabilities = () => { if (caps === "throw") throw new DOMException("no", "NotSupportedError"); return caps; };
    t.applyConstraints = async (x) => { if (refuse_light && x.advanced[0].torch) throw new DOMException("busy", "NotReadableError"); asked.push(x.advanced[0].torch); };
    tracks.push(t);
    return s;
};
try {
    await tap(btn());
    if (!await until(() => box().dataset.state === "on")) return `with a light: ${box().dataset.state} ${box().textContent}`;
    if (asked.join() !== "true" || btn().getAttribute("aria-pressed") !== "true" || note() !== "on_change said: on") return `on: ${asked} ${note()}`;
    if (!/The light is on/.test(box().textContent)) return "it does not say it is on";

    // Off by a finger, by the keyboard's Enter (a button's own), and the camera is let go.
    await tap(btn());
    await wait(60);
    if (asked.join() !== "true,false" || box().dataset.state !== "off" || note() !== "on_change said: off") return `off: ${asked} ${box().dataset.state}`;
    if (tracks.at(-1).readyState !== "ended") return "the camera stays open with the light off";

    // A light refused by the phone at the last moment.
    refuse_light = true;
    await tap(btn());
    if (!await until(() => box().dataset.state === "none")) return `refused light: ${box().dataset.state}`;
    if (!/would not turn on/.test(box().textContent) || tracks.at(-1).readyState !== "ended") return "a refused light is not explained";
    refuse_light = false;

    // A list of capabilities, as the spec first had it.
    caps = { torch: [true, false] };
    await tap(btn());
    if (!await until(() => box().dataset.state === "on")) return `torch as a list: ${box().dataset.state}`;
    await tap(btn());
    await wait(60);
    caps = { torch: true };

    // ImageCapture and getCapabilities throwing: no light, in words, not a stuck button.
    const IC = window.ImageCapture;
    window.ImageCapture = class { constructor() { throw new DOMException("no", "NotSupportedError"); } };
    await tap(btn());
    const through = await until(() => box().dataset.state === "on", 800);
    window.ImageCapture = IC;
    if (!through) return `ImageCapture throwing: ${box().dataset.state}`;
    await tap(btn());
    await wait(60);
    caps = "throw";
    await tap(btn());
    const told = await until(() => box().dataset.state === "none", 800);
    caps = { torch: true };
    if (!told || tracks.at(-1).readyState !== "ended") return `getCapabilities throwing: ${box().dataset.state}`;

    // The app leaves the screen: the light goes out.
    await tap(btn());
    await until(() => box().dataset.state === "on");
    asked.length = 0;
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    await wait(60);
    if (asked.join() !== "false" || box().dataset.state !== "off" || note() !== "on_change said: off") return `away: ${asked} ${box().dataset.state}`;
    if (!/left the screen/.test(box().textContent)) return "going out is not explained";

    // The camera taken away: it says so.
    await tap(btn());
    await until(() => box().dataset.state === "on");
    tracks.at(-1).dispatchEvent(new Event("ended"));
    await wait(60);
    if (box().dataset.state !== "off" || !/camera stopped/.test(box().textContent) || note() !== "on_change said: off") return `ended: ${box().dataset.state}`;

    // The component leaves the page: out, and let go.
    await tap(btn());
    await until(() => box().dataset.state === "on");
    asked.length = 0;
    const last = tracks.at(-1);
    await tap(leave());
    if (box() || asked.join() !== "false" || last.readyState !== "ended") return `leaving: ${asked} ${last.readyState}`;
    await tap(leave());
    await wait(80);

    // Refused: Settings in the app, not in a browser.
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotAllowedError"); };
    await tap(btn());
    if (!await until(() => box().dataset.state === "refused")) return `refused: ${box().dataset.state}`;
    if ($(".ui-torch-toggle-settings")) return "Settings is offered in a browser";
    let settings = 0;
    window.quilloNative = { openSettings: () => { settings++; return true; }, haptic: () => true };
    await tap(btn());
    await until(() => $(".ui-torch-toggle-settings"));
    await tap($(".ui-torch-toggle-settings"));
    if (settings !== 1) return "Settings does not open";
    delete window.quilloNative;

    // A page that cannot reach a camera at all.
    const md = Object.getOwnPropertyDescriptor(Navigator.prototype, "mediaDevices");
    Object.defineProperty(Navigator.prototype, "mediaDevices", { get: () => undefined, configurable: true });
    await tap(btn());
    Object.defineProperty(Navigator.prototype, "mediaDevices", md);
    if (box().dataset.state !== "none" || !/does not let a page/.test(box().textContent)) return `no mediaDevices: ${box().dataset.state}`;
} finally {
    navigator.mediaDevices.getUserMedia = real;
    delete window.quilloNative;
}
