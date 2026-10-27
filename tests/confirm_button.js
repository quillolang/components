const form = $("form");
const [del, link, archive] = $$(".ui-confirm-btn");
if (!form || !del || !link || !archive) return "the demo's buttons are missing";
if (del.type !== "submit" || !del.classList.contains("ui-btn-danger")) return "in a form it is a danger submit button";
let sent = null;
const hold = (e) => { e.preventDefault(); sent = e.submitter ? `${e.submitter.name}=${e.submitter.value}` : "no submitter"; };
form.addEventListener("submit", hold);
const answer = async (cls) => {
    const dlg = [...document.querySelectorAll(".q-dialog")].pop();
    if (!dlg) return false;
    dlg.querySelector(cls).click(); await wait(300);
    return dlg;
};
try {
    del.click(); await wait();
    if (sent) return "it submitted before asking";
    const dlg = [...document.querySelectorAll(".q-dialog")].pop();
    if (!dlg || dlg.getAttribute("role") !== "alertdialog") return "it did not ask in a dialog";
    if (!dlg.textContent.includes("Delete project?") || !dlg.textContent.includes("cannot be undone")) return "the dialog does not show the title and message";
    if (document.activeElement !== dlg.querySelector(".q-cancel")) return "a danger question does not start on Cancel";
    if (dlg.querySelector(".q-ok").textContent !== "Delete") return "ok is not the confirm button's text";
    await answer(".q-cancel");
    if (sent) return "Cancel still submitted the form";
    del.click(); await wait();
    await answer(".q-ok");
    if (sent !== "deleted=yes") return `yes did not submit the form with the button: ${sent}`;
} finally {
    form.removeEventListener("submit", hold);
}
history.replaceState(null, "", location.pathname + location.search);
link.click(); await wait();
await answer(".q-cancel");
if (location.hash === "#confirm_button") return "Cancel still followed the link";
link.click(); await wait();
await answer(".q-ok");
if (location.hash !== "#confirm_button") return `yes did not follow the link: ${location.href}`;
history.replaceState(null, "", location.pathname + location.search);
archive.click(); await wait();
if (!(await answer(".q-ok"))) return "the nested button did not ask";
if (!$$(".demo-note").pop().textContent.includes("Archived.")) return "on_confirm was not called";
