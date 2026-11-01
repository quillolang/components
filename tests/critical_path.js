const c = $("#critical-path-demo-tasks").closest(".ui-critical-path");
const box = $("#critical-path-demo-tasks");
const row = (id) => [...c.querySelectorAll("tbody tr")].find((r) => r.querySelector("th").textContent.trim().startsWith(id + " ") || r.querySelector("th").textContent.trim() === id);
const cells = (id) => [...row(id).querySelectorAll("td")].map((d) => d.textContent.trim());
const finish = () => c.querySelector(".ui-critical-path-finish")?.textContent;
const routes = () => [...c.querySelectorAll(".ui-critical-path-route")].map((r) => r.textContent.replace("Critical path: ", ""));
const problems = () => [...c.querySelectorAll(".ui-critical-path-problems li")].map((l) => l.textContent);
// Worked by hand: A 0-3, B 3-8, D 8-12, E 12-13 critical; C 3-5, may slide to 12, so slack 7.
if (cells("A").join() !== "–,3,0,3,0,3,0,0,Mon 2 Nov,Wed 4 Nov") return `A: ${cells("A")}`;
if (cells("B").join() !== "A,5,3,8,3,8,0,0,Thu 5 Nov,Thu 12 Nov") return `B over a weekend and the 11th: ${cells("B")}`;
if (cells("C").join() !== "A,2,3,5,10,12,7,7,Thu 5 Nov,Fri 6 Nov") return `C: ${cells("C")}`;
if (cells("D").join() !== "B,4,8,12,8,12,0,0,Fri 13 Nov,Wed 18 Nov") return `D: ${cells("D")}`;
if (cells("E").join() !== "C D,1,12,13,12,13,0,0,Thu 19 Nov,Thu 19 Nov") return `E: ${cells("E")}`;
if (finish() !== "Finishes Thu 19 Nov 2026, 13 working days") return `finish: ${finish()}`;
if (routes().join("|") !== "A → B → D → E") return `route: ${routes()}`;
if (row("C").classList.contains("ui-critical-path-hot") || !row("A").classList.contains("ui-critical-path-hot")) return "the critical rows are not marked";
// Two critical paths when C ties.
type(box, "A, Design, 3\nB, Build, 5, A\nC, Docs, 9, A\nD, Test, 4, B\nE, Launch, 1, C D"); await wait();
if (routes().join("|") !== "A → B → D → E|A → C → E") return `two routes: ${routes()}`;
// A start on a Sunday moves to Monday, and a milestone takes no day.
type($("#critical-path-demo-start"), "2026-11-01"); type(box, "A, Kick-off, 0\nB, Work, 2, A\nC, Sign-off, 0, B"); await wait();
if (cells("A").slice(-2).join() !== "Mon 2 Nov,Mon 2 Nov" || cells("B").slice(-2).join() !== "Mon 2 Nov,Tue 3 Nov") return `milestone: ${cells("A")} / ${cells("B")}`;
if (cells("C").join() !== "B,0,2,2,2,2,0,0,Wed 4 Nov,Wed 4 Nov" || finish() !== "Finishes Tue 3 Nov 2026, 2 working days") return `end milestone: ${cells("C")} ${finish()}`;
// Weekends worked.
type(box, "A, Pour, 7"); await wait();
if (cells("A").at(-1) !== "Tue 10 Nov") return `weekends off: ${cells("A")}`;
$("#critical-path-demo-weekends").click(); await wait();
if (cells("A").at(-2) !== "Sun 1 Nov" || cells("A").at(-1) !== "Sat 7 Nov") return `weekends on: ${cells("A")}`;
$("#critical-path-demo-weekends").click(); await wait();
// A task that waits for what it waits for (a transitive edge) keeps the sums right; ids may be odd.
type(box, "é, Ünï, 2\nx y, Spaced, 1, é"); await wait();
if (!problems().length && !row("é")) return "unicode id";
type(box, "é, Ünï, 2\nz, Next, 1, é\nw, Last, 1, é z"); await wait();
if (cells("w").slice(0, 7).join() !== "é z,1,3,4,3,4,0" || routes()[0] !== "é → z → w") return `transitive: ${cells("w")} ${routes()}`;
// Cycles, named in order.
type(box, "A, a, 1, C\nB, b, 1, A\nC, c, 1, B"); await wait();
if (problems().join() !== "A cycle: A → C → B → A. Each waits for the next to finish." && problems().join() !== "A cycle: A → B → C → A. Each waits for the next to finish.") return `cycle: ${problems()}`;
if (c.querySelector("table") || !c.querySelector("[role=alert]") || box.getAttribute("aria-invalid") !== "true") return "a cycle shows a schedule";
// A task behind a cycle does not hide it; a cycle beside a good task.
type(box, "S, s, 1\nX, x, 1, Y\nY, y, 1, X\nZ, z, 1, X S"); await wait();
if (!problems().join().includes("X → Y → X") && !problems().join().includes("Y → X → Y")) return `cycle among others: ${problems()}`;
type(box, "A, a, 1, A"); await wait();
if (!problems()[0].startsWith("Line 1: A waits for itself.")) return `self: ${problems()}`;
// Missing, duplicate, bad numbers, each by line; a note and a blank line count as lines.
type(box, "# plan\n\nA, a, x\nB, b, -2, Q\nA, c, 1\n, d, 1\nE, e, 1.5"); await wait();
const p = problems();
for (const want of ['Line 3: "x" is not a whole number of days', 'Line 4: "-2" is not a whole number', "Line 5: the id A is used twice.", "Line 6: it has no id.", 'Line 7: "1.5" is not a whole number', "Line 4: B waits for Q, which is not in the list."])
    if (!p.some((l) => l.startsWith(want))) return `missing "${want}": ${p}`;
// Empty, huge, no date: messages, no error.
type(box, "   "); await wait();
if (problems().join() !== "Add a task to start.") return `empty: ${problems()}`;
type(box, Array.from({ length: 501 }, (_, i) => `t${i}, x, 1`).join("\n")); await wait();
if (problems().join() !== "That is more than 500 tasks, the limit.") return `too many: ${problems()}`;
type(box, Array.from({ length: 300 }, (_, i) => `t${i}, x, 1${i ? `, t${i - 1}` : ""}`).join("\n"));
const t0 = performance.now(); await wait(50);
if (!finish()?.includes("300 working days") || performance.now() - t0 > 1500) return `a long chain: ${finish()} in ${performance.now() - t0} ms`;
type(box, "A, a, 1"); type($("#critical-path-demo-start"), ""); await wait();
if (problems()[0] !== '"" is not a start date.') return `no date: ${problems()}`;
// on_change.
const l = $("#critical-path-demo-live-tasks").closest(".ui-critical-path");
const note = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (l.querySelector(".ui-critical-path-finish").textContent !== "Finishes Wed 2 Dec 2026, 6 working days") return `weekends worked: ${l.querySelector(".ui-critical-path-finish").textContent}`;
type($("#critical-path-demo-live-tasks"), "1, Strip out, 4"); await wait();
if (note() !== "on_change: it finishes on 2026-11-30.") return `on_change: ${note()}`;
if ($("#critical-path-demo-live-tasks").name !== "fitout" || $("#critical-path-demo-live-start").name !== "fitout_start") return "field names";
