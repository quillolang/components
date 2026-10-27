const [stock, budget] = $$(".ui-et");
const grid = stock.querySelector("[role=grid]");
const cell = (r, c) => grid.querySelector(`[data-cell="${r}-${c}"]`);
const val = (r, c) => cell(r, c).textContent.replace(", changed", "").trim();
const posted = () => JSON.parse(stock.querySelector("input[type=hidden][name=stock]").value);
const live = () => stock.querySelector("[aria-live]").textContent;
const input = () => grid.querySelector(".ui-et-input");
// The headless page has no system focus, so focus events are sent by hand.
const foc = (el) => { el.focus(); el.dispatchEvent(new FocusEvent("focus")); };
const press = (el, k, o = {}) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
if (grid.getAttribute("aria-rowcount") !== "5" || grid.getAttribute("aria-colcount") !== "7") return `rowcount/colcount: ${grid.getAttribute("aria-rowcount")}/${grid.getAttribute("aria-colcount")}`;
if (grid.querySelectorAll('td[tabindex="0"]').length !== 1 || cell(0, 0).tabIndex !== 0) return "not one Tab stop on the first cell";
if (cell(0, 0).getAttribute("role") !== "gridcell" || cell(0, 2).getAttribute("aria-colindex") !== "3") return "gridcell / aria-colindex";
if (!cell(0, 2).classList.contains("ui-et-right") || val(0, 2) !== "14") return "a number cell is not on the right";
if (cell(0, 4).querySelector("[role=checkbox]").getAttribute("aria-checked") !== "true") return "a checkbox cell";
if (val(1, 3) !== "—") return `an empty select shows ${val(1, 3)}`;
// arrows
foc(cell(2, 3)); await wait(80);
if (cell(2, 3).tabIndex !== 0) return "focusing a cell does not make it the Tab stop";
foc(cell(0, 0)); await wait(80);
press(cell(0, 0), "ArrowRight"); await wait(80);
if (document.activeElement !== cell(0, 1) || cell(0, 0).tabIndex !== -1) return "ArrowRight does not move the Tab stop";
press(cell(0, 1), "ArrowDown"); await wait(80);
if (document.activeElement !== cell(1, 1)) return "ArrowDown";
press(cell(1, 1), "End"); await wait(80);
if (document.activeElement !== cell(1, 6)) return "End goes to the delete cell";
press(cell(1, 6), "Home", { ctrlKey: true }); await wait(80);
if (document.activeElement !== cell(0, 0)) return "Ctrl+Home";
// Enter edits, Escape cancels
press(cell(0, 0), "ArrowRight"); await wait(80);
press(cell(0, 1), "Enter"); await wait(80);
if (!input() || document.activeElement !== input() || input().value !== "Mechanical keyboard") return "Enter does not open an editor with the value";
type(input(), "Gaming keyboard"); press(input(), "Escape"); await wait(80);
if (input() || val(0, 1) !== "Mechanical keyboard" || document.activeElement !== cell(0, 1)) return "Escape does not put it back";
// F2, Enter keeps and moves down
press(cell(0, 1), "F2"); await wait(80);
type(input(), "Gaming keyboard"); press(input(), "Enter"); await wait(80);
if (val(0, 1) !== "Gaming keyboard" || document.activeElement !== cell(1, 1)) return `Enter keeps and goes down: ${val(0, 1)}, focus ${document.activeElement.dataset.cell}`;
if (!cell(0, 1).classList.contains("ui-et-dirty") || !cell(0, 1).textContent.includes(", changed")) return "a changed cell is not marked";
if (posted()[0].name !== "Gaming keyboard") return "the form value";
if (!stock.querySelector(".ui-et-status").textContent.includes("1 changed")) return "the footer does not count the change";
// typing starts an edit; number validation
press(cell(1, 1), "ArrowRight"); await wait(80);
press(cell(1, 2), "x"); await wait(80);
if (!input() || input().value !== "x") return "typing a letter does not start an edit with it";
press(input(), "Enter"); await wait(80);
if (!input() || input().getAttribute("aria-invalid") !== "true") return "an invalid number is kept, or not marked";
const err = document.getElementById(input().getAttribute("aria-describedby"));
if (!err || err.textContent !== "Not a number") return `the error: ${err?.textContent}`;
if (!live().includes("Not a number")) return "the error is not announced";
type(input(), "-3"); await wait(80); press(input(), "Enter"); await wait(80);
if (!input() || !grid.querySelector(".ui-et-err").textContent.includes("At least 0")) return "min is not checked";
type(input(), "25"); await wait(80); press(input(), "Tab"); await wait(80);
if (val(1, 2) !== "25" || posted()[1].qty !== 25) return `Tab keeps a number: ${val(1, 2)} / ${JSON.stringify(posted()[1].qty)}`;
if (document.activeElement !== cell(1, 3)) return "Tab does not move across";
// Shift+Tab while editing moves back
press(cell(1, 3), "ArrowLeft"); await wait(80);
press(cell(1, 2), "Enter"); await wait(80);
type(input(), "30"); press(input(), "Tab", { shiftKey: true }); await wait(80);
if (val(1, 2) !== "30" || document.activeElement !== cell(1, 1)) return "Shift+Tab";
// select
press(cell(1, 1), "ArrowRight"); press(cell(1, 2), "ArrowRight"); await wait(80);
press(cell(1, 3), "Enter"); await wait(80);
const sel = grid.querySelector("select");
if (!sel || document.activeElement !== sel) return "a select cell does not edit with a select";
sel.value = "Compact"; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
if (val(1, 3) !== "Compact" || posted()[1].size !== "Compact") return "picking an option";
// checkbox: Space flips
press(cell(1, 3), "ArrowRight"); await wait(80);
press(cell(1, 4), " "); await wait(80);
if (cell(1, 4).querySelector("[role=checkbox]").getAttribute("aria-checked") !== "false" || posted()[1].active !== false) return "Space does not flip a checkbox";
cell(2, 4).click(); await wait(80);
if (posted()[2].active !== false) return "a click does not flip a checkbox";
// date
cell(2, 5).click(); await wait(80);
if (!input() || input().type !== "date") return "a date cell does not edit with a date input";
type(input(), "2026-12-24"); press(input(), "Enter"); await wait(80);
if (posted()[2].restock !== "2026-12-24") return `the date: ${posted()[2].restock}`;
// required: Delete on a required cell refuses
press(cell(3, 5), "ArrowUp"); await wait(80);
foc(cell(0, 0)); await wait(80); press(cell(0, 0), "Delete"); await wait(80);
if (val(0, 0) !== "KB-01" || !live().includes("Required")) return "Delete emptied a required cell";
// click edits, clicking away keeps
cell(3, 1).click(); await wait(80);
if (!input()) return "a click does not edit";
type(input(), "Monitor arm");
cell(0, 2).click(); await wait(80);
if (val(3, 1) !== "Monitor arm") return "leaving a cell does not keep a good value";
if (input() && input().value !== "14") return "?";
press(input(), "Escape"); await wait(80);
// sort
const th = (t) => [...grid.querySelectorAll("th")].find((h) => h.textContent.trim().startsWith(t));
th("Qty").querySelector("button").click(); await wait(80);
if (th("Qty").getAttribute("aria-sort") !== "ascending") return "aria-sort";
const qtys = [0, 1, 2, 3].map((r) => val(r, 2));
if (qtys.join() !== "6,14,30,120") return `sorted by qty: ${qtys}`;
th("Qty").querySelector("button").click(); await wait(80);
if ([0, 1, 2, 3].map((r) => val(r, 2)).join() !== "120,30,14,6") return "sorted the other way";
th("Restock").querySelector("button").click(); await wait(80);
if (val(3, 5) !== "—" || val(0, 5) !== "2026-11-04") return `dates sorted, empty last: ${[0, 1, 2, 3].map((r) => val(r, 5))}`;
if (posted().map((r) => r.sku).join() !== "KB-01,MS-02,CB-USB,ST-09") return "sorting changes the order posted";
// add and delete
const add = stock.querySelector(".ui-et-add");
add.click(); await wait(120);
if (grid.querySelectorAll("tbody tr").length !== 5 || !grid.querySelector("tbody tr:last-child").classList.contains("ui-et-new")) return "Add row";
if (document.activeElement !== cell(4, 0)) return "the new row's first cell is not focused";
press(cell(4, 0), "N"); await wait(80); type(input(), "NEW-1"); press(input(), "Enter"); await wait(80);
if (posted()[4].sku !== "NEW-1" || posted().length !== 5) return `the new row posted: ${JSON.stringify(posted()[4])}`;
if (!stock.querySelector(".ui-et-status").textContent.includes("1 new")) return "the footer does not count new rows";
grid.querySelector('button[aria-label="Delete row 5"]').click(); await wait(120);
if (posted().length !== 4 || grid.querySelectorAll("tbody tr").length !== 4) return "Delete row";
foc(cell(0, 6)); await wait(80); press(cell(0, 6), "Enter"); await wait(120);
if (posted().length !== 3) return "Enter on the delete cell does not delete";
// on_cell / on_change in a component; readonly
const bg = budget.querySelector("[role=grid]");
const bcell = (r, c) => bg.querySelector(`[data-cell="${r}-${c}"]`);
bcell(1, 2).click(); await wait(80);
const bi = bg.querySelector(".ui-et-input"); type(bi, "150"); press(bi, "Enter"); await wait(80);
const note = budget.closest(".demo-stack").querySelector(".demo-note").textContent;
if (!note.includes("row 2: amount = 150") || !note.includes("Total: 7350")) return `on_cell / on_change: ${note}`;
bcell(0, 4).click(); await wait(80);
if (bg.querySelector(".ui-et-input") || bcell(0, 4).getAttribute("aria-readonly") !== "true") return "a readonly cell can be edited";
press(bcell(0, 4), "a"); await wait(80);
if (bg.querySelector(".ui-et-input")) return "typing edits a readonly cell";
