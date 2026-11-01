// mobile
await wait(300);
const box = $("#note-editor-screen .ui-note-editor");
const ta = box.querySelector(".ui-note-editor-input");
const draw = box.querySelector(".ui-note-editor-draw");
const tool = (l) => box.querySelector(`.ui-note-editor-tool[aria-label="${l}"]`);
const line = (i) => box.querySelector(`.ui-note-editor-line[data-line="${i}"]`);
const saves = () => Number($("#note-editor-saves").textContent);
const last = () => $("#note-editor-last").textContent;
const status = () => box.querySelector(".ui-note-editor-status span").textContent;
const enter = async () => {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await wait(40);
};
const write = async (t) => { await cdp("Input.insertText", { text: t }); await wait(40); };
const reset = async (t) => { ta.focus(); ta.select(); await write(t); ta.setSelectionRange(t.length, t.length); await wait(30); };
const caret = () => ta.selectionStart;

if (getComputedStyle(ta).fontSize !== "16px") return "under 16 px iOS zooms in on focus";

// The drawn copy: each line's kind, and the text the same in both.
const kinds = [...draw.querySelectorAll(".ui-note-editor-line")].map((l) => l.dataset.kind).join(" ");
if (kinds !== "h1 plain plain plain h2 done check bullet plain quote") return "kinds: " + kinds;
if (ta.value.split("\n").length !== draw.querySelectorAll(".ui-note-editor-line").length) return "lines differ";
if (line(0).textContent.trim() !== "# Lisbon") return "line 0: " + line(0).textContent;
if (line(2).querySelector(".ui-note-editor-strong").textContent !== "**light**") return "strong: " + line(2).innerHTML;
if (line(2).querySelector(".ui-note-editor-code").textContent !== "`cash`") return "code";
if (getComputedStyle(ta).webkitTextFillColor !== "rgba(0, 0, 0, 0)") return "the box's own text should be clear";
const same = ["fontFamily", "fontSize", "lineHeight", "letterSpacing", "whiteSpace", "overflowWrap", "paddingLeft"].filter((k) => getComputedStyle(ta)[k] !== getComputedStyle(draw)[k]);
if (same.length) return "the two copies differ in " + same;
if (getComputedStyle(draw).pointerEvents !== "none") return "taps go through to the box";

// The box grows with its text and never scrolls by itself, so the two cannot part.
if (ta.scrollHeight > ta.clientHeight + 1) return "the box scrolls by itself: " + ta.scrollHeight + " " + ta.clientHeight;
if (Math.abs(ta.offsetHeight - draw.offsetHeight) > 1) return "the two are not as tall: " + ta.offsetHeight + " " + draw.offsetHeight;
const h0 = ta.offsetHeight;
ta.focus();
ta.setSelectionRange(ta.value.length, ta.value.length);
await write("\nA long line that has to wrap round on a phone, as words do, and then a good many more of them so that it wraps on a tablet too, over and over, until the edge of the box has been passed by a long way and comes round once more.");
if (ta.offsetHeight <= h0 || Math.abs(ta.offsetHeight - draw.offsetHeight) > 1) return "growing: " + ta.offsetHeight + " " + draw.offsetHeight;
if (ta.scrollHeight > ta.clientHeight + 1) return "a long line scrolled the box";
await tool("Undo").click();
await wait(60);

// Ticking a box, with a real tap on a real checkbox; it does not take the keyboard up or down.
const items = () => [...draw.querySelectorAll('input[type="checkbox"]')];
if (items().map((i) => i.checked).join() !== "true,false") return "boxes: " + items().map((i) => i.checked);
const tick = items()[1].closest("label");
const tr = tick.getBoundingClientRect();
if (tr.width < 44 || tr.height < 44) return "the box is too small to tap: " + tr.width;
await reset(ta.value);
await tap(items()[1]);
await wait(60);
if (!ta.value.includes("- [x] Find a room near the river")) return "a tick should change the text: " + ta.value;
if (line(6).dataset.kind !== "done") return "the line should be done: " + line(6).dataset.kind;
await tap(items()[0]);
await wait(60);
if (!ta.value.includes("- [ ] Book the flight")) return "untick: " + ta.value;

// Autosave: a moment after the typing, once, with the title.
await wait(450);
const n0 = saves();
if (last() !== "Trip|" + ta.value) return "the save: " + last().slice(0, 60);
if (!/^Saved \d+:\d\d$/.test(status())) return "status: " + status();
ta.focus();
await write("x");
if (status() !== "Not saved yet") return "waiting: " + status();
await wait(60);
await write("y");
await wait(60);
await write("z");
if (saves() !== n0) return "it should wait for a stop in the typing: " + saves();
await wait(450);
if (saves() !== n0 + 1) return "one save after the stop: " + saves() + " from " + n0;
if (!last().endsWith("xyz")) return "what was saved: " + last().slice(-20);

// A failed save says so, and offers another; the next edit saves too.
$("#note-editor-refuse").click();
await wait(40);
await write("!");
await wait(450);
if (status() !== "Not saved.") return "failed: " + status();
const retry = box.querySelector(".ui-note-editor-retry");
if (!retry || retry.textContent !== "Try again") return "no retry";
$("#note-editor-refuse").click();
await wait(40);
await tap(retry);
await wait(100);
if (!status().startsWith("Saved") || box.querySelector(".ui-note-editor-retry")) return "the retry: " + status();

// Leaving the screen saves at once, with no wait.
ta.focus();
const n1 = saves();
await write("q");
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
document.dispatchEvent(new Event("visibilitychange"));
await wait(30);
delete document.visibilityState;
if (saves() !== n1 + 1 || !last().endsWith("q")) return "hidden should save at once: " + saves();

// The title counts too.
const title = box.querySelector(".ui-note-editor-title");
type(title, "Porto");
await wait(450);
if (!last().startsWith("Porto|")) return "the title: " + last().slice(0, 12);
ta.focus();

// Enter carries a list on, numbers count, an empty item ends it.
await reset("- [ ] one");
await enter();
if (ta.value !== "- [ ] one\n- [ ] ") return "a box goes on: " + JSON.stringify(ta.value);
if (caret() !== ta.value.length) return "the caret after it: " + caret();
await write("two");
await enter();
await enter();
if (ta.value !== "- [ ] one\n- [ ] two\n") return "an empty item ends it: " + JSON.stringify(ta.value);
await reset("- [x] done one");
await enter();
if (ta.value !== "- [x] done one\n- [ ] ") return "after a ticked one, an empty box: " + JSON.stringify(ta.value);
await reset("- a");
await enter();
if (ta.value !== "- a\n- ") return "a bullet: " + JSON.stringify(ta.value);
await reset("  * a");
await enter();
if (ta.value !== "  * a\n  * ") return "indent and mark keep: " + JSON.stringify(ta.value);
await reset("9. a");
await enter();
if (ta.value !== "9. a\n10. ") return "numbers: " + JSON.stringify(ta.value);
await reset("plain");
await enter();
if (ta.value !== "plain\n") return "plain: " + JSON.stringify(ta.value);
// In the middle of a list, with an emoji before: the caret counts right.
await reset("😀\n- 😀😀 a\nend");
const mid = "😀\n- 😀😀 a".length;
ta.setSelectionRange(mid, mid);
await enter();
if (ta.value !== "😀\n- 😀😀 a\n- \nend") return "emoji list: " + JSON.stringify(ta.value);
if (caret() !== mid + 3) return "emoji caret: " + caret() + " not " + (mid + 3);

// Shortcuts at a line's start, and only there.
await reset("");
await write("[");
await write("]");
await write(" ");
if (ta.value !== "- [ ] ") return "[] : " + JSON.stringify(ta.value);
await reset("*");
await write(" ");
if (ta.value !== "- ") return "* : " + JSON.stringify(ta.value);
await reset("[x]");
await write(" ");
if (ta.value !== "- [x] ") return "[x] : " + JSON.stringify(ta.value);
await reset("see []");
await write(" ");
if (ta.value !== "see [] ") return "mid-line: " + JSON.stringify(ta.value);

// The toolbar: focus stays in the box, the selection is worked on.
const press = async (l) => { await tap(tool(l)); await wait(50); };
await reset("hello world");
ta.setSelectionRange(6, 11);
await press("Bold");
if (ta.value !== "hello **world**") return "Bold: " + ta.value;
if (document.activeElement !== ta) return "the toolbar should leave focus in the box";
if (ta.selectionStart !== 8 || ta.selectionEnd !== 13) return "the selection stays on the word: " + ta.selectionStart;
await press("Bold");
if (ta.value !== "hello world") return "Bold again takes it off: " + ta.value;
await reset("ab");
await press("Italic");
if (ta.value !== "ab**" || caret() !== 3) return "a pair to type in: " + ta.value + " " + caret();
await reset("two lines\nof text");
ta.setSelectionRange(0, ta.value.length);
await press("Checklist");
if (ta.value !== "- [ ] two lines\n- [ ] of text") return "Checklist: " + ta.value;
await press("Checklist");
if (ta.value !== "two lines\nof text") return "Checklist off: " + ta.value;
await press("List");
if (ta.value !== "- two lines\n- of text") return "List: " + ta.value;
await press("Indent");
if (ta.value !== "  - two lines\n  - of text") return "Indent: " + ta.value;
await reset("A title");
await press("Heading");
if (ta.value !== "# A title") return "H1: " + ta.value;
await press("Heading");
await press("Heading");
if (ta.value !== "### A title") return "H3: " + ta.value;
await press("Heading");
if (ta.value !== "A title") return "off: " + ta.value;

// Undo and redo, in steps of words.
await reset("start");
await wait(1100);
await write(" more");
await press("Undo");
if (ta.value !== "start") return "Undo: " + ta.value;
await press("Redo");
if (ta.value !== "start more") return "Redo: " + ta.value;
if (tool("Redo").disabled !== true) return "nothing left to redo";

// The keys.
const held = (k, mods = {}) => ta.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...mods }));
await reset("word");
ta.setSelectionRange(0, 4);
held("b", { ctrlKey: true });
await wait(50);
if (ta.value !== "**word**") return "Ctrl+B: " + ta.value;
held("z", { metaKey: true });
await wait(50);
if (ta.value !== "word") return "Cmd+Z: " + ta.value;
held("z", { ctrlKey: true, shiftKey: true });
await wait(50);
if (ta.value !== "**word**") return "Ctrl+Shift+Z: " + ta.value;
await reset("- a");
held("Tab");
await wait(50);
if (ta.value !== "  - a") return "Tab: " + ta.value;
held("Tab", { shiftKey: true });
await wait(50);
if (ta.value !== "- a") return "Shift+Tab: " + ta.value;

// A hundred undo steps are kept, and no more.
await reset("word");
await wait(1100);
ta.setSelectionRange(0, 4);
for (let i = 0; i < 105; i++) held("b", { ctrlKey: true });
await wait(100);
let steps = 0;
for (; steps < 130 && !tool("Undo").disabled; steps++) { held("z", { ctrlKey: true }); await wait(4); }
if (steps !== 100) return "undo steps kept: " + steps;

// The keyboard: what iOS reports. The toolbar rides on top of it, and comes down with it.
const bar = box.querySelector(".ui-note-editor-bar");
const vv = visualViewport, realH = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => realH - 320 });
vv.dispatchEvent(new Event("resize"));
await wait(50);
if (getComputedStyle(bar).position !== "fixed") return "the toolbar should ride the keyboard: " + getComputedStyle(bar).position;
const gap = $("#note-editor-screen").getBoundingClientRect().bottom - bar.getBoundingClientRect().bottom;
if (Math.abs(gap - 320) > 2) return "above a keyboard of 320: " + gap;
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(50);
if (box.dataset.up !== "") return "it should come back down";

// Done puts the keyboard away, and always shows: tap() would scroll to it, so its place is measured first.
ta.focus();
const tools = box.querySelector(".ui-note-editor-tools");
tools.scrollLeft = 0;
await wait(30);
const dn = tool("Done").getBoundingClientRect(), tr2 = tools.getBoundingClientRect();
if (dn.right > innerWidth || dn.left < tr2.right - 1) return "Done should stand clear of the tools, on screen: " + dn.left + " " + dn.right + " " + tr2.right;
tools.scrollLeft = 1e4;
await wait(30);
if (Math.abs(tool("Done").getBoundingClientRect().left - dn.left) > 0.5) return "Done should not scroll with the tools";
if (tool("Redo").getBoundingClientRect().right > tr2.right + 0.5) return "every tool should scroll into reach";
tools.scrollLeft = 0;
await tap(tool("Done"));
if (document.activeElement === ta) return "Done should blur the box";

const side = box.querySelector(".ui-note-editor-side");
if (device === "tablet") {
    await reset("# One\n\n## Two\n- [x] a\n- [ ] b\nthree words here");
    await wait(60);
    if (getComputedStyle(side).display !== "block") return "a tablet shows the panel";
    const jumps = [...side.querySelectorAll(".ui-note-editor-jump")];
    if (jumps.map((j) => j.textContent).join() !== "One,Two") return "the outline: " + jumps.map((j) => j.textContent);
    if (!side.textContent.includes("1 of 2 done")) return "the count: " + side.textContent;
    // One, Two, a, b, three, words, here: the marks that open a line are no words.
    if (!side.textContent.includes("7 words")) return "words: " + side.textContent;
    await tap(jumps[1]);
    if (caret() !== "# One\n\n".length || document.activeElement !== ta) return "a jump: " + caret();
    if (bar.getBoundingClientRect().bottom > box.querySelector(".ui-note-editor-paper").getBoundingClientRect().top + 1) return "a tablet's toolbar sits on top";
} else if (getComputedStyle(side).display !== "none") return "a phone has no panel";
