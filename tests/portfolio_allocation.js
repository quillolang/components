const figs = $$("figure.ui-palloc");
if (figs.length !== 2) return `expected 2 portfolios, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a portfolio has NaN, Infinity or undefined in it";
const f = $("#portfolio_allocation-demo-main figure"), many = $("#portfolio_allocation-demo-many figure");
const num = (s) => Number(s.replace(/[$,+%]/g, ""));
const rows = [...f.querySelectorAll("tbody tr")];
const syms = rows.map((r) => r.querySelector("th b").textContent);
if (syms.join() !== "NOVA,BOND,WRLD,ACME,GLBX,CASH") return `not largest first: ${syms}`;
// shares × price makes the value; weights are shares of the total; gains are value less cost.
const value = (r) => num(r.cells[2].textContent);
if (value(rows[0]) !== 24738 || value(rows[3]) !== 14592) return "shares × price is not the value";
const total = rows.reduce((a, r) => a + value(r), 0);
if (num(f.querySelector("tfoot td:nth-child(3)").textContent) !== total) return "the total value";
for (const r of rows) {
    const w = num(r.cells[1].textContent);
    if (Math.abs(w - value(r) / total * 100) > 0.051) return `${r.querySelector("b").textContent}'s weight ${w}%`;
    if (Math.abs(parseFloat(r.querySelector(".ui-palloc-bar span").style.width) - value(r) / total * 100) > 0.01) return "the weight bar is not the weight";
}
const gain = rows[1].cells[3];
if (gain.firstChild.textContent !== "-$900.00" || gain.querySelector("small").textContent !== "-4.02%" || !gain.classList.contains("ui-palloc-down")) return `BOND's gain: ${gain.textContent}`;
if (!rows[0].cells[3].classList.contains("ui-palloc-up") || rows[0].cells[3].firstChild.textContent !== "+$5,838.00") return "NOVA's gain";
const segs = [...f.querySelectorAll(".ui-palloc-seg")];
if (segs.length !== 6) return "not a ring part per holding";
const dash = segs.map((s) => parseFloat(s.getAttribute("stroke-dasharray")));
if (Math.abs(dash[0] - (24738 / total * 100 - 0.6)) > 0.01) return "the ring's parts are not the weights";
if (getComputedStyle(segs[0]).stroke !== getComputedStyle(rows[0].querySelector(".ui-palloc-key")).backgroundColor) return "the ring and the table do not share colours";
const center = f.querySelector(".ui-palloc-sum").textContent;
if (!center.startsWith("$88,171.50") || !center.includes("+$9,291.50 (+11.78%)")) return `the middle says ${center}`;
if (getComputedStyle(f.querySelector(".ui-palloc-c3")).visibility !== "hidden") return "a holding's weight shows in the middle before hover";
if (f.getAttribute("aria-label") !== "Retirement account, $88,171.50" || !f.querySelector("caption").textContent.includes("6 holdings")) return "names";
const mrows = [...many.querySelectorAll("tbody tr")];
if (mrows.length !== 8 || mrows[7].querySelector("b").textContent !== "Other" || mrows[7].cells[2].textContent !== "$1,480") return `eleven make: ${mrows.map((r) => r.textContent).join(" | ")}`;
if (many.querySelectorAll("thead th").length !== 3 || many.querySelector(".ui-palloc-gain")) return "without costs there is no gain column";
if (!many.querySelector("caption").textContent.includes("11 holdings")) return "the caption counts every holding";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
