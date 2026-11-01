const c = $("#bundle-builder-demo-tee").closest(".ui-bundlebuild");
const box = (i) => $(`#bundle-builder-demo-${i}`);
const txt = (r) => r.querySelector(".ui-bundlebuild-sum").textContent.replace(/\s+/g, " ");
const sum = (r, name) => { const d = [...r.querySelectorAll(".ui-bundlebuild-sum div")].find((x) => x.querySelector("dt").textContent.startsWith(name)); return d?.querySelector("dd").textContent.replace(/\s+/g, ""); };
const hint = (r = c) => r.querySelector(".ui-bundlebuild-hint")?.textContent;
const missing = (r = c) => [...r.querySelectorAll(".ui-bundlebuild-missing li")].map((l) => l.textContent);
const state = (r = c) => r.querySelector(".ui-bundlebuild-state")?.textContent;
// 19.99 + 4.99 = 24.98, no tier yet. The cheapest third item is the free sticker at 0.
if (sum(c, "Bought alone") !== "$24.98" || sum(c, "Bundle total") !== "$24.98" || sum(c, "You save")) return `start: ${txt(c)}`;
// With the sticker: 5% of 24.98 = 1.249 -> 1.25, so adding it lowers the total to 23.73.
if (hint() !== "Add 1 more for 5% off: Free sticker ($0.00) is the cheapest way there, and it brings the total down by $1.25, to $23.73.") return `hint: ${hint()}`;
if (missing().join("|") !== "Choose 1 more from Caps.") return `missing: ${missing()}`;
box("cap").click(); await wait();
// 34.97 x 5% = 1.7485 -> 1.75; 34.97 - 1.75 = 33.22.
if (sum(c, "Bought alone") !== "$34.97" || sum(c, "Bundle saving") !== "−minus$1.75" || sum(c, "Bundle total") !== "$33.22" || sum(c, "You save") !== "$1.75(5.0%)") return `tier 1: ${txt(c)}`;
if (state() !== "Your bundle is complete.") return `complete: ${state()}`;
if (c.querySelector(".ui-bundlebuild-now").textContent !== "3 items: 5% off") return "the tier reached is not marked";
// Tops holds 1 of 2 and socks 1 of 2; the cheapest fourth is crew socks at 6.49. 41.46 x 10% = 4.146 -> 4.15; 37.31, up 4.09.
if (hint() !== "Add 1 more for 10% off: Crew socks ($6.49) is the cheapest way there, for $4.09 more, $37.31 in all.") return `hint 2: ${hint()}`;
// Limits: the cap group holds one.
if (!box("beanie").disabled || !box("beanie").closest("label").querySelector(".ui-bundlebuild-why")?.textContent.startsWith("Caps is full at 1")) return "a full group must stop more and say so";
box("crew").click(); await wait();
box("polo").click(); await wait();
// 5 items: 70.96; 10% is not reached past 4, the 5-item tier is $20 off, better than 7.10? 10% of 70.96 = 7.096 -> 7.10, so $20.
if (sum(c, "Bought alone") !== "$70.96" || sum(c, "Bundle saving") !== "−minus$20.00" || sum(c, "Bundle total") !== "$50.96" || sum(c, "You save") !== "$20.00(28.2%)") return `tier 3: ${txt(c)}`;
if (hint()) return `no tier left: ${hint()}`;
if (!box("hoodie").disabled) return "tops is at its most";
// Taking off drops the tier again; below the least, the bundle says what is missing.
box("cap").click(); await wait();
if (sum(c, "Bought alone") !== "$60.97" || missing().join("|") !== "Choose 1 more from Caps.") return `off: ${txt(c)} ${missing()}`;
// 10% of 60.97 = 6.097 -> 6.10; 54.87.
if (sum(c, "Bundle total") !== "$54.87") return `off total: ${txt(c)}`;
if (box("tee").name !== "tops" || !box("tee").labels[0]) return "fields";
for (const i of ["tee", "polo", "ankle", "crew"]) box(i).click();
await wait();
if (state() || sum(c, "Bundle total") !== "$0.00" || missing().join("|") !== "Choose 1 more from Tops.|Choose 1 more from Caps.") return `empty: ${state()} ${missing()}`;
// Zero-decimal money, a best tier that is not the last, and the lines adding up.
const l = $("#bundle-builder-demo-live-a").closest(".ui-bundlebuild");
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (sum(l, "Bought alone").replace("¥", "¥") !== "¥2,300" || sum(l, "Bundle total") !== "¥1,800") return `yen: ${txt(l)}`;
if (hint(l) !== "The 9-item tier is out of reach: this bundle holds at most 3.") return `out of reach: ${hint(l)}`;
$("#bundle-builder-demo-live-c").click(); await wait();
// 3301 alone. The 3-item tier's 5% is 165.05 -> 165, less than the ¥500 of the 2-item tier, which stays.
if (sum(l, "Bundle total") !== "¥2,801" || !sum(l, "Bundle saving").endsWith("¥500")) return `the best tier: ${txt(l)}`;
// Shares of 2801 by price: 1200 / 3301 -> 1018.29..., 1100 -> 933.43..., 1001 -> 849.41...: floors 1018 + 933 + 849 = 2800, one over to the first.
if (seen() !== "on_change: 3 items, 2801, net 1019 + 933 + 849.") return `allocation: ${seen()}`;
if ($("#bundle-builder-demo-live-a").name !== "box_beans") return "name does not prefix the fields";
const b = $("#bundle-builder-demo-bad-y").closest(".ui-bundlebuild");
const said = [...b.querySelectorAll(".ui-bundlebuild-problems li")].map((x) => x.textContent);
for (const want of ["The currency \"XXZ\" is not known, so USD is used.", "Thing has no price of 0 or more, so it is left out.", "The id \"y\" is used twice: the second is left out.",
    "A group without an id or a list of items is left out.", "Things asks for 2 and takes 1, so it can never be complete."])
    if (!said.includes(want)) return `not said: ${want} in ${said.join(" / ")}`;
if (said.filter((x) => x.startsWith("A tier is left out")).length !== 3) return `tiers: ${said.join(" / ")}`;
box("tee").focus();
if (document.activeElement !== box("tee")) return "a box cannot take the focus";
