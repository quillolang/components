if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-network");
if (charts.length !== 2) return `expected 2 network graphs, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a graph has NaN, Infinity or undefined in it";
const [team, calls] = charts;
if (team.getAttribute("aria-label") !== "Who works with whom") return "the label does not name the chart";
const svg = team.querySelector("svg");
if (svg.getAttribute("viewBox") !== "0 0 160 100") return `aspect 1.6: viewBox ${svg.getAttribute("viewBox")}`;
const nodes = [...team.querySelectorAll(".ui-network-node")];
if (nodes.length !== 14) return `14 nodes made ${nodes.length}`;
const at = Object.fromEntries(nodes.map((g) => { const c = g.querySelector("circle"); return [g.dataset.id, { x: +c.getAttribute("cx"), y: +c.getAttribute("cy"), r: +c.getAttribute("r") }]; }));
for (const [id, p] of Object.entries(at)) if (p.x < 0 || p.x > 160 || p.y < 0 || p.y > 100) return `${id} is outside the drawing`;
const ids = Object.keys(at);
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = at[ids[i]], b = at[ids[j]];
    if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) return `${ids[i]} and ${ids[j]} overlap`;
}
const links = [...team.querySelectorAll(".ui-network-link")];
if (links.length !== 21) return `21 links made ${links.length} lines`;
const l0 = links[0];
if (+l0.getAttribute("x1") !== at.ana.x || +l0.getAttribute("y2") !== at.rui.y) return "a link does not join its nodes";
// The forces pull linked nodes together: on average they are closer than the rest.
const linked = new Set([["ana","rui"],["ana","eva"],["rui","eva"],["ana","joe"],["rui","kim"],["joe","kim"],["joe","lea"],["kim","max"],["lea","max"],["max","noa"],["noa","lea"],["kim","noa"],["ola","pia"],["pia","quinn"],["ola","quinn"],["ola","ana"],["quinn","sam"],["sam","tia"],["tia","uma"],["uma","sam"],["uma","noa"]].map((p) => p.sort().join()));
let near = [], far = [];
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const d = Math.hypot(at[ids[i]].x - at[ids[j]].x, at[ids[i]].y - at[ids[j]].y);
    (linked.has([ids[i], ids[j]].sort().join()) ? near : far).push(d);
}
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
if (!(avg(near) < avg(far) * 0.6)) return `linked nodes average ${avg(near).toFixed(1)} apart, the rest ${avg(far).toFixed(1)}`;
if (!(+links[0].getAttribute("stroke-width") > +links[2].getAttribute("stroke-width"))) return "a stronger link is not thicker";
if (!(at.kim.r > at.eva.r)) return "a node with more links is not bigger";
const fill = (id) => getComputedStyle(nodes.find((g) => g.dataset.id === id).querySelector("circle")).fill;
if (fill("ana") !== fill("rui") || fill("ana") === fill("joe")) return "nodes are not coloured by group";
if (team.querySelectorAll(".ui-network-legend li").length !== 4) return "no legend of four groups";
if (nodes[0].querySelector("text").textContent !== "Ana" || getComputedStyle(nodes[0].querySelector("text")).visibility !== "visible") return "labels are not shown";
if (nodes[0].querySelector("title").textContent !== "Ana (Design): 4 links") return `a node's title: ${nodes[0].querySelector("title").textContent}`;
if (team.querySelector("tbody tr").textContent !== "AnaDesignRui, Eva, Joe, Ola") return `the table: ${team.querySelector("tbody tr").textContent}`;
if (!svg.hasAttribute("aria-hidden")) return "the drawing is not hidden from screen readers";
if (getComputedStyle(calls.querySelector(".ui-network-node text")).visibility !== "hidden") return "labels={false} still shows labels";
if (calls.querySelector(".ui-network-legend")) return "no groups, yet a legend";
if (calls.querySelector(".ui-network-node text").textContent !== "web") return "a node without a label is not named by its id";
