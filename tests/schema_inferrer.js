const c = $("#schema-inferrer-demo-text").closest(".ui-schemainf");
const box = $("#schema-inferrer-demo-text");
const row = (p) => [...c.querySelectorAll("tbody tr")].find((r) => r.dataset.path === p);
const cells = (p) => [...row(p).children].map((t) => t.textContent);
const line = (p) => cells(p).slice(1).join("|");
const schema = () => JSON.parse($("#schema-inferrer-demo-schema").textContent);
const sum = () => c.querySelector(".ui-schemainf-sum").textContent.trim();
const bad = () => c.querySelector("[role=alert]")?.textContent;
if (sum() !== "4 samples, 18 fields") return `summary: ${sum()}`;
const want = {
    id: "string|required|uuid", email: "string|required|email", joined: "string|required|date", seen: "string|required|date-time",
    site: "string, nullable|required|url", plan: "string|required|freepro", score: "string or number|required|",
    tags: "array|required|", "tags[]": "string|required|", address: "object|required|", "address.city": "string|required|",
    "address.zip": "string, nullable|optional|", orders: "array|required|", "orders[]": "object|required|", "orders[].sku": "string|required|",
    "orders[].qty": "integer|required|", "orders[].note": "string|optional|", extra: "boolean|optional|",
};
for (const [p, v] of Object.entries(want)) { if (!row(p)) return `no row ${p}`; if (line(p) !== v) return `${p}: ${line(p)}, not ${v}`; }
const s = schema();
if (s.$schema !== "https://json-schema.org/draft/2020-12/schema" || s.type !== "object") return `root: ${JSON.stringify(s).slice(0, 80)}`;
if (s.required.join() !== "id,email,joined,seen,site,plan,score,tags,address,orders") return `required: ${s.required}`;
if (s.properties.id.format !== "uuid" || s.properties.plan.enum.join() !== "free,pro") return `formats: ${JSON.stringify(s.properties.plan)}`;
if (JSON.stringify(s.properties.site.type) !== '["string","null"]' || JSON.stringify(s.properties.score.type) !== '["string","number"]') return "types as lists";
if (s.properties.orders.items.required.join() !== "sku,qty" || s.properties.address.required.join() !== "city") return `nested required: ${s.properties.orders.items.required}`;
if (s.properties.tags.items.type !== "string") return "array items";
// A field with mixed whole and fractional numbers is number; 2.0 is whole.
type(box, '[{"n": 1}, {"n": 2.5}, {"m": 2.0}]'); await wait();
if (line("n") !== "number|optional|" || line("m") !== "integer|optional|") return `numbers: ${line("n")} ${line("m")}`;
// One object, a bare array of scalars, JSON Lines.
type(box, '{"a": null}'); await wait();
if (sum() !== "1 sample, 1 field" || line("a") !== "null|required|") return `one object: ${sum()} ${row("a") && line("a")}`;
type(box, '{"a": 1}\n\n{"a": 2, "b": "x"}\n'); await wait();
if (sum() !== "2 samples, 2 fields" || line("b") !== "string|optional|") return `lines: ${sum()}`;
type(box, '[1, "two", null]'); await wait();
if (schema().type.join() !== "string,integer,null") return `scalars: ${schema().type}`;
// Bad JSON says where, the same wherever it runs.
const tries = [
    ['{"a": 1', 'Line 1, column 8: The text ends before the closing "}".'],
    ['{"a": 1,\n  "b" 2}', 'Line 2, column 7: Expected ":" after the key, found "2".'],
    ['[1, 2,]', 'Line 1, column 7: Expected a value, found "]".'],
    ["{'a': 1}", `Line 1, column 2: Expected a key in double quotes, found "'".`],
    ['[1 2]', 'Line 1, column 4: Expected "," or "]", found "2".'],
    ['{"a": tru}', 'Line 1, column 7: Expected a value, found "t".'],
    ['"abc', 'Line 1, column 1: Found a string that never ends.'],
    ['{"a": 1}\n{"b": }', 'Line 2, column 7: Expected a value, found "}".'],
    ['{"a": 1} x', 'Line 1, column 10: Expected the end of the text, found "x".'],
];
for (const [t, w] of tries) { type(box, t); await wait(60); if (bad() !== w) return `${JSON.stringify(t)}: ${bad()}`; }
if (box.getAttribute("aria-invalid") !== "true" || c.querySelector("table")) return "a bad text marks the box and shows no table";
// Empty, spaces, unicode keys and a key that means something to JavaScript.
type(box, "   "); await wait(60);
if (sum() !== "Paste JSON to see its shape." || bad()) return `empty: ${sum()}`;
type(box, '{"naïve 😀": 1, "__proto__": {"x": 1}, "constructor": "y"}'); await wait();
if (!row("naïve 😀") || !row("__proto__.x") || line("constructor") !== "string|required|") return `odd keys: ${[...c.querySelectorAll("tbody th")].map((t) => t.textContent)}`;
// Deep nesting stops, and says so; a long paste stays quick.
type(box, "[".repeat(100) + "]".repeat(100)); await wait();
if (!c.querySelector(".ui-schemainf-note")?.textContent.includes("past 32 levels")) return `deep: ${c.querySelector(".ui-schemainf-note")?.textContent} ${bad()}`;
const big = JSON.stringify(Array.from({ length: 1500 }, (_, i) => ({ id: i, name: `n${i}`, ok: i % 2 === 0, at: "2026-01-01" })));
const t0 = performance.now();
type(box, big); await wait(100);
if (performance.now() - t0 > 1500) return `a long paste took ${performance.now() - t0} ms`;
if (!sum().startsWith("1000 samples") || !c.querySelector(".ui-schemainf-note").textContent.startsWith("Only the first 1,000 samples")) return `caps: ${sum()}`;
// The form's hidden field, and on_change.
type(box, '{"a": 1}'); await wait();
if (c.querySelector("input[name=sample_schema]").value !== '{"$schema":"https://json-schema.org/draft/2020-12/schema","type":"object","properties":{"a":{"type":"integer"}},"required":["a"]}') return c.querySelector("input[name=sample_schema]").value;
const l = $("#schema-inferrer-demo-live-text");
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
type(l, '{"x": 1, "y": 2}\n{"x": 3}'); await wait();
if (note() !== "on_change: x, y (required: x).") return `on_change: ${note()}`;
