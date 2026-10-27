const input = $("input[name=fu-receipts]");
const host = input.closest(".ui-fu");
const zone = input.closest(".ui-fu-zone");
if (input.type !== "file" || !input.multiple || !input.required) return "the input is not a required multiple file input";
if (!host.querySelector(".ui-fu-rules")?.textContent.includes("Images, PDF · up to 5 MB each · 4 files at most")) return `the rules say: ${host.querySelector(".ui-fu-rules")?.textContent}`;
const zr = zone.getBoundingClientRect(), ir = input.getBoundingClientRect();
if (Math.abs(zr.width - ir.width) > 4 || Math.abs(zr.height - ir.height) > 4) return "the input does not cover the zone, so a drop would miss it";
input.dispatchEvent(new DragEvent("dragenter", { bubbles: true })); await wait(100);
if (!zone.classList.contains("ui-fu-over")) return "dragging over does not mark the zone";
input.dispatchEvent(new DragEvent("dragleave", { bubbles: true })); await wait(100);
const pick = async (el, files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    el.files = dt.files;
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await wait();
};
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>';
await pick(input, [
    new File([svg], "lunch.svg", { type: "image/svg+xml" }),
    new File(["x".repeat(3000)], "taxi.pdf", { type: "application/pdf" }),
    new File(["x"], "notes.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    new File([new Uint8Array(5300000)], "huge.pdf", { type: "application/pdf" }),
]);
const rows = () => [...host.querySelectorAll(".ui-fu-file")];
const text = () => rows().map((r) => [...r.querySelector(".ui-fu-meta").children].map((c) => c.textContent).join(" "));
if (text().join(" | ") !== "lunch.svg 107 B | taxi.pdf 2.9 KB | notes.docx Not a kind of file taken here: not sent | huge.pdf Larger than 5 MB: not sent")
    return `the list shows: ${text().join(" | ")}`;
const thumb = rows()[0].querySelector("img.ui-fu-thumb");
if (!thumb || !thumb.src.startsWith("blob:")) return "an image has no thumbnail";
if (rows()[1].querySelector(".ui-fu-icon")?.textContent !== "PDF") return "a PDF has no PDF icon";
if (!rows()[2].classList.contains("ui-fu-bad")) return "a refused file is not marked";
if ([...input.files].map((f) => f.name).join() !== "lunch.svg,taxi.pdf") return `the input holds ${[...input.files].map((f) => f.name)}`;
if (host.querySelector("[role=status]").textContent.trim() !== "2 files ready, 2 not taken") return `status: ${host.querySelector("[role=status]").textContent}`;
await pick(input, [new File(["a"], "a.png", { type: "image/png" }), new File(["b"], "b.png", { type: "image/png" }), new File(["c"], "c.png", { type: "image/png" }), new File(["x".repeat(3000)], "taxi.pdf", { type: "application/pdf" })]);
const whys = rows().map((r) => r.querySelector(".ui-fu-why")?.textContent ?? "ok");
if (whys.slice(4).join(" | ") !== "ok | ok | Only 4 files can be sent: not sent | Already chosen: not sent") return `picking more: ${whys.join(" | ")}`;
if ([...input.files].map((f) => f.name).join() !== "lunch.svg,taxi.pdf,a.png,b.png") return `after picking more the input holds ${[...input.files].map((f) => f.name)}`;
rows()[0].querySelector(".ui-fu-x").click(); await wait();
if ([...input.files].map((f) => f.name).join() !== "taxi.pdf,a.png,b.png") return `removing does not take the file out of the input: ${[...input.files].map((f) => f.name)}`;
if (document.activeElement !== input) return "focus does not go back to the input after removing";
const form = document.createElement("form");
host.parentElement.insertBefore(form, host); form.appendChild(host);
const sent = new FormData(form).getAll("fu-receipts").map((f) => f.name);
form.parentElement.insertBefore(host, form); form.remove();
if (sent.join() !== "taxi.pdf,a.png,b.png") return `a form would send: ${sent}`;
const docs = $("input[name=fu-docs]");
const live = docs.closest(".demo-stack");
await pick(docs, [new File(["x".repeat(2048)], "plan.pdf", { type: "application/pdf" }), new File(["a,b"], "data.csv", { type: "text/csv" })]);
if (!live.querySelector(".demo-note").textContent.startsWith("2 ready, 2 KB")) return `on_change: ${live.querySelector(".demo-note").textContent}`;
const up = [...live.querySelectorAll("button")].find((b) => b.textContent === "Upload");
up.click(); await wait(150);
const bar = live.querySelector("[role=progressbar]");
if (!bar || !(Number(bar.getAttribute("aria-valuenow")) > 0)) return "the progress bar does not move";
await wait(1600);
if (bar.getAttribute("aria-valuenow") !== "100" || !live.textContent.includes("Uploaded")) return `the upload does not finish: ${bar.getAttribute("aria-valuenow")}`;
const one = $("input[name=fu-avatar]");
if (one.multiple) return "multiple={false} is not applied";
await pick(one, [new File([svg], "me.svg", { type: "image/svg+xml" })]);
await pick(one, [new File([svg], "me2.svg", { type: "image/svg+xml" })]);
const names = [...one.closest(".ui-fu").querySelectorAll(".ui-fu-name")].map((n) => n.textContent);
if (names.join() !== "me2.svg") return `a single file input keeps ${names}`;
