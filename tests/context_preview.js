// mobile
const [one, two] = $$(".ui-context-preview");
const target = one.querySelector(".ui-context-preview-target");
const dlg = one.querySelector("dialog");
const rows = () => [...dlg.querySelectorAll(".ui-context-preview-row")];
const did = () => $(".context-preview-demo-did").textContent;
const closes = () => +$(".context-preview-demo-closes").textContent;
const settle = () => wait(260);
const p = middle(target);
if (dlg.open) return "it starts open";
// The app's own haptics, stood in for.
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); } };

// A press shorter than the hold is nothing.
await fingers("touchStart", [p]);
await wait(150);
if (!target.classList.contains("ui-context-preview-pressing")) return "a press does not show";
await fingers("touchEnd", []); await wait(500);
if (dlg.open) return "a short press opened it";
if (target.classList.contains("ui-context-preview-pressing")) return "the press stayed after the finger left";

// A finger that moves is the page's.
await fingers("touchStart", [p]);
await wait(60);
await fingers("touchMove", [{ x: p.x + 2, y: p.y + 14 }]);
await fingers("touchMove", [{ x: p.x + 2, y: p.y + 26 }]);
await wait(600);
if (dlg.open) return "a finger that moved still opened it";
await fingers("touchEnd", []); await wait(120);
// Nor does the system taking the finger leave it going.
await fingers("touchStart", [p]);
await wait(60);
await fingers("touchCancel", []);
await wait(600);
if (dlg.open) return "a cancelled press opened it";

// Held: it opens under the finger, with the preview and actions, and the page blurred.
await fingers("touchStart", [p]);
await wait(620);
if (!dlg.open) return "a long press did not open it";
await wait(380);    // The lift is still flying the card into place.
const card = dlg.querySelector(".ui-context-preview-card");
if (!card.textContent.includes("Hotel in Alfama")) return "the card does not show the preview";
if (!card.querySelector("h2") || card.querySelector("h2").textContent !== "Lisbon, 4 nights") return "the card has no title";
if (rows().length !== 4) return `${rows().length} actions`;
if (!rows()[3].classList.contains("ui-context-preview-danger")) return "no destructive style";
if (!getComputedStyle(dlg, "::backdrop").backdropFilter.includes("blur")) return "the page behind is not blurred";
const c = card.getBoundingClientRect(), a = dlg.querySelector(".ui-context-preview-actions").getBoundingClientRect();
if (device === "phone" && !(a.top >= c.bottom)) return `on a phone the actions are not under the card: ${a.top}, ${c.bottom}`;
if (device === "tablet" && !(a.left >= c.right && Math.abs(a.top - c.top) < 2)) return `on a tablet the actions are not beside the card: ${a.left}, ${c.right}`;
if (c.left < 0 || c.right > innerWidth) return "the card leaves the screen";
// Let go, and it closes.
await fingers("touchEnd", []); await settle();
if (dlg.open) return "letting go did not close it";
if (did() !== "nothing yet") return "letting go picked something";
if (closes() !== 1) return `on_close ran ${closes()} times`;

// Held, slid to an action: it lights, and letting go does it.
await fingers("touchStart", [p]);
await wait(620);
if (!dlg.open) return "it did not open the second time";
let r = rows()[1].getBoundingClientRect();
await fingers("touchMove", [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }]);
await wait(120);
if (!rows()[1].classList.contains("ui-context-preview-over")) return "the action under the finger does not light";
if (felt.join() !== "medium,medium,selection") return `the phone felt ${felt}`;
delete window.quilloNative;
// Slid on to a disabled one: nothing lights.
r = rows()[2].getBoundingClientRect();
await fingers("touchMove", [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }]);
await wait(120);
if ($$(".ui-context-preview-over").length) return "a disabled action lights";
// Slid to the destructive one.
r = rows()[3].getBoundingClientRect();
await fingers("touchMove", [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }]);
await wait(120);
await fingers("touchEnd", []); await settle();
if (dlg.open) return "letting go on an action did not close it";
if (did() !== "delete") return `sliding to an action gave ${did()}`;

// Held, slid to an action and back off it: letting go does nothing.
await fingers("touchStart", [p]);
await wait(620);
r = rows()[0].getBoundingClientRect();
await fingers("touchMove", [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }]);
await wait(100);
await fingers("touchMove", [{ x: 4, y: 4 }]);
await wait(100);
await fingers("touchEnd", []); await settle();
if (dlg.open || did() !== "delete") return "sliding off an action still did it";
// The system taking the gesture closes it.
await fingers("touchStart", [p]);
await wait(620);
if (!dlg.open) return "it did not open";
await fingers("touchCancel", []); await settle();
if (dlg.open) return "a cancelled hold left it open";

// The equal: More, by a tap. It stays, and an action is tapped.
const more = one.querySelector(".ui-context-preview-more");
await tap(more); await settle();
if (!dlg.open) return "More does not open it";
await tap(rows()[0]); await settle();
if (dlg.open) return "a tapped action did not close it";
if (did() !== "open") return `a tapped action gave ${did()}`;
// Tap away.
await tap(more); await settle();
await fingers("touchStart", [{ x: 6, y: 6 }]); await fingers("touchEnd", []); await settle();
if (dlg.open) return "a tap away does not close it";
// A tap on the card does not.
await tap(more); await settle();
await tap(dlg.querySelector(".ui-context-preview-card")); await settle();
if (!dlg.open) return "a tap on the card closed it";
// The back gesture.
const nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (dlg.open) return "the back gesture does not close it";
// Keys.
key(target, "Enter"); await settle();
if (!dlg.open) return "Enter does not open it";
dlg.close(); await settle();
key(target, " "); await settle();
if (!dlg.open) return "Space does not open it";
dlg.close(); await settle();
key(target, "ContextMenu"); await settle();
if (!dlg.open) return "the Menu key does not open it";
dlg.close(); await settle();
// A right click.
target.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true })); await settle();
if (!dlg.open) return "a right click does not open it";
dlg.close(); await settle();

// stay: letting go leaves it open; the preview is its own children, shown again.
const target2 = two.querySelector(".ui-context-preview-target"), dlg2 = two.querySelector("dialog");
const q = middle(target2);
await fingers("touchStart", [q]);
await wait(620);
if (!dlg2.open) return "the second did not open";
if (!dlg2.textContent.includes("Trip to Oslo")) return "with no preview, the card does not show the children";
await fingers("touchEnd", []); await settle();
if (!dlg2.open) return "stay did not stay";
await tap(dlg2.querySelectorAll(".ui-context-preview-row")[1]); await settle();
if (dlg2.open || did() !== "Share Oslo") return `stay's action gave ${did()}`;

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(target).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
