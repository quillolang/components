const c = $("#form-builder-demo");
const id = (s) => c.querySelector(`#form-builder-demo-${s}`);
const json = () => JSON.parse(id("json").value);
const rows = () => [...c.querySelectorAll("[data-row]")].map((r) => r.dataset.row);
const said = () => c.querySelector(".ui-fbuild-said").textContent;
const row = (n) => c.querySelector(`[data-row=${n}]`);
const btn = (n, label) => row(n).querySelector(`[aria-label="${label} ${n}"]`);
const preview = () => [...c.querySelectorAll(".ui-fbuild-preview [data-field]")].map((f) => f.dataset.field);
const note = () => c.closest(".demo-stack").querySelector("[data-said]").textContent;
if (rows().join() !== "full_name,email,topic,details") return `start: ${rows()}`;
// A key this builder does not edit stays; the preview obeys it.
if (json()[3].show_if?.is !== "Support") return `show_if lost: ${JSON.stringify(json()[3])}`;
if (preview().join() !== "full_name,email,topic") return `the preview: ${preview()}`;
// Add: a free name each time.
c.querySelector("[data-add=text]").click(); await wait(40);
c.querySelector("[data-add=text]").click(); await wait(40);
c.querySelector("[data-add=select]").click(); await wait(40);
if (rows().join() !== "full_name,email,topic,details,text,text_2,select") return `added: ${rows()}`;
if (said() !== "Added select" || note() !== "on_change: 7 fields, the last select.") return `${said()} / ${note()}`;
if (JSON.stringify(json()[6].options) !== '["Option 1","Option 2"]' || !preview().includes("text_2") || !preview().includes("select")) return `the new field: ${JSON.stringify(json()[6])}`;
// Rename: a name in use, in any case, is refused and the old one kept.
c.querySelector("[data-row=text] .ui-fbuild-pick").click(); await wait(40);
const name = id("name");
if (name.value !== "text" || id("label").value !== "Text") return `settings show the field chosen: ${name.value}`;
const why = () => document.getElementById(name.getAttribute("aria-describedby") ?? "x")?.textContent ?? null;
for (const [t, msg] of [["email", "Another field is already named email. It stays text."], ["EMAIL", "Another field is already named EMAIL. It stays text."], ["", "A field needs a name. It stays text."], ["  ", "A field needs a name. It stays text."], ["2nd", "A name is letters, digits and _, and does not start with a digit. It stays text."], ["a b", "A name is letters, digits and _, and does not start with a digit. It stays text."], ["é", "A name is letters, digits and _, and does not start with a digit. It stays text."], ["x".repeat(65), "A name is at most 64 characters. It stays text."]]) {
    type(name, t); await wait(35);
    if (why() !== msg) return `name ${JSON.stringify(t)}: ${why()}`;
    if (json()[4].name !== "text") return `a bad name got through: ${json()[4].name}`;
}
type(name, "phone_number"); await wait(40);
if (why() !== null || json()[4].name !== "phone_number" || rows()[4] !== "phone_number") return `a good name: ${why()} ${json()[4].name}`;
if (!preview().includes("phone_number")) return "the preview follows the name";
// The rest of the settings, into the JSON and the preview.
type(id("label"), "Phone"); type(id("placeholder"), "+351"); type(id("hint"), "With the country code"); await wait(50);
id("required").click(); await wait(40);
const f = json()[4];
if (f.label !== "Phone" || f.placeholder !== "+351" || f.hint !== "With the country code" || f.required !== true || f.type !== "text") return JSON.stringify(f);
const pf = c.querySelector("#form-builder-demo-preview-phone_number");
if (pf.placeholder !== "+351" || pf.labels[0].textContent !== "Phone*") return `the preview's field: ${pf.placeholder} ${pf.labels[0]?.textContent}`;
const typeSel = id("type"); typeSel.value = "tel"; typeSel.dispatchEvent(new Event("change", { bubbles: true })); await wait(40);
if (json()[4].type !== "tel") return "the type";
typeSel.value = "radio"; typeSel.dispatchEvent(new Event("change", { bubbles: true })); await wait(50);
if (JSON.stringify(json()[4].options) !== '["Option 1","Option 2"]') return `a type with options gets some: ${JSON.stringify(json()[4])}`;
const opts = id("options"); opts.value = " Mobile \n\nHome\nMobile\n"; opts.dispatchEvent(new Event("change", { bubbles: true })); await wait(50);
if (JSON.stringify(json()[4].options) !== '["Mobile","Home"]') return `options are trimmed and unique: ${JSON.stringify(json()[4].options)}`;
typeSel.value = "tel"; typeSel.dispatchEvent(new Event("change", { bubbles: true })); await wait(50);
if ("options" in json()[4]) return "a type without options exports none";
// Reorder: up, down, the ends do nothing, Alt+arrows, focus stays.
row("phone_number").querySelector('[aria-label="Move phone_number up"]').click(); await wait(40);
if (rows().join() !== "full_name,email,topic,phone_number,details,text_2,select") return `up: ${rows()}`;
if (said() !== "Moved phone_number to place 4 of 7") return said();
row("full_name").querySelector('[aria-label="Move full_name up"]').click(); await wait(40);
if (rows()[0] !== "full_name") return "the top stays";
row("select").querySelector('[aria-label="Move select down"]').click(); await wait(40);
if (rows()[6] !== "select") return "the bottom stays";
const pick = row("phone_number").querySelector(".ui-fbuild-pick");
pick.focus();
pick.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", altKey: true, bubbles: true, cancelable: true })); await wait(50);
if (rows().join() !== "full_name,email,topic,details,phone_number,text_2,select") return `Alt+Down: ${rows()}`;
if (document.activeElement !== pick) return "focus stays on the moved row";
if (json()[4].name !== "phone_number") return "the JSON follows the order";
// Copy: a free name beside it.
btn("email", "Copy").click(); await wait(40);
if (rows().join() !== "full_name,email,email_2,topic,details,phone_number,text_2,select") return `copy: ${rows()}`;
if (json()[2].required !== true || json()[2].hint !== "We reply here.") return "a copy keeps the settings";
// Remove, and the panel goes on with a neighbour; focus stays inside.
btn("email_2", "Remove").click(); await wait(40);
if (rows().includes("email_2") || id("name").value !== "topic") return `remove: ${rows()} ${id("name").value}`;
if (!c.contains(document.activeElement)) return "focus was lost";
// Round trip: export, change, load: the same text comes out.
const text = id("json").value;
for (const n of ["full_name", "email", "topic", "details", "phone_number", "text_2", "select"]) { btn(n, "Remove").click(); await wait(25); }
if (rows().length !== 0 || json().length !== 0 || !c.textContent.includes("No fields yet")) return `all gone: ${rows()}`;
if (note() !== "on_change: 0 fields, the last none.") return note();
const load = async (t) => { type(id("load"), t); await wait(25); c.querySelector("[data-load]").click(); await wait(50); };
await load(text);
if (id("json").value !== text) return `the round trip:\n${id("json").value}\n---\n${text}`;
if (said() !== "Loaded 7 fields" || id("load").value !== "") return `after loading: ${said()}`;
// A new name after loading does not clash, and keys of rows stay apart.
c.querySelector("[data-add=text]").click(); await wait(40);
if (rows().at(-1) !== "text") return rows().at(-1);
// Bad loads: refused, nothing changes, says which.
const before = id("json").value;
const errs = () => [...c.querySelectorAll(".ui-fbuild-errors li")].map((l) => l.textContent);
for (const [t, want] of [
    ["", ["There is nothing to load."]], ["   ", ["There is nothing to load."]],
    ["{oops", ["That is not JSON: check for a missing comma, quote or bracket."]], ["5", ["The JSON must be a list of fields, or a map with `fields`."]], ["null", ["The JSON must be a list of fields, or a map with `fields`."]],
    ['[{"name":"a"},{"name":"A"}]', ["Field 2: Another field is already named A."]], ['[{"label":"x"}]', ["Field 1: A field needs a name."]], ['[3, {"name":"b","type":"colour"}]', ["Field 1 is not a map.", "Field 2: there is no type \"colour\"."]],
    ['[{"name":"c","type":"select"}]', ["Field 1: c needs a list of options."]], [JSON.stringify(Array.from({ length: 201 }, (_, i) => ({ name: `f${i}` }))), ["That has 201 fields; at most 200 are taken."]], ["[" + " ".repeat(200001) + "]", ["That is 200003 characters; at most 200000 are read."]],
]) {
    await load(t);
    if (errs().join("|") !== want.join("|")) return `load ${t.slice(0, 40)}: ${errs()}`;
    if (id("json").value !== before) return `a bad load changed the form: ${t.slice(0, 40)}`;
}
await load('{"fields":[{"name":"only","label":"Only one"}]}');
if (errs().length || rows().join() !== "only" || json()[0].type !== "text") return `a map with fields: ${rows()} ${errs()}`;
if (c.querySelector("[name=form_json]").value !== id("json").value) return "the hidden input holds the JSON";
// Unicode and quotes survive.
c.querySelector("[data-row=only] .ui-fbuild-pick").click(); await wait(30);
type(id("label"), 'Olá "😀"\n\\'); await wait(40);
const t2 = id("json").value;
await load(t2);
if (id("json").value !== t2) return "unicode's round trip";
