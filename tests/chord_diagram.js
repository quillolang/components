if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-chord");
if (charts.length !== 2) return `expected 2 chord diagrams, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chord diagram has NaN, Infinity or undefined in it";
const [moves, phones] = charts;
if (moves.getAttribute("aria-label") !== "People moving between regions, thousands") return "the label does not name the chart";
const arcs = [...moves.querySelectorAll(".ui-chord-arc")];
if (arcs.length !== 5) return `5 groups made ${arcs.length} arcs`;
// Where a path's first point is, as a share of a turn clockwise from the top.
const turn = (d) => { const [x, y] = d.slice(1).split(" ")[0].split(",").map(Number); return ((Math.atan2(x, -y) / (2 * Math.PI)) + 1) % 1; };
const rows = [94, 79, 81, 76, 42], total = 372, unit = (1 - 5 * 0.025) / total;
// North starts half a gap after the top; South after North and a gap.
if (Math.abs(turn(arcs[0].getAttribute("d")) - 0.0125) > 0.0005) return `North starts at ${turn(arcs[0].getAttribute("d"))}`;
if (Math.abs(turn(arcs[1].getAttribute("d")) - (0.0125 + 0.025 + 94 * unit)) > 0.0005) return "South does not start where North ends, past a gap";
if (arcs[0].querySelector("title").textContent !== "North: out 94k, in 71k") return `an arc's title: ${arcs[0].querySelector("title").textContent}`;
const ribs = [...moves.querySelectorAll(".ui-chord-rib")];
if (ribs.length !== 10) return `5 groups with flows both ways make ${ribs.length} ribbons, not 10`;
const ns = ribs.find((r) => r.dataset.from === "North" && r.dataset.to === "South");
if (ns.querySelector("title").textContent !== "North → South: 42k; South → North: 31k") return `a ribbon's title: ${ns.querySelector("title").textContent}`;
if (!ns.classList.contains("ui-chord-s1") || !ns.classList.contains("ui-chord-t1") || !ns.classList.contains("ui-chord-t2")) return "a ribbon is not in its larger side's colour, or not marked with both groups";
// North → South starts where North's arc does (North's first flow, to itself, is 0).
if (Math.abs(turn(ns.getAttribute("d")) - 0.0125) > 0.0005) return "a ribbon does not leave from its group's arc";
if (getComputedStyle(ns).fill !== getComputedStyle(arcs[0]).fill) return "the ribbon's colour";
if (new Set(arcs.map((a) => getComputedStyle(a).fill)).size !== 5) return "groups share a colour";
const names = [...moves.querySelectorAll(".ui-chord-name")];
if (names.map((t) => t.textContent).join() !== "North,South,East,West,Abroad") return "the groups are not named";
if (names[0].getAttribute("text-anchor") !== "start" || names[3].getAttribute("text-anchor") !== "end") return "names on the left are not right-aligned";
if (Math.round(moves.querySelector(".ui-chord-box").getBoundingClientRect().width) !== 360) return "the default size";
const tr = moves.querySelectorAll("tbody tr");
if (tr.length !== 5 || tr[0].textContent !== "North0k42k18k25k9k94k") return `the table: ${tr[0].textContent}`;
if (!moves.querySelector(".ui-chord-box").hasAttribute("aria-hidden")) return "the drawing is not hidden from screen readers";
const self = [...phones.querySelectorAll(".ui-chord-rib")].find((r) => r.dataset.from === "Apple" && r.dataset.to === "Apple");
if (!self || self.querySelector("title").textContent !== "Apple, staying: 620") return "what stays is not a ribbon of its own";
if (Math.round(phones.querySelector(".ui-chord-box").getBoundingClientRect().width) !== 280) return "size={280}";
