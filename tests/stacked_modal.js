// mobile
const [a, b, c, stiff] = $$("dialog.ui-stacked-modal");
const page = $(".ui-stacked-modal-page");
const by = (d, words) => [...d.querySelectorAll("button.ui-btn")].find((x) => x.textContent === words);
const newEvent = $$("button.ui-btn").find((x) => x.textContent === "New event");
const closes = () => +$(".stacked-modal-demo-closes").textContent;
const settle = () => wait(440);
const scaleOf = (el) => new DOMMatrix(getComputedStyle(el).transform === "none" ? "" : getComputedStyle(el).transform).a;
const near = (x, y, d = 0.006) => Math.abs(x - y) <= d;
const start = history.state;
const tall = () => innerHeight;
if (a.open) return "it starts open";
if (getComputedStyle(page).transform !== "none") return "the page starts scaled";

// One card: the page goes back; two: the first shrinks; three: both do.
await tap(newEvent); await settle();
if (!a.open) return "open={state} does not open it";
if (a.getAttribute("aria-label") !== "New event") return "it is not named by its title";
if (!near(scaleOf(a), 1)) return `the top card is scaled: ${scaleOf(a)}`;
if (!near(scaleOf(page), 0.94)) return `behind one card the page stands at ${scaleOf(page)}, not .94`;
const rest = a.getBoundingClientRect();
if (device === "phone" && !(Math.abs(rest.bottom - innerHeight) < 2 && rest.top >= 40 && rest.width === innerWidth)) return `a phone's card: ${JSON.stringify(rest)}`;
if (device === "tablet" && (rest.width !== 600 || Math.abs(rest.left - (innerWidth - 600) / 2) > 1)) return `a tablet's card: ${JSON.stringify(rest)}`;
await tap(by(a, "Repeat")); await settle();
if (!b.open) return "the second does not open over the first";
if (!near(scaleOf(a), 0.95)) return `one down, the card is ${scaleOf(a)}, not .95`;
if (!near(scaleOf(b), 1)) return "the new top card is scaled";
if (!near(scaleOf(page), 0.89)) return `behind two cards the page stands at ${scaleOf(page)}, not .89`;
if (!(a.getBoundingClientRect().top < b.getBoundingClientRect().top)) return "the card below does not peek out above the top one";
await tap(by(b, "Custom")); await settle();
if (!c.open) return "the third does not open";
if (!near(scaleOf(a), 0.9) || !near(scaleOf(b), 0.95)) return `two down ${scaleOf(a)}, one down ${scaleOf(b)}`;
if (!near(scaleOf(page), 0.84)) return `behind three the page stands at ${scaleOf(page)}, not .84`;
if (history.state?.quillo_layer !== 3) return `the history says ${history.state?.quillo_layer} layers`;
if (document.elementFromPoint(innerWidth / 2, innerHeight - 40).closest("dialog") !== c) return "the third is not on top";

// Dragged down, one at a time: what is below comes forward with the finger.
const head = c.querySelector(".ui-stacked-modal-head h2");
const top3 = c.getBoundingClientRect().top;
let p = middle(head);
await fingers("touchStart", [p]);
const half = c.offsetHeight / 2;
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + half * .5 * i / 10 }]); await wait(16); }
await wait(40);
if (!near(c.getBoundingClientRect().top - top3, half * .5, 3)) return `the top card does not follow the finger: ${c.getBoundingClientRect().top - top3}`;
if (!near(scaleOf(b), 0.9625)) return `a quarter away, the next stands at ${scaleOf(b)}, not .9625`;
if (!near(scaleOf(page), 0.8525)) return `a quarter away, the page stands at ${scaleOf(page)}, not .8525`;
await wait(130);
// Short: it springs back, and so do those behind.
await fingers("touchEnd", []); await settle();
if (!c.open) return "a short drag closed it";
if (!near(c.getBoundingClientRect().top, top3, 1)) return "a short drag did not spring back";
if (!near(scaleOf(b), 0.95) || !near(scaleOf(page), 0.84)) return `after springing back ${scaleOf(b)}, ${scaleOf(page)}`;
// The list inside: at its top a drag down moves the card; scrolled, it scrolls; up, it scrolls.
const list = c.querySelector(".ui-stacked-modal-body");
const row = () => list.querySelectorAll("li")[3];
await drag(row(), 0, -150, 500); await settle();
if (list.scrollTop < 80) return `a drag up did not scroll the card's list: ${list.scrollTop}`;
if (!near(c.getBoundingClientRect().top, top3, 1)) return "a drag up moved the card";
await drag(list.querySelectorAll("li")[6], 0, 40, 400); await settle();
if (!c.open || !near(c.getBoundingClientRect().top, top3, 1)) return "a scrolled list gave a drag to the card";
list.scrollTop = 0; await wait(80);
// A cancelled drag stands everything back.
p = middle(head);
await fingers("touchStart", [p]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 20 * i }]); await wait(16); }
await fingers("touchCancel", []); await settle();
if (!c.open || !near(scaleOf(b), 0.95)) return "a cancelled drag did not stand things back";
// A flick takes the top one off, and only that.
p = middle(row());
await fingers("touchStart", [p]);
await fingers("touchMove", [{ x: p.x, y: p.y + 8 }]);
await fingers("touchMove", [{ x: p.x, y: p.y + 80 }]);
await fingers("touchEnd", []); await settle();
if (c.open) return "a flick does not close the top card";
if (!a.open || !b.open) return "a flick closed more than one";
if (!near(scaleOf(b), 1) || !near(scaleOf(a), 0.95) || !near(scaleOf(page), 0.89)) return `after one went: ${scaleOf(b)}, ${scaleOf(a)}, ${scaleOf(page)}`;
if (closes() !== 1) return `on_close ran ${closes()} times`;
if (history.state?.quillo_layer !== 2) return `the history did not fall to 2: ${history.state?.quillo_layer}`;

// The back gesture: one at a time.
let nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (b.open) return "the back gesture does not close the top card";
if (!a.open) return "the back gesture closed the one below too";
if (!near(scaleOf(a), 1) || !near(scaleOf(page), 0.94)) return "the one below did not come forward";
// They open again, in order.
await tap(by(a, "Repeat")); await settle();
if (!b.open || !near(scaleOf(a), 0.95)) return "the second does not open again";
// Escape's route: its Close button; focus goes back to what opened it.
await tap(b.querySelector(".ui-stacked-modal-close")); await settle();
if (b.open || !a.open) return "Close does not close just the top card";
if (document.activeElement !== by(a, "Repeat") && device !== "tablet" && document.activeElement?.closest?.("dialog") !== a) return "focus did not come back to the card below";
// A long slow drag.
const tall2 = a.offsetHeight;
p = middle(a.querySelector(".ui-stacked-modal-head h2"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 12; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + tall2 * .45 * i / 12 }]); await wait(16); }
await wait(130);
await fingers("touchEnd", []); await settle();
if (a.open) return "a long drag does not close it";
if (getComputedStyle(page).transform !== "none") return "the page did not come back";
if (page.style.transformOrigin !== "") return "the page kept its origin";
if (history.state !== start) return `the history did not come back: ${JSON.stringify(history.state)}`;

// One that cannot be dragged away: it resists, and a tap above leaves it.
const must = $$("button.ui-btn").find((x) => x.textContent === "Must answer");
await tap(must); await settle();
if (!stiff.open) return "the trigger does not open it";
if (!near(scaleOf(page), 0.94)) return "the trigger's card does not scale the page";
const t4 = stiff.getBoundingClientRect().top;
p = middle(stiff.querySelector(".ui-stacked-modal-head h2"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
await wait(30);
const sank = stiff.getBoundingClientRect().top - t4;
if (Math.abs(sank - 28.46) > 0.6) return `pulled 100 it sank ${sank}, not 28.46`;
await fingers("touchEnd", []); await settle();
if (!stiff.open) return "a drag closed one that cannot be";
await fingers("touchStart", [{ x: 8, y: 8 }]); await fingers("touchEnd", []); await settle();
if (!stiff.open) return "a tap above closed one that cannot be";
await tap(stiff.querySelector(".ui-stacked-modal-close")); await settle();
if (stiff.open) return "its Close button does not close it";
if (getComputedStyle(page).transform !== "none") return "the page did not come back";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(a).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
