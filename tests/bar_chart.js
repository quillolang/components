const charts = $$("figure.ui-bc");
if (charts.length !== 5) return `expected 5 bar charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test($(".demo-stack").innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const [orders, plans, revenue, cash, pages] = charts;
if (orders.getAttribute("aria-label") !== "Orders this week") return "the label does not name the chart";
if (orders.querySelector("figcaption")?.textContent !== "Orders this week") return "show_label does not write the label";
const bars = [...orders.querySelectorAll(".ui-bc-bar")];
if (bars.length !== 7) return `7 values made ${bars.length} bars`;
const ticks = [...orders.querySelectorAll(".ui-bc-y span")].map((s) => s.textContent);
if (ticks.join() !== "0,100,200,300") return `the axis ticks are ${ticks}`;
const fri = bars[4];
if (fri.style.getPropertyValue("--b").trim() !== "74.67%" || fri.style.getPropertyValue("--a").trim() !== "0%")
    return `224 of 300 is drawn as ${fri.getAttribute("style")}`;
if (Math.abs(fri.getBoundingClientRect().height - 200 * 224 / 300) > 1) return `the bar is ${fri.getBoundingClientRect().height}px high`;
if (getComputedStyle(fri).borderTopLeftRadius !== "4px" || getComputedStyle(fri).borderBottomLeftRadius !== "0px") return "bars are not rounded at the top only";
const vals = [...orders.querySelectorAll(".ui-bc-val")].map((v) => v.textContent);
if (vals.join() !== "132,158,141,187,224,96,78") return `value labels: ${vals}`;
if (orders.querySelector(".ui-bc-legend")) return "one series has a legend";
const tip = orders.querySelectorAll(".ui-bc-tip")[4];
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.querySelector("strong").textContent !== "Fri" || tip.querySelector("b").textContent !== "224") return `tooltip: ${tip.textContent}`;
const rows = [...orders.querySelectorAll("table.ui-sr tbody tr")].map((r) => r.textContent);
if (rows.length !== 7 || rows[0] !== "Mon132") return `the screen reader table: ${rows}`;
if (!orders.querySelector(".ui-bc-v").hasAttribute("aria-hidden")) return "the drawing is not hidden from screen readers";

if (plans.querySelectorAll(".ui-bc-legend li").length !== 3) return "three series have no legend of three";
if (plans.querySelectorAll(".ui-bc-col").length !== 4 || plans.querySelectorAll(".ui-bc-col")[0].querySelectorAll(".ui-bc-bar").length !== 3)
    return "grouped: not three bars per category";
const colors = [...plans.querySelectorAll(".ui-bc-col")[0].querySelectorAll(".ui-bc-bar")].map((b) => getComputedStyle(b).backgroundColor);
if (new Set(colors).size !== 3) return `the series share colours: ${colors}`;
if (plans.querySelectorAll("thead th").length !== 4) return "the table has no column per series";

const stack = revenue.querySelectorAll(".ui-bc-col")[0];
if (stack.querySelectorAll(".ui-bc-slot").length !== 1 || stack.querySelectorAll(".ui-bc-bar").length !== 2) return "stacked: not one slot of two";
const [online, stores] = stack.querySelectorAll(".ui-bc-bar");
if (!online.classList.contains("ui-bc-mid") || stores.classList.contains("ui-bc-mid")) return "only the top of a stack is rounded";
if (stores.style.getPropertyValue("--a").trim() !== online.style.getPropertyValue("--b").trim()) return "the second part does not sit on the first";
if (stack.querySelector(".ui-bc-val").textContent !== "$72,600") return `the stack's total reads ${stack.querySelector(".ui-bc-val").textContent}`;
if (!stack.querySelector(".ui-bc-tip").textContent.includes("Total$72,600")) return "the stacked tooltip has no total";
if (revenue.querySelector(".ui-bc-y span:last-child").textContent !== "$100k") return `the axis top reads ${revenue.querySelector(".ui-bc-y span:last-child").textContent}`;

const neg = cash.querySelectorAll(".ui-bc-bar")[1];
if (!neg.classList.contains("ui-bc-neg") || getComputedStyle(neg).borderBottomLeftRadius !== "4px") return "a negative bar does not hang down, rounded below";
const zero = cash.querySelector(".ui-bc-zero");
if (!zero || Math.abs(neg.getBoundingClientRect().top - zero.getBoundingClientRect().top) > 1.5) return "the negative bar does not start at the zero line";
if (![...cash.querySelectorAll(".ui-bc-y span")].some((s) => s.textContent === "-$5k")) return "the axis has no -$5k";
if (cash.querySelectorAll("tbody td")[1].textContent !== "-$3,800") return `-3800 reads ${cash.querySelectorAll("tbody td")[1].textContent}`;

if (pages.querySelectorAll(".ui-bc-row").length !== 5) return "horizontal: not a row per label";
const first = pages.querySelector(".ui-bc-row .ui-bc-bar"), last = [...pages.querySelectorAll(".ui-bc-row .ui-bc-bar")][4];
if (!(first.getBoundingClientRect().width > last.getBoundingClientRect().width * 7)) return "horizontal bars are not as long as their values";
if (Math.abs(first.getBoundingClientRect().height - 14) > 0.5) return "horizontal bars are not 14px thick";
if (pages.querySelector(".ui-bc-rl").textContent !== "/pricing") return "the row labels are missing";
if (pages.querySelector(".ui-bc-val").textContent !== "18,420") return "horizontal value labels";
if ([...pages.querySelectorAll(".ui-bc-hx span")].map((s) => s.textContent).join() !== "0,5k,10k,15k,20k") return "the horizontal axis ticks";
