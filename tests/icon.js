const sizes = $$("#icon-demo-sizes svg.ui-icon");
if (sizes.length !== 6) return `expected 6 sized icons, found ${sizes.length}`;
const widths = sizes.map((s) => s.getBoundingClientRect().width);
if (widths.join() !== "12,16,20,24,32,48") return `sizes are ${widths}`;
if (sizes[5].getAttribute("stroke-width") !== "1.5") return "stroke is not passed through";
if (sizes[0].getAttribute("aria-hidden") !== "true" || sizes[0].hasAttribute("role")) return "an icon without a label is not hidden from screen readers";
const warn = $('#icon-demo-text svg[data-icon="warning"]');
if (warn.getAttribute("role") !== "img" || warn.getAttribute("aria-label") !== "Warning" || warn.hasAttribute("aria-hidden")) return "a labelled icon is not an image for screen readers";
if (getComputedStyle(warn).stroke !== getComputedStyle(warn.parentElement).color) return "the icon is not drawn in the text's colour";
const all = $$("#icon-demo-all svg.ui-icon");
if (all.length < 40) return `only ${all.length} icons`;
const missing = all.filter((s) => s.hasAttribute("data-missing") || !s.querySelector("path").getAttribute("d"));
if (missing.length) return `icons without a path: ${missing.map((s) => s.dataset.icon)}`;
if (new Set(all.map((s) => s.querySelector("path").getAttribute("d"))).size !== all.length) return "two icons draw the same path";
for (const want of ["search", "close", "check", "arrow-left", "menu", "user", "settings", "plus", "minus", "trash", "edit", "info", "warning", "star", "heart", "mail", "phone", "calendar", "clock", "download", "upload", "external", "chevron-down"])
    if (!all.some((s) => s.dataset.icon === want)) return `no ${want} icon`;
const bad = $("#icon-demo-missing svg");
if (bad.getAttribute("data-missing") !== "true" || bad.querySelector("path").getAttribute("d") !== $('#icon-demo-all svg[data-icon="help"] path').getAttribute("d")) return "an unknown name does not draw the help icon";
