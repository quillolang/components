// mobile
const box = $(".ui-photo-capture");
const input = box.querySelector("input[type=file][name=receipt]");
const note = () => $("#photo-capture-demo-note").textContent;
if (!input || input.accept !== "image/*" || input.getAttribute("capture") !== "environment") return "the field is not a camera input";
if (box.dataset.state !== "empty" || !/No photo yet/.test(box.textContent)) return `it starts as ${box.dataset.state}`;
const rect = input.getBoundingClientRect();
if (rect.width < 44 || rect.height < 44) return `the input is ${rect.width} by ${rect.height}`;
if (document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) !== input) { input.scrollIntoView({ block: "center" }); }

// A real JPEG with four coloured quarters, and an EXIF block giving it an orientation.
const colours = { R: [230, 0, 0], G: [0, 200, 0], B: [0, 0, 230], Y: [240, 230, 0] };
const jpeg = async (w, h) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    const fill = (k, x, y) => { g.fillStyle = `rgb(${colours[k]})`; g.fillRect(x, y, w / 2, h / 2); };
    fill("R", 0, 0); fill("G", w / 2, 0); fill("B", 0, h / 2); fill("Y", w / 2, h / 2);
    return await new Promise((r) => c.toBlob(r, "image/jpeg", 0.95));
};
const with_exif = async (blob, orientation) => {
    const b = new Uint8Array(await blob.arrayBuffer());
    // APP1: "Exif\0\0", a big-endian TIFF header, one IFD with one entry, tag 0x0112.
    const seg = [0xFF, 0xE1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4D, 0x4D, 0, 0x2A, 0, 0, 0, 8,
                 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, 0, 0, 0, 0];
    return new Blob([b.slice(0, 2), new Uint8Array(seg), b.slice(2)], { type: "image/jpeg" });
};
const pick = async (file) => {
    const dt = new DataTransfer(); dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    for (let i = 0; i < 60 && box.dataset.state === "working"; i++) await wait(50);
    await wait(50);
};
const near = (p, c) => Math.abs(p[0] - c[0]) < 40 && Math.abs(p[1] - c[1]) < 40 && Math.abs(p[2] - c[2]) < 40;
const corners = async (file) => {
    const bmp = await createImageBitmap(file);
    const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(bmp, 0, 0);
    const at = (x, y) => [...g.getImageData(x, y, 1, 1).data];
    const q = [at(bmp.width / 4 | 0, bmp.height / 4 | 0), at(3 * bmp.width / 4 | 0, bmp.height / 4 | 0),
               at(bmp.width / 4 | 0, 3 * bmp.height / 4 | 0), at(3 * bmp.width / 4 | 0, 3 * bmp.height / 4 | 0)];
    return { w: bmp.width, h: bmp.height, q };
};
// What each orientation shows, top left, top right, bottom left, bottom right, for a picture
// stored as R G over B Y, worked out from the EXIF table; 5 to 8 swap width and height.
const shown = { 1: "RGBY", 2: "GRYB", 3: "YBGR", 4: "BYRG", 5: "RBGY", 6: "BRYG", 7: "YGBR", 8: "GYRB" };
const raw = await jpeg(400, 200);
for (const o of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await pick(new File([await with_exif(raw, o)], `IMG_${o}.jpg`, { type: "image/jpeg" }));
    if (box.dataset.state !== "ready") return `orientation ${o}: ${box.dataset.state}: ${box.textContent}`;
    const out = input.files[0];
    if (input.files.length !== 1 || out.name !== "photo.jpg" || out.type !== "image/jpeg") return `orientation ${o}: the field holds ${out?.name}`;
    const got = await corners(out);
    const tall = o >= 5;
    if (got.w !== (tall ? 100 : 200) || got.h !== (tall ? 200 : 100)) return `orientation ${o} came out ${got.w} by ${got.h}`;
    const want = shown[o].split("").map((k) => colours[k]);
    for (let i = 0; i < 4; i++) if (!near(got.q[i], want[i])) return `orientation ${o}: quarter ${i} is ${got.q[i]}, not ${want[i]}`;
    const head = new TextDecoder("latin1").decode((await out.slice(0, 4096).arrayBuffer()));
    if (head.includes("Exif")) return `orientation ${o}: the result still has EXIF`;
}
if (note() !== "Ready to send: photo.jpg, 100 by 200, from 100 by 200." && note() !== "Ready to send: photo.jpg, 100 by 200, from 200 by 400.") return `on_change: ${note()}`;
const img = box.querySelector(".ui-photo-capture-frame img");
if (!img || !img.src.startsWith("blob:") || img.alt !== "The photo: 100 by 200 pixels") return "the preview is not there";
await new Promise((r) => (img.complete ? r() : (img.onload = r)));
if (img.naturalWidth !== 100) return "the preview is not the result";
if (box.querySelector(".ui-photo-capture-take span").textContent !== "Retake") return "the button does not say Retake";
if (!/100 × 200/.test(box.querySelector(".ui-photo-capture-meta").textContent)) return "the size is not shown";

// A picture smaller than the limit is not made larger.
await pick(new File([await jpeg(60, 40)], "small.jpg", { type: "image/jpeg" }));
if ((await corners(input.files[0])).w !== 60) return "a small picture was enlarged";

// A retake frees the first preview: every address made is given back but the one shown.
const made = [], freed = [];
const make0 = URL.createObjectURL, free0 = URL.revokeObjectURL;
URL.createObjectURL = (b) => { const u = make0.call(URL, b); made.push(u); return u; };
URL.revokeObjectURL = (u) => { freed.push(u); free0.call(URL, u); };
const first = box.querySelector(".ui-photo-capture-frame img").src;
await pick(new File([await jpeg(800, 600)], "big.jpg", { type: "image/jpeg" }));
if (!freed.includes(first)) return "the old preview was not freed";
const kept = made.filter((u) => !freed.includes(u));
if (kept.length !== 1 || kept[0] !== box.querySelector(".ui-photo-capture-frame img").src) return `${kept.length} addresses stay made after a retake`;
if ((await corners(input.files[0])).w !== 200) return "a retake did not replace the file";

// Not a picture; a broken picture: refused with a word, and nothing is left to send.
await pick(new File(["hello"], "note.txt", { type: "text/plain" }));
if (!/not a picture/.test(box.textContent) || input.files.length !== 0 || box.dataset.state !== "empty") return `a text file: ${box.textContent}`;
if (note() !== "Nothing taken yet.") return `a refused file leaves ${note()}`;
await pick(new File([new Uint8Array([1, 2, 3, 4, 5, 6])], "broken.jpg", { type: "image/jpeg" }));
if (!/could not be read/.test(box.textContent) || input.files.length !== 0) return `a broken picture: ${box.textContent}`;
if (box.querySelector("[role=alert]") == null) return "the refusal is not announced";
await pick(new File([], "empty.jpg", { type: "image/jpeg" }));
if (!/empty/.test(box.textContent)) return `an empty file: ${box.textContent}`;

// A good one again, then Remove, by a finger.
await pick(new File([raw], "a.jpg", { type: "image/jpeg" }));
const u = box.querySelector(".ui-photo-capture-frame img").src;
const remove = [...box.querySelectorAll("button")].find((b) => b.textContent.trim() === "Remove");
if (!remove) return "no Remove button";
await tap(remove);
if (box.dataset.state !== "empty" || input.files.length !== 0 || note() !== "Nothing taken yet.") return "Remove did not clear it";
const all_freed = made.filter((x) => !freed.includes(x));
URL.createObjectURL = make0; URL.revokeObjectURL = free0;
if (!freed.includes(u) || all_freed.length) return "Remove did not free the preview";

// The field stays a form's: on a tablet the buttons sit beside the picture.
const body = box.querySelector(".ui-photo-capture-body");
const cols = getComputedStyle(body).gridTemplateColumns.split(" ").length;
if (device === "tablet" && cols !== 2) return `a tablet has ${cols} columns`;
if (device === "phone" && cols !== 1) return `a phone has ${cols} columns`;
