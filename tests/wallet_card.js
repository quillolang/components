// mobile
const deck = $(".ui-walcard-deck"), faces = () => $$(".ui-walcard-face"), items = () => $$(".ui-walcard-item");
const top = (i) => Math.round(items()[i].getBoundingClientRect().top - deck.getBoundingClientRect().top);
const said = () => $("#wallet-demo-lifted").textContent;
const btn = (t) => $$(".ui-walcard button.ui-btn").find((b) => b.textContent.trim() === t);
if (faces().length !== 4) return "four cards";
if (getComputedStyle(faces()[0]).backgroundColor !== "rgb(39, 50, 75)") return "a card has its colour: " + getComputedStyle(faces()[0]).backgroundColor;
// What the cards say: known answers.
const digits = () => faces().map((f) => f.querySelector(".ui-walcard-digits").textContent);
if (digits().join("|") !== "•••• •••• •••• 4242|•••• •••••• •0005|•••• •••• •••• 4444|•••• 1117") return "masked: " + digits().join("|");
if (faces().map((f) => f.querySelector(".ui-walcard-top span").textContent).join() !== "Everyday,Amex,Mastercard,Discover") return "brands: " + faces().map((f) => f.querySelector(".ui-walcard-top span").textContent).join();
// 09/26 has run out by 2026-11-01; 11/26 runs to the end of November.
const tags = faces().map((f) => f.querySelector(".ui-walcard-tag") ? "x" : "-").join("");
if (tags !== "--x-") return "expired: " + tags;
if (/4242 4242/.test($(".ui-walcard").textContent)) return "no full number shows";
const h = faces()[0].offsetHeight;
const wide = $(".ui-walcard").clientWidth >= 620;
if (!wide) {
    // A stack: each 44 px down the one before.
    if ([0, 1, 2, 3].map(top).join() !== "0,44,88,132") return "stacked: " + [0, 1, 2, 3].map(top).join();
    await tap(faces()[0]); await wait(350);
    // Apart: each a card and 12 px down. The tap does not yet choose.
    const hh = faces()[0].getBoundingClientRect().height;
    if ([0, 1, 2, 3].map(top).join() !== [0, 1, 2, 3].map((i) => Math.round(i * (hh + 12))).join()) return "apart: " + [0, 1, 2, 3].map(top).join();
    if (said() !== "Lifted: none") return "the first tap only pulls apart: " + said();
    if (!btn("Put them away")) return "a button puts them back";
    await tap(btn("Put them away")); await wait(350);
    if (top(1) !== 44) return "back in a stack: " + top(1);
    await tap(faces()[2]); await wait(350);
} else {
    if (!/Choose a card/.test($(".ui-walcard").textContent)) return "a tablet asks for a card";
    if (top(1) <= top(0) + 100) return "a tablet has a column: " + top(1);
}
// Lift the second.
await tap(faces()[1]); await wait(350);
if (said() !== "Lifted: amex") return "lifted: " + said();
if (!items()[1].classList.contains("ui-walcard-chosen")) return "it is the chosen one";
if (faces()[1].getAttribute("aria-expanded") !== "true") return "screen readers hear it";
if (!wide) {
    if (top(1) !== 0) return "the chosen goes to the top: " + top(1);
    if (getComputedStyle(items()[1]).zIndex !== "40") return "above the others";
}
const detail = $(".ui-walcard-detail"), num = () => $("#wallet-demo-number").textContent;
if (num() !== "•••• •••••• •0005") return "the number is hidden: " + num();
if (wide) {
    const a = $(".ui-walcard-deck").getBoundingClientRect(), b = detail.getBoundingClientRect();
    if (b.left < a.right) return "the details stand beside: " + a.right + " " + b.left;
}
// Asked, it shows, in Amex's groups; it goes after hide_after.
await tap(btn("Show number"));
if (num() !== "3782 822463 10005") return "shown in groups: " + num();
if (faces()[1].querySelector(".ui-walcard-digits").textContent !== "3782 822463 10005") return "on the card too";
if (digits()[0] !== "•••• •••• •••• 4242") return "only that one";
if (!/Hides in [23] s/.test(detail.textContent)) return "it counts down: " + detail.textContent;
await wait(3300);
if (num() !== "•••• •••••• •0005") return "it hides by itself: " + num();
// Hide by hand.
await tap(btn("Show number"));
await tap(btn("Hide number"));
if (num() !== "•••• •••••• •0005") return "Hide hides: " + num();
// Leaving the app hides it.
await tap(btn("Show number"));
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange"));
delete document.visibilityState;
await wait(100);
if (num() !== "•••• •••••• •0005") return "leaving hides it: " + num();
// Another card: a reveal does not carry over.
await tap(btn("Show number"));
const others = (t) => $$(".ui-walcard-other").find((b) => b.textContent.trim() === t);
const pick = async (i, t) => { await tap(wide ? faces()[i] : others(t)); await wait(350); };
await pick(2, "Mastercard 4444");
if (said() !== "Lifted: mc") return "another lifted: " + said();
if (num() !== "•••• •••• •••• 4444") return "the next is hidden: " + num();
// This one's answer comes later, as a server fn's would.
await tap(btn("Show number"));
if (num() !== "5555 5555 5555 4444") return "an answer by a Promise shows: " + num();
await tap(btn("Hide number"));
// No answer, a Promise of nothing, says so.
await pick(3, "Discover 1117");
if (num() !== "•••• 1117") return "only four digits: " + num();
await tap(btn("Show number"));
if (!/could not be shown/.test(detail.parentElement.textContent)) return "a refusal says so";
if (num() !== "•••• 1117") return "and shows nothing";
// Rotation keeps the card.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(350);
if (said() !== "Lifted: server" || !$(".ui-walcard-detail")) return "turned, it keeps";
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(350);
// The keys: Escape goes back a step, and a tap on the lifted one too.
faces()[3].focus();
key(faces()[3], "Escape"); await wait(350);
if (said() !== "Lifted: none") return "Escape puts it back: " + said();
if ($(".ui-walcard-detail")) return "details go";
if (!wide) {
    key(faces()[0], "Escape"); await wait(350);
    if (top(1) !== 44) return "Escape stacks: " + top(1);
    await tap(faces()[0]); await wait(350);
}
await tap(faces()[0]); await wait(350);
if (said() !== "Lifted: visa") return "lifted again: " + said();
await tap(faces()[0]); await wait(350);
if (said() !== "Lifted: none") return "a tap on the lifted one lowers it: " + said();
