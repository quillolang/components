const c = $("#group-summary-demo-title").closest(".ui-gsum");
const line = (id) => { const r = c.querySelector(`tr[data-line="${id}"]`); return r && [...r.children].map((t) => t.textContent.trim()).join("|"); };
const csv = () => $("#group-summary-demo-csv").textContent;
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(100); };
// EU: 3+12+5 = 20, 0.10+0.07+0.20 = 0.37, 0.37/3 = 0.12. US: 1+2 (n/a is out) = 3; 19.99+19.99+0.07 = 40.05, /3 = 13.35.
// The empty region: 4, 0.10. Total: 27 and 40.52, 40.52/7 = 5.79 (5.7885...).
if (line("/EU") !== "EU|3|20|0.37|0.12") return `EU: ${line("/EU")}`;
if (line("/EU/Lisbon") !== "Lisbon|2|15|0.17|0.09") return `Lisbon: ${line("/EU/Lisbon")}`;
if (line("/EU/Paris") !== "Paris|1|5|0.20|0.20" && line("/EU/Paris") !== "Paris|1|5|0.2|0.20") return `Paris: ${line("/EU/Paris")}`;
if (line("/US") !== "US|3|3|40.05|13.35") return `US: ${line("/US")}`;
if (line("/US/Boston") !== "Boston|1|–|0.07|0.07") return `Boston: ${line("/US/Boston")}`;
if (line("/") !== "(empty)|1|4|0.1|0.10") return `empty: ${line("/")}`;
if (line("total") !== "Total|7|27|40.52|5.79") return `total: ${line("total")}`;
const order = () => [...c.querySelectorAll("tbody tr")].map((r) => r.dataset.line).join(" ");
if (order() !== "/EU /EU/Lisbon /EU/Paris /US /US/Austin /US/Boston / //") return `order: ${order()}`;
if (c.querySelector(".ui-gsum-note").textContent !== "1 value is not a number, and left out of the sums and averages.") return c.querySelector(".ui-gsum-note").textContent;
// The file.
const want = ["Region,City,Rows,Sum of Qty,Sum of Price,Average of Price", "EU,,3,20,0.37,0.12", "EU,Lisbon,2,15,0.17,0.09", "EU,Paris,1,5,0.2,0.20", "US,,3,3,40.05,13.35", "US,Austin,2,3,39.98,19.99", "US,Boston,1,,0.07,0.07", "(empty),,1,4,0.1,0.10", "(empty),(empty),1,4,0.1,0.10", "Total,,7,27,40.52,5.79", ""];
if (csv() !== want.join("\n")) return `csv:\n${csv()}`;
if (c.querySelector("input[name=csv]").value !== want.join("\n")) return "the form's CSV";
// Fold.
const fold = c.querySelector("tr[data-line='/EU'] button");
if (fold.getAttribute("aria-expanded") !== "true") return "starts open";
fold.click(); await wait(80);
if (c.querySelector("tr[data-line='/EU/Lisbon']") || fold.getAttribute("aria-expanded") !== "false") return "folding EU";
if (line("total") !== "Total|7|27|40.52|5.79") return "the total stays";
fold.click(); await wait(80);
if (!c.querySelector("tr[data-line='/EU/Paris']")) return "opening EU";
const btn = (t) => [...c.querySelectorAll("button")].find((b) => b.textContent.trim() === t);
btn("Close all").click(); await wait(80);
if (order() !== "/EU /US /") return `close all: ${order()}`;
btn("Open all").click(); await wait(80);
// Change the aggregation and the column; min and max read numbers, then text.
const m = c.querySelector("[data-measure='0']");
await pick(m.querySelectorAll("select")[0], "max");
if (line("total").split("|")[2] !== "n/a") return `max of a column with text goes by text: ${line("total")}`;
await pick(m.querySelectorAll("select")[1], "price");
if (line("/EU").split("|")[2] !== "0.2") return `max of price in EU: ${line("/EU")}`;
await pick(m.querySelectorAll("select")[0], "min");
await pick(m.querySelectorAll("select")[1], "sold");
if (line("total").split("|")[2] !== "2025-12-30") return `min of dates: ${line("total")}`;
await pick(m.querySelectorAll("select")[0], "distinct");
await pick(m.querySelectorAll("select")[1], "product");
if (line("total").split("|")[2] !== "3" || line("/US").split("|")[2] !== "2") return `distinct: ${line("total")} ${line("/US")}`;
await pick(m.querySelectorAll("select")[0], "count");
await pick(m.querySelectorAll("select")[1], "region");
if (line("total").split("|")[2] !== "6") return `count leaves out what is not there: ${line("total")}`;
// Regroup: remove one, add one, swap the order.
c.querySelector("[aria-label='Stop grouping by City']").click(); await wait(100);
if (order() !== "/EU /US /") return `one group: ${order()}`;
await pick($("#group-summary-demo-add"), "product");
if (order() !== "/EU /EU/Bolt /EU/Nut /US /US/Nut /US/Saw / //Bolt") return `two: ${order()}`;
c.querySelector("[aria-label='Move Product outward']").click(); await wait(100);
if (!c.querySelector("tr[data-line='/Saw/US']") || order().startsWith("/EU")) return `swapped: ${order()}`;
[...c.querySelectorAll(".ui-gsum-chip")].forEach((x) => x.querySelector("[aria-label^=Stop]").click()); await wait(100);
if (c.querySelectorAll("tbody tr").length !== 0 || line("total").split("|")[1] !== "7") return "with no groups, only the total";
// Add and remove a measure.
btn("Add an aggregation").click(); await wait(100);
if (c.querySelectorAll("[data-measure]").length !== 4) return "adding a measure";
c.querySelector("[aria-label='Remove aggregation 4']").click(); await wait(100);
// A value with a slash is its own group, and folds alone; 1 and 1.0 are one group; numbers sort as numbers; too large to add is left out.
const odd = $("#group-summary-demo-slash-title").closest(".ui-gsum");
const oddl = (id) => [...odd.querySelector(`tr[data-line="${id}"]`).children].map((t) => t.textContent.trim()).join("|");
if (oddl("/x/1") !== "1|2|3") return `1 and 1.0: ${oddl("/x/1")}`;
if (oddl("/x/y/2") !== "2|1|1,000.50") return `text with a comma: ${oddl("/x/y/2")}`;
if (oddl("total") !== "Total|5|1,003.50") return `too large: ${oddl("total")}`;
if ([...odd.querySelectorAll("tbody tr.ui-gsum-sub")].map((r) => r.dataset.line).join(" ") !== "/2 /10 /x /x/y") return `sorted: ${[...odd.querySelectorAll("tbody tr.ui-gsum-sub")].map((r) => r.dataset.line)}`;
odd.querySelector("tr[data-line='/x'] button").click(); await wait(80);
if (odd.querySelector("tr[data-line='/x/1']") || !odd.querySelector("tr[data-line='/x/y/2']")) return "folding x folds x/y";
// Empty rows.
const none = $("#group-summary-demo-empty-title").closest(".ui-gsum");
if (none.querySelector(".ui-gsum-empty")?.textContent !== "No rows to sum up." || none.querySelector("table")) return "no rows";
// Save: names the file; on_change.
btn("Save as CSV").click(); await wait(100);
if (c.querySelector(".ui-gsum-said").textContent !== "Saved sales.csv") return c.querySelector(".ui-gsum-said").textContent;
const l = $("#group-summary-demo-live-title").closest(".ui-gsum");
await pick($("#group-summary-demo-live-add"), "region");
if (l.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: 9 lines, grouped by product, region.") return l.closest(".demo-stack").querySelector(".demo-note").textContent;
