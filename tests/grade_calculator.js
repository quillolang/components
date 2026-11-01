const c = $("#grade-calculator-demo-name-0").closest(".ui-grade-calc");
const now = (cls) => c.querySelector(`.ui-grade-calc-${cls} dd`).textContent;
const row = (label, box = c) => [...box.querySelectorAll(".ui-grade-calc-goals tbody tr")].find((r) => r.children[0].textContent === label);
const need = (label, box = c) => { const r = row(label, box); return r && `${r.children[2].textContent}|${r.children[3].textContent}`; };
const errors = (box = c) => [...box.querySelectorAll(".ui-grade-calc-error")].map((p) => p.textContent);
// 20×85 + 30×72 (36/50) + 10×90 = 4760 over the 60 marked: 79.33; the 40 left at 0 give 47.60, at 100 give 87.60.
if (now("current") !== "79.33" || now("secured-now") !== "47.60" || now("best") !== "87.60") return `start: ${now("current")} ${now("secured-now")} ${now("best")}`;
if (need("A") !== "More than 100|Out of reach") return `A: (9000 - 4760) / 40 is 106: ${need("A")}`;
if (need("B") !== "81.00|Possible") return `B: ${need("B")}`;
if (need("C") !== "56.00|Possible" || need("Pass") !== "6.00|Possible") return `C and Pass: ${need("C")} ${need("Pass")}`;
if (!c.querySelector("[aria-live]").textContent.includes("Current grade 79.33 (C), from 60 of 100 weight marked")) return c.querySelector("[aria-live]").textContent;
if ($("#grade-calculator-demo-mark-3").name !== "mark_3" || $("#grade-calculator-demo-weight-0").name !== "weight_0") return "field names";
// One's own target: (8500 - 4760) / 40 = 93.5.
const goal = c.querySelector("input[name=goal]");
type(goal, "85"); await wait(100);
if (need("Your target") !== "93.50|Possible") return `own target: ${need("Your target")}`;
type(goal, "abc"); await wait(100);
if (!errors().join().includes("Your target is a number from 0 to 100") || row("Your target")) return `bad target: ${errors()}`;
type(goal, ""); await wait(100);
// Marking the final: nothing left, so targets are reached or missed.
type($("#grade-calculator-demo-mark-3"), "75"); await wait(100);
// 4760 + 3000 = 7760: 77.60.
if (now("current") !== "77.60" || need("A") !== "Nothing left|Missed" || need("C") !== "Nothing left|Reached") return `all marked: ${now("current")} ${need("A")} ${need("C")}`;
type($("#grade-calculator-demo-mark-3"), ""); await wait(100);
// A need that does not end, by making the last weight 30.
type($("#grade-calculator-demo-weight-3"), "30"); await wait(100);
if (!c.querySelector(".ui-grade-calc-note").textContent.includes("add to 90")) return `the scaling note: ${c.querySelector(".ui-grade-calc-note").textContent}`;
// (70 × 90 − 4760) / 30 = 51.33..., which rounds up to 51.34.
if (need("C") !== "51.34|Possible") return `rounded up: ${need("C")}`;
// Pass 50 needs (4500 − 4760) / 30, below zero: secured.
if (need("Pass") !== "Any mark|Secured") return `secured: ${need("Pass")}`;
type($("#grade-calculator-demo-weight-3"), "40"); await wait(100);
// Bad rows name themselves, and block nothing else from showing.
type($("#grade-calculator-demo-mark-1"), "120"); await wait(100);
if (!errors()[0]?.startsWith("Midterm: a mark is a number from 0 to 100") || $("#grade-calculator-demo-mark-1").getAttribute("aria-invalid") !== "true") return `a mark over the top: ${errors()}`;
type($("#grade-calculator-demo-mark-1"), "5/0"); await wait(100);
if (!errors()[0]?.startsWith("Midterm:")) return `a fraction over 0: ${errors()}`;
type($("#grade-calculator-demo-mark-1"), "1/2/3"); await wait(100);
if (!errors()[0]?.startsWith("Midterm:")) return `two slashes: ${errors()}`;
type($("#grade-calculator-demo-mark-1"), "85%"); await wait(100);
if (errors().length || now("current") !== "85.83") return `85%: (1700 + 2550 + 900) / 60: ${now("current")}`;
type($("#grade-calculator-demo-weight-2"), "-5"); await wait(100);
if (!errors()[0]?.startsWith("Labs: a weight is a number of 0 or more")) return `a negative weight: ${errors()}`;
type($("#grade-calculator-demo-weight-2"), ""); await wait(100);
if (!errors()[0]?.startsWith("Labs: has a mark but no weight")) return `a mark with no weight: ${errors()}`;
type($("#grade-calculator-demo-weight-2"), "10"); await wait(100);
// Adding a row takes focus to it; removing one takes it to the button.
c.querySelector(".ui-grade-calc-add").click(); await wait(150);
if (document.activeElement !== $("#grade-calculator-demo-name-4")) return "a new row does not take focus";
type($("#grade-calculator-demo-name-4"), "Quiz"); type($("#grade-calculator-demo-weight-4"), "10"); await wait(100);
if ($("#grade-calculator-demo-name-4").value !== "Quiz") return "typing into a new row";
c.querySelector('[aria-label="Remove Quiz"]').click(); await wait(150);
if ($("#grade-calculator-demo-name-4") || document.activeElement !== c.querySelector(".ui-grade-calc-add")) return "removing a row";
// Removing every row leaves a message and no division by zero.
for (const b of c.querySelectorAll(".ui-grade-calc-remove")) b.click();
await wait(150);
if (c.querySelector("[aria-live]").textContent !== "Add a weight to begin." || c.querySelector(".ui-grade-calc-goals")) return "no rows";
// Another scale, with marks as text and a callback. Project 15, viva 60% of 20 is 12: (45 + 36) / 6 = 13.50.
const m = $("#grade-calculator-demo-merit-name-0").closest(".ui-grade-calc");
if (m.querySelector(".ui-grade-calc-current dd").textContent !== "13.50") return `out of 20: ${m.querySelector(".ui-grade-calc-current dd").textContent}`;
if (need("Merit", m) !== "14.50|Possible" || need("Distinction", m) !== "18.50|Possible" || need("Pass", m) !== "6.50|Possible") return `the targets out of 20: ${need("Merit", m)} ${need("Distinction", m)} ${need("Pass", m)}`;
if (!m.querySelector(".ui-grade-calc-note").textContent.includes("add to 12")) return "weights of 12";
type($("#grade-calculator-demo-merit-mark-0"), "18"); await wait(100);
if (m.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: the current grade is 15.00.") return m.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#grade-calculator-demo-merit-mark-0").name !== "module_mark_0") return "name prefix";
