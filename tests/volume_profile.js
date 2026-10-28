const figs = $$("figure.ui-vp");
if (figs.length !== 2) return `expected 2 volume profiles, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const f = $("#volume_profile-demo-daily figure");
const num = (s) => Number(s.replace(/[$,%]/g, ""));
// The table lists the levels highest first: "lo to hi", volume, bought, sold.
const rows = [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => {
    const [lo, hi] = r.querySelector("th").textContent.split(" to ").map(num);
    const [v, b, s] = [...r.querySelectorAll("td")].map((td) => num(td.textContent));
    return { lo, hi, v, b, s };
}).reverse();
const step = rows[0].hi - rows[0].lo;
if (rows.length < 12 || rows.length > 40) return `${rows.length} levels for rows={24}`;
for (let k = 0; k < rows.length; k++) {
    const r = rows[k];
    if (Math.abs(r.hi - r.lo - step) > 1e-6 || (k > 0 && Math.abs(r.lo - rows[k - 1].hi) > 1e-6)) return `level ${k} is not the next ${step}: ${r.lo} to ${r.hi}`;
    if (Math.abs(r.b + r.s - r.v) > 1) return `level ${k}: bought and sold do not add up to its volume`;
}
if (Math.abs(rows[0].lo / step - Math.round(rows[0].lo / step)) > 1e-6) return `levels do not start on a round price: ${rows[0].lo}`;
const bars = [...f.querySelectorAll(".ui-vp-row")];
if (bars.length !== rows.length) return "not a bar per level";
const poc = rows.reduce((a, r, k) => (r.v > rows[a].v ? k : a), 0);
if (!bars[poc].classList.contains("ui-vp-poc") || f.querySelectorAll(".ui-vp-poc").length !== 1) return `level ${poc}, the busiest, is not the point of control`;
const prof = f.querySelector(".ui-vp-prof").getBoundingClientRect();
const pw = bars[poc].querySelector(".ui-vp-bar").getBoundingClientRect().width;
if (Math.abs(pw - prof.width) > 1) return "the busiest level's bar is not the full width";
const k2 = poc > 2 ? poc - 2 : poc + 2;
const w2 = bars[k2].querySelector(".ui-vp-bar").getBoundingClientRect().width;
if (Math.abs(w2 / pw - rows[k2].v / rows[poc].v) > 0.02) return "bars are not as long as their volume";
// A level higher in price is higher up.
if (!(bars[rows.length - 1].getBoundingClientRect().top < bars[0].getBoundingClientRect().top)) return "higher prices are not higher up";
const tag = f.querySelector(".ui-vp-tag");
if (num(tag.textContent) !== Math.round((rows[poc].lo + rows[poc].hi) / 2 * 100) / 100) return `the point of control says ${tag.textContent}`;
// The value area: contiguous levels around the point of control holding at least 70%.
const inside = bars.map((b, k) => (b.classList.contains("ui-vp-in") ? k : -1)).filter((k) => k >= 0);
const total = rows.reduce((a, r) => a + r.v, 0), held = inside.reduce((a, k) => a + rows[k].v, 0);
if (!inside.includes(poc) || inside.some((k, i) => i > 0 && k !== inside[i - 1] + 1)) return "the value area is not one run of levels around the point of control";
if (held < total * 0.7 - 1 || held - Math.min(rows[inside[0]].v, rows[inside.at(-1)].v) >= total * 0.7) return `the value area holds ${Math.round(held / total * 100)}%`;
const note = f.querySelector(".ui-vp-note").textContent;
if (!note.includes(`value area (70%) $${rows[inside[0]].lo.toFixed(2)} to $${rows[inside.at(-1)].hi.toFixed(2)}`)) return `note: ${note}`;
const tip = bars[poc].querySelector(".ui-vp-tip");
if (getComputedStyle(tip).display !== "none" || !tip.textContent.includes("point of control") || !tip.textContent.includes("Volume" + rows[poc].v.toLocaleString("en-US"))) return `the POC's details: ${tip.textContent}`;
if (f.querySelectorAll(".ui-vp-line").length !== 1 || !f.querySelector(".ui-vp-line").getAttribute("d").startsWith("M")) return "no price line";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
