const c = $("#box-packer-demo-name-0").closest(".ui-boxpack");
const f = (n, i = 0, r = "box-packer-demo") => $(`#${r}-${n}-${i}`);
const verdict = (r = c) => r.querySelector(".ui-boxpack-verdict")?.textContent;
const boxes = (r = c) => [...r.querySelectorAll(".ui-boxpack-box")].map((b) => [...b.children].map((x) => x.textContent).join(" | "));
const unfit = (r = c) => [...r.querySelectorAll(".ui-boxpack-unfit li")].map((l) => l.textContent);
const err = (i = 0, r = "box-packer-demo") => $(`#${r}-error-${i}`)?.textContent;
// 5 x 28 x 5 needs turning, and 28 is past Small's 20. Medium: 9000 / 5000 = 1.8 dimensional, 0.5 actual, 2.0 billable at a 0.5 step.
if (verdict() !== "One box: Medium. Billable weight 2.00 kg.") return `start: ${verdict()}`;
if (boxes().join(" / ") !== "Medium | 2.00 kg | Poster tube | Actual 0.50 kg, dimensional 1.80 kg, 7.8% full") return `box: ${boxes()}`;
if (c.querySelector(".ui-boxpack-sizes").textContent !== "Boxes: Small 20 × 15 × 10 cm, Medium 30 × 20 × 15 cm, Large 40 × 30 × 30 cm, Extra large 60 × 40 × 40 cm.") return "boxes not sorted";
// A heavy small thing: actual weight wins, 2.6 + 0.1 = 2.7, up to 3.0. 
type(f("name"), "Dumbbell"); type(f("size"), "5x5x5"); type(f("weight"), "2.6"); await wait();
if (boxes()[0] !== "Small | 3.00 kg | Dumbbell | Actual 2.70 kg, dimensional 0.60 kg, 4.2% full") return `heavy: ${boxes()}`;
// Weight moves it up a box: 5.5 is past Small's 5 kg; in Medium it weighs 5.7.
type(f("weight"), "5.5"); await wait();
if (boxes()[0] !== "Medium | 6.00 kg | Dumbbell | Actual 5.70 kg, dimensional 1.80 kg, 1.4% full") return `by weight: ${boxes()}`;
// Thirty cubes of 1 kg: Extra large holds them by volume, but 29 + its 0.7 tare is all it may weigh.
type(f("name"), "Cube"); type(f("size"), "10 x 10 x 10"); type(f("weight"), "1"); type(f("qty"), "30"); await wait();
if (verdict() !== "Split across 2 boxes, because no one box takes it all. Billable weight 31.50 kg in all.") return `split: ${verdict()}`;
// Extra large: 96000 / 5000 = 19.2 dimensional, 29.7 actual, 30.0 billable; the last cube goes in Small: 1.1 up to 1.5.
if (boxes().join(" / ") !== "Extra large | 30.00 kg | 29 × Cube | Actual 29.70 kg, dimensional 19.20 kg, 30.2% full / Small | 1.50 kg | Cube | Actual 1.10 kg, dimensional 0.60 kg, 33.3% full") return `split boxes: ${boxes().join(" / ")}`;
// Fits no box: the side, then the weight, then the shape.
type(f("name"), "Piano"); type(f("size"), "200 x 100 x 150"); type(f("qty"), "1"); await wait();
if (unfit().join("") !== "Piano fits no box. Its longest side is 200 cm, and the longest any box takes is 60 cm." || verdict()) return `piano: ${unfit()}`;
type(f("name"), "Anvil"); type(f("size"), "30 x 20 x 15"); type(f("weight"), "40"); await wait();
if (unfit().join("") !== "Anvil fits no box. It weighs 40 kg, and the most a box that takes it can carry is 29.3 kg.") return `anvil: ${unfit()}`;
type(f("name"), "Plank"); type(f("size"), "59 x 41 x 41"); type(f("weight"), "1"); await wait();
if (unfit().join("") !== "Plank fits no box. No box takes all three of its sides, however it is turned.") return `plank: ${unfit()}`;
// The good pieces go on without the one that cannot.
$("#box-packer-demo-add").click(); await wait();
if (document.activeElement !== f("name", 1)) return "a new row takes the focus";
type(f("name", 1), "Mug"); type(f("size", 1), "12 x 9 x 10"); type(f("weight", 1), "0.4"); type(f("qty", 1), "1"); await wait();
if (unfit().length !== 1 || !boxes()[0]?.startsWith("Small |")) return `the rest ship: ${boxes()} ${unfit()}`;
c.querySelector('button[aria-label="Remove Plank"]').click(); await wait();
if (f("name", 0) || document.activeElement !== $("#box-packer-demo-add") || unfit().length) return "removing a row";
// Bad rows say what is wrong, on the field.
for (const [field, text, want] of [["size", "12 x 9", "Size needs three numbers, such as 30 x 20 x 10."], ["size", "a x b x c", "Size needs three numbers, such as 30 x 20 x 10."], ["size", "0 x 1 x 1", "Each side must be more than 0."], ["size", "99999 x 1 x 1", "A side is too large to pack."], ["size", "", "Add a size."],
    ["weight", "heavy", "Weight is not a number."], ["weight", "", "Add a weight."], ["qty", "1.5", "Quantity is not a whole number."], ["qty", "0", "Quantity is not a whole number."], ["qty", "x", "Quantity is not a whole number."]]) {
    const before = f(field, 1).value;
    type(f(field, 1), text); await wait(60);
    if (err(1) !== want || f(field, 1).getAttribute("aria-invalid") !== "true") return `bad ${field} ${text}: ${err(1)}`;
    type(f(field, 1), before); await wait(60);
}
if (verdict() !== "One box: Small. Billable weight 1.00 kg.") return `fixed again: ${verdict()}`;
// Too many pieces: capped, said, and quick.
const t0 = performance.now();
type(f("size", 1), "4 x 4 x 4"); type(f("weight", 1), "0.01"); type(f("qty", 1), "500"); await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
const ms = performance.now() - t0;
if (ms > 600) return `500 pieces took ${Math.round(ms)} ms`;
await wait();
if (c.querySelector(".ui-boxpack-problems")?.textContent !== "Only the first 100 of the 500 pieces are packed.") return `cap: ${c.querySelector(".ui-boxpack-problems")?.textContent}`;
// 8 x 216 = 1728 fills the cube exactly; 12^3 / 139 = 12.43..., up to 13 at a step of 1 lb.
const l = $("#box-packer-demo-live-name-0").closest(".ui-boxpack");
if (verdict(l) !== "One box: Cube. Billable weight 13.00 lb." || boxes(l)[0] !== "Cube | 13.00 lb | 8 × Block | Actual 12.00 lb, dimensional 12.43 lb, 100.0% full") return `exact: ${verdict(l)} ${boxes(l)}`;
if (!l.querySelector(".ui-boxpack-problems").textContent.includes("Oops has a size or weight it cannot read")) return "a bad box is not said";
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
type($("#box-packer-demo-live-divisor"), "166"); await wait();
// 1728 / 166 = 10.4, under the 12 actual, which is exact at the step.
if (seen() !== "on_change: 1 box, 12 billable." && seen() !== "on_change: 1 box, 12.00 billable.") return `on_change: ${seen()}`;
type($("#box-packer-demo-live-qty-0"), "9"); await wait();
if (verdict(l) !== "Split across 2 boxes, because no one box takes it all. Billable weight 23.00 lb in all.") return `one more: ${verdict(l)}`;
if ($("#box-packer-demo-live-qty-0").name !== "order_item_qty") return "name does not prefix the fields";
type($("#box-packer-demo-live-divisor"), "none"); await wait();
if (l.querySelector("[role=alert]")?.textContent !== "The divisor is not a number above 0, so the usual 139 is used.") return "bad divisor";
// Upright: a bottle cannot lie down in a flat box, and the same size laid flat can.
const u = $("#box-packer-demo-upright-name-0").closest(".ui-boxpack");
if (unfit(u).join("") !== "Bottle fits no box. No box takes it standing upright." || boxes(u)[0]?.split(" | ")[2] !== "Laid flat") return `upright: ${unfit(u)} ${boxes(u)}`;
const n = $("#box-packer-demo-none-name-0").closest(".ui-boxpack");
if (n.querySelector("[role=alert]")?.textContent !== "There are no boxes to pack into.") return "no boxes";
