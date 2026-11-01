// mobile
const box = () => $(".ui-document-capture");
const add = () => box().querySelector(".ui-document-capture-add input");
const carry = () => box().querySelector("input[name=pages]");
const rows = () => [...box().querySelectorAll(".ui-document-capture-page")];
const ids = () => rows().map((r) => r.dataset.id).join();
const note = () => $("#document-capture-demo-note").textContent;
const button = (t) => [...$$("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent).trim() === t);
const tool = (row, word) => [...row.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? "").startsWith(word));
const corner = (i) => box().querySelectorAll(".ui-document-capture-corner")[i];
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
const pick = async (file) => {
    const dt = new DataTransfer(); dt.items.add(file);
    add().files = dt.files;
    add().dispatchEvent(new Event("change", { bubbles: true }));
    await wait(60);
    await until(() => box().dataset.state === "ready");
    await wait(60);
};
const canvas = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d")); return c; };
const jpeg = async (c, name) => new File([await new Promise((r) => c.toBlob(r, "image/jpeg", 0.98))], name, { type: "image/jpeg" });
const pixels = async (file) => {
    const b = await createImageBitmap(file);
    const c = canvas(b.width, b.height, (g) => g.drawImage(b, 0, 0));
    const g = c.getContext("2d", { willReadFrequently: true });
    return { w: b.width, h: b.height, at: (x, y) => [...g.getImageData(Math.round(x), Math.round(y), 1, 1).data].slice(0, 3) };
};
const near = (p, c, by = 45) => Math.abs(p[0] - c[0]) < by && Math.abs(p[1] - c[1]) < by && Math.abs(p[2] - c[2]) < by;

// Four coloured quarters, to tell pages apart and see what a crop keeps.
const quarters = (w, h, a, b, c, d) => canvas(w, h, (g) => {
    g.fillStyle = a; g.fillRect(0, 0, w / 2, h / 2); g.fillStyle = b; g.fillRect(w / 2, 0, w / 2, h / 2);
    g.fillStyle = c; g.fillRect(0, h / 2, w / 2, h / 2); g.fillStyle = d; g.fillRect(w / 2, h / 2, w / 2, h / 2);
});
const made = [], freed = [], make0 = URL.createObjectURL, free0 = URL.revokeObjectURL;
URL.createObjectURL = (b) => { const u = make0.call(URL, b); made.push(u); return u; };
URL.revokeObjectURL = (u) => { freed.push(u); free0.call(URL, u); };
try {
    if (add().getAttribute("capture") !== "environment" || !add().accept.startsWith("image/")) return "the input is not a camera";
    await pick(await jpeg(quarters(400, 300, "#e00000", "#00c800", "#0000e6", "#f0e600"), "a.jpg"));
    await pick(await jpeg(quarters(1200, 900, "#000", "#444", "#888", "#ccc"), "b.jpg"));
    await pick(await jpeg(quarters(200, 300, "#fff", "#fff", "#000", "#000"), "c.jpg"));
    if (ids() !== "1,2,3") return `three pages: ${ids()}`;
    if ([...carry().files].map((f) => f.name).join() !== "page-1.jpg,page-2.jpg,page-3.jpg") return `the field: ${[...carry().files].map((f) => f.name)}`;
    // The second was made smaller; the first was not made larger.
    if (note() !== "page-1.jpg 400x300, page-2.jpg 600x450, page-3.jpg 200x300") return `on_change: ${note()}`;
    if ((await pixels(carry().files[1])).w !== 600) return "a large page was not made smaller";
    if (!add().disabled || !/That is the most, 3/.test(box().textContent)) return "a full list still offers more";

    // Reorder by buttons, and the names follow the order, not the page.
    await tap(tool(rows()[0], "Later"));
    if (ids() !== "2,1,3" || note() !== "page-1.jpg 600x450, page-2.jpg 400x300, page-3.jpg 200x300") return `Later: ${ids()} ${note()}`;
    await tap(tool(rows()[1], "Earlier"));
    if (ids() !== "1,2,3") return `Earlier: ${ids()}`;
    if (!tool(rows()[0], "Earlier").disabled || !tool(rows()[2], "Later").disabled) return "the ends can still move";

    // By the grip: short, and it springs back; a row, and it lands; cancelled, nothing.
    const grip = (i) => rows()[i].querySelector(".ui-document-capture-grip");
    rows()[0].scrollIntoView({ block: "center" });
    await wait(60);
    const gap = rows()[1].getBoundingClientRect().top - rows()[0].getBoundingClientRect().top;
    await drag(grip(0), 0, gap * 0.3);
    if (ids() !== "1,2,3" || rows()[0].style.transform !== "") return `a short drag: ${ids()}`;
    await wait(220);
    await drag(grip(0), 0, gap);
    if (ids() !== "2,1,3") return `a drag of a row: ${ids()}`;
    await wait(220);
    await drag(grip(1), 0, gap);
    if (ids() !== "2,3,1") return `a drag down: ${ids()}`;
    await wait(220);
    const q = middle(grip(0));
    await fingers("touchStart", [q]);
    await fingers("touchMove", [{ x: q.x, y: q.y + gap }]);
    await wait(40);
    await fingers("touchCancel", []);
    await wait(260);
    if (ids() !== "2,3,1" || rows()[0].style.transform !== "") return `a cancelled drag: ${ids()}`;
    // A page's class reads which page is open; lifted, a row stays lifted if that changes.
    await fingers("touchStart", [q]);
    await fingers("touchMove", [{ x: q.x, y: q.y + 10 }]);
    await wait(40);
    if (!rows()[0].matches(".ui-document-capture-page-on, [data-lifted]")) return "a drag does not lift the row";
    key(grip(2), "ArrowUp");
    await wait(60);
    if (ids() !== "2,3,1") return `the list moved during a drag: ${ids()}`;
    await fingers("touchCancel", []);
    await wait(260);
    key(grip(0), "ArrowDown"); await wait(60);
    if (ids() !== "3,2,1") return `arrow key: ${ids()}`;
    key(grip(0), "ArrowUp"); await wait(60);
    if (ids() !== "3,2,1") return "an arrow key moved the first page off the list";

    // Drop: its pictures are freed, and the rest renumber.
    const gone = rows()[2].querySelector("img").src;
    await tap(tool(rows()[0], "Drop"));
    if (ids() !== "2,1" || [...carry().files].length !== 2 || add().disabled) return `Drop: ${ids()}`;
    await tap(tool(rows()[1], "Drop"));
    if (ids() !== "2" || !freed.includes(gone)) return `Drop frees: ${ids()} ${freed.includes(gone)}`;
    await tap(tool(rows()[0], "Drop"));
    if (rows().length !== 0 || !/No pages yet/.test(box().textContent) || note() !== "No pages yet.") return "the last page does not go";
    if (made.some((u) => !freed.includes(u))) return `${made.filter((u) => !freed.includes(u)).length} pictures stay made`;

    // A page shot at an angle: paper as a quadrilateral on a dark table, with a red dot where
    // its diagonals cross: in any perspective, that is the middle of the page.
    const Q = [[60, 40], [340, 70], [380, 260], [20, 280]];
    const cross = (() => {
        const [a, b, c, d] = Q;
        const t = ((d[0] - b[0]) * (a[1] - b[1]) - (d[1] - b[1]) * (a[0] - b[0])) / ((c[0] - a[0]) * (d[1] - b[1]) - (c[1] - a[1]) * (d[0] - b[0]));
        return [a[0] + t * (c[0] - a[0]), a[1] + t * (c[1] - a[1])];
    })();
    const shot = canvas(400, 320, (g) => {
        g.fillStyle = "#1e1e1e"; g.fillRect(0, 0, 400, 320);
        g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(...Q[0]); Q.slice(1).forEach((p) => g.lineTo(...p)); g.closePath(); g.fill();
        g.fillStyle = "#e00000"; g.beginPath(); g.arc(cross[0], cross[1], 14, 0, Math.PI * 2); g.fill();
    });
    await pick(await jpeg(shot, "angle.jpg"));
    await tap(tool(rows()[0], "Crop"));
    if (!await until(() => corner(0))) return "the crop does not open";
    const stage = box().querySelector(".ui-document-capture-stage");
    const stage_img = stage.querySelector("img");
    await new Promise((r) => (stage_img.complete ? r() : (stage_img.onload = r)));
    await wait(60);
    const side = box().querySelector(".ui-document-capture-side");
    if (device === "phone" && getComputedStyle(side).display !== "none") return "on a phone the list stays beside the crop";
    if (device === "tablet" && getComputedStyle(side).display === "none") return "on a tablet the list goes away";
    const put = async (i, x, y) => {
        const s = stage.getBoundingClientRect();
        const now = corner(i).getBoundingClientRect();
        const dx = s.left + s.width * x / 400 - (now.left + now.width / 2);
        const dy = s.top + s.height * y / 320 - (now.top + now.height / 2);
        await drag(corner(i), dx, dy);
    };
    stage.scrollIntoView({ block: "center" });
    await wait(80);
    for (let i = 0; i < 4; i++) await put(i, Q[i][0], Q[i][1]);
    const pts = stage.querySelector("polygon").getAttribute("points").split(" ").map((p) => p.split(",").map(Number));
    for (let i = 0; i < 4; i++) if (Math.abs(pts[i][0] * 400 - Q[i][0]) > 6 || Math.abs(pts[i][1] * 320 - Q[i][1]) > 6) return `corner ${i} is at ${pts[i]}`;
    // A tap on a corner chooses it; the arrow buttons and keys move that corner by 1 percent.
    const P = () => stage.querySelector("polygon").getAttribute("points").split(" ").map((p) => p.split(",").map(Number));
    await tap(corner(2));
    if (!corner(2).classList.contains("ui-document-capture-corner-chosen") || !/Moving: Bottom right/.test(box().textContent)) return "a tap does not choose a corner";
    const before = P()[2];
    await tap(button("Left"));
    if (Math.abs(P()[2][0] - (before[0] - 0.01)) > 1e-4 || P()[2][1] !== before[1]) return `Left: ${P()[2]} from ${before}`;
    await tap(button("Right"));
    if (Math.abs(P()[2][0] - before[0]) > 1e-4) return "Right does not undo Left";
    await tap(button("Up")); await tap(button("Down"));
    if (Math.abs(P()[2][1] - before[1]) > 1e-4) return "Up and Down do not cancel out";
    corner(1).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true, cancelable: true }));
    await wait(60);
    const after = P()[1];
    corner(1).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", shiftKey: true, bubbles: true, cancelable: true }));
    await wait(60);
    if (Math.abs(after[1] - P()[1][1] - 0.05) > 1e-4) return `Shift and an arrow: ${after} and ${P()[1]}`;
    if (!/Top right/.test(corner(1).getAttribute("aria-label"))) return "a corner has no name";

    // A corner dragged across the page would twist it: refused, and back it goes.
    const held = P()[0];
    const r0 = corner(0).getBoundingClientRect(), r2 = corner(2).getBoundingClientRect();
    await drag(corner(0), r2.left - r0.left + 10, r2.top - r0.top + 10);
    if (!/twist the page/.test(box().textContent) || Math.abs(P()[0][0] - held[0]) > 1e-3) return `a twisted page: ${P()[0]} ${box().textContent}`;
    // A system cancel: back too.
    const t = middle(corner(0));
    await fingers("touchStart", [t]);
    await fingers("touchMove", [{ x: t.x + 30, y: t.y + 30 }]);
    await wait(30);
    if (Math.abs(P()[0][0] - held[0]) < 1e-3) return "a corner does not follow the finger";
    await fingers("touchCancel", []);
    await wait(60);
    if (Math.abs(P()[0][0] - held[0]) > 1e-3) return "a cancelled corner stays moved";

    // What a corner's place reads changes during a drag: a key on another corner. The corner
    // under the finger stays under it, and nothing moves until the finger lifts.
    {
        const held0 = P();
        const f = middle(corner(0));
        await fingers("touchStart", [f]);
        await fingers("touchMove", [{ x: f.x + 12, y: f.y + 12 }]);
        await fingers("touchMove", [{ x: f.x + 24, y: f.y + 24 }]);
        await wait(120);    // the last move has landed
        const at = corner(0).getBoundingClientRect();
        corner(2).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
        await wait(80);
        const now = corner(0).getBoundingClientRect();
        if (Math.abs(now.left - at.left) > 1 || Math.abs(now.top - at.top) > 1) return `a corner jumped during a drag: ${at.left} to ${now.left}`;
        await fingers("touchCancel", []);
        await wait(60);
        if (Math.abs(P()[0][0] - held0[0][0]) > 1e-3 || Math.abs(P()[2][0] - held0[2][0]) > 1e-3) return `after a cancelled drag: ${P()}`;
    }

    // Apply: a flat white page with the dot in its middle, and nothing of the table.
    await tap(button("Apply"));
    if (!await until(() => !corner(0))) return "Apply does not close the crop";
    const flat = await pixels(carry().files[0]);
    // The longer of each pair of edges: the bottom, 360 by 20, is 361; the left, 40 by 240, is 243.
    if (Math.abs(flat.w - 361) > 6 || Math.abs(flat.h - 243) > 6) return `the page is ${flat.w} by ${flat.h}`;
    if (!near(flat.at(flat.w / 2, flat.h / 2), [224, 0, 0], 70)) return `the middle is ${flat.at(flat.w / 2, flat.h / 2)}, not the red dot`;
    for (const [x, y] of [[0.08, 0.08], [0.92, 0.08], [0.92, 0.92], [0.08, 0.92], [0.5, 0.1], [0.1, 0.5]]) {
        if (!near(flat.at(flat.w * x, flat.h * y), [255, 255, 255])) return `at ${x},${y} the page is ${flat.at(flat.w * x, flat.h * y)}, not paper`;
    }
    // The dot is whole on the flat page, not cut by a seam between the triangles.
    const span = (dx, dy) => { let n = 0; for (let i = -60; i <= 60; i++) { const p = flat.at(flat.w / 2 + dx * i, flat.h / 2 + dy * i); if (p[0] > 150 && p[1] < 110) n++; } return n; };
    if (span(1, 0) < 14 || span(0, 1) < 14) return `the dot is ${span(1, 0)} by ${span(0, 1)}`;
    if (rows()[0].querySelector("img").src === made[made.length - 2]) return "the thumbnail did not change";

    // Cropping again starts from those corners, and the first result is freed.
    const first = rows()[0].querySelector("img").src;
    await tap(tool(rows()[0], "Crop"));
    await until(() => corner(0));
    await wait(60);
    const again = P();
    if (Math.abs(again[0][0] * 400 - Q[0][0]) > 6) return "the corners are not remembered";
    await tap(button("Cancel"));
    if (corner(0) || rows()[0].querySelector("img").src !== first) return "Cancel changed the page";
    await tap(tool(rows()[0], "Crop"));
    await until(() => corner(0));
    await wait(60);
    await tap(button("Whole photo"));
    await tap(button("Apply"));
    await until(() => !corner(0));
    const whole = await pixels(carry().files[0]);
    if (whole.w !== 400 || whole.h !== 320) return `the whole photo is ${whole.w} by ${whole.h}`;
    if (!freed.includes(first)) return "the old result is not freed";

    // Dropped while being cropped.
    await tap(tool(rows()[0], "Crop"));
    await until(() => corner(0));
    if (device === "tablet") {
        await tap(tool(rows()[0], "Drop"));
        if (corner(0)) return "the crop stays open on a dropped page";
    } else {
        await tap(button("Cancel"));
    }

    // Not a picture; a broken picture.
    await pick(new File(["x"], "a.txt", { type: "text/plain" }));
    if (!/not a picture/.test(box().textContent)) return `a text file: ${box().textContent}`;
    await pick(new File([new Uint8Array(8)], "b.jpg", { type: "image/jpeg" }));
    if (!/could not be read/.test(box().textContent)) return `a broken picture: ${box().textContent}`;
    await pick(await jpeg(quarters(100, 100, "#111", "#222", "#333", "#444"), "z.jpg"));

    // Leaving the page frees the rest.
    await tap(button("Leave the page"));
    await wait(60);
    const left = made.filter((u) => !freed.includes(u));
    if (left.length) return `${left.length} pictures stay when the component leaves`;
    await tap(button("Come back"));
    await wait(80);
} finally {
    URL.createObjectURL = make0; URL.revokeObjectURL = free0;
}
