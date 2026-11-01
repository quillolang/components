// mobile
delete window.quilloNative;
const scope = () => $(".ui-twallet");
const card = (id) => scope().querySelector(`.ui-twallet-card[data-id="${id}"]`);
const full = () => scope().querySelector(".ui-twallet-full");
const sheet = () => scope().querySelector(".ui-twallet-sheet");
const shownId = () => sheet()?.dataset.id;
const days = () => $$(".ui-twallet-groups .ui-twallet-day").map((d) => d.textContent);
const cardIds = (sel) => [...scope().querySelectorAll(`${sel} .ui-twallet-card`)].map((c) => c.dataset.id).join();

// By date, soonest first, Today and Tomorrow by name, the undated last, never lost.
if (days().join("|") !== "Today|Tomorrow|Sat 7 Nov|No date") return "days: " + days().join("|");
if (cardIds(".ui-twallet-groups") !== "c1,c2,t2,m1,n1,x1") return "order: " + cardIds(".ui-twallet-groups");
if (card("c1").querySelector(".ui-twallet-card-time").textContent !== "21:00") return "time: " + card("c1").textContent;
if (card("m1").querySelector(".ui-twallet-card-time").textContent !== "All day") return "date only: " + card("m1").textContent;
if (card("c1").querySelector(".ui-twallet-card-where").textContent !== "Coliseu dos Recreios, Row F, 12") return "where: " + card("c1").textContent;

// A stack: the second card lies on the first, with the first's head showing.
const a = card("c1").getBoundingClientRect(), b = card("c2").getBoundingClientRect();
if (!(b.top < a.bottom && b.top > a.top + 44)) return `the stack: ${a.top}-${a.bottom}, then ${b.top}`;

// Past ones apart, folded, newest first. Football started yesterday at 20:00 and ended 6 hours on.
const past = $(".ui-twallet-past");
if (past.open) return "the past should start folded";
if (past.querySelector("summary").textContent !== "Past tickets (2)") return "past: " + past.querySelector("summary").textContent;
if (cardIds(".ui-twallet-past") !== "p1,p2") return "past order: " + cardIds(".ui-twallet-past");

// Pressed, by a real tap: its code at full size, on white.
await tap(card("c1"));
if (!full().open || shownId() !== "c1") return "open: " + shownId();
if (getComputedStyle(full()).backgroundColor !== "rgb(255, 255, 255)") return "not white";
const code = scope().querySelector(".ui-twallet-code svg");
if (code.getAttribute("aria-label") !== "Code for Dead Combo") return "code label: " + code.getAttribute("aria-label");
const size = code.getBoundingClientRect();
if (size.width < Math.min(innerWidth * 0.44, innerHeight * 0.5)) return "the code is not at full size: " + size.width;
if (scope().querySelector(".ui-twallet-say").textContent !== "Turn your screen's brightness up for the scanner.") return "say: " + scope().querySelector(".ui-twallet-say").textContent;
if (![...scope().querySelectorAll(".ui-twallet-full-line")].some((l) => l.textContent === "Today, 21:00")) return "no time on the ticket";

// A swipe that falls short, and slow: it springs back.
await drag(sheet(), -60, 0, 500);
if (shownId() !== "c1" || sheet().style.transform !== "") return "short swipe: " + shownId() + sheet().style.transform;
// Far enough.
await drag(sheet(), -Math.round(sheet().offsetWidth * 0.4), 0, 900);
if (shownId() !== "c2") return "swipe: " + shownId();
// A flick.
await drag(sheet(), -70, 0, 60);
if (shownId() !== "t2") return "flick: " + shownId();
// A barcode this time.
if (!scope().querySelector(".ui-twallet-code .ui-barcode svg")) return "t2 should be a barcode";
// A flick back, and the buttons, and the keys.
await drag(sheet(), 70, 0, 60);
if (shownId() !== "c2") return "flick back: " + shownId();
await tap(scope().querySelector(".ui-twallet-prev"));
if (shownId() !== "c1") return "Previous: " + shownId();
if (!scope().querySelector(".ui-twallet-prev").disabled) return "nothing before the first";
key(full(), "ArrowRight");
await wait(60);
if (shownId() !== "c2") return "ArrowRight: " + shownId();
key(full(), "ArrowLeft");
await wait(60);
if (shownId() !== "c1") return "ArrowLeft: " + shownId();

// Mostly up and down is no swipe.
await drag(sheet(), 15, -100, 200);
if (shownId() !== "c1" || sheet().style.transform !== "") return "vertical: " + shownId();

// The first has nothing before it: a pull gives a little and comes back.
const p = middle(sheet());
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x + i * 15, y: p.y }]); await wait(16); }
await wait(120);
const pulled = new DOMMatrix(getComputedStyle(sheet()).transform).m41;
await fingers("touchEnd", []);
await wait(350);
if (!(pulled > 40 && pulled < 100)) return "rubber: " + pulled;
if (shownId() !== "c1") return "after the pull: " + shownId();

// The system takes the gesture.
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - i * 30, y: p.y }]); await wait(16); }
const during = sheet().style.transform;
await fingers("touchCancel", []);
await wait(350);
if (during === "" || shownId() !== "c1" || sheet().style.transform !== "") return "cancelled: " + during + " " + shownId();

// State changing under a held finger leaves the ticket where the finger has it: the wallet's
// own `online`, by the browser's event.
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - i * 10, y: p.y }]); await wait(16); }
await wait(60);
const heldAt = sheet().style.transform, netBefore = scope().querySelector(".ui-twallet-net").textContent;
window.dispatchEvent(new Event("offline"));
await wait(150);
const netDuring = scope().querySelector(".ui-twallet-net").textContent, heldAfter = sheet().style.transform;
window.dispatchEvent(new Event("online"));
await wait(150);
await fingers("touchMove", [{ x: p.x - 80, y: p.y }]);
await wait(40);
const goesOn = sheet().style.transform;
await fingers("touchCancel", []);
await wait(350);
if (heldAt === "" || heldAfter !== heldAt) return `a state change moved the ticket: ${heldAt} to ${heldAfter}`;
if (netDuring === netBefore) return "no state changed during the swipe";
if (goesOn !== "translateX(-80px)") return "the swipe did not go on: " + goesOn;
if (shownId() !== "c1" || sheet().style.transform !== "") return "after the held swipe: " + shownId();

// Done puts things back; focus returns to the card it came from.
await tap(scope().querySelector(".ui-twallet-done"));
if (full().open) return "Done did not close";
if (document.activeElement !== card("c1")) return "focus: " + document.activeElement.className;
if (sheet()) return "the code stays drawn after closing";

// The app sets brightness, and only once however many tickets are looked through.
const calls = [];
window.quilloNative = {
    brightness: async (v) => { calls.push(v === undefined ? "read" : "set " + v); return 0.4; },
    keepAwake: async (on) => { calls.push("awake " + on); },
};
await tap(card("t2"));
await tap(scope().querySelector(".ui-twallet-next"));
if (shownId() !== "m1") return "next: " + shownId();
if (calls.join() !== "read,set 1,awake true") return "app up: " + calls;
await tap(scope().querySelector(".ui-twallet-done"));
if (calls.join() !== "read,set 1,awake true,set 0.4,awake false") return "app down: " + calls;
delete window.quilloNative;

// A ticket with no code says so, and draws nothing a scanner would take for one.
await tap(card("n1"));
if (shownId() !== "n1" || scope().querySelector(".ui-twallet-code svg") || scope().querySelector(".ui-twallet-none")?.textContent !== "This ticket has no code.") return "no code: " + shownId();
await tap(scope().querySelector(".ui-twallet-done"));

// Bad data: the ticket with no date opens, and says nothing of a day.
await tap(card("x1"));
if (shownId() !== "x1") return "no date: " + shownId();
await tap(scope().querySelector(".ui-twallet-done"));

// Past ones open too, marked. Unfolded by a real tap on the summary.
await tap(past.querySelector("summary"));
if (!past.open) return "did not unfold";
await tap(card("p1"));
if (shownId() !== "p1" || !scope().querySelector(".ui-twallet-gone")) return "past ticket: " + shownId();
await tap(scope().querySelector(".ui-twallet-done"));
await tap(past.querySelector("summary"));

// Offline, by Chrome: said, and a code still comes.
await cdp("Network.enable");
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
const off = scope().querySelector(".ui-twallet-net").textContent;
await tap(card("m1"));
const drawn = !!scope().querySelector(".ui-twallet-code svg");
await tap(scope().querySelector(".ui-twallet-done"));
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
if (off !== "Offline. Your tickets are saved and still work.") return "offline: " + off;
if (!drawn) return "no code offline";
if (scope().querySelector(".ui-twallet-net").textContent !== "Ready offline.") return "back online: " + scope().querySelector(".ui-twallet-net").textContent;
if ($(".ticket-wallet-demo-told").textContent !== "1") return "on_keep: " + $(".ticket-wallet-demo-told").textContent;

// The next morning: last night's concert has gone past, in order, and Today has moved on.
const moved = card("c1");
await tap($(".ticket-wallet-demo-next"));
if (days().join("|") !== "Today|Sat 7 Nov|No date") return "next morning: " + days().join("|");
if (cardIds(".ui-twallet-groups") !== "t2,m1,n1,x1") return "next morning order: " + cardIds(".ui-twallet-groups");
if (cardIds(".ui-twallet-past") !== "c1,c2,p1,p2") return "next morning past: " + cardIds(".ui-twallet-past");

// By itself, as time passes: at 11:15 the train has gone.
const realNow = Date.now;
Date.now = () => realNow.call(Date) + 3 * 3600 * 1000;
await wait(1300);
Date.now = realNow;
if (cardIds(".ui-twallet-groups") !== "m1,n1,x1") return "the clock: " + cardIds(".ui-twallet-groups");
await wait(1300);

// A page given none shows the saved copy.
await tap($(".ticket-wallet-demo-copy"));
await wait(300);
const second = $(".ticket-wallet-demo-second");
if (![...second.querySelectorAll(".ui-twallet-card")].some((c) => c.dataset.id === "m1")) return "no saved copy";
if (!second.querySelector(".ui-twallet-net").textContent.startsWith("Saved copy.")) return "copy says: " + second.querySelector(".ui-twallet-net").textContent;
await tap($(".ticket-wallet-demo-copy"));
localStorage.removeItem("quillo-demo-wallet");

const cols = getComputedStyle($(".ui-twallet-groups")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
