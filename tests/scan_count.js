// mobile
const live = () => $("#scanct-demo-said").textContent;
const said = () => $(".ui-scanct-said").textContent;
const sec = () => $$(".ui-scanct")[0];
const rows = () => [...sec().querySelectorAll(".ui-scanct-row")].map((r) => r.querySelector(".ui-scanct-code").textContent + "=" + r.querySelector(".ui-scanct-n").textContent).join(" ");
const sum = () => [...sec().querySelectorAll(".ui-scanct-sum dd")].map((d) => d.textContent).join(",");
const btn = (t) => [...sec().querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
const field = sec().querySelector("input[id$='-in-code']");
const beeps = [], felt = [];
const start0 = OscillatorNode.prototype.start, vib0 = navigator.vibrate, gum0 = navigator.mediaDevices.getUserMedia, BD0 = window.BarcodeDetector;
OscillatorNode.prototype.start = function (...a) { beeps.push(this.frequency.value); return start0.apply(this, a); };
navigator.vibrate = (p) => { felt.push(JSON.stringify(p)); return true; };
const done = async () => {
    OscillatorNode.prototype.start = start0; navigator.vibrate = vib0; navigator.mediaDevices.getUserMedia = gum0; window.BarcodeDetector = BD0;
    delete window.quilloNative; localStorage.removeItem("ui-scanct-demo");
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
};
const fail = async (m) => { await done(); return m; };
// A real keyboard or a hardware scanner: text arrives in the field and Enter is pressed.
const enter = async (el) => {
    for (const type of ["keyDown", "keyUp"]) await cdp("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: type === "keyDown" ? "\r" : undefined });
};
const scan = async (code, el = field) => { el.focus(); await cdp("Input.insertText", { text: code }); await enter(el); await wait(120); };
localStorage.removeItem("ui-scanct-demo");
await tap(field);
// Worked by hand: 3 + 12 + 2 + 1 + 1 expected.
if (sum() !== "19,0,19,0") return fail("start: " + sum());
await scan("4006381333931");
if (said() !== "Marker pen, black: 1 of 3") return fail("first scan: " + said());
if (field.value !== "") return fail("the field empties");
if (beeps.join() !== "1480" || felt.join() !== "30") return fail("a good scan sounds and buzzes: " + beeps + " " + felt);
await scan("4006381333931");
await scan("  4006381333931  ");
await scan("4006381333931");
if (said() !== "Marker pen, black: 4 of 3, 1 over") return fail("over: " + said());
if ($(".ui-scanct-said").dataset.kind !== "over") return fail("over is shown as such");
if (sum() !== "19,4,16,1") return fail("after 4 pens: " + sum());
// Undo takes the last scan back, one at a time.
await tap(btn("Undo"));
if (said() !== "Undone: Marker pen, black +1" || sum() !== "19,3,16,0") return fail("undo: " + said() + " " + sum());
// A whole case: the next scan counts 12, then it goes back to one.
const times = sec().querySelector("input[id$='-times']");
type(times, "12"); await wait(50);
await scan("5901234123457");
if (said() !== "Notebook, A5: 12 of 12" || times.value !== "1") return fail("a case: " + said() + " " + times.value);
type(times, "abc"); await wait(50);
await scan("0012345678905");
if (said() !== "Sticky notes: 1 of 2") return fail("bad text counts one: " + said());
// UPC-A is the same product as its EAN-13, and case does not matter.
await scan("012345678905");
if (said() !== "Sticky notes: 2 of 2") return fail("UPC: " + said());
await scan("sku-1042");
if (said() !== "Packing tape, 50 m: 1 of 1") return fail("case: " + said());
await scan("]C1SKU-1042");
if (said() !== "Packing tape, 50 m: 2 of 1, 1 over") return fail("a scanner's prefix: " + said());
await tap(btn("Undo"));
await scan("constructor");
if (said() !== "A code that is also a JavaScript word: 1 of 1") return fail("constructor: " + said());
// A code not listed still counts, marked, with the low sound.
await scan("XYZ-9");
if (said() !== "Not on the list: XYZ-9, 1 counted" || $(".ui-scanct-said").dataset.kind !== "bad") return fail("unknown: " + said());
if (beeps[beeps.length - 1] !== 330 || felt[felt.length - 1] !== "[40,60,40]") return fail("a bad scan sounds different");
if (sum() !== "19,20,0,1") return fail("sum: " + sum());
if (!rows().endsWith("XYZ-9=1")) return fail("listed last: " + rows());
// An empty scan does nothing.
const n0 = sum(); await scan(""); if (sum() !== n0) return fail("empty");
// Corrections by hand count, and undo takes them back too. Short: one pen fewer.
await tap(sec().querySelector('[aria-label="One fewer Marker pen, black"]'));
if (sum() !== "19,19,1,1") return fail("by hand: " + sum());
if (said() !== "Marker pen, black: 2 counted, by hand") return fail("by hand says: " + said());
// Filters.
const chip = (t) => [...sec().querySelectorAll(".ui-scanct-chip")].find((c) => c.textContent.startsWith(t));
if (chip("Short").textContent.trim() !== "Short (1)") return fail("chip: " + chip("Short").textContent);
await tap(chip("Short"));
if (rows() !== "4006381333931=2") return fail("short only: " + rows());
await tap(chip("Not listed"));
if (rows() !== "XYZ-9=1") return fail("not listed only: " + rows());
await tap(chip("All"));
if (sec().querySelectorAll(".ui-scanct-row").length !== 6) return fail("all");
// Keeps through a reload, in a page of its own.
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:400px;opacity:0;pointer-events:none"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await wait(400);
const fd = frame.contentDocument;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
for (let n = 0; n < 40 && !/picked up/.test(fd.querySelector(".ui-scanct-said")?.textContent); n++) await wait(100);
const back = [...fd.querySelectorAll(".ui-scanct-sum dd")].map((d) => d.textContent).join(); frame.remove();
if (back !== "19,19,1,1") return fail("a reload picks it up: " + back);
// Finish: what differs is shown first.
await tap(btn("Finish count"));
const review = () => sec().querySelector(".ui-scanct-review").textContent;
if (!/Marker pen, black: 1 short/.test(review()) || !/XYZ-9: 1, not listed/.test(review())) return fail("review: " + review());
await tap(btn("Keep counting"));
if (sec().querySelector(".ui-scanct-review")) return fail("keep counting closes it");
await tap(btn("Finish count"));
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(150);
if (!/No connection/.test(sec().textContent)) return fail("says offline");
await tap(btn("Send count"));
if (live() !== "Nothing sent yet.") return fail("nothing goes while offline: " + live());
if (!/kept here and goes when there is one/.test(said()) || !/Waiting to send/.test(review())) return fail("waiting: " + said());
if (!field.disabled) return fail("no more scans into a finished count");
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
// 19 counted, the unknown among them; 1 short; the unknown is no over.
if (!/^Sent 19 counted, 1 short, 0 over, \d+ scans\.$/.test(live())) return fail("sent on coming back: " + live());
if (!/Count sent/.test(review())) return fail("says sent: " + review());
// A server that refuses leaves it to try again.
await tap(btn("Start a new count"));
if (sum() !== "19,0,19,0") return fail("a new count starts clean: " + sum());
await tap($("#scanct-demo-refuse"));
await scan("4006381333931");
await tap(btn("Finish count"));
await tap(btn("Send count"));
if (live() !== "The server refused." || !/could not be sent yet/.test(said())) return fail("refused: " + live() + said());
await tap($("#scanct-demo-refuse"));
await tap(btn("Try again"));
if (!/^Sent 1 counted, 18 short, 0 over, 1 scans\.$/.test(live())) return fail("sent the second time: " + live());
await tap(btn("Start a new count"));
// A photo with a real drawing of a code: EAN-13 from its digits, Code 128 from its widths.
const L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const ean = (code) => {
    const forms = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"][+code[0]];
    let s = "101";
    for (let i = 1; i <= 6; i++) { const d = L[+code[i]]; s += forms[i - 1] === "L" ? d : [...d].map((c) => c === "1" ? "0" : "1").reverse().join(""); }
    s += "01010";
    for (let i = 7; i <= 12; i++) s += [...L[+code[i]]].map((c) => c === "1" ? "0" : "1").join("");
    return s + "101";
};
// Worked by hand. Set B, SKU-1042: 104 + 51 + 2x43 + 3x53 + 4x13 + 5x17 + 6x16 + 7x20 + 8x18 = 917, and 917 mod 103 is 93.
const c128 = (w) => [...w.join("")].map((n, i) => (i % 2 ? "0" : "1").repeat(+n)).join("");
const sku = c128(["211214","213113","112331","213131","122132","123221","123122","221231","223211","111341","2331112"]);
// Set C, 12345678: 105 + 12 + 2x34 + 3x56 + 4x78 = 665, and 665 mod 103 is 47.
const digits = c128(["211232","112232","131123","331121","241112","133121","2331112"]);
const draw = (bits, { w = 900, h = 400, scale = 5, shade = true, flip = false } = {}) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#f5f3ee"; g.fillRect(0, 0, w, h);
    const x0 = Math.round((w - bits.length * scale) / 2);
    g.fillStyle = "#1c1b22";
    (flip ? [...bits].reverse() : [...bits]).forEach((b, i) => { if (b === "1") g.fillRect(x0 + i * scale, 40, scale, h - 80); });
    if (shade) { const s = g.createLinearGradient(0, 0, w, 0); s.addColorStop(0, "rgba(0,0,0,.3)"); s.addColorStop(1, "rgba(255,255,255,.2)"); g.fillStyle = s; g.fillRect(0, 0, w, h); }
    return c;
};
const photo = async (canvas) => {
    const blob = await new Promise((r) => canvas.toBlob(r, "image/png"));
    const t = new DataTransfer(); t.items.add(new File([blob], "code.png", { type: "image/png" }));
    const i = sec().querySelector('input[type="file"]'); i.files = t.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    await wait(500);
};
await photo(draw(ean("5901234123457")));
if (said() !== "Notebook, A5: 1 of 12") return fail("an EAN in a photo: " + said());
await photo(draw(sku));
if (said() !== "Packing tape, 50 m: 1 of 1") return fail("Code 128, set B: " + said());
await photo(draw(sku, { flip: true }));
if (said() !== "Packing tape, 50 m: 2 of 1, 1 over") return fail("Code 128 upside down: " + said());
await photo(draw(digits));
if (said() !== "Not on the list: 12345678, 1 counted") return fail("Code 128, set C: " + said());
// A wrong check value reads as nothing.
const n1 = sum();
const wrong = c128(["211214","213113","112331","213131","122132","123221","123122","221231","223211","111143","2331112"]);
await photo(draw(wrong));
if (sum() !== n1) return fail("a bad check adds nothing: " + sum());
if (!/No code found in that photo/.test(sec().querySelector(".ui-scanin-msg").textContent)) return fail("no code: " + sec().querySelector(".ui-scanin-msg").textContent);
// The camera, on iOS's terms: no detector, real frames through a <video>, read here. Held in view it counts once.
window.BarcodeDetector = undefined;
const shown = draw(ean("4006381333931"), { w: 900, h: 500 });
const stream = shown.captureStream(10);
const paint = setInterval(() => { const g = shown.getContext("2d"); g.fillStyle = "rgba(0,0,0,0)"; g.fillRect(0, 0, 1, 1); }, 90);
navigator.mediaDevices.getUserMedia = () => Promise.resolve(stream);
await tap(btn("Camera"));
await wait(1300);
clearInterval(paint);
navigator.mediaDevices.getUserMedia = gum0;
if (said() !== "Marker pen, black: 1 of 3") return fail("the camera reads, once: " + said());
await tap(btn("Stop camera"));
window.BarcodeDetector = BD0;
// A camera refused: the browser's words, then the app's, with Settings.
navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(btn("Camera")); await wait(150);
if (!/browser's settings/.test(sec().querySelector(".ui-scanin-msg").textContent)) return fail("refused: " + sec().querySelector(".ui-scanin-msg").textContent);
if (btn("Open Settings")) return fail("a browser has no Settings");
const native = [];
window.quilloNative = { haptic: (k) => { native.push(k); return Promise.resolve(true); }, openSettings: () => { native.push("settings"); return Promise.resolve(true); } };
await tap(btn("Camera")); await wait(150);
await tap(btn("Open Settings"));
if (native.join() !== "settings") return fail("Settings: " + native.join());
navigator.mediaDevices.getUserMedia = gum0;
await scan("4006381333931");
if (native[native.length - 1] !== "success") return fail("the app's haptic: " + native.join());
delete window.quilloNative;
// Sound off.
await tap(btn("Sound on"));
const b0 = beeps.length; await scan("4006381333931");
if (beeps.length !== b0) return fail("sound off is quiet");
// Blind, on a device with a scanner.
const blind = $$(".ui-scanct")[1], bf = blind.querySelector("input[id$='-in-code']");
const bbtn = (t) => [...blind.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === t);
if (/Expected/.test(blind.textContent) || blind.querySelector(".ui-scanct-sum")) return fail("blind shows nothing expected");
if (bf.inputMode !== "none") return fail("the on-screen keyboard stays down: " + bf.inputMode);
await tap(bf);
if (!/Ready for the scanner/.test(blind.querySelector(".ui-scanin-msg").textContent)) return fail("says it is ready");
await scan("ABC-1", bf);
if (blind.querySelector(".ui-scanct-said").textContent !== "Drill: 1 counted") return fail("blind says only the count: " + blind.querySelector(".ui-scanct-said").textContent);
if (document.activeElement !== bf) return fail("the focus stays for the next scan");
// Some scanners end with Tab.
await cdp("Input.insertText", { text: "ABC-1" });
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
await wait(120);
if (blind.querySelector(".ui-scanct-said").textContent !== "Drill: 2 counted" || document.activeElement !== bf) return fail("Tab ends a code: " + blind.querySelector(".ui-scanct-said").textContent);
await tap(bbtn("Keyboard"));
if (bf.inputMode !== "text") return fail("Keyboard brings it up");
await tap(bbtn("Hide keyboard"));
await tap(bbtn("Finish count"));
await tap(bbtn("Send count"));
if ($("#scanct-demo-blind").textContent !== "Drill: -3") return fail("the difference comes out at the end: " + $("#scanct-demo-blind").textContent);
// A tablet has two columns.
const cols = sec().querySelectorAll(".ui-scanct-col");
const a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
await tap(bbtn("Start a new count"));
await done();
