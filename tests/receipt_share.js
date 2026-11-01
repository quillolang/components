// mobile
const box = $$("section.ui-rcptshare")[0];
const q = (s) => box.querySelector(s), qq = (s) => [...box.querySelectorAll(s)];
const log = () => $("#rcptshare-log").textContent;
const btn = (t) => qq(".ui-btn").find((b) => b.textContent.trim() === t);
const note = () => q(".ui-rcptshare-note")?.textContent;
const lines = qq(".ui-rcptshare-lines > div").map((d) => d.querySelector("dt").textContent + "=" + d.querySelector("dd").textContent);
if (lines.join("|") !== "Rent, November=$950.00|Parking=$45.10|Transfer fee=$1.50") return "lines: " + lines.join("|");
if (q(".ui-rcptshare-total").textContent !== "Total$996.60") return "total: " + q(".ui-rcptshare-total").textContent;
if (q(".ui-rcptshare-warn")) return "these add up: 950 + 45.10 + 1.50 = 996.60";
// Lines that do not add up say so; bad ones too; a dash for what cannot be read.
if ($("#rcptshare-off .ui-rcptshare-warn")?.textContent !== "The lines add up to $3.00, not $4.00") return "off: " + $("#rcptshare-off").textContent;
const bad = $("#rcptshare-bad");
if (!/could not be read/.test(bad.querySelector(".ui-rcptshare-warn")?.textContent ?? "") || !/—/.test(bad.textContent) || !/2,00/.test(bad.textContent)) return "bad: " + bad.textContent;
// The picture is drawn at the start and shows on the page as the same words.
await wait(300);
const img = q(".ui-rcptshare-pic img");
if (!img || !img.src.startsWith("data:image/png")) return "a picture";
await img.decode();
if (img.naturalWidth !== 1080) return "width: " + img.naturalWidth;
if (btn("Share picture").disabled) return "ready to share";
// What is drawn is what is on the screen: every call to the canvas, against the words.
const drawn = [];
const real = CanvasRenderingContext2D.prototype.fillText;
CanvasRenderingContext2D.prototype.fillText = function (t, x, y, w) { drawn.push({ t, x, y, a: this.textAlign }); return real.call(this, t, x, y, w); };
await tap($("#rcptshare-next")); await wait(200);
await tap($("#rcptshare-next")); await wait(300);
CanvasRenderingContext2D.prototype.fillText = real;
const texts = drawn.slice(-20).map((d) => d.t);
for (const want of ["Harbour Lettings", "Paid", "Nov 1, 2026 09:43", "TX-20261101-0042", "Rent, November", "$950.00", "Parking", "$45.10", "Transfer fee", "$1.50", "Total", "$996.60"])
    if (!texts.includes(want)) return "not drawn: " + want + " in " + texts.join("|");
// Drawn top to bottom, with amounts to the right, on their lines.
const at = (t) => drawn.slice(-20).find((d) => d.t === t);
if (!(at("$950.00").y === at("Rent, November").y && at("$950.00").a === "right" && at("$950.00").x === 1000)) return "the amount's place";
if (!(at("Total").y > at("$1.50").y)) return "the total comes last";
// The image is a real one: the page has dark marks where the title goes, and white in its margin.
const c = document.createElement("canvas"); await q(".ui-rcptshare-pic img").decode();
const i2 = q(".ui-rcptshare-pic img"); c.width = i2.naturalWidth; c.height = i2.naturalHeight;
const g = c.getContext("2d"); g.drawImage(i2, 0, 0);
const px = g.getImageData(0, 0, c.width, c.height).data;
const dark = (x0, y0, w, h) => { let n = 0; for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (px[(y * c.width + x) * 4] < 90) n++; return n; };
if (dark(80, 120, 500, 70) < 200) return "the title is drawn: " + dark(80, 120, 500, 70);
if (dark(0, 0, 60, c.height) !== 0) return "the margin is clean";
const save = qq("a.ui-rcptshare-save")[0];
if (!save || !save.href.startsWith("data:image/png") || save.getAttribute("download") !== "receipt.png") return "save: " + save?.href.slice(0, 30);
// A share with a picture: a real PNG file, right from the tap.
let sent = null, asked = null, active = null;
Object.defineProperty(navigator, "canShare", { configurable: true, value: (d) => { asked = d; return true; } });
Object.defineProperty(navigator, "share", { configurable: true, value: (d) => { sent = d; active = navigator.userActivation.isActive; return Promise.resolve(); } });
await tap(btn("Share picture")); await wait(150);
if (active !== true) return "the share came too late after the tap: " + active;
const f = sent?.files?.[0];
if (!f || f.type !== "image/png" || f.name !== "receipt.png" || sent.title !== "Harbour Lettings") return "the file: " + JSON.stringify(sent);
const head = new Uint8Array(await f.slice(0, 4).arrayBuffer());
if (head[1] !== 0x50 || head[2] !== 0x4e || head[3] !== 0x47) return "a PNG: " + head.join();
const bm = await createImageBitmap(f);
if (bm.width !== 1080 || bm.height !== c.height) return "the file's size: " + bm.width + "x" + bm.height;
if (log() !== "Shared: image") return "on_share: " + log();
// A person changing their mind is not a failure.
navigator.share = undefined;
Object.defineProperty(navigator, "share", { configurable: true, value: () => Promise.reject(new DOMException("Share canceled", "AbortError")) });
await tap(btn("Share picture")); await wait(150);
if (note() !== undefined && /text|Copied/.test(note())) return "cancelled: " + note();
// No files allowed: text goes, the same words, and says so.
const want = "Harbour Lettings\nPaid\nWhen: Nov 1, 2026 09:43\nFrom: Everyday •• 4021\nReference: TX-20261101-0042\nNote: November rent\nRent, November: $950.00\nParking: $45.10\nTransfer fee: $1.50\nTotal: $996.60";
Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false });
Object.defineProperty(navigator, "share", { configurable: true, value: (d) => { sent = d; return Promise.resolve(); } });
await tap(btn("Share picture")); await wait(150);
if (sent.text !== want || sent.files) return "as text: " + JSON.stringify(sent);
if (!/goes as text/.test(note()) || log() !== "Shared: text") return "says so: " + note();
// The app's share first for text; refused, it copies.
const calls = [];
window.quilloNative = { share: (t) => { calls.push(t); return Promise.resolve({ shared: true }); } };
await wait(60);
await tap(btn("Share as text")); await wait(150);
if (calls[0] !== want) { delete window.quilloNative; return "the app's: " + calls[0]; }
// Android answers only true, iOS a map.
window.quilloNative.share = () => Promise.resolve(true);
await tap(btn("Share as text")); await wait(150);
if (log() !== "Shared: text") { delete window.quilloNative; return "true from Android: " + log(); }
window.quilloNative.share = () => Promise.reject(new Error("no screen"));
let clip = null;
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { clip = t; return Promise.resolve(); } } });
await tap(btn("Share as text")); await wait(150);
delete window.quilloNative;
if (clip !== want || log() !== "Shared: copied") return "copied: " + clip + " " + log();
// Nothing at all: the words stay to copy by hand.
Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
await tap(btn("Share as text")); await wait(150);
if (q(".ui-rcptshare-copy")?.value !== want) return "by hand: " + q(".ui-rcptshare-copy")?.value;
delete navigator.share; delete navigator.clipboard; delete navigator.canShare;
// A long title wraps, and each piece of it is drawn.
await tap($("#rcptshare-next")); await wait(300);
if (!/A very long merchant name/.test(box.querySelector("h3").textContent)) return "the second receipt";
if (q(".ui-rcptshare-total").textContent !== "Total$7.30") return "a sum with no total given: " + q(".ui-rcptshare-total").textContent;
if (device === "tablet") {
    const a = q(".ui-rcptshare-paper").getBoundingClientRect(), b = q(".ui-rcptshare-pic").getBoundingClientRect();
    if (!(b.left >= a.right) || getComputedStyle(q(".ui-rcptshare-pic")).display === "none") return "the picture beside on a tablet";
} else {
    if (getComputedStyle(q(".ui-rcptshare-pic")).display !== "none") return "the picture waits on a phone";
    await tap(btn("See picture"));
    if (getComputedStyle(q(".ui-rcptshare-pic")).display === "none") return "see picture";
}
