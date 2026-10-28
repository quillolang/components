const btn = $("button.ui-share-button"), status = $('[role="status"]'), note = () => $(".demo-note").textContent;
if (!btn || btn.querySelector(".ui-share-button-label").textContent !== "Share") return "no share button";
if (!btn.querySelector("svg")) return "no icon";
const hadShare = "share" in navigator, realShare = navigator.share, realCan = navigator.canShare, realCopy = navigator.clipboard.writeText;
let got = null, copied = null;
try {
    navigator.share = async (d) => { got = d; };
    navigator.canShare = () => true;
    navigator.clipboard.writeText = async (t) => { copied = t; };
    btn.click(); await wait(150);
    if (got?.url !== "https://quillolang.org/components/" || got.title !== "Quillo UI" || got.text !== "A UI kit for Quillo.") return `navigator.share got ${JSON.stringify(got)}`;
    if (!btn.classList.contains("ui-share-button-ok") || status.textContent !== "Shared") return `after sharing it says "${status.textContent}"`;
    if (getComputedStyle(btn.querySelector(".ui-share-button-done")).visibility !== "visible") return "the Shared label is not shown";
    if (note() !== "Last: shared.") return `on_share was not called with shared: ${note()}`;
    await wait(2000);
    if (btn.classList.contains("ui-share-button-ok") || status.textContent !== "") return "it does not go back to Share";
    navigator.share = async () => { throw new DOMException("closed", "AbortError"); };
    btn.click(); await wait(150);
    if (status.textContent !== "" || copied !== null) return "closing the share sheet said something or copied";
    navigator.share = undefined; navigator.canShare = undefined;
    btn.click(); await wait(150);
    if (copied !== "https://quillolang.org/components/") return `without navigator.share it copied ${JSON.stringify(copied)}`;
    if (!btn.classList.contains("ui-share-button-copied") || status.textContent !== "Link copied") return `after copying it says "${status.textContent}"`;
    if (note() !== "Last: copied.") return `on_share was not called with copied: ${note()}`;
    await wait(2000);
    navigator.clipboard.writeText = async () => { throw new DOMException("no", "NotAllowedError"); };
    btn.click(); await wait(150);
    if (status.textContent !== "Could not share") return `a refused copy says "${status.textContent}"`;
    await wait(2000);
} finally {
    if (hadShare) { navigator.share = realShare; navigator.canShare = realCan; } else { delete navigator.share; delete navigator.canShare; }
    navigator.clipboard.writeText = realCopy;
}
