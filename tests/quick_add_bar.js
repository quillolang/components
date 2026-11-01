// mobile
await wait(300);
const bar = $(".ui-quick-add");
const input = bar.querySelector(".ui-quick-add-input");
const mirror = bar.querySelector(".ui-quick-add-mirror");
const live = () => $("#quick-add-live").textContent;
const marks = (b = bar) => [...b.querySelectorAll(".ui-quick-add-mark")].map((m) => m.dataset.kind + ":" + m.textContent).join(" ");
const chips = (b = bar) => [...b.querySelectorAll(".ui-quick-add-chip")].map((c) => c.textContent.trim()).join("|");
const say = async (t) => { type(input, t); await wait(30); return live(); };

if (getComputedStyle(input).fontSize !== "16px") return "under 16 px iOS zooms in on focus: " + getComputedStyle(input).fontSize;
if (device === "phone" && bar.querySelector(".ui-quick-add-chips").offsetHeight !== 0) return "no chips, no row";

// Known answers, from Wednesday 2026-11-04 at 10:20.
const table = [
    ["Call Ana tomorrow 5pm #work !!", "Call Ana|2026-11-05|17:00|Work|medium"],
    ["Buy milk", "Buy milk|null|null|null|null"],
    ["Dentist next friday at 9:30", "Dentist|2026-11-13|09:30|null|null"],
    ["Dentist friday", "Dentist|2026-11-06|null|null|null"],
    ["Dentist wednesday", "Dentist|2026-11-11|null|null|null"],
    ["Dentist this wednesday", "Dentist|2026-11-04|null|null|null"],
    ["Standup on mon", "Standup|2026-11-09|null|null|null"],
    ["Sat nav repair", "Sat nav repair|null|null|null|null"],
    ["Rent in 3 days for home urgent", "Rent|2026-11-07|null|Home|high"],
    ["Rent in a month", "Rent|2026-12-04|null|null|null"],
    ["Rent in two weeks", "Rent|2026-11-18|null|null|null"],
    ["Essay by the 14th p2", "Essay|2026-11-14|null|null|medium"],
    ["Party 3 Dec", "Party|2026-12-03|null|null|null"],
    ["Party Mar 1", "Party|2027-03-01|null|null|null"],
    ["Party 3rd of March 2028", "Party|2028-03-03|null|null|null"],
    ["Renew 29 Feb", "Renew|2028-02-29|null|null|null"],
    ["Bake Feb 30", "Bake Feb 30|null|null|null|null"],
    ["Bake may bread", "Bake may bread|null|null|null|null"],
    ["Lunch at noon", "Lunch|2026-11-04|12:00|null|null"],
    ["Walk 9am", "Walk|2026-11-05|09:00|null|null"],
    ["Walk at 5", "Walk|2026-11-04|17:00|null|null"],
    ["Walk at 07:30", "Walk|2026-11-05|07:30|null|null"],
    ["Walk 12am friday", "Walk|2026-11-06|00:00|null|null"],
    ["Walk 25:00", "Walk 25:00|null|null|null|null"],
    ["Oven in 2 hours", "Oven|2026-11-04|12:20|null|null"],
    ["Oven in 15 hours", "Oven|2026-11-05|01:20|null|null"],
    ["Report end of month", "Report|2026-11-30|null|null|null"],
    ["Report next month", "Report|2026-12-01|null|null|null"],
    ["Report next week", "Report|2026-11-09|null|null|null"],
    ["Report this weekend", "Report|2026-11-07|null|null|null"],
    ["Trip 14/11", "Trip|2026-11-14|null|null|null"],
    ["Trip 2027-01-05", "Trip|2027-01-05|null|null|null"],
    ["Trip 2027-02-30", "Trip 2027-02-30|null|null|null|null"],
    ["Review the 31st", "Review|2026-12-31|null|null|null"],
    ["Meet next", "Meet next|null|null|null|null"],
    ["Fix #side", "Fix|null|null|Side project|null"],
    ["Fix #Nowhere", "Fix|null|null|Nowhere|null"],
    ["Fix in Side project low priority", "Fix|null|null|Side project|low"],
    ["Fix work list", "Fix|null|null|Work|null"],
    ["Fix work bench", "Fix work bench|null|null|null|null"],
    ["Fix today, tonight", "Fix tonight|2026-11-04|null|null|null"],
    ["Tonight dinner", "dinner|2026-11-04|20:00|null|null"],
    ["Book tomorrow, please!", "Book please!|2026-11-05|null|null|null"],
    ["  Two   spaces  today ", "Two spaces|2026-11-04|null|null|null"],
    ["Hello !", "Hello|null|null|null|low"],
    ["Wow! great", "Wow! great|null|null|null|null"],
];
for (const [text, want] of table) {
    const got = await say(text);
    if (got !== want) return `"${text}" read as ${got}, not ${want}`;
}

// What repeats.
await say("Pay rent every monday #home");
if (live() !== "Pay rent|2026-11-09|null|Home|null") return "every monday: " + live();
if (chips() !== "Monday|Every Monday|Home") return "repeat chips: " + chips();
await say("Stretch daily");
if (chips() !== "Today|Every day") return "daily: " + chips();
await say("Stretch weekdays");
if (chips() !== "Today|Weekdays") return "weekdays: " + chips();

// The marks stand where the words are, the whole line is drawn, and it counts characters.
await say("Call Ana tomorrow 5pm #work !!");
if (marks() !== "date:tomorrow time:5pm list:#work priority:!!") return "marks: " + marks();
if (mirror.textContent !== input.value) return "the mirror should hold the same line: " + mirror.textContent;
if (chips() !== "Tomorrow 17:00|Work|Medium priority") return "chips: " + chips();
await say("Write 😀😀 blog tomorrow");
if (marks() !== "date:tomorrow" || mirror.textContent !== input.value) return "marks after an emoji: " + marks();
if (live() !== "Write 😀😀 blog|2026-11-05|null|null|null") return "emoji: " + live();
const inputColor = getComputedStyle(input).webkitTextFillColor;
if (inputColor !== "rgba(0, 0, 0, 0)") return "the field's own text should be clear: " + inputColor;
const same = ["fontFamily", "fontSize", "lineHeight", "paddingLeft", "letterSpacing"].filter((k) => getComputedStyle(input)[k] !== getComputedStyle(mirror)[k]);
if (same.length) return "the field and the mirror differ in " + same;

// A long line: both scroll alike, so the marks stay under the caret.
const long = "Write the whole of the long report for the board about everything that happened tomorrow and more words after it";
input.focus();
type(input, long);
input.setSelectionRange(long.length, long.length);
input.scrollLeft = 1e5;
await wait(100);
if (mirror.scrollLeft < 50) return "the mirror should scroll: " + mirror.scrollLeft;
if (Math.abs(mirror.scrollLeft - input.scrollLeft) > 1) return "the mirror should stay with the field: " + mirror.scrollLeft + " " + input.scrollLeft;
if (Math.abs(mirror.scrollWidth - input.scrollWidth) > 1) return "the two should be as wide: " + mirror.scrollWidth + " " + input.scrollWidth;

// Tapping a chip gives the words back to the title, and they stay plain.
await say("Call Ana tomorrow 5pm #work !!");
await tap($$(".ui-quick-add-chip")[0]);
await wait(50);
if (live() !== "Call Ana tomorrow 5pm|null|null|Work|medium") return "chip tapped: " + live();
if (marks() !== "list:#work priority:!!") return "marks after: " + marks();
await tap($$(".ui-quick-add-chip")[1]);
await wait(50);
if (live() !== "Call Ana tomorrow 5pm !!|null|null|Work|null") return "second chip: " + live();

// Only words: nothing to add, and it says so with the button off.
type(input, "");
await wait(30);
type(input, "tomorrow #work");
await wait(50);
if (!bar.querySelector(".ui-quick-add-add").disabled) return "no title, no Add";

// Real typing: a list offered as # is typed, focus and keyboard staying.
type(input, "");
await wait(30);
await tap(input);
if (document.activeElement !== input) return "a tap should focus the field";
await cdp("Input.insertText", { text: "😀 Buy #" });
await wait(100);
if (input.value !== "😀 Buy #") return "typed: " + input.value;
if (chips() !== "Inbox|Work|Home|Side project") return "the offers: " + chips();
const offer = bar.querySelector('.ui-quick-add-chip[aria-label="Use the list Work"]');
await tap(offer);
await wait(60);
if (input.value !== "😀 Buy #Work ") return "the offer taken: " + JSON.stringify(input.value);
if (document.activeElement !== input) return "focus should stay in the field, to keep the keyboard up";
if (input.selectionStart !== input.value.length) return "the caret should go to the end: " + input.selectionStart;
await cdp("Input.insertText", { text: "tomorrow" });
await wait(100);
if (input.value !== "😀 Buy #Work tomorrow") return "typing on: " + input.value;

// Enter adds, the line empties, focus stays for the next.
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await wait(100);
const added = () => [...$("#quick-add-added").querySelectorAll("li")].map((l) => l.textContent);
if (added().join("|") !== "😀 Buy / 2026-11-05 /  / Work /  / ") return "added: " + added();
if (input.value !== "" || mirror.textContent !== "") return "the line should empty: " + input.value;
if (document.activeElement !== input) return "focus should stay after Enter";
if (bar.querySelector(".ui-quick-add-say").textContent !== "Added 😀 Buy, Tomorrow.") return "what it says: " + bar.querySelector(".ui-quick-add-say").textContent;

// The button adds too, without taking focus from the field.
await cdp("Input.insertText", { text: "Ring Sam p1" });
await wait(80);
await tap(bar.querySelector(".ui-quick-add-add"));
await wait(80);
if (added().length !== 2 || added()[1] !== "Ring Sam /  /  /  / high / ") return "Add: " + added();
if (document.activeElement !== input) return "the button should leave focus in the field";
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await wait(60);
if (added().length !== 2) return "an empty line adds nothing";

// Docked: no new lists, the month first.
const docked = $("#quick-add-screen .ui-quick-add");
const dockIn = docked.querySelector("input");
if (getComputedStyle(docked).position !== "fixed") return "docked should be fixed";
type(dockIn, "Trip 11/14 #nope #work");
await wait(50);
if (marks(docked) !== "date:11/14 list:#work") return "docked marks: " + marks(docked);
if (dockIn.value !== "Trip 11/14 #nope #work") return "docked value";
const screen = $("#quick-add-screen");
const gap = () => screen.getBoundingClientRect().bottom - docked.getBoundingClientRect().bottom;
if (Math.abs(gap() - 1) > 1.5) return "docked should stand at the bottom: " + gap();

// The keyboard: what iOS reports. The visible part shrinks and the layout does not.
const vv = visualViewport, realH = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => realH - 300 });
vv.dispatchEvent(new Event("resize"));
await wait(50);
const up = gap();
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(50);
if (Math.abs(up - 301) > 1.5) return "above a keyboard of 300: " + up;
if (Math.abs(gap() - 1) > 1.5) return "back down: " + gap();

if (device === "tablet") {
    type(input, "Call tomorrow");
    await wait(50);
    const f = bar.querySelector(".ui-quick-add-row").getBoundingClientRect(), c = bar.querySelector(".ui-quick-add-chips").getBoundingClientRect();
    if (c.left < f.right || Math.abs(c.top - f.top) > 6) return "on a tablet what was found stands beside the line";
    type(input, "");
}
await wait(50);
