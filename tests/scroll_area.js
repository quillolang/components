const notes = $("#scroll-area-demo-notes"), steps = $("#scroll-area-demo-steps");
if (!notes || !steps) return "the two boxes are missing";
const cs = getComputedStyle(notes);
if (cs.overflowY !== "auto" || cs.maxHeight !== "220px") return `the box is overflow ${cs.overflowY}, max-height ${cs.maxHeight}`;
if (notes.scrollHeight <= notes.clientHeight + 10) return "the box does not scroll";
if (notes.getAttribute("role") !== "region" || notes.getAttribute("aria-label") !== "Release notes" || notes.tabIndex !== 0) return "a labelled box is not a focusable region";
if (cs.paddingLeft !== "4px") return `pad={4} gives ${cs.paddingLeft}`;
const top = notes.querySelector(".ui-scroll-top"), bottom = notes.querySelector(".ui-scroll-bottom");
if (!top || !bottom || top.getAttribute("aria-hidden") !== "true") return "the top and bottom fades are missing";
if (CSS.supports("animation-timeline: scroll()")) {
    notes.scrollTop = 0; await wait(150);
    if (+getComputedStyle(top).opacity > 0.05 || +getComputedStyle(bottom).opacity < 0.95) return `at the top the fades are ${getComputedStyle(top).opacity} / ${getComputedStyle(bottom).opacity}`;
    notes.scrollTop = notes.scrollHeight; await wait(150);
    if (+getComputedStyle(top).opacity < 0.95 || +getComputedStyle(bottom).opacity > 0.05) return `at the bottom the fades are ${getComputedStyle(top).opacity} / ${getComputedStyle(bottom).opacity}`;
    notes.scrollTop = 0;
}
const ss = getComputedStyle(steps);
if (ss.overflowX !== "auto" || steps.scrollWidth <= steps.clientWidth + 10) return "axis=\"x\" does not scroll across";
if (ss.maxHeight !== "none") return `height={null} still limits the height: ${ss.maxHeight}`;
if (!steps.querySelector(".ui-scroll-start") || !steps.querySelector(".ui-scroll-end") || steps.querySelector(".ui-scroll-top")) return "the across box has the wrong fades";
