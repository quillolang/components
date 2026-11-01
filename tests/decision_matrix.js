const c = $("#decision-matrix-demo-w-c0").closest(".ui-decision-matrix");
const row = (i) => c.querySelector(`tr[data-opt="${i}"]`);
const score = (i) => row(i)?.querySelector("[data-k=score]").textContent;
const rank = (i) => row(i)?.querySelector("[data-k=rank]").textContent;
const scaled = (i) => [...row(i).querySelectorAll("[data-k=scaled]")].map((s) => s.textContent).join(" ");
const verdict = () => c.querySelector(".ui-decision-matrix-verdict")?.textContent.replace(/\s+/g, " ").trim();
const moves = () => [...c.querySelectorAll(".ui-decision-matrix-moves li")].map((l) => l.textContent);
const errs = () => [...c.querySelectorAll(".ui-decision-matrix-errors li")].map((l) => l.textContent);
const w = (k) => $(`#decision-matrix-demo-w-c${k}`);
const s = (o, k) => $(`#decision-matrix-demo-s-o${o}-c${k}`);
const check = (k) => row(0).closest("table").querySelector(`th[data-crit="${k}"] input[type=checkbox]`);
// By hand: Price is a cost, so Birch's 900 is 1, Cedar's 1500 is 0, Atlas's 1200 is 0.5;
// totals .4 × .5 + .35 × 2/3 + .25 × .5 and so on.
if ([0, 1, 2].map(score).join(" ") !== "55.8 65.0 35.0") return `scores: ${[0, 1, 2].map(score)}`;
if ([0, 1, 2].map(rank).join(" ") !== "2nd 1st 3rd") return `ranks: ${[0, 1, 2].map(rank)}`;
if (scaled(0) !== "0.50 0.67 0.50" || scaled(1) !== "1.00 0.00 1.00" || scaled(2) !== "0.00 1.00 0.00") return `scaled: ${scaled(0)} / ${scaled(1)} / ${scaled(2)}`;
if (!row(1).classList.contains("ui-decision-matrix-best")) return "the winner's row is not marked";
if (verdict() !== "Birch wins on 65.0 out of 100. The closest change is 7.9 points on Quality.") return `verdict: ${verdict()}`;
// A sweep of each share on a fine grid, apart from this code, finds 26.5%, 42.9% and 8.2%, Atlas taking over each time.
if (moves()[0] !== "Price: lower it from 40.0% to 26.5% (13.5 points) and Atlas catches up.") return `move 0: ${moves()[0]}`;
if (moves()[1] !== "Quality: raise it from 35.0% to 42.9% (7.9 points) and Atlas catches up.") return `move 1: ${moves()[1]}`;
if (moves()[2] !== "Support: lower it from 25.0% to 8.2% (16.8 points) and Atlas catches up.") return `move 2: ${moves()[2]}`;
if (w(0).name !== "weight" || s(0, 0).name !== "score" || !s(0, 0).labels[0].textContent.includes("Price for Atlas")) return "field names or labels";
if (!c.textContent.includes("Weight (40.0%)")) return "the weight's share";
// Going past the point really changes the winner: 42.9% of the weights on Quality.
type(w(1), "46"); await wait(); // 46 / 111 = 41.4%, others in another proportion than the sweep
if (rank(1) !== "1st") return `not yet: ${[0, 1, 2].map(rank)}`;
type(w(1), "35"); type(w(0), "10"); await wait();
// Birch 35/70 and Cedar 35/70 land exactly level behind Atlas.
if (rank(0) !== "1st" || rank(1) !== "Tied 2nd" || rank(2) !== "Tied 2nd") return `weights moved: ${[0, 1, 2].map(rank)}`;
type(w(0), "40"); await wait();
// Weights are shares of their sum: ten times each changes nothing.
type(w(0), "400"); type(w(1), "350"); type(w(2), "250"); await wait();
if ([0, 1, 2].map(score).join(" ") !== "55.8 65.0 35.0") return `scaled weights: ${[0, 1, 2].map(score)}`;
type(w(0), "40"); type(w(1), "35"); type(w(2), "25"); await wait();
// Price as a benefit turns the order round.
check(0).click(); await wait();
if ([0, 1, 2].map(score).join(" ") !== "55.8 25.0 75.0" || rank(2) !== "1st") return `not a cost: ${[0, 1, 2].map(score)}`;
check(0).click(); await wait();
// A criterion with one value separates nothing.
for (const o of [0, 1, 2]) type(s(o, 0), "1000");
await wait();
if ([0, 1, 2].map(score).join(" ") !== "75.8 65.0 75.0" || rank(0) !== "1st") return `flat criterion: ${[0, 1, 2].map(score)}`;
type(s(0, 0), "1200"); type(s(1, 0), "900"); type(s(2, 0), "1500"); await wait();
// A three-way tie made of thirds, where floats alone would part them.
[[0, 1, 2], [1, 2, 0], [2, 0, 1]].forEach((r, o) => r.forEach((v, k) => type(s(o, k), String(v))));
if (check(0).checked) check(0).click();
type(w(0), "1"); type(w(1), "1"); type(w(2), "1"); await wait();
if ([0, 1, 2].map(rank).join(" ") !== "Tied 1st Tied 1st Tied 1st") return `tie: ${[0, 1, 2].map(rank)}`;
if (verdict() !== "Atlas and Birch and Cedar tie for first on 50.0 out of 100.") return `tie verdict: ${verdict()}`;
if (moves().length) return "a tie has no winner to move";
// Two tie for first, the next is third.
type(s(2, 0), "0"); type(s(2, 1), "0"); type(s(2, 2), "0"); await wait();
type(s(0, 0), "5"); type(s(0, 1), "1"); type(s(0, 2), "1"); type(s(1, 0), "1"); type(s(1, 1), "5"); type(s(1, 2), "1"); await wait();
if ([0, 1, 2].map(rank).join(" ") !== "Tied 1st Tied 1st 3rd") return `two tied: ${[0, 1, 2].map(rank)}`;
// An option best on everything: no single weight moves it.
type(s(0, 1), "9"); type(s(0, 2), "9"); await wait();
if (rank(0) !== "1st" || !verdict().endsWith("No single weight can change the winner.") || !moves()[0].endsWith("no change to this weight alone changes the winner.")) return `dominant: ${verdict()} ${moves()[0]}`;
// Bad input says where.
type(s(1, 2), "abc"); await wait();
if (errs()[0] !== 'Support for Birch must be a number, not "abc".' || s(1, 2).getAttribute("aria-invalid") !== "true" || verdict() != null) return `text: ${errs()}`;
type(s(1, 2), ""); await wait();
if (errs()[0] !== "Support for Birch is empty.") return `empty: ${errs()}`;
type(s(1, 2), "  ١  "); await wait();
if (!errs()[0].includes("١")) return `other digits: ${errs()}`;
type(s(1, 2), "1"); type(w(0), "-1"); await wait();
if (errs()[0] !== "The weight of Price cannot be below 0." || w(0).getAttribute("aria-invalid") !== "true") return `negative weight: ${errs()}`;
type(w(0), ""); await wait();
if (errs()[0] !== "The weight of Price is empty.") return `blank weight: ${errs()}`;
type(w(0), "0"); type(w(1), "0"); type(w(2), "0"); await wait();
if (errs()[0] !== "At least one weight must be above 0.") return `all zero: ${errs()}`;
type(w(0), "999999999999999999999"); await wait();
if (!errs()[0].startsWith("The weight of Price must be a number")) return `huge: ${errs()}`;
type(w(0), "999,999,999,999,999"); type(s(0, 0), "-999999999999999"); await wait();
if (errs().length || !verdict()) return `largest values: ${errs()}`;
type(s(0, 0), "5"); type(w(0), "1"); type(w(1), "1"); type(w(2), "1"); await wait();
// Add, name, remove.
const add = c.querySelector(".ui-decision-matrix-actions button");
add.click(); await wait();
if (!errs()[0].endsWith("for Option 4 is empty.") || errs().length !== 3) return `an added option: ${errs()}`;
const newRow = row(3);
const cells = newRow.querySelectorAll("td input");
["3", "3", "3"].forEach((v, k) => type(cells[k], v));
type(newRow.querySelector("th input"), "Dóm 🌳"); await wait();
if (!c.textContent.includes("Dóm 🌳")) return "an added option's name";
c.querySelectorAll(".ui-decision-matrix-actions button")[1].click(); await wait();
if (errs().length !== 4 || !errs()[0].startsWith("Criterion 4 for Atlas is empty.")) return `an added criterion: ${errs()}`;
const lastHead = row(0).closest("table").querySelector('th[data-crit="3"]');
lastHead.querySelector("button").click(); await wait();
if (document.activeElement !== add) return "removing keeps focus in the component";
if (errs().length) return `removed: ${errs()}`;
newRow.querySelector("td:last-child button").click(); await wait();
if (c.querySelectorAll("tbody tr").length !== 3) return "the option was not removed";
// With one criterion left, nothing can trade with it.
for (const k of [1, 2]) { row(0).closest("table").querySelector('th[data-crit="1"]').querySelector("button").click(); await wait(); }
if (moves().length !== 1 || !moves()[0].endsWith("no change to this weight alone changes the winner.")) return `one criterion: ${moves()}`;
// Too little to decide.
row(2).querySelector("td:last-child button").click(); await wait();
row(1).querySelector("td:last-child button").click(); await wait();
if (!c.textContent.includes("A decision needs at least two options and one criterion.")) return "one option";
// The second starts tied: Lisbon is cheap, Porto has the flights. Then the callback.
const live = $("#decision-matrix-demo-live-w-c0").closest(".ui-decision-matrix");
const note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#decision-matrix-demo-live-w-c0").name !== "venue_weight") return "the prefix";
if (!live.querySelector(".ui-decision-matrix-verdict").textContent.startsWith("Lisbon and Porto tie for first on 50.0")) return "a tie from the start";
type($("#decision-matrix-demo-live-w-c0"), "3"); await wait();
if (note() !== "on_change: Lisbon.") return `on_change: ${note()}`;
type($("#decision-matrix-demo-live-w-c0"), "1"); await wait();
if (note() !== "on_change: Lisbon and Porto tied.") return `on_change tied: ${note()}`;
type($("#decision-matrix-demo-live-w-c0"), "x"); await wait();
if (note() !== "on_change: something is missing.") return `on_change bad: ${note()}`;
