const c = $("#workload-view-demo-title").closest(".ui-workload-view");
const td = (p, w) => c.querySelector(`tr[data-person=${p}] td[data-week="${w}"]`);
const load = (p, w) => [...td(p, w).querySelectorAll(".ui-workload-view-load > span")].map((s) => s.textContent).join(" / ");
const A = "2026-11-02", B = "2026-11-09";
const moves = () => [...c.querySelectorAll(".ui-workload-view-move")].map((l) => l.querySelector("span").textContent);
const note = () => c.closest(".demo-stack").querySelector(".demo-note").textContent;
// Ana 30 + 16 + 7.5 = 53.5 of 40, 134%. Exact in decimals.
if (load("ana", A) !== "53.5 of 40 h / 134% over allocated") return `Ana: ${load("ana", A)}`;
if (!td("ana", A).classList.contains("ui-workload-view-over")) return "Ana not marked";
// Ben 12 of 40 is 30%, under the 50% line.
if (load("ben", A) !== "12 of 40 h / 30% under allocated") return `Ben: ${load("ben", A)}`;
if (load("cara", A) !== "30 of 32 h / 94%") return `Cara: ${load("cara", A)}`;
// Leave: Cara has 16 that week.
if (load("cara", B) !== "20 of 16 h / 125% over allocated") return `Cara on leave: ${load("cara", B)}`;
// Worst first: Ana is 13.5 over. Migration needs sql, which only she has. API (30 h) clears it but Ben has room for 28 only;
// Tests (7.5) goes to Ben, then 6 over remains, and nothing fits: API is too large and Migration has no taker.
const m = moves();
if (m[0] !== "Week of 2 Nov: move Tests (7.5 h) from Ana to Ben. Ana 53.5 to 46 of 40 h, Ben 12 to 19.5 of 40 h.") return `first move: ${m[0]}`;
if (m.length !== 3) return `moves: ${m.join(" | ")}`;
if (m[1] !== "Week of 2 Nov: Ana stays 6 h over. Everyone who could take it is too full that week.") return `Ana stuck: ${m[1]}`;
if (m[2] !== "Week of 9 Nov: Cara stays 4 h over. Nobody else has design.") return `Cara stuck: ${m[2]}`;
// Skills in the hand list: the Migration can only stay with Ana.
const opts = [...c.querySelector("li[data-item=db] select").options].map((o) => `${o.textContent}${o.disabled ? "!" : ""}`);
if (opts.join() !== "Ana,Ben (no sql)!,Cara (no sql)!") return `options: ${opts}`;
if (c.querySelector("li[data-item=db] select").value !== "ana") return "the select shows the person";
// Apply.
c.querySelector(".ui-workload-view-move button").click(); await wait();
if (load("ana", A) !== "46 of 40 h / 115% over allocated" || load("ben", A) !== "19.5 of 40 h / 49% under allocated") return `applied: ${load("ana", A)} ${load("ben", A)}`;
if (note() !== "on_move: Tests, 7.5 h, ana to ben, week of 2026-11-02.") return `on_move: ${note()}`;
if (!td("ben", A).querySelector("li[data-item=tests]") || td("ana", A).querySelector("li[data-item=tests]")) return "the assignment did not move";
if (moves().length !== 2) return `after applying: ${moves().join(" | ")}`;
// Undo.
[...c.querySelectorAll(".ui-workload-view-said button")][0].click(); await wait();
if (load("ana", A) !== "53.5 of 40 h / 134% over allocated" || note() !== "on_move: Tests, 7.5 h, ben to ana, week of 2026-11-02.") return `undo: ${load("ana", A)} ${note()}`;
// By hand: the API to Ben makes Ben 42 of 40; the plan then moves Bug fixes back, and Ana is left over by 0.
const api = c.querySelector("li[data-item=api] select");
api.value = "ben"; api.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (load("ana", A) !== "23.5 of 40 h / 59%" || load("ben", A) !== "42 of 40 h / 105% over allocated") return `by hand: ${load("ana", A)} ${load("ben", A)}`;
if (moves()[0] !== "Week of 2 Nov: move Bug fixes (12 h) from Ben to Ana. Ben 42 to 30 of 40 h, Ana 23.5 to 35.5 of 40 h.") return `after by hand: ${moves()[0]}`;
const form = JSON.parse(c.querySelector("input[name=assignments]").value);
if (form.find((a) => a.id === "api").person !== "ben" || form.find((a) => a.id === "tests").hours !== "7.5") return "the form's field";
// Bad data, each named; nothing thrown. Capacity 0 with work on it.
const b = $("#workload-view-demo-bad-title").closest(".ui-workload-view");
const p = [...b.querySelectorAll(".ui-workload-view-problems li")].map((l) => l.textContent);
for (const want of ["Assignment 2: the id x is used twice.", "Assignment 3 (y): nobody called z is in the list.", "Assignment 4 (n): the week w9 is not shown.", 'Assignment 5 (q): "lots" is not a number of hours.', "Assignment 6: this is not an assignment."])
    if (!p.includes(want)) return `missing "${want}": ${p}`;
if (b.querySelector("td[data-week=w1] .ui-workload-view-load").textContent.trim() !== "5 of 0 hno capacity over allocated") return `no capacity: ${b.querySelector("td[data-week=w1] .ui-workload-view-load").textContent}`;
if (!b.querySelector(".ui-workload-view-move").textContent.includes("move x (5 h) from a to b")) return "no capacity moves to b";
// Hidden text in a table that scrolls must scroll with it, or it widens a phone's page.
if (getComputedStyle(c.querySelector(".ui-workload-view-wrap")).position === "static") return "the scroller does not hold what is hidden in it";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
