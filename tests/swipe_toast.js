// mobile
const delBtn = $$("button.ui-btn").find((b) => b.textContent === "Delete an email");
const saveBtn = $$("button.ui-btn").find((b) => b.textContent === "Save a draft");
const lostBtn = $$("button.ui-btn").find((b) => b.textContent === "Lose the connection");
const toasts = () => $$(".ui-swipe-toast");
const text = (t) => t.querySelector(".ui-swipe-toast-text").textContent;
const undone = () => +$(".swipe-toast-demo-undone").textContent;
const dropped = () => +$(".swipe-toast-demo-dropped").textContent;
const leave = () => wait(380);
const appear = async () => { for (let i = 0; i < 40 && !toasts().length; i++) await wait(50); await wait(320); };
const frame = () => $(".demo-phone").getBoundingClientRect();
const host = $(".ui-swipe-toast-host");
if (host.getAttribute("aria-live") !== "polite") return "not a live region";

// Above the tab bar.
await tap(delBtn); await appear();
let t = toasts()[0];
if (!t) return "no toast came";
if (text(t) !== "Email 1 deleted") return `it says ${text(t)}`;
let box = t.getBoundingClientRect();
if (Math.abs(frame().bottom - box.bottom - 65) > 2) return `it stands ${frame().bottom - box.bottom} above the foot of its frame, not 64 above`;
const tabs = $(".swipe-toast-demo-tabs").getBoundingClientRect();
if (box.bottom > tabs.top) return "it covers the tab bar";
if (!t.querySelector(".ui-swipe-toast-undo")) return "no Undo";

// A swipe that falls short springs back, and it follows the finger.
let p = middle(t.querySelector(".ui-swipe-toast-text"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x + 8 * i, y: p.y }]); await wait(16); }
await wait(30);
if (Math.abs(t.getBoundingClientRect().left - box.left - 64) > 1) return `it does not follow the finger: ${t.getBoundingClientRect().left - box.left}`;
if (t.style.opacity === "") return "it does not fade as it goes";
await wait(130);
await fingers("touchEnd", []); await wait(320);
if (Math.abs(t.getBoundingClientRect().left - box.left) > 1) return "a short swipe did not spring back";
if (t.style.transform !== "" || t.style.opacity !== "") return "a short swipe left its styles";
// Cancelled by the system.
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x - 8 * i, y: p.y }]); await wait(16); }
await fingers("touchCancel", []); await wait(320);
if (Math.abs(t.getBoundingClientRect().left - box.left) > 1) return "a cancelled swipe did not go back";
if (!toasts()[0]) return "a cancelled swipe sent it away";
// A finger on it holds the timer past its 3 seconds.
await fingers("touchStart", [p]);
await wait(3300);
if (!toasts()[0]) return "a toast under a finger went anyway";
await fingers("touchEnd", []);
await wait(3500);
if (toasts().length) return "the timer did not run on after the finger left";
if (dropped() !== 1) return `going by itself counted ${dropped()}`;

// Past the distance, slowly, to the left.
await tap(delBtn); await appear();
t = toasts()[0];
p = middle(t.querySelector(".ui-swipe-toast-text"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: p.x - t.offsetWidth * .45 * i / 12, y: p.y }]); await wait(16); }
await wait(130);
await fingers("touchEnd", []); await wait(60);
if (!t.classList.contains("ui-swipe-toast-left")) return "a long swipe left does not leave left";
await leave();
if (toasts().length) return "a long swipe does not send it away";
if (dropped() !== 2) return "the swipe did not call on_dismiss";
// A flick to the right, however short.
await tap(delBtn); await appear();
t = toasts()[0];
p = middle(t.querySelector(".ui-swipe-toast-text"));
await fingers("touchStart", [p]);
await fingers("touchMove", [{ x: p.x + 8, y: p.y }]);
await fingers("touchMove", [{ x: p.x + 70, y: p.y }]);
await fingers("touchEnd", []); await wait(60);
if (!t.classList.contains("ui-swipe-toast-right")) return "a flick right does not leave right";
await leave();
if (toasts().length) return "a flick does not send it away";
// Up and down belong to the page.
await tap(delBtn); await appear();
t = toasts()[0];
await drag(t.querySelector(".ui-swipe-toast-text"), 2, -60, 240); await wait(200);
if (t.style.transform !== "") return "a vertical drag moved it";
if (toasts().length !== 1) return "a vertical drag sent it away";

// Undo.
await tap(t.querySelector(".ui-swipe-toast-undo")); await leave();
if (undone() !== 1) return "Undo did not call on_undo";
if (toasts().length) return "Undo did not take it away";
if (dropped() !== 3) return "Undo counted as a dismissal, or the flick did not";

// Stacked: the newest three show and say how many wait; order, new at the foot.
await tap(lostBtn); await appear();
for (let i = 0; i < 4; i++) { await tap(saveBtn.previousElementSibling); await wait(120); }
await wait(300);
if (toasts().length !== 3) return `${toasts().length} show, not 3`;
if ($(".ui-swipe-toast-more")?.textContent !== "2 more") return `the stack says ${$(".ui-swipe-toast-more")?.textContent}`;
const y = toasts().map((e) => e.getBoundingClientRect().top);
if (!(y[0] < y[1] && y[1] < y[2])) return "the stack is not in order";
if (y[1] - y[0] < 52) return "toasts overlap";
const last = text(toasts()[2]);
if (!last.startsWith("Email ")) return `the newest says ${last}`;
// They go, those waiting come back with their time, and the one with seconds 0 stays.
await wait(3700);
if (toasts().length !== 2 || $(".ui-swipe-toast-more")) return `after the first three: ${toasts().map(text)}`;
await wait(3700);
if (toasts().length !== 1 || !text(toasts()[0]).startsWith("No connection")) return `${toasts().map(text)} left after the others timed out`;
if (!toasts()[0].classList.contains("ui-swipe-toast-danger")) return "the danger tone is missing";

// The keys: focus holds it, Escape and the Dismiss button send it.
const stay = toasts()[0];
stay.querySelector(".ui-swipe-toast-close").focus();
await wait(200);
key(stay.querySelector(".ui-swipe-toast-close"), "Escape"); await leave();
if (toasts().length) return "Escape does not send it away";
await tap(saveBtn); await appear();
await tap(toasts()[0].querySelector(".ui-swipe-toast-close")); await leave();
if (toasts().length) return "the Dismiss button does not send it away";

// Above the on-screen keyboard: Chrome here has none, so its visual viewport is made to say so.
await tap(saveBtn); await appear();
const vv = window.visualViewport;
Object.defineProperty(vv, "height", { configurable: true, get: () => innerHeight - 336 });
vv.dispatchEvent(new Event("resize")); await wait(320);
// A frame holds the fixed host: the bottom is 344 up from the frame's foot.
const raised = frame().bottom - host.getBoundingClientRect().bottom;
delete vv.height;
vv.dispatchEvent(new Event("resize")); await wait(320);
if (Math.abs(raised - 345) > 2) return `with the keyboard up it stands ${raised} up, not 344`;
if (Math.abs(frame().bottom - host.getBoundingClientRect().bottom - 65) > 2) return "it did not come back down to the tab bar";
await wait(3500);
if (toasts().length) return "the last toast did not go";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(host).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
