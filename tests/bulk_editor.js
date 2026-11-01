const c = $("#bulk-editor-demo-title").closest(".ui-bulked");
const q = (s) => c.querySelector(s);
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
const cell = (row, key) => q(`tr[data-row="${row}"] td[data-key=${key}]`).textContent;
const tick = (row) => q(`tr[data-row="${row}"] input`);
const preview = () => [...c.querySelectorAll("tr[data-change]")].map((r) => [...r.children].map((t) => t.textContent).join(">"));
const sums = () => [...c.querySelectorAll(".ui-bulked-sum")].map((s) => s.textContent.trim());
const go = q(".ui-bulked-go");
const btn = (t) => [...c.querySelectorAll("button")].find((b) => b.textContent.trim() === t || b.textContent.trim().startsWith(t));
const rows = () => JSON.parse(q("input[name=products]").value);
if (sums()[0] !== "0 of 6 rows selected" || !go.disabled) return `start: ${sums()}`;
if ([...$("#bulk-editor-demo-col").options].map((o) => o.value).join() !== "name,price,stock,status") return "sku is not editable";
// Check two, raise the price 10%: 0.10 to 0.11, 0.07 to 0.077, half up to 0.08.
tick(1).click(); tick(2).click(); await wait(80);
if (sums()[0] !== "2 of 6 rows selected" || !tick(1).closest("tr").classList.contains("ui-bulked-on")) return `ticks: ${sums()}`;
const head = $("#bulk-editor-demo-all");
if (!head.indeterminate || head.checked) return "the header shows some";
await pick($("#bulk-editor-demo-col"), "price");
await pick($("#bulk-editor-demo-kind"), "adjust");
await pick($("#bulk-editor-demo-how"), "pct");
if (q("[role=alert]")?.textContent !== "Write the amount.") return `no amount: ${q("[role=alert]")?.textContent}`;
type($("#bulk-editor-demo-arg"), "abc"); await wait(80);
if (q("[role=alert]")?.textContent !== '"abc" is not a number.' || !go.disabled) return `bad amount: ${q("[role=alert]")?.textContent}`;
type($("#bulk-editor-demo-arg"), "10"); await wait(80);
if (preview().join(" ") !== "A-1>0.10>0.11 A-2>0.07>0.08") return `percent: ${preview()}`;
if (go.textContent !== "Apply to 2 rows") return go.textContent;
// A long amount: 0.10 has one whole digit, so the product fits a decimal.
type($("#bulk-editor-demo-arg"), "99999999999999999999"); await wait(80);
if (q(".ui-bulked-note")) return `a small value times a large one fits: ${q(".ui-bulked-note").textContent}`;
type($("#bulk-editor-demo-arg"), "10"); await wait(80);
// Nothing has changed yet.
if (cell(1, "price") !== "0.10") return "the preview changed the row";
go.click(); await wait(100);
if (cell(1, "price") !== "0.11" || cell(2, "price") !== "0.08" || q(".ui-bulked-said").textContent !== "Changed 2 rows.") return `applied: ${cell(1, "price")} ${q(".ui-bulked-said").textContent}`;
// Undo and redo, by button and by key.
btn("Undo").click(); await wait(100);
if (cell(1, "price") !== "0.10" || cell(2, "price") !== "0.07") return `undo: ${cell(1, "price")}`;
if (!btn("Undo").disabled || btn("Redo").disabled) return "undo's buttons";
btn("Redo").click(); await wait(100);
if (cell(1, "price") !== "0.11") return `redo: ${cell(1, "price")}`;
q(".ui-bulked-go").focus();
go.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, cancelable: true })); await wait(100);
if (cell(1, "price") !== "0.10") return `Ctrl+Z: ${cell(1, "price")}`;
go.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, shiftKey: true, bubbles: true, cancelable: true })); await wait(100);
if (cell(1, "price") !== "0.11") return `Ctrl+Shift+Z: ${cell(1, "price")}`;
btn("Undo").click(); await wait(100);
// A new change empties redo.
await pick($("#bulk-editor-demo-how"), "add");
type($("#bulk-editor-demo-arg"), "0.01"); await wait(80);
go.click(); await wait(100);
if (cell(1, "price") !== "0.11" || !btn("Redo").disabled) return `add: ${cell(1, "price")}`;
btn("Undo").click(); await wait(100);
btn("Clear selection").click(); await wait(80);
// Filter: text, a column, a comparison; select the matches, even if some are ticked already.
type($("#bulk-editor-demo-look"), "brass"); await wait(80);
if (sums()[0] !== "0 of 6 rows selected, 2 match the filter") return sums()[0];
if (c.querySelectorAll("tr[data-row]").length !== 2) return "the filter narrows the table";
btn("Select 2 matching").click(); await wait(80);
if (sums()[0] !== "2 of 6 rows selected, 2 match the filter") return sums()[0];
if (!head.checked || head.indeterminate) return "the header shows all";
btn("Clear selection").click(); await wait(80);
type($("#bulk-editor-demo-look"), ">100"); await wait(80);
if ([...c.querySelectorAll("tr[data-row]")].map((r) => r.dataset.row).join() !== "1,2") return `over 100: ${[...c.querySelectorAll("tr[data-row]")].map((r) => r.dataset.row)}`;
await pick($("#bulk-editor-demo-look-in"), "price");
if (c.querySelectorAll("tr[data-row]").length !== 0) return "no price is over 100";
await pick($("#bulk-editor-demo-look-in"), "");
// Bad comparison is text, and a regular expression in the filter is text.
type($("#bulk-editor-demo-look"), "(["); await wait(80);
if (c.querySelectorAll("tr[data-row]").length !== 0) return "a filter of brackets";
type($("#bulk-editor-demo-look"), ""); await wait(80);
// Adjust skips what is no number and says so, and blank.
head.click(); await wait(80);
if (sums()[0] !== "6 of 6 rows selected") return sums()[0];
await pick($("#bulk-editor-demo-how"), "mul");
type($("#bulk-editor-demo-arg"), "2"); await wait(80);
// 0.20, 0.14, 4.70, "2.40", 39.98.
if (preview().join(" ") !== "A-1>0.10>0.20 A-2>0.07>0.14 B-1>2.35>4.70 B-2>1.20>2.40 C-1>19.99>39.98") return `multiply: ${preview()}`;
if (q(".ui-bulked-note").textContent !== 'Skipped: C-2 "ask" is not a number.') return q(".ui-bulked-note").textContent;
if (!sums().includes("5 rows would change, 1 skipped")) return sums().join("|");
await pick($("#bulk-editor-demo-col"), "stock");
if (q(".ui-bulked-note").textContent !== "Skipped: B-2 is empty.") return q(".ui-bulked-note").textContent;
// 120, 340, 12, 3 and 0: 0 x 2 stays as it is.
if (!sums().includes("4 rows would change, 1 stay as they are, 1 skipped")) return sums().join("|");
go.click(); await wait(100);
if (rows()[0].stock !== 240 || typeof rows()[0].stock !== "number") return `an int stays an int: ${JSON.stringify(rows()[0])}`;
btn("Undo").click(); await wait(100);
// Text stays text, decimals stay decimals (JSON writes them as text).
await pick($("#bulk-editor-demo-col"), "name");
await pick($("#bulk-editor-demo-kind"), "replace");
if (q("[role=alert]")?.textContent !== "Write the text to find.") return `no find: ${q("[role=alert]")?.textContent}`;
type($("#bulk-editor-demo-find"), "steel"); await wait(60); type($("#bulk-editor-demo-with"), "Iron $1 $&"); await wait(80);
if (preview().join(" ") !== "A-1>Steel bolt>Iron $1 $& bolt A-2>STEEL nut>Iron $1 $& nut") return `replace: ${preview()}`;
$("#bulk-editor-demo-case").click(); await wait(80);
if (preview().join(" ") !== "") return `match case finds nothing: ${preview()}`;
$("#bulk-editor-demo-case").click(); await wait(80);
type($("#bulk-editor-demo-find"), ".*"); await wait(80);
if (preview().length) return "find takes text, not a pattern";
// Prefix, suffix, set; a number column holds to numbers.
await pick($("#bulk-editor-demo-kind"), "prefix");
type($("#bulk-editor-demo-arg"), "New "); await wait(80);
if (preview()[0] !== "A-1>Steel bolt>New Steel bolt") return `prefix: ${preview()[0]}`;
await pick($("#bulk-editor-demo-kind"), "suffix");
type($("#bulk-editor-demo-arg"), " (old)"); await wait(80);
if (preview()[4] !== "C-1>Saw>Saw (old)") return `suffix: ${preview()[4]}`;
await pick($("#bulk-editor-demo-col"), "price");
await pick($("#bulk-editor-demo-kind"), "set");
type($("#bulk-editor-demo-arg"), "free"); await wait(80);
if (!q(".ui-bulked-note").textContent.startsWith('Skipped: A-1 "free" is not a number; ')) return q(".ui-bulked-note").textContent;
type($("#bulk-editor-demo-arg"), "1.50"); await wait(80);
if (preview()[0] !== "A-1>0.10>1.50") return `set a number: ${preview()[0]}`;
go.click(); await wait(100);
if (rows()[3].price !== "1.50" || rows()[5].price !== "1.50") return `set: ${JSON.stringify(rows()[3])}`;
// Setting what is already there changes nothing.
if (go.textContent !== "Apply to 0 rows" || !go.disabled) return go.textContent;
// No rows: says so.
const none = $("#bulk-editor-demo-empty-title").closest(".ui-bulked");
if (none.querySelector(".ui-bulked-empty")?.textContent !== "No rows to edit." || none.querySelector(".ui-bulked-note")?.textContent !== "1 item is not a record, and left out.") return "no rows";
// on_apply, and undo gives the changes back.
const l = $("#bulk-editor-demo-live-title").closest(".ui-bulked");
l.querySelector("tr[data-row=x] input").click(); await wait(80);
const arg = l.querySelector("input[id$=-arg]");
type(arg, "9"); await wait(80);
l.querySelector(".ui-bulked-go").click(); await wait(100);
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note() !== "on_apply: 1 change, x from 4 to 9.") return `on_apply: ${note()}`;
[...l.querySelectorAll("button")].find((b) => b.textContent === "Undo").click(); await wait(100);
if (note() !== "on_apply: 1 change, x from 9 to 4.") return `on_apply on undo: ${note()}`;
