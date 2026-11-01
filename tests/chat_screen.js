// mobile
const frame = $("#chat-screen-demo");
const scroll = frame.querySelector(".ui-chat-screen-scroll");
const list = frame.querySelector(".ui-chat-screen-list");
const days = () => [...list.querySelectorAll(".ui-chat-screen-day")].map((d) => d.textContent.trim());
const rowsOf = () => [...list.querySelectorAll(".ui-chat-screen-row")];
const atBottom = () => Math.abs(scroll.scrollTop) < 2;
if (scroll.getAttribute("role") !== "log") return "the messages are not a log";
if (days().join("|") !== "Thu 29 Oct|Yesterday|Today") return "days: " + days().join("|");
if (rowsOf().length !== 13) return `13 messages, found ${rowsOf().length}`;
if (!atBottom()) return "it does not open at the newest: " + scroll.scrollTop;
const lastR = rowsOf().at(-1).getBoundingClientRect(), boxR = scroll.getBoundingClientRect();
if (lastR.bottom > boxR.bottom + 1) return "the newest message is under the edge";

// Groups: by person, within five minutes, and within a day.
const bubble = (i) => rowsOf()[i].querySelector(".ui-message-bubble");
const up = (i) => bubble(i).classList.contains("ui-message-bubble-joins-up"), down = (i) => bubble(i).classList.contains("ui-message-bubble-joins-down");
// 08:15 and 08:16 join; 08:40 is 24 minutes on and stands alone.
if (up(2) || !down(2) || !up(3) || down(3) || up(4) || down(4)) return "Ben's three messages are grouped wrongly: " + [up(2), down(2), up(3), down(3), up(4), down(4)];
// 08:01 Ana, 08:03 Ben, 08:04 Ana: another person breaks a group.
if (up(7) || down(7) || up(8) || down(8)) return "a group crossed another person";
if (rowsOf()[2].querySelector("time") !== null && rowsOf()[2].querySelector("time")) return "only a group's last message shows its time";
if (rowsOf()[3].querySelector("time").textContent !== "08:16") return "the time: " + rowsOf()[3].querySelector("time")?.textContent;

// The side list is for a tablet.
const side = frame.querySelector(".ui-chat-screen-side");
if (device === "phone") {
    if (getComputedStyle(side).display !== "none") return "a phone has no room for the side list";
} else {
    if (getComputedStyle(side).display === "none") return "a tablet should show the side list";
    if (frame.querySelector(".ui-chat-screen-main").getBoundingClientRect().left < side.getBoundingClientRect().right - 1) return "the columns overlap";
    await tap(side.querySelectorAll("button")[1]);
    if ($("#chat-screen-open").textContent !== "Open: ben") return "on_thread did not come: " + $("#chat-screen-open").textContent;
    if (side.querySelectorAll("button")[1].getAttribute("aria-current") !== "true") return "the thread is not marked";
}

// New ones at the bottom: it stays at the bottom.
const arrives = $("#chat-screen-arrives");
arrives.click(); await wait(120);
if (rowsOf().length !== 14 || !atBottom()) return "a new message did not keep it at the bottom: " + scroll.scrollTop;
if (rowsOf().at(-1).getBoundingClientRect().bottom > boxR.bottom + 1) return "the new message is under the edge";
if (frame.querySelector(".ui-chat-screen-jump")) return "at the bottom there is nothing to jump to";

// Scrolled up with a finger: the jump button shows, and a new message does not move what is read.
const box = scroll;
await drag(box, 0, 200, 300); await wait(300);
if (atBottom()) return "a real drag did not scroll: " + scroll.scrollTop;
const jump = () => frame.querySelector(".ui-chat-screen-jump");
if (!jump()) return "scrolled up, the jump button is missing";
if (jump().textContent.trim() !== "") return "nothing new yet: " + jump().textContent;
const reading = rowsOf()[5], y0 = reading.getBoundingClientRect().top;
arrives.click(); await wait(150);
arrives.click(); await wait(150);
if (Math.abs(reading.getBoundingClientRect().top - y0) > 1) return `a new message moved the page: ${y0} to ${reading.getBoundingClientRect().top}`;
if (jump().textContent.trim() !== "2 new") return "the count: " + jump().textContent;

// Up to the top with a finger: a batch is asked for, once.
const older = () => list.querySelector(".ui-chat-screen-older");
if (!older()) return "the button for older ones is missing";
for (let i = 0; i < 8 && rowsOf().length < 21; i++) { await drag(box, 0, 500, 120); await wait(200); }
await wait(300);
if (rowsOf().length !== 21) return "scrolling up should load one batch of five, to 21: " + rowsOf().length;
if (days().join("|") !== "Thu 29 Oct|Yesterday|Today") return "days after a batch of the same day: " + days().join("|");
// The rest by the button, the place kept to the pixel, with a new day going in above.
await drag(box, 0, -300, 200); await wait(300);
const anchor = rowsOf()[12], ya = anchor.getBoundingClientRect().top, ta = scroll.scrollTop;
older().click(); await wait(400);
if (rowsOf().length !== 25) return "the button should load the rest, to 25: " + rowsOf().length;
if (Math.abs(anchor.getBoundingClientRect().top - ya) > 1) return `loading older ones moved the page: ${ya} to ${anchor.getBoundingClientRect().top}`;
if (scroll.scrollTop !== ta) return "the scroll position should not need touching";
if (older()) return "with no more, the button stays";
if (days().join("|") !== "Wed 31 Dec 2025|Fri 2 Oct|Thu 29 Oct|Yesterday|Today") return "days after loading: " + days().join("|");

// Back down by the button, which empties the count.
await tap(jump()); await wait(900);
if (!atBottom()) return "the jump button did not go to the newest: " + scroll.scrollTop;
if (jump()) return "the jump button stayed";

// Sending from far up comes back down.
await drag(box, 0, 240, 300); await wait(300);
const composer = $("#chat-screen-composer"), field = composer.querySelector("textarea");
if (atBottom()) return "second scroll did not move";
const say = async (t) => { field.focus(); field.value = t; field.dispatchEvent(new Event("input", { bubbles: true })); await wait(60); composer.requestSubmit(); await wait(250); };
await say("On my way");
if (!atBottom()) return "sending should show what was sent: " + scroll.scrollTop;
if (rowsOf().at(-1).textContent.indexOf("On my way") < 0) return "the message sent is not the last";
if (!rowsOf().at(-1).querySelector("time")) return "the time of what was sent is not shown";

// The keyboard: the messages shrink, the newest stays in sight, the composer clears it.
const vv = visualViewport, H = innerHeight;
const fake = (height, top = 0) => {
    Object.defineProperty(vv, "height", { get: () => height, configurable: true });
    Object.defineProperty(vv, "offsetTop", { get: () => top, configurable: true });
    vv.dispatchEvent(new Event("resize"));
};
const unfake = () => { delete vv.height; delete vv.offsetTop; vv.dispatchEvent(new Event("resize")); };
frame.scrollIntoView({ block: "end" }); await wait(80);
const fb = frame.getBoundingClientRect().bottom;
const h0 = scroll.clientHeight;
const covered = 200;
fake(fb - covered); await wait(120);
const lift = Math.round(Math.min(H - (fb - covered), covered));
if (Math.abs((h0 - scroll.clientHeight) - lift) > 1) return `the messages should shrink by ${lift}, shrank ${h0 - scroll.clientHeight}`;
if (composer.getBoundingClientRect().bottom > fb - covered + 1) return "the composer is under the keyboard";
if (!atBottom()) return "the keyboard took it off the newest";
if (rowsOf().at(-1).getBoundingClientRect().bottom > scroll.getBoundingClientRect().bottom + 1) return "the newest is hidden by the keyboard";
unfake(); await wait(120);
if (scroll.clientHeight !== h0) return "the messages did not grow back";

// Turned: at the newest it stays at the newest; up the list the same rows stay in sight.
{
    const [w, h] = [innerWidth, innerHeight];
    await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(300);
    const low = atBottom(), n = rowsOf().length;
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (!low || !atBottom()) return "turning the screen took it off the newest";
    if (rowsOf().length !== n) return "turning the screen lost messages";
}

// As a whole screen it follows what can be seen, and bad data is shown, not fatal.
const fill = $("#chat-screen-fill-demo .ui-chat-screen");
if (!fill.classList.contains("ui-chat-screen-fill") || getComputedStyle(fill).position !== "fixed") return "fill is not fixed";
fake(500, 40); await wait(80);
if (fill.style.top !== "40px" || fill.style.height !== "500px") return `fill should follow the view: ${fill.style.top} ${fill.style.height}`;
unfake(); await wait(80);
if (fill.style.top !== "" || fill.style.height !== "") return "fill did not let go of the view";
const fillRows = [...fill.querySelectorAll(".ui-chat-screen-row")];
if (fillRows.length !== 2) return "a repeated id and a message with no id: " + fillRows.length;
if (!fill.textContent.includes("Ana is typing")) return "typing is not shown";
if ([...fill.querySelectorAll(".ui-chat-screen-day")].map((d) => d.textContent.trim()).join("|") !== "Today") return "days with a bad time: " + fill.querySelectorAll(".ui-chat-screen-day").length;
