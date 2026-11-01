// mobile
const one = $("#paywall-sheet-demo-one"), two = $("#paywall-sheet-demo-two");
const dlg = one.querySelector("dialog"), yen = two.querySelector("dialog");
const said = () => $("#paywall-sheet-demo-said").textContent;
const plan = (id, d = dlg) => d.querySelector(`[data-plan="${id}"]`);
const words = (d = dlg) => d.querySelector(".ui-paywall-sheet-wording").textContent;
const buy = (d = dlg) => d.querySelector(".ui-paywall-sheet-foot .ui-btn");
const showing = () => dlg.open;
const tiny = (box) => [...box.querySelectorAll("button, a[href], select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((e) => e.tagName + " " + e.textContent.trim().slice(0, 20));
// A busy machine can take a while to answer the first tap, so this waits for the sheet, within reason.
const open = async (d = dlg) => {
    await tap((d === dlg ? one : two).querySelector("button[aria-haspopup]"));
    for (let i = 0; i < 40 && !d.open; i++) await wait(50);
    await wait(350);
};

await open();
if (!showing()) return "opens";
if (tiny(dlg).length) return "too small in the sheet: " + tiny(dlg);
// The worked-out figures, by hand: 59.99 / 12 = 4.9991..., up to 5.00; 9.99 x 12 = 119.88; 1 - 59.99 / 119.88 = 49.9%, floored.
const y = plan("year").textContent, m = plan("month").textContent, w = plan("week").textContent, l = plan("life").textContent;
if (!y.includes("$59.99 a year") || !y.includes("$5.00 a month")) return "yearly: " + y;
if (!y.includes("Save 49%") || !y.includes("7 days free")) return "yearly's saving: " + y;
if (!y.includes("Best value")) return "marks the recommended one";
if (!m.includes("$9.99 a month") || !m.includes("$119.88 a year")) return "monthly: " + m;
if (m.includes("Save")) return "nothing saved against itself";
// 2.99 x 52 = 155.48; / 12 = 12.9566..., up to 12.96.
if (!w.includes("$2.99 a week") || !w.includes("$12.96 a month") || !w.includes("$155.48 a year")) return "weekly: " + w;
if (w.includes("Save")) return "dearer than monthly saves nothing";
if (!l.includes("$149.00 once") || l.includes("a month")) return "for life: " + l;
if (plan("bad")) return "a price that cannot be read is left out";

// The recommended plan starts picked, and the words say when money moves.
if (!plan("year").querySelector("input").checked) return "the recommended plan starts picked";
const radio = (id) => plan(id).querySelector("input");
if (radio("year").name !== radio("month").name) return "one group";
if (words() !== "Free for 7 days, then $59.99 a year. Your first payment is on November 8, 2026, unless you cancel at least a day before. It renews every year until you cancel, which you can do at any time in your phone's settings.") return "trial wording: " + words();
if (buy().textContent.trim() !== "Start 7-day free trial") return "the button: " + buy().textContent;
await tap(plan("month")); await wait(150);
if (!radio("month").checked) return "tapping a plan picks it";
if (words() !== "$9.99 today, then every month. It renews every month until you cancel, which you can do at any time in your phone's settings.") return "plain wording: " + words();
if (buy().textContent.trim() !== "Subscribe for $9.99 a month") return "the button: " + buy().textContent;
await tap(plan("life")); await wait(150);
if (words() !== "One payment of $149.00. Nothing renews.") return "once: " + words();
if (buy().textContent.trim() !== "Buy for $149.00") return "the button: " + buy().textContent;

// Backing out of the store's sheet says nothing; a lost answer says so and no money went.
await tap(buy()); await wait(200);
if (dlg.querySelector(".ui-paywall-sheet-said")) return "a cancelled purchase says nothing: " + dlg.querySelector(".ui-paywall-sheet-said").textContent;
await tap(plan("week")); await wait(150);
await tap(buy()); await wait(200);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "The purchase did not go through. You have not been charged.") return "a lost answer: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
if (!showing()) return "stays open on failure";

// Restore, both ways.
const restore = () => dlg.querySelector("button.ui-paywall-sheet-link");
await tap(restore()); await wait(200);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "Restored your Yearly plan.") return "restore: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
if (!dlg.querySelector("a[href='#terms']") || !dlg.querySelector("a[href='#privacy']")) return "the terms and privacy links";

// The handle: short springs back, far closes, a flick closes, a cancel springs back.
const grip = () => dlg.querySelector(".ui-paywall-sheet-grip");
if (getComputedStyle(grip()).display !== "none") {
    if (getComputedStyle(grip()).touchAction !== "none") return "touch-action on the handle";
    await drag(grip(), 0, 60, 400); await wait(350);
    if (!showing() || dlg.style.transform !== "") return "a short drag springs back: " + dlg.style.transform;
    const r = grip().getBoundingClientRect(), p = { x: r.left + r.width / 3, y: r.top + r.height / 2 };
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + i * 12 }]); await wait(16); }
    await wait(120);       // the last move reaches the page a frame or two later
    if (dlg.style.transform !== "translateY(72px)") return "follows the finger: " + dlg.style.transform;
    await fingers("touchCancel", []); await wait(300);
    if (!showing() || dlg.style.transform !== "") return "a cancelled drag springs back";
    await drag(grip(), 0, Math.round(dlg.offsetHeight * 0.5), 400); await wait(300);
    if (showing()) return "a long drag closes";
    if (!said().endsWith("Closed.")) return "on_close: " + said();
    await open();
    if (dlg.style.transform !== "") return "opens where it should";
    await drag(grip(), 0, 70, 30); await wait(300);
    if (showing()) return "a flick closes";
    await open();
    // Upward goes nowhere.
    await drag(grip(), 0, -80, 200); await wait(300);
    if (!showing() || dlg.style.transform !== "") return "dragging up does nothing";
} else {
    // A tablet: a card in the middle, with plans side by side.
    const r = dlg.getBoundingClientRect();
    if (Math.abs(r.left + r.width / 2 - innerWidth / 2) > 2 || r.bottom >= innerHeight) return "a centred card: " + JSON.stringify(r);
    const pr = [...dlg.querySelectorAll(".ui-paywall-sheet-plan")].map((e) => e.getBoundingClientRect().top);
    if (new Set(pr.map(Math.round)).size !== 1) return "plans side by side: " + pr;
}
// Escape, the real key.
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(250);
if (showing()) return "Escape closes";
await open();
// A tap above the sheet: on the backdrop, which is the dialog itself.
if (device === "phone") {
    await fingers("touchStart", [{ x: 40, y: 10 }]); await fingers("touchEnd", []); await wait(300);
    if (showing()) return "a tap above closes";
    await open();
}
// Not now.
await tap([...dlg.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === "Not now")); await wait(300);
if (showing()) return "Not now closes";

// The store refusing, then working.
const fail = $("#paywall-sheet-demo-fail"); fail.checked = true; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(100);
await open();
await tap(plan("year")); await wait(150);
await tap(restore()); await wait(200);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "No purchases were found to restore.") return "nothing to restore: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
await tap(buy()); await wait(200);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "The store said no.") return "the app's own words: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
fail.checked = false; fail.dispatchEvent(new Event("change", { bubbles: true })); await wait(100);
await tap(buy()); await wait(250);
if (showing()) return "bought closes it";
if (!said().includes("Bought year.")) return "on_bought: " + said();

// The same again with answers as Promises, through a named function and an inline one.
const slow = $("#paywall-sheet-demo-slow");
const setSlow = async (on) => { slow.checked = on; slow.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
await setSlow(true);
await open();
await tap(restore()); await wait(250);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "Restored your Yearly plan.") return "a Promise of restored: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
await tap(plan("week")); await wait(150);
await tap(buy()); await wait(250);
if (dlg.querySelector(".ui-paywall-sheet-said")?.textContent !== "The purchase did not go through. You have not been charged.") return "a Promise of null: " + dlg.querySelector(".ui-paywall-sheet-said")?.textContent;
await tap(plan("life")); await wait(150);
await tap(buy()); await wait(250);
if (dlg.querySelector(".ui-paywall-sheet-said")) return "a Promise of cancelled says nothing";
await tap(plan("year")); await wait(150);
await tap(buy()); await wait(300);
if (showing()) return "a Promise of true closes it";
await setSlow(false);

// Yen has no cents, and a trial runs over the new year. 6800 / 12 = 566.67, up to 567; 980 x 12 = 11760; 1 - 6800 / 11760 = 42.2%.
await open(yen);
const yy = plan("y", yen).textContent, ym = plan("m", yen).textContent;
if (!yy.includes("¥6,800 a year") || !yy.includes("¥567 a month") || !yy.includes("Save 42%")) return "yen: " + yy;
if (!ym.includes("¥980 a month") || !ym.includes("¥11,760 a year")) return "yen: " + ym;
if (!words(yen).includes("Your first payment is on January 4, 2027")) return "over the new year: " + words(yen);
yen.close(); await wait(100);

// Data that cannot be trusted: a currency nobody knows, a trial in words, a date that is none. It says no more than it knows.
const odd = $("#paywall-sheet-demo-three dialog");
await tap($("#paywall-sheet-demo-three button[aria-haspopup]"));
for (let i = 0; i < 40 && !odd.open; i++) await wait(50);
await wait(250);
const q = odd.querySelector('[data-plan="q"]').textContent;
// 4.99 x 4 = 19.96; / 12 = 1.6633..., up to 1.67.
if (!q.includes("every 3 months") || !q.includes("1.67 a month") || !q.includes("19.96 a year")) return "a quarter: " + q;
if (q.includes("free")) return "a trial in words is no trial: " + q;
if (words(odd).includes("Free") || !words(odd).includes("today, then every 3 months")) return "no trial's wording: " + words(odd);
odd.close(); await wait(100);

// Opened from state at the moment it comes to the page.
await tap($("#paywall-sheet-demo-now")); await wait(400);
const now = $("#paywall-sheet-demo-now").closest(".demo-stack").querySelector("dialog[open]");
if (!now || !now.matches(":modal") || !now.textContent.includes("Opened from state")) return "open at mount: " + now?.textContent.slice(0, 40);
await tap([...now.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === "Not now")); await wait(300);
if ($$("dialog[open]").length) return "closing tells the parent, which takes it away";
