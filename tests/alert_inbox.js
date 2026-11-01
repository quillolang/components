// mobile
await wait(200);
const realNow = Date.now;
const T0 = 1793534400000;
let clock = T0;
Date.now = () => clock;
await wait(1100);
const calls = [];
window.quilloNative = { haptic: (k) => { calls.push(k); return Promise.resolve(true); } };
const done = async (why) => {
    Date.now = realNow;
    delete window.quilloNative;
    await cdp("Emulation.setTimezoneOverride", { timezoneId: "" });
    return why;
};

const main = $("#alert-inbox-main");
const badge = () => main.querySelector(".ui-alerts-badge").textContent;
const reported = () => $("#alert-inbox-badge").textContent;
const told = () => $("#alert-inbox-told").textContent;
const kept = () => JSON.parse($("#alert-inbox-kept").textContent);
const row = (id) => main.querySelector(`[data-id="${id}"]`);
const front = (id) => row(id).querySelector(".ui-alerts-front");
const rows = () => [...main.querySelectorAll(".ui-alerts-row")].map((r) => r.dataset.id).join();
const tabs = () => [...main.querySelectorAll(".ui-alerts-tab")];
const said = () => main.querySelector(".ui-sr").textContent;
const undoBar = () => main.querySelector(".ui-alerts-undo");
const x = (id) => { const t = front(id).style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const slowPull = async (id, dist, keep = true) => {
    const p = middle(front(id));
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x + dist * i / 8, y: p.y }]); await wait(30); }
    await wait(120);
    if (keep) { await fingers("touchEnd", []); await wait(320); }
    return p;
};
const flick = async (id, dist) => {
    const p = middle(front(id));
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: p.x + dist * i / 3, y: p.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(420);
};

// Worst first, newest first within: a4 (20 s), a2 (8 min), a5 (50 min), a3 (2 h), a1 (info).
if (rows() !== "a4,a2,a5,a3,a1") return done("order: " + rows());
const groups = [...main.querySelectorAll(".ui-alerts-group")].map((g) => g.textContent).join();
if (groups !== "Critical 2,Warning 2,Info 1") return done("groups: " + groups);
if (badge() !== "5") return done("badge: " + badge());
if (reported() !== "Badge 5") return done("on_badge: " + reported());
if (tabs().map((t) => t.textContent).join() !== "Waiting 5,Snoozed 0,Done 0") return done("tabs: " + tabs().map((t) => t.textContent).join());
const when = (id) => row(id).querySelector(".ui-alerts-when").textContent;
if (when("a4") !== "just now" || when("a2") !== "8 min ago" || when("a3") !== "2 h ago" || when("a1") !== "3 min ago") return done("times: " + when("a4") + when("a2") + when("a3") + when("a1"));
if (row("a2").querySelector(".ui-alerts-text").textContent !== "db-2: 97% used, growing 1% an hour.") return done("body: " + row("a2").querySelector(".ui-alerts-text").textContent);

const w = front("a3").offsetWidth;

// A short pull springs back: under a third, slowly.
await slowPull("a3", w * 0.2);
if (x("a3") !== 0) return done("a short pull should spring back: " + x("a3"));
if (row("a3").dataset.pull !== undefined) return done("nothing shows behind it after");
if (badge() !== "5") return done("nothing happened: " + badge());

// The row follows the finger, with what it will do showing behind it, and it stays by hand: no state moved it.
calls.length = 0;
const held = await slowPull("a3", w * 0.5, false);
if (Math.abs(x("a3") - (w * 0.5 - 8)) > 1) return done("the row should follow: " + x("a3"));
if (row("a3").dataset.pull !== "right") return done("shows the way: " + row("a3").dataset.pull);
if (getComputedStyle(row("a3").querySelector(".ui-alerts-under-ack")).display === "none") return done("Acknowledge shows behind it");
if (!calls.includes("medium")) return done("felt on passing the point: " + calls);
// The system takes the gesture: back, nothing done.
await fingers("touchCancel", []);
await wait(320);
if (x("a3") !== 0 || badge() !== "5" || told() !== "Nothing yet.") return done("cancel: " + x("a3") + " " + badge() + " " + told());

// Past a third to the right, slowly: acknowledged. Row gone, badge down, all told.
await slowPull("a3", w * 0.5);
await wait(100);
if (row("a3")) return done("the row should go");
if (badge() !== "4" || reported() !== "Badge 4") return done("badge after ack: " + badge() + " " + reported());
if (told() !== "ack a3") return done("on_ack: " + told());
if (kept().acks.join() !== "a3") return done("kept: " + JSON.stringify(kept()));
if (tabs()[0].textContent !== "Waiting 4" || tabs()[2].textContent !== "Done 1") return done("tabs: " + tabs().map((t) => t.textContent).join());
if (!undoBar() || undoBar().querySelector("span").textContent !== "Acknowledged: Certificate expires soon") return done("undo: " + undoBar()?.textContent);
if (said() !== "Certificate expires soon acknowledged. Undo is below.") return done("said: " + said());

// Undo: back where it was, badge up.
await tap(undoBar().querySelector("button"));
if (!row("a3") || rows() !== "a4,a2,a5,a3,a1") return done("undo brings it back: " + rows());
if (badge() !== "5" || reported() !== "Badge 5") return done("badge after undo: " + badge());
if (told() !== "reopen a3") return done("on_reopen: " + told());
if (undoBar()) return done("the undo bar goes");

// A flick from under a third does it too.
await flick("a3", w * 0.2);
await wait(100);
if (row("a3")) return done("a flick right should acknowledge");
await wait(50);
if (told() !== "ack a3") return done("flick told: " + told());
// Undo goes by itself after 8 seconds of the clock.
clock += 9000;
await wait(1200);
if (undoBar()) return done("the undo bar should go after a while");
// Done tab reopens it.
await tap(tabs()[2]);
if (rows() !== "a3") return done("Done tab: " + rows());
await tap(main.querySelector(".ui-alerts-act"));
if (told() !== "reopen a3") return done("Reopen: " + told());
await tap(tabs()[0]);
if (rows() !== "a4,a2,a5,a3,a1" || badge() !== "5") return done("reopened: " + rows());

// A pull left past a third offers the snooze, and snoozes nothing yet.
await slowPull("a5", -w * 0.5);
if (x("a5") !== 0) return done("the row goes home: " + x("a5"));
if (badge() !== "5") return done("not yet snoozed: " + badge());
const visible = (sel) => [...main.querySelectorAll(sel)].filter((e) => e.getClientRects().length);
const opts = visible(".ui-alerts-act-snooze");
if (opts.map((o) => o.textContent).join() !== "15 minutes,1 hour,Until tomorrow") return done("options: " + opts.map((o) => o.textContent).join());
await wait(100);
if (document.activeElement !== opts[0]) return done("the focus goes to the first: " + document.activeElement.className);
await tap(opts[0]);
if (row("a5")) return done("snoozed goes from the list");
if (badge() !== "4" || reported() !== "Badge 4") return done("a snooze takes it off the badge: " + badge());
const until = clock + 15 * 60000;
if (told() !== `snooze a5 ${until}`) return done("on_snooze: " + told() + " for " + until);
if (kept().snoozed[0].id !== "a5" || kept().snoozed[0].until !== until) return done("kept: " + JSON.stringify(kept()));
if (undoBar().querySelector("span").textContent !== "Snoozed: Slow queries") return done("undo: " + undoBar().textContent);
if (tabs()[1].textContent !== "Snoozed 1") return done("tabs: " + tabs()[1].textContent);
await tap(tabs()[1]);
if (main.querySelector(".ui-alerts-when").textContent !== "back in 15 min") return done("back in: " + main.querySelector(".ui-alerts-when").textContent);
await tap(tabs()[0]);

// While the screen sleeps the snooze runs out: on coming back the badge is right, and it was told once.
calls.length = 0;
clock += 14 * 60000;
await wait(1200);
if (badge() !== "4") return done("not yet: " + badge());
clock += 2 * 60000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(100);
if (badge() !== "5" || reported() !== "Badge 5") return done("a snooze run out counts again: " + badge() + " " + reported());
if (!row("a5")) return done("it is back in the list");
if (said() !== "A snoozed alert is back.") return done("said: " + said());
if (calls.filter((c) => c === "warning").length !== 1) return done("felt once: " + calls);
if (kept().snoozed.length !== 0) return done("the run-out snooze is tidied: " + JSON.stringify(kept()));
await wait(1200);
if (calls.filter((c) => c === "warning").length !== 1) return done("felt once only: " + calls);

// One that may not be snoozed barely moves left, and offers nothing.
await slowPull("a2", -w * 0.4, false);
if (Math.abs(x("a2")) > w * 0.1) return done("it should resist: " + x("a2"));
await fingers("touchEnd", []);
await wait(320);
if (visible(".ui-alerts-act").length !== 0) return done("nothing offered");

// A tap opens the same actions in words: under the row on a phone, in the side panel on a tablet.
await tap(front("a2"));
if (front("a2").getAttribute("aria-expanded") !== "true") return done("expanded");
const acts = visible(".ui-alerts-act");
if (acts.map((a) => a.textContent).join() !== "Acknowledge") return done("no snooze for this one: " + acts.map((a) => a.textContent).join());
if (device === "tablet") {
    if (!acts[0].closest(".ui-alerts-panel")) return done("a tablet uses its side panel");
    if (getComputedStyle(main.querySelector(".ui-alerts-body")).gridTemplateColumns.split(" ").length !== 2) return done("two columns");
    if (main.querySelector(".ui-alerts-panel h3").textContent !== "Disk almost full") return done("panel: " + main.querySelector(".ui-alerts-panel").textContent);
} else {
    if (!acts[0].closest(".ui-alerts-inline")) return done("a phone opens under the row");
    if (getComputedStyle(main.querySelector(".ui-alerts-panel")).display !== "none") return done("no panel on a phone");
}
await tap(acts[0]);
if (row("a2") || badge() !== "4") return done("Acknowledge by button: " + badge());
await wait(100);
if (document.activeElement.className.indexOf("ui-alerts-front") < 0) return done("the focus goes to the next row: " + document.activeElement.className);
await tap(undoBar().querySelector("button"));

// Keys.
front("a1").focus();
key(front("a1"), "ArrowLeft");
await wait(100);
if (visible(".ui-alerts-act-snooze").length !== 3) return done("left offers the snooze");
key(front("a1"), "Enter");
await wait(100);
if (visible(".ui-alerts-act-snooze").length !== 0) return done("Enter closes it");
key(front("a1"), "ArrowRight");
await wait(100);
if (row("a1")) return done("right acknowledges");
await tap(undoBar().querySelector("button"));

// Up and down is the page's.
await drag(front("a4"), 2, 100, 200);
if (x("a4") !== 0 || badge() !== "5") return done("a vertical drag does nothing: " + x("a4"));
window.scrollTo(0, 0);
await wait(50);

// Until tomorrow is 8:00 tomorrow where the phone is. T0 + the test's minutes is 2026-11-01 about 12:16 UTC.
await cdp("Emulation.setTimezoneOverride", { timezoneId: "Asia/Tokyo" });
await tap(front("a1"));
await tap(visible(".ui-alerts-act-snooze")[2]);
// In Tokyo that is 21:16 on the 1st, so 8:00 on the 2nd: 23:00 UTC on the 1st.
const morning = Date.UTC(2026, 10, 1, 23, 0, 0);
if (told() !== `snooze a1 ${morning}`) return done("tomorrow: " + told() + " for " + morning);
await tap(undoBar().querySelector("button"));

// A new alert from the page: badge up, in its place, and an alert going away takes its count with it.
await tap($("#alert-inbox-new"));
await wait(100);
if (badge() !== "6" || reported() !== "Badge 6") return done("a new alert: " + badge());
if (rows().split(",")[2] !== "n5") return done("a new critical without a time goes last among them: " + rows());

// An alert is updated with a row under a finger: it shows, and the row stays where the finger has it.
window.scrollTo(0, 0);
await wait(80);
const fr = front("a4"), rr = fr.getBoundingClientRect(), c0 = { x: rr.left + rr.width / 2 - visualViewport.offsetLeft, y: rr.top + rr.height / 2 - visualViewport.offsetTop };
await fingers("touchStart", [c0]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: c0.x + 10 * i, y: c0.y }]); await wait(16); }
await wait(40);
const inAir = fr.style.transform;
if (inAir === "") return done("the row should follow");
$("#alert-inbox-stir").click();
await wait(150);
if (row("a1").querySelector(".ui-alerts-text").textContent !== "All 42 volumes, run 1.") return done("the update should show: " + row("a1").querySelector(".ui-alerts-text").textContent);
if (fr.style.transform !== inAir) return done("a state change sent the row home: " + JSON.stringify(fr.style.transform));
if (front("a4") !== fr || row("a4").dataset.pull !== "right") return done("the row is the same, and still shows the way");
await fingers("touchCancel", []);
await wait(320);

// The right side of bad data: no acks of a list, the options fall back.
const bad = $("#alert-inbox-bad");
if (bad.querySelector(".ui-alerts-badge").textContent !== "1") return done("bad: " + bad.querySelector(".ui-alerts-badge").textContent);
if (bad.querySelector(".ui-alerts-name").textContent !== "Twin") return done("bad name: " + bad.querySelector(".ui-alerts-name").textContent);
if (bad.querySelector(".ui-alerts-row").dataset.sev !== "info") return done("an unknown severity is info");
await tap(bad.querySelector(".ui-alerts-front"));
if ([...bad.querySelectorAll(".ui-alerts-act-snooze")].filter((e) => e.getClientRects().length).length !== 3) return done("options fall back");
const end = await done(null);
if (end) return end;
