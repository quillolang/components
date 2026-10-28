const [zone, account] = $$("section.ui-danger");
if (!zone || !account) return "the two zones are missing";
if (zone.id !== "danger-zone-demo" || zone.getAttribute("aria-labelledby") !== "danger-zone-demo-title" || zone.querySelector("h2.ui-danger-title").textContent.trim() !== "Danger zone") return "the default title or label is wrong";
if (!getComputedStyle(zone).borderColor.match(/rgb/) || getComputedStyle(zone).borderColor === getComputedStyle($$(".demo-stack")[0]).borderColor) return "the border is not coloured";
const rows = zone.querySelectorAll("ul.ui-danger-rows > li.ui-danger-row");
if (rows.length !== 3) return `3 actions, found ${rows.length}`;
const [transfer, archive, del] = rows;
const link = transfer.querySelector("a.ui-btn");
if (!link || link.getAttribute("href") !== "#danger_zone" || link.textContent.trim() !== "Transfer" || link.classList.contains("ui-confirm-btn")) return "confirm={false} with href is not a plain link";
if (transfer.querySelector(".ui-danger-row-title")?.textContent !== "Transfer ownership" || !transfer.querySelector(".ui-danger-text")) return "the title or text is missing";
const form = del.querySelector("form");
if (!form || form.getAttribute("method") !== "post" || form.getAttribute("action") !== "#danger_zone") return "action does not make a form";
const btn = form.querySelector("button.ui-confirm-btn");
if (!btn || btn.type !== "submit" || btn.name !== "delete" || btn.value !== "yes" || !btn.classList.contains("ui-btn-danger")) return "the delete button is not a danger submit";
if (!archive.querySelector("button.ui-confirm-btn").classList.contains("ui-btn-neutral")) return "tone=neutral does not reach the button";
let sent = null;
const hold = (e) => { e.preventDefault(); sent = e.submitter?.name; };
form.addEventListener("submit", hold);
try {
    btn.click(); await wait();
    let dlg = [...document.querySelectorAll(".q-dialog")].pop();
    if (!dlg || !dlg.textContent.includes("Delete project?") || !dlg.textContent.includes("the deploys go too")) return "it did not ask with the title and message";
    if (dlg.querySelector(".q-ok").textContent !== "Delete project") return "ok is not the label";
    dlg.querySelector(".q-cancel").click(); await wait(300);
    if (sent) return "Cancel still submitted";
    btn.click(); await wait();
    dlg = [...document.querySelectorAll(".q-dialog")].pop();
    dlg.querySelector(".q-ok").click(); await wait(300);
    if (sent !== "delete") return `yes did not submit with the button: ${sent}`;
} finally {
    form.removeEventListener("submit", hold);
}
const [signout] = account.querySelectorAll("button.ui-confirm-btn");
if (signout.type !== "button" || account.querySelector("form")) return "with on_confirm there is no form";
signout.click(); await wait();
const dlg = [...document.querySelectorAll(".q-dialog")].pop();
if (!dlg.textContent.includes("Sign out everywhere: this cannot be undone.")) return "the default message is missing";
dlg.querySelector(".q-ok").click(); await wait(300);
if (!account.closest(".demo-stack").querySelector(".demo-note").textContent.includes("Signed out everywhere.")) return "on_confirm was not called";
