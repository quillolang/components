// mobile
const box = $("#chats-demo");
const rows = (b = box) => [...b.querySelectorAll(".ui-convlist-row")];
const row = (i, b = box) => b.querySelector(`.ui-convlist-row[data-id="${i}"]`);
const front = (i, b = box) => row(i, b).querySelector(".ui-convlist-front");
const text = (r, s) => r.querySelector(s)?.textContent;
const v = (k) => $(`[data-${k}]`).textContent;
// Pinned first, each by the latest; the one with no time last.
const ids = () => rows().map((r) => r.dataset.id).join();
if (ids() !== "2,5,3,1,4,10,6,11,12,7,8,9") return `the order is ${ids()}`;
// Times worked out by hand from 2026-11-01 12:00 UTC, a Sunday.
const times = Object.fromEntries(rows().map((r) => [r.dataset.id, text(r, ".ui-convlist-time")]));
const want = { 3: "now", 1: "2m", 2: "3h", 4: "Yesterday", 5: "Thu", 10: "Fri", 6: "Wed", 11: "Tue", 12: "Mon", 7: "12 Oct", 8: "24 Dec 2025", 9: "" };
for (const k in want) if (times[k] !== want[k]) return `chat ${k} reads ${times[k]}, not ${want[k]}`;
// Unread, the cap, muted, pinned, typing.
if (text(row(1), ".ui-convlist-badge") !== "3" || !row(1).classList.contains("ui-convlist-fresh")) return "the unread count is wrong";
if (text(row(4), ".ui-convlist-badge") !== "99+") return `128 reads ${text(row(4), ".ui-convlist-badge")}`;
if (!row(4).classList.contains("ui-convlist-muted") || !row(4).querySelector("[data-mute]")) return "muted does not show";
if (row(2).querySelector(".ui-convlist-badge")) return "a read chat has a badge";
if (!row(2).querySelector("[data-pin]") || row(1).querySelector("[data-pin]")) return "the pin is wrong";
const badge = (i) => getComputedStyle(row(i).querySelector(".ui-convlist-badge")).backgroundColor;
if (badge(1) === badge(4)) return "a muted badge looks like a loud one";
if (text(row(3), ".ui-convlist-typing") !== "typing" || row(3).querySelector(".ui-convlist-last")) return "typing does not show";
if (text(row(6), ".ui-convlist-typing") !== "Mum is typing") return "a typer's name does not show";
if (row(3).querySelectorAll(".ui-convlist-dots i").length !== 3) return "the typing dots are missing";
const name = (i) => row(i).querySelector(".ui-convlist-open-chat").getAttribute("aria-label");
if (name(5) !== "Alan Turing, pinned, 1 unread, The bombe is running, Thu") return `row 5 reads ${name(5)}`;
if (name(4) !== "Book club, muted, 128 unread, Next month: Dune, Yesterday") return `row 4 reads ${name(4)}`;
// Avatars from initials.
if (text(row(2), ".ui-avatar") !== "AL") return "the avatar is wrong";
// A tap opens.
await tap(row(1).querySelector(".ui-convlist-open-chat"));
if (v("opened") !== "1") return `a tap opened ${v("opened")}`;
const off = (el) => { const m = new DOMMatrix(getComputedStyle(el).transform); return m.m41; };
const settle = () => wait(320);
// A drag too short springs back: it moves with the finger, then returns, and archives nothing.
const r1 = front(1).getBoundingClientRect(), p1 = { x: r1.left + r1.width * 0.7, y: r1.top + r1.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p1] });
for (let i = 1; i <= 8; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p1.x - i * 4, y: p1.y }] }); await wait(30); }
const mid = off(front(1));
if (Math.abs(mid + 32) > 2) return `the row stands ${mid} under a finger 32 px away`;
if (front(1).style.transform !== "translateX(-32px)") return `the handler wrote ${front(1).style.transform}`;
await wait(300);
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await settle();
if (off(front(1)) !== 0 || row(1).classList.contains("ui-convlist-open")) return `a short drag left the row at ${off(front(1))}`;
if (v("log") !== "none" || v("opened") !== "1") return "a short drag did something";
// A message arrives under the finger: the row's class and its place in the list are worked out
// again, with the drag going on. Row 1's own badge changes, so it is what the row's class reads.
const r0 = front(1).getBoundingClientRect(), p0 = { x: r0.left + r0.width * 0.7, y: r0.top + r0.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p0] });
for (let i = 1; i <= 8; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x - i * 5, y: p0.y }] }); await wait(30); }
const held = front(1);
$("#chats-arrive").click(); await wait(80);
if (text(row(1), ".ui-convlist-badge") !== "4") return `the new message reads ${text(row(1), ".ui-convlist-badge")}`;
if (!front(1).isSameNode(held)) return "the row was made again under the finger";
if (front(1).style.transform !== "translateX(-40px)") return `a message under the finger left the row at ${front(1).style.transform}`;
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x - 44, y: p0.y }] }); await wait(30);
if (front(1).style.transform !== "translateX(-44px)") return `after the message the drag stopped following: ${front(1).style.transform}`;
await wait(300);
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x - 10, y: p0.y }] }); await wait(250);
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await settle();
if (off(front(1)) !== 0 || v("log") !== "none") return "the drag did not end cleanly after the message";
// A slower pull past half the button keeps it showing.
const slow = async (el, dx, ms = 800) => {
    const r = el.getBoundingClientRect(), p = { x: r.left + r.width * 0.75, y: r.top + r.height / 2 };
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    const steps = 24;
    for (let i = 1; i <= steps; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y }] }); await wait(ms / steps); }
    await wait(180);
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await settle();
};
await slow(front(1), -70);
if (!row(1).classList.contains("ui-convlist-open") || off(front(1)) !== -96) return `a pull left the row at ${off(front(1))}`;
const btn = row(1).querySelector(".ui-convlist-archive");
if (getComputedStyle(row(1).querySelector(".ui-convlist-back")).visibility !== "visible") return "the button did not show";
// A tap on the row closes it and opens nothing.
await tap(row(1).querySelector(".ui-convlist-open-chat"));
await settle();
if (row(1).classList.contains("ui-convlist-open") || v("opened") !== "1") return "a tap did not close the row";
// Vertical scroll is left alone: a drag up scrolls and does not move the row.
const list = box.querySelector(".ui-convlist-list");
await drag(front(1), 4, -160, 260); await wait(200);
if (list.scrollTop < 40) return `a drag up scrolled ${list.scrollTop}`;
if (off(front(1)) !== 0 || row(1).classList.contains("ui-convlist-open")) return "a drag up moved the row";
list.scrollTop = 0; await wait(80);
// A cancelled gesture: the row springs back.
const r2 = front(1).getBoundingClientRect(), p2 = { x: r2.left + r2.width * 0.7, y: r2.top + r2.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p2] });
for (let i = 1; i <= 8; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p2.x - i * 20, y: p2.y }] }); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await settle();
if (off(front(1)) !== 0 || v("log") !== "none" || rows().length !== 12) return "a cancelled drag went on";
// A long pull archives, past 60% of the row. On the way it arms, with a haptic.
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); } };
const w = front(1).getBoundingClientRect().width;
await slow(front(1), -w * 0.7);
delete window.quilloNative;
if (felt.join() !== "selection") return `the arming haptic was ${felt.join()}`;
await wait(450);
if (row(1) || v("log") !== "archive:1") return `a long pull gave ${v("log")}`;
if (rows().length !== 11) return `${rows().length} rows after archiving`;
if (text(box, ".ui-convlist-toast span") !== "Archived Design team") return "no toast";
// Undo brings it back in its place.
await tap(box.querySelector(".ui-convlist-undo")); await wait(120);
if (!row(1) || v("log") !== "undo:1" || box.querySelector(".ui-convlist-toast")) return "Undo did not bring it back";
if (ids() !== "2,5,3,1,4,10,6,11,12,7,8,9") return `after Undo the order is ${ids()}`;
if (off(front(1)) !== 0) return `after Undo the row stands at ${off(front(1))}`;
// A flick: short, quick, and it archives though it is under the long-pull distance.
await drag(front(10), -90, 0, 48); await wait(650);
if (row(10) || v("log") !== "archive:10") return `a flick gave ${v("log")}`;
// A slow pull of the same length does not.
await slow(front(11), -90);
await wait(100);
if (!row(11) || !row(11).classList.contains("ui-convlist-open")) return "a slow pull archived";
await tap(row(11).querySelector(".ui-convlist-open-chat")); await settle();
// A pull back to the right closes an open row.
await slow(front(11), -90); await wait(100);
if (!row(11).classList.contains("ui-convlist-open")) return "the row did not open for the pull back";
await slow(front(11), 70);
if (row(11).classList.contains("ui-convlist-open") || off(front(11)) !== 0) return `a pull back left the row at ${off(front(11))}`;
// The toast goes by itself after five seconds.
await wait(5200);
if (box.querySelector(".ui-convlist-toast")) return "the toast did not go";
// The equal: the button at the row's end, for a finger or for keys.
const more = row(12).querySelector(".ui-convlist-more");
if (more.getAttribute("aria-label") !== "Actions for Edsger Dijkstra" || more.getBoundingClientRect().width < 44) return "the actions button is wrong";
await tap(more); await settle();
if (more.getAttribute("aria-expanded") !== "true" || !row(12).classList.contains("ui-convlist-open")) return "the button did not show the action";
if (document.activeElement !== row(12).querySelector(".ui-convlist-archive")) return "focus did not go to Archive";
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await settle();
if (row(12).classList.contains("ui-convlist-open") || document.activeElement !== more) return "Escape did not close and return focus";
more.click(); await settle();
row(12).querySelector(".ui-convlist-archive").click(); await wait(600);
if (row(12) || v("log") !== "archive:12") return `the Archive button gave ${v("log")}`;
if (document.activeElement !== box.querySelector(".ui-convlist-undo")) return "after keys, focus is not on Undo";
await tap(box.querySelector(".ui-convlist-undo")); await wait(100);
// Bad input.
const bad = $("#chats-bad");
if (rows(bad).length !== 1 || text(row(5, bad), ".ui-convlist-time") !== "" || row(5, bad).querySelector(".ui-convlist-badge")) return "bad data shows";
if (text($("#chats-none"), ".ui-convlist-none") !== "Nothing yet") return "the empty text is wrong";
// A phone shows no pane.
const wide = $("#chats-wide");
const pane = (b) => getComputedStyle(b.querySelector(".ui-convlist-pane")).display;
if (device === "phone" && pane(box) !== "none") return "a phone shows the pane";
if (device === "tablet") {
    await wait(200);
    if (pane(wide) !== "block") return `a wide pane's pane is ${pane(wide)}`;
    const p = wide.querySelector(".ui-convlist-pane");
    if (p.querySelector("h3")?.textContent !== "Ada Lovelace") return `the pane shows ${p.textContent}`;
    if (row(2, wide).querySelector(".ui-convlist-open-chat").getAttribute("aria-current") !== "true") return "selected is not marked";
    const tint = getComputedStyle(front(2, wide)).backgroundColor;
    if (tint === getComputedStyle(front(1, wide)).backgroundColor) return "the open chat's row is not marked from end to end";
    await tap(row(1, wide).querySelector(".ui-convlist-open-chat"));
    if (p.querySelector("h3")?.textContent !== "Design team") return `a tap left the pane on ${p.textContent}`;
    const own = $("#chats-pane");
    if (own.querySelector("[data-own-pane]")?.textContent !== "Your own chat view") return "pane={true} does not show the children";
    await tap(row(1, own).querySelector(".ui-convlist-open-chat"));
    if (own.querySelector("[data-own-pane]")?.textContent !== "Your own chat view") return "opening a chat lost the children";
}
