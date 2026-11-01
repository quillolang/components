const c = $("#json-query-demo-text").closest(".ui-jsonq");
const path = $("#json-query-demo-path");
const hits = () => [...c.querySelectorAll(".ui-jsonq-list li")].map((l) => `${l.children[0].textContent}=${l.children[1].textContent}`);
const sum = () => c.querySelector(".ui-jsonq-sum").textContent.trim();
const ask = async (p) => { type(path, p); await wait(60); };
const same = (a) => hits().join(" ") === a.join(" ");
if (!same(["$.items[0].price=0.12", "$.items[1].price=0.08", "$.items[2].price=19.5"]) || sum() !== "3 results") return `start: ${hits()} / ${sum()}`;
const cases = [
    ["$.store", ['$.store="Hardware Co"']],
    ["$['store']", ['$.store="Hardware Co"']],
    ["$.items[-1].sku", ['$.items[2].sku="B-7"']],
    ["$.items[0:2].sku", ['$.items[0].sku="A-1"', '$.items[1].sku="A-2"']],
    ["$.items[::2].sku", ['$.items[0].sku="A-1"', '$.items[2].sku="B-7"']],
    ["$.items[::-1].sku", ['$.items[2].sku="B-7"', '$.items[1].sku="A-2"', '$.items[0].sku="A-1"']],
    ["$.items[0,2].name", ['$.items[0].name="Bolt"', '$.items[2].name="Saw"']],
    ["$.items[0]['sku','name']", ['$.items[0].sku="A-1"', '$.items[0].name="Bolt"']],
    ["$.items[0]['in stock']", ["$.items[0]['in stock']=true"]],
    ["$..name", ['$.items[0].name="Bolt"', '$.items[1].name="Nut"', '$.items[1].supplier.name="Acme"', '$.items[2].name="Saw"', '$.supplier.name="Zenith"']],
    ["$..tags[0]", ['$.items[0].tags[0]="steel"', '$.items[2].tags[0]="tool"']],
    ["$.items[?(@.qty>2)].sku", ['$.items[0].sku="A-1"', '$.items[2].sku="B-7"']],
    ["$.items[?(@.qty > 2 && @.price < 1)].name", ['$.items[0].name="Bolt"']],
    ["$.items[?(@.qty == 1 || @.price >= 19.5)].sku", ['$.items[1].sku="A-2"', '$.items[2].sku="B-7"']],
    ["$.items[?(!(@.qty > 2))].sku", ['$.items[1].sku="A-2"']],
    ["$.items[?(@.supplier)].sku", ['$.items[1].sku="A-2"']],
    ["$.items[?(@.supplier.name == 'Acme')].sku", ['$.items[1].sku="A-2"']],
    ["$.items[?(@['in stock'] == true)].sku", ['$.items[0].sku="A-1"']],
    ["$.items[?(@.name == $.items[1].name)].qty", ["$.items[1].qty=1"]],
    ["$.items[?(@.qty > 'a')].sku", []],
    ["$.supplier.*", ['$.supplier.name="Zenith"', '$.supplier.city="Porto"']],
    ["$.open", ["$.open=true"]],
];
for (const [p, want] of cases) { await ask(p); if (!same(want)) return `${p}: ${hits().join(" ")}`; }
// The whole document, and a nested value as JSON.
await ask("$.items[1].supplier");
if (hits()[0] !== '$.items[1].supplier={"name":"Acme"}') return hits()[0];
// A path found nothing: where it stopped, and what was there.
await ask("$.items[*].prcie");
if (sum() !== "Nothing matches from .prcie on. Did you mean price? The keys there are sku, name, qty, price, tags, in stock and 1 more.") return sum();
await ask("$.nothing.more");
if (sum() !== "Nothing matches from .nothing on. The keys there are store, open, items, supplier.") return sum();
await ask("$.items[9]");
if (sum() !== "Nothing matches from [9] on.") return sum();
// Bad paths say where, with the mark under the place.
const fails = [
    ["items", 'At character 1: A path starts with $, not "i".', 0],
    ["", "At character 1: Write a path, starting with $.", 0],
    ["$.", 'At character 3: Expected a key or * after ".", found the end of the path.', 2],
    ["$..", 'At character 4: Expected a name, * or [ after "..", found the end of the path.', 3],
    ["$x", 'At character 2: Expected ".", ".." or "[", found "x".', 1],
    ["$.items[", 'At character 9: Expected a number, a quoted key, * or ? in the brackets, found the end of the path.', 8],
    ["$.items[0", 'At character 10: Expected "," or "]", found the end of the path.', 9],
    ["$.items['a", "At character 9: This string is never closed.", 8],
    ["$.items[?(@.qty = 2)]", 'At character 17: A comparison is written "==", not "=".', 16],
    ["$.items[?(@.qty > )]", 'At character 19: Expected @, $, a number, a quoted string, true, false or null, found ")".', 18],
    ["$.items[?(@.qty > 2]", 'At character 20: Expected ")" to close the test, found "]".', 19],
    ["$[::0]", "At character 5: A slice's step cannot be 0.", 4],
    ["$.items[?(1)]", 'At character 12: Expected a comparison after this value, found ")".', 11],
];
for (const [p, w, at] of fails) {
    await ask(p);
    const e = c.querySelector("[role=alert] span")?.textContent;
    if (e !== w) return `${JSON.stringify(p)}: ${e}`;
    if (path.getAttribute("aria-invalid") !== "true") return `${p}: not marked`;
    if (c.querySelector(".ui-jsonq-mark").textContent.split("\n")[1] !== " ".repeat(at) + "^") return `${p}: mark ${JSON.stringify(c.querySelector(".ui-jsonq-mark").textContent)}`;
}
await ask("$" + "[?(".repeat(200));
if (!c.querySelector("[role=alert] span")?.textContent) return "brackets without end";
await ask("$.items[?" + "(".repeat(50) + "@.a" + ")".repeat(50) + "]");
if (c.querySelector("[role=alert] span")?.textContent !== "At character 44: This test is nested too deeply.") return c.querySelector("[role=alert] span")?.textContent;
// Bad JSON: where.
const box = $("#json-query-demo-text");
const keep = box.value;
await ask("$.a");
type(box, '{"a": [1, 2,\n "b"'); await wait(60);
if (c.querySelector("[role=alert]")?.textContent !== 'Line 2, column 5: The text ends before the closing "]".') return c.querySelector("[role=alert]")?.textContent;
if (sum() !== "" || hits().length) return "bad JSON gives no results";
// Empty; a bare value; odd keys; unicode; whole floats shown alike.
type(box, ""); await wait(60);
if (c.querySelector("[role=alert]") || sum() !== "") return "empty text says nothing";
type(box, "42"); await wait(60);
await ask("$");
if (hits()[0] !== "$=42") return `a bare value: ${hits()}`;
type(box, '{"a b": {"it\'s": 2.0}, "é": null, "__proto__": 1, "x.y": []}'); await wait(60);
await ask("$..*");
if (hits().join(" ") !== `$['a b']={"it's":2} $['é']=null $.__proto__=1 $['x.y']=[] $['a b']['it\\'s']=2`) return hits().join(" ");
await ask("$['a b']['it\\'s']");
if (hits()[0] !== `$['a b']['it\\'s']=2`) return hits().join(" ");
await ask("$.é");
if (hits()[0] !== "$['é']=null") return `a unicode name: ${hits()}`;
// Caps: a long list, and depth.
type(box, JSON.stringify(Array.from({ length: 2000 }, (_, i) => ({ i })))); await wait(60);
const t0 = performance.now();
await ask("$..i");
if (performance.now() - t0 > 800) return `2,000 items took ${performance.now() - t0} ms`;
if (hits().length !== 500 || sum() !== "500+ results" || c.querySelector(".ui-jsonq-note").textContent !== "Only the first 500 results are shown.") return `the cap: ${hits().length} ${sum()}`;
type(box, keep); await wait(60);
// A try button and the form fields; on_change.
if (box.name !== "query_json" || path.name !== "query_path") return "field names";
c.querySelector(".ui-jsonq-try").click(); await wait(60);
if (path.value !== "$..*" || !sum().endsWith("results")) return `a try: ${path.value} ${sum()}`;
const l = $("#json-query-demo-live-path");
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
type(l, "$[-1]"); await wait(60);
if (note() !== "on_change: 1 result, the first $[3] = 4.") return `on_change: ${note()}`;
type(l, "$["); await wait(60);
if (note() !== "on_change: 0 results.") return `on_change on a bad path: ${note()}`;
