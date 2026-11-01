const cell = (id, g = "formula-grid-demo") => $(`#${g}-${id}`);
const val = (id, g) => cell(id, g).textContent.trim();
const grid = $("table#formula-grid-demo");
// Bolts 3 x 0.10, Nuts 12 x 0.07, Washers 7 x 1.15.
const want = { D2: "0.30", D3: "0.84", D4: "8.05", B5: "22", D5: "9.19", D6: "3.0633333333", D7: "8.05", D8: "9", D9: "big", A1: "Item" };
for (const [k, v] of Object.entries(want)) if (val(k) !== v) return `${k}: ${val(k)}, not ${v}`;
if (cell("D5").title !== "9.19" || !cell("D5").classList.contains("ui-fgrid-num") || cell("A1").classList.contains("ui-fgrid-num")) return "number cells";
// Errors, each in its cell.
const e = "formula-grid-demo-errors";
const errs = { A1: "#DIV/0!", A2: "#REF!", A3: "#CYCLE!", B3: "#CYCLE!", C3: "#CYCLE!", A4: "#NAME?", A5: "#DIV/0!", A6: "#VALUE!", A7: "#ERROR!", A8: "#REF!", B1: "#NAME?", B2: "#NUM!", B4: "#CYCLE!", B5: "2" };
for (const [k, v] of Object.entries(errs)) if (val(k, e) !== v) return `error ${k}: ${val(k, e)}, not ${v}`;
if (!cell("A1", e).classList.contains("ui-fgrid-err")) return "an error is marked";
// Keyboard: arrows, the bounds, Home, End.
const at = () => $("#formula-grid-demo-where").textContent;
const k = (name, opts = {}) => { grid.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...opts })); };
grid.focus();
k("ArrowUp"); k("ArrowLeft"); await wait(60);
if (at() !== "A1") return `the top left stops: ${at()}`;
k("ArrowRight"); k("ArrowDown"); await wait(60);
if (at() !== "B2" || grid.getAttribute("aria-activedescendant") !== "formula-grid-demo-B2" || cell("B2").getAttribute("aria-selected") !== "true") return `arrows: ${at()}`;
k("End"); await wait(60);
if (at() !== "E2") return `End: ${at()}`;
k("End", { ctrlKey: true }); await wait(60);
if (at() !== "E10") return `Ctrl+End: ${at()}`;
k("Home", { ctrlKey: true }); await wait(60);
if (at() !== "A1") return `Ctrl+Home: ${at()}`;
// Typing starts an edit; Enter keeps it and goes down; everything that reads it follows.
k("ArrowDown"); k("ArrowRight"); await wait(60);
k("4"); await wait(100);
let input = cell("B2").querySelector("input");
if (!input || document.activeElement !== input || input.value !== "4") return `typing starts an edit: ${input?.value}`;
input.value = "4"; input.dispatchEvent(new Event("input", { bubbles: true }));
input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await wait(100);
if (at() !== "B3" || document.activeElement !== grid || cell("B2").querySelector("input")) return `Enter: ${at()}`;
// 4 x 0.10 = 0.40; D5 = 0.40 + 0.84 + 8.05 = 9.29.
if (val("B2") !== "4" || val("D2") !== "0.40" || val("D5") !== "9.29" || val("B5") !== "23") return `recalculation: ${val("D2")} ${val("D5")}`;
if ($("#formula-grid-demo-said").textContent !== "B2 is 4") return $("#formula-grid-demo-said").textContent;
// Escape drops an edit; F2 shows the formula; Tab moves right.
k("Enter"); await wait(100);
input = cell("B3").querySelector("input");
input.value = "999"; input.dispatchEvent(new Event("input", { bubbles: true }));
input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true })); await wait(100);
if (val("B3") !== "12" || document.activeElement !== grid) return `Escape: ${val("B3")}`;
const edit = async (id, text, how = "Enter", opts = {}) => {
    const [c, r] = [id.charCodeAt(0) - 65, +id.slice(1) - 1];
    k("Home", { ctrlKey: true }); for (let i = 0; i < c; i++) k("ArrowRight"); for (let i = 0; i < r; i++) k("ArrowDown"); await wait(60);
    k("F2"); await wait(100);
    const box = cell(id).querySelector("input");
    box.value = text; box.dispatchEvent(new Event("input", { bubbles: true }));
    box.dispatchEvent(new KeyboardEvent("keydown", { key: how, bubbles: true, cancelable: true, ...opts })); await wait(120);
};
await edit("E1", "=0.1+0.2", "Tab");
if (val("E1") !== "0.3") return `exact: ${val("E1")}`;
if (at() !== "E1") return `Tab stays in the grid at the end: ${at()}`;
if ($("#formula-grid-demo-bar").value !== "=0.1+0.2") return `the bar shows the formula: ${$("#formula-grid-demo-bar").value}`;
await edit("E2", "=(1+2)*3-4/2&\"!\"");
if (val("E2") !== "7!") return `precedence: ${val("E2")}`;
await edit("E3", "=1/3*3");
if (val("E3") !== "1") return `a third times three shows 1: ${val("E3")}`;
await edit("E4", "=IF(A1=\"item\",-B3,1/0)");
if (val("E4") !== "-12") return `IF takes one branch, text ignores case: ${val("E4")}`;
await edit("E5", "=MIN(C2:C4)+MAX(C2,C3)");
if (val("E5") !== "0.17") return `min and max: ${val("E5")}`;
await edit("E6", "=$B$2+c3");
if (val("E6") !== "4.07") return `absolute and lower-case references: ${val("E6")}`;
await edit("E7", "=AVG(A1:A4)");
if (val("E7") !== "#DIV/0!") return `the average of no numbers: ${val("E7")}`;
await edit("E8", "=COUNT(E1:E3)=3");
if (val("E8") !== "FALSE" && val("E8") !== "TRUE") return `a comparison: ${val("E8")}`;
if (val("E8") !== "FALSE") return `E2 is text: ${val("E8")}`;
// A chain: filling a cell that was empty, and a cycle broken again.
await edit("E9", "=E10+1"); await edit("E10", "=E9+1");
if (val("E9") !== "#CYCLE!" || val("E10") !== "#CYCLE!") return `a cycle: ${val("E9")}`;
await edit("E10", "5");
if (val("E9") !== "6") return `a cycle broken: ${val("E9")}`;
// Delete empties; bad input does not throw.
k("Delete"); await wait(100);
if ($("#formula-grid-demo-said").textContent === "") return "the delete says so";
for (const t of ["=", "=(", "=)", "=1+", "=\"", "=SUM(", "=A1:", "=😀", "😀", "=" + "(".repeat(300), "=" + "1+".repeat(800) + "1", " ", "=-", "=--1", "=A0"]) await edit("A10", t);
await edit("A10", "=" + "(".repeat(30) + "2" + ")".repeat(30));
if (val("A10") !== "2") return `nesting: ${val("A10")}`;
// The bar edits too, by name and Enter.
const bar = $("#formula-grid-demo-bar");
k("Home", { ctrlKey: true }); await wait(60);
bar.focus(); type(bar, "Things"); await wait(60);
bar.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await wait(120);
if (val("A1") !== "Things" || at() !== "A2") return `the bar: ${val("A1")} ${at()}`;
if (JSON.parse(document.querySelector("input[name=sheet]").value).A1 !== "Things") return "the hidden field";
// Clicking picks; double click edits; on_change.
const l = "formula-grid-demo-live";
cell("A1", l).click(); await wait(60);
cell("A1", l).dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); await wait(100);
const box = cell("A1", l).querySelector("input");
box.value = "2.5"; box.dispatchEvent(new Event("input", { bubbles: true }));
box.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })); await wait(120);
const note = cell("A1", l).closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "on_change: A1 changed, A3 is 7.5.") return `on_change: ${note}`;
