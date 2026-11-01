// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#break-even-calc-demo-title").closest(".ui-break-even");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent.trim().replace(/\s+/g, " ");
const f = (n, id = "break-even-calc-demo") => $(`#${id}-${n}`);
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
// By hand: 12,000 over a margin of 5.00 is 2,400; 3,000 units leave 600, 20%; (12,000 + 10,000) / 3,000 + 7.50 is 14.8333, up to 14.84.
if (s("margin") !== "$5.00 (40.0%)" || s("units") !== "2,400 units" || s("revenue") !== "$30,000.00") return `start: ${s("margin")} ${s("units")} ${s("revenue")}`;
if (s("profit") !== "$3,000.00" || s("safety") !== "600 units, 20.0%" || s("safety_revenue") !== "$7,500.00") return `at the volume: ${s("profit")} ${s("safety")} ${s("safety_revenue")}`;
if (s("target") !== "A profit of $10,000.00 on 3,000 units takes a price of $14.84.") return `target: ${s("target")}`;
if (s("exact")) return "an exact break-even needs no note";
// The chart: lines cross at the break-even: the dot is on the revenue line.
const dot = c.querySelector("circle"), rev = c.querySelector(".ui-break-even-revenue").getAttribute("points").split(" ").map((p) => p.split(",").map(Number));
const atX = rev[0][1] + (rev[1][1] - rev[0][1]) * (Number(dot.getAttribute("cx")) - rev[0][0]) / (rev[1][0] - rev[0][0]);
if (Math.abs(atX - Number(dot.getAttribute("cy"))) > 0.2) return `the dot is off the line: ${atX} ${dot.getAttribute("cy")}`;
if (!c.querySelector("svg").getAttribute("aria-label").includes("2,400 units")) return "the chart's label";
// Below break-even.
type(f("volume"), "2000"); await tick();
if (s("profit") !== "-$2,000.00" || s("safety") !== "-400 units, -20.0%" || s("below") !== "The planned volume is below break-even.") return `below: ${s("profit")} ${s("safety")}`;
type(f("volume"), "2400"); await tick();
if (s("profit") !== "$0.00" || s("safety") !== "0 units, 0.0%" || s("below")) return `exactly at: ${s("profit")} ${s("safety")}`;
// No volume: no margin of safety, and the target price cannot be worked out.
type(f("volume"), ""); await tick();
if (s("safety") || s("target") !== "Enter a planned volume to see the price a target profit needs.") return `no volume: ${s("target")}`;
type(f("volume"), "3000"); await tick();
// A price at or below the variable cost.
type(f("price"), "7.50"); await tick();
if (!s("never").includes("no volume breaks even") || !s("never").includes("above $7.50") || s("units")) return `no margin: ${s("never")}`;
type(f("price"), "6"); await tick();
if (!s("never").includes("each unit loses $1.50") || s("profit") !== "-$16,500.00") return `a loss: ${s("never")} ${s("profit")}`;
if (s("target") !== "A profit of $10,000.00 on 3,000 units takes a price of $14.84.") return `target at a loss: ${s("target")}`;
type(f("price"), ""); await tick();
if (s("never") !== "Enter a price to work out the break-even.") return `no price: ${s("never")}`;
type(f("price"), "12.50"); await tick();
// No fixed costs: nothing to cover.
type(f("fixed"), "0"); await tick();
if (s("units") !== "0 units" || s("revenue") !== "$0.00") return `no fixed: ${s("units")}`;
type(f("fixed"), "12000"); await tick();
// Bad input.
for (const [n, t, want] of [["fixed", "abc", "fixed costs"], ["fixed", "-1", "fixed costs"], ["variable", "12,50", "variable cost"], ["price", "1e9", "price"], ["volume", "10.5", "volume"], ["volume", "-3", "volume"], ["target", "a lot", "target profit"], ["price", "９", "price"]]) {
    const was = f(n).value;
    type(f(n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-break-even-out")) return `${n} ${t}: ${alert()}`;
    if (f(n).getAttribute("aria-invalid") !== "true") return `${n} ${t} aria-invalid`;
    type(f(n), was);
}
await tick();
// The far end: a huge fixed cost on a one-cent margin.
type(f("fixed"), "10000000000"); type(f("variable"), "999999.99"); type(f("price"), "1000000"); await tick();
if (!alert().includes("too small")) return `too far: ${alert()}`;
type(f("fixed"), "12000"); type(f("variable"), "7.50"); type(f("price"), "12.50"); await tick();
// Rounded up to whole units, with the word for them, and the callback.
const d = $("#break-even-calc-demo-live-title").closest(".ui-break-even");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("units", d) !== "308 cups" || s("revenue", d) !== "€1,925.00") return `whole units: ${s("units", d)} ${s("revenue", d)}`;
if (s("exact", d) !== "Exactly 307.69 cups, rounded up: whole cups are sold.") return `exact: ${s("exact", d)}`;
if (s("safety", d) !== "-58 cups, -23.1%") return `live safety: ${s("safety", d)}`;
type(f("volume", "break-even-calc-demo-live"), "400"); await tick();
if (note() !== "on_change: 308 units, profit 300.00, price 5.50.") return `on_change: ${note()}`;
