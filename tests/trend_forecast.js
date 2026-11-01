const c = $("#trend-forecast-demo-level").closest(".ui-trend-forecast");
const fact = (k, s = c) => s.querySelector(`[data-k=${k}] dd`)?.textContent;
const say = (s = c) => s.querySelector(".ui-trend-forecast-say")?.textContent;
const warns = (s = c) => [...s.querySelectorAll(".ui-trend-forecast-warn")].map((w) => w.textContent);
const note = (s = c) => [...s.querySelectorAll(".ui-trend-forecast-note")].map((w) => w.textContent).join(" | ");
const row = (h, s = c) => [...s.querySelectorAll(`tr[data-h="${h}"] td`)].map((t) => t.textContent);
const box = $("#trend-forecast-demo-series"), hz = $("#trend-forecast-demo-horizon"), per = $("#trend-forecast-demo-period"), lev = $("#trend-forecast-demo-level");
const paste = async (t) => { type(box, t); await wait(); };
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(); };
// Sales repeat every 4 months on a rising line.
if (fact("period") !== "Every 4") return `period: ${fact("period")}`;
if (say() !== `Rising by ${fact("slope").slice(0, -1)} a step, repeating every 4 steps.`) return `say: ${say()} ${fact("slope")}`;
if (Number(fact("r2")) < 0.98) return `r2: ${fact("r2")}`;
if (row(1)[0] !== "2025-05-01" || row(4)[0] !== "2025-08-01") return `dated by the month: ${row(1)[0]} ${row(4)[0]}`;
if (warns().length) return `a good fit has no warnings: ${warns()}`;
if (!c.querySelector(".ui-trend-forecast-band") || !c.querySelector(".ui-trend-forecast-ahead")) return "the band or the forecast is not drawn";
if (hz.name !== "horizon" || per.name !== "period" || lev.name !== "confidence" || !hz.labels[0].textContent.includes("Steps ahead")) return "fields";
// An exact line: 10 + 2x, with no error: R² is 1 and the band has no width.
await pick(per, "none");
await paste([10, 12, 14, 16, 18, 20, 22, 24, 26, 28].join("\n"));
if (fact("slope") !== "2.000" || fact("r2") !== "1.000" || fact("error") !== "0") return `line: ${fact("slope")} ${fact("r2")} ${fact("error")}`;
type(hz, "3"); await wait();
if (row(1).join(" ") !== "+1 30 30 30" || row(3).join(" ") !== "+3 34 34 34") return `exact forecast: ${row(1)} / ${row(3)}`;
if (say() !== "Rising by 2 a step, with no repeating pattern.") return `say: ${say()}`;
// A falling line, and a pattern found: 100 - 3x + [10, -5, -5, 0].
await pick(per, "auto");
const s = [10, -5, -5, 0];
await paste(Array.from({ length: 24 }, (_, i) => String(100 - 3 * i + s[i % 4])).join("\n"));
if (fact("period") !== "Every 4" || fact("slope") !== "-3.000" || fact("r2") !== "1.000") return `pattern: ${fact("period")} ${fact("slope")} ${fact("r2")}`;
// x = 24, 25, 26 are 100 - 72 + 10 = 38, 20, 17.
if (row(1)[1] !== "38" || row(2)[1] !== "20" || row(3)[1] !== "17") return `seasonal forecast: ${row(1)} ${row(2)} ${row(3)}`;
if (say() !== "Falling by 3 a step, repeating every 4 steps.") return `say: ${say()}`;
// The same with a period turned off is a poorer fit: the pattern was real.
await pick(per, "none");
if (fact("period") !== "None" || Number(fact("r2")) >= 1) return `off: ${fact("r2")}`;
// A period picked that does not fit in the data.
await pick(per, "24");
if (note() !== "A pattern of 24 needs at least 48 values, so none is used." || fact("period") !== "None") return `too long: ${note()}`;
await pick(per, "auto");
// A pure sine has no trend, and a period of 12.
await paste(Array.from({ length: 36 }, (_, i) => String(Math.round(50 + 20 * Math.sin((2 * Math.PI * i) / 12)))).join("\n"));
if (fact("period") !== "Every 12" || !say().startsWith("Level") && !say().includes("repeating every 12")) return `sine: ${fact("period")} ${say()}`;
// Noise: no pattern where there is none; the worked numbers below.
const live = $("#trend-forecast-demo-live-level").closest(".ui-trend-forecast");
// By hand in Python: slope 0.5333, intercept 32.8, R² 0.0069, error 20.52, t(.95, 8) = 1.85955.
if (fact("slope", live) !== "0.533" || fact("r2", live) !== "0.007" || fact("error", live) !== "20.52") return `noise: ${fact("slope", live)} ${fact("r2", live)} ${fact("error", live)}`;
if (row(1, live).join(" ") !== "+1 38.13 -8.08 84.34" || row(3, live).join(" ") !== "+3 39.2 -11.73 90.13") return `band: ${row(1, live)} / ${row(3, live)}`;
if (warns(live)[0] !== "Poor fit: the trend explains only 0.7% of the variation. Treat this forecast as a rough guess.") return `poor: ${warns(live)}`;
if (fact("period", live) !== "None") return "no pattern asked for";
// Constant.
await paste("7\n7\n7\n7\n7\n7\n7\n7\n7");
if (say() !== "Flat: the series does not move." || fact("r2") !== "None" || fact("error") !== "0" || !warns()[0].startsWith("The values do not change")) return `flat: ${say()} ${fact("r2")} ${warns()}`;
if (row(1)[1] !== "7") return `flat forecast: ${row(1)}`;
// Few points: warned; exactly two degrees of freedom left.
await paste("1\n2\n4\n7");
if (!warns().includes("Only 4 values: a band from so few says little.")) return `few: ${warns()}`;
// Three points on a line have one degree of freedom left, and one more of none.
await paste("5\n9\n1");
if (fact("r2") == null || row(1)[2] === "") return `three points: ${fact("r2")} ${row(1)}`;
await paste("1\n2");
if (note() !== "Too few values: a trend needs at least 3, and there are 2.") return `two: ${note()}`;
await paste("5");
if (note() !== "Too few values: a trend needs at least 3, and there is 1.") return `one: ${note()}`;
await paste("  \n  ");
if (note() !== "Paste a series to fit." || c.querySelector("svg")) return `blank: ${note()}`;
// A gap in the data keeps its place: 10 + 2x with x = 3 missing; a blank line is no point at all.
await paste("10\n12\n14\nNA\n18\n20\n22\n24\n26\n28");
if (fact("slope") !== "2.000" || row(1)[1] !== "30") return `NA keeps its place: ${fact("slope")} ${row(1)}`;
// Falling toward nothing, and further ahead than behind.
await paste("30\n20\n10\n5\n4");
type(hz, "12"); await wait();
if (!warns().some((w) => w.startsWith("The forecast goes below 0")) || !warns().some((w) => w.startsWith("The forecast runs longer"))) return `warned: ${warns()}`;
// A bad horizon, bad lines.
for (const bad of ["0", "61", "abc", "2.5", "-1", ""]) {
    type(hz, bad); await wait();
    if (!c.textContent.includes("Steps ahead must be a whole number from 1 to 60.") || hz.getAttribute("aria-invalid") !== "true") return `horizon ${bad}`;
}
type(hz, "2"); await wait();
await paste("day, sales\n1, 10\n2, x\n3, 14\n4, 16\n5, 18");
if (c.querySelector(".ui-trend-forecast-problems li")?.textContent !== 'Line 3: "x" is not a number, so it is skipped.') return `bad line: ${c.querySelector(".ui-trend-forecast-problems")?.textContent}`;
// Dated by the day.
await paste("2026-01-01, 1\n2026-01-08, 2\n2026-01-15, 3\n2026-01-22, 4");
if (row(1)[0] !== "2026-01-29" || row(2)[0] !== "2026-02-05") return `weekly dates: ${row(1)[0]}`;
// Long input stays quick, and is capped.
const t0 = performance.now();
await paste(Array.from({ length: 1200 }, (_, i) => String(i + (i * 7919) % 13)).join("\n"));
if (performance.now() - t0 > 3000) return `slow: ${performance.now() - t0}`;
if (!note().includes("Only the first 1000 points are used; 200 more were left out.")) return `cap: ${note()}`;
// The callback and the prefix.
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#trend-forecast-demo-live-series").name !== "tickets_series") return "the prefix";
type($("#trend-forecast-demo-live-horizon"), "5"); await wait();
if (seen() !== "on_change: 5 steps.") return `on_change: ${seen()}`;
type($("#trend-forecast-demo-live-series"), "1"); await wait();
if (seen() !== "on_change: nothing to fit.") return `on_change on too little: ${seen()}`;
