// tablet
await wait(300);
const apple = /Mac|iPhone|iPad/.test(navigator.platform);
const modKey = apple ? { key: "Meta", code: "MetaLeft", windowsVirtualKeyCode: 91, modifiers: 4 } : { key: "Control", code: "ControlLeft", windowsVirtualKeyCode: 17, modifiers: 2 };
const press = () => cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...modKey });
const release = () => cdp("Input.dispatchKeyEvent", { type: "keyUp", ...modKey, modifiers: 0 });
const hud = $$(".ui-keyboard-hud")[0];
const shown = () => hud.matches(":popover-open");
const labels = () => [...hud.querySelectorAll(".ui-keyboard-hud-row span:first-child")].map((s) => s.textContent);
const notes = $("#kh-notes");
await tap(notes);
notes.focus();
type(notes, "Hello there");
notes.setSelectionRange(5, 5);
const still = () => document.activeElement === notes && notes.selectionStart === 5;
if (!still()) return "the field did not take focus";

// Pressed and let go at once is nothing.
await press();
await wait(150);
if (shown()) return "it opened before the delay";
await release();
await wait(600);
if (shown()) return "a short press opened it";

// Held past the delay it shows, and focus stays in the field with the caret where it was.
await press();
await wait(750);
if (!shown()) return "held, it did not open";
if (!still()) return "opening moved focus: " + document.activeElement.tagName + " " + notes.selectionStart;
const got = labels();
if (got.join("|") !== "Save|Export|Print (not available)|Find|Find|Switch|Show help") return "rows: " + got.join("|");
const heads = [...hud.querySelectorAll("h3")].map((h) => h.textContent).join();
if (heads !== "File,Edit,View,Help") return "groups: " + heads;
// Caps in one order, whatever the markup wrote.
const caps = (i) => [...hud.querySelectorAll(".ui-keyboard-hud-keys")][i].textContent;
if (apple && caps(0) !== "⌘S") return "the caps of Save: " + caps(0);
if (apple && caps(3) !== "⇧⌘F") return "the caps of Find: " + caps(3);
// Conflicts: Save and Export share Mod+S; Mod+Tab is the system's.
const issues = hud.querySelector(".ui-keyboard-hud-issues");
if (!issues || issues.children.length !== (apple ? 2 : 1)) return "issues: " + (issues && issues.textContent);
if (!issues.children[0].textContent.includes("used by Save and Export")) return "the clash: " + issues.children[0].textContent;
if (apple && !issues.children[1].textContent.includes("kept by the system, so Switch")) return "the reserved one: " + issues.children[1].textContent;
const found = $("#keyboard-hud-found").textContent;
if (found !== (apple ? "clash Meta+S: Save/Export; system Meta+Tab: Switch" : "clash Control+S: Save/Export")) return "on_conflict: " + found;
await release();
await wait(100);
if (shown()) return "letting go did not close it";
if (!still()) return "closing moved focus";

// A shortcut used while holding is not a look at the list: it closes, and the key goes on.
let seen = 0;
const count = (e) => { if (e.key === "s") seen++; };
document.addEventListener("keydown", count);
await press();
await wait(750);
if (!shown()) return "held again, it did not open";
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "s", code: "KeyS", windowsVirtualKeyCode: 83, modifiers: modKey.modifiers });
await wait(60);
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "s", code: "KeyS", windowsVirtualKeyCode: 83, modifiers: modKey.modifiers });
await wait(60);
document.removeEventListener("keydown", count);
if (seen !== 1) return "the key did not go on: " + seen;
if (shown()) return "another key did not close it";
await release();
await wait(60);
// Another key before the delay stops it opening.
await press();
await wait(100);
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "s", code: "KeyS", windowsVirtualKeyCode: 83, modifiers: modKey.modifiers });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "s", code: "KeyS", windowsVirtualKeyCode: 83, modifiers: modKey.modifiers });
await wait(700);
if (shown()) return "a shortcut in time still opened it";
await release();
await wait(60);

// The app losing the keyboard ends it, though the keyup never comes. A window blur cannot be
// caused here, so this one event is made up.
await press();
await wait(750);
if (!shown()) return "held a third time, it did not open";
window.dispatchEvent(new Event("blur"));
await wait(60);
if (shown()) return "blur did not close it";
await release();

// The button, for no keyboard: opens and stays, rows reachable, focus left alone, a row presses.
const open = $$(".ui-keyboard-hud-open")[0];
await tap(open);
await wait(100);
if (!shown()) return "the button did not open it";
const button = (t) => [...hud.querySelectorAll("button.ui-keyboard-hud-row")].find((b) => b.textContent.startsWith(t));
if (button("Save").getAttribute("tabindex") !== "0") return "rows should be reachable when pinned";
if (!still()) return "the button moved focus: " + document.activeElement.tagName;
await tap(button("Save"));
if ($("#keyboard-hud-ran").textContent !== "Saved.") return "a row did not press its element: " + $("#keyboard-hud-ran").textContent;
if (shown()) return "a row did not close it";
if (!still()) return "a row moved focus: " + document.activeElement.tagName;
// Escape closes what the button opened, and so does a press outside.
await tap(open);
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(60);
if (shown()) return "Escape did not close it";
await tap(open);
await tap($("#keyboard-hud-ran"));
if (shown()) return "a press outside did not close it";

// What shows is what is on the screen now: a new shortcut appears, a hidden one goes.
$("#kh-save").hidden = true;
const fresh = document.createElement("button");
fresh.setAttribute("data-shortcut", "Mod+N");
fresh.textContent = "New note";
fresh.style.cssText = "min-height: 44px; min-width: 44px";
$("#kh-export").after(fresh);
await tap(open);
if (labels().join("|") !== "Export|Print (not available)|New note|Find|Find|Switch|Show help") return "after a change: " + labels().join("|");
if (hud.querySelector(".ui-keyboard-hud-issues").children.length !== (apple ? 1 : 0)) return "the clash should be gone";
if (found === $("#keyboard-hud-found").textContent) return "on_conflict was not told of the change";
await tap($("#keyboard-hud-ran"));

// A scope that means nothing says so and throws nothing.
const second = $$(".ui-keyboard-hud-open")[1];
await tap(second);
const other = $$(".ui-keyboard-hud")[1];
if (!other.textContent.includes('"[[" is not a selector')) return "a bad scope: " + other.textContent;
await tap($("#keyboard-hud-ran"));
if (other.matches(":popover-open")) return "the second did not close";
