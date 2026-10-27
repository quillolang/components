const top = $$(".ui-skeleton-lines, .ui-skeleton-rect, .ui-skeleton-circle, .ui-skeleton-card")
    .filter((el) => !el.parentElement.closest("[aria-hidden=true]"));
if (top.some((el) => el.getAttribute("aria-hidden") !== "true")) return "a skeleton is not aria-hidden";
const lines = $(".ui-skeleton-lines");
const rows = lines.querySelectorAll(".ui-skeleton-line");
if (rows.length !== 3) return `lines={3} drew ${rows.length}`;
if (!(rows[2].offsetWidth < rows[0].offsetWidth * 0.8)) return "the last line is not shorter";
const circle = $(".ui-skeleton-circle");
if (circle.offsetWidth !== 48 || circle.offsetHeight !== 48) return `the circle is ${circle.offsetWidth}x${circle.offsetHeight}, not 48x48`;
const rect = $(".ui-skeleton-rect");
if (rect.offsetWidth !== 120 || rect.offsetHeight !== 80) return `the rect is ${rect.offsetWidth}x${rect.offsetHeight}`;
if (getComputedStyle(rect).animationName !== "ui-skeleton-shine") return "no shimmer";
const card = $(".ui-skeleton-card");
if (!card || card.querySelectorAll(".ui-skeleton").length < 6) return "SkeletonCard is not composed of skeletons";
