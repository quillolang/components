const c = $("#dirty-form-guard-demo");
const f = (n) => c.querySelector(`[name=${n}]`);
const pick = (n, v) => { const s = f(n); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); };
const count = () => c.querySelector(".ui-dguard-count")?.textContent ?? null;
const row = (n) => { const r = c.querySelector(`[data-change=${n}]`); return r && `${r.querySelector(".ui-dguard-was").textContent} > ${r.querySelector(".ui-dguard-now").textContent}`; };
const back = (n) => c.querySelector(`[data-put-back=${n}]`);
const note = () => $("[data-said]").textContent;
const leave = () => { const e = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; };
if (count() !== null) return `nothing changed yet: ${count()}`;
if (leave()) return "nothing changed: leaving is free";
// A real change, listed with before and after.
type(f("name"), "Ana Costa"); await wait(40);
if (count() !== "1 unsaved change" || row("name") !== "Ana Silva > Ana Costa") return `${count()} ${row("name")}`;
if (!leave()) return "a change must warn before leaving";
if (note() !== 'on_change: ["name"]') return note();
if (!c.querySelector("[data-field=name].ui-dguard-changed")) return "the field is marked";
// Typed back: put back, not a change, no warning.
type(f("name"), "Ana Silva"); await wait(40);
if (count() !== "No real changes" || row("name") !== null || !back("name")) return `put back: ${count()} ${row("name")}`;
if (back("name").textContent !== "Nameput back: no real change") return back("name").textContent;
if (leave()) return "put back must not warn";
if (note() !== "on_change: []") return note();
// Spaces around text are no real change; inside they are.
type(f("name"), "  Ana Silva "); await wait(40);
if (row("name") !== null || !back("name")) return "spaces around";
type(f("name"), "Ana  Silva"); await wait(40);
if (row("name") !== "Ana Silva > Ana  Silva") return `spaces inside: ${row("name")}`;
type(f("name"), "Ana Silva"); await wait(40);
// Numbers by value.
for (const [t, real] of [["10", false], ["10.0", false], ["+10.000", false], ["10.01", true], ["abc", true], ["", true], ["0010.00", false]]) {
    type(f("limit"), t); await wait(35);
    if ((row("limit") !== null) !== real) return `limit ${t}: ${row("limit")}`;
}
type(f("limit"), "10.00"); await wait(30);
if (row("limit") !== null) return "the first value";
// A select shows labels; an empty value says so.
pick("plan", "free"); await wait(40);
if (row("plan") !== "Team > Free") return row("plan");
type(f("note"), "Call back"); await wait(30);
if (row("note") !== "(empty) > Call back") return row("note");
// A checkbox.
f("news").click(); await wait(40);
if (row("news") !== "Ticked > Not ticked") return row("news");
if (count() !== "3 unsaved changes") return count();
// A group of boxes: the same set in another order is not a change.
const box = (v) => c.querySelector(`[name=days][value=${v}]`);
box("mon").click(); await wait(30);
if (row("days") !== "Monday, Tuesday > Tuesday") return row("days");
box("mon").click(); await wait(30);
if (row("days") !== null || !back("days")) return `the same days in another order: ${row("days")}`;
box("fri").click(); await wait(30);
if (row("days") !== "Monday, Tuesday > Tuesday, Monday, Friday") return row("days");
// A password's value is never shown.
type(f("pin"), "9999"); await wait(30);
if (row("pin") !== "•••••• > ••••••") return row("pin");
if (c.textContent.includes("9999") || c.textContent.includes("1234")) return "a password shown";
if (count() !== "5 unsaved changes") return count();
// Revert one: focus goes to its field.
c.querySelector("[aria-label='Revert Plan']").click(); await wait(40);
if (f("plan").value !== "team" || row("plan") !== null || back("plan")) return `revert: ${f("plan").value}`;
if (document.activeElement !== f("plan")) return "focus goes to the field reverted";
if (c.querySelector(".ui-dguard-said").textContent !== "Plan is back to its first value.") return "said";
if (count() !== "4 unsaved changes") return count();
// A link asks; Stay stays.
$("[data-away]").click(); await wait(80);
const dialog = document.querySelector(".q-dialog");
if (!dialog || !dialog.textContent.includes("You have 4 unsaved changes. Leave without saving?")) return `the question: ${dialog?.textContent}`;
dialog.querySelector(".q-cancel").click(); await wait(80);
if (location.search.includes("only") || f("name") == null || f("note").value !== "Call back") return "Stay must stay";
// Revert all.
c.querySelector("[data-revert-all]").click(); await wait(40);
const firsts = [f("name").value, f("plan").value, f("limit").value, f("note").value, f("news").checked, box("mon").checked, box("tue").checked, box("fri").checked, f("pin").value].join();
if (firsts !== "Ana Silva,team,10.00,,true,true,true,false,1234") return firsts;
if (count() !== null || leave()) return `after revert all: ${count()}`;
if (note() !== "on_change: []") return note();
// With nothing changed, a link is just a link: stop it here so the test stays on the page.
const stopper = (e) => e.preventDefault();
document.addEventListener("click", stopper);
$("[data-away]").click(); await wait(60);
document.removeEventListener("click", stopper);
if (document.querySelector(".q-dialog.q-open")) return "no changes: no question";
// Save makes the values the new first values.
type(f("name"), "Bea"); await wait(30);
c.querySelector(".ui-dguard-save").click(); await wait(50);
if ($("[data-saved]").textContent !== "on_submit: Bea" || count() !== null || leave()) return `saved: ${$("[data-saved]").textContent} ${count()}`;
type(f("name"), "Ana Silva"); await wait(40);
if (row("name") !== "Bea > Ana Silva") return `the new first value: ${row("name")}`;
c.querySelector("[data-revert-all]").click(); await wait(40);
if (f("name").value !== "Bea") return f("name").value;
