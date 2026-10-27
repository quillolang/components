const hr = $("hr.ui-divider");
if (!hr) return "a plain divider is an <hr>";
const label = $(".ui-divider-label");
if (!label || label.textContent.trim() !== "or") return "the labelled divider does not show its label";
if (getComputedStyle(label, "::before").borderTopStyle !== "solid") return "the labelled divider has no line beside its label";
const v = $$('[role="separator"][aria-orientation="vertical"]');
if (v.length !== 2) return `expected 2 vertical dividers, found ${v.length}`;
const r = v[0].getBoundingClientRect();
if (r.width > 2 || r.height < 16) return `a vertical divider is ${r.width}x${r.height}`;
