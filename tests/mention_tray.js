// mobile
const host = $("#mention-tray-live");
const box = host.querySelector("textarea");
const hidden = host.querySelector("input[type=hidden]");
const note = () => $("#mention-tray-note").textContent;
const tray = () => host.querySelector("[role=listbox]");
const names = () => tray() ? [...tray().querySelectorAll("b")].map((b) => b.textContent) : [];
const marks = () => [...host.querySelectorAll(".ui-mention-tray-name")].map((m) => m.textContent);
const write = async (t) => { await cdp("Input.insertText", { text: t }); await wait(120); };
const press = async (k, code = 0) => {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code: k, windowsVirtualKeyCode: code });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: k, windowsVirtualKeyCode: code });
    await wait(120);
};
const clear = async () => { box.focus(); box.select(); await press("Backspace", 8); };
box.focus(); await wait(80);
if (box.getAttribute("aria-expanded") !== "false") return "it starts open";

// Nothing until the trigger, which must start a word: an address does not count.
await write("write to me");
if (tray()) return "a tray with no trigger";
await write("@x");
if (tray()) return "@ inside a word opened the tray";
await clear();

// Fuzzy, ranked: the start of a name beats the middle of one, and the people with bad data are left out.
await write("Hi @");
if (names().join() !== "Ana Silva,Andrei Pop,Joan Hart,Ben Oduya,Cleo Marsh,Hanna Lee") return "with nothing typed, all in order: " + names().join();
if (box.getAttribute("aria-expanded") !== "true" || box.getAttribute("aria-activedescendant") !== tray().id + "-0") return "the box should point at the first";
await write("an");
// Word starts first, then the middle of a word, shorter first.
if (names().join() !== "Ana Silva,Andrei Pop,Hanna Lee,Joan Hart") return "matches for an: " + names().join();
await write("d");
if (names().join() !== "Andrei Pop") return "matches for and: " + names().join();
await press("Backspace", 8);
await press("Backspace", 8);
await press("Backspace", 8);
await write("hart");
if (names().join() !== "Joan Hart") return "by the last name: " + names().join();
await press("Backspace", 8); await press("Backspace", 8); await press("Backspace", 8); await press("Backspace", 8);
await write("benny");
if (names().join() !== "Ben Oduya") return "by the handle: " + names().join();
await press("Backspace", 8); await press("Backspace", 8); await press("Backspace", 8); await press("Backspace", 8); await press("Backspace", 8);
await write("an");

// The tray is over the line the cursor is on, and on a tablet at the cursor.
{
    const t = tray().getBoundingClientRect(), f = host.querySelector(".ui-mention-tray-mirror").getBoundingClientRect(), c = host.querySelector("[data-caret]").getBoundingClientRect();
    if (Math.abs(t.bottom - (c.top - 2)) > 3) return `the tray should end just over the cursor's line: ${t.bottom} and ${c.top}`;
    if (t.top < frameTop()) return "the tray went off the top of the screen";
    if (device === "phone") {
        if (Math.abs(t.width - host.getBoundingClientRect().width) > 1) return "on a phone the tray is the box's width: " + t.width;
    } else {
        if (Math.abs(t.width - 280) > 1) return "on a tablet the tray is a card: " + t.width;
        const want = Math.round(Math.max(0, Math.min(c.left - f.left - 16, f.width - 280)));
        if (Math.abs((t.left - f.left) - want) > 1) return `the card should be at the cursor: ${t.left - f.left} for ${want}`;
    }
}
function frameTop() { return Math.max(0, visualViewport.offsetTop); }

// Arrows move, Enter takes: the second is Andrei.
await press("ArrowDown", 40);
if (box.getAttribute("aria-activedescendant") !== tray().id + "-1") return "ArrowDown";
if (tray().querySelectorAll("[aria-selected=true]").length !== 1) return "one option should be marked";
await press("ArrowUp", 38); await press("ArrowUp", 38);
if (box.getAttribute("aria-activedescendant") !== tray().id + "-3") return "ArrowUp should wrap to the last";
await press("ArrowDown", 40); await press("ArrowDown", 40);
await press("Enter", 13);
if (box.value !== "Hi @Andrei Pop ") return "Enter should put the name in: " + JSON.stringify(box.value);
if (tray()) return "the tray should close";
if (box.selectionStart !== 15) return "the cursor should end after the name: " + box.selectionStart;
if (marks().join() !== "@Andrei Pop") return "the name should be marked: " + marks().join();
if (hidden.value !== "2" || hidden.name !== "message_mentions") return "the form's field: " + hidden.name + "=" + hidden.value;
if (note() !== "Hi @Andrei Pop  | 2:3-14") return "on_change: " + note();

// The mirror matches the box, letter for letter, where marks are drawn.
if (host.querySelector(".ui-mention-tray-mirror").textContent.replace("\u2060", "") !== box.value) return "the mirror has other text";

// A Backspace takes the space, the next takes the whole name, by what changed.
await press("Backspace", 8);
if (box.value !== "Hi @Andrei Pop") return "first Backspace: " + JSON.stringify(box.value);
await press("Backspace", 8);
if (box.value !== "Hi ") return "a Backspace at a name should take all of it: " + JSON.stringify(box.value);
if (marks().length || hidden.value !== "") return "the entity stayed";
if (box.selectionStart !== 3) return "the cursor after taking it: " + box.selectionStart;

// As Android's keyboards do it: the value changes with no key to see.
await write("@ana");
await tap(tray().querySelector("[role=option]")); await wait(120);
if (box.value !== "Hi @Ana Silva ") return "a tap should put the name in: " + JSON.stringify(box.value);
if (document.activeElement !== box) return "a tap should keep the keyboard up";
await write("and @jo");
await press("Enter", 13);
if (box.value !== "Hi @Ana Silva and @Joan Hart ") return "a second name: " + JSON.stringify(box.value);
if (hidden.value !== "1,3") return "two ids: " + hidden.value;
box.value = "Hi @Ana Silv and @Joan Hart ";
box.selectionStart = box.selectionEnd = 12;
box.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "deleteContentBackward" })); await wait(120);
if (box.value !== "Hi  and @Joan Hart ") return "with no key, a cut name should go whole: " + JSON.stringify(box.value);
if (box.selectionStart !== 3) return "the cursor after a cut: " + box.selectionStart;
if (hidden.value !== "3") return "the first name's id should go: " + hidden.value;
if (marks().join() !== "@Joan Hart") return "the mark of the name left: " + marks().join();
if (!note().endsWith("| 3:8-18")) return "the name left should have moved: " + note();

// A cursor put inside a name goes to its nearer edge, and a selection cut through it takes all of it.
box.setSelectionRange(10, 10); await wait(150);
if (box.selectionStart !== 8) return "a cursor near the start of a name should go there: " + box.selectionStart;
box.setSelectionRange(16, 16); await wait(150);
if (box.selectionStart !== 18) return "a cursor near its end should go there: " + box.selectionStart;
// An arrow key steps over a name, both ways.
box.setSelectionRange(8, 8); await wait(150);
await press("ArrowRight", 39); await wait(100);
if (box.selectionStart !== 18) return "ArrowRight should step over a name: " + box.selectionStart;
await press("ArrowLeft", 37); await wait(100);
if (box.selectionStart !== 8) return "ArrowLeft should step over a name: " + box.selectionStart;
box.setSelectionRange(1, 10); await wait(150);
if (box.selectionEnd !== 18) return "a selection into a name should take it: " + box.selectionEnd;
box.setSelectionRange(box.value.length, box.value.length); await wait(120);

// Editing before a name moves it.
box.setSelectionRange(0, 0); await wait(120);
await write("So. ");
if (!note().endsWith("| 3:12-22")) return "text before a name should move it: " + note();
await clear();
if (hidden.value !== "") return "clearing should clear the names";

// An emoji before the cursor counts two in the box and one in Quillo.
await write("😀 hi @ben");
if (names().join() !== "Ben Oduya") return "after an emoji: " + names().join();
await press("Enter", 13);
if (box.value !== "😀 hi @Ben Oduya ") return "after an emoji the name went wrong: " + JSON.stringify(box.value);
if (!note().endsWith("| 4:5-15")) return "characters, not units: " + note();
await press("Backspace", 8); await press("Backspace", 8);
if (box.value !== "😀 hi ") return "a name after an emoji: " + JSON.stringify(box.value);
await clear();

// Escape shuts the tray for that @; a new one opens it again; leaving the box shuts it.
await write("@a");
await press("Escape", 27);
if (tray()) return "Escape should shut the tray";
await write("n");
if (tray()) return "the same @ should stay shut";
await write(" @c");
if (!tray()) return "a new @ should open it";
box.blur(); await wait(120);
if (tray()) return "leaving the box should shut it";
// Its text changing cursor while it has no focus is nothing to do with a person typing.
box.setSelectionRange(box.value.length, box.value.length); await wait(150);
if (tray()) return "a cursor moved in a box without the focus opened the tray";
box.focus(); await clear();

// Two words are one name; a third word ends it.
await write("@ana s");
if (names().join() !== "Ana Silva") return "a space in a name: " + names().join();
await write("ilva x");
if (tray()) return "a second space ends the mention";
await clear();

// A new line ends it too.
await write("@an\n");
if (tray()) return "a new line ends the mention";
await clear();

// The keyboard: it rides above it, and the tray stays in what can be seen.
const vv = visualViewport, H = innerHeight;
const fake = (height) => {
    Object.defineProperty(vv, "height", { get: () => height, configurable: true });
    Object.defineProperty(vv, "offsetTop", { get: () => 0, configurable: true });
    vv.dispatchEvent(new Event("resize"));
};
const unfake = () => { delete vv.height; delete vv.offsetTop; vv.dispatchEvent(new Event("resize")); };
const shell = host.querySelector(".ui-mention-tray-lifted");
host.scrollIntoView({ block: "end" }); await wait(80);
const bottom = host.getBoundingClientRect().bottom, seen = bottom - 150;
await write("@");
fake(seen); await wait(150);
if (shell.getBoundingClientRect().bottom > seen + 1) return "it should ride above the keyboard";
const tr = tray().getBoundingClientRect();
if (tr.bottom > seen + 1) return "the tray is under the keyboard: " + tr.bottom + " over " + seen;
if (tr.top < 0) return "the tray is off the top: " + tr.top;
// With little room above, it opens under the line and stays in what can be seen.
{
    // Zoomed, so that nothing rises and the line stays where it is measured.
    Object.defineProperty(vv, "scale", { get: () => 2, configurable: true });
    vv.dispatchEvent(new Event("resize")); await wait(150);
    const c = host.querySelector("[data-caret]").getBoundingClientRect();
    const view = c.top - 40;
    Object.defineProperty(vv, "offsetTop", { get: () => view, configurable: true });
    Object.defineProperty(vv, "height", { get: () => 300, configurable: true });
    vv.dispatchEvent(new Event("resize")); await wait(150);
    if (tray().dataset.way !== "down") return "with 32 px above it should open under the line: " + tray().dataset.way;
    delete vv.scale;
}
unfake(); await wait(100);
await clear();
