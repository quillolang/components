const c = $("#record-merger-demo-title").closest(".ui-rmerge");
const sum = () => [...c.querySelectorAll(".ui-rmerge-sum")].at(-1).textContent.replace(/\s+/g, " ").trim();
const out = (k) => c.querySelector(`.ui-rmerge-out dd[data-key=${k}]`).textContent;
const go = c.querySelector(".ui-rmerge-go");
const said = () => c.querySelector(".ui-rmerge-said").textContent;
const btn = (s) => c.querySelector(`[data-strategy=${s}]`);
const form = (k) => c.querySelector(`input[name=merged_${k}]`).value;
// name and tags agree (tags as lists, compared whole); phone's null and "" are one empty but differ from the number.
if (sum() !== "2 fields settled, 5 conflicts, 5 open") return `start: ${sum()}`;
if (c.querySelector("tr[data-key=name]").classList.contains("ui-rmerge-conflict") || !c.querySelector("tr[data-key=email]").classList.contains("ui-rmerge-open")) return "conflict marks";
if (c.querySelector("tr[data-key=name] td").colSpan !== 3 || c.querySelector("tr[data-key=name] td").textContent !== "Ada Lovelace") return "a settled field";
if (out("name") !== "Ada Lovelace" || out("email") !== "not chosen") return `merged at the start: ${out("name")} ${out("email")}`;
if (!go.disabled || said() !== "Choose a value for 5 more fields.") return `merge shut: ${said()}`;
const [h1, h2] = [...c.querySelectorAll("thead th")].slice(1);
if (h1.textContent !== "CRM2026-01-10" || h2.textContent !== "Billing2026-03-02") return `headers: ${h1.textContent}`;
// The date and source are not fields.
if (c.querySelector("tr[data-key=updated]") || c.querySelector("tr[data-key=source]")) return "date_key and label_key are not merged";
// Newest: Billing, even where it is empty.
btn("newest").click(); await wait();
if (out("email") !== "ada@example.com" || out("phone") !== "+44 20 7946 0000" || out("city") !== "empty" || out("plan") !== "pro" || out("note") !== "empty") return `newest: ${out("email")} ${out("city")} ${out("plan")} ${out("note")}`;
if (sum() !== "2 fields settled, 5 conflicts, 0 open" || go.disabled || btn("newest").getAttribute("aria-pressed") !== "true") return `newest closes all: ${sum()}`;
// Non-empty: the newest that has a value: city from CRM over Sign-up, note from Sign-up.
btn("non_empty").click(); await wait();
if (out("email") !== "ada@example.com" || out("city") !== "London" || out("note") !== "Met at the fair") return `non-empty: ${out("city")} ${out("note")}`;
// Longest: 22 characters beat 15, free beats pro, equal lengths go to the newest.
btn("longest").click(); await wait();
if (out("email") !== "a.lovelace@example.org" || out("city") !== "Greater London" || out("plan") !== "free") return `longest: ${out("email")} ${out("city")} ${out("plan")}`;
if (form("email") !== "a.lovelace@example.org" || form("name") !== "Ada Lovelace" || form("tags") !== '["vip"]') return `form: ${form("email")} ${form("tags")}`;
// By hand, then clear.
const radio = c.querySelector("tr[data-key=email] input[value='0']");
radio.focus(); radio.click(); await wait();
if (out("email") !== "ada@old.example" || btn("longest").getAttribute("aria-pressed") !== "false") return `by hand: ${out("email")}`;
[...c.querySelectorAll(".ui-rmerge-bar button")].at(-1).click(); await wait();
if (sum() !== "2 fields settled, 5 conflicts, 5 open" || !go.disabled) return `clear: ${sum()}`;
// Only one good version.
const one = $("#record-merger-demo-one-title").closest(".ui-rmerge");
if (one.querySelector(".ui-rmerge-note").textContent !== "1 item is not a record, and left out." || one.querySelector(".ui-rmerge-empty").textContent !== "Only one version: there is nothing to merge.") return `one: ${one.textContent}`;
if (one.querySelector("table")) return "one version has no table";
// A date-time as a database writes it is a date; text that is none counts as oldest.
const times = $("#record-merger-demo-times-title").closest(".ui-rmerge");
times.querySelector("[data-strategy=newest]").click(); await wait();
if (times.querySelector(".ui-rmerge-out dd[data-key=v]").textContent !== "later") return `times: ${times.querySelector(".ui-rmerge-out dd[data-key=v]").textContent}`;
// No dates: the last in the list is the newest, decimals stay as they came.
const live = $("#record-merger-demo-live-title").closest(".ui-rmerge");
if (!live.querySelector(".ui-rmerge-sum").textContent.startsWith("No version has a date")) return "no dates says so";
live.querySelector("[data-strategy=newest]").click(); await wait();
live.querySelector(".ui-rmerge-go").click(); await wait();
if (live.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_merge: B-1 at 13.00.") return `on_merge: ${live.closest(".demo-stack").querySelector(".demo-note").textContent}`;
if (live.querySelector(".ui-rmerge-said").textContent !== "Merged 2 versions into one record.") return live.querySelector(".ui-rmerge-said").textContent;
