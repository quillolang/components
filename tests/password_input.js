const cur = $("#password-input-pw-current");
if (cur.type !== "password" || cur.getAttribute("autocomplete") !== "current-password") return "a plain one is not a current-password field";
if (cur.labels[0]?.textContent.trim() !== "Password") return "the field is not labelled Password";
const nw = $("#password-input-pw-new");
if (nw.getAttribute("autocomplete") !== "new-password") return "new={true} does not ask for new-password";
const toggle = nw.parentElement.querySelector("button");
if (toggle.getAttribute("aria-pressed") !== "false" || toggle.getAttribute("aria-label") !== "Show password") return "the toggle does not start as Show password";
toggle.click(); await wait();
if (nw.type !== "text" || toggle.getAttribute("aria-pressed") !== "true" || toggle.getAttribute("aria-label") !== "Hide password")
    return "the toggle did not show the password";
toggle.click(); await wait();
if (nw.type !== "password") return "the toggle did not hide it again";
const meter = $("#password-input-pw-new-meter");
if (meter.getAttribute("aria-live") !== "polite") return "the meter is not a live region";
if (!(nw.getAttribute("aria-describedby") || "").includes("password-input-pw-new-meter")) return "the field is not described by its meter";
for (const [text, want] of [["abc", "weak"], ["abcdefgh1", "fair"], ["Correct-Horse-7", "strong"]]) {
    type(nw, text); await wait();
    if (!meter.textContent.includes(want) || !meter.classList.contains(`ui-password-input-${want}`)) return `"${text}" is not ${want}: ${meter.textContent}`;
}
if (!nw.closest(".demo-stack").querySelector(".demo-note").textContent.includes("15 characters")) return "on_input was not called";
const bad = $("#password-input-pw-bad");
if (bad.getAttribute("aria-invalid") !== "true" || !$("#password-input-pw-bad-error[role=alert]")) return "error does not mark the field";
