// mobile
const dlg = $("dialog.ui-pinstep");
const q = (s) => dlg.querySelector(s), qq = (s) => [...dlg.querySelectorAll(s)];
const log = () => $("#pinstep-log").textContent;
const k = (t) => qq(".ui-pinstep-key").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const dots = () => qq(".ui-pinstep-dot-on").length;
const said = () => q(".ui-pinstep-said")?.textContent;
const enter = async (s) => { for (const c of s) await tap(k(c)); };
const foot = () => q(".ui-pinstep-foot .ui-btn");
if (dlg.open) return "shut at first";
await tap($("#pinstep-open")); await wait(150);
if (!dlg.open) return "opens";
// What is being agreed to, and the clock.
if (!/ToHarbour Lettings/.test(q(".ui-pinstep-facts").textContent) || !/\$4,000\.00/.test(q(".ui-pinstep-facts").textContent)) return "summary: " + q(".ui-pinstep-facts").textContent;
if (!/cannot be undone/.test(dlg.textContent)) return "the warning";
if (!/^Closes in 0:(59|60)|^Closes in 1:00/.test(q(".ui-pinstep-clock").textContent)) return "clock: " + q(".ui-pinstep-clock").textContent;
if (said() !== "Enter your 4-digit PIN") return "asks: " + said();
if (qq(".ui-pinstep-dots i").length !== 4) return "four dots";
// Keys: taps add, delete takes away, the page shows no digit.
await enter("12");
if (dots() !== 2 || q(".ui-pinstep-dots").getAttribute("aria-label") !== "2 of 4 digits entered") return "dots: " + dots();
await tap(k("Delete"));
if (dots() !== 1) return "delete: " + dots();
await tap(k("Delete"));
if (dots() !== 0 || !k("Delete").disabled) return "emptied";
if (/\b12\b/.test(dlg.textContent.replace(/[\s\S]*PIN/, ""))) return "digits on the page";
// A wrong one: counted, cleared, said.
await enter("1111"); await wait(100);
if (said() !== "That is not it. 2 tries left." || dots() !== 0) return "wrong 1: " + said();
if (!q(".ui-pinstep-wrong")) return "shakes";
// A check that could not run uses no try.
$("#pinstep-lost").checked = true;
$("#pinstep-lost").dispatchEvent(new Event("change", { bubbles: true }));
await wait(60);
await enter("1111"); await wait(100);
if (!/no try was used/.test(said())) return "unknown: " + said();
$("#pinstep-lost").checked = false;
$("#pinstep-lost").dispatchEvent(new Event("change", { bubbles: true }));
await wait(60);
// Keys on a keyboard.
dlg.focus();
for (const c of ["2", "2", "3", "Backspace", "2", "2"]) key(dlg, c);
await wait(120);
if (said() !== "That is not it. 1 try left.") return "by keys: " + said();
// Closing and opening gives no more tries.
await tap(foot()); await wait(150);
if (dlg.open || log() !== "Cancelled") return "cancel: " + log();
await tap($("#pinstep-open")); await wait(150);
if (!dlg.open) return "again";
await enter("3333"); await wait(150);
if (log() !== "Locked" || !/Too many tries/.test(dlg.textContent)) return "locked: " + log();
if (getComputedStyle(q(".ui-pinstep-pad")).display !== "none") return "no pad when locked";
// Pressing nothing more can happen; the digits do nothing.
key(dlg, "5"); await wait(60);
if (!/Too many tries/.test(dlg.textContent)) return "stays locked";
await tap(foot()); await wait(150);
// A new request is a new set of tries; the right PIN confirms.
await tap($("#pinstep-new")); await wait(100);
await tap($("#pinstep-open")); await wait(150);
if (said() !== "Enter your 4-digit PIN") return "new request: " + said();
await enter("25"); 
// Leaving the app clears what was typed.
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange")); await wait(80);
delete document.visibilityState;
document.dispatchEvent(new Event("visibilitychange")); await wait(80);
if (dots() !== 0) return "leaving clears it: " + dots();
await enter("2580"); await wait(150);
if (log() !== "Confirmed" || !/Confirmed/.test(q(".ui-pinstep-end").textContent)) return "right: " + log();
// The Esc route: the dialog's cancel asks the same as the button.
await tap(foot()); await wait(150);
await tap($("#pinstep-new")); await wait(100);
await tap($("#pinstep-open")); await wait(150);
dlg.dispatchEvent(new Event("cancel", { cancelable: true })); await wait(150);
if (dlg.open) return "Escape closes";
// It runs out; digits typed go, nothing is done; it can start again.
await tap($("#pinstep-quick")); await wait(150);
await enter("2");
if (dots() !== 1) return "typed";
await wait(2300);
if (log() !== "Timed out" || !/Time ran out/.test(dlg.textContent)) return "timed out: " + log();
if (getComputedStyle(q(".ui-pinstep-pad")).display !== "none") return "no pad after time";
await tap(qq(".ui-pinstep-end .ui-btn")[0]); await wait(150);
if (dots() !== 0 || !/^Closes in 0:0[12]/.test(q(".ui-pinstep-clock").textContent)) return "started again: " + q(".ui-pinstep-clock")?.textContent;
const pad = q(".ui-pinstep-pad").getBoundingClientRect();
if (device === "tablet") {
    const r = dlg.getBoundingClientRect();
    if (r.width > 460 || r.height >= innerHeight) return "a dialog on a tablet: " + r.width + "x" + r.height;
    if (Math.abs((r.left + r.right) / 2 - innerWidth / 2) > 2) return "in the middle";
} else {
    const r = dlg.getBoundingClientRect();
    if (r.width !== innerWidth || r.height !== innerHeight) return "fills a phone: " + r.width + "x" + r.height;
    if (pad.bottom > innerHeight) return "the pad on the screen: " + pad.bottom;
    // Turned, it all still fits: the pad beside the rest, keys at 44 px at least.
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (!dlg.open) { await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); return "turning keeps it open"; }
    const p2 = q(".ui-pinstep-pad").getBoundingClientRect(), small = qq(".ui-pinstep-key").filter((b) => b.getBoundingClientRect().height < 44);
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (p2.bottom > 391 || small.length) return "turned: " + p2.bottom + " " + small.length;
}
await wait(200);
dlg.close();
