// mobile
const box = $("#alrail-demo");
const list = box.querySelector(".ui-alrail-list");
const rail = box.querySelector(".ui-alrail-rail");
const bubble = box.querySelector(".ui-alrail-bubble");
const letterEls = [...rail.querySelectorAll(".ui-alrail-letter")];
const v = (k) => $(`[data-${k}]`).textContent;
const heads = () => [...box.querySelectorAll(".ui-alrail-head")];
const rowsAll = () => [...box.querySelectorAll(".ui-alrail-row")];
// Letters: A to Z and #; no Q, no X among the demo's names. The names are sorted by their folded text.
if (letterEls.length !== 27) return `the rail has ${letterEls.length} letters`;
if (heads().map((h) => h.textContent).join("") !== "ABCDEFGHIJKLMNOPRSTUVWYZ#") return `the sections are ${heads().map((h) => h.textContent).join("")}`;
if (!letterEls[16].hasAttribute("data-none") || letterEls[0].hasAttribute("data-none")) return "the rail does not dim an empty letter";
const inB = [...box.querySelector('[data-letter="B"]').querySelectorAll(".ui-alrail-row")].map((r) => r.textContent);
if (inB.join() !== "Bach,Beck,Björk,Blur,Bob Dylan,Bowie") return `B holds ${inB.join()}`;
const inHash = [...box.querySelector('[data-letter="#"]').querySelectorAll(".ui-alrail-row")].map((r) => r.textContent);
if (inHash.join() !== "1975,2Pac,808 State") return `# holds ${inHash.join()}`;
const inA = [...box.querySelector('[data-letter="A"]').querySelectorAll(".ui-alrail-row")].map((r) => r.textContent);
if (inA.slice(0, 5).join() !== "Abba,AC/DC,Adele,Ænima Tribute,Arcade Fire") return `A starts ${inA.slice(0, 5).join()}`;
if (box.querySelector(".ui-alrail-foot").textContent.split(".")[0] !== "98 names") return `the foot says ${box.querySelector(".ui-alrail-foot").textContent}`;
// The rail: 44 px wide, the whole height, and takes the gesture.
const rr = rail.getBoundingClientRect();
if (rr.width !== 44) return `the rail is ${rr.width} wide`;
if (getComputedStyle(rail).touchAction !== "none") return "the rail does not take the gesture";
if (getComputedStyle(list).overscrollBehaviorY !== "contain") return "a pull past the end reaches the browser";
if (getComputedStyle(box.querySelector(".ui-alrail-head")).position !== "sticky") return "headings do not stick";
const inner = rail.querySelector(".ui-alrail-letters").getBoundingClientRect();
const at = (i) => ({ x: rr.left + 22, y: inner.top + (i + 0.5) * inner.height / 27 });
const touch = (type, p) => cdp("Input.dispatchTouchEvent", { type, touchPoints: p ? [p] : [] });
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); } };
const topOf = (l) => box.querySelector(`[data-letter="${l}"]`).getBoundingClientRect().top - list.getBoundingClientRect().top;
// A finger on C: the bubble shows it, the list is at C, one haptic.
await touch("touchStart", at(2)); await wait(120);
if (bubble.textContent !== "C" || !bubble.hasAttribute("data-on") || getComputedStyle(bubble).opacity === "0") return `the bubble shows ${bubble.textContent}`;
if (Math.abs(topOf("C")) > 1) return `C stands ${topOf("C")} from the top`;
if (felt.join() !== "selection") return `the first touch gave ${felt.join()}`;
const by = new DOMMatrix(getComputedStyle(bubble).transform).m42;
if (Math.abs(by + rr.top - at(2).y) > 2) return `the bubble is at ${by + rr.top}, the finger at ${at(2).y}`;
if (!rail.hasAttribute("data-on")) return "the rail does not show it is held";
// A move inside a letter is no step, and no haptic.
await touch("touchMove", { x: at(2).x, y: at(2).y + 1 }); await wait(30);
if (felt.length !== 1) return `a move inside a letter gave ${felt.length} haptics`;
// Step by step: one haptic for each, and the list moves with each.
for (const [i, l] of [[3, "D"], [4, "E"], [5, "F"]]) {
    await touch("touchMove", at(i)); await wait(40);
    if (bubble.textContent !== l || Math.abs(topOf(l)) > 1) return `at ${l}, the bubble says ${bubble.textContent} and ${l} stands ${topOf(l)} from the top`;
}
if (felt.length !== 4) return `four letters gave ${felt.length} haptics`;
// Sideways drift off the rail: the capture keeps it.
await touch("touchMove", { x: rr.left - 120, y: at(10).y }); await wait(40);
if (bubble.textContent !== "K") return `a finger off the rail reads ${bubble.textContent}`;
if (felt.length !== 5) return `the drift gave ${felt.length} haptics`;
// A letter with no names: the bubble dims, the list goes to the nearest. Q is 16: P and R are both one away, and down wins.
await touch("touchMove", at(16)); await wait(40);
if (bubble.textContent !== "Q" || !bubble.hasAttribute("data-none")) return `an empty letter shows ${bubble.textContent}`;
if (Math.abs(topOf("R")) > 1) return `the list did not go to R: ${topOf("R")}`;
// Past the end of the rail stays on the last.
await touch("touchMove", { x: at(0).x, y: inner.bottom + 80 }); await wait(40);
if (bubble.textContent !== "#") return `past the end reads ${bubble.textContent}`;
await touch("touchEnd"); await wait(180);
delete window.quilloNative;
if (bubble.hasAttribute("data-on") || getComputedStyle(bubble).opacity !== "0") return "the bubble stayed after the finger left";
if (v("went") !== "#") return `on_letter gave ${v("went")}`;
if (rail.getAttribute("aria-valuetext") !== "#" || rail.getAttribute("aria-valuenow") !== "26") return `the rail reads ${rail.getAttribute("aria-valuetext")}`;
// Off the app, the web's own haptic, once a step; a tap has already made the page active.
const buzz = [];
Object.defineProperty(navigator, "vibrate", { value: (ms) => { buzz.push(ms); return true; }, configurable: true });
await touch("touchStart", at(1)); await wait(40);
await touch("touchMove", at(2)); await wait(40);
await touch("touchMove", at(3)); await wait(40);
await touch("touchEnd"); await wait(120);
delete navigator.vibrate;
if (buzz.join() !== "6,6,6") return `navigator.vibrate gave ${buzz.join()}`;
// The system takes the gesture: the bubble goes, nothing breaks.
await touch("touchStart", at(7)); await wait(60);
if (bubble.textContent !== "H") return "a second touch did not show H";
await touch("touchCancel"); await wait(180);
if (bubble.hasAttribute("data-on")) return "a cancel left the bubble";
await touch("touchStart", at(0)); await wait(40); await touch("touchEnd"); await wait(120);
if (Math.abs(list.scrollTop) > 1) return `a tap on A left the list at ${list.scrollTop}`;
// A real scroll of the list moves the rail's mark, and a heading sticks at the top.
const row = rowsAll()[6];
await drag(row, 0, -320, 280);
for (let was = -1, i = 0; i < 40 && list.scrollTop !== was; i++) { was = list.scrollTop; await wait(80); }
if (list.scrollTop < 120) return `a drag scrolled ${list.scrollTop}`;
// The heading at the top: stuck there, or on its way out as the next one pushes it.
const edge = list.getBoundingClientRect().top;
const stuck = heads().filter((h) => { const r = h.getBoundingClientRect(); return r.top <= edge + 1 && r.bottom > edge; });
if (stuck.length !== 1) return `${stuck.length} headings stick`;
const here = stuck[0].textContent;
if (rail.getAttribute("aria-valuetext") !== here) return `the rail says ${rail.getAttribute("aria-valuetext")} under ${here}`;
if (!letterEls["ABCDEFGHIJKLMNOPQRSTUVWXYZ#".indexOf(here)].hasAttribute("data-at")) return "the rail's mark did not follow";
// Keys.
const keyd = (k) => { const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }); rail.dispatchEvent(e); return e.defaultPrevented; };
list.scrollTop = 0; await wait(80);
rail.focus();
if (rail.tabIndex !== 0 || rail.getAttribute("role") !== "slider") return "the rail is no slider";
keyd("ArrowDown"); await wait(30);
if (Math.abs(topOf("B")) > 1 || v("went") !== "B") return `ArrowDown went to ${v("went")}`;
keyd("PageDown"); await wait(30);
if (v("went") !== "G") return `PageDown went to ${v("went")}`;
keyd("ArrowUp"); await wait(30);
if (v("went") !== "F") return `ArrowUp went to ${v("went")}`;
keyd("End"); await wait(30);
if (v("went") !== "#") return `End went to ${v("went")}`;
keyd("m"); await wait(30);
if (v("went") !== "M" || Math.abs(topOf("M")) > 1) return `the key m went to ${v("went")}`;
keyd("x"); await wait(30);
if (v("went") !== "Y") return `the key x went to ${v("went")}`;
if (keyd("!")) return "a key not on the rail was taken";
keyd("Home"); await wait(30);
if (v("went") !== "A" || Math.abs(list.scrollTop) > 1) return `Home went to ${v("went")}`;
// A tap on a row.
await tap(rowsAll()[1]);
if (v("picked") !== "AC/DC" && v("picked") !== rowsAll()[1].textContent) return `a tap picked ${v("picked")}`;
// Maps, bad items, sub lines, a plain row, and a rail that folds on a short screen.
const short = $("#alrail-short");
const shortRows = [...short.querySelectorAll(".ui-alrail-row")].map((r) => r.textContent);
if (shortRows.join() !== "AdaMaths,ZedLast,ZedTwin,4") return `the short list holds ${shortRows.join()}`;
if (short.querySelector("button.ui-alrail-row")) return "with no on_select a row is pressable";
const shown = [...short.querySelectorAll(".ui-alrail-letter span")].map((s) => s.textContent);
if (shown.filter((s) => s === "•").length < 13 || shown[0] !== "A") return `the short rail reads ${shown.join("")}`;
if (short.querySelector(".ui-alrail-foot").textContent.includes("haptics")) return "haptics={false} still speaks of them";
const sr = short.querySelector(".ui-alrail-rail").getBoundingClientRect(), si = short.querySelector(".ui-alrail-letters").getBoundingClientRect();
short.scrollIntoView({ block: "center" }); await wait(60);
const sr2 = short.querySelector(".ui-alrail-letters").getBoundingClientRect();
// The list here is too short to scroll to Z, so read the bubble: a dot still stands for its letter.
await touch("touchStart", { x: sr2.left + 8, y: sr2.top + 1.5 * sr2.height / 27 }); await wait(60);
if (short.querySelector(".ui-alrail-bubble").textContent !== "B") return `a dot on the rail reads ${short.querySelector(".ui-alrail-bubble").textContent}`;
await touch("touchEnd"); await wait(60);
if ($("#alrail-none .ui-alrail-none").textContent !== "No artists yet" || $("#alrail-none .ui-alrail-rail")) return "the empty list is wrong";
// Rotation folds the rail and keeps the place.
box.scrollIntoView({ block: "center" });
keyd("m"); await wait(40);
const frame = box.closest(".demo-phone");
frame.style.height = "300px"; await wait(150);
if (rail.getAttribute("aria-valuetext") !== "M") return "a shorter frame lost the letter";
const dots = [...box.querySelectorAll(".ui-alrail-letter span")].filter((s) => s.textContent === "•").length;
if (dots < 13) return `a short frame left ${dots} dots: ${rail.clientHeight} ${[...box.querySelectorAll(".ui-alrail-letter span")].map((s) => s.textContent).join("")}`;
frame.style.height = "600px"; await wait(150);
if ([...box.querySelectorAll(".ui-alrail-letter span")].some((s) => s.textContent === "•")) return "a tall frame kept the dots";
// A phone has one column; a wide pane two.
const cols = () => getComputedStyle(box.querySelector(".ui-alrail-rows")).gridTemplateColumns.split(" ").length;
if (device === "phone" && getComputedStyle(box.querySelector(".ui-alrail-rows")).display !== "block") return "a phone has columns";
if (device === "tablet") {
    await wait(200);
    if (cols() !== 2) return `a wide pane has ${cols()} columns`;
}
