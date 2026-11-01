// mobile
const frame = $("#comment-sheet-demo");
const dlg = $("#comment-sheet-live");
const open = frame.querySelector(".ui-comment-sheet-open");
const panel = dlg.querySelector(".ui-comment-sheet-panel");
const count = () => $("#comment-sheet-live-count").textContent;
const note = () => $("#comment-sheet-note").textContent;
const list = dlg.querySelector(".ui-comment-sheet-list");
const tops = () => [...list.querySelectorAll(":scope > li > quillo-island > .ui-comment-sheet-one, :scope > li > .ui-comment-sheet-one")].map((e) => e.dataset.cid);
const ids = () => [...list.querySelectorAll(":scope > li")].map((li) => li.querySelector("[data-cid]")?.dataset.cid).join();
const one = (id) => list.querySelector(`[data-cid="${id}"]`);
const act = (id, t) => [...one(id).querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(t));
const more = (id) => one(id).closest("li").querySelector(":scope > .ui-comment-sheet-more");
const sort = (t) => [...dlg.querySelectorAll(".ui-comment-sheet-sort")].find((b) => b.textContent === t);
const field = () => dlg.querySelector("textarea");
const post = async (t) => { const f = field(); f.focus(); f.value = t; f.dispatchEvent(new Event("input", { bubbles: true })); await wait(80); await tap(dlg.querySelector("button[aria-label=Post]")); await wait(150); };
frame.scrollIntoView({ block: "end" }); await wait(120);

// 9 usable comments; 40 in all. The count is on the button as it is in the sheet.
if (dlg.open) return "it starts open";
if (open.textContent.trim() !== "Comments (40)") return "the button says " + open.textContent;
await tap(open); await wait(350);
if (!dlg.open) return "the button did not open it";
if (count() !== "40") return "the count starts at " + count();

// Top: most liked first; ties by replies, then as given. 5 has 9 likes, 1 has 4, 7 has 2,
// then 6 and the loop, whose two are each comments of their own, 8 and 9.
if (ids() !== "5,1,7,6,8,9") return "top order: " + ids();
await tap(sort("Newest")); await wait(120);
if (ids() !== "6,5,1,7,9,8") return "newest order: " + ids();
if (sort("Newest").getAttribute("aria-pressed") !== "true") return "the sort is not marked";
await tap(sort("Top")); await wait(120);

// Threads: folded, three replies under 1 whatever they answer, in order, naming who when it is not the top.
if (more("1").textContent.trim() !== "View 3 replies") return "the fold says " + more("1").textContent;
if (one("2")) return "replies should start folded";
await tap(more("1")); await wait(120);
if (more("1").textContent.trim() !== "Hide replies" || more("1").getAttribute("aria-expanded") !== "true") return "unfolding: " + more("1").textContent;
const replies = [...one("1").closest("li").querySelectorAll(".ui-comment-sheet-replies [data-cid]")].map((e) => e.dataset.cid).join();
if (replies !== "2,3,4") return "the replies: " + replies;
if (one("3").querySelector(".ui-comment-sheet-to")?.textContent.trim() !== "@Ben Oduya") return "a reply to a reply should say who";
if (one("2").querySelector(".ui-comment-sheet-to")) return "a reply to the top needs no name";

// A comment of your own: at the top whatever the sort, and the count goes up, here and on the button.
await post("Lovely light in that one.");
if (ids().split(",")[0] !== "new-1") return "a new comment should come first: " + ids();
if (count() !== "41") return "after adding, the count is " + count();
if (+$("#comment-sheet-note").dataset.count !== 41) return "on_count: " + $("#comment-sheet-note").dataset.count;
if (note() !== "Added new-1 under none: Lovely light in that one.") return "on_add: " + note();
if (field().value !== "") return "the box did not empty";

// A reply: Reply names who and fills the bar; the thread unfolds; the count goes up.
await tap(act("5", "Reply")); await wait(120);
if (!dlg.querySelector(".ui-comment-sheet-replying")?.textContent.includes("Replying to Dee Marsh")) return "replying is not shown";
if (field().placeholder !== "Reply to Dee Marsh") return "the box's placeholder: " + field().placeholder;
if (document.activeElement !== field()) return "Reply should go to the box";
await post("I would like to know too.");
if (dlg.querySelector(".ui-comment-sheet-replying")) return "still replying after sending";
if (!one("new-2")) return "the thread should unfold on a reply";
if (count() !== "42") return "after a reply, the count is " + count();
if (note() !== "Added new-2 under 5: I would like to know too.") return "on_add for a reply: " + note();
// Stopping a reply does not reply.
await tap(act("7", "Reply")); await wait(100);
await tap(dlg.querySelector("[aria-label='Stop replying']")); await wait(100);
if (dlg.querySelector(".ui-comment-sheet-replying") || field().placeholder !== "Add a comment") return "stopping a reply";
// A reply to a reply lands in the thread, under its top.
await tap(act("3", "Reply")); await wait(100);
await post("Yes, at nine.");
if (one("new-3").closest(".ui-comment-sheet-replies") !== one("3").closest(".ui-comment-sheet-replies")) return "a reply to a reply should join the thread";
if (one("new-3").querySelector(".ui-comment-sheet-to")?.textContent.trim() !== "@Cleo Hart") return "who it answers: " + one("new-3").querySelector(".ui-comment-sheet-to")?.textContent;
if (count() !== "43") return "after a third, the count is " + count();

// Likes: one a person, and back.
await tap(act("7", "Like")); await wait(100);
if (act("7", "Liked") === undefined || act("7", "Liked").textContent.trim() !== "Liked 3") return "a like: " + one("7").textContent;
if (note() !== "Like 7 true") return "on_like: " + note();
await tap(act("7", "Liked")); await wait(100);
if (act("7", "Like").textContent.trim() !== "Like 2") return "a like taken back: " + act("7", "Like").textContent;

// Delete only what is yours, and asked; a thread takes its replies with it, and the count knows.
if (act("5", "Delete")) return "someone else's comment can be deleted";
await tap(act("4", "Delete")); await wait(100);
if (!dlg.querySelector("[role=alert]")?.textContent.includes("Delete this comment?")) return "it should ask";
await tap([...dlg.querySelectorAll("[role=alert] button")].find((b) => b.textContent === "Keep")); await wait(100);
if (!one("4") || count() !== "43") return "Keep should keep";
await tap(act("4", "Delete")); await wait(100);
await tap([...dlg.querySelectorAll("[role=alert] button")].find((b) => b.textContent === "Delete")); await wait(120);
if (one("4") || count() !== "42") return "deleting a reply: " + count();
if (note() !== "Removed 4") return "on_remove: " + note();
// Deleting one with a reply under it takes both.
await tap(act("new-1", "Reply")); await wait(100);
await post("Thanks.");
if (count() !== "43") return "before the thread goes: " + count();
if (more("new-1").textContent.trim() !== "Hide replies") return "the thread should be open";
await tap(act("new-1", "Delete")); await wait(100);
if (!dlg.querySelector("[role=alert]")?.textContent.includes("Delete this and its 1 reply?")) return "it should say what goes with it: " + dlg.querySelector("[role=alert]")?.textContent;
await tap([...dlg.querySelectorAll("[role=alert] button")].find((b) => b.textContent === "Delete")); await wait(120);
if (count() !== "41") return "a thread of two gone: " + count();
if (note() !== "Removed new-1,new-4") return "on_remove of a thread: " + note();
if (open.textContent.trim() !== "Comments (41)") return "the button did not follow: " + open.textContent;

// The keyboard: the bar and the sheet ride above it.
const vv = visualViewport, H = innerHeight;
const fake = (height) => {
    Object.defineProperty(vv, "height", { get: () => height, configurable: true });
    Object.defineProperty(vv, "offsetTop", { get: () => 0, configurable: true });
    vv.dispatchEvent(new Event("resize"));
};
const unfake = () => { delete vv.height; delete vv.offsetTop; vv.dispatchEvent(new Event("resize")); };
const fb = dlg.getBoundingClientRect().bottom;
const cover = 240;
fake(fb - cover); await wait(350);
const bar = dlg.querySelector(".ui-composer-bar");
if (bar.getBoundingClientRect().bottom > fb - cover + 1) return `the reply bar is under the keyboard: ${bar.getBoundingClientRect().bottom} over ${fb - cover}`;
if (panel.getBoundingClientRect().top < dlg.getBoundingClientRect().top) return "the sheet went off the top";
unfake(); await wait(350);
if (Math.abs(panel.getBoundingClientRect().bottom - fb) > 1) return "the sheet did not come back down";

if (device === "phone") {
    const grip = dlg.querySelector(".ui-comment-sheet-grip");
    const handle = dlg.querySelector(".ui-comment-sheet-head h2");
    const h = () => panel.getBoundingClientRect().height;
    const half = h(), area = dlg.clientHeight;
    if (Math.abs(half - area * 0.64) > 2) return `half should be 64% of ${area}: ${half}`;
    // Up: short springs back, past the line goes full; a slow drag is no flick.
    await drag(handle, 0, -40, 500); await wait(320);
    if (dlg.classList.contains("ui-comment-sheet-full") || Math.abs(h() - half) > 1) return "a short drag up should spring back";
    await drag(handle, 0, -120, 300); await wait(320);
    if (!dlg.classList.contains("ui-comment-sheet-full")) return "a long drag up should go full";
    if (Math.abs(h() - (area - 8)) > 1) return "full should leave 8 px: " + h();
    // While dragged it follows the finger.
    {
        const r = handle.getBoundingClientRect(), x = r.left + 30, y = r.top + 8;
        await fingers("touchStart", [{ x, y }]);
        for (const d of [10, 30, 50]) { await fingers("touchMove", [{ x, y: y + d }]); await wait(30); }
        await wait(40);
        if (panel.style.transform !== "translateY(50px)") return "it should follow the finger: " + panel.style.transform;
        if (getComputedStyle(panel).transitionDuration !== "0s") return "a dragged sheet should have no transition";
        // What the dialog's class reads changes under the finger: what the gesture marks must not be on it.
        $("#comment-sheet-tint").click(); await wait(100);
        if (!dlg.className.includes("demo-other")) return "the prop did not reach the sheet";
        if (getComputedStyle(panel).transitionDuration !== "0s") return "a prop changing in mid-drag gave the sheet its spring back";
        if (panel.style.transform !== "translateY(50px)") return "a prop changing in mid-drag moved the sheet: " + panel.style.transform;
        await fingers("touchCancel", []); await wait(320);
        if (panel.style.transform !== "" || !dlg.classList.contains("ui-comment-sheet-full")) return "a cancelled drag should go back";
    }
    await drag(handle, 0, 120, 300); await wait(320);
    if (dlg.classList.contains("ui-comment-sheet-full")) return "a drag down from full should go to half";
    // A flick up, a flick down.
    await drag(handle, 0, -60, 30); await wait(320);
    if (!dlg.classList.contains("ui-comment-sheet-full")) return "a flick up should go full";
    await drag(handle, 0, 70, 30); await wait(320);
    if (dlg.classList.contains("ui-comment-sheet-full")) return "a flick down from full should go to half";
    // The same without a gesture.
    grip.focus();
    key(grip, "ArrowUp"); await wait(320);
    if (!dlg.classList.contains("ui-comment-sheet-full")) return "ArrowUp on the grip";
    key(grip, "ArrowDown"); await wait(320);
    if (dlg.classList.contains("ui-comment-sheet-full")) return "ArrowDown on the grip";
    await drag(handle, 0, 130, 300); await wait(150);
    if (dlg.open) return "a long drag down from half should leave";
    await wait(100);
    await tap(open); await wait(350);
} else {
    // On a tablet: a column at the side, the post in sight beside it.
    const r = panel.getBoundingClientRect(), d = dlg.getBoundingClientRect();
    if (Math.abs(r.width - 380) > 1 || Math.abs(r.right - d.right) > 1 || Math.abs(r.height - d.height) > 1) return `the tablet column: ${r.width}x${r.height} at ${r.right} of ${d.right}`;
    if (getComputedStyle(dlg.querySelector(".ui-comment-sheet-grip")).display !== "none") return "a column has no grip";
    await drag(dlg.querySelector(".ui-comment-sheet-head h2"), 0, 200, 200); await wait(200);
    if (!dlg.open) return "a column is not dragged away";
}

// What stays: sort, what is unfolded, and the count, across closing and opening.
{
    const r = dlg.getBoundingClientRect(), p = { x: r.left + 40, y: r.top + 40 };
    await fingers("touchStart", [p]); await fingers("touchEnd", []); await wait(200);
    if (dlg.open) return "a tap on the shade should close it";
}
if (document.activeElement !== open) return "focus should go back to the button";
await tap(open); await wait(350);
if (count() !== "41") return "the count after opening again: " + count();
key(dlg, "Escape"); await wait(120);
if (dlg.open) return "Escape should close it";

// Open from the start of the page, and closed by the person: it stays closed with `open` still true.
{
    const m = $("#comment-sheet-load");
    if (!m.open) return "open={true} at load should show it";
    if ($("#comment-sheet-load-count").textContent !== "1") return "at load the count is " + $("#comment-sheet-load-count").textContent;
    if (!m.querySelector("textarea")) return "at load the reply bar is missing";
    key(m, "Escape"); await wait(400);
    if (m.open) return "closed with open still true, it came straight back";
}

// Opened from state, as the real thing, with nothing in it; total left out counts what is there.
{
    const m = $("#comment-sheet-modal");
    $("#comment-sheet-state").click(); await wait(350);
    if (!m.open || !m.matches(":modal")) return "open={...} should show it as a modal";
    if (!m.textContent.includes("No comments yet.")) return "an empty sheet should say so";
    if ($("#comment-sheet-modal-count").textContent !== "0") return "an empty count: " + $("#comment-sheet-modal-count").textContent;
    const f = m.querySelector("textarea");
    f.focus(); f.value = "First!"; f.dispatchEvent(new Event("input", { bubbles: true })); await wait(80);
    m.querySelector("form").requestSubmit(); await wait(150);
    if ($("#comment-sheet-modal-count").textContent !== "1") return "the first comment: " + $("#comment-sheet-modal-count").textContent;
    if (m.textContent.includes("No comments yet.")) return "the empty word stayed";
    if (!m.querySelector("[role=status]").textContent.includes("1 comment")) return "the count is not told";
    key(m, "Escape"); await wait(350);
    if (m.open) return "on_close should have settled it";
}
