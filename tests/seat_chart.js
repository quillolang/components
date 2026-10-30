const h = $("#seat-chart-demo-house");
if (!h || h.tagName !== "FIGURE" || h.querySelector("figcaption").textContent !== "House of Commons, 650 seats") return "a captioned figure";
const svg = h.querySelector("svg");
if (svg.querySelectorAll("circle").length !== 650) return `650 seats, drew ${svg.querySelectorAll("circle").length}`;
const groups = [...svg.querySelectorAll("g")];
if (groups.map((g) => g.querySelectorAll("circle").length).join() !== "411,72,46,121") return "seats per party";
if (groups[0].querySelector("title").textContent !== "Labour: 411") return "the party's tooltip";
const label = svg.getAttribute("aria-label");
if (svg.getAttribute("role") !== "img" || label !== "Labour 411, Liberal Democrats 72, Others 46, Conservative 121, of 650 seats; 326 for a majority, which Labour has.") return `the chart says: ${label}`;
if (getComputedStyle(groups[0].querySelector("circle")).fill !== "rgb(213, 0, 0)") return `color given: ${getComputedStyle(groups[0].querySelector("circle")).fill}`;
// Labour sits on the left, the Conservatives on the right, and no two seats overlap.
const c = (el) => [Number(el.getAttribute("cx")), Number(el.getAttribute("cy")), Number(el.getAttribute("r"))];
const mean = (g) => { const xs = [...g.querySelectorAll("circle")].map((e) => c(e)[0]); return xs.reduce((a, b) => a + b) / xs.length; };
if (!(mean(groups[0]) < 90 && mean(groups[3]) > 130)) return `left to right: ${mean(groups[0])}, ${mean(groups[3])}`;
const all = [...svg.querySelectorAll("circle")].map(c);
for (let i = 0; i < all.length; i += 7) for (let j = i + 1; j < all.length; j++) {
    const [x1, y1, r] = all[i], [x2, y2] = all[j];
    if (Math.hypot(x1 - x2, y1 - y2) < 2 * r - 0.01) return `seats ${i} and ${j} overlap`;
}
if (all.some(([x, y, r]) => x - r < 0 || x + r > 200 || y - r < 0 || y + r > 108)) return "a seat is outside the box";
const center = h.querySelector(".ui-seats-center").textContent;
if (center !== "650326 for majority") return `center: ${center}`;
const items = [...h.querySelectorAll(".ui-seats-legend li")];
if (items.length !== 4 || items[0].querySelector(".ui-seats-maj")?.textContent !== "Majority" || items[1].querySelector(".ui-seats-maj")) return "the majority in the legend";
if (items[0].querySelector(".ui-seats-chg").textContent !== "+211" || !items[0].querySelector(".ui-seats-chg").classList.contains("ui-seats-gain")) return "a gain";
if (items[3].querySelector(".ui-seats-chg").textContent !== "-244" || !items[3].querySelector(".ui-seats-chg").classList.contains("ui-seats-loss")) return "a loss";
if (items[1].getAttribute("title") !== "LD") return "short";
const n = $("#seat-chart-demo-night");
const ng = [...n.querySelectorAll("svg g")];
if (ng.length !== 4 || !ng[3].classList.contains("ui-seats-none") || ng[3].querySelectorAll("circle").length !== 9) return "undeclared seats";
if (getComputedStyle(ng[3].querySelector("circle")).fill !== "none") return "undeclared seats are filled";
if (n.querySelector(".ui-seats-maj") || !n.querySelector("svg").getAttribute("aria-label").endsWith("9 undeclared, of 51 seats; 26 for a majority.")) return `no majority yet: ${n.querySelector("svg").getAttribute("aria-label")}`;
if (getComputedStyle(ng[0].querySelector("circle")).fill === getComputedStyle(ng[1].querySelector("circle")).fill) return "the theme's colours are all the same";
