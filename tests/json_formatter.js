const box = $("#json-formatter-demo-input");
const c = box.closest(".ui-json-fmt");
const out = () => c.querySelector(".ui-json-fmt-output")?.textContent;
const where = () => c.querySelector(".ui-json-fmt-where")?.textContent;
const why = () => c.querySelector(".ui-json-fmt-why")?.textContent;
const excerpt = () => c.querySelector(".ui-json-fmt-excerpt")?.textContent;
const set = async (t) => { type(box, t); await wait(60); };
const btn = (m) => c.querySelector(`[data-mode=${m}]`);
const sort = c.querySelector("input[type=checkbox]");
if (box.name !== "json" || !box.labels[0]) return "the field";
const start = box.value;
// Every number and string stays as written.
const want = `{\n  "price": 1.10,\n  "id": 12345678901234567890,\n  "big": 1e400,\n  "name": "caf\\u00e9",\n  "items": [],\n  "meta": {\n    "z": -0,\n    "a": true\n  }\n}`;
if (out() !== want) return `format: ${out()}`;
btn("minify").click(); await wait(60);
if (out() !== `{"price":1.10,"id":12345678901234567890,"big":1e400,"name":"caf\\u00e9","items":[],"meta":{"z":-0,"a":true}}`) return `minify: ${out()}`;
if (btn("minify").getAttribute("aria-pressed") !== "true" || btn("format").getAttribute("aria-pressed") !== "false") return "pressed";
sort.click(); await wait(60);
if (out() !== `{"big":1e400,"id":12345678901234567890,"items":[],"meta":{"a":true,"z":-0},"name":"caf\\u00e9","price":1.10}`) return `sorted: ${out()}`;
btn("format").click(); await wait(60);
const indent = c.querySelector("select");
indent.value = "4"; indent.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
if (!out().startsWith(`{\n    "big": 1e400,`) || !out().includes(`\n        "a": true`)) return `4 spaces: ${out()}`;
indent.value = "tab"; indent.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
if (!out().startsWith(`{\n\t"big": 1e400,`)) return `tabs: ${out()}`;
indent.value = "2"; indent.dispatchEvent(new Event("change", { bubbles: true }));
sort.click(); await wait(60);
// Sorting by what a key says: "a b" before "a" would be sorting by the closing quote.
await set(`{"a": 1, "a b": 2, "\\u0041": 3, "B": 4}`);
sort.click(); await wait(60);
if (out() !== `{\n  "\\u0041": 3,\n  "B": 4,\n  "a": 1,\n  "a b": 2\n}`) return `key order: ${out()}`;
sort.click(); await wait(60);
// Scalars and odd but valid text.
for (const [text, result] of [["1.0", "1.0"], ["-0.0e+10", "-0.0e+10"], [`"x"`, `"x"`], ["null", "null"], [" [ ] ", "[]"], ["{ }", "{}"], [`[[],{}]`, `[\n  [],\n  {}\n]`], [`"😀é"`, `"😀é"`], [`"\\ud83d\\ude00"`, `"\\ud83d\\ude00"`], [`"a\\"b"`, `"a\\"b"`]]) {
    await set(text);
    if (out() !== result) return `${text}: ${out()}`;
}
// Errors: line, column, why. Each column counted by hand, from 1.
for (const [text, at, message] of [
    [`{"a": 1,\n "b": 2,\n}`, "Line 2, column 8", "Trailing comma: nothing follows it before the }."],
    [`[1, 2,]`, "Line 1, column 6", "Trailing comma: nothing follows it before the ]."],
    [`{"a" 1}`, "Line 1, column 6", `Expected a colon after the key "a", found 1.`],
    [`{"a": 1 "b": 2}`, "Line 1, column 9", `Expected a comma or } after a value, found "b".`],
    [`[1 2]`, "Line 1, column 4", "Expected a comma or ] after a list item, found 2."],
    [`{a: 1}`, "Line 1, column 2", "The key a needs double quotes."],
    [`{'a': 1}`, "Line 1, column 2", "A key needs double quotes, not single quotes."],
    [`['a']`, "Line 1, column 2", "A string needs double quotes, not single quotes."],
    [`[1,\n  2,\n  "abc\n]`, "Line 3, column 3", `This string is never closed: its ending " is missing on this line.`],
    [`{"a": [1, 2`, "Line 1, column 12", "The text ends inside the list opened at character 7: a ] is missing."],
    [`{"a": 1`, "Line 1, column 8", "The text ends inside the object opened at character 1: a } is missing."],
    [`{"a":`, "Line 1, column 6", "The text ends where a value should be."],
    [`[01]`, "Line 1, column 2", "01 is not a number in JSON: it has a zero in front."],
    [`[+1]`, "Line 1, column 2", "+1 is not a number in JSON: a number has no plus sign."],
    [`[1.]`, "Line 1, column 2", "1. is not a number in JSON: it needs a digit after the point."],
    [`[.5]`, "Line 1, column 2", ".5 is not a number in JSON: it needs a digit before the point."],
    [`[1e]`, "Line 1, column 2", "1e is not a number in JSON: its exponent has no digits."],
    [`[0x10]`, "Line 1, column 2", "0x10 is not a number in JSON: there is no hex."],
    [`[True]`, "Line 1, column 2", "True is not JSON: did you mean true?"],
    [`[None]`, "Line 1, column 2", "None is not JSON: did you mean null?"],
    [`[NaN]`, "Line 1, column 2", "NaN is not JSON: there is no such number."],
    [`[hello]`, "Line 1, column 2", "hello is not a value: a string needs double quotes."],
    [`["a\\qb"]`, "Line 1, column 4", "\\q is not an escape JSON knows."],
    [`["a\\u12"]`, "Line 1, column 4", "\\u is not an escape JSON knows."],
    [`["a\tb"]`, "Line 1, column 4", "A string cannot hold a raw tab or control character: write it as \\t or \\u00XX."],
    [`1 2`, "Line 1, column 3", "Only one value is allowed, and more follows it: 2."],
    [`{} {}`, "Line 1, column 4", "Only one value is allowed, and more follows it: {."],
    [`// note\n{}`, "Line 1, column 1", "JSON has no comments."],
    [`[ 1]`, "Line 1, column 2", "A no-break space is here, which JSON does not count as space."],
    [`["“"," ”]`, "Line 1, column 6", "This string is never closed: its ending \" is missing on this line."],
    [`[“a”]`, "Line 1, column 2", `This is a curly quote: JSON needs a straight ".`],
    [`😀😀 x`, "Line 1, column 1", "😀 is not expected here."],
    [`["😀😀", x]`, "Line 1, column 8", "x is not a value: a string needs double quotes."],
    [`]`, "Line 1, column 1", "Expected a value, found ]."],
    [`[,]`, "Line 1, column 2", "A comma here has no value before it."]]) {
    await set(text);
    if (where() !== at || why() !== message) return `${JSON.stringify(text)}: ${where()}: ${why()}`;
    if (c.querySelector(".ui-json-fmt-output")) return "a result beside an error";
    if (box.getAttribute("aria-invalid") !== "true") return "not marked";
}
// The text around it, with a caret under the place.
await set(`{\n  "name": "x",\n  "bad" 1\n}`);
if (excerpt() !== `  "bad" 1\n        ^`) return `excerpt: ${JSON.stringify(excerpt())}`;
await set(`["${"a".repeat(100)}", x, "${"b".repeat(100)}"]`);
const lines = excerpt().split("\n");
if (!lines[0].startsWith("…") || !lines[0].endsWith("…") || lines[0].length !== 63 || lines[0][lines[1].length - 1] !== "x") return `a long line: ${JSON.stringify(excerpt())}`;
await set(`{"a":\t\tx}`);
if (where() !== "Line 1, column 8" || excerpt().split("\n")[0][excerpt().split("\n")[1].length - 1] !== "x") return `tabs: ${where()} ${JSON.stringify(excerpt())}`;
// Show in the text selects the place, past an emoji too.
await set(`["😀", x]`);
c.querySelector("[data-show]").click(); await wait(60);
if (document.activeElement !== box || box.value.slice(box.selectionStart, box.selectionEnd) !== "x") return `show: ${box.selectionStart} ${box.selectionEnd}`;
// Empty, and white space.
await set("");
if (c.querySelector("[role=alert]") || !c.textContent.includes("Paste or type JSON to start.")) return "empty";
await set(" \n\t ");
if (c.querySelector("[role=alert]") || !c.textContent.includes("Paste or type JSON to start.")) return "white space";
await set(`\u{FEFF}{"a":1}`);
if (out() !== `{\n  "a": 1\n}`) return `a byte order mark: ${out()}`;
// The repair: commas and quotes only, what is inside strings untouched.
await set(`{'a': 'it\\'s', "b,]": "x,}", 'c': ['say "hi"', 1,], "d": {"e": 1,},}`);
const fix = c.querySelector("[data-repair]");
if (fix?.textContent !== "Repair 3 trailing commas and 4 single-quoted strings") return `offer: ${fix?.textContent}`;
fix.click(); await wait(60);
if (box.value !== `{"a": "it's", "b,]": "x,}", "c": ["say \\"hi\\"", 1], "d": {"e": 1}}`) return `repaired: ${box.value}`;
if (where() || JSON.parse(out()).a !== "it's" || JSON.parse(out()).c[0] !== `say "hi"` || JSON.parse(out())["b,]"] !== "x,}") return `after: ${where()} ${out()}`;
// Many repairs, past the size where the pieces are gathered.
await set(`[${Array.from({ length: 2000 }, (_, i) => `'s${i}'`).join(",")},]`);
c.querySelector("[data-repair]").click(); await wait(120);
if (where() || JSON.parse(out()).length !== 2000 || JSON.parse(out())[1999] !== "s1999") return `many repairs: ${where()}`;
await set(`{"a": 1,}`);
if (c.querySelector("[data-repair]").textContent !== "Repair 1 trailing comma") return "one comma";
await set(`{"a" 1}`);
if (c.querySelector("[data-repair]")) return "no repair offered for what it cannot repair";
await set(`[1,] x`);
c.querySelector("[data-repair]").click(); await wait(60);
if (where() !== "Line 1, column 5" || box.value !== "[1] x") return `a repair leaves the rest: ${where()} ${box.value}`;
// Keys given twice are kept, and said.
await set(`{"a": 1, "a": 2, "b": {"c": 1, "c": 2}}`);
const warn = [...c.querySelectorAll(".ui-json-fmt-warn")].map((p) => p.textContent);
if (warn[0] !== `"a" is given twice in the top object.` || warn[1] !== `"c" is given twice in .b.` || !out().includes(`"a": 1,\n  "a": 2`)) return `duplicates: ${warn} ${out()}`;
// Depth is capped, with a message, never a crash.
await set("[".repeat(100000));
if (why() !== "This is nested deeper than 500 levels." || where() !== "Line 1, column 502") return `deep: ${where()} ${why()}`;
await set("[".repeat(400) + "]".repeat(400));
if (where() || !out().startsWith("[\n  [\n    [")) return `400 deep is fine: ${where()}`;
// Large text keeps up, and past the limit waits for a press.
const rows = Array.from({ length: 4000 }, (_, i) => `{"id":${i},"price":${i}.10,"name":"item ${i}"}`).join(",");
let t0 = performance.now();
await set(`[${rows}]`);
if (performance.now() - t0 - 60 > 900) return `${rows.length} characters took ${Math.round(performance.now() - t0 - 60)} ms`;
if (!out().includes(`"price": 3999.10,`)) return "large text";
// A long flat list: 90,000 numbers, each kept.
const nums = `[${Array.from({ length: 90000 }, (_, i) => i % 10).join(",")}]`;
t0 = performance.now();
await set(nums);
if (performance.now() - t0 - 60 > 900) return `a flat list took ${Math.round(performance.now() - t0 - 60)} ms`;
if (out().split("\n").length !== 90002) return `a flat list: ${out().split("\n").length}`;
const huge = `[${Array.from({ length: 6000 }, (_, i) => `{"id":${i},"name":"item ${i} of a longer list"}`).join(",")}]`;
t0 = performance.now();
await set(huge);
if (performance.now() - t0 - 60 > 300) return `past the live limit a keystroke took ${Math.round(performance.now() - t0 - 60)} ms`;
if (!c.textContent.includes("Large text: it is not read as you type.")) return "no word about waiting";
btn("format").click(); await wait(400);
if (c.textContent.includes("Large text: it is not read as you type.") || !out().includes(`"id": 5999,`)) return "pressing Format";
await set("x".repeat(5000001));
if (!c.querySelector("[role=alert]").textContent.includes("over the 5,000,000 it will read")) return `too big: ${c.querySelector("[role=alert]")?.textContent}`;
await set(start);
if (out() !== want) return "back to the start";
// The callback, and a single-quoted start.
const l = $("#json-formatter-demo-live-input");
const w = l.closest(".ui-json-fmt");
const note = w.closest(".demo-stack").querySelector(".demo-note");
if (l.name !== "config") return `the name: ${l.name}`;
w.querySelector("[data-repair]").click(); await wait(60);
if (l.value !== `{"name": "it's", "tags": ["a", "b"]}` || w.querySelector(".ui-json-fmt-where")) return `the demo: ${l.value}`;
type(l, `{"a":1}`); await wait(60);
if (note.textContent !== "on_change: valid, 12 characters.") return `on_change: ${note.textContent}`;
type(l, `{"a":\n1,}`); await wait(60);
if (note.textContent !== "on_change: not valid, at line 2.") return `on_change: ${note.textContent}`;
