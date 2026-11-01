// mobile
const dlg = $("#cflct-demo");
const open_ = dlg.parentElement.querySelector(".ui-cflct-open");
const q = (s) => dlg.querySelector(s), qa = (s) => [...dlg.querySelectorAll(s)];
const row = (f) => q(`.ui-cflct-row[data-field="${f}"]`);
const opt = (f, side) => row(f).querySelector(`input[value="${side}"]`);
const lab = (f, side) => opt(f, side).closest("label");
const note = () => q(".ui-cflct-note").textContent;
const save = q(".ui-cflct-save");
const got = () => $("#cflct-got").textContent;
const closed = () => $("#cflct-closed").textContent;
const btn = (t) => qa(".ui-cflct-btn").find((b) => b.textContent === t);
const reopen = async () => { if (!dlg.open) { await tap(open_); await wait(300); } };
const grip = q(".ui-cflct-grab");
if (dlg.open) return "starts closed";
await tap(open_); await wait(300);
if (!dlg.open) return "the button opens it";
if (!dlg.matches(":modal")) return "it is modal";
// phone: both changed differently. street: only mine. note: both, mine cleared. email: only theirs. news: only mine. name: the same.
if (qa(".ui-cflct-row").map((r) => r.dataset.field).join() !== "phone,note") return "asked: " + qa(".ui-cflct-row").map((r) => r.dataset.field);
if (q(".ui-cflct-intro").textContent !== "2 fields need your choice. 3 fields changed on one side only, so they were merged. Nothing is saved until you press Save.") return "intro: " + q(".ui-cflct-intro").textContent;
if (row("phone").querySelector(".ui-cflct-why").textContent !== "This was changed on this device and on Ben's tablet, in different ways.") return "plain words: " + row("phone").querySelector(".ui-cflct-why").textContent;
if (row("note").querySelector(".ui-cflct-why").textContent !== "You cleared this on this device, but it was changed on Ben's tablet.") return "cleared: " + row("note").querySelector(".ui-cflct-why").textContent;
if (lab("phone", "mine").querySelector(".ui-cflct-side").textContent !== "This device, 5 min ago") return "side: " + lab("phone", "mine").querySelector(".ui-cflct-side").textContent;
if (lab("phone", "theirs").querySelector(".ui-cflct-side").textContent !== "Ben's tablet, 2 h ago") return "side: " + lab("phone", "theirs").querySelector(".ui-cflct-side").textContent;
if (lab("phone", "mine").querySelector("mark").textContent !== "99" || lab("phone", "theirs").querySelector("mark").textContent !== "23") return "what differs is marked";
if (lab("phone", "mine").querySelector(".ui-cflct-value").textContent !== "555 0199") return "the value is whole";
if (lab("note", "mine").querySelector(".ui-cflct-none").textContent !== "Empty") return "empty says so";
if (lab("note", "theirs").querySelector("mark")) return "nothing shared, nothing marked";
if (q(".ui-cflct-auto summary").textContent !== "3 fields merged without asking") return "auto: " + q(".ui-cflct-auto summary").textContent;
if (qa(".ui-cflct-auto li").map((l) => l.textContent).join(" / ") !== "Street: your change, from this device, is kept. / Email: the change from Ben's tablet is taken. / Sends news: your change, from this device, is kept.") return "auto list: " + qa(".ui-cflct-auto li").map((l) => l.textContent).join(" / ");
if (getComputedStyle(q(".ui-cflct-auto summary")).display !== "list-item") return "the summary keeps its arrow";
if (note() !== "Choose 2 more.") return "note: " + note();
if (save.getAttribute("aria-disabled") !== "true") return "Save waits";

// Save too soon says which.
await tap(save);
if (note() !== "Choose a version of Phone, Note first.") return "too soon: " + note();
if (got() !== "Nothing saved yet.") return "nothing saved";
// A real tap on a choice, then the other in the group.
await tap(lab("phone", "theirs"));
if (!opt("phone", "theirs").checked || opt("phone", "mine").checked) return "a tap picks";
if (note() !== "Choose a version of Phone, Note first." && note() !== "Choose 1 more.") return "the count: " + note();
await tap(lab("phone", "mine"));
if (!opt("phone", "mine").checked || opt("phone", "theirs").checked) return "the group keeps one";
// The keyboard: arrow keys move in a group, for real.
opt("phone", "mine").focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowDown", code: "ArrowDown", windowsVirtualKeyCode: 40 });
await wait(80);
if (!opt("phone", "theirs").checked) return "arrow keys move the choice";

// The pull. Short of a third: springs back, stays open.
const startTop = dlg.getBoundingClientRect().top;
const y = () => dlg.getBoundingClientRect().top - startTop;
if (device === "phone") {
    await drag(grip, 0, 40, 500); await wait(300);
    if (!dlg.open || Math.abs(y()) > 1) return "a short pull springs back: " + y();
    // Sideways is no pull.
    await drag(grip, 120, 0, 300); await wait(300);
    if (!dlg.open || Math.abs(y()) > 1) return "sideways: " + y();
    // State changes in the middle of a pull: the sheet stays under the finger.
    const r = grip.getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top + 20 };
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + i * 10 }]); await wait(16); }
    await wait(60);
    const before = dlg.style.transform;
    if (before !== "translateY(80px)") return "the pull moves it: " + before;
    opt("note", "theirs").click();     // a state change, as a timer or the server's push would make
    await wait(80);
    if (dlg.style.transform !== before) return "a state change sent the pull home: " + dlg.style.transform;
    if (Math.abs(y() - 80) > 2) return "it left the finger: " + y();
    for (let i = 9; i <= 12; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + i * 10 }]); await wait(16); }
    if (dlg.style.transform !== "translateY(120px)") return "it goes on after the change: " + dlg.style.transform;
    // Cancelled by the system: back it comes.
    await fingers("touchCancel", []); await wait(300);
    if (!dlg.open || Math.abs(y()) > 1) return "a cancelled pull springs back: " + y();
    if (dlg.style.transform !== "") return "cancel leaves no transform: " + dlg.style.transform;
    // Slow and long: past a third it closes, and the choices stay.
    await drag(grip, 0, dlg.offsetHeight * 0.45, 700); await wait(400);
    if (dlg.open) return "a long pull closes it";
    if (closed() !== "Closed without saving: 1.") return "on_close: " + closed();
    await reopen();
    if (!opt("phone", "theirs").checked || !opt("note", "theirs").checked) return "closing keeps the choices";
    // A flick: short and quick.
    await drag(grip, 0, 150, 40); await wait(400);
    if (dlg.open) return "a flick closes it";
    await reopen();
} else {
    // On a tablet it is no sheet: a pull does nothing, and the two versions stand side by side.
    if (startTop < 20) return "it is centred on a tablet: " + startTop;
    await drag(grip, 0, 300, 300); await wait(250);
    if (!dlg.open || Math.abs(y()) > 1) return "no pull on a tablet: " + y();
    const a = lab("phone", "mine").getBoundingClientRect(), b = lab("phone", "theirs").getBoundingClientRect();
    if (Math.abs(a.top - b.top) > 1 || b.left < a.right) return "side by side";
    opt("note", "theirs").click(); await wait(50);
}
if (device === "phone") {
    const a = lab("phone", "mine").getBoundingClientRect(), b = lab("phone", "theirs").getBoundingClientRect();
    if (b.top < a.bottom) return "stacked on a phone";
    if (Math.abs(dlg.getBoundingClientRect().bottom - innerHeight) > 1) return "the sheet sits on the bottom edge";
}
// Turned on its side and back: still open, the choices kept, and it fits.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(250);
const turned = dlg.getBoundingClientRect();
const fits = dlg.open && turned.top >= -1 && turned.bottom <= innerHeight + 1;
const kept = opt("phone", "theirs").checked && opt("note", "theirs").checked;
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(250);
if (!fits) return "turned, it does not fit: " + turned.top + " " + turned.bottom + " in " + innerHeight;
if (!kept) return "turning lost the choices";
// Escape, for real; the backdrop.
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(150);
if (dlg.open) return "Escape closes it";
await reopen();
await fingers("touchStart", [{ x: 10, y: 10 }]); await fingers("touchEnd", []); await wait(250);
if (dlg.open) return "a tap outside closes it";
await reopen();
await tap(q(".ui-cflct-x")); await wait(100);
if (dlg.open) return "the close button";
await reopen();

// All from one side, then a failed save: stays open with its choices.
await tap(btn("All from this device"));
if (!opt("phone", "mine").checked || !opt("note", "mine").checked) return "all from this device";
await tap(btn("All from Ben's tablet"));
if (!opt("phone", "theirs").checked || !opt("note", "theirs").checked) return "all from the tablet";
if (save.getAttribute("aria-disabled") !== "false" || note() !== "") return "all chosen: " + note();
// Behind a modal sheet the page cannot be tapped, so this button is pressed as a program would.
$("#cflct-refuse").click(); await wait(60);
await tap(save); await wait(180);
if (!dlg.open || note() !== "Not saved: The server is busy." || !q(".ui-cflct-note").hasAttribute("data-bad")) return "a failed save: " + note();
if (!opt("phone", "theirs").checked) return "a failed save keeps the choices";
$("#cflct-refuse").click(); await wait(60);
save.click(); save.click(); await wait(250);
if (dlg.open) return "a good save closes it";
const want = { name: "Ana Reyes", phone: "555 0123", street: "14 Mill Lane", note: "Leave at the door", email: "ana.reyes@example.com", news: true };
if (got() !== JSON.stringify(want) + " | " + JSON.stringify({ phone: "theirs", note: "theirs" })) return "merged: " + got();
if (closed().match(/\d+/)[0] !== String(device === "phone" ? 5 : 3)) return "a save is not a close; " + closed();
if (document.documentElement.scrollWidth > innerWidth) return "wide";

// With no shared start every difference is asked, and the word for it changes. Radio names differ.
const two = $("#cflct-two");
await tap(two.parentElement.querySelector(".ui-cflct-open")); await wait(300);
if (two.querySelector(".ui-cflct-why").textContent !== "The two versions differ, and nothing says which came first.") return "no base: " + two.querySelector(".ui-cflct-why").textContent;
if ([...two.querySelectorAll(".ui-cflct-row")].length !== 1) return "city is the same, phone is not";
if (two.querySelector("input").name === opt("phone", "mine").name) return "two sheets share a radio group";
if (two.querySelector("h2").textContent !== "Which is right?") return "title";
if (two.querySelector(".ui-cflct-side").textContent !== "This device") return "no time, no time word: " + two.querySelector(".ui-cflct-side").textContent;
await tap(two.querySelector('[aria-label="Close"]')); await wait(100);
// Empty and null read alike; nothing to choose, Save just closes. Bad data throws nothing.
const same = $("#cflct-same");
await tap(same.parentElement.querySelector(".ui-cflct-open")); await wait(300);
if (same.querySelector(".ui-cflct-intro").textContent !== "Both versions say the same.") return "same: " + same.querySelector(".ui-cflct-intro").textContent;
await tap(same.querySelector(".ui-cflct-save")); await wait(100);
if (same.open) return "nothing to choose: Save closes";
const bad = $("#cflct-bad");
await tap(bad.parentElement.querySelector(".ui-cflct-open")); await wait(300);
if (bad.querySelector(".ui-cflct-intro").textContent !== "Both versions say the same.") return "bad data: " + bad.querySelector(".ui-cflct-intro").textContent;
await tap(bad.querySelector('[aria-label="Close"]')); await wait(100);
