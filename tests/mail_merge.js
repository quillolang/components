const tpl = $("#mail-merge-demo-template"), data = $("#mail-merge-demo-data"), c = tpl.closest(".ui-mail-merge");
const said = () => $("#mail-merge-demo-said").textContent;
const text = () => $("#mail-merge-demo-text")?.textContent;
const where = () => $("#mail-merge-demo-where")?.textContent;
const list = (n) => [...c.querySelectorAll(`#mail-merge-demo-${n} li`)].map((l) => l.textContent.trim());
const errors = () => [...c.querySelectorAll("#mail-merge-demo-errors li")].map((l) => l.textContent);
const notes = () => [...c.querySelectorAll(".ui-mail-merge-note")].map((n) => n.textContent).join(" | ");
const btn = (t) => [...c.querySelectorAll(".ui-mail-merge-bar button")].find((b) => b.textContent === t);
const set2 = async (t, d) => { type(tpl, t); type(data, d); await wait(); };
if (tpl.name !== "template" || data.name !== "data" || tpl.labels[0]?.textContent !== "Template" || data.labels[0]?.textContent !== "Rows") return "the fields' names or labels";
// The demo: three rows; the second has no name, and the fallback fills it; the third has no date.
if (said() !== "3 messages, 1 with an empty value.") return said();
if (where() !== "Row 1 of 3: Ana Reyes") return where();
if (text() !== "Hi Ana Reyes,\n\nYour order 1041 ships on 3 March. Thanks for shopping at our store!") return `row 1: ${text()}`;
// No column for shop, whose fallback goes to everyone; nothing uses email.
if (list("missing").join() !== "shop: the fallback goes to everyone") return `missing: ${list("missing")}`;
if (list("unused").join() !== "email") return `unused: ${list("unused")}`;
if (list("empty").join() !== "Lee, Sam: date") return `empty rows: ${list("empty")}`;
// Next and Previous, and their edges.
if (!btn("Previous").disabled) return "Previous at the start";
btn("Next").click(); await wait();
if (text() !== "Hi there,\n\nYour order 1042 ships on 4 March. Thanks for shopping at our store!" || where() !== "Row 2 of 3: Row 2") return `row 2: ${where()} ${text()}`;
if (c.querySelectorAll(".ui-mail-merge-fallback").length !== 2) return "fallbacks are not marked";
// The arrow keys, on the preview.
const pv = $("#mail-merge-demo-preview");
pv.focus(); key(pv, "ArrowRight"); await wait();
if (where() !== "Row 3 of 3: Lee, Sam" || !btn("Next").disabled) return `arrow: ${where()}`;
// A quoted cell with a comma, and an empty value shown for what it is.
if (text() !== "Hi Lee, Sam,\n\nYour order 1043 ships on [date is empty]. Thanks for shopping at our store!") return text();
key(pv, "ArrowRight"); await wait();
if (where() !== "Row 3 of 3: Lee, Sam") return "past the end";
key(pv, "Home"); await wait();
if (where() !== "Row 1 of 3: Ana Reyes") return "Home";
key(pv, "End"); await wait();
if (where() !== "Row 3 of 3: Lee, Sam") return "End";
// The link in the list goes to the row.
key(pv, "Home"); await wait();
c.querySelector("#mail-merge-demo-empty button").click(); await wait();
if (where() !== "Row 3 of 3: Lee, Sam") return `the link: ${where()}`;
// Spaces in a tag, {{name|}} as empty on purpose, a value of spaces as empty, and a variable twice.
await set2("{{ a }}-{{b|}}-{{c | none }}-{{a}}", "a,b,c,d\n1,2,3,4\n,   ,   ,x");
if (said() !== "2 messages, 1 with an empty value." || list("empty").join() !== "Row 2: a") return `tags: ${said()} ${list("empty")}`;
btn("Next").click(); await wait();
if (text() !== "[a is empty]--none-[a is empty]") return text();
// Case: a near miss is named.
await set2("{{Name}}", "name\nAna");
if (list("missing").join() !== "Name: did you mean name?" || list("unused").join() !== "name" || list("empty").join() !== "Ana: Name") return `case: ${list("missing")} / ${list("unused")}`;
// No column, no fallback: every row is empty.
await set2("{{nope}}", "name\nAna\nBen");
if (list("empty").length !== 2) return `no column: ${list("empty")}`;
// Template mistakes, with places.
await set2("Hi\n  {{name", "name\nAna");
if (errors().join() !== "A {{ is never closed, at line 2, column 3.") return `open: ${errors()}`;
if (c.querySelector(".ui-mail-merge-preview")) return "no preview of a broken template";
await set2("Hi name}} there", "name\nAna");
if (errors().join() !== "A }} has nothing to close, at line 1, column 8.") return `close: ${errors()}`;
await set2("{{}} and {{ | x }}", "name\nAna");
if (errors().join("|") !== "A variable has no name, at line 1, column 1.|A variable has no name, at line 1, column 10.") return `no name: ${errors()}`;
// Text with one brace is no mistake.
await set2("a { b } c {{name}}", "name\nAna");
if (errors().length || text() !== "a { b } c Ana") return `braces: ${errors()} ${text()}`;
// CSV: quotes, doubled quotes, line breaks, semicolons, tabs, CRLF, a BOM, blank lines.
await set2("{{a}}|{{b}}", "a,b\n\"x, y\",\"say \"\"hi\"\"\"");
if (text() !== "x, y|say \"hi\"") return `quotes: ${text()}`;
await set2("{{a}}|{{b}}", "a,b\n\"two\nlines\",z");
if (text() !== "two\nlines|z") return `a line break in a cell: ${text()}`;
await set2("{{a}}|{{b}}", "a;b\n1,5;2");
if (text() !== "1,5|2") return `semicolons: ${text()}`;
await set2("{{a}}|{{b}}", "a\tb\n1\t2");
if (text() !== "1|2") return `tabs: ${text()}`;
await set2("{{a}}|{{b}}", "﻿a,b\r\n\r\n1,2\r\n\r\n");
if (said() !== "1 message ready." || text() !== "1|2") return `CRLF and a BOM: ${said()} ${text()}`;
// CSV mistakes.
await set2("{{a}}", "a,b\n1,2,3");
if (errors().join() !== "Row 1 has 3 cells, not 2.") return `cells: ${errors()}`;
await set2("{{a}}", "a,a\n1,2");
if (errors().join() !== "The heading a comes twice: only the first is used." || text() !== "1") return `twice: ${errors()}`;
await set2("{{a}}", "a,\n1,2");
if (errors().join() !== "A column has no heading, so nothing can use it.") return `no heading: ${errors()}`;
await set2("{{a}}", "a\n\"open");
if (errors().join() !== "A quote is never closed, at line 2, column 1.") return `open quote: ${errors()}`;
// JSON, with numbers, null, nested values and a key that is JavaScript's own.
await set2("{{name}} {{n}} {{ok}} {{x}} {{constructor}}", '[{"name":"Ana","n":5,"ok":true,"x":{"a":1},"constructor":"c"},{"name":null,"n":1.5}]');
key($("#mail-merge-demo-preview"), "Home"); await wait();
if (text() !== 'Ana 5 true {"a":1} c') return `JSON: ${text()}`;
if (list("empty").join("|") !== "Row 2: name, ok, x, constructor") return `JSON empties: ${list("empty")}`;
await set2("{{name}}", '{"name":"One"}');
if (text() !== "One") return `one record: ${text()}`;
await set2("{{a}}", "[1, 2");
if (errors().join() !== "The data looks like JSON, but it does not parse.") return `bad JSON: ${errors()}`;
await set2("{{a}}", "[1, 2]");
if (errors().join() !== "Item 1 of the JSON is not a record.") return `not records: ${errors()}`;
// Text in cells is text.
await set2("{{a}}", "a\n<b>x</b> {{b}}");
if (c.querySelector("#mail-merge-demo-text b") || text() !== "<b>x</b> {{b}}") return `markup in a cell: ${text()}`;
// Moving back to fewer rows keeps a place that exists.
await set2("{{a}}", "a\n1\n2\n3");
key($("#mail-merge-demo-preview"), "End"); await wait();
await set2("{{a}}", "a\n1");
if (where() !== "Row 1 of 1: 1") return `fewer rows: ${where()}`;
// Bad input.
await set2("", "");
if (said() !== "Write a template and paste some rows to preview them.") return said();
await set2("Hello", "   ");
if (said() !== "Paste some rows to preview them.") return said();
await set2("  ", "a\n1");
if (said() !== "Write a template to preview the rows.") return said();
await set2("{{a}}", "a");
if (said() !== "Paste some rows to preview them.") return `a header alone: ${said()}`;
// Many rows stay quick, and past the limit it says so.
const big = "a,b\n" + Array.from({ length: 3000 }, (_, i) => `name${i},${i}`).join("\n"), t0 = performance.now();
await set2("{{a}} {{b}}", big);
if (performance.now() - t0 - 250 > 1200) return `3,000 rows took ${performance.now() - t0} ms`;
if (!notes().includes("Only the first 2,000 rows are used.") || said() !== "2000 messages ready.") return `the limit: ${notes()} ${said()}`;
// Text made to be slow: one huge cell, rows without end, a template of tens of thousands of tags.
for (const [t, d, what] of [["{{a}}", "a\n" + "x".repeat(200000), "a huge cell"], ["{{a}}", "a\n" + "1\n".repeat(100000), "many rows"], ["{{a} ".repeat(4000) + "{{a}}".repeat(20000), "a\n1\n2\n3", "a long template"],
                            ["{{a}}".repeat(20000), Array.from({ length: 2000 }, (_, i) => `${i}`).join("\n"), "tags by rows"], ["}}".repeat(50000), "a\n1", "stray braces"]]) {
    const t1 = performance.now();
    await set2(t, d);
    if (performance.now() - t1 - 250 > 1500) return `${what} took ${performance.now() - t1} ms`;
}
await set2("", "");
if (c.querySelector("#mail-merge-demo-send")) return "no Send without on_send";
// on_send: with rows from a prop, and those with an empty value left out until asked for.
const live = $("#mail-merge-demo-live-send"), lc = live.closest(".ui-mail-merge"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#mail-merge-demo-live-template").name !== "body" || $("#mail-merge-demo-live-data").name !== "people") return "name props";
if (live.textContent !== "Send 2 messages") return live.textContent;
live.click(); await wait();
if (note() !== "on_send: 2 messages, the last to row 3: Dear Sam, welcome.") return note();
if (!$("#mail-merge-demo-live-said").textContent.includes("Handed over 2 messages.")) return "not announced";
$("#mail-merge-demo-live-with-empty").click(); await wait();
if (live.textContent !== "Send 3 messages") return live.textContent;
type($("#mail-merge-demo-live-template"), "Dear {{name"); await wait();
if (!live.disabled) return "Send with a broken template";
