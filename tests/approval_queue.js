// mobile
await wait(200);
const calls = [];
window.quilloNative = { haptic: (k) => { calls.push(k); return Promise.resolve(true); } };
const done = (why) => { delete window.quilloNative; return why; };
const main = () => $("#approval-queue-main");
const card = () => main().querySelector(".ui-approvals-card");
const title = () => card().querySelector(".ui-approvals-name").textContent;
const leftText = () => main().querySelector(".ui-approvals-left").textContent;
const told = () => $("#approval-queue-told").textContent;
const kept = () => JSON.parse($("#approval-queue-kept").textContent);
const dlg = () => main().querySelector("dialog");
const yes = () => main().querySelector(".ui-approvals-keys .ui-approvals-yes");
const no = () => main().querySelector(".ui-approvals-keys .ui-approvals-no");
const undo = () => main().querySelector(".ui-approvals-undo");
const said = () => main().querySelector(".ui-sr[role=status]").textContent;
const stamp = (s) => parseFloat(card().querySelector(s).style.opacity || "0");
const x = () => { const m = card().style.transform.match(/translateX\(([-\d.]+)px\)/); return m ? parseFloat(m[1]) : 0; };
const pull = async (dist, lift = true) => {
    const p = middle(card());
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x + dist * i / 8, y: p.y }]); await wait(30); }
    await wait(120);
    if (lift) { await fingers("touchEnd", []); await wait(350); }
};
const flick = async (dist) => {
    const p = middle(card());
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: p.x + dist * i / 3, y: p.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(450);
};

// One at a time, with what is needed, and the count.
if (title() !== "New laptops for design") return done("first: " + title());
if (leftText() !== "4 left of 4") return done("count: " + leftText());
if (main().querySelectorAll(".ui-approvals-card").length !== 1) return done("one at a time");
if (card().querySelector(".ui-approvals-amount").textContent !== "4,860.00 USD") return done("amount: " + card().querySelector(".ui-approvals-amount").textContent);
if ([...card().querySelectorAll("dt, dd")].map((e) => e.textContent).join("|") !== "Vendor|Northwind|Budget|Equipment") return done("fields");
if (!undo().disabled || undo().textContent.trim() !== "Nothing to undo") return done("nothing to undo yet: " + undo().textContent);

const w = card().offsetWidth;

// A short pull springs back.
await pull(w * 0.2);
if (x() !== 0 || title() !== "New laptops for design") return done("a short pull should spring back: " + x());

// The card follows, leans, and shows what it would do.
calls.length = 0;
await pull(w * 0.25, false);
if (Math.abs(x() - (w * 0.25 - 8)) > 1) return done("the card should follow: " + x());
if (!card().style.transform.includes("rotate(")) return done("it leans");
if (!(stamp(".ui-approvals-stamp-yes") > 0.5) || stamp(".ui-approvals-stamp-no") !== 0) return done("the stamp: " + stamp(".ui-approvals-stamp-yes"));
// Across to the other side, past the point, and a system cancel: home, nothing decided.
const p2 = middle(card());
await fingers("touchMove", [{ x: p2.x - w * 0.42, y: p2.y }]);
await wait(60);
if (!(x() < 0) || stamp(".ui-approvals-stamp-yes") !== 0) return done("to the other side: " + x());
if (!calls.includes("medium")) return done("felt on passing the point: " + calls);
await fingers("touchCancel", []);
await wait(320);
if (x() !== 0 || card().style.transform !== "" || stamp(".ui-approvals-stamp-no") !== 0) return done("cancel goes home: " + card().style.transform);
if (dlg().open || told() !== "Nothing yet.") return done("cancel decides nothing");

// Past a third to the right: approved at once, as approving needs no reason here.
await pull(w * 0.5);
await wait(100);
if (title() !== "Team offsite in March") return done("next: " + title());
if (told() !== "r1 approved []") return done("on_decide: " + told());
if (leftText() !== "3 left of 4") return done("count: " + leftText());
if (kept().length !== 1 || kept()[0].decision !== "approved") return done("kept: " + JSON.stringify(kept()));
if (card().style.transform !== "" || card().style.opacity !== "") return done("the new card stands in its place: " + card().style.transform);
if (document.activeElement !== card()) return done("the focus goes to the next card: " + document.activeElement.className);
if (said() !== "Approved: New laptops for design. 3 left.") return done("said: " + said());
if (undo().textContent.trim() !== "Undo: Approved") return done("undo names it: " + undo().textContent);

// Undo: the same request back, the count back, and the callback.
await tap(undo());
if (title() !== "New laptops for design" || leftText() !== "4 left of 4") return done("undo: " + title());
if (told() !== "undo r1") return done("on_undo: " + told());
if (kept().length !== 0) return done("undo empties: " + JSON.stringify(kept()));

// A flick from under a third.
await flick(w * 0.2);
if (told() !== "r1 approved []") return done("a flick right approves: " + told());

// A rejection needs a reason: past a third to the left, and nothing is decided yet.
await pull(-w * 0.5);
if (!dlg().open) return done("a reason should be asked for");
if (title() !== "Team offsite in March" || told() !== "r1 approved []") return done("nothing decided yet: " + told());
if (x() !== 0) return done("the card goes home behind it: " + x());
if (document.activeElement !== dlg().querySelector("textarea")) return done("the focus goes to the field: " + document.activeElement.tagName);
if (dlg().querySelector("h3").textContent !== "Why reject Team offsite in March?") return done("heading: " + dlg().querySelector("h3").textContent);
const send = dlg().querySelector(".ui-approvals-send");
if (send.textContent !== "Reject" || !send.classList.contains("ui-approvals-no")) return done("send button: " + send.textContent);

// An empty reason is refused, with the reason why. So are two letters, and spaces.
await tap(send);
if (!dlg().open) return done("no reason, no rejection");
const err = dlg().querySelector(".ui-approvals-err");
if (err.textContent !== "A reason is needed, of 3 letters or more.") return done("error: " + err.textContent);
if (dlg().querySelector("textarea").getAttribute("aria-invalid") !== "true") return done("aria-invalid");
const area = dlg().querySelector("textarea");
await cdp("Input.insertText", { text: "  no " });
await wait(60);
if (area.value !== "  no ") return done("what is typed stays: " + JSON.stringify(area.value));
if (err.textContent !== "") return done("typing clears the error");
await tap(send);
if (!dlg().open || told() !== "r1 approved []") return done("two letters are too few");
// Cancel: back to the card, undecided.
await tap(dlg().querySelector(".ui-approvals-cancel"));
if (dlg().open || title() !== "Team offsite in March" || told() !== "r1 approved []") return done("cancel: " + told());
if (leftText() !== "3 left of 4") return done("cancel changes no count");

// The button goes the same way. A chip fills the field. The reason goes out trimmed.
await tap(no());
if (!dlg().open) return done("Reject asks too");
if (dlg().querySelector("textarea").value !== "") return done("a fresh start: " + dlg().querySelector("textarea").value);
const chips = dlg().querySelectorAll(".ui-approvals-chip");
if ([...chips].map((c) => c.textContent).join() !== "Over budget,Needs a quote") return done("chips");
await tap(chips[0]);
if (dlg().querySelector("textarea").value !== "Over budget") return done("a chip fills the field: " + dlg().querySelector("textarea").value);
dlg().querySelector("textarea").focus();
await cdp("Input.insertText", { text: " again " });
await wait(60);
await tap(send);
await wait(350);
if (told() !== "r2 rejected [Over budget again]") return done("the reason: " + told());
if (dlg().open) return done("the sheet closes");
if (title() !== "Annual licence renewal" || leftText() !== "2 left of 4") return done("next: " + title());
if (kept()[1].reason !== "Over budget again") return done("the reason is kept: " + JSON.stringify(kept()));

// The backdrop and Escape cancel as well. The sheet stands on the keyboard: a stand-in, since headless Chrome has none.
await pull(-w * 0.5);
if (!dlg().open) return done("asked again");
const vv = window.visualViewport;
const realH = Object.getOwnPropertyDescriptor(VisualViewport.prototype, "height");
Object.defineProperty(vv, "height", { get: () => innerHeight - 300, configurable: true });
vv.dispatchEvent(new Event("resize"));
await wait(60);
const kb = dlg().style.getPropertyValue("--ui-approvals-kb");
const box = dlg().getBoundingClientRect();
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(60);
if (kb !== "300px") return done("the keyboard's height: " + kb);
if (device === "phone" && Math.abs(box.bottom - (innerHeight - 300)) > 1) return done("the sheet stands on the keyboard: " + box.bottom + " of " + innerHeight);
if (dlg().style.getPropertyValue("--ui-approvals-kb") !== "0px") return done("and comes down with it: " + dlg().style.getPropertyValue("--ui-approvals-kb"));
await fingers("touchStart", [{ x: 10, y: 10 }]);
await fingers("touchEnd", []);
await wait(250);
if (dlg().open) return done("the backdrop cancels");
if (title() !== "Annual licence renewal") return done("undecided: " + title());

// Up and down is the page's.
await drag(card(), 2, 100, 200);
if (card().style.transform !== "" || title() !== "Annual licence renewal") return done("a vertical drag does nothing: " + card().style.transform);
window.scrollTo(0, 0);
await wait(50);

// Keys on the card.
card().focus();
key(card(), "ArrowRight");
await wait(350);
if (told() !== "r3 approved []") return done("right approves: " + told());
if (title() !== "Contractor extension") return done("next: " + title());

// Two presses in a row are one decision.
const yb = yes(), p = middle(yb);
await fingers("touchStart", [p]);
await fingers("touchEnd", []);
await wait(30);
await fingers("touchStart", [p]);
await fingers("touchEnd", []);
await wait(400);
if (kept().length !== 4) return done("one decision for two presses, and the last: " + kept().length);

// All done: the sum, nothing more to press, on_done once, and Undo still works.
if (leftText() !== "All done") return done("done: " + leftText());
if (main().querySelector(".ui-approvals-done p").textContent !== "3 approved, 1 rejected.") return done("sum: " + main().querySelector(".ui-approvals-done p").textContent);
if ($("#approval-queue-done").textContent !== "done 4") return done("on_done: " + $("#approval-queue-done").textContent);
if (!yes().disabled || !no().disabled) return done("nothing left to decide");
await tap(undo());
if (leftText() !== "1 left of 4" || title() !== "Contractor extension") return done("undo from the end: " + leftText());
// Undo goes back further, one at a time.
await tap(undo());
if (title() !== "Annual licence renewal" || leftText() !== "2 left of 4") return done("undo again: " + title());

// Kept: made again from what on_change gave.
await tap($("#approval-queue-remake"));
await wait(200);
if (leftText() !== "2 left of 4" || title() !== "Annual licence renewal") return done("kept comes back: " + leftText() + " " + title());

// What a wide box does: the list beside the card, to take them in another order.
const side = main().querySelector(".ui-approvals-side");
if (device === "phone") {
    if (getComputedStyle(side).display !== "none") return done("a phone has no list");
} else {
    if (getComputedStyle(side).display !== "block") return done("a tablet has the list: " + getComputedStyle(side).display);
    const rows = [...side.querySelectorAll(".ui-approvals-row")];
    if (rows.length !== 4) return done("four rows");
    if (!rows[0].disabled || rows[0].querySelector("small").textContent !== "Approved") return done("decided rows say so: " + rows[0].textContent);
    if (rows[1].querySelector("small").textContent !== "Rejected") return done("rejected: " + rows[1].textContent);
    if (rows[2].getAttribute("aria-current") !== "true") return done("the current one is marked");
    await tap(rows[3]);
    if (title() !== "Contractor extension") return done("taken out of turn: " + title());
    await tap(yes());
    await wait(350);
    if (told() !== "r4 approved []") return done("decided out of turn: " + told());
    if (title() !== "Annual licence renewal") return done("back to the one left: " + title());
    if (side.getBoundingClientRect().right > card().getBoundingClientRect().left) return done("side by side");
    await tap(undo());
}

// A request is updated with the card under a finger: it shows, and the card stays where the finger has it.
window.scrollTo(0, 0);
await wait(80);
const held = card(), hr = held.getBoundingClientRect(), c0 = { x: hr.left + hr.width / 2 - visualViewport.offsetLeft, y: hr.top + hr.height / 2 - visualViewport.offsetTop };
await fingers("touchStart", [c0]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: c0.x + 8 * i, y: c0.y }]); await wait(16); }
await wait(40);
const inAir = held.style.transform, stampWas = stamp(".ui-approvals-stamp-yes");
if (inAir === "" || !(stampWas > 0)) return done("the card should follow: " + inAir);
$("#approval-queue-stir").click();
await wait(150);
if (main().querySelector(".ui-approvals-title").textContent !== "Approvals (updated)") return done("the update should show: " + main().querySelector(".ui-approvals-title").textContent);
if (card() !== held || held.style.transform !== inAir) return done("a state change sent the card home: " + JSON.stringify(held.style.transform));
if (stamp(".ui-approvals-stamp-yes") !== stampWas) return done("a state change wiped the stamp");
await fingers("touchCancel", []);
await wait(320);
if (held.style.transform !== "") return done("cancel goes home after an update");

// A reason both ways: an approval asks too.
const both = $("#approval-queue-both");
await tap(both.querySelector(".ui-approvals-keys .ui-approvals-yes"));
const bd = both.querySelector("dialog");
if (!bd.open) return done("reason_for both: an approval asks");
if (bd.querySelector("h3").textContent !== "Why approve Both ways?") return done("heading: " + bd.querySelector("h3").textContent);
if (bd.querySelector(".ui-approvals-send").textContent !== "Approve") return done("send says Approve");
await tap(bd.querySelector(".ui-approvals-cancel"));

// No reasons at all: a rejection goes straight through.
const free = $("#approval-queue-free");
await tap(free.querySelector(".ui-approvals-keys .ui-approvals-no"));
await wait(350);
if (free.querySelector("dialog").open) return done("reason_for none asks nothing");
if (free.querySelector(".ui-approvals-left").textContent !== "All done") return done("straight through: " + free.querySelector(".ui-approvals-left").textContent);

// Bad data: a kept decision that makes no sense is left out.
const bad = $("#approval-queue-bad");
if (bad.querySelector(".ui-approvals-name").textContent !== "Twin") return done("bad: " + bad.querySelector(".ui-approvals-name").textContent);
if (bad.querySelector(".ui-approvals-left").textContent !== "1 left of 1") return done("bad count: " + bad.querySelector(".ui-approvals-left").textContent);
delete window.quilloNative;
