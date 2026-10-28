if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-radarc");
if (charts.length !== 2) return `expected 2 radar charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [phones, skills] = charts;
if (phones.querySelectorAll(".ui-radarc-ring").length !== 5) return "levels={5} did not make five rings";
if (phones.querySelectorAll(".ui-radarc-spoke").length !== 6) return "not a spoke per axis";
const axes = [...phones.querySelectorAll(".ui-radarc-axis")].map((t) => t.textContent);
if (axes.join() !== "Camera,Battery,Screen,Speed,Price,Support") return `axis names: ${axes}`;
if (phones.querySelectorAll(".ui-radarc-axis")[0].getAttribute("text-anchor") !== "middle") return "the top axis' name is not centred";
const ticks = [...phones.querySelectorAll(".ui-radarc-tick")].map((t) => t.textContent);
if (ticks.join() !== "2,4,6,8,10") return `ring labels: ${ticks}`;
const shapes = [...phones.querySelectorAll(".ui-radarc-shape")];
if (shapes.length !== 3) return "not a shape per series";
// Model A's camera, 8.5 of 10, straight up: (0, -85).
const first = shapes[0].getAttribute("points").split(" ")[0];
if (first !== "0,-85") return `the first point is ${first}, not 0,-85`;
// Its battery, 6 of 10, a sixth of a turn round: (60 sin 60°, -60 cos 60°).
const [bx, by] = shapes[0].getAttribute("points").split(" ")[1].split(",").map(Number);
if (Math.abs(bx - 60 * Math.sin(Math.PI / 3)) > 0.01 || Math.abs(by + 30) > 0.01) return `the second point is ${bx},${by}`;
if (new Set(shapes.map((s) => getComputedStyle(s).stroke)).size !== 3) return "the series share a colour";
if (phones.querySelectorAll(".ui-radarc-legend li").length !== 3) return "three series have no legend";
if (phones.querySelector(".ui-radarc-pt title").textContent !== "Model A, Camera: 8.5") return "points have no title";
if (getComputedStyle(phones.querySelector(".ui-radarc-series")).opacity !== "1") return "a series is faded before hover";
const svg = phones.querySelector("svg").getBoundingClientRect();
const names = [...phones.querySelectorAll(".ui-radarc-axis")].map((t) => t.getBoundingClientRect());
if (names.some((r) => r.left < svg.left - 1 || r.right > svg.right + 1)) return "an axis name is cut off";
if (phones.querySelectorAll("tbody tr").length !== 6 || phones.querySelectorAll("thead th").length !== 4) return "the screen reader table";

if (skills.querySelector(".ui-radarc-legend")) return "one series has a legend";
const sk = skills.querySelector(".ui-radarc-shape").getAttribute("points").split(" ");
if (sk[4] !== "0,0") return "a null is not drawn at the centre";
if (skills.querySelectorAll("tbody td")[4].textContent !== "—") return "a null is not a dash in the table";
if (skills.querySelectorAll("tbody td")[0].textContent !== "72 pts") return "the suffix";
if (Math.round(skills.querySelector("svg").getBoundingClientRect().width) !== 300) return "size={300}";
