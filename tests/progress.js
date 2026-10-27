const bars = $$("[role=progressbar]");
if (bars.length !== 10) return `expected 10 progress bars, found ${bars.length}`;
const a = (el, n) => el.getAttribute(n);
const [up, steps, , busy, part] = bars;
if (a(up, "aria-valuenow") !== "42" || a(up, "aria-valuemax") !== "100" || a(up, "aria-valuetext") !== "42%")
    return `value=42: now ${a(up, "aria-valuenow")} max ${a(up, "aria-valuemax")} text ${a(up, "aria-valuetext")}`;
if (a(up, "aria-label") !== "Uploading 12 photos") return "the label is not the bar's aria-label";
if (up.querySelector(".ui-progress-fill").style.width !== "42%") return `the fill is ${up.querySelector(".ui-progress-fill").style.width}`;
if (!up.parentElement.textContent.includes("42%")) return "show_value does not show 42%";
if (a(steps, "aria-valuenow") !== "3" || a(steps, "aria-valuemax") !== "5" || a(steps, "aria-valuetext") !== "60%")
    return `3 of 5: now ${a(steps, "aria-valuenow")} max ${a(steps, "aria-valuemax")} text ${a(steps, "aria-valuetext")}`;
if (a(busy, "aria-valuenow") !== null || !busy.closest(".ui-progress-busy")) return "no value is not indeterminate";
if (getComputedStyle(busy.querySelector(".ui-progress-fill")).animationName !== "ui-progress-slide") return "the indeterminate bar does not move";
if (part.querySelector(".ui-progress-fill").style.width !== "66.5%") return `66.5 fills ${part.querySelector(".ui-progress-fill").style.width}`;
const ring = bars[5];
if (!ring.classList.contains("ui-progress-ring")) return "variant=ring is not a ring";
if (a(ring.querySelector(".ui-progress-arc"), "stroke-dasharray") !== "72 100") return "the ring's arc is not 72 of 100";
if (ring.textContent.trim() !== "72%") return `the ring says "${ring.textContent.trim()}"`;
if (a(bars[9], "aria-valuenow") !== null || !bars[9].classList.contains("ui-progress-busy")) return "the ring without a value is not indeterminate";
