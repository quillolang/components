const buttons = $$("button.ui-btn");
if (buttons.length < 10) return `expected at least 10 buttons, found ${buttons.length}`;
if (!$("a.ui-btn.ui-btn-outline[href]")) return "the href button is not a link";
const busy = buttons.find((b) => b.getAttribute("aria-busy") === "true");
if (!busy || !busy.disabled || !busy.querySelector(".ui-btn-spin")) return "loading does not disable or show the spinner";
