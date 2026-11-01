// mobile
const [dlg, many, sizes] = $$("dialog.ui-fullscreen-picker");
const trig = $$("button.ui-btn").find((b) => b.textContent.startsWith("Fly to"));
const input = dlg.querySelector("input[type=search]");
const list = dlg.querySelector("[role=listbox]");
const rows = (d = dlg) => [...d.querySelectorAll("[role=option]")];
const words = (d = dlg) => rows(d).map((r) => r.querySelector(".ui-fullscreen-picker-label").firstChild.textContent);
const search = async (t) => { type(input, t); await wait(90); };
const settle = () => wait(380);
const buttons = (d = dlg) => d.querySelectorAll(".ui-fullscreen-picker-word");
const city = () => $(".fullscreen-picker-demo-city").textContent;
const stops = () => $(".fullscreen-picker-demo-stops").textContent;
const cancelled = () => +$(".fullscreen-picker-demo-cancelled").textContent;
const start = history.state;
if (trig.textContent !== "Fly to: Lisbon") return `the trigger says ${trig.textContent}`;

await tap(trig); await settle();
if (!dlg.open) return "the trigger does not open it";
const box = dlg.getBoundingClientRect();
if (device === "phone") {
    if (box.left !== 0 || box.top !== 0 || box.width !== innerWidth || box.height !== innerHeight) return `not full screen: ${JSON.stringify(box)}`;
} else {
    if (box.width !== 560 || Math.abs(box.left - (innerWidth - 560) / 2) > 1) return `not a card on a tablet: ${JSON.stringify(box)}`;
}
if (document.activeElement === input) return "on a touch screen the keyboard came up unasked";
if (rows().length !== 36) return `${rows().length} rows`;
if (rows().find((r) => r.getAttribute("aria-selected") === "true").textContent.indexOf("Lisbon") < 0) return "the value given is not ticked";

// Search: accents, case, the order, several words, hints.
await search("zur");
if (words().join() !== "Zürich") return `"zur" gives ${words()}`;
await search("KRAKOW");
if (words().join() !== "Kraków") return `"KRAKOW" gives ${words()}`;
await search("sao");
if (words().join() !== "São Paulo") return `"sao" gives ${words()}`;
// A word starting with it, then the rest in their order, hints counting: "or".
await search("or");
if (words().join() !== "New Orleans,Bordeaux,Córdoba,Lisbon,Marrakesh,New York,Oslo,Porto,Quito,Seoul,Toronto") return `"or" gives ${words()}`;
// A name starting with it comes first of all.
await search("po");
if (words().join() !== "Porto,Gdańsk,Kraków,Lisbon") return `"po" gives ${words()}`;
await search("new o");
if (words().join() !== "New Orleans,New York,Wellington") return `"new o" gives ${words()}`;
await search("france");
if (words().join() !== "Bordeaux,Lyon,Paris") return `a hint is not searched: ${words()}`;
await search("portugal por");
if (words().join() !== "Lisbon,Porto") return `two words give ${words()}`;
await search("qqq");
if (rows().length || !dlg.querySelector(".ui-fullscreen-picker-note")) return "no match says nothing";
if (dlg.querySelector(".ui-fullscreen-picker-note").textContent !== "Nothing matches") return "the empty words are wrong";
await search("<b>(.*");
if (rows().length) return "a pattern matched";
await search("   ");
if (rows().length !== 36) return "spaces hide the list";

// The keys, from the box: down, skip disabled, stop at the ends.
await search("wellington");
key(input, "ArrowDown"); await wait(60);
if (input.getAttribute("aria-activedescendant")) return "a disabled row was stepped on";
key(input, "Enter"); await wait(60);
if (rows()[0].getAttribute("aria-selected") === "true") return "Enter chose a disabled row";
await search("po");
key(input, "ArrowDown"); await wait(60);
if (input.getAttribute("aria-activedescendant") !== rows()[0].id) return "ArrowDown does not reach the first";
if (!rows()[0].classList.contains("ui-fullscreen-picker-active")) return "the active row does not show";
key(input, "ArrowUp"); await wait(60);
if (input.getAttribute("aria-activedescendant") !== rows()[0].id) return "ArrowUp went off the top";
key(input, "Enter"); await wait(60);
if (rows()[0].getAttribute("aria-selected") !== "true") return "Enter does not choose";

// Cancel puts it back.
await tap(buttons()[0]); await settle();
if (dlg.open) return "Cancel does not close it";
if (cancelled() !== 1) return "on_cancel was not called";
if (city() !== "none") return "Cancel gave a choice";
if (history.state !== start) return "closing left a history entry";
if (trig.textContent !== "Fly to: Lisbon") return "Cancel changed the choice";
await tap(trig); await settle();
if (input.value !== "") return "the search box kept its words";
if (rows().length !== 36) return "the list did not come back whole";
if (rows().find((r) => r.getAttribute("aria-selected") === "true").textContent.indexOf("Lisbon") < 0) return "Cancel lost the first choice";

// A tap and Done give it back.
await search("tok");
await tap(rows()[0]); await wait(120);
if (rows()[0].getAttribute("aria-selected") !== "true") return "a tap does not tick it";
if (!dlg.open) return "a tap closed it before Done";
await tap(buttons()[1]); await settle();
if (dlg.open) return "Done does not close it";
if (city() !== "HND") return `Done gave ${city()}`;
if (trig.textContent !== "Fly to: Tokyo") return `the trigger says ${trig.textContent}`;

// The keyboard: the list ends where it starts, and dragging the list puts it away.
const fake = new EventTarget();
Object.assign(fake, { height: innerHeight, offsetTop: 0, scale: 1 });
Object.defineProperty(window, "visualViewport", { configurable: true, value: fake });
await tap(trig); await settle();
input.focus();
fake.height = innerHeight - 336; fake.offsetTop = device === "phone" ? 40 : 0; fake.dispatchEvent(new Event("resize")); await settle();
const top = innerHeight - 336 + fake.offsetTop;
const lower = list.getBoundingClientRect().bottom;
if (lower > top + 1) return `the list goes under the keyboard: ${lower} of ${top}`;
if (device === "phone" && dlg.getBoundingClientRect().top !== 40) return `the page's shift was not followed: ${dlg.getBoundingClientRect().top}`;
list.scrollTop = 1e6; await wait(60);
if (rows().pop().getBoundingClientRect().bottom > top + 1) return "the last row cannot be reached above the keyboard";
list.scrollTop = 0; await wait(60);
await drag(rows()[3], 0, -60, 300); await wait(200);
if (document.activeElement === input) return "dragging the list did not put the keyboard away";
fake.height = innerHeight; fake.offsetTop = 0; fake.dispatchEvent(new Event("resize")); await settle();
if (lower > 0 && device === "phone" && dlg.getBoundingClientRect().height !== innerHeight) return "it did not grow back";
await tap(buttons()[0]); await settle();
delete window.visualViewport;

// Many.
const manyTrig = $$("button.ui-btn").find((b) => b.textContent.startsWith("Stop over"));
if (manyTrig.textContent !== "Stop over: Oslo") return `it says ${manyTrig.textContent}`;
await tap(manyTrig); await settle();
await tap(rows(many)[0]); await wait(80);
await tap(rows(many)[1]); await wait(80);
await tap(rows(many)[0]); await wait(80);
if (many.getAttribute("aria-multiselectable") === "true" || many.querySelector("[role=listbox]").getAttribute("aria-multiselectable") !== "true") return "not marked as many";
if (rows(many).filter((r) => r.getAttribute("aria-selected") === "true").length !== 2) return "many does not toggle";
await tap(buttons(many)[1]); await settle();
if (stops() !== "BOG,OSL") return `many gave ${stops()}`;
if (manyTrig.textContent !== "Stop over: 2 chosen") return `it says ${manyTrig.textContent}`;

// From state, plain text, a limit.
const fromState = $$("button.ui-btn").find((b) => b.textContent === "From state");
await tap(fromState); await settle();
if (!sizes.open) return "open={state} does not open it";
if (rows(sizes).length !== 2) return `limit gave ${rows(sizes).length} rows`;
if (sizes.querySelector(".ui-fullscreen-picker-note").textContent !== "Showing 2 of 3. Keep typing to narrow it down.") return "the limit is not said";
// The back gesture cancels.
const nav = await cdp("Page.getNavigationHistory");
await cdp("Page.navigateToHistoryEntry", { entryId: nav.entries[nav.currentIndex - 1].id });
await settle();
if (sizes.open) return "the back gesture does not close it";

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(dlg).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
