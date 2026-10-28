const run = $("#inline-code-demo-run");
if (!run || run.tagName !== "CODE" || run.textContent !== "quillo run app.qwe --watch") return "the code span is not a <code> with its text";
if (!/mono|Menlo|Consolas/i.test(getComputedStyle(run).fontFamily) || getComputedStyle(run).backgroundColor === "rgba(0, 0, 0, 0)") return "it is not monospace on a tint";
const accent = $$("code.ui-code").find((c) => c.classList.contains("ui-code-accent"));
if (!accent || getComputedStyle(accent).color === getComputedStyle(run).color) return "tone=accent is not coloured";
const btn = $("#inline-code-demo-copy");
if (!btn || btn.tagName !== "BUTTON" || btn.getAttribute("aria-label") !== "Copy qk_live_4f9a0c12e7b3") return "the copy variant is not a named button";
if (btn.querySelector("code")?.textContent !== "qk_live_4f9a0c12e7b3") return "the code is not shown in the button";
const status = btn.parentElement.querySelector("[role=status]");
if (!status) return "no status region";
const other = $$("button.ui-code-btn")[1];
if (other.getAttribute("aria-label") !== "Copy the webhook secret") return "label does not name the button";
const real = navigator.clipboard.writeText;
let copied = null;
navigator.clipboard.writeText = async (t) => { copied = t; };
try {
    btn.click(); await wait(150);
    if (copied !== "qk_live_4f9a0c12e7b3") return `copied ${JSON.stringify(copied)}`;
    if (!btn.classList.contains("ui-code-ok") || status.textContent !== "Copied" || btn.querySelector(".ui-code-tip")?.textContent !== "Copied") return "it does not say Copied";
    await wait(1700);
    if (btn.classList.contains("ui-code-ok") || status.textContent !== "" || btn.querySelector(".ui-code-tip")) return "it does not go back";
    navigator.clipboard.writeText = async () => { throw new DOMException("no", "NotAllowedError"); };
    btn.click(); await wait(150);
    if (status.textContent !== "Could not copy" || !btn.classList.contains("ui-code-bad")) return `a refused copy says "${status.textContent}"`;
    await wait(1700);
} finally {
    navigator.clipboard.writeText = real;
}
