// mobile
const box = () => $(".ui-qr-scanner");
const note = () => $("#qr-scanner-demo-note").textContent;
const button = (t) => [...$$("button")].find((b) => b.textContent.trim() === t);
const until = async (f, ms = 2500) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
if (box().dataset.state !== "idle") return `starts as ${box().dataset.state}`;
const field = box().querySelector(".ui-qr-scanner-row input");
if (getComputedStyle(field).fontSize !== "16px") return "an input under 16 px makes iOS zoom";
if (box().querySelector("label").htmlFor !== field.id) return "the field has no label";

// The detector: a stand-in, as a test picture cannot be pointed at a fake camera.
const Real = window.BarcodeDetector;
const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
let answers = [], looks = 0, at_once = 0, most_at_once = 0, slow = 0;
class Fake {
    static async getSupportedFormats() { return Fake.formats; }
    constructor(o) { Fake.asked = o; }
    async detect(v) {
        looks++; at_once++; most_at_once = Math.max(most_at_once, at_once);
        if (!(v instanceof HTMLVideoElement)) throw new Error("not a video");
        if (slow) await wait(slow);
        at_once--;
        const a = answers.shift();
        if (a instanceof Error) throw a;
        return a ?? [];
    }
}
Fake.formats = ["qr_code", "ean_13"];
window.BarcodeDetector = Fake;
const given = [];
navigator.mediaDevices.getUserMedia = async (c) => { const s = await real(c); given.push(s); return s; };
const off = () => given.every((s) => s.getTracks().every((t) => t.readyState === "ended"));
try {
    await tap(button("Scan a code"));
    if (!await until(() => box().dataset.state === "scanning")) return `no scanning: ${box().dataset.state}: ${box().textContent}`;
    if (Fake.asked.formats.join() !== "qr_code") return "it asks for more than QR codes";
    if (!box().querySelector(".ui-qr-scanner-finder")) return "no viewfinder";
    // Chrome's fake camera has no light.
    if (!/no light a page can reach/.test(box().textContent) || button("Torch on")) return "a camera without a light is not explained";

    // It keeps looking through nothing and through a failed look, at the interval, one at a time.
    answers = [[], new Error("failed"), []];
    slow = 400;
    await until(() => looks >= 3, 3000);
    slow = 0;
    if (most_at_once !== 1) return `${most_at_once} looks at once`;
    if (box().dataset.state !== "scanning") return `a failed look stopped it: ${box().dataset.state}`;

    // A code: once, with its kind, and the camera goes.
    answers = [[{ rawValue: "  https://quillolang.org/x\u0007 " }]];
    if (!await until(() => box().dataset.state === "found")) return `the code was not read: ${box().dataset.state}`;
    if (note() !== "on_scan got: https://quillolang.org/x") return `on_scan: ${note()}`;
    if (box().querySelector(".ui-qr-scanner-kind").textContent !== "A link") return "the kind is wrong";
    if (!off()) return "the camera stays on after a code";
    if ($$(".ui-qr-scanner a").length) return "a code became a link by itself";
    await wait(600);
    if (note() !== "on_scan got: https://quillolang.org/x") return "on_scan again after the first";

    // A torch: a track that has one, driven by a finger.
    const applied = [];
    navigator.mediaDevices.getUserMedia = async (c) => {
        const s = await real(c), t = s.getVideoTracks()[0];
        t.getCapabilities = () => ({ torch: true });
        t.applyConstraints = async (x) => { applied.push(x.advanced[0].torch); };
        given.push(s);
        return s;
    };
    await tap(button("Scan again"));
    await until(() => box().dataset.state === "scanning");
    if (!await until(() => button("Torch on"))) return "no torch button";
    await tap(button("Torch on"));
    await until(() => button("Torch off"));
    if (applied.join() !== "true" || button("Torch off").getAttribute("aria-pressed") !== "true") return `the torch: ${applied}`;
    await tap(button("Torch off"));
    await until(() => button("Torch on"));
    if (applied.join() !== "true,false") return `the torch: ${applied}`;

    // The app leaves the screen.
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    await wait(60);
    if (box().dataset.state !== "idle" || !off() || !/while the app was away/.test(box().textContent)) return `away: ${box().dataset.state}`;

    // By hand: refused empty, then Enter; a kind of each.
    const input = () => box().querySelector(".ui-qr-scanner-row input");
    await tap(button("Use"));
    if (!/Type the code first/.test(box().textContent) || !/^Nothing|^on_scan got: https/.test(note())) return "an empty code is taken";
    const by_hand = async (text, kind) => {
        type(input(), text);
        await wait(30);
        key(input(), "Enter");
        await wait(60);
        if (box().dataset.state !== "found") return `typed ${text}: ${box().dataset.state}`;
        if (box().querySelector(".ui-qr-scanner-kind").textContent !== kind) return `typed ${text}: ${box().querySelector(".ui-qr-scanner-kind").textContent}`;
        if (note() !== `on_scan got: ${text}`) return `typed ${text}: ${note()}`;
        if (input().value !== "") return "the field keeps the code";
    };
    for (const [t, k] of [["ABC-123", "Text"], ["MAILTO:a@b.co", "An email address"], ["tel:+15145550100", "A phone number"], ["WIFI:S:Cafe;T:WPA;P:beans;;", "A Wi-Fi network"]]) {
        const bad = await by_hand(t, k);
        if (bad) return bad;
    }
    type(input(), "x".repeat(5000));
    await wait(30);
    await tap(button("Use"));
    if (box().querySelector(".ui-qr-scanner-text").textContent.length !== 4096) return "a long code is not cut";

    // Leaving the page while scanning.
    await tap(button("Scan again"));
    await until(() => box().dataset.state === "scanning");
    await tap(button("Leave the page"));
    if (box() || !off()) return "the camera stays on when the component leaves";
    await tap(button("Come back"));
    await wait(80);

    // A class with no QR format: says so, no camera asked for; by hand still works.
    Fake.formats = ["ean_13"];
    const before = given.length;
    await tap(button("Scan a code"));
    await wait(80);
    if (box().dataset.state !== "no_detector" || given.length !== before) return `no QR format: ${box().dataset.state}`;
    if (!/cannot read codes/.test(box().textContent)) return "no detector is not explained";

    // A detector that throws at its making, or when asked what it reads: no detector, not a stop.
    class Throws { constructor() { throw new TypeError("no"); } static async getSupportedFormats() { return ["qr_code"]; } }
    class Asks { static getSupportedFormats() { throw new TypeError("no"); } }
    for (const Kind of [Throws, Asks]) {
        await tap(button("Leave the page"));
        await tap(button("Come back"));
        await wait(80);
        window.BarcodeDetector = Kind;
        await tap(button("Scan a code"));
        await wait(100);
        if (box().dataset.state !== "no_detector") return `a detector that throws: ${box().dataset.state}`;
    }
    window.BarcodeDetector = Fake;

    // No detector at all, as on an iPhone.
    window.BarcodeDetector = undefined;
    type(box().querySelector(".ui-qr-scanner-row input"), "PLAIN");
    await wait(30);
    await tap(button("Use"));
    if (box().dataset.state !== "found" || note() !== "on_scan got: PLAIN") return `by hand with no detector: ${note()}`;
    await tap(button("Scan again"));
    await wait(60);
    if (box().dataset.state !== "no_detector") return `no detector: ${box().dataset.state}`;
    window.BarcodeDetector = Fake;
    Fake.formats = ["qr_code"];

    // Refused.
    await tap(button("Leave the page"));
    await tap(button("Come back"));
    await wait(80);
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotAllowedError"); };
    let settings = 0;
    window.quilloNative = { openSettings: () => { settings++; return true; }, haptic: () => true };
    await tap(button("Scan a code"));
    if (!await until(() => box().dataset.state === "refused")) return `refused: ${box().dataset.state}`;
    if (!/not allowed/.test(box().querySelector("[role=alert]").textContent)) return "the refusal is not explained";
    await tap(button("Open Settings"));
    if (settings !== 1) return "Settings does not open";
    delete window.quilloNative;
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotFoundError"); };
    await tap(button("Try again"));
    if (!await until(() => box().dataset.state === "none")) return `no camera: ${box().dataset.state}`;
} finally {
    navigator.mediaDevices.getUserMedia = real;
    window.BarcodeDetector = Real;
    delete window.quilloNative;
}
const cols = getComputedStyle(box().querySelector(".ui-qr-scanner-body")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return `${device} has ${cols} columns`;
