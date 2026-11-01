// mobile
await wait(300);
// Bad data: what cannot be shown is left out, a repeated id too.
const bad = $("#swipe-deck-bad");
const decks = bad.querySelectorAll(".ui-swipe-deck");
if (decks.length !== 2) return "the bad decks should render: " + decks.length;
const names = [...decks[0].querySelectorAll("h3")].map((h) => h.textContent).join();
if (names !== "One,No id") return "from bad cards: " + names;
if (decks[0].querySelector(".ui-swipe-deck-count").textContent !== "2 of 2 left.") return "bad cards' count";
if (decks[1].querySelector(".ui-swipe-deck-none").textContent !== "No more cards.") return "cards that are no list";
bad.remove();

const stack = $(".ui-swipe-deck-stack");
const top_ = () => $(".ui-swipe-deck-top");
const title = () => top_()?.querySelector("h3").textContent;
const log = () => $("#swipe-deck-log").textContent;
const count = () => $(".ui-swipe-deck-count").textContent;
const left = $(".ui-swipe-deck-left"), right = $(".ui-swipe-deck-right"), undo = $(".ui-swipe-deck-undo");
const w = stack.offsetWidth;
if (title() !== "Lisbon") return "the top card should be Lisbon: " + title();
if ($$(".ui-swipe-deck-card").length !== 3) return "three cards are stacked, not " + $$(".ui-swipe-deck-card").length;
if (count() !== "5 of 5 left.") return "count: " + count();

// A card held mid-way: it follows the finger and turns dx / width * 12 degrees.
const p = middle(stack);
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x + 10 * i, y: p.y + 2 * i }]); await wait(40); }
await wait(30);
const tilt = Math.round(60 / w * 12 * 100) / 100;
if (top_().style.transform !== `translate(60px, 4.8px) rotate(${tilt}deg)`) return "mid-drag: " + top_().style.transform + ", expected rotate " + tilt;
const stamp = +getComputedStyle(top_().querySelector(".ui-swipe-deck-stamp-right")).opacity;
if (Math.abs(stamp - 60 / (w * 0.38)) > 0.01) return "the word should show as far as it has gone: " + stamp;
await wait(120);
await fingers("touchEnd", []);
await wait(300);
if (top_().style.transform !== "") return "a short drag should spring back: " + top_().style.transform;
if (title() !== "Lisbon") return "a short drag took the card";

// Past 38%, slowly, to the right.
await drag(stack, w * 0.5, 0, 500);
await wait(260);
if (log() !== "right: lis") return "a long drag should keep the card: " + log();
if (title() !== "Oslo") return "next card: " + title();
if (count() !== "Keep: Lisbon. 4 left.") return "said: " + count();

// A throw: 70 px, far short of 38% on a tablet and a phone, but fast.
const flick = async (dist) => {
    const q = middle(stack);
    await fingers("touchStart", [q]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x + dist * i / 3, y: q.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(320);
};
await flick(-70);
if (log() !== "left: osl") return "a throw should send the card: " + log();
if (title() !== "Kyoto") return "after the throw: " + title();

// A throw back against the way it went: out to the right, then fast to the left.
const q = middle(stack);
await fingers("touchStart", [q]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: q.x + 18 * i, y: q.y }]); await wait(30); }
await wait(100);
for (let i = 1; i <= 2; i++) { await fingers("touchMove", [{ x: q.x + 108 - 34 * i, y: q.y }]); await wait(4); }
await fingers("touchEnd", []);
await wait(320);
if (top_().style.transform !== "" || title() !== "Kyoto") return "a throw back should spring back: " + title() + " " + top_().style.transform;

// The system taking the gesture.
await fingers("touchStart", [q]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: q.x + 20 * i, y: q.y }]); await wait(20); }
await fingers("touchCancel", []);
await wait(320);
if (top_().style.transform !== "" || title() !== "Kyoto") return "a cancelled drag should spring back: " + title();

// The held card's own data changing: it stays with the finger.
await fingers("touchStart", [q]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: q.x + 10 * i, y: q.y }]); await wait(40); }
await wait(30);
const heldAt = top_().style.transform;
if (heldAt === "") return "the held card did not move";
$("#swipe-deck-again").click();
await wait(80);
if (top_().querySelector("p").textContent.indexOf("updated") < 0) return "the test should have changed the card: " + top_().querySelector("p").textContent;
if (top_().style.transform !== heldAt) return "cards changing in mid-drag threw the card home: " + (top_().style.transform || "no transform");
await wait(120);
await fingers("touchEnd", []);
await wait(320);
if (top_().style.transform !== "" || title() !== "Kyoto") return "after cards changed in mid-drag: " + title();

// Undo, last first, and it says which came back.
await tap(undo);
if (log() !== "undo: osl") return "undo the last: " + log();
if (title() !== "Oslo") return "Oslo should be back: " + title();
await tap(undo);
if (log() !== "undo: lis") return "undo before it: " + log();
if (title() !== "Lisbon") return "Lisbon should be back: " + title();
if (undo.getAttribute("aria-disabled") !== "true") return "nothing left to undo";
await tap(undo);
if (log() !== "undo: lis") return "an idle undo did something: " + log();

// Turned, the deck keeps its place and focus stays.
await tap(right);
await wait(260);
stack.focus();
const vw = innerWidth, vh = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: vh, height: vw, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (title() !== "Oslo") return "turning changed the top card: " + title();
if (document.activeElement !== stack) return "turning lost focus";
await cdp("Emulation.setDeviceMetricsOverride", { width: vw, height: vh, deviceScaleFactor: 2, mobile: true });
await wait(300);
await tap(undo);
if (title() !== "Lisbon") return "undo after turning: " + title();

// Up and down belongs to the page.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(stack), scrollY);
await drag(stack, 3, -150, 250);
if (top_().style.transform !== "") return "a vertical drag moved the card";
if (scrollY <= y0) return "a vertical drag should scroll the page";
document.body.style.paddingBottom = "";
await wait(50);

// The buttons and the keys are the equal.
await tap(right);
await wait(260);
if (log() !== "right: lis") return "the right button: " + log();
await tap(left);
await wait(260);
if (log() !== "left: osl") return "the left button: " + log();
stack.focus();
key(stack, "ArrowRight");
await wait(280);
if (log() !== "right: kyo") return "ArrowRight: " + log();
key(stack, "ArrowLeft");
await wait(280);
if (log() !== "left: lim") return "ArrowLeft: " + log();
key(stack, "Backspace");
await wait(100);
if (log() !== "undo: lim") return "Backspace undoes: " + log();
key(stack, "ArrowLeft");
await wait(280);

// Two quick presses are two cards, not one.
await tap(undo); await tap(undo);
right.click(); right.click();
await wait(300);
if (title() !== "Cape Town") return "two quick presses should take two cards: " + title();

// What differs on a tablet: the choices stand beside the deck.
const side = $(".ui-swipe-deck-side");
if (device === "phone" && getComputedStyle(side).display !== "none") return "a phone has no room for the lists";
if (device === "tablet") {
    if (getComputedStyle(side).display !== "block") return "a tablet shows the lists";
    const kept = [...$(".ui-swipe-deck-kept").children].map((l) => l.textContent).join();
    const passed = [...$(".ui-swipe-deck-passed").children].map((l) => l.textContent).join();
    if (kept !== "Lisbon,Kyoto,Lima") return "kept: " + kept;
    if (passed !== "Oslo") return "passed: " + passed;
    if (side.getBoundingClientRect().left <= stack.getBoundingClientRect().right - 1) return "the lists should stand beside the deck";
}

// The last card, then an empty deck that says so and can still undo.
await tap(right);
await wait(300);
if (top_()) return "no card should be left";
if ($(".ui-swipe-deck-none").textContent !== "No more cards.") return "the empty deck says: " + $(".ui-swipe-deck-none").textContent;
if (!log().endsWith("All done.")) return "on_empty: " + log();
if (right.getAttribute("aria-disabled") !== "true") return "no card to send";
await tap(undo);
if (title() !== "Cape Town") return "undo from the empty deck: " + title();

// A card arriving in front of the held one: what the attribute reads, its place, changes under the finger.
const q2 = middle(stack);
await fingers("touchStart", [q2]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: q2.x + 10 * i, y: q2.y }]); await wait(40); }
await wait(30);
const movedCard = top_();
const heldFront = movedCard.style.transform;
if (heldFront === "") return "the held card did not move, for the arrival";
$("#swipe-deck-front").click();
await wait(80);
if (movedCard.style.transform !== heldFront) return "a card arriving in mid-drag threw the held one home: " + (movedCard.style.transform || "no transform");
await wait(120);
await fingers("touchEnd", []);
await wait(320);
if ($$(".ui-swipe-deck-card").some((c) => c.style.transform !== "")) return "a card was left out of place after the arrival";
if (title() !== "Reykjavik") return "the new card should stand on top: " + title();
await tap(left);
await wait(260);
if (log() !== "left: new") return "the new card, sent on: " + log();
await tap(undo);
if (log() !== "undo: new") return "the new card, undone: " + log();
