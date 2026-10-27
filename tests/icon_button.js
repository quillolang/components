const btns = $$(".ui-icon-btn");
if (btns.length < 19) return `expected at least 19 icon buttons, found ${btns.length}`;
for (const b of btns) {
    if (!b.getAttribute("aria-label") || b.getAttribute("title") !== b.getAttribute("aria-label")) return "an icon button has no label and matching title";
}
const builtin = btns.slice(0, 11);
const empty = builtin.find((b) => !b.querySelector("svg path")?.getAttribute("d"));
if (empty) return `the built-in icon "${empty.getAttribute("aria-label")}" has no path`;
const r = builtin[0].getBoundingClientRect();
if (r.width !== r.height) return `an icon button is not square: ${r.width}x${r.height}`;
if (!$('a.ui-icon-btn[href][aria-label="Settings"]')) return "href does not make a link";
if (!$('button.ui-icon-btn[aria-label="Copy"]').disabled) return "disabled is not passed on";
const star = $('[aria-label="Star"]');
if (star.getAttribute("aria-pressed") !== "false") return "pressed={false} does not make aria-pressed=false";
star.click(); await wait();
if (star.getAttribute("aria-pressed") !== "true" || !$(".demo-note").textContent.startsWith("Starred")) return "on_click did not toggle the star";
star.click(); await wait();
