const c = $("#shift-planner-demo-title").closest(".ui-shift-planner");
const sel = (p, d) => $(`#shift-planner-demo-${p}-${d}`);
const pick = async (p, d, v) => { const s = sel(p, d); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(50); };
const list = () => [...c.querySelectorAll(".ui-shift-planner-breach li")].map((l) => l.textContent);
const kinds = (k) => [...c.querySelectorAll(`.ui-shift-planner-breach li[data-kind=${k}]`)].map((l) => l.textContent);
const unfilled = () => [...c.querySelectorAll(".ui-shift-planner-unfilled li")].map((l) => l.textContent);
const hours = (p) => c.querySelector(`tr[data-person=${p}] .ui-shift-planner-hours`).textContent;
const cover = (s, d) => c.querySelector(`tr[data-shift=${s}] td:nth-child(${d + 2})`);
const fill = () => c.querySelector(".ui-shift-planner-fill").click();
const clear = () => [...c.querySelectorAll(".ui-shift-planner-btn")].find((b) => b.textContent === "Clear").click();
// Ana Mon Late ends 22:00, Tue Early starts 06:00: 8 h. Cara on Sat is off and has no forklift.
if (c.querySelector("thead th:nth-child(2)").textContent !== "Mon 2") return "the week's Monday";
if (kinds("rest").join() !== "Ana on Tue: only 8 h rest after it, from Mon Late; 11 h needed.") return `rest: ${kinds("rest")}`;
if (!sel("ana", 1).closest("td").classList.contains("ui-shift-planner-bad") || sel("ana", 1).getAttribute("aria-invalid") !== "true") return "the rest breach is not on its cell";
if (sel("ana", 0).closest("td").classList.contains("ui-shift-planner-bad")) return "the earlier shift is marked";
if (kinds("skill").join() !== "Cara on Sat: Night needs forklift." || kinds("off").join() !== "Cara is off on Sat.") return `skill, off: ${kinds("skill")} ${kinds("off")}`;
if (!sel("cara", 5).closest("td").title.includes("Night needs forklift")) return "the reason is not on the cell";
if (hours("ana") !== "16" || sel("ana", 0).value !== "late") return `ana: ${hours("ana")}`;
// Coverage: Tue Early 1/1; Mon Early 0/1 short; a list of needs: Sat Late needs none.
if (cover("early", 1).textContent !== "1/1" || cover("early", 1).classList.contains("ui-shift-planner-short")) return "Tue Early";
if (cover("early", 0).textContent !== "0/1" || !cover("early", 0).classList.contains("ui-shift-planner-short")) return "Mon Early";
if (cover("late", 5).textContent !== "0/0") return `Sat Late: ${cover("late", 5).textContent}`;
if (!kinds("cover").includes("Mon Early has 0 of 1.")) return `cover: ${kinds("cover")}`;
// A date in the off list.
await pick("dev", 2, "early");
if (kinds("off").length !== 2 || !kinds("off").includes("Dev is off on Wed.")) return `off by date: ${kinds("off")}`;
await pick("dev", 2, "");
// Rest across midnight: Night Mon ends 06:00 Tue; Tue Late at 14:00 is 8 h on.
clear(); await wait();
if (hours("ana") !== "0" || kinds("rest").length) return "clear";
await pick("ana", 0, "night"); await pick("ana", 1, "late");
if (kinds("rest").join() !== "Ana on Tue: only 8 h rest after it, from Mon Night; 11 h needed.") return `overnight rest: ${kinds("rest")}`;
// An overlap: Night Mon runs to 06:00 Tue, Early Tue starts at 06:00: 0 h.
await pick("ana", 1, "early");
if (kinds("rest").join() !== "Ana on Tue: only 0 h rest after it, from Mon Night; 11 h needed.") return `no rest: ${kinds("rest")}`;
await pick("ana", 1, "");
// Weekly hours: Ben's own limit of 24; 4 shifts are 32.
clear(); await wait();
for (const d of [0, 1, 2, 3]) await pick("ben", d, "early");
if (kinds("hours").join() !== "Ben has 32 h, over the limit of 24 h." || !c.querySelector("tr[data-person=ben] .ui-shift-planner-over")) return `hours: ${kinds("hours")}`;
clear(); await wait();
// Auto-fill from empty. 19 places in all: 7 Early, 5 Late, 7 Night, 152 h. Night needs a forklift, and only Ana and Ben have one.
fill(); await wait();
const ban = list().filter((l) => !/has \d of/.test(l));
if (ban.length) return `auto-fill broke a rule: ${ban}`;
const total = ["ana", "ben", "cara", "dev"].map(hours).map(Number);
const sum = total.reduce((a, b) => a + b, 0);
if (sum % 8 !== 0 || total[1] > 24 || total[0] > 40 || total[2] > 40 || total[3] > 40) return `hours: ${total}`;
const places = 19 - sum / 8;
if (unfilled().length !== places) return `${places} short but ${unfilled().length} listed: ${unfilled()}`;
for (const u of unfilled()) if (!/^Could not fill (Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Early|Late|Night): .*(forklift|rest|hours|off|work that day)/.test(u)) return `a reason: ${u}`;
if (kinds("cover").length !== places) return `cover after fill: ${kinds("cover")}`;
// Fair: the two without a forklift are within one shift of each other.
if (Math.abs(total[2] - total[3]) > 8) return `unfair: ${total}`;
if (!/^Filled\. Hours run from \d+ to \d+; \d+ could not be filled\.$/.test(c.querySelector(".ui-shift-planner-said:last-child").textContent)) return `said: ${c.querySelector(".ui-shift-planner-said:last-child").textContent}`;
// Filling keeps what is there, and is stable.
const before = [...c.querySelectorAll("tbody select")].map((s) => s.value).join();
fill(); await wait();
if ([...c.querySelectorAll("tbody select")].map((s) => s.value).join() !== before) return "a second fill changed the plan";
clear(); await wait();
// A hand-placed shift stays and is rested around.
await pick("ana", 2, "night"); fill(); await wait();
if (sel("ana", 2).value !== "night" || (sel("ana", 3).value !== "" && sel("ana", 3).value !== "night")) return `Ana Thu after Wed Night: ${sel("ana", 3).value}`;
if (sel("ana", 0).name !== "shift_ana_0") return "field name";
if (!/^on_change: \d+ shifts planned\.$/.test(c.closest(".demo-stack").querySelector(".demo-note").textContent)) return "on_change";
// An exact fill: four Days at 8.5 h, Ben off on Tue. Tue has one candidate, so it goes first, to Ana; then Mon to Ben, who has fewer hours; Wed ties, Ana by order; Thu to Ben.
const t = $("#shift-planner-demo-small-title").closest(".ui-shift-planner");
const bad = [...t.querySelectorAll("[role=alert] li")].map((l) => l.textContent);
for (const want of ["Shift bad: its times must be written HH:MM.", "Shift 4: the id day is used twice.", "Shift 5 has no id."]) if (!bad.includes(want)) return `missing "${want}": ${bad}`;
t.querySelector(".ui-shift-planner-fill").click(); await wait();
const row = (p) => [0, 1, 2, 3, 4, 5, 6].map((d) => $(`#shift-planner-demo-small-${p}-${d}`).value).join();
if (row("a") !== ",day,day,,,," || row("b") !== "day,,,day,,,") return `exact fill: ${row("a")} / ${row("b")}`;
if (t.querySelector("tr[data-person=a] .ui-shift-planner-hours").textContent !== "17") return "8.5 h shifts";
const cant = [...t.querySelectorAll(".ui-shift-planner-unfilled li")].map((l) => l.textContent);
if (cant.join() !== "Could not fill Sat Crane: 2 lack crane.") return `what it could not fill: ${cant}`;
if (t.querySelector(".ui-shift-planner-said:last-child").textContent !== "Filled. Hours run from 17 to 17; 1 could not be filled.") return "the fill is not told";
