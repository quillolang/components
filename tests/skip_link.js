const link = $("#skip-link-demo");
if (!link || link.tagName !== "A" || link.getAttribute("href") !== "#skip-link-demo-content") return "the skip link does not go to its target";
if (link.textContent !== "Skip to content") return `its text is ${link.textContent}`;
const hidden = link.getBoundingClientRect();
if (getComputedStyle(link).opacity !== "0" || hidden.bottom > 0) return `before focus it is in view: opacity ${getComputedStyle(link).opacity}, bottom ${hidden.bottom}`;
link.focus(); await wait(300);
if (document.activeElement !== link) return "the link cannot take focus";
if (document.hasFocus()) {
    // The window has the focus, so :focus applies: it must be in view at the top left.
    const r = link.getBoundingClientRect();
    if (getComputedStyle(link).opacity !== "1" || r.top < 0 || r.left < 0 || r.top > 60) return `focused, it is not at the top left: ${r.top},${r.left}, opacity ${getComputedStyle(link).opacity}`;
} else {
    // Headless, the window has no focus and :focus never matches: check the rule that shows it is there.
    const rules = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } });
    const show = rules.find((r) => r.selectorText?.includes(".ui-skip:focus") && r.style.opacity === "1" && r.style.transform === "none");
    if (!show) return "no rule shows the link on :focus";
}
const target = document.getElementById("skip-link-demo-content");
target.focus();
if (document.activeElement !== target) return "the target cannot take the focus the link sends it";
const shown = $$("a.ui-skip-shown");
if (shown.length !== 2 || shown[1].textContent !== "Skip to results") return "shown links are not in view with their text";
if (shown[0].getBoundingClientRect().height === 0 || getComputedStyle(shown[0]).position !== "static" || getComputedStyle(shown[0]).opacity !== "1") return "a shown link is not in the page's flow";
target.blur();
