const q = (n) => $(`input[name=qty_${n}]`);
const c = q("web").closest(".ui-cloud-cost");
const cell = (i, name) => c.querySelectorAll("tbody tr")[i].querySelector(`[data-cell=${name}]`).textContent;
const foot = (name) => c.querySelector(`tfoot [data-cell=${name}]`).textContent;
const stat = (n) => c.querySelector(`[data-stat=${n}] dd`).textContent;
const driver = () => c.querySelector("[data-say=driver]").textContent;
const shares = () => [...c.querySelectorAll(".ui-cloud-cost-driver")].map((d) => d.children[0].textContent + " " + d.children[1].textContent);
const advice = () => [...c.querySelectorAll(".ui-cloud-cost-advice li")].map((l) => l.textContent);
// Web 6 x 730 x 0.026 reserved = 113.88. Storage 1000 x 0.023 + 4000 x 0.022 = 111.00.
// Transfer 100 free + 9900 x 0.09 + 2000 x 0.085 = 1061.00. Database 730 x 0.68 = 496.40.
if ([0, 1, 2, 3].map((i) => cell(i, "monthly")).join(" ") !== "$113.88 $111.00 $1,061.00 $496.40") return `lines: ${[0, 1, 2, 3].map((i) => cell(i, "monthly"))}`;
if ([0, 1, 2, 3].map((i) => cell(i, "yearly")).join(" ") !== "$1,366.56 $1,332.00 $12,732.00 $5,956.80") return `yearly: ${[0, 1, 2, 3].map((i) => cell(i, "yearly"))}`;
if (foot("monthly") !== "$1,782.28" || foot("yearly") !== "$21,387.36") return `totals: ${foot("monthly")} ${foot("yearly")}`;
if (stat("monthly") !== "$1,782.28" || stat("yearly") !== "$21,387.36" || stat("demand") !== "$1,850.61") return `summary: ${stat("monthly")} ${stat("demand")}`;
// On demand web is 182.208, which rounds to 182.21: 68.33 saved of 1,850.61, 3.7%.
if (stat("saving") !== "$68.33 (3.7%)") return `saving: ${stat("saving")}`;
if (driver() !== "Data transfer out drives the bill most: $1,061.00 a month, 59.5% of it. Most of that is the 9,900 GB at 0.09 each.") return driver();
// 59.53, 27.85, 6.39, 6.23 by largest remainder: they add up to 100.0.
if (shares().join(", ") !== "Data transfer out 59.5%, Database 27.9%, Web servers 6.4%, Object storage 6.2%") return shares().join(", ");
if (advice().join(" ") !== "Reserving Database saves $177.40 a month (35.7%).") return advice().join(" / ");
if (q("web").name !== "qty_web" || !q("web").getAttribute("aria-label").includes("Web servers")) return "field name and label";
// The tiers: the first unit past a boundary pays the next price, the rest stay.
type(q("store"), "1000"); await wait();
if (cell(1, "monthly") !== "$23.00") return `at the boundary: ${cell(1, "monthly")}`;
type(q("store"), "1001"); await wait();
if (cell(1, "monthly") !== "$23.02") return `one past it: ${cell(1, "monthly")}`;
type(q("store"), "20000"); await wait();
// 23 + 9000 x 0.022 = 198 + 10000 x 0.021 = 210: 431.
if (cell(1, "monthly") !== "$431.00") return `three tiers: ${cell(1, "monthly")}`;
if (c.querySelectorAll("tbody tr")[1].querySelectorAll("li").length !== 3) return "the tiers are not listed";
type(q("store"), "1,500.5"); await wait();
if (cell(1, "monthly") !== "$34.01") return `commas and a fraction (23 + 500.5 x 0.022 = 34.011): ${cell(1, "monthly")}`;
type(q("store"), "5000"); await wait();
type(q("egress"), "100"); await wait();
if (cell(2, "monthly") !== "$0.00") return `the free tier: ${cell(2, "monthly")}`;
type(q("egress"), "12000"); await wait();
// Reserved loses at low hours. 6 x 100 x 0.0416 = 24.96 on demand against 113.88.
const hours = $("input[name=hours_web]");
type(hours, "100"); await wait();
if (cell(0, "monthly") !== "$113.88" || stat("demand") !== "$1,693.36") return `a reservation is paid for anyway: ${cell(0, "monthly")} ${stat("demand")}`;
if (c.querySelector("[data-stat=saving] dt").textContent !== "Reserving costs more" || stat("saving") !== "$88.92 (5.3%)") return `costs more: ${stat("saving")}`;
if (advice()[1] !== "Web servers at 100 hours a month costs less on demand: reserving adds $88.92 a month. It pays from 456.25 hours a month.") return advice().join(" / ");
const box = $("input[name=reserve_web]");
box.click(); await wait();
if (cell(0, "monthly") !== "$24.96" || stat("saving") !== "$0.00 (0%)") return `unreserved: ${cell(0, "monthly")} ${stat("saving")}`;
box.click(); await wait();
type(hours, "730"); await wait();
const dbBox = $("input[name=reserve_db]");
dbBox.click(); await wait();
// 1 x 730 x 0.30 + 1200 / 12 = 319.
if (cell(3, "monthly") !== "$319.00" || foot("monthly") !== "$1,604.88" || stat("saving") !== "$245.73 (13.3%)") return `upfront: ${cell(3, "monthly")} ${foot("monthly")} ${stat("saving")}`;
if (advice().length) return `nothing left to advise: ${advice()}`;
dbBox.click(); await wait();
// Bad input: named, marked, left out, the page carries on.
for (const bad of ["abc", "-5", "1e3", "😀", "9".repeat(400)]) {
    type(q("store"), bad); await wait();
    const a = c.querySelector("[role=alert]")?.textContent;
    if (a !== "Object storage: the quantity must be a number of 0 or more. It is left out of the totals.") return `${bad.slice(0, 9)}: ${a}`;
    if (q("store").getAttribute("aria-invalid") !== "true" || foot("monthly") !== "$1,671.28") return `${bad.slice(0, 9)}: ${foot("monthly")}`;
    if (q("store").value !== bad) return "what was typed is kept";
}
type(q("store"), ""); await wait();
if (c.querySelector("[role=alert]") || cell(1, "monthly") !== "$0.00") return "empty counts as nothing";
type(q("store"), "5000"); await wait();
type(hours, "800"); await wait();
if (c.querySelector("[role=alert]")?.textContent !== "Web servers: no month has more than 744 hours. It is left out of the totals.") return `800 hours: ${c.querySelector("[role=alert]")?.textContent}`;
type(hours, "730"); await wait();
for (const n of ["web", "store", "egress", "db"]) type(q(n), "0");
await wait();
if (foot("monthly") !== "$0.00" || driver() !== "Nothing is being spent yet." || c.querySelector(".ui-cloud-cost-driver")) return `nothing: ${foot("monthly")} ${driver()}`;
// Euros, a tier that ends: past it the last price holds, and it says so. The cents round half up.
const l = $("input[name=qty_cdn]").closest(".ui-cloud-cost");
const lc = () => l.querySelector("tfoot [data-cell=monthly]").textContent.replace(/\s/g, " ");
if (lc() !== "1,00 €") return `3 x 0.333 = 0.999: ${lc()}`;
type($("input[name=qty_cdn]"), "12"); await wait();
if (lc() !== "4,00 €" || !l.querySelector(".ui-cloud-cost-warn")?.textContent.includes("goes 2 GB past its last tier")) return `past the end: ${lc()}`;
const note = l.closest(".demo-stack").querySelector(".demo-note");
if (note.textContent !== "on_change: the month comes to 4.00.") return `on_change: ${note.textContent}`;
