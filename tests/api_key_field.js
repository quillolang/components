const field = $("#api-key-demo");
if (!field || !field.readOnly) return "the field is not read-only";
if ($("label[for=api-key-demo]")?.textContent !== "Live key") return "the label is not for the field";
if (field.value !== "qk_l••••••••••••9d0e") return `masked it shows "${field.value}"`;
const hidden = $("input[type=hidden][name=live_key]");
if (hidden?.value !== "qk_live_4f9a2b7c1d3e5f6a7b8c9d0e") return "the hidden input does not hold the whole key";
const [show, copy] = field.parentElement.querySelectorAll("button.ui-apikey-btn");
if (show.getAttribute("aria-pressed") !== "false" || show.getAttribute("aria-label") !== "Show key") return "the reveal button is not a toggle";
show.click(); await wait();
if (field.value !== "qk_live_4f9a2b7c1d3e5f6a7b8c9d0e" || show.getAttribute("aria-pressed") !== "true" || show.getAttribute("aria-label") !== "Hide key") return "Show does not reveal the key";
if (!field.closest(".demo-stack").querySelector(".demo-note").textContent.includes("Revealed 1 time.")) return "on_reveal did not reach the note";
show.click(); await wait();
if (field.value !== "qk_l••••••••••••9d0e") return "Hide does not mask it again";
const status = field.closest(".ui-apikey").querySelector("[role=status]");
const real = navigator.clipboard.writeText;
let copied = null;
navigator.clipboard.writeText = async (t) => { copied = t; };
try {
    copy.click(); await wait(150);
    if (copied !== "qk_live_4f9a2b7c1d3e5f6a7b8c9d0e") return `copied ${JSON.stringify(copied)}`;
    if (!copy.classList.contains("ui-apikey-ok") || status.textContent !== "Copied" || copy.textContent.trim() !== "Copied") return "it does not say Copied";
    await wait(1700);
    if (copy.classList.contains("ui-apikey-ok") || status.textContent !== "") return "it does not go back to Copy";
} finally {
    navigator.clipboard.writeText = real;
}
const second = $$(".ui-apikey")[1];
if (second.querySelector("input").value !== "whsec_9a8b7c6d5e4f3a2b1c0d") return "shown={true} does not start revealed";
if (second.querySelector("input").id !== "api-key" || second.querySelector("input[type=hidden]")) return "without a name: id api-key and no hidden input";
if (second.querySelector(".ui-apikey-hint")?.textContent !== "Shown once; copy it now." || second.querySelector("input").getAttribute("aria-describedby") !== "api-key-hint") return "the hint is not described";
