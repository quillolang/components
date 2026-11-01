const src = $("#translation-checker-demo-source"), dst = $("#translation-checker-demo-translations"), c = src.closest(".ui-translation-checker");
const said = () => $("#translation-checker-demo-said").textContent;
const locales = () => [...c.querySelectorAll(".ui-translation-checker-locale")];
const rows = () => [...c.querySelectorAll("#translation-checker-demo-table tbody tr")].map((r) => [...r.cells].map((x) => x.textContent));
const row = (k) => rows().find((r) => r[0] === k);
const issues = (k) => [...c.querySelectorAll("#translation-checker-demo-table tbody tr")].find((r) => r.cells[0].textContent === k)?.querySelectorAll("li");
const says = (k) => [...(issues(k) ?? [])].map((l) => l.textContent);
const filter = $("#translation-checker-demo-filter");
const pick = async (v) => { const s = $("#translation-checker-demo-filter"); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(); };
const two = async (a, b) => { type(src, typeof a === "string" ? a : JSON.stringify(a)); type(dst, typeof b === "string" ? b : JSON.stringify(b)); await wait(); };
// A check of one string in one language.
const one = async (a, b) => { await two({ k: a }, { xx: { k: b } }); return says("k"); };
if (src.name !== "source" || dst.name !== "translations" || src.labels[0]?.textContent !== "Source strings" || dst.labels[0]?.textContent !== "Translations") return "the fields' names or labels";
// The demo: seven strings. French lacks cart.empty: 6 of 7, 85.7%. German has them all.
if (locales().map((l) => l.querySelector("small").textContent).join("|") !== "85.7%, 6 of 7|100.0%, 7 of 7") return locales().map((l) => l.textContent).join("|");
if (said() !== "fr: 85.7% translated, 5 strings with problems.") return said();
if (locales()[0].getAttribute("aria-pressed") !== "true") return "the first language is not chosen";
if (JSON.stringify(says("greeting")) !== JSON.stringify(["Placeholder missing: {name}.", "Placeholder not in the source: {nom}."])) return `greeting: ${says("greeting")}`;
if (JSON.stringify(says("cart.items")) !== JSON.stringify(["Placeholders that count by place are in another order: number them, as %1$s."])) return `order: ${says("cart.items")}`;
if (says("cart.empty").join() !== "No translation." || row("cart.empty")[2] !== "none") return `missing: ${row("cart.empty")}`;
if (says("nav.home").join() !== "The same as the source.") return `unchanged: ${says("nav.home")}`;
if (says("footer").join() !== "The space at the end is gone.") return `space: ${says("footer")}`;
if (!$("#translation-checker-demo-extra")?.textContent.includes("Only in fr, not in the source: legacy.")) return "a key only the translation has";
// Fine strings are hidden until All.
if (row("nav.help")) return "a fine row among the problems";
await pick("all");
if (!row("nav.help") || rows().length !== 7 || row("nav.help")[3] !== "Fine") return `all: ${rows().length}`;
await pick("unchanged");
if (rows().map((r) => r[0]).join() !== "nav.home") return `filter: ${rows().map((r) => r[0])}`;
await pick("problems");
// The other language, by keyboard: a button.
locales()[1].focus(); locales()[1].click(); await wait();
if (locales()[1].getAttribute("aria-pressed") !== "true" || said() !== "de: 100.0% translated, 2 strings with problems.") return `de: ${said()}`;
// 72 characters for 18: 4.0 times as long.
if (says("cart.empty").join() !== "72 characters for 18: 4.0 times as long.") return `overlong: ${says("cart.empty")}`;
// "</b {{amount}}" is no tag: the </b> is gone.
if (says("cart.total").join() !== "Tag missing: </b>.") return `html: ${says("cart.total")}`;
// Placeholders of each kind.
for (const [a, b, want] of [["Hi {name}", "Salut {name}", ""], ["Hi {{ name }}", "Salut {{name}}", ""], ["%s", "x %s", ""], ["%1$s %2$s", "%2$s %1$s", ""], ["%(a)s", "%(a)s!", ""], ["${x} y", "${x} z", ""], ["100%", "100 %", ""], ["100%% of %s", "%s 100%%", ""],
                            ["Hi %s", "Salut", "Placeholder missing: %s."], ["Hi", "Salut %d", "Placeholder not in the source: %d."], ["%d %d", "%d", "Placeholder missing: %d."], ["{a} {b}", "{a}", "Placeholder missing: {b}."], ["{{x}}", "{x}", "Placeholder missing: {{x}}.|Placeholder not in the source: {x}."],
                            ["%s %d", "%d %s", "Placeholders that count by place are in another order: number them, as %1$s."], ["{n, plural, one {# item} other {# items}}", "{n, plural, one {# article} other {# articles}}", ""], ["${x}", "$x", "Placeholder missing: ${x}."]]) {
    const got = (await one(a, b)).join("|");
    if (got !== want) return `placeholders in ${a} / ${b}: ${got}`;
}
// Tags: fine, missing, added, out of turn, left open; br and img stand alone; case does not count.
for (const [a, b, want] of [["<b>x</b>", "<b>y</b>", ""], ["<a href='/x'>x</a>", "<a href='/y'>y</a>", ""], ["a<br>b", "a<br/>b", ""], ["<B>x</B>", "<b>y</b>", ""], ["<b>x</b> y", "x y", "Tag missing: <b>, </b>."], ["x", "<i>y</i>", "Tag not in the source: <i>, </i>."],
                            ["<b><i>x</i></b>", "<b><i>y</b></i>", "</b> closes nothing open."], ["<b>x</b>", "</b>y<b>", "</b> closes nothing open."], ["<b>a < b</b>", "<b>a < c</b>", ""], ["1 < 2 and 3 > 2", "1 < 2 et 3 > 2", ""]]) {
    const got = (await one(a, b)).join("|");
    if (got !== want) return `tags in ${a} / ${b}: ${got}`;
}
// Spaces.
for (const [a, b, want] of [[" x", "y", "The space at the start is gone."], ["x", " y", "A space was added at the start."], ["x ", "y", "The space at the end is gone."], ["x", "y ", "A space was added at the end."], ["a b", "c  d", "Two spaces in a row."], ["a  b", "c  d", ""], ["a\nb", "c d", "0 line breaks where the source has 1."]]) {
    const got = (await one(a, b)).join("|");
    if (got !== want) return `spaces in ${JSON.stringify(a)} / ${JSON.stringify(b)}: ${got}`;
}
// Length, at the limit: 20 characters may be 1.5 times, plus 10: 40. 41 is over. "Save" may grow to 16.
if ((await one("x".repeat(20), "y".repeat(40))).length) return "40 for 20 is allowed";
if ((await one("x".repeat(20), "y".repeat(41))).join() !== "41 characters for 20: 2.1 times as long.") return `41 for 20: ${says("k")}`;
if ((await one("Save", "y".repeat(16))).length) return "16 for 4 is allowed";
if ((await one("Save", "y".repeat(17))).join() !== "17 characters for 4: 4.3 times as long.") return `17 for 4: ${says("k")}`;
if ((await one("Привет", "Привет")).join() !== "The same as the source.") return "unchanged in another alphabet";
// Unchanged: not for numbers or symbols; whitespace-only counts as missing; an empty source asks for nothing.
if ((await one("123", "123")).length || (await one("...", "...")).length) return "numbers and marks may stay the same";
if ((await one("Text", "   ")).join() !== "No translation.") return "spaces are no translation";
if ((await one("Text", null)).join() !== "No translation.") return "null is no translation";
await two({ a: "", b: "x y" }, { fr: { a: "", b: "z" } });
if (locales()[0].querySelector("small").textContent !== "100.0%, 1 of 1") return `an empty source: ${locales()[0].textContent}`;
// Unicode, right to left, and text in cells is text.
await pick("all");
await two({ k: "Hello <b>x</b>" }, { ar: { k: "مرحبا <b>x</b>" } });
if (row("k")[2] !== "مرحبا <b>x</b>" || c.querySelector("#translation-checker-demo-table tbody b")) return "markup in a string is text";
if (c.querySelector("#translation-checker-demo-table tbody td:nth-child(3)").getAttribute("dir") !== "auto") return "right-to-left text";
// Nested keys, lists, numbers; keys that are JavaScript's own.
await two({ a: { b: { c: "x y" } }, list: ["one word", "two words"], n: 5, constructor: "Build it", __proto__x: "p q" }, { de: { a: { b: { c: "z" } }, list: ["ein", "zwei"], n: 5, constructor: "Bau" } });
if (!row("a.b.c") || !row("list.0") || row("list.1")[2] !== "zwei" || row("n")[3] !== "Fine") return `nesting: ${rows().map((r) => r[0])}`;
if (row("constructor")[3] !== "Fine" || row("__proto__x")[3] !== "No translation.") return `JavaScript's names: ${row("constructor")}`;
await two('{"__proto__":"a b","constructor":"build it","toString":"e f"}', '{"fr":{"__proto__":"g h","constructor":"build it","toString":""}}');
if (row("__proto__")?.[2] !== "g h" || row("constructor")?.[3] !== "The same as the source." || row("toString")?.[3] !== "No translation.") return `own names as JSON: ${rows()}`;
// A single language pasted as a flat map.
await two({ a: "one two" }, { a: "un deux" });
if (locales()[0].querySelector("b").textContent !== "translation" || !said().startsWith("translation: 100.0%")) return `flat: ${said()}`;
// Going past a language that left keeps a choice that exists.
await two({ a: "one two" }, { fr: { a: "un" }, de: {} });
locales()[1].click(); await wait();
if (locales()[1].querySelector("small").textContent !== "0.0%, 0 of 1" || !said().startsWith("de: 0.0%")) return `none done: ${said()}`;
await two({ a: "one two" }, { fr: { a: "un" } });
if (!said().startsWith("fr:")) return said();
// Bad input.
await two("{ nope", "{}");
if (said() !== "The source box is not valid JSON." || locales().length || src.getAttribute("aria-invalid") !== "true") return said();
await two("{}", "[1, 2]");
if (said() !== "The translations box must hold a map of keys and strings, not a list.") return said();
await two("5", "{}");
if (said() !== "The source box must hold a map of keys and strings, not a single value.") return said();
await two("{}", "{}");
if (said() !== "The source has no strings.") return said();
await two("", "");
if (said() !== "Paste the source strings and their translations as JSON.") return said();
await two({ a: "x" }, {});
if (locales()[0]?.querySelector("small").textContent !== "0.0%, 0 of 1") return `no translations: ${said()}`;
// Depth does not break it.
let deep = "\"x y\""; for (let i = 0; i < 80; i++) deep = `{"a":${deep}}`;
await two(deep, "{}");
if (said() !== "The source has no strings.") return `very deep: ${said()}`;
// Many strings stay quick and past the limit it says so; the table is capped.
const many = {}, tr = {}; for (let i = 0; i < 6000; i++) { many[`key${i}`] = `Text number ${i} %s`; tr[`key${i}`] = `Texte ${i}`; }
const t0 = performance.now();
await two(many, { fr: tr });
if (performance.now() - t0 - 250 > 1500) return `6,000 strings took ${performance.now() - t0} ms`;
if (!c.textContent.includes("Only the first 5,000 strings were read.") || rows().length !== 300 || !c.textContent.includes("And 4700 more.")) return `limits: ${rows().length}`;
await two("", "");
// on_change, keep and names.
const live = $("#translation-checker-demo-live-translations"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.name !== "all_json" || $("#translation-checker-demo-live-source").name !== "en_json") return "name props";
const lc = live.closest(".ui-translation-checker");
if (lc.textContent.includes("The same as the source")) return "keep";
type(live, '{"es":{"ok":"OK","save":"Guardar"}}'); await wait();
if (note() !== "on_change: 100% translated.") return note();
