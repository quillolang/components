// mobile
const box = () => $(".ui-gallery-picker");
const add = () => box().querySelector(".ui-gallery-picker-add input");
const carry = () => box().querySelector("input[name=photos]");
const cards = () => [...box().querySelectorAll(".ui-gallery-picker-card")];
const names = () => cards().map((c) => c.dataset.name).join();
const note = () => $("#gallery-picker-demo-note").textContent;
const sent = () => [...carry().files].map((f) => f.name).join();
const button = (t) => [...$$("button")].find((b) => b.textContent.trim() === t);
const tool = (card, word) => [...card.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? "").startsWith(word));
const refused = () => box().querySelector(".ui-gallery-picker-refused")?.textContent ?? "";
const pick = async (...files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    add().files = dt.files;
    add().dispatchEvent(new Event("change", { bubbles: true }));
    await wait(120);
};
const png = async (colour) => {
    const c = document.createElement("canvas"); c.width = 40; c.height = 40;
    const g = c.getContext("2d"); g.fillStyle = colour; g.fillRect(0, 0, 40, 40);
    return await new Promise((r) => c.toBlob(r, "image/png"));
};
const photo = async (name, colour) => new File([await png(colour)], name, { type: "image/png", lastModified: 1000 });
if (add().accept !== "image/jpeg,image/png,image/webp,image/gif" || !add().multiple) return "the picker is not set up";
if (add().hasAttribute("name") || !carry().multiple || !carry().hidden) return "the field sent is not the hidden one";

const made = [], freed = [], make0 = URL.createObjectURL, free0 = URL.revokeObjectURL;
URL.createObjectURL = (b) => { const u = make0.call(URL, b); made.push(u); return u; };
URL.revokeObjectURL = (u) => { freed.push(u); free0.call(URL, u); };
try {
    const a = await photo("a.png", "#d33"), b = await photo("b.png", "#3d3"), c = await photo("c.png", "#33d"), d = await photo("d.png", "#dd3"), e = await photo("e.png", "#3dd");
    await pick(a, b);
    if (names() !== "a.png,b.png" || sent() !== "a.png,b.png" || note() !== "In this order: a.png, b.png") return `two photos: ${names()} / ${sent()} / ${note()}`;
    if (!/^2 of 4, \d+ B\s*$/.test(box().querySelector(".ui-gallery-picker-count").textContent.trim())) return `the count: ${box().querySelector(".ui-gallery-picker-count").textContent}`;
    const shown = box().querySelector(".ui-gallery-picker-card img");
    await new Promise((r) => (shown.complete ? r() : (shown.onload = r)));
    if (!(shown.naturalWidth === 40)) return "the thumbnail does not show";

    // A second pick adds, and the picker is emptied so that the same photo can be picked again.
    await pick(c);
    if (names() !== "a.png,b.png,c.png" || add().files.length !== 0) return `a second pick: ${names()}`;

    // The same photo twice.
    await pick(a);
    if (names() !== "a.png,b.png,c.png" || !/a\.png: That photo is here already/.test(refused())) return `a duplicate: ${refused()}`;

    // HEIC: by type, by name, and by its bytes under a false name, each with the reason.
    const ftyp = (brand) => new Uint8Array([0, 0, 0, 24, ...[..."ftyp"].map((x) => x.charCodeAt(0)), ...[...brand].map((x) => x.charCodeAt(0)), 0, 0, 0, 0]);
    await pick(new File([ftyp("heic")], "x1.heic", { type: "image/heic" }), new File([ftyp("mif1")], "IMG_2.HEIF", { type: "" }), new File([ftyp("heix")], "renamed.jpg", { type: "image/jpeg" }));
    if ((refused().match(/HEIC photos cannot be used here/g) ?? []).length !== 3) return `HEIC: ${refused()}`;
    if (names() !== "a.png,b.png,c.png") return "a HEIC photo was kept";
    // AVIF has the same box, with another brand: not HEIC.
    await pick(new File([ftyp("avif")], "fine.avif", { type: "image/avif" }));
    if (/HEIC/.test(refused()) || !/fine\.avif/.test(names())) return `AVIF: ${refused()}`;
    await tap(tool(cards()[3], "Remove"));

    // Too large by a byte; just small enough; not a picture; empty.
    await pick(new File([new Uint8Array(200001)], "big.png", { type: "image/png" }));
    if (!/big\.png: Larger than 195 KB: it is 195 KB/.test(refused())) return `too large: ${refused()}`;
    await pick(new File(["x"], "notes.pdf", { type: "application/pdf" }), new File([], "nil.png", { type: "image/png" }));
    if (!/notes\.pdf: That is not a picture/.test(refused()) || !/nil\.png: That file is empty/.test(refused())) return `not a picture: ${refused()}`;
    await tap(button("Dismiss"));
    if (refused() !== "") return "Dismiss leaves the list";

    // The cap: of two more with room for one, the first goes in and the second is told.
    await pick(d, e);
    if (names() !== "a.png,b.png,c.png,d.png" || !/e\.png: Only 4 photos can be added/.test(refused())) return `the cap: ${names()} ${refused()}`;
    if (!add().disabled || !/all there is room for/.test(box().textContent)) return "a full list still offers more";

    // Earlier and Later, by a finger.
    await tap(tool(cards()[0], "Later"));
    if (names() !== "b.png,a.png,c.png,d.png" || sent() !== names()) return `Later: ${names()} / ${sent()}`;
    await tap(tool(cards()[1], "Earlier"));
    if (names() !== "a.png,b.png,c.png,d.png") return `Earlier: ${names()}`;
    if (!tool(cards()[0], "Earlier").disabled || !tool(cards()[3], "Later").disabled) return "the ends can still move";

    // The grip by keys.
    const grip = (i) => cards()[i].querySelector(".ui-gallery-picker-grip");
    key(grip(0), "ArrowRight"); await wait(60);
    if (names() !== "b.png,a.png,c.png,d.png") return `arrow key: ${names()}`;
    key(grip(1), "ArrowUp"); await wait(60);
    if (names() !== "a.png,b.png,c.png,d.png") return `arrow key back: ${names()}`;
    key(grip(0), "ArrowLeft"); await wait(60);
    if (names() !== "a.png,b.png,c.png,d.png") return "an arrow key moved the first photo off the list";

    // A drag: short of half a cell it springs back.
    cards()[0].scrollIntoView({ block: "center" });
    await wait(60);
    const r0 = cards()[0].getBoundingClientRect(), r1 = cards()[1].getBoundingClientRect();
    const cell = r1.left - r0.left;
    await drag(grip(0), cell * 0.3, 0);
    if (names() !== "a.png,b.png,c.png,d.png") return `a short drag moved it: ${names()}`;
    if (cards()[0].style.transform !== "") return "a short drag leaves it out of place";
    // Past half a cell, it lands on the next.
    await drag(grip(0), cell, 0);
    if (names() !== "b.png,a.png,c.png,d.png" || sent() !== names()) return `a drag: ${names()}`;
    if (note() !== "In this order: b.png, a.png, c.png, d.png") return `on_change after a drag: ${note()}`;
    if (cards().some((x) => x.style.transform !== "" || x.classList.contains("ui-gallery-picker-card-target"))) return "a drag leaves marks";
    // Under a tiny move, the transform never starts.
    await drag(grip(0), 3, 2);
    if (names() !== "b.png,a.png,c.png,d.png") return "a slip moved it";
    // Down a row: the place under it.
    cards()[1].scrollIntoView({ block: "center" });
    await wait(60);
    const cols = Math.round(box().querySelector(".ui-gallery-picker-grid").getBoundingClientRect().width / (cell));
    // At full tablet width all four fit in a row; on a phone there are two rows.
    if (cols !== (device === "tablet" ? 4 : 2)) return `${device} has ${cols} columns`;
    if (device === "tablet") {
        await drag(grip(0), cell * 3, 0);
    } else {
        const row = cards()[cols].getBoundingClientRect().top - cards()[0].getBoundingClientRect().top;
        await drag(grip(0), 0, row);
    }
    await wait(220);
    const expected = device === "tablet" ? "a.png,c.png,d.png,b.png" : "a.png,c.png,b.png,d.png";
    if (names() !== expected) return `a drag down a row: ${names()}, not ${expected}`;

    // A gesture the system takes back changes nothing.
    const before = names();
    const p = middle(grip(0));
    await fingers("touchStart", [p]);
    await fingers("touchMove", [{ x: p.x + cell, y: p.y }]);
    await wait(40);
    if (!cards()[0].classList.contains("ui-gallery-picker-card-on")) return "a drag does not lift the card";
    await fingers("touchCancel", []);
    await wait(60);
    if (names() !== before || cards()[0].style.transform !== "" || cards()[0].classList.contains("ui-gallery-picker-card-on")) return "a cancelled drag left it changed";
    await wait(260);    // the spring back

    // A key on another photo during a drag does not move the list under the finger.
    const mid = names();
    const h = middle(grip(0));
    await fingers("touchStart", [h]);
    await fingers("touchMove", [{ x: h.x + cell, y: h.y }]);
    await wait(40);
    key(grip(2), "ArrowLeft");
    await wait(60);
    if (names() !== mid) return `the list moved during a drag: ${names()}`;
    if (!cards()[0].style.transform) return "the drag was dropped by a key";
    await fingers("touchCancel", []);
    await wait(260);

    // Remove frees the thumbnail, at once.
    const gone = cards()[0].querySelector("img").src;
    await tap(tool(cards()[0], "Remove"));
    if (!freed.includes(gone) || cards().length !== 3 || add().disabled) return "Remove did not free the photo";
    if ([...carry().files].length !== 3) return "the field keeps a removed photo";

    // Leaving the page frees the rest: nothing stays made.
    await tap(button("Leave the page"));
    await wait(60);
    const left = made.filter((u) => !freed.includes(u));
    if (left.length) return `${left.length} previews stay when the component leaves`;
    await tap(button("Come back"));
    await wait(80);
} finally {
    URL.createObjectURL = make0; URL.revokeObjectURL = free0;
}
