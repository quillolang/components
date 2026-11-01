const c = $("#query-builder-demo-title").closest(".ui-qbuild");
const sql = () => $("#query-builder-demo-sql").textContent;
const params = () => $("#query-builder-demo-params").textContent;
const js = () => JSON.parse($("#query-builder-demo-json").textContent);
const count = () => c.querySelector(".ui-qbuild-count").textContent;
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(100); };
const rule = (n) => c.querySelectorAll(".ui-qbuild-rule")[n];
const parts = (n) => { const r = rule(n); return { field: r.querySelector("select[id$=-field]"), op: r.querySelector("select[id$=-op]"), value: r.querySelector("[id$=-value]"), to: r.querySelector("[id$=-to]") }; };
// Started from the prop: age >= 18 and (plan is pro or name has "tur").
if (sql() !== `SELECT * FROM "people"\nWHERE "age" >= ? AND ("plan" = ? OR LOWER("name") LIKE ? ESCAPE '\\')`) return `sql: ${sql()}`;
if (params() !== '[18, "pro", "%tur%"]') return `params: ${params()}`;
// Ada (36, pro), Alan (41, name): two. Bo is 17; "not known" and null are not numbers.
if (count() !== "2 of 6 sample rows match") return `count: ${count()}`;
if (JSON.stringify(js()) !== '{"and":[{"field":"age","op":"gte","value":"18"},{"or":[{"field":"plan","op":"eq","value":"pro"},{"field":"name","op":"contains","value":"tur"}]}]}') return `json: ${JSON.stringify(js())}`;
if (c.querySelector("input[name=filter]").value !== JSON.stringify(js())) return "the hidden field";
// Operators follow the field's type.
const ops = (n) => [...parts(n).op.options].map((o) => o.value).join();
if (ops(0) !== "eq,ne,gt,gte,lt,lte,between,empty,filled") return `number ops: ${ops(0)}`;
if (ops(1) !== "eq,ne,in,empty,filled") return `enum ops: ${ops(1)}`;
if (ops(2) !== "contains,not_contains,eq,ne,starts,ends,in,empty,filled") return `text ops: ${ops(2)}`;
// A rule edited keeps the focus of its input while the output changes.
const age = parts(0).value;
age.focus(); type(age, "40"); await wait(100);
if (document.activeElement !== age || !age.isConnected) return "the input lost its focus";
if (count() !== "1 of 6 sample rows match") return `at 40: ${count()}`;
// Bad number: says where, stays out of the output.
type(age, "abc"); await wait(100);
if (rule(0).querySelector(".ui-qbuild-why")?.textContent !== 'Age: "abc" is not a number.' || age.getAttribute("aria-invalid") !== "true") return `bad number: ${rule(0).textContent}`;
if (sql() !== `SELECT * FROM "people"\nWHERE ("plan" = ? OR LOWER("name") LIKE ? ESCAPE '\\')`) return `a bad rule stays out: ${sql()}`;
if (c.querySelector(".ui-qbuild-note").textContent !== "1 unfinished rule is left out below.") return c.querySelector(".ui-qbuild-note").textContent;
// Ada, Alan, Bo.
if (count() !== "3 of 6 sample rows match") return `without it: ${count()}`;
type(age, "18"); await wait(100);
// Between, with both ends and backwards.
await pick(parts(0).op, "between");
if (parts(0).to == null) return "between has two inputs";
if (rule(0).querySelector(".ui-qbuild-why")?.textContent !== "Age needs both ends of the range.") return rule(0).textContent;
type(parts(0).to, "2"); await wait(100);
if (rule(0).querySelector(".ui-qbuild-why")?.textContent !== "Age: the range runs backwards, 18 to 2.") return rule(0).textContent;
type(parts(0).to, "41"); await wait(100);
if (!sql().includes(`"age" BETWEEN ? AND ?`) || params() !== '[18, 41, "pro", "%tur%"]' || count() !== "2 of 6 sample rows match") return `between: ${sql()} ${params()} ${count()}`;
// The field's column is the SQL name; numbers are decimals, 0.1 + nothing rounded.
await pick(parts(0).field, "balance");
if (parts(0).op.value !== "between") return `a number stays between: ${parts(0).op.value}`;
await pick(parts(0).op, "eq"); type(parts(0).value, "12.50"); await wait(100);
if (!sql().includes(`"balance_usd" = ?`) || params().slice(0, 7) !== "[12.50,") return `column: ${sql()} ${params()}`;
if (count() !== "1 of 6 sample rows match") return `12.50 equals 12.5: ${count()}`;
// A value cannot reach the text, and LIKE's own characters are escaped.
await pick(parts(0).field, "name");
if (parts(0).op.value !== "contains") return "a new type starts on its first operator";
type(parts(0).value, "'; DROP TABLE people; --"); await wait(100);
if (sql().includes("DROP") || !params().includes("drop table people")) return `injection: ${sql()}`;
type(parts(0).value, "50%"); await wait(100);
if (!params().startsWith('["%50\\\\\\\\%%"') && !params().startsWith(String.raw`["%50\\%%"`)) return `like escape: ${params()}`;
await pick(c.querySelector("select[id^=query-builder-demo-group]"), "or");
// Name has 50%: Linus; or plan pro: Ada, Bo; or name has tur: Alan.
if (count() !== "4 of 6 sample rows match") return `or: ${count()}`;
await pick(c.querySelector("select[id^=query-builder-demo-group]"), "and");
// Empty: only null or blank. Not "is not": it skips them.
await pick(parts(0).op, "empty");
if (parts(0).value) return "is empty takes no value";
if (!sql().includes(`("name" IS NULL OR "name" = '')`) ) return `empty: ${sql()}`;
const inner = () => c.querySelector("fieldset fieldset");
await pick(inner().querySelector("select"), "and");
// Remove the inner group; then only name is empty: the blank row.
inner().querySelector("[aria-label='Remove this group']").click(); await wait(100);
if (count() !== "1 of 6 sample rows match" || inner()) return `after removing a group: ${count()}`;
// Dates and booleans.
await pick(parts(0).field, "joined"); await pick(parts(0).op, "between");
type(parts(0).value, "2026-01-01"); await wait(60); type(parts(0).to, "2026-03-01"); await wait(100);
if (count() !== "2 of 6 sample rows match") return `dates: ${count()}`;
await pick(parts(0).field, "active");
if (parts(0).op.value !== "yes" || sql() !== `SELECT * FROM "people"\nWHERE "active" = ?` || params() !== "[true]") return `boolean: ${sql()} ${params()}`;
if (count() !== "3 of 6 sample rows match") return `active: ${count()}`;
// Add a group and a rule; nesting stops at the depth.
const add = (name, scope = c) => [...scope.querySelectorAll("button")].find((b) => b.textContent === name);
add("Add group").click(); await wait(100);
if (c.querySelectorAll(".ui-qbuild-group").length !== 2 || c.querySelectorAll(".ui-qbuild-rule").length !== 2) return "adding a group adds a rule in it";
if (rule(1).querySelector(".ui-qbuild-why")?.textContent !== "Name needs a value.") return rule(1).textContent;
let scope = inner();
for (let d = 2; d <= 4; d++) { add("Add group", scope).click(); await wait(100); scope = scope.querySelector("fieldset"); }
if (!add("Add group", scope).disabled) return "nesting past max_depth";
// Remove all the rules: nothing left to say.
[...c.querySelectorAll(":scope fieldset fieldset")][0].querySelector("[aria-label='Remove this group']").click(); await wait(100);
c.querySelector("[aria-label='Remove this rule']").click(); await wait(100);
if (sql() !== `SELECT * FROM "people"` || params() !== "[]" || count() !== "6 of 6 sample rows match") return `no rules: ${sql()} ${count()}`;
if (JSON.stringify(js()) !== "{}") return `no filter: ${JSON.stringify(js())}`;
// on_change, by Add rule then a value.
const live = $("#query-builder-demo-live-title").closest(".ui-qbuild");
[...live.querySelectorAll("button")].find((b) => b.textContent === "Add rule").click(); await wait(100);
const box = live.querySelectorAll(".ui-qbuild-input")[1];
type(box, "Rua"); await wait(100);
const note = live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== `on_change: LOWER("city") = ? AND LOWER("city") LIKE ? ESCAPE '\\' with 2 parameters.`) return `on_change: ${note}`;
