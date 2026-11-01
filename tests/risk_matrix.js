const c = $("[data-risk=breach]").closest(".ui-risk-matrix");
const cell = (l, i) => c.querySelector(`[data-l="${l}"][data-i="${i}"]`);
const marks = (l, i) => [...cell(l, i).querySelectorAll(".ui-risk-matrix-chip")].map((s) => s.textContent + (s.classList.contains("ui-risk-matrix-after") ? "*" : "")).join(" ");
const order = () => [...c.querySelectorAll("[data-risk]")].map((r) => r.dataset.risk).join(" ");
const row = (id) => c.querySelector(`[data-risk=${id}]`);
const now = (id) => row(id)?.querySelector("[data-k=now]").textContent.replace(/\s+/g, " ").trim();
const then = (id) => row(id)?.querySelector("[data-k=then]").textContent.replace(/\s+/g, " ").trim();
const said = () => c.querySelector(".ui-risk-matrix-say").textContent;
const bar = () => c.querySelector(".ui-risk-matrix-bar strong").textContent;
const hidden = (n) => [...c.querySelectorAll(`input[name=${n}]`)].map((i) => i.value).join(" ");
const tally = (k) => c.querySelector(`[data-k=tally-${k}]`).textContent;
// Scores by hand: outage 16, breach 15, churn 9, vendor 8, fx 5. Flood's 9 is off the grid.
if (order() !== "outage breach churn vendor fx") return `order: ${order()}`;
if (now("outage") !== "16 Critical" || now("breach") !== "15 High" || now("churn") !== "9 Medium" || now("fx") !== "5 Medium" || now("vendor") !== "8 Medium") return `bands: ${now("outage")} ${now("breach")} ${now("churn")}`;
if (then("outage") !== "9 Medium" || then("breach") !== "8 Medium" || then("vendor") !== "Not assessed") return `after: ${then("outage")} ${then("breach")} ${then("vendor")}`;
if (!then("churn").startsWith("12 High") || !then("churn").includes("Worse than before")) return `a mitigation that worsens: ${then("churn")}`;
if (marks(3, 5) !== "R1" || marks(2, 4) !== "R3 R1*" || marks(3, 3) !== "R4 R2*" || marks(4, 3) !== "R4*" || marks(5, 1) !== "R5 R5*") return `chips: ${marks(3, 5)} / ${marks(2, 4)} / ${marks(3, 3)} / ${marks(4, 3)} / ${marks(5, 1)}`;
if (!c.querySelector(".ui-risk-matrix-problems")?.textContent.startsWith("Office flood: likelihood and impact must be whole numbers from 1 to 5")) return "the risk off the grid is not named";
// The tally before and after: Critical 1 to 0, High 1 to 1, Medium 3 to 4, Low 0 to 0.
if (tally(3) !== "1 to 0" || tally(2) !== "1 to 1" || tally(1) !== "3 to 4" || tally(0) !== "0 to 0") return `tally: ${tally(3)} ${tally(2)} ${tally(1)} ${tally(0)}`;
// Band colours follow the score at the edges: 4 is Low, 5 Medium, 9 Medium, 10 High, 15 High, 16 Critical.
const tone = (l, i) => [...cell(l, i).classList].find((x) => /-b\d$/.test(x)).slice(-1);
if ([tone(2, 2), tone(1, 5), tone(3, 3), tone(2, 5), tone(3, 5), tone(4, 4)].join("") !== "011223") return `tones: ${[tone(2, 2), tone(1, 5), tone(3, 3), tone(2, 5), tone(3, 5), tone(4, 4)]}`;
if (cell(2, 4).getAttribute("aria-label") !== "Likelihood 2, impact 4, score 8, Medium. 2 risks: Key vendor fails, Customer data breach after mitigation.") return `cell's words: ${cell(2, 4).getAttribute("aria-label")}`;
if (c.querySelectorAll('[role=gridcell][tabindex="0"]').length !== 1) return "one cell in the tab order";
// A cell filters, by inherent or mitigated place, and a second click stops.
cell(2, 4).click(); await wait();
if (order() !== "breach vendor" || bar() !== "2 of 5 in likelihood 2, impact 4" || cell(2, 4).getAttribute("aria-selected") !== "true") return `filter: ${order()} ${bar()}`;
cell(2, 4).click(); await wait();
if (order() !== "outage breach churn vendor fx" || cell(2, 4).getAttribute("aria-selected") !== "false") return `filter off: ${order()}`;
cell(1, 1).click(); await wait();
if (order() !== "" || bar() !== "0 of 5 in likelihood 1, impact 1") return `an empty cell: ${bar()}`;
c.querySelector(".ui-risk-matrix-bar button").click(); await wait();
if (order().split(" ").length !== 5) return "Show all";
// The keyboard on the grid: arrows, the edges, Home and End, Enter, Escape.
let at = cell(3, 3); at.focus(); await wait();
key(at, "ArrowUp"); await wait();
if (document.activeElement !== cell(4, 3)) return "ArrowUp is more likely";
key(document.activeElement, "ArrowRight"); await wait();
if (document.activeElement !== cell(4, 4) || cell(4, 4).getAttribute("tabindex") !== "0" || cell(3, 3).getAttribute("tabindex") !== "-1") return "ArrowRight, and the tab stop follows";
key(document.activeElement, "End"); await wait();
if (document.activeElement !== cell(4, 5)) return "End";
key(document.activeElement, "ArrowRight"); await wait();
if (document.activeElement !== cell(4, 5)) return "stops at the edge";
key(document.activeElement, "Home"); await wait();
if (document.activeElement !== cell(4, 1)) return "Home";
key(document.activeElement, "ArrowDown"); key(document.activeElement, "ArrowDown"); await wait();
key(document.activeElement, "ArrowDown"); key(document.activeElement, "ArrowDown"); key(document.activeElement, "ArrowDown"); await wait();
if (document.activeElement !== cell(1, 1)) return `down to the bottom: ${document.activeElement.getAttribute("aria-label")}`;
at = cell(5, 1); at.focus(); await wait();
key(at, "Enter"); await wait();
if (order() !== "fx") return `Enter filters: ${order()}`;
key(cell(5, 1), "Escape"); await wait();
if (order().split(" ").length !== 5) return "Escape clears the filter";
key(cell(5, 1), " "); await wait();
if (order() !== "fx") return "Space filters";
key(cell(5, 1), " "); await wait();
if (order().split(" ").length !== 5) return "Space again";
// Move a risk by keyboard.
const move = c.querySelector("[data-move=fx-now]");
move.click(); await wait();
if (document.activeElement !== cell(5, 1) || !said().startsWith("Moving Exchange rate swing.")) return `pick up: ${said()}`;
if (move.getAttribute("aria-pressed") !== "true") return "Move is pressed while held";
key(document.activeElement, "ArrowDown"); await wait();
key(document.activeElement, "ArrowRight"); await wait();
if (document.activeElement !== cell(4, 2) || marks(4, 2) !== "R5") return `carried: ${marks(4, 2)}`;
key(document.activeElement, "Enter"); await wait();
if (said() !== "Exchange rate swing placed at likelihood 4, impact 2: score 8, Medium.") return `put down: ${said()}`;
if (document.activeElement !== move) return "focus goes back to Move";
// Level with vendor on 8, it goes after: vendor has more left once mitigated.
if (now("fx") !== "8 Medium" || order() !== "outage breach churn vendor fx") return `after the move: ${now("fx")} ${order()}`;
if (hidden("likelihood") !== "3 4 2 3 4" || hidden("impact") !== "5 4 4 3 2") return `hidden: ${hidden("likelihood")}`;
// Escape takes it back.
move.click(); await wait();
key(document.activeElement, "ArrowUp"); key(document.activeElement, "ArrowUp"); await wait();
if (!marks(5, 2).includes("R5")) return `held: ${marks(5, 2)}`;
key(document.activeElement, "Escape"); await wait();
if (now("fx") !== "8 Medium" || said() !== "Exchange rate swing left where it was." || marks(5, 2) !== "" ) return `cancel: ${now("fx")} ${said()}`;
// A mitigated position, on a risk that had none; the mouse works too.
c.querySelector("[data-move=vendor-after]").click(); await wait();
if (!marks(2, 4).includes("R3*")) return `a new mitigated place starts at the inherent: ${marks(2, 4)}`;
cell(1, 2).click(); await wait();
if (then("vendor") !== "2 Low" || hidden("mitigated_likelihood") !== "2 3 1 4 5" || !said().includes("placed at likelihood 1, impact 2")) return `mitigated placed: ${then("vendor")} ${hidden("mitigated_likelihood")}`;
if (tally(0) !== "0 to 1") return `the tally follows: ${tally(0)}`;
// Cancelling a first mitigated place leaves it not assessed.
c.querySelector("[data-move=fx-after]").click(); await wait();
key(document.activeElement, "Escape"); await wait();
if (then("fx") !== "5 Medium") return `cancel keeps the old: ${then("fx")}`;
if (c.querySelector("input[name=risk_id]").value !== "breach") return "hidden fields in the given order";
// The second: bands of its own, a callback, and a risk alone.
const live = $("[data-risk=late]").closest(".ui-risk-matrix");
const lnote = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.querySelector("[data-k=now]").textContent.replace(/\s+/g, " ").trim() !== "4 Accept") return "own bands";
live.querySelector("[data-move=late-now]").click(); await wait();
const lc = (l, i) => live.querySelector(`[data-l="${l}"][data-i="${i}"]`);
for (let n = 0; n < 2; n++) { key(document.activeElement, "ArrowUp"); await wait(); key(document.activeElement, "ArrowRight"); await wait(); }
if (document.activeElement !== lc(4, 4)) return "carried in the second";
key(document.activeElement, "Enter"); await wait();
if (lnote() !== "on_change: Launch slips scores 16, Act.") return `on_change: ${lnote()}`;
if (live.querySelector("input[name=launch_likelihood]")?.value !== "4") return "the prefix";
