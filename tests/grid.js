const [auto, fixed] = $$(".ui-grid");
if (!auto || !fixed) return "expected two grids";
const tracks = (g) => getComputedStyle(g).gridTemplateColumns.split(" ").length;
if (tracks(auto) < 3) return `min={160} gives ${tracks(auto)} columns in a wide stage`;
const narrowest = Math.min(...[...auto.children].map((c) => c.getBoundingClientRect().width));
if (narrowest < 159) return `a cell is ${narrowest}px wide, under the 160px minimum`;
if (tracks(fixed) !== 3) return `columns={3} gives ${tracks(fixed)} columns`;
const [a, b] = fixed.children;
if (Math.abs(a.getBoundingClientRect().width - b.getBoundingClientRect().width) > 1) return "fixed columns are not equal";
