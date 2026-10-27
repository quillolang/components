const [btn] = $$("button.ui-copy-btn");
const status = $('[role="status"]');
if (!btn || !status) return "no copy button or status region";
const real = navigator.clipboard.writeText;
let copied = null;
navigator.clipboard.writeText = async (t) => { copied = t; };
try {
    btn.click(); await wait(150);
    if (copied !== "quillo run app.qwe") return `copied ${JSON.stringify(copied)}, not the text`;
    if (!btn.classList.contains("ui-copy-ok") || status.textContent !== "Copied") return `it does not say Copied: "${status.textContent}"`;
    if (getComputedStyle(btn.querySelector(".ui-copy-done")).visibility !== "visible") return "the Copied label is not shown";
    await wait(1700);
    if (btn.classList.contains("ui-copy-ok") || status.textContent !== "") return "it does not go back to Copy";
    navigator.clipboard.writeText = async () => { throw new DOMException("no", "NotAllowedError"); };
    btn.click(); await wait(150);
    if (status.textContent !== "Could not copy") return `a refused copy says "${status.textContent}"`;
    await wait(1700);
} finally {
    navigator.clipboard.writeText = real;
}
