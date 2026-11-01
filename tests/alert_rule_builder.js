const f = (n, pre = "alert-rule-builder-demo-live") => $(`#${pre}-${n}`);
const c = f("threshold").closest(".ui-alert-rule");
const stat = (n) => c.querySelector(`[data-stat=${n}] dd`)?.textContent;
const warns = () => [...c.querySelectorAll(".ui-alert-rule-warns li")].map((l) => l.textContent);
const rows = () => [...c.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((x) => x.textContent).join("|"));
const bands = () => c.querySelectorAll(".ui-alert-rule-band").length;
// 10 95 10 96 10 97 10 98 99 100 10 10 at 5 minutes, above 90, no for, no cooldown: four
// firings over 55 minutes, which is 104.73 a day.
if (stat("firings") !== "4" || stat("per-day") !== "104.73") return `start: ${stat("firings")} ${stat("per-day")}`;
if (rows().join(" / ") !== "Oct 1 00:05|Oct 1 00:10|5 min|95 / Oct 1 00:15|Oct 1 00:20|5 min|96 / Oct 1 00:25|Oct 1 00:30|5 min|97 / Oct 1 00:35|Oct 1 00:50|15 min|100") return rows().join(" / ");
if (bands() !== 4 || stat("time") !== "30 min") return `bands ${bands()} time ${stat("time")}`;
if (warns()[0] !== "Flapping: 4 firings, most within 30 min of the one before.") return warns().join(" / ");
// Replayed: a for of 5 keeps only the run of three, as one point never lasts 5. A cooldown
// of 15 still flaps (00:05, 00:25, 00:45); 30 gives 00:05 and then 00:40.
if (warns()[1] !== `A "for" of 5 min would fire 1 time and not flap.`) return `the tip: ${warns().join(" / ")}`;
if (warns()[2] !== "A cooldown of 30 min would fire 2 times and not flap.") return `the tip: ${warns().join(" / ")}`;
const note = c.closest(".demo-stack").querySelector(".demo-note");
// "for" on: a run must last. The run from 00:35 to 00:45 lasts 10 min.
type(f("for"), "5"); await wait();
if (stat("firings") !== "1" || rows()[0] !== "Oct 1 00:40|Oct 1 00:50|10 min|100") return `for 5: ${rows()}`;
if (note.textContent !== "on_change: 1 firings, 26.18 a day, flapping false, never false.") return `on_change: ${note.textContent}`;
type(f("for"), "10"); await wait();
if (rows()[0] !== "Oct 1 00:45|Oct 1 00:50|5 min|100") return `for 10: ${rows()}`;
// Just past the longest run: never fires, and says why.
type(f("for"), "15"); await wait();
if (stat("firings") !== "0" || warns()[0] !== `Never fires: 6 values are past the threshold, but the longest run lasts 10 min, short of the 15 min "for".`) return `for 15: ${warns()}`;
if (bands() !== 0 || c.querySelector("tbody")) return "no firings, nothing drawn";
if (note.textContent !== "on_change: 0 firings, 0.00 a day, flapping false, never true.") return `never: ${note.textContent}`;
type(f("for"), "0"); type(f("threshold"), "100.5"); await wait();
if (warns()[0] !== "Never fires: the highest value is 100, which does not reach > 100.5.") return warns().join(" / ");
// The comparison: > is strict, >= is not.
type(f("threshold"), "100"); await wait();
if (stat("firings") !== "0") return `> 100: ${stat("firings")}`;
const op = f("comparison");
op.value = ">="; op.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (stat("firings") !== "1") return `>= 100: ${stat("firings")}`;
op.value = "<"; op.dispatchEvent(new Event("change", { bubbles: true })); await wait();
type(f("threshold"), "5"); await wait();
if (warns()[0] !== "Never fires: the lowest value is 10, which does not reach < 5.") return warns().join(" / ");
type(f("threshold"), "50"); await wait();
// Below 50: 00:00 (ends 00:05), 00:10, 00:20, 00:30, 00:50 still open at the end. The worst is the lowest.
if (stat("firings") !== "5" || !rows()[4].endsWith("still firing|5 min|10")) return `below: ${rows().join(" / ")}`;
if (!warns().includes("The last firing is still open where the sample ends.")) return warns().join(" / ");
op.value = ">"; op.dispatchEvent(new Event("change", { bubbles: true }));
type(f("threshold"), "90"); await wait();
// Cooldown: quiet for 20 min after each clear. 00:05 clears 00:10, so 00:15 is held;
// 00:25 is held; 00:35 fires at 00:35? Quiet ends 00:30, so it does.
type(f("cooldown"), "20"); await wait();
if (stat("firings") !== "2" || stat("held") !== "2" || rows()[1] !== "Oct 1 00:35|Oct 1 00:50|15 min|100") return `cooldown: ${rows()} held ${stat("held")}`;
// A cooldown that ends during a run fires when it ends, not at the run's start.
type(f("cooldown"), "27"); await wait();
if (rows()[1] !== "Oct 1 00:40|Oct 1 00:50|10 min|100") return `released mid-run: ${rows()}`;
type(f("cooldown"), "0"); await wait();
// Gaps, unsorted lines, bad lines, timed lines.
const data = f("series");
if (data.name !== "series") return "the sample's name";
const good = data.value;
type(data, "2026-10-01T00:10:00Z,95\n2026-10-01T00:00:00Z,95\n2026-10-01T00:05:00Z,95\nnope\n2026-13-01T00:00:00Z,1\n2026-10-01T00:15:00Z,12\n"); await wait();
if (stat("firings") !== "1" || rows()[0] !== "Oct 1 00:00|Oct 1 00:15|15 min|95") return `sorted by time: ${rows()}`;
if (!c.textContent.includes("Skipped 2 bad lines: 4, 5.")) return "bad lines are not named";
type(f("for"), "5");
type(data, "95\n95\n\nnull\n95\n95\n10"); await wait();
// A gap ends the pending run: the two after it reach 5 minutes; the times count the points.
if (stat("firings") !== "1") return `a gap: ${stat("firings")} ${rows()}`;
type(f("for"), "0");
type(data, "95"); await wait();
if (stat("per-day") !== "—" || stat("firings") !== "1") return `one point: ${stat("per-day")}`;
type(data, "90\n90\n90"); await wait();
if (stat("firings") !== "0" || c.querySelector("svg path").getAttribute("d").includes("NaN")) return "a flat line";
type(data, "95\n95\n95\n95\n95\n95\n95\n95\n95\n95"); await wait();
if (!warns().some((w) => w.startsWith("Past the threshold 100% of the time"))) return `always: ${warns()}`;
type(data, ""); await wait();
if (c.querySelector("svg") || !c.textContent.includes("No values to test yet.")) return "an empty sample";
type(data, "   \n\n"); await wait();
if (c.querySelector("svg")) return "a blank sample";
type(data, "null\nnull"); await wait();
if (c.querySelector("svg")) return "all gaps";
type(data, good); await wait();
for (const [field, text, msg] of [["threshold", "abc", "The threshold must be a number."], ["threshold", "", "The threshold must be a number."], ["threshold", "1e999", "The threshold must be a number."],
    ["for", "-1", `"For" must be a number of minutes, from 0 to a year.`], ["cooldown", "soon", "Cooldown must be a number of minutes, from 0 to a year."]]) {
    const was = f(field).value;
    type(f(field), text); await wait();
    if (c.querySelector("[role=alert]")?.textContent !== msg) return `${field} ${text}: ${c.querySelector("[role=alert]")?.textContent}`;
    if (f(field).getAttribute("aria-invalid") !== "true") return `${field} is not marked`;
    if (c.querySelector("svg")) return "a chart beside an error";
    type(f(field), was); await wait();
}
// The big sample against a replay written here, on three rules. The sample comes from the page.
const m = f("threshold", "alert-rule-builder-demo").closest(".ui-alert-rule");
const pts = f("series", "alert-rule-builder-demo").value.split("\n").map(Number);
if (pts.length !== 864) return `points: ${pts.length}`;
const replay = (limit, forM, coolM) => {
    let since = null, firing = false, quiet = -1, n = 0;
    pts.forEach((v, i) => {
        const t = i * 5;
        if (v > limit) { if (since === null) since = t; if (!firing && t - since >= forM && t >= quiet) { firing = true; n++; } }
        else { since = null; if (firing) { firing = false; quiet = t + coolM; } }
    });
    return n;
};
const ms = (n) => m.querySelector(`[data-stat=${n}] dd`).textContent;
for (const [limit, forM, coolM] of [[85, 10, 30], [85, 0, 0], [70, 25, 60], [60, 5, 15]]) {
    type(f("threshold", "alert-rule-builder-demo"), String(limit)); type(f("for", "alert-rule-builder-demo"), String(forM)); type(f("cooldown", "alert-rule-builder-demo"), String(coolM));
    await wait(150);
    const want = replay(limit, forM, coolM);
    if (ms("firings") !== String(want)) return `${limit}/${forM}/${coolM}: ${ms("firings")}, a replay says ${want}`;
    if (ms("per-day") !== (want * 86400 / (863 * 300)).toFixed(2)) return `per day: ${ms("per-day")}`;
}
// Keeps up: a keystroke on 5,000 points.
const big = Array.from({ length: 5000 }, (_, i) => (i % 2 ? 95 : 10)).join("\n");
const t0 = performance.now();
type(f("series", "alert-rule-builder-demo"), big); await wait(0);
type(f("threshold", "alert-rule-builder-demo"), "90");
await wait(30);
if (performance.now() - t0 > 2000) return `5000 points took ${Math.round(performance.now() - t0)} ms`;
if (m.querySelector("svg path").getAttribute("d").length > 60000) return "the chart is not thinned";
