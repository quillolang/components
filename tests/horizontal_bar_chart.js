if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-hbarc");
if (charts.length !== 3) return `expected 3 horizontal bar charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [pages, teams, heads] = charts;
const labels = [...pages.querySelectorAll(".ui-hbarc-label")].map((l) => l.textContent);
if (labels.join() !== "/pricing,/docs/getting-started,/blog/quillo-1-0,/components,/about,/careers") return `sort="desc" gives ${labels}`;
const bars = [...pages.querySelectorAll(".ui-hbarc-bar")];
const w = bars.map((b) => b.getBoundingClientRect().width);
if (!w.every((x, i) => i === 0 || x <= w[i - 1])) return "the sorted bars do not shrink down the chart";
if (Math.abs(w[0] / w[5] - 18420 / 1180) > 0.3) return "bars are not as long as their values";
const r0 = bars[0].getBoundingClientRect(), l0 = pages.querySelectorAll(".ui-hbarc-label")[0].getBoundingClientRect();
if (Math.abs((r0.top + r0.bottom) / 2 - (l0.top + l0.bottom) / 2) > 2) return "a label is not beside its bar";
if (r0.left < l0.right) return "the bars overlap the labels";
if (Math.abs(r0.height - 16) > 0.5) return `bars are ${r0.height}px thick, not 16`;
if (pages.querySelector(".ui-hbarc-val").textContent !== "18,420") return "the value labels";
if ([...pages.querySelectorAll(".ui-hbarc-x span")].map((s) => s.textContent).join() !== "0,5k,10k,15k,20k") return "the axis ticks";
const tip = pages.querySelector(".ui-hbarc-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "/pricing18,420") return `tooltip: ${tip.textContent}`;
if (pages.querySelector("tbody tr").textContent !== "/pricing18,420") return "the table is not in the chart's order";

const tl = [...teams.querySelectorAll(".ui-hbarc-label")].map((l) => l.textContent);
if (tl[0] !== "Sales") return "sort none does not keep the order";
const hl = teams.querySelector(".ui-hbarc-hl");
if (!hl || hl.querySelector(".ui-hbarc-label").textContent !== "Support") return "highlight does not mark its row";
const colors = [...teams.querySelectorAll(".ui-hbarc-bar")].map((b) => getComputedStyle(b).backgroundColor);
if (colors[1] === colors[0] || colors[0] !== colors[2]) return "the highlighted bar is not the only one in a second colour";
if ([...teams.querySelectorAll(".ui-hbarc-x span")].pop().textContent !== "100") return "limit does not set the axis' end";

const neg = heads.querySelectorAll(".ui-hbarc-bar")[2];
if (!neg.classList.contains("ui-hbarc-neg")) return "a negative bar is not marked";
const zero = heads.querySelector(".ui-hbarc-zero").getBoundingClientRect();
if (Math.abs(neg.getBoundingClientRect().right - zero.left) > 1.5) return "a negative bar does not end at the zero line";
if (!heads.querySelectorAll(".ui-hbarc-val")[2].classList.contains("ui-hbarc-under") || heads.querySelectorAll(".ui-hbarc-val")[2].textContent !== "-2")
    return "a negative value's label is not left of its bar";
if (Math.abs(neg.getBoundingClientRect().height - 12) > 0.5) return "bar_height does not set the thickness";
