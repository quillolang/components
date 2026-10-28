if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-gbarc");
if (charts.length !== 3) return `expected 3 grouped bar charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [plans, budget, change] = charts;
if (plans.getAttribute("aria-label") !== "Signups by plan") return "the label does not name the chart";
if (plans.querySelectorAll(".ui-gbarc-legend li").length !== 3) return "three series have no legend";
const cols = plans.querySelectorAll(".ui-gbarc-col");
if (cols.length !== 4) return `4 labels made ${cols.length} groups`;
const bars = [...cols[3].querySelectorAll(".ui-gbarc-bar")];
if (bars.length !== 3) return "a group is not three bars";
const [b0, b1, b2] = bars.map((b) => b.getBoundingClientRect());
if (!(b0.right <= b1.left + 0.5 && b1.right <= b2.left + 0.5)) return "the bars of a group overlap instead of standing side by side";
if (Math.abs(b0.bottom - b1.bottom) > 0.5) return "the bars do not share a baseline";
// 3120 on an axis to 4000, 240px high.
if (Math.abs(b0.height - 240 * 3120 / 4000) > 1) return `3120 is ${b0.height}px high`;
if (new Set(bars.map((b) => getComputedStyle(b).backgroundColor)).size !== 3) return "the series share a colour";
const tip = cols[3].querySelector(".ui-gbarc-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== "Q4Free3,120Pro810Team245") return `tooltip: ${tip.textContent}`;
if (plans.querySelector(".ui-gbarc-val")) return "value labels without value_labels";

const vals = [...budget.querySelectorAll(".ui-gbarc-val")].map((v) => v.textContent);
if (vals.join() !== "$42k,$39.5k,$96k,$104.2k,$58k,$51.8k") return `value labels: ${vals}`;
if (budget.querySelectorAll("tbody tr").length !== 3 || budget.querySelectorAll("thead th").length !== 3) return "the screen reader table";

const neg = change.querySelectorAll(".ui-gbarc-col")[1].querySelector(".ui-gbarc-bar");
if (!neg.classList.contains("ui-gbarc-neg") || getComputedStyle(neg).borderBottomLeftRadius !== "4px") return "a negative bar does not hang down, rounded below";
const zero = change.querySelector(".ui-gbarc-zero");
if (!zero || Math.abs(neg.getBoundingClientRect().top - zero.getBoundingClientRect().top) > 1.5) return "the negative bar does not start at the zero line";
if (!change.querySelectorAll(".ui-gbarc-col")[1].querySelector(".ui-gbarc-under")) return "a negative value's label is not under its bar";
if (change.querySelectorAll("tbody td")[2].textContent !== "-4%") return `-4 reads ${change.querySelectorAll("tbody td")[2].textContent}`;
