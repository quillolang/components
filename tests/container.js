const cs = $$(".ui-container");
if (cs.length !== 3) return `expected 3 containers, found ${cs.length}`;
const w = cs.map((c) => c.getBoundingClientRect().width);
if (!(w[0] < w[1] && w[1] <= w[2])) return `sizes sm < md <= lg expected, got widths ${w.join(", ")}`;
if (w[0] > 640.5) return `size="sm" is ${w[0]}px wide, more than 640px`;
const r = cs[0].getBoundingClientRect(), p = cs[0].parentElement.getBoundingClientRect();
if (Math.abs((r.left - p.left) - (p.right - r.right)) > 1) return "the container is not centred";
if (getComputedStyle(cs[0]).paddingLeft !== "24px") return `side padding is ${getComputedStyle(cs[0]).paddingLeft}, expected 24px on a wide screen`;
