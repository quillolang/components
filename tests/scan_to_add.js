// mobile
const field = $("#ui-scanadd-code"), said = () => $(".ui-scanadd-said").textContent;
const rows = () => $$(".ui-scanadd-row").map((r) => r.querySelector(".ui-scanadd-code").textContent + "x" + r.querySelector(".ui-scanadd-n").textContent).join(" ");
const btn = (t) => $$(".ui-scanadd .ui-btn").find((b) => b.textContent.trim() === t);
const add = btn("Add");
const beeps = [];
const start0 = OscillatorNode.prototype.start;
OscillatorNode.prototype.start = function (...a) { beeps.push(this.frequency.value); return start0.apply(this, a); };
const felt = [];
const vib0 = navigator.vibrate;
navigator.vibrate = (p) => { felt.push("vibrate " + JSON.stringify(p)); return true; };
const done = () => { OscillatorNode.prototype.start = start0; navigator.vibrate = vib0; delete window.quilloNative; };
const enter = async (v) => { field.focus(); type(field, v); await wait(50); await tap(add); };
// Typed: a check digit worked by hand. 400638133393: odd places from the right x3: 3,3,1,8,0,0... gives 1.
await enter("4006381333931");
if (rows() !== "4006381333931x1") { done(); return "typed: " + rows(); }
if (said() !== "Marker pen added") { done(); return "said: " + said(); }
if ($("#scan-demo-last").textContent !== "4006381333931 by typed") { done(); return "on_scan: " + $("#scan-demo-last").textContent; }
if (field.value !== "") { done(); return "the field empties for the next"; }
if (beeps.join() !== "1480") { done(); return "a beep: " + beeps.join(); }
if (felt.join() !== "vibrate 30") { done(); return "a haptic by vibrate where there is no quilloNative: " + felt.join(); }
// A repeat counts.
await enter("400-6381 333931");
if (rows() !== "4006381333931x2") { done(); return "a repeat counts: " + rows(); }
if (said() !== "Marker pen: 2") { done(); return "said: " + said(); }
// Each wrong digit says the right one: 5901234123457 is right, so ...458 wants 7.
await enter("5901234123458");
if (said() !== "That code does not check: its last digit should be 7.") { done(); return "a wrong digit: " + said(); }
if (rows() !== "4006381333931x2") { done(); return "a bad code adds nothing"; }
if (beeps[beeps.length - 1] !== 330 || felt[felt.length - 1] !== "vibrate [40,60,40]") { done(); return "a bad code sounds and feels different"; }
if (field.value !== "5901234123458") { done(); return "a bad code stays to be put right"; }
await enter("123"); if (said() !== "A product code has 8, 12 or 13 digits.") { done(); return "a short code: " + said(); }
await enter("hello"); if (said() !== "That is not a product code.") { done(); return "letters: " + said(); }
await enter(""); if (said() !== "Type a code first.") { done(); return "nothing: " + said(); }
await enter("5901234123457");
// UPC-A finds the EAN-13 of the same product; EAN-8; and a code not in the catalog goes in, marked.
await enter("012345678905");
if (!/Sticky notes/.test($(".ui-scanadd-rows").textContent)) { done(); return "UPC-A finds EAN-13: " + $(".ui-scanadd-rows").textContent; }
await enter("0012345678905");
if (!rows().includes("012345678905x2")) { done(); return "the same product, two ways: " + rows(); }
await enter("96385074");
await enter("73513537");
if (!/Not in the catalog/.test($$(".ui-scanadd-row")[0].textContent)) { done(); return "an unknown is marked"; }
// 2 x 1.90 + 4.25 + 2 x 2.10 + 0.80 = 13.05 in decimals; 7 scanned, 5 different.
if (!/7 scanned, 5 different, \$13\.05/.test($(".ui-scanadd-sum").textContent)) { done(); return "sum: " + $(".ui-scanadd-sum").textContent; }
// Steppers.
await tap($('[aria-label="One more Eraser"]'));
await tap($('[aria-label="One fewer Eraser"]'));
await tap($('[aria-label="Remove Eraser"]'));
if (/Eraser/.test($(".ui-scanadd-rows").textContent)) { done(); return "minus at 1 removes"; }
// A photo: a real EAN-13 drawn in a canvas, from its digits, with light falling across it and noise, as a camera would see.
const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const bars = (code) => {
    const forms = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"][+code[0]];
    let s = "101";
    for (let i = 1; i <= 6; i++) { const d = L[+code[i]]; s += forms[i - 1] === "L" ? d : [...d].map((c) => c === "1" ? "0" : "1").reverse().join(""); }
    s += "01010";
    for (let i = 7; i <= 12; i++) s += [...L[+code[i]]].map((c) => c === "1" ? "0" : "1").join("");
    return s + "101";
};
const bars8 = (code) => {
    let s = "101";
    for (let i = 0; i < 4; i++) s += L[+code[i]];
    s += "01010";
    for (let i = 4; i < 8; i++) s += [...L[+code[i]]].map((c) => c === "1" ? "0" : "1").join("");
    return s + "101";
};
const picture = (bits, { w = 900, h = 500, scale = 6, tilt = false, flip = false, shade = true, turn = false } = {}) => {
    const c = document.createElement("canvas"); c.width = turn ? h : w; c.height = turn ? w : h;
    const g = c.getContext("2d");
    g.fillStyle = "#f5f3ee"; g.fillRect(0, 0, c.width, c.height);
    if (turn) { g.translate(c.width, 0); g.rotate(Math.PI / 2); }
    const x0 = Math.round((w - bits.length * scale) / 2);
    g.fillStyle = "#1c1b22";
    const list = flip ? [...bits].reverse() : [...bits];
    list.forEach((b, i) => { if (b === "1") g.fillRect(x0 + i * scale, 60, scale, h - 120); });
    if (shade) { g.setTransform(1, 0, 0, 1, 0, 0); const s = g.createLinearGradient(0, 0, c.width, 0); s.addColorStop(0, "rgba(0,0,0,.35)"); s.addColorStop(1, "rgba(255,255,255,.2)"); g.fillStyle = s; g.fillRect(0, 0, c.width, c.height); }
    return c;
};
const send = async (canvas) => {
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const t = new DataTransfer(); t.items.add(new File([blob], "code.png", { type: "image/png" }));
    const input = $('input[type="file"]');
    input.files = t.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(450);
};
await send(picture(bars("5901234123457")));
if (!rows().includes("5901234123457x2")) { done(); return "a photo adds: " + rows() + " | " + said(); }
if ($("#scan-demo-last").textContent !== "5901234123457 by photo") { done(); return "by photo: " + $("#scan-demo-last").textContent; }
await send(picture(bars("4006381333931"), { flip: true }));
if (!rows().includes("4006381333931x3")) { done(); return "upside down: " + rows() + " | " + said(); }
await send(picture(bars("4006381333931"), { turn: true }));
if (!rows().includes("4006381333931x4")) { done(); return "held across: " + rows() + " | " + said(); }
await send(picture(bars8("96385074"), { scale: 8 }));
if (!rows().includes("96385074x1")) { done(); return "EAN-8: " + rows() + " | " + said(); }
await send(picture(bars("9780306406157"), { scale: 4, w: 700 }));
if (!rows().includes("9780306406157x1")) { done(); return "a book, smaller: " + rows() + " | " + said(); }
// A picture with no code, and one with a broken check digit, add nothing.
const n0 = rows();
await send(picture("1010101110001"));
if (rows() !== n0 || said() !== "No code found in that photo. Try closer, with the code straight.") { done(); return "no code: " + said(); }
await send(picture(bars("5901234123458")));
if (rows() !== n0) { done(); return "a bad check digit reads as nothing: " + rows(); }
// A browser without createImageBitmap says so.
const cib = window.createImageBitmap;
window.createImageBitmap = undefined;
await send(picture(bars("5901234123457")));
window.createImageBitmap = cib;
if (said() !== "This browser cannot read a photo. Type the code.") { done(); return "no createImageBitmap: " + said(); }
// The camera with the browser's detector, as a stand-in: it sees the code again and again.
const BD = window.BarcodeDetector;
let seeing = null;
window.BarcodeDetector = class { detect() { return Promise.resolve(seeing ? [{ rawValue: seeing }] : []); } };
const stopIt = () => { window.BarcodeDetector = BD; };
const vid = $("video");
if (!vid.muted) { stopIt(); done(); return "the video is muted for real, as iOS asks"; }
await tap(btn("Start camera"));
await wait(900);
if (vid.hidden || vid.readyState < 2) { stopIt(); done(); return "the camera runs: " + vid.readyState; }
if (!btn("Stop camera")) { stopIt(); done(); return "it can be stopped"; }
await enter("8711253001202");
const before = rows();
seeing = "4006381333931";
await wait(1000);
const held = rows();
if (held.match(/4006381333931x(\d+)/)[1] !== "5") { stopIt(); done(); return "held in view it counts once: " + held; }
seeing = null;
await wait(800);
seeing = "4006381333931";
await wait(400);
seeing = null;
if (rows().match(/4006381333931x(\d+)/)[1] !== "6") { stopIt(); done(); return "gone and back counts again: " + rows(); }
if ($("#scan-demo-last").textContent !== "4006381333931 by camera") { stopIt(); done(); return "by camera"; }
await tap(btn("Stop camera"));
await wait(100);
if (vid.srcObject && vid.srcObject.getTracks().some((t) => t.readyState === "live")) { stopIt(); done(); return "Stop stops the camera's tracks"; }
// A device that lacks a format: the constructor throws, and the reading here takes over, with nothing in the console.
window.BarcodeDetector = class { constructor() { throw new TypeError("no such format"); } };
await tap(btn("Start camera"));
await wait(500);
if (!btn("Stop camera")) { stopIt(); done(); return "a detector that will not start leaves the camera running"; }
await tap(btn("Stop camera"));
// iOS's case: no detector, and a real moving picture reaches the reading here.
window.BarcodeDetector = undefined;
const screen = picture(bars("5901234123457"), { w: 900, h: 500 });
const screenStream = screen.captureStream(10);
const paint = setInterval(() => { const g = screen.getContext("2d"); g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, 1, 1); }, 90);
const gum = navigator.mediaDevices.getUserMedia;
navigator.mediaDevices.getUserMedia = () => Promise.resolve(screenStream);
const n1 = rows().match(/5901234123457x(\d+)/)[1];
await tap(btn("Start camera"));
await wait(1200);
clearInterval(paint);
navigator.mediaDevices.getUserMedia = gum;
const n2 = rows().match(/5901234123457x(\d+)/)[1];
await tap(btn("Stop camera"));
stopIt();
if (+n2 !== +n1 + 1) { done(); return "with no BarcodeDetector the frames are read here, once: " + n1 + " to " + n2; }
// The app's way: quilloNative's haptic. And a camera refused says what to do, with Settings.
const native = []; window.quilloNative = { haptic: (k) => { native.push(k); }, openSettings: () => { native.push("settings"); } };
await enter("96385074");
if (native.join() !== "success") { done(); return "the phone's own haptic: " + native.join(); }
navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(btn("Start camera"));
await wait(150);
navigator.mediaDevices.getUserMedia = gum;
if (!/refused/.test($(".ui-scanadd-msg").textContent)) { done(); return "refused says so: " + $(".ui-scanadd-msg").textContent; }
await tap(btn("Open Settings"));
if (native[native.length - 1] !== "settings") { done(); return "the way to Settings: " + native.join(); }
delete window.quilloNative;
navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(btn("Start camera"));
await wait(150);
navigator.mediaDevices.getUserMedia = gum;
if (btn("Open Settings")) { done(); return "a plain browser has no Settings to open"; }
if (!/browser's settings/.test($(".ui-scanadd-msg").textContent)) { done(); return "it says where instead: " + $(".ui-scanadd-msg").textContent; }
// Sound off stays quiet.
await tap(btn("Sound on"));
const b0 = beeps.length;
await enter("96385074");
if (beeps.length !== b0) { done(); return "sound off is quiet"; }
// Clear asks once.
await tap(btn("Clear"));
if (!btn("Clear them all?") || $$(".ui-scanadd-row").length === 0) { done(); return "Clear asks first"; }
await tap(btn("Clear them all?"));
if ($$(".ui-scanadd-row").length !== 0) { done(); return "then clears"; }
// Rotation keeps the list.
await enter("96385074");
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(300);
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (rows() !== "96385074x1") { done(); return "rotation keeps the list: " + rows(); }
// A tablet: the camera beside the list.
if (device === "tablet") {
    const a = $(".ui-scanadd-view").getBoundingClientRect(), b = $(".ui-scanadd-rows").getBoundingClientRect();
    if (b.left < a.right) { done(); return "beside: " + a.right + " " + b.left; }
}
done();
