// mobile
const frame = $("#unread-marker-demo");
const box = frame.querySelector(".ui-unread-marker-scroll");
const line = frame.querySelector("[role=separator]");
const log = () => $("#unread-marker-log");
const jump = () => frame.querySelector(".ui-unread-marker-jump");
const row = (id) => frame.querySelector(`[data-uid="${id}"]`);
const read = () => log().textContent.replace("Read: ", "").split(",").filter(Boolean).map(Number);
await wait(500);

// The line goes above the first unread: last_read is 8, and 9 is mine, so 10.
if (!line || line.textContent !== "New messages") return "the line is missing";
if (frame.querySelectorAll("[role=separator]").length !== 1) return "more than one line";
if (line.parentElement.querySelector("[data-uid]").dataset.uid !== "10") return "the line is above " + line.parentElement.querySelector("[data-uid]").dataset.uid;
// Opened near the line, not at the bottom and not at the top.
const lb = line.getBoundingClientRect(), br = box.getBoundingClientRect();
if (lb.top < br.top || lb.top > br.top + 40) return `it should open with the line near the top: ${lb.top} in ${br.top}`;

// Unread are 10 to 20 less 15, mine: 10. What is on screen has been seen, what is not has not.
const onScreen = (id) => { const r = row(id).getBoundingClientRect(); const v = box.getBoundingClientRect(); const part = Math.min(r.bottom, v.bottom) - Math.max(r.top, v.top); return part / r.height >= 0.6; };
const unread = [10, 11, 12, 13, 14, 16, 17, 18, 19, 20];
const seenNow = unread.filter(onScreen);
if (!seenNow.length) return "nothing on screen to read";
if (read().join() !== seenNow.join()) return `seen ${read().join()}, on screen ${seenNow.join()}`;
if (seenNow.length === unread.length) return "all fit: the test needs a smaller frame";
const count = unread.length - seenNow.length;
if (jump().textContent.trim() !== `${count} new`) return `the count: ${jump().textContent.trim()} for ${count}`;
if (+log().dataset.left !== count) return "on_read's left: " + log().dataset.left;
if (row(10).classList.contains("ui-unread-marker-fresh")) return "a seen message still looks unread";
if (!row(20).classList.contains("ui-unread-marker-fresh")) return "an unseen message does not look unread";
if (row(9).hasAttribute("data-unread") || row(15).hasAttribute("data-unread")) return "my own message counted as unread";

// A finger scrolls on: read in order, in a batch, and the line has not moved in the list.
const lineTop = line.offsetTop;
await drag(box, 0, -120, 300); await wait(600);
const after = read();
if (after.length <= seenNow.length) return "scrolling read nothing";
if (after.join() !== unread.slice(0, after.length).join()) return "read out of order: " + after.join();
if (jump().textContent.trim() !== `${unread.length - after.length} new`) return "the count did not follow: " + jump().textContent;
if (line.offsetTop !== lineTop) return "the line moved as messages were read";

// Off the page, nothing is read; back on it, what is in sight is.
const realState = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState");
Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true });
const n = read().length;
box.scrollTop += 90; await wait(600);
if (read().length !== n) return "a page nobody is looking at read messages";
delete document.visibilityState;
document.dispatchEvent(new Event("visibilitychange")); await wait(600);
if (read().length <= n) return "coming back did not read what is in sight";

// The button goes to the first unseen.
const first = unread[read().length];
await tap(jump()); await wait(800);
{
    const r = row(first).getBoundingClientRect(), v = box.getBoundingClientRect();
    if (r.top < v.top - 1 || r.bottom > v.bottom + 1) return `the button did not go to ${first}`;
}
await wait(500);

// To the end, by finger: all read, the count gone, the line still there, and a new arrival at the bottom is seen at once.
for (let i = 0; i < 12 && read().length < unread.length; i++) { await drag(box, 0, -320, 120); await wait(180); }
await wait(600);
if (read().join() !== unread.join()) return "not all read: " + read().join();
if (jump() && jump().textContent.trim() !== "") return "the count stayed: " + jump().textContent;
if (!frame.querySelector("[role=separator]")) return "the line went";
if (frame.querySelector("[role=separator]").offsetTop !== lineTop) return "the line moved";
await drag(box, 0, -600, 120); await wait(300);
$("#unread-marker-arrives").click(); await wait(700);
if (box.scrollHeight - box.clientHeight - box.scrollTop > 2) return "at the bottom, a new message should keep it there";
if (read().at(-1) !== 21) return "a message that arrives in sight should be read: " + read().at(-1);

// Scrolled up, an arrival waits, counted, and nothing moves.
await drag(box, 0, 300, 250); await wait(400);
const y = row(16).getBoundingClientRect().top;
if (jump().textContent.trim() !== "") return "nothing should be counted: " + jump().textContent;
$("#unread-marker-arrives").click(); await wait(500);
if (Math.abs(row(16).getBoundingClientRect().top - y) > 1) return "an arrival moved what is read";
if (jump().textContent.trim() !== "1 new") return "the arrival is not counted: " + jump().textContent;
if (jump().dataset.way !== "down") return "the arrival is below: " + jump().dataset.way;
await tap(jump()); await wait(900);
if (read().at(-1) !== 22) return "the jump did not read the arrival: " + read().at(-1);

// All read, up the list: what arrives starts a line of its own, and is counted.
const quiet = $("#unread-marker-quiet"), qbox = quiet.querySelector(".ui-unread-marker-scroll");
if (quiet.querySelector("[role=separator]")) return "with all read there is no line";
if (qbox.scrollHeight - qbox.clientHeight - qbox.scrollTop > 2) return "with no line it should open at the bottom";
qbox.scrollTop = 0; await wait(200);
$("#unread-marker-quiet-add").click(); await wait(300);
if (!quiet.querySelector("[role=separator]")) return "an arrival up the list should start a line";
if (quiet.querySelector(".ui-unread-marker-jump").textContent.trim() !== "1 new") return "that arrival's count: " + quiet.querySelector(".ui-unread-marker-jump").textContent;

// Bad and empty: an id it cannot find draws no line; nothing read puts it on top, and a repeated id shows once.
const none = $("#unread-marker-none");
if (none.querySelector("[role=separator]") || none.querySelector(".ui-unread-marker-jump")) return "a last_read that cannot be found should draw nothing";
const all = $("#unread-marker-all");
if (all.querySelectorAll("[data-uid]").length !== 2) return "a repeated id: " + all.querySelectorAll("[data-uid]").length;
if (!all.querySelector("[role=separator]")) return "with nothing read, the line should be on top";
