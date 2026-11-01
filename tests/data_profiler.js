const card = (k, id = "data-profiler-demo") => $(`#${id}-find`).closest(".ui-dprof").querySelector(`.ui-dprof-card[data-key="${k}"]`);
const txt = (k, cls) => card(k)?.querySelector(cls === "type" ? ".ui-dprof-type" : `[data-stat=${cls}]`)?.textContent;
const warn = (k) => [...card(k).querySelectorAll(".ui-dprof-warn li")].map((l) => l.textContent);
const box = $("#data-profiler-demo-find").closest(".ui-dprof");
if (box.querySelector(".ui-dprof-sum").textContent.replace(/\s+/g, " ").trim() !== "5 rows, 11 columns, 9 warnings") return `summary: ${box.querySelector(".ui-dprof-sum").textContent}`;
// id: whole numbers, each its own.
if (txt("id", "type") !== "Integer" || txt("id", "low") !== "1" || txt("id", "high") !== "5" || txt("id", "mean") !== "3" || txt("id", "distinct") !== "5") return `id: ${txt("id", "low")} ${txt("id", "high")} ${txt("id", "mean")}`;
if (warn("id").join("|") !== "Likely an id: every row has its own value.") return `id warnings: ${warn("id")}`;
// balance: 0.1 + 0.2 + 12.50 + 1200 + 1000.25 = 2213.05; / 5 = 442.61, exactly, from floats, a decimal, an int and text.
if (txt("balance", "type") !== "Decimal" || txt("balance", "mean") !== "442.61" || txt("balance", "low") !== "0.1" || txt("balance", "high") !== "1200") return `balance: ${txt("balance", "type")} ${txt("balance", "mean")} ${txt("balance", "low")} ${txt("balance", "high")}`;
if (warn("balance").join("|") !== "Numbers kept as text in 1 row.") return `balance warnings: ${warn("balance")}`;
// note: 4 of 5 missing, spaces count as missing.
if (txt("note", "missing") !== "80% (4 of 5)" || txt("note", "type") !== "Text") return `note: ${txt("note", "missing")}`;
if (warn("note")[0] !== "Mostly empty: 80% of rows have no value.") return `note warnings: ${warn("note")}`;
if (txt("note", "shortest") !== "called back") return `note shortest: ${txt("note", "shortest")}`;
// country: one value.
if (warn("country").join("|") !== 'One value only: every filled row says "UK".') return `country: ${warn("country")}`;
// age: 36, 41, 41, 72, 83: 273 / 5 = 54.6, and 41 and "41" are one value.
if (txt("age", "mean") !== "54.6" || txt("age", "distinct") !== "4" || txt("age", "type") !== "Integer") return `age: ${txt("age", "mean")} ${txt("age", "distinct")}`;
const topAge = card("age").querySelector(".ui-dprof-top li").textContent;
if (topAge !== "412 · 40%") return `age's commonest: ${topAge}`;
if (warn("age").join("|") !== "Numbers kept as text in 1 row.") return `age warnings: ${warn("age")}`;
// tag: strings, numbers and a boolean.
if (txt("tag", "type") !== "Mixed" || warn("tag")[0] !== "Mixed types: 3 text values, 1 whole number, 1 yes/no value.") return `tag: ${warn("tag")}`;
// joined: dates, one missing.
if (txt("joined", "type") !== "Date" || txt("joined", "low") !== "2025-12-31" || txt("joined", "high") !== "2026-03-20" || txt("joined", "missing") !== "20% (1 of 5)") return `joined: ${txt("joined", "low")} ${txt("joined", "high")}`;
// city: case, and the shortest and longest.
if (warn("city").join("|") !== "Some values differ only by case, such as Paris and paris.") return `city: ${warn("city")}`;
if (txt("city", "shortest") !== "London" || txt("city", "longest") !== "New York") return `city lengths: ${txt("city", "shortest")} ${txt("city", "longest")}`;
// name: spaces. zip: codes, not numbers, with a stand-in.
if (!warn("name").includes("1 value has spaces at the start or end.")) return `name: ${warn("name")}`;
if (txt("zip", "type") !== "Text") return `zip: ${txt("zip", "type")}`;
if (warn("zip").join("|") !== '1 value looks like a stand-in for nothing, such as "n/a".') return `zip warnings: ${warn("zip")}`;
// Filters.
const only = $("#data-profiler-demo-only");
only.click(); await wait();
if (box.querySelectorAll(".ui-dprof-card").length !== 9 || box.querySelector("[data-key=plan]")) return `only warned: ${box.querySelectorAll(".ui-dprof-card").length}`;
only.click(); await wait();
type($("#data-profiler-demo-find"), "NA"); await wait();
const names = [...box.querySelectorAll(".ui-dprof-card")].map((c) => c.dataset.key).join();
if (names !== "name") return `find a column: ${names}`;
type($("#data-profiler-demo-find"), ""); await wait();
// Awkward rows: non-records, unicode, nested, a number too large.
const bad = $("#data-profiler-demo-bad-find").closest(".ui-dprof");
if (bad.querySelector(".ui-dprof-sum").textContent.replace(/\s+/g, " ").trim().slice(0, 18) !== "3 rows, 3 columns,") return `awkward: ${bad.querySelector(".ui-dprof-sum").textContent}`;
if (bad.querySelector(".ui-dprof-note").textContent !== "2 items are not a record, and left out.") return bad.querySelector(".ui-dprof-note").textContent;
const a = bad.querySelector("[data-key=a]");
if (a.querySelector(".ui-dprof-type").textContent !== "Mixed") return `a: ${a.querySelector(".ui-dprof-type").textContent}`;
if (bad.querySelector("[data-key=b] .ui-dprof-type").textContent !== "Nested") return "a list is nested";
if ([...bad.querySelector("[data-key=b] .ui-dprof-top").children][0].firstChild.textContent !== "[1,2]") return `nested as JSON: ${bad.querySelector("[data-key=b] .ui-dprof-top").textContent}`;
// 03:00 UTC, 05:00 UTC, and 23:30 at -05:00, which is 04:30 UTC.
const seen = $("#data-profiler-demo-times-find").closest(".ui-dprof").querySelector("[data-key=at]");
if (seen.querySelector(".ui-dprof-type").textContent !== "Date-time" || seen.querySelector("[data-stat=low]").textContent !== "2026-01-02 03:00") return `date-times: ${seen.textContent}`;
if (seen.querySelector("[data-stat=high]").textContent !== "2026-01-02T05:00:00Z") return `latest: ${seen.querySelector("[data-stat=high]").textContent}`;
// Nothing: says so.
const none = $("#data-profiler-demo-empty-title").closest(".ui-dprof");
if (none.querySelector(".ui-dprof-empty")?.textContent !== "No rows to profile." || none.querySelector(".ui-dprof-card")) return "empty rows";
// on_select, by keyboard's click on the column's button.
const live = $("#data-profiler-demo-live-find").closest(".ui-dprof");
const btn = live.querySelector(".ui-dprof-name");
btn.focus(); btn.click(); await wait();
if (btn.getAttribute("aria-pressed") !== "true") return "picked column";
const note = live.closest(".demo-stack").querySelector(":scope > .demo-note, .demo-note").textContent;
if (note !== "on_select: plan, 2 distinct, commonest free.") return `on_select: ${note}`;
