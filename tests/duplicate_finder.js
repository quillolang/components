const c = $("#duplicate-finder-demo-level").closest(".ui-dupfind");
const sum = () => c.querySelector(".ui-dupfind-sum").textContent.replace(/\s+/g, " ").trim();
const groups = () => [...c.querySelectorAll(".ui-dupfind-group")].map((g) => [...g.querySelectorAll("tbody tr")].map((r) => r.dataset.row).join(""));
const legends = () => [...c.querySelectorAll(".ui-dupfind-group legend")].map((l) => l.textContent);
const slide = async (v) => { const s = $("#duplicate-finder-demo-level"); type(s, v); await wait(); };
// At 80: Ada three ways (name word order, spacing, a missing city), and the accents fold.
// Row 0 and 2: name 100, email "ada com example" / "ada com example l": 2 edits of 17 is 88, city 100: (100+88+100)/3 = 96.
// Row 1 and 2: city empty in one so not counted: (100+88)/2 = 94. The group's least is 94.
if (groups().join() !== "012,56") return `groups at 80: ${groups()}`;
if (legends().join("|") !== "Group 1: 3 rows, 94% alike|Group 2: 2 rows, 100% alike") return `legends: ${legends()}`;
if (sum() !== "2 groups of likely duplicates among 8 rows, 3 to drop.") return `summary: ${sum()}`;
// Grace: 1 edit of 12 is 91, the email 100, New York / NYC 6 edits of 8 is 25: 216/3 = 72.
await slide(72);
if (groups().join() !== "012,34,56") return `groups at 72: ${groups()}`;
if (legends()[1] !== "Group 2: 2 rows, 72% alike") return `Grace: ${legends()[1]}`;
await slide(73);
if (groups().join() !== "012,56") return `groups at 73: ${groups()}`;
await slide(100);
if (groups().join() !== "01,56") return `groups at 100: ${groups()}`;
await slide(80);
// What differs is marked; what agrees is not.
const g1 = c.querySelector("[data-group='0']");
const marked = [...g1.querySelectorAll("tbody tr:first-child td")].map((t) => !!t.querySelector("mark"));
if (marked.join() !== "true,true,true") return `marks: ${marked}`;
const g2 = c.querySelector("[data-group='5']");
const row5 = [...g2.querySelectorAll("tbody tr:first-child td")].map((t) => !!t.querySelector("mark"));
if (row5.join() !== "true,false,false") return `marks in the accents group: ${row5}`;
if ([...g1.querySelectorAll("tbody tr")][1].querySelectorAll("td")[2].textContent !== "(empty)") return "an empty cell that differs says so";
// The fullest row is kept unless told otherwise; picking another moves the drop.
const kept = (g) => g.querySelector("input[type=radio]:checked").value;
if (kept(g1) !== "0" || !g1.querySelector("[data-row='0']").classList.contains("ui-dupfind-kept")) return `fullest: ${kept(g1)}`;
g1.querySelector("input[value='2']").click(); await wait();
if (kept(g1) !== "2" || !g1.querySelector("[data-row='0']").classList.contains("ui-dupfind-gone")) return "picking a row to keep";
if (JSON.parse(c.querySelector("input[name$=_dropped]").value).join() !== "0,1,6") return `dropped: ${c.querySelector("input[name$=_dropped]").value}`;
// Not duplicates keeps them all.
g2.querySelector(".ui-dupfind-skip input").click(); await wait();
if (sum() !== "2 groups of likely duplicates among 8 rows, 2 to drop.") return `not duplicates: ${sum()}`;
g2.querySelector(".ui-dupfind-skip input").click(); await wait();
// Fields: none says so; email alone. Row 0 and 2 are 88, Grace and Jose exact, Alan elsewhere.
const box = (k) => c.querySelector(`[data-field=${k}]`);
box("name").click(); await wait(); box("city").click(); await wait();
if (groups().join() !== "012,34,56") return `email alone: ${groups()}`;
box("email").click(); await wait();
if (c.querySelector("[role=alert]")?.textContent !== "Pick at least one field to compare." || groups().length) return "no field";
if (!c.querySelector(".ui-dupfind-go").disabled) return "Resolve with no groups";
box("name").click(); await wait(); box("email").click(); await wait(); box("city").click(); await wait();
if (groups().join() !== "012,56") return `back: ${groups()}`;
await slide(100); await slide(80);
// Resolve reports the rows, and rows in no group stay.
const live = $("#duplicate-finder-demo-live-level").closest(".ui-dupfind");
// "ann lee" / "anne lee": 1 edit of 8 is 87: under 90, so nothing; at 87 a group.
if (live.querySelectorAll(".ui-dupfind-group").length) return "live: 87% under the bar";
if (live.querySelector(".ui-dupfind-sum").textContent.trim() !== "No duplicates among 3 rows at 90%.") return live.querySelector(".ui-dupfind-sum").textContent;
type($("#duplicate-finder-demo-live-level"), 87); await wait();
const group = live.querySelector(".ui-dupfind-group");
group.querySelector("input[value='1']").click(); await wait();
live.querySelector(".ui-dupfind-go").click(); await wait();
const note = live.closest(".demo-stack").querySelector(".demo-stack .demo-note").textContent;
if (note !== "on_resolve: kept 2 (2, 3), dropped 1 (1).") return `on_resolve: ${note}`;
if (live.querySelector(".ui-dupfind-said").textContent !== "Kept 2 rows, dropped 1.") return live.querySelector(".ui-dupfind-said").textContent;
