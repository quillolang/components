const c = $("#auto-insights-demo-data").closest(".ui-auto-insights");
const said = (s = c) => [...s.querySelectorAll("[data-k=text]")].map((t) => t.textContent);
const kinds = (s = c) => [...s.querySelectorAll("[data-kind]")].map((t) => t.dataset.kind + " " + t.querySelector("[data-k=strength]").textContent.split(": ")[1]);
const none = (s = c) => s.querySelector(".ui-auto-insights-none")?.textContent;
const bad = (s = c) => [...s.querySelectorAll(".ui-auto-insights-problems li")].map((l) => l.textContent);
const box = $("#auto-insights-demo-data"), bar = $("#auto-insights-demo-strength");
const paste = async (t) => { type(box, t); await wait(); };
const pick = async (v) => { bar.value = v; bar.dispatchEvent(new Event("change", { bubbles: true })); await wait(); };
// Worked out in Python: revenue z 48.5 and ad spend z 23.6 are capped at 100; r 0.9985, low end 0.9936.
// Share of revenue 48.6%: (.486 - .1) / .9 = 43; top 2 hold 55.3%: (.553 - .2) / .8 = 44. Ad spend's share 47.5%: 42; top 2 55.4%: 44.
if (kinds().join(", ") !== "highest 100, highest 100, correlated 99, concentration 44, concentration 44, share 43, share 42") return `order: ${kinds()}`;
const s = said();
if (s[0] !== "East has the highest revenue at 9,400, 8.4 times the median of 1,125.") return `high: ${s[0]}`;
if (s[1] !== "East has the highest ad spend at 900, 8.0 times the median of 112.5.") return `high 2: ${s[1]}`;
if (s[2] !== "Revenue and ad spend move together (r = 1.00 across 10 rows).") return `r: ${s[2]}`;
if (!s.includes("East is 48.6% of total revenue (9,400 of 19,350).") || !s.includes("The top 2 of 10 hold 55.3% of revenue.")) return `shares: ${s}`;
// The low end is weak (z -1.3, 18 of 100), and the ratings say nothing, so they are not said; nor a rating's share.
if (s.some((t) => t.includes("lowest") || t.includes("rating"))) return `weak things said: ${s}`;
if (c.querySelector(".ui-auto-insights-seen").textContent !== "Read 10 rows and 3 columns of numbers.") return c.querySelector(".ui-auto-insights-seen").textContent;
if (box.name !== "data" || bar.name !== "strength" || !bar.labels[0].textContent.startsWith("Say")) return "fields";
// The bar: only the strongest drops the shares.
await pick("60");
if (kinds().join(", ") !== "highest 100, highest 100, correlated 99") return `at 60: ${kinds()}`;
await pick("25");
if (!kinds().every((k) => Number(k.split(" ")[1]) >= 25) || kinds().length !== 8) return `at 25: ${kinds()}`;
await pick("40");
// Nothing strong: an even table says nothing at all.
const even = [["a", 100, 7], ["b", 101, 3], ["c", 99, 9], ["d", 100, 2], ["e", 102, 6], ["f", 98, 5], ["g", 100, 8], ["h", 101, 1]];
await paste("name,sales,visits\n" + even.map((r) => r.join(",")).join("\n"));
if (none() !== "Nothing stands out here, so nothing is said." || said().length) return `even: ${none()} ${said()}`;
// Flat columns divide by nothing.
await paste("name,x\na,5\nb,5\nc,5\nd,5\ne,5\nf,5");
if (none() !== "Nothing stands out here, so nothing is said.") return `flat: ${none()}`;
// A biggest change, ordered by date whatever the row order, with a rate column left unsummed.
await paste('[{"day":"2026-03-04","sold":103},{"day":"2026-03-01","sold":100},{"day":"2026-03-03","sold":98},{"day":"2026-03-02","sold":104},{"day":"2026-03-05","sold":310},{"day":"2026-03-06","sold":305},{"day":"2026-03-07","sold":312}]');
if (!said().some((t) => t === "Sold rose 201.0% from 4 Mar 2026 to 5 Mar 2026 (103 to 310), its biggest move.")) return `change: ${said()}`;
// A fall, and a move out of nothing.
await paste("day,n\n2026-01-01,50\n2026-01-02,52\n2026-01-03,49\n2026-01-04,51\n2026-01-05,1\n2026-01-06,50\n2026-01-07,48");
if (!said().some((t) => t.startsWith("N fell 98.0% from 4 Jan 2026 to 5 Jan 2026 (51 to 1)"))) return `fall: ${said()}`;
await paste("day,n\n2026-01-01,0\n2026-01-02,0\n2026-01-03,0\n2026-01-04,0\n2026-01-05,0\n2026-01-06,500\n2026-01-07,480");
if (!said().some((t) => t.startsWith("N rose from 5 Jan 2026 to 6 Jan 2026 (0 to 500)"))) return `from zero: ${said()}`;
// Correlation the other way; an id and a counting column are not figures.
await paste("id,a,b\n" + [[1, 1, 9], [2, 2.5, 8.1], [3, 3, 7], [4, 4.2, 5.9], [5, 5, 5], [6, 6, 4.1], [7, 7.1, 3], [8, 8, 2.2], [9, 9, 1], [10, 10, 0.1], [11, 11.3, -1], [12, 12, -2]].map((r) => r.join(",")).join("\n"));
if (!said().some((t) => t.startsWith("A and b move in opposite directions (r = -1.00 across 12 rows)"))) return `opposite: ${said()}`;
if (c.querySelector(".ui-auto-insights-seen").textContent !== "Read 12 rows and 2 columns of numbers.") return `id counted: ${c.querySelector(".ui-auto-insights-seen").textContent}`;
// Few rows cannot show a correlation: five is not enough.
await paste("a,b\n1,2\n2,4\n3,6\n4,8\n5,10");
if (said().some((t) => t.includes("move together"))) return `five rows: ${said()}`;
// Rows sharing a name are added; money with signs and commas reads; totals are exact.
await paste('name;amount\nA;"$1,000.10"\nB;$100.20\nA;"$1,000.20"\nC;$100.30\nD;$100.40');
if (!said().some((t) => t === "A is 86.9% of total amount (2,000.3 of 2,301.2).")) return `gathered: ${said()}`;
// A rate is averaged, and has no share.
await paste("name,conversion_rate\nA,10\nA,20\nB,1\nC,1\nD,1\nE,1");
if (said().some((t) => t.includes("of total"))) return `a rate's share: ${said()}`;
if (!said().some((t) => t.startsWith("A has the highest conversion rate at 15"))) return `a rate averaged: ${said()}`;
// Negative numbers have no share.
await paste("name,profit\nA,-500\nB,100\nC,110\nD,90\nE,120\nF,105");
if (said().some((t) => t.includes("of total") || t.includes("hold"))) return `negative: ${said()}`;
if (!said().some((t) => t.startsWith("A has the lowest profit at -500, against a median of 102.5."))) return `lowest: ${said()}`;
// Tabs, quotes around commas, unicode, a short row.
await paste('nombre\tventas\n"Sevilla, Ñ"\t900\nCádiz\t10\nJaén\t11\nLeón\t12\nVigo 🐟\t13\nÁvila\t9');
if (!said().some((t) => t.startsWith("Sevilla, Ñ has the highest ventas"))) return `tabs: ${said()}`;
await paste("a,b\n1,2\n3\n5,6\n7,8");
if (bad()[0] !== "1 row does not have 2 fields, so left out (first at row 3).") return `short row: ${bad()}`;
// Bad input.
await paste("[1, 2,");
if (bad()[0] !== "That is not valid JSON: look for a missing comma, bracket or quote." || none() !== "Nothing to read yet.") return `bad JSON: ${bad()} ${none()}`;
await paste('{"a": 1}');
if (!bad()[0].startsWith("The JSON must be a list of rows")) return `a map: ${bad()}`;
await paste('[1, "x", {"a": 1}]');
if (bad()[0] !== "2 items are not a row, so left out.") return `items: ${bad()}`;
await paste("[]");
if (none() !== "Nothing to read yet.") return `empty list: ${none()}`;
await paste("   \n ");
if (none() !== "Nothing to read yet." || bad().length) return `blank: ${none()}`;
await paste("a\nb\nc\nd\ne");
if (none() !== "No columns of numbers to look at.") return `text only: ${none()}`;
await paste("a,b\nx,1\ny,2");
if (none() !== "Too few rows to tell what stands out: at least 3 are needed.") return `few: ${none()}`;
await paste('[{"a":1e308},{"a":null},{"a":true},{"a":[1]},{"a":{"b":2}}]');
if (bad().length) return `odd values: ${bad()}`;
// Large input stays quick, and is capped.
const big = "a,b,c,d,e\n" + Array.from({ length: 2500 }, (_, i) => [i % 97, i % 89, i % 83, i % 79, i % 73].join(",")).join("\n");
const t0 = performance.now();
await paste(big);
if (performance.now() - t0 > 2500) return `slow: ${performance.now() - t0}`;
if (!c.querySelector(".ui-auto-insights-seen").textContent.includes("leaving out 500 more rows")) return `cap: ${c.querySelector(".ui-auto-insights-seen").textContent}`;
await paste("x".repeat(200100));
if (bad()[0] !== "Only the first 200,000 characters are read.") return `very long: ${bad()}`;
// The second: dates as labels, the callback and the prefix.
const live = $("#auto-insights-demo-live-data").closest(".ui-auto-insights");
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#auto-insights-demo-live-data").name !== "signups_data") return "the prefix";
const n = said(live).length;
const lb = $("#auto-insights-demo-live-strength");
lb.value = "25"; lb.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (seen() !== `on_change: ${said(live).length} said.` || said(live).length < n) return `on_change: ${seen()} ${said(live).length}`;
