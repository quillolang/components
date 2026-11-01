const c = $("#csv-importer-demo-text").closest(".ui-csv-imp");
const box = $("#csv-importer-demo-text");
const found = () => c.querySelector(".ui-csv-imp-found")?.textContent;
const sum = () => c.querySelector(".ui-csv-imp-sum")?.textContent;
const bad = () => [...c.querySelectorAll(".ui-csv-imp-bad li")].map((l) => l.textContent);
const col = (k) => $(`#csv-importer-demo-map-${k}`);
const pick = (k) => col(k).selectedOptions[0].textContent;
if (found() !== "Semicolon-separated, double quotes, a header row: 7 columns, 4 rows.") return `detect: ${found()}`;
// The name by its alias, E-mail by a near match, the rest by name.
if (pick("name") !== "Full Name" || pick("email") !== "E-mail" || pick("balance") !== "Balance" || pick("active") !== "Active") return `mapping: ${pick("name")} ${pick("email")} ${pick("balance")}`;
if (sum() !== "2 good rows2 bad rows") return `count: ${sum()}`;
const b = bad();
if (b[0] !== 'Line 3: Email "grace@example" is not an email address; Joined "2026-02-30" is not a date (DD/MM/YYYY); Plan "team" is not one of free, pro; Balance "12.345" has more than two decimals; Seats "x" is not a whole number; Active "maybe" is not yes or no') return `line 3: ${b[0]}`;
if (b.length !== 2 || b[1] !== "Line 5: Name is required") return `line 5: ${b[1]}`;
const cells = () => [...c.querySelectorAll(".ui-csv-imp-scroll table")].at(-1).querySelectorAll("tbody tr");
const first = [...cells()[0].children].map((t) => t.textContent);
if (first.join("|") !== "Lovelace; Ada|ada@example.com|2026-03-14|pro|1234.50|3|yes") return `typed row: ${first.join("|")}`;
if (box.name !== "people" || !box.labels[0]?.textContent.includes("CSV text")) return "the box's name and label";
const rows = JSON.parse(c.querySelector("input[name=people_rows]").value);
if (rows.length !== 2 || rows[1].joined !== "2026-06-23" || rows[1].balance !== "0.10" || rows[1].active !== false) return `hidden rows: ${JSON.stringify(rows)}`;
if (rows[0].balance !== "1234.50" || rows[0].seats !== 3 || rows[0].active !== true) return `hidden row: ${JSON.stringify(rows[0])}`;
// Tabs, a CRLF file, a single-quoted field holding the delimiter's cousin, no header.
type(box, "Ada\tada@example.com\tpro\r\nBob\tbob@example.com\tfree\r\n"); await wait();
if (found() !== "Tab-separated, no quotes, no header row: 3 columns, 2 rows.") return `tabs: ${found()}`;
if (col("email").value !== "" || !c.querySelector("[role=alert]")?.textContent.includes("Pick a column for Name, Email")) return "no header: required fields unmapped must say so";
if (!c.querySelector(".ui-csv-imp-go").disabled) return "Import is open with required fields unmapped";
col("name").value = "0"; col("name").dispatchEvent(new Event("change", { bubbles: true })); await wait();
col("email").value = "1"; col("email").dispatchEvent(new Event("change", { bubbles: true })); await wait();
col("plan").value = "2"; col("plan").dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (sum() !== "2 good rows0 bad rows") return `after mapping by hand: ${sum()}`;
if (c.querySelector(".ui-csv-imp-go").disabled) return "Import stays shut after mapping";
// Single quotes around a comma, pipes.
type(box, "'name'|'email'\n'Smith, J'|'j@example.com'\n'O''Brien'|'o@example.com'\n"); await wait();
if (found() !== "Pipe-separated, single quotes, a header row: 2 columns, 2 rows.") return `single quotes: ${found()}`;
if ([...cells()[1].children][0].textContent !== "O'Brien") return `a doubled quote: ${[...cells()[1].children][0].textContent}`;
// Quotes keep commas and line breaks; a row with too many cells is called out; lines are counted right.
type(box, 'name,email,note\n"A, B",a@example.com,"two\nlines"\nC,c@example.com,x,y\n'); await wait();
if (found() !== "Comma-separated, double quotes, a header row: 3 columns, 2 rows.") return `quoted break: ${found()}`;
if (bad()[0] !== "Line 4: has 4 values where there are 3 columns") return `extra cell: ${bad()[0]}`;
// A quote never closed says where.
type(box, 'name,email\n"Ada,ada@example.com\nBob,bob@example.com\n'); await wait();
if (c.querySelector(".ui-csv-imp-error")?.textContent !== "The quote opened on line 2 is never closed, so all that follows is one field.") return `open quote: ${c.querySelector(".ui-csv-imp-error")?.textContent}`;
// Changing the delimiter by hand wins over detection.
type(box, "a;b\n1;2\n"); await wait();
const sep = $("#csv-importer-demo-sep");
sep.value = "comma"; sep.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (!found().startsWith("Comma-separated")) return `picked delimiter: ${found()}`;
sep.value = "auto"; sep.dispatchEvent(new Event("change", { bubbles: true })); await wait();
// Bad input: empty, spaces, binary-looking text, unicode headers, a huge paste.
for (const t of ["", "   \n  \n", "\u0000\u0001,\u0002", ",,,\n,,,", "\"", "﻿name,email\nÅsa,å@example.com\n", "x"]) {
    type(box, t); await wait(60);
    if (window.__quilloErrors?.length) return `threw on ${JSON.stringify(t)}`;
}
type(box, "﻿name,email\nÅsa,asa@example.com\n"); await wait();
if (pick("name") !== "name" || sum() !== "1 good row0 bad rows") return `a byte-order mark: ${pick("name")} ${sum()}`;
type(box, ""); await wait();
if (found() || c.querySelector(".ui-csv-imp-sum") || !c.querySelector(".ui-csv-imp-go").disabled) return "empty text shows no results and no Import";
const big = "name,email\n" + "Ada,ada@example.com\n".repeat(6000);
const t0 = performance.now();
type(box, big); await wait(300);
const took = performance.now() - t0;
if (took > 2500) return `a long paste took ${took} ms`;
if (![...c.querySelectorAll(".ui-csv-imp-note")].some((n) => n.textContent === "Only the first 5,000 rows are read.")) return "the row cap is not said";
if (sum() !== "5000 good rows0 bad rows") return `capped count: ${sum()}`;
// Dropping a file reads it.
const data = new DataTransfer();
data.items.add(new File(["name,email\nDrop,drop@example.com\n"], "people.csv", { type: "text/csv" }));
box.closest(".ui-csv-imp-drop").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data })); await wait();
if (box.value !== "name,email\nDrop,drop@example.com\n" || c.querySelector(".ui-csv-imp-said").textContent !== "Read people.csv.") return `dropping a file: ${box.value.slice(0, 40)} / ${c.querySelector(".ui-csv-imp-said").textContent}`;
// on_import gets only the good rows, typed.
const live = $("#csv-importer-demo-live-text").closest(".ui-csv-imp");
const go = live.querySelector(".ui-csv-imp-go");
if (go.textContent !== "Import 2 rows") return go.textContent;
go.click(); await wait();
const note = live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "on_import: 2 rows, the first Ada <ada@example.com>.") return `on_import: ${note}`;
if (live.querySelector(".ui-csv-imp-said").textContent !== "Imported 2 rows, left out 1 bad.") return live.querySelector(".ui-csv-imp-said").textContent;
