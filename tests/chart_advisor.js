const c = $("#chart-advisor-demo-data").closest(".ui-chart-advisor");
const why = (s = c) => s.querySelector("[data-k=why]")?.textContent.replace(/\s+/g, " ").trim();
const chart = (s = c) => s.querySelector("svg")?.dataset.chart;
const name = (s = c) => s.querySelector("figcaption")?.textContent;
const none = (s = c) => s.querySelector(".ui-chart-advisor-none")?.textContent;
const bad = (s = c) => [...s.querySelectorAll(".ui-chart-advisor-problems li")].map((l) => l.textContent);
const barLabels = (s = c) => [...s.querySelectorAll("svg rect title")].map((t) => t.textContent);
const box = $("#chart-advisor-demo-data");
const x = () => $("#chart-advisor-demo-x"), y = () => $("#chart-advisor-demo-y");
const radio = (v, s = c) => s.querySelector(`input[type=radio][value=${v}]`);
const paste = async (t) => { type(box, t); await wait(); };
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(); };
// A date and a number: a line, in date order, and it says why.
if (chart() !== "line" || why() !== "Line. A date and a number: a line shows how revenue moves over month.") return `date: ${chart()} ${why()}`;
if (name() !== "Revenue by month") return `name: ${name()}`;
if (!radio("line").checked || !radio("scatter").disabled || !radio("bar").checked === false) return "the radios";
if (c.querySelectorAll("circle").length !== 6) return `six points: ${c.querySelectorAll("circle").length}`;
const titles = [...c.querySelectorAll("svg circle title")].map((t) => t.textContent);
if (titles[0] !== "2026-01-01: 120" || titles[5] !== "2026-06-01: 205") return `points: ${titles}`;
// Ticks by hand: a span of 90 in about four steps is steps of 25, from 100 to 225.
const ticks = [...c.querySelectorAll('svg text[text-anchor="end"]')].map((t) => t.textContent).filter((t) => /^\d+$/.test(t));
if (ticks.join(" ") !== "100 125 150 175 200 225") return `ticks: ${ticks}`;
if (c.querySelector("svg").getAttribute("aria-label") !== "Revenue by month: a line of 6 points.") return "the chart's words";
if (c.querySelector("table caption").textContent !== "Revenue by month" || c.querySelectorAll("table tbody tr").length !== 6) return "a table for screen readers";
if (radio("line").name !== "chart" || x().name !== "x" || y().name !== "y") return "field names";
// Out of order dates are put in order.
await paste('[{"d":"2026-03-01","n":3},{"d":"2026-01-01","n":1},{"d":"2026-02-01","n":2}]');
if ([...c.querySelectorAll("svg circle title")].map((t) => t.textContent).join(" | ") !== "2026-01-01: 1 | 2026-02-01: 2 | 2026-03-01: 3") return "date order";
// A category and a number: bars, largest first, repeats added.
await paste("fruit,kilos\nApple,10\nPear,30\nPlum,5\nApple,15");
if (chart() !== "bar" || why() !== "Bars. A category and a number: bars compare kilos across 3 fruits.") return `category: ${chart()} ${why()}`;
if (barLabels().join(" | ") !== "Pear: 30 | Apple: 25 | Plum: 5") return `bars: ${barLabels()}`;
// A rate is averaged, and the title says so.
await paste("shop,conversion_rate\nA,10\nB,4\nA,20");
if (name() !== "Average conversion rate by shop" || barLabels().join(" | ") !== "A: 15 | B: 4") return `averaged: ${name()} ${barLabels()}`;
// Past twelve the rest are gathered.
await paste("k,v\n" + Array.from({ length: 15 }, (_, i) => `k${i},${100 - i}`).join("\n"));
if (c.querySelectorAll("svg rect").length !== 13 || barLabels()[12] !== "Other (3): 261") return `other: ${barLabels()[12]}`;
// Negative values sit left of zero, with no bar of no width lost.
await paste("k,v\na,-10\nb,10\nc,0");
const rects = [...c.querySelectorAll("svg rect")].map((r) => Number(r.getAttribute("x")));
if (rects[2] >= rects[0] || barLabels().join(" | ") !== "b: 10 | c: 0 | a: -10") return `negative: ${rects} ${barLabels()}`;
// Two numbers: a scatter.
await paste("height,weight\n150,50\n160,55\n170,70\n180,80\n190,95");
if (chart() !== "scatter" || why() !== "Scatter. Two numbers: a scatter shows whether height and weight go together.") return `two: ${chart()} ${why()}`;
if (name() !== "Weight against height" || c.querySelectorAll("svg circle").length !== 5) return `scatter: ${name()}`;
// One number: a histogram; eight values make four bins of 4 + 1.
await paste("x\n1\n2\n2\n3\n3\n3\n4\n10");
if (chart() !== "histogram" || !why().startsWith("Histogram. One number:")) return `one: ${chart()} ${why()}`;
const bins = [...c.querySelectorAll("svg rect title")].map((t) => t.textContent.split(": ")[1]).join(" ");
if (bins !== "6 1 0 1") return `bins: ${bins}`;
// All the same value is one bin and no division by zero.
await paste("x\n5\n5\n5");
if (chart() !== "histogram" || c.querySelectorAll("svg rect").length !== 1 || !c.querySelector("svg rect title").textContent.endsWith(": 3")) return "one value";
// Categories alone are counted; dates alone too.
await paste("colour\nred\nblue\nred\nred\ngreen");
if (chart() !== "bar" || !why().startsWith("Bars. A category alone") || barLabels().join(" | ") !== "red: 3 | blue: 1 | green: 1") return `counts: ${why()} ${barLabels()}`;
await paste("day\n2026-01-01\n2026-01-02\n2026-01-02\n2026-01-03");
if (chart() !== "line" || !why().startsWith("Line. Dates alone")) return `dates alone: ${why()}`;
// Month names keep the year's order; a year is time and not a number.
await paste("month,sales\nMarch,3\nJanuary,1\nFeb,2");
if (chart() !== "line" || c.querySelector("svg circle title").textContent !== "January: 1") return `months: ${chart()}`;
await paste("year,sales\n2024,3\n2022,1\n2023,2");
if (chart() !== "line" || c.querySelector("svg circle title").textContent !== "2022: 1") return `years: ${chart()}`;
// An id is no measure; a date with two values is no line.
await paste("id,region,amount\n1,North,5\n2,South,9\n3,East,7\n4,West,2\n5,North,1");
if (chart() !== "bar" || name() !== "Amount by region") return `id: ${chart()} ${name()}`;
await paste("when,where,n\n2026-01-01,a,1\n2026-01-02,b,2\n2026-01-01,c,3");
if (chart() !== "bar" || !why().includes("across 3 wheres")) return `few dates: ${chart()} ${why()}`;
// The reader switches, and what cannot be drawn says why.
await paste("shop,sales,staff\nA,340,6\nB,280,5\nC,120,2\nD,150,3");
if (chart() !== "bar") return "bar first";
radio("line").click(); await wait();
if (chart() !== "line" || c.querySelector("[data-k=note]")?.textContent !== "A line says that one point leads to the next, and shop has no order of that kind.") return `line of categories: ${chart()} ${c.querySelector("[data-k=note]")?.textContent}`;
if (!c.querySelector(".ui-chart-advisor-button")) return "no way back to the advice";
radio("histogram").click(); await wait();
if (chart() !== "histogram" || c.querySelector("[data-k=note]")) return `histogram: ${chart()}`;
if (!radio("scatter").disabled || !radio("scatter").closest("label").textContent.includes("not for this data")) return "scatter refused while across is a category";
await pick(x(), "staff");
if (radio("scatter").disabled) return "scatter is on for two numbers";
radio("scatter").click(); await wait();
if (chart() !== "scatter" || name() !== "Sales against staff") return `switched: ${chart()} ${name()}`;
await pick(y(), "");
if (chart() !== "bar" || c.querySelector("[data-k=refused]")?.textContent !== "A scatter needs two columns of numbers. Showing the advice instead.") return `refused: ${chart()} ${c.querySelector("[data-k=refused]")?.textContent}`;
c.querySelector(".ui-chart-advisor-button").click(); await wait();
if (chart() !== "bar" || name() !== "Sales by shop" || c.querySelector(".ui-chart-advisor-button") || x().value !== "shop" || y().value !== "sales") return `back: ${chart()} ${name()}`;
// Empty values are counted.
await paste("a,b\nx,1\ny,\nz,3");
if (c.querySelector(".ui-chart-advisor-small")?.textContent !== "1 row with an empty value left out.") return `blanks: ${c.querySelector(".ui-chart-advisor-small")?.textContent}`;
// A scatter of many is thinned, evenly.
await paste("a,b\n" + Array.from({ length: 2500 }, (_, i) => `${(i * 37) % 101},${(i * 53) % 97}`).join("\n"));
if (chart() !== "scatter" || c.querySelectorAll("svg circle").length !== 834 || !c.querySelector(".ui-chart-advisor-small").textContent.includes("Showing 834 of 2500 points")) return `thinned: ${c.querySelectorAll("svg circle").length}`;
// Bad input.
await paste("[1, 2,");
if (bad()[0] !== "That is not valid JSON: look for a missing comma, bracket or quote." || none() !== "Nothing to chart yet." || c.querySelector("svg")) return `bad JSON: ${bad()} ${none()}`;
await paste('{"a": 1}');
if (!bad()[0].startsWith("The JSON must be a list of rows")) return `a map: ${bad()}`;
await paste("   ");
if (none() !== "Nothing to chart yet.") return `blank: ${none()}`;
await paste('[{"a":[1]},{"a":{"b":2}},{"a":null}]');
if (bad().length || !chart()) return `odd values: ${bad()} ${chart()}`;
await paste("a,b\n1\n2");
if (!bad()[0].startsWith("2 rows do not have 2 fields")) return `short rows: ${bad()}`;
await paste('[{"a":""},{"a":"  "}]');
if (none() !== "No column here can be charted.") return `empties: ${none()}`;
await paste('nombre,valor\n"Sevilla, Ñ",3\n<b>x</b>,5\n🐟,2');
if (!barLabels().includes("<b>x</b>: 5") || c.querySelector("svg b")) return `escaping: ${barLabels()}`;
// One row still draws.
await paste("a,b\nx,1");
if (chart() !== "bar") return `one row: ${chart()}`;
// Long input stays quick, and is capped.
const t0 = performance.now();
await paste("a,b,c\n" + Array.from({ length: 5200 }, (_, i) => `k${i % 50},${i % 97},${i % 13}`).join("\n"));
if (performance.now() - t0 > 2500) return `slow: ${performance.now() - t0}`;
if (![...c.querySelectorAll(".ui-chart-advisor-small")].some((s) => s.textContent.includes("Only the first 5000 rows are read; 200 more were left out."))) return "the cap";
// The callback and the prefix.
const live = $("#chart-advisor-demo-live-data").closest(".ui-chart-advisor");
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (radio("bar", live).name !== "shops_chart") return "the prefix";
radio("line", live).click(); await wait();
if (seen() !== "on_change: line of sales by shop, advised bar.") return `on_change: ${seen()}`;
type($("#chart-advisor-demo-live-data"), ""); await wait();
if (seen() !== "on_change: nothing to chart.") return `on_change empty: ${seen()}`;
