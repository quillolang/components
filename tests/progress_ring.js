const rings = $$("[role=progressbar]");
if (rings.length !== 8) return `expected 8 rings, found ${rings.length}`;
const a = (el, n) => el.getAttribute(n);
const [sm, md, lg, xl, done, zero, sync, prep] = rings;
if (a(md, "aria-valuenow") !== "42" || a(md, "aria-valuemax") !== "100" || a(md, "aria-valuetext") !== "42%" || a(md, "aria-label") !== "Storage used")
    return `42: ${a(md, "aria-valuenow")} ${a(md, "aria-valuetext")} ${a(md, "aria-label")}`;
if (a(md.querySelector(".ui-pr-arc"), "stroke-dasharray") !== "42 100") return "the arc is not 42 of 100";
if (md.querySelector(".ui-pr-value").textContent !== "42%") return "the middle does not say 42%";
const size = (el) => Math.round(el.querySelector(".ui-pr-ring").getBoundingClientRect().width);
if ([size(sm), size(md), size(lg), size(xl)].join() !== "32,48,72,112") return `sizes: ${[size(sm), size(md), size(lg), size(xl)]}`;
if (getComputedStyle(sm.querySelector(".ui-pr-value")).display !== "none") return "sm shows a value it has no room for";
if (lg.querySelector(".ui-pr-value").textContent !== "3/5" || a(lg, "aria-valuetext") !== "3/5" || a(lg, "aria-valuenow") !== "3") return "value_text";
if (a(lg.querySelector(".ui-pr-arc"), "stroke-dasharray") !== "60 100") return "3 of 5 is not 60%";
if (a(xl.querySelector(".ui-pr-arc"), "stroke-width") !== "8") return "thickness is not applied";
if (xl.querySelector(".ui-pr-label")?.textContent !== "Monthly quota") return "show_label does not write it";
if (!(xl.querySelector(".ui-pr-label").getBoundingClientRect().top > xl.querySelector(".ui-pr-ring").getBoundingClientRect().bottom)) return "xl's label is not under it";
if (a(done.querySelector(".ui-pr-arc"), "stroke-dasharray") !== "100 100") return "100 is not a full ring";
if (zero.querySelector(".ui-pr-arc")) return "0 draws an arc";
if (a(zero, "aria-valuenow") !== "0") return "0 is not said";
for (const busy of [sync, prep]) {
    if (a(busy, "aria-valuenow") !== null || !busy.classList.contains("ui-pr-busy")) return "no value is not indeterminate";
    if (getComputedStyle(busy.querySelector("svg")).animationName !== "ui-pr-turn") return "the indeterminate ring does not turn";
}
const box = md.querySelector(".ui-pr-value").getBoundingClientRect(), ring = md.querySelector(".ui-pr-ring").getBoundingClientRect();
if (box.width > ring.width * 0.8) return "the percentage overflows the ring";
const full = done.querySelector(".ui-pr-value").getBoundingClientRect();
if (full.width > ring.width * 0.8) return "100% overflows the ring";
