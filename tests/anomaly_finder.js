const c = $("#anomaly-finder-demo-level").closest(".ui-anomaly-finder");
const finds = (s = c) => [...s.querySelectorAll(".ui-anomaly-finder-list li")].map((l) => [l.dataset.kind, l.children[2].textContent]);
const say = (s = c) => s.querySelector(".ui-anomaly-finder-say")?.textContent;
const note = (s = c) => [...s.querySelectorAll(".ui-anomaly-finder-note")].map((n) => n.textContent).join(" | ");
const bad = (s = c) => [...s.querySelectorAll(".ui-anomaly-finder-problems li")].map((n) => n.textContent);
const box = $("#anomaly-finder-demo-series"), level = $("#anomaly-finder-demo-level");
const paste = async (text) => { type(box, text); await wait(); };
const slide = async (v) => { level.value = v; level.dispatchEvent(new Event("input", { bubbles: true })); await wait(); };
// Worked out apart: levels 100 then 150; residual MAD 1, so 180 is 0.6745 × 80 = 53.96 deviations.
const f = finds();
if (say() !== "Found 1 outlier, 1 level shift, 1 gap.") return `summary: ${say()} ${JSON.stringify(f)}`;
if (f[0][0] !== "outlier" || f[0][1] !== "180 at 2026-01-10 is 54.0 deviations above the median of 100; the limit is 3.5.") return `outlier: ${f[0]}`;
if (f[1][0] !== "shift" || f[1][1] !== "The level moved from 100 to 150 at 2026-01-16 (up 50.0%), and stayed there.") return `shift: ${f[1]}`;
if (f[2][0] !== "gap" || f[2][1] !== "Nothing between 2026-01-21 and 2026-01-25: about 3 points are missing.") return `gap: ${f[2]}`;
// The chart marks each of them.
if (c.querySelectorAll(".ui-anomaly-finder-dot").length !== 1 || c.querySelectorAll(".ui-anomaly-finder-shift").length !== 1 || c.querySelectorAll(".ui-anomaly-finder-gap").length !== 1) return "marks on the chart";
if (c.querySelector("svg").getAttribute("aria-label") !== "Line chart of 27 values. Found 1 outlier, 1 level shift, 1 gap.") return `chart's words: ${c.querySelector("svg").getAttribute("aria-label")}`;
// The line breaks at the gap: two moves, the second after the three missing days.
if ((c.querySelector(".ui-anomaly-finder-line").getAttribute("d").match(/M/g) ?? []).length !== 2) return "the line does not break at the gap";
if (c.querySelector(".ui-anomaly-finder-axis").textContent !== "2026-01-0197 to 1802026-01-30" && !c.querySelector(".ui-anomaly-finder-axis").textContent.includes("97 to 180")) return "the axis";
if (level.name !== "sensitivity" || box.name !== "series" || !level.labels[0].textContent.includes("3.5")) return "fields";
// Sensitivity moves the verdict: with a MAD of 1, a 3 away from its level is 2.02 deviations.
await slide("2");
if (c.querySelectorAll(".ui-anomaly-finder-dot").length !== 4 || !level.labels[0].textContent.includes("2.0")) return `at 2: ${say()}`;
await slide("8");
if (say() !== "Found 1 outlier, 1 level shift, 1 gap.") return `at 8: ${say()}`;
await slide("3.5");
// A flat series with one odd value: the MAD is 0, and the mean deviation stands in.
await paste("10\n10\n10\n10\n10\n10\n10\n10\n10\n20");
// mean deviation 1, so 10 / 1.253314 = 7.98.
if (finds()[0]?.[1] !== "20 at point 10 is 8.0 deviations above the median of 10; the limit is 3.5.") return `MAD 0: ${finds()}`;
// Perfectly flat: nothing to find, and no division by zero.
await paste("5\n5\n5\n5\n5\n5\n5\n5");
if (say() !== "Nothing odd in this series." || finds().length) return `flat: ${say()}`;
// A steady ramp is neither shifted nor outlying.
await paste(Array.from({ length: 40 }, (_, i) => String(100 + 5 * i)).join("\n"));
if (say() !== "Nothing odd in this series.") return `ramp: ${say()} ${JSON.stringify(finds())}`;
// A two-point spike has not moved the level.
await paste([100, 101, 99, 100, 102, 98, 100, 101, 400, 410, 99, 100, 101, 99, 100, 102, 98, 100].join("\n"));
if (finds().some(([k]) => k === "shift") || finds().filter(([k]) => k === "outlier").length !== 2) return `spike: ${JSON.stringify(finds())}`;
// Falling level, in reverse, says down.
await paste([...Array(12).fill(200), ...Array(12).fill(100)].map((v, i) => v + (i % 3)).join("\n"));
if (!finds().some(([k, t]) => k === "shift" && t === "The level moved from 201 to 101 at point 13 (down 49.8%), and stayed there.")) return `down: ${JSON.stringify(finds())}`;
// Empty values are gaps.
await paste("a, 1\nb, 2\nc,\nd, null\ne, 3\nf, 2\ng, 1\nh, 2");
if (finds()[0]?.[1] !== "No value for 2 points, c to d." || say() !== "Found 1 gap.") return `empty values: ${JSON.stringify(finds())}`;
if ((c.querySelector(".ui-anomaly-finder-line").getAttribute("d").match(/M/g) ?? []).length !== 2) return "the line breaks at empty values";
await paste("a, 1\nb, 2\nc,\nd, 3\ne, 3\nf, 2\ng, 1\nh, 2");
if (finds()[0]?.[1] !== "No value at c.") return `one empty: ${JSON.stringify(finds())}`;
// Bad lines are named and skipped; a heading is not bad.
await paste("date, value\n2026-01-01, 5\n2026-01-02, abc\n2026-01-03, 6\n2026-01-04, ٧\n2026-01-05, 7\n2026-01-06, 6\n2026-01-07, 5\n2026-01-08, 6\n2026-01-09, 5\n2026-01-10, 6");
if (bad()[0] !== 'Line 3: "abc" is not a number, so it is skipped.' || bad().length !== 2) return `bad lines: ${bad()}`;
// A skipped line leaves its two days as a gap in time.
if (!finds().some(([k, t]) => k === "gap" && t.startsWith("Nothing between 2026-01-01 and 2026-01-03"))) return `gap from a bad line: ${JSON.stringify(finds())}`;
await paste("x\ny\nz\nw\nv\nu\nt\ns\nr");
if (bad().length !== 7 || bad()[6] !== "And 2 more lines like these." || note() !== "Paste a series to look at.") return `all bad: ${bad()} ${note()}`;
// Too few, none, whitespace.
await paste("1\n2\n3");
if (note() !== "Too few values to judge: at least 5 are needed, and there are 3.") return `few: ${note()}`;
await paste("7");
if (note() !== "Too few values to judge: at least 5 are needed, and there is 1.") return `one: ${note()}`;
await paste("   \n \t \n");
if (note() !== "Paste a series to look at." || c.querySelector("svg")) return `blank: ${note()}`;
await paste("");
if (note() !== "Paste a series to look at.") return `empty: ${note()}`;
// Out of order, repeated dates.
await paste("2026-01-05, 1\n2026-01-01, 2\n2026-01-03, 1\n2026-01-03, 2\n2026-01-04, 1");
if (!note().includes("out of order")) return `order: ${note()}`;
// Very long input stays quick, and is capped.
const t0 = performance.now();
await paste(Array.from({ length: 2500 }, (_, i) => String(50 + (i * 7919) % 13)).join("\n"));
if (performance.now() - t0 > 1500) return `slow: ${performance.now() - t0}`;
if (!note().includes("Only the first 2000 points are used; 500 more were left out.")) return `cap: ${note()}`;
await paste("1\n1e400\n2\n3\n4\n5\n99999999999999999999");
if (bad().length !== 2) return `huge numbers: ${bad()}`;
// The second: numbers alone, the prefix and the callback. MAD 7, 135.7 deviations.
const live = $("#anomaly-finder-demo-live-level").closest(".ui-anomaly-finder");
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (finds(live)[0][1] !== "2,210 at point 4 is 135.7 deviations above the median of 802; the limit is 5.0.") return `numbers: ${finds(live)}`;
if ($("#anomaly-finder-demo-live-series").name !== "traffic_series") return "the prefix";
const ll = $("#anomaly-finder-demo-live-level");
ll.value = "2"; ll.dispatchEvent(new Event("input", { bubbles: true })); await wait();
if (seen() !== "on_change: 1 found.") return `on_change: ${seen()}`;
