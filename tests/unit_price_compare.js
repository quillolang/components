const c = $("#unit-price-compare-demo-name-0").closest(".ui-unitprice");
const kind = (r, n) => [...r.querySelectorAll(".ui-unitprice-kind")].find((k) => k.querySelector("h4").textContent.startsWith(n));
const rank = (r, n) => [...(kind(r, n)?.querySelectorAll(".ui-unitprice-rank li") ?? [])].map((l) => [...l.children].map((x) => x.textContent).join("|"));
const f = (n, i, r = "unit-price-compare-demo") => $(`#${r}-${n}-${i}`);
const err = (i, r = "unit-price-compare-demo") => $(`#${r}-error-${i}`)?.textContent;
// Per kg: family 5.00; sack 24 / 4.5359237 = 5.2910...; own brand 6.40; jar 4 / 0.34019427 = 11.7579...
if (rank(c, "By weight").join(" / ") !== "1|Family bag|$5.00 per kg|Best value: 5.5% less than Sack, saving $0.29 per kg / 2|Sack|$5.29 per kg|5.8% dearer than the best / 3|Own brand|$6.40 per kg|28.0% dearer than the best / 4|Imported jar|$11.76 per kg|135.2% dearer than the best") return `weight: ${rank(c, "By weight").join(" / ")}`;
// Per l: bottle 2.00; multipack 5.40 / 1.98 = 2.7272...
if (rank(c, "By volume").join(" / ") !== "1|Bottle|$2.00 per l|Best value: 26.7% less than Multipack, saving $0.73 per l / 2|Multipack|$2.73 per l|36.4% dearer than the best") return `volume: ${rank(c, "By volume").join(" / ")}`;
if (c.querySelector(".ui-unitprice-flag")?.textContent !== "Weight and volume cannot be compared, so these are ranked apart.") return "mixed units are not flagged";
if (kind(c, "By weight").querySelectorAll(".ui-unitprice-best").length !== 1) return "one best value";
// Another basis: the order stands, and the exact pound gives 2.2679...
const per = $("#unit-price-compare-demo-per");
per.value = "lb"; per.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (rank(c, "By weight")[0] !== "1|Family bag|$2.27 per lb|Best value: 5.5% less than Sack, saving $0.13 per lb") return `per lb: ${rank(c, "By weight")[0]}`;
if (rank(c, "By volume")[0] !== "1|Bottle|$0.95 per pint|Best value: 26.7% less than Multipack, saving $0.34 per pint") return `per pint: ${rank(c, "By volume")[0]}`;
per.value = "kg"; per.dispatchEvent(new Event("change", { bubbles: true })); await wait();
// Sizes as they get written: 2 lb 8 oz is 1133.98 g, so 10.00 is 8.8184...
for (const [text, want] of [["2 lb 8 oz", "$8.82"], ["2.5 pounds", "$8.82"], ["1,5 kg", "$6.67"], ["1.5 KILOS", "$6.67"], ["2 x 750 g", "$6.67"], ["750g x 2", "$6.67"], ["2×750g", "$6.67"], ["1500 grams", "$6.67"]]) {
    type(f("size", 1), text); await wait(60);
    const line = rank(c, "By weight").find((l) => l.includes("Family bag"));
    if (!line?.includes(`|${want} per kg`)) return `size ${text}: ${line}`;
}
// A row that cannot be ranked says what is wrong, on the field, and leaves the ranking.
for (const [text, want] of [["12 stone", "\"stone\" is not a unit: use g, kg, oz, lb, ml or l."], ["500", "Size needs a unit, such as 500 g or 1 l."], ["heavy", "Size should start with a number, such as 500 g."],
    ["0 g", "Size must be more than 0."], ["٥٠٠ g", "Size should start with a number, such as 500 g."], ["9999999999999999 g", "Size is too large."], ["2".repeat(60), "Size is too long to read."]]) {
    type(f("size", 1), text); await wait(60);
    if (err(1) !== want || f("size", 1).getAttribute("aria-invalid") !== "true") return `bad size ${text}: ${err(1)}`;
    if (rank(c, "By weight").some((l) => l.includes("Family bag")) || rank(c, "By weight").length !== 3) return `a bad row stays out of the ranking: ${text}`;
}
type(f("size", 1), "2 kg"); await wait();
type(f("price", 1), "soon"); await wait();
if (err(1) !== "Price is not an amount." || f("price", 1).getAttribute("aria-invalid") !== "true" || f("size", 1).getAttribute("aria-invalid")) return `bad price: ${err(1)}`;
type(f("price", 1), ""); await wait();
if (err(1) !== "Add a price.") return `no price: ${err(1)}`;
type(f("price", 1), "0"); await wait();
// Free is first, and no percentage can be taken against nothing.
if (rank(c, "By weight")[0].slice(0, 22) !== "1|Family bag|$0.00 per" || rank(c, "By weight")[1] !== "2|Sack|$5.29 per kg|Far dearer than the best") return `free: ${rank(c, "By weight").join(" / ")}`;
type(f("price", 1), "10.00"); await wait();
if (f("name", 0).name !== "pack_name" || f("price", 0).name !== "pack_price" || f("size", 0).name !== "pack_size") return "field names";
if (!f("size", 0).labels[0]) return "a field has no label";
// Add and remove, with the focus where the keyboard needs it.
$("#unit-price-compare-demo-add").click(); await wait();
if (document.activeElement !== f("name", 6)) return "a new pack takes the focus";
type(f("price", 6), "4"); type(f("size", 6), "1 kg"); await wait();
if (rank(c, "By weight")[0] !== "1|Pack 7|$4.00 per kg|Best value: 20.0% less than Family bag, saving $1.00 per kg") return `added: ${rank(c, "By weight")[0]}`;
c.querySelector('button[aria-label="Remove pack 7"]').click(); await wait();
if (f("name", 6) || document.activeElement !== $("#unit-price-compare-demo-add")) return "removing moves the focus to Add";
const add = $("#unit-price-compare-demo-add");
for (let i = 0; i < 16; i++) { add.click(); await wait(20); }
await wait();
if (!add.disabled || c.querySelectorAll(".ui-unitprice-row").length !== 20) return `the limit: ${c.querySelectorAll(".ui-unitprice-row").length}`;
// Ties share a place, and on_change.
const l = $("#unit-price-compare-demo-live-name-0").closest(".ui-unitprice");
// Ground: 4.00 for 226.796185 g is 1.7636... per 100 g; both others are 3.00.
if (rank(l, "By weight").join(" / ") !== "1|Ground|€1.76 per 100 g|Best value: 41.2% less than Beans, saving €1.24 per 100 g / 2|Beans|€3.00 per 100 g|70.1% dearer than the best / 2|Same again, double|€3.00 per 100 g|70.1% dearer than the best") return `live: ${rank(l, "By weight").join(" / ")}`;
if (l.querySelector(".ui-unitprice-flag")) return "one kind is not mixed";
type(f("price", 2, "unit-price-compare-demo-live"), "6.804"); await wait();
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
// 6.804 for 226.796185 g is 3.0000... a shade over 3.00 per 100 g: third, though it shows the same to the cent.
if (seen() !== "on_change: first Beans, 3 ranked.") return `on_change: ${seen()}`;
if (rank(l, "By weight").map((x) => x.slice(0, 2)).join(" ") !== "1| 1| 3|") return `tied places: ${rank(l, "By weight").join(" / ")}`;
if (f("name", 0, "unit-price-compare-demo-live").name !== "coffee_pack_name") return "name does not prefix the fields";
// Nothing typed yet.
const e = $("#unit-price-compare-demo-empty-name-0").closest(".ui-unitprice");
if (e.querySelector("[aria-live] .ui-unitprice-empty")?.textContent !== "Give a price and a size to compare.") return "empty";
if ($("#unit-price-compare-demo-empty-error-0")) return "a blank row is not an error";
