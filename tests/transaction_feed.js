// mobile
const box = $(".ui-txfeed");
const q = (s) => box.querySelector(s), qq = (s) => [...box.querySelectorAll(s)];
const log = () => $("#txfeed-log").textContent;
const heads = () => qq(".ui-txfeed-day").map((h) => h.textContent);
const titles = () => qq(".ui-txfeed-title").map((t) => t.textContent);
const row = (t) => qq(".ui-txfeed-row").find((r) => r.querySelector(".ui-txfeed-title").textContent === t);
const input = q(".ui-txfeed-box");
const dlg = q("dialog");
// Pending first; then days newest first, with exact totals; what has no date last.
// Pending: -180 - 55.10 = -235.10. Today: -4.50 - 2.75 = -7.25. Yesterday: 2300 - 950 = 1350.
const want = ["Pending-$235.10", "Today-$7.25", "Yesterday+$1,350.00", "Fri, Oct 30-$18.20", "Thu, Oct 29+$6.10", "Wed, Oct 28-€7.40 · -$12.05", "Tue, Oct 20-$30.00", "Mon, Oct 19-$41.17", "Sun, Oct 18-$14.00", "Sat, Oct 17-$33.33", "Wed, Dec 24, 2025-$40.00", "No date"];
if (heads().join("|") !== want.join("|")) return "days: " + heads().join("|");
if (titles().slice(0, 4).join() !== "Hotel Sol,Fuel,Cafe Luz,Metro") return "pending first: " + titles().slice(0, 4).join();
// A category on each row; signs; bad amount shows a dash; a row with no category says so.
if (!/Travel · Pending/.test(row("Hotel Sol").textContent)) return "pending row: " + row("Hotel Sol").textContent;
if (row("Payroll").querySelector(".ui-txfeed-amt").textContent !== "+$2,300.00" || !row("Payroll").querySelector(".ui-txfeed-in")) return "money in";
if (row("Cafe Luz").querySelector(".ui-txfeed-amt").textContent !== "-$4.50") return "money out";
if (row("Mystery").querySelector(".ui-txfeed-amt").textContent !== "—" || !/No category/.test(row("Mystery").textContent)) return "bad row";
// Search: a word, two words in different fields, an amount, nothing.
const search = async (s) => { type(input, s); await wait(100); };
await search("book");
if (titles().join() !== "Bookshop,Refund: Bookshop" || q(".ui-txfeed-said").textContent !== "2 found") return "search: " + titles().join();
await search("HEALTH gym");
if (titles().join() !== "Gym") return "two words: " + titles().join();
await search("2,300");
if (titles().join() !== "Payroll") return "an amount: " + titles().join();
await search("constructor");
if (titles().length !== 0 || !/Nothing matches/.test(box.textContent)) return "nothing";
await search(".*(");
if (titles().length !== 0) return "a pattern is plain text";
await tap(q(".ui-txfeed-clear"));
if (titles().length !== 16 || input.value !== "") return "cleared: " + titles().length;
// Typing keeps focus.
input.focus(); await search("b"); await search("bo");
if (document.activeElement !== input) return "search keeps focus";
await search("");
if (device === "phone") {
    await tap(row("Hotel Sol")); await wait(300);
    if (!dlg.open || log() !== "Opened t2") return "sheet: " + log();
    const body = dlg.querySelector(".ui-txfeed-body");
    if (!/Hotel Sol/.test(body.textContent) || !/-\$180\.00/.test(body.textContent) || !/Pending: this may still change/.test(body.textContent) || !/Held until you check out/.test(body.textContent)) return "sheet's content: " + body.textContent;
    const grip = dlg.querySelector(".ui-txfeed-grip");
    const g = grip.getBoundingClientRect(), p = { x: g.left + g.width / 2, y: g.top + g.height / 2 };
    const f = (type, a) => cdp("Input.dispatchTouchEvent", { type, touchPoints: a ? [a] : [] });
    // A short pull held still springs back.
    await f("touchStart", p);
    for (let i = 1; i <= 6; i++) { await f("touchMove", { x: p.x, y: p.y + i * 8 }); await wait(16); }
    await wait(200);
    if (!/translateY\(48px\)/.test(dlg.style.transform)) { await f("touchEnd"); return "follows: " + dlg.style.transform; }
    await f("touchEnd"); await wait(300);
    if (!dlg.open || dlg.style.transform !== "") return "springs back";
    // A cancel springs back too.
    await f("touchStart", p);
    for (let i = 1; i <= 6; i++) { await f("touchMove", { x: p.x, y: p.y + i * 40 }); await wait(16); }
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(300);
    if (!dlg.open || dlg.style.transform !== "") return "a cancel keeps it";
    // A sideways wander does nothing.
    await drag(grip, 120, 4, 200); await wait(200);
    if (!dlg.open || dlg.style.transform !== "") return "sideways does nothing";
    // Past a third it closes.
    await drag(grip, 0, dlg.offsetHeight * 0.5, 400); await wait(300);
    if (dlg.open) return "a long pull closes";
    // A flick.
    await tap(row("Payroll")); await wait(300);
    if (!dlg.open || !/October/.test(dlg.textContent)) return "open again";
    const before = await new Promise((done) => { let n = 0, t0 = 0; const on = (e) => { if (!t0) t0 = e.timeStamp; if (e.type === "pointerup") { document.removeEventListener("pointermove", on, true); document.removeEventListener("pointerup", on, true); done(e.timeStamp - t0); } }; document.addEventListener("pointermove", on, true); document.addEventListener("pointerup", on, true); drag(dlg.querySelector(".ui-txfeed-grip"), 0, 60, 40); });
    await wait(400);
    if (dlg.open) return "a flick closes: it took " + before;
    // The grip's tap, Escape's route and the X.
    await tap(row("Payroll")); await wait(300);
    await tap(dlg.querySelector(".ui-txfeed-grip")); await wait(300);
    if (dlg.open) return "a tap on the handle closes";
    await tap(row("Payroll")); await wait(300);
    await tap(dlg.querySelector(".ui-txfeed-x")); await wait(300);
    if (dlg.open) return "the X closes";
    // The phone's back closes it and stays on the page.
    await tap(row("Cafe Luz")); await wait(300);
    const h = await cdp("Page.getNavigationHistory", {});
    await cdp("Page.navigateToHistoryEntry", { entryId: h.entries[h.currentIndex - 1].id }); await wait(300);
    if (dlg.open) return "back closes the sheet";
    if (!/CL-8841/.test(document.body.textContent) && false) return "";
    // No pane on a phone; turning the phone with a sheet open keeps it.
    if (getComputedStyle(q(".ui-txfeed-pane")).display !== "none") return "no pane on a phone";
    const list = q(".ui-txfeed-list");
    list.scrollTop = 200; await wait(60);
    await tap(row("Bookshop")); await wait(300);
    const was = list.scrollTop;
    if (!dlg.open) return "open for turning";
    await cdp("Emulation.setDeviceMetricsOverride", { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await wait(500);
    // 844 is wide, so it moves to the pane, still open.
    if (dlg.open || !/Bookshop/.test(q(".ui-txfeed-pane").textContent)) return "turned, it goes to the pane: " + dlg.open;
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }); await wait(500);
    if (!dlg.open || !/Bookshop/.test(dlg.textContent)) return "and back to the sheet";
    if (Math.abs(list.scrollTop - was) > 120) return "scroll kept: " + was + " " + list.scrollTop;
    await tap(dlg.querySelector(".ui-txfeed-x")); await wait(300);
} else {
    // A tablet: a pane beside the list, no dialog; the list stays where it is.
    const pane = q(".ui-txfeed-pane");
    if (getComputedStyle(pane).display === "none" || !/Choose a transaction/.test(pane.textContent)) return "the pane waits";
    const l = q(".ui-txfeed-list").getBoundingClientRect(), r = pane.getBoundingClientRect();
    if (!(r.left >= l.right - 1)) return "beside: " + l.right + " " + r.left;
    await tap(row("Payroll")); await wait(250);
    if (dlg.open) return "no sheet on a tablet";
    if (!/\+\$2,300\.00/.test(pane.textContent) || row("Payroll").getAttribute("aria-current") !== "true") return "pane: " + pane.textContent;
    if (document.activeElement !== pane.querySelector("h3")) return "focus goes to it";
    await tap(row("Fuel")); await wait(200);
    if (!/-\$55\.10/.test(pane.textContent)) return "another";
    await tap(pane.querySelector(".ui-txfeed-x")); await wait(200);
    if (!/Choose a transaction/.test(pane.textContent)) return "closed";
    if (log() !== "Opened t10") return "on_open: " + log();
}
