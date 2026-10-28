const figs = $$("figure.ui-rk");
if (figs.length !== 3) return `expected 3 Renko charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const box = $("#renko_chart-demo-box figure"), auto = $("#renko_chart-demo-auto figure"), plain = $("#renko_chart-demo-closes figure");
const num = (s) => Number(s.replace(/[$,]/g, ""));
const bricks = (f) => [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent));
const b = bricks(box);
if (!/^Box \$2\.00 · \d+ bricks$/.test(box.querySelector(".ui-rk-meta").textContent)) return `meta: ${box.querySelector(".ui-rk-meta").textContent}`;
if (b.length < 5 || box.querySelectorAll(".ui-rk-col").length !== b.length) return "not a column per brick";
for (let i = 0; i < b.length; i++) {
    const [dir, from, to] = [b[i][0], num(b[i][1]), num(b[i][2])];
    if (Math.abs(Math.abs(to - from) - 2) > 1e-9 || (dir === "Up") !== (to > from)) return `brick ${i + 1} is not one $2 box: ${b[i]}`;
    if (from % 2 !== 0) return `brick ${i + 1} does not start on a multiple of the box: ${from}`;
    if (i > 0) {
        const [pdir, , pto] = [b[i - 1][0], num(b[i - 1][1]), num(b[i - 1][2])];
        // The same way on starts at the last brick's end; a turn skips a box.
        const want = pdir === dir ? pto : (dir === "Up" ? pto + 2 : pto - 2);
        if (Math.abs(from - want) > 1e-9) return `brick ${i + 1} starts at ${from}, not ${want}`;
    }
    if (box.querySelectorAll(".ui-rk-col")[i].classList.contains("ui-rk-up") !== (b[i][0] === "Up")) return `brick ${i + 1}'s colour`;
}
// Same-sized bricks are drawn the same height.
const hs = [...box.querySelectorAll(".ui-rk-brick")].map((e) => Math.round(e.getBoundingClientRect().height));
if (Math.max(...hs) - Math.min(...hs) > 1) return `bricks of one box are ${Math.min(...hs)} to ${Math.max(...hs)}px tall`;
const tip = box.querySelectorAll(".ui-rk-col")[2].querySelector(".ui-rk-tip");
if (getComputedStyle(tip).display !== "none" || !tip.textContent.includes(`From${b[2][1]}`) || !tip.textContent.includes(`Formed${b[2][3]}`)) return `brick 3's details: ${tip.textContent}`;
if (!/^Box \$\d/.test(auto.querySelector(".ui-rk-meta").textContent)) return "no box chosen";
const pb = bricks(plain).map((r) => r.slice(0, 3).join(" "));
const want = ["Up 100.00 101.00", "Up 101.00 102.00", "Up 102.00 103.00", "Up 103.00 104.00", "Down 103.00 102.00", "Down 102.00 101.00",
    "Down 101.00 100.00", "Down 100.00 99.00", "Up 100.00 101.00", "Up 101.00 102.00"];
if (pb.join("|") !== want.join("|")) return `the closes made: ${pb.join(" | ")}`;
if (plain.querySelector(".ui-rk-x span") || plain.querySelectorAll("thead th").length !== 4) return "closes without times have a time axis";
if (plain.querySelector(".ui-rk-tag").textContent !== "102.20") return "the last close is not marked";
const xs = [...box.querySelectorAll(".ui-rk-x span")].map((s) => s.getBoundingClientRect());
if (xs.some((r, i) => i > 0 && r.left < xs[i - 1].right + 4)) return "date labels overlap";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
