if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const charts = $$("figure.ui-piec");
if (charts.length !== 3) return `expected 3 pie charts, found ${charts.length}`;
if (/NaN|Infinity|undefined/.test(charts.map((c) => c.innerHTML).join(""))) return "a chart has NaN, Infinity or undefined in it";
const [traffic, browsers, spend] = charts;
if (traffic.getAttribute("aria-label") !== "Traffic by source, total 8,825") return `aria-label: ${traffic.getAttribute("aria-label")}`;
const parts = [...traffic.querySelectorAll(".ui-piec-part")];
// Ads (1.4%) and Print (0.5%) are under 3%: gathered into Other.
if (parts.length !== 6) return `7 parts with two small ones made ${parts.length} slices, not 6`;
const names = [...traffic.querySelectorAll(".ui-piec-name")].map((t) => t.textContent);
if (names.join("|") !== "Search 47.7%|Direct 27%|Social 12.7%|Email 7.3%|Referral 3.5%|Other 1.9%") return `labels: ${names.join("|")}`;
const other = parts[5].querySelector(".ui-piec-slice");
if (getComputedStyle(other).fill !== getComputedStyle(traffic).getPropertyValue("--ui-strong").trim() && !parts[5].classList.contains("ui-piec-s9")) return "Other is not grey";
if (new Set(parts.slice(0, 5).map((p) => getComputedStyle(p.querySelector(".ui-piec-slice")).fill)).size !== 5) return "slices share a colour";
// The first slice runs clockwise from the top: its arc starts at (0, -r).
const d = parts[0].querySelector(".ui-piec-slice").getAttribute("d");
if (!/^M0,0 L0,-100 A100,100 0 0 1 /.test(d)) return `the first slice does not start at the top: ${d}`;
if (parts[0].querySelector("title").textContent !== "Search: 4,210 (47.7%)") return "slices have no title";
// Labels on one side never overlap.
const boxes = [...traffic.querySelectorAll(".ui-piec-name")].map((t) => t.getBoundingClientRect());
for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.left < b.right && b.left < a.right && a.top < b.bottom - 1 && b.top < a.bottom - 1) return `labels ${names[i]} and ${names[j]} overlap`;
}
if (traffic.querySelectorAll(".ui-piec-lead").length !== 6) return "labels have no leader lines";
const rows = [...traffic.querySelectorAll("tbody tr")].map((r) => r.textContent);
if (rows[5] !== "Other (Ads, Print)1651.9%") return `the table's Other row: ${rows[5]}`;
const css = getComputedStyle(parts[0].querySelector(".ui-piec-slice"));
if (css.transform !== "none") return "a slice is pulled out before hover";
if (parts[0].querySelector(".ui-piec-slice").style.getPropertyValue("--dx") === "") return "slices have no direction to pull out in";

const bnames = [...browsers.querySelectorAll(".ui-piec-name")].map((t) => t.textContent);
if (bnames.join("|") !== "Chrome 64.7%|Safari 18.6%|Edge 5.3%|Other 11.4%") return `other_below={5}: ${bnames.join("|")}`;
if (Math.round(browsers.querySelector("svg").getBoundingClientRect().width) !== 160 + 260) return "size does not set the pie's width";

if (spend.querySelector(".ui-piec-name")) return "labels={false} still writes labels";
const li = [...spend.querySelectorAll(".ui-piec-legend li")].map((l) => l.textContent);
if (li[1] !== "Food$612.4021.2%") return `the legend reads ${li[1]}`;
if (!spend.querySelector(".ui-piec-legend").hasAttribute("aria-hidden")) return "the legend is read along with the table";
if (traffic.querySelector(".ui-piec-legend")) return "a legend without legend={true}";
