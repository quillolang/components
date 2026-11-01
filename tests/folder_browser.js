// mobile
await wait(300);
const box = $("#folder-browser-screen .ui-folder-browser");
const dlg = box.querySelector("dialog");
const names = () => [...box.querySelectorAll(".ui-folder-browser-list .ui-folder-browser-name")].map((n) => n.textContent).join(" | ");
const notes = () => [...box.querySelectorAll(".ui-folder-browser-list .ui-folder-browser-note")].map((n) => n.textContent).join(" | ");
const crumbs = () => [...box.querySelectorAll(".ui-folder-browser-crumb")].map((c) => c.textContent).join(" / ");
const row = (id) => box.querySelector(`.ui-folder-browser-row[data-id="${id}"]`);
const open = (id) => row(id).querySelector(".ui-folder-browser-go");
const more = (id) => row(id).querySelector(".ui-folder-browser-more");
const back = () => box.querySelector('.ui-folder-browser-bar [aria-label="Back"]');
const log = () => $("#folder-browser-log").textContent;
const say = () => box.querySelector(".ui-folder-browser-say").textContent;
const part = (i) => dlg.querySelectorAll(".ui-folder-browser-part")[i];
const act = (t) => [...dlg.querySelectorAll(".ui-folder-browser-action")].find((b) => b.textContent === t && b.offsetParent);
const input = () => dlg.querySelector("input");
const why = () => [...dlg.querySelectorAll(".ui-folder-browser-why")].find((p) => p.offsetParent).textContent;
const doBtn = () => [...dlg.querySelectorAll(".ui-folder-browser-do")].find((b) => b.offsetParent);
const shut = async () => { await wait(260); };

// Bad data: unknown parents go to the top, an id seen twice once, and a loop cannot hang it.
const bad = $("#folder-browser-bad .ui-folder-browser");
const badNames = [...bad.querySelectorAll(".ui-folder-browser-list .ui-folder-browser-name")].map((n) => n.textContent);
if (badNames.join() !== "Self,Unknown parent") return "bad data: " + badNames.join();
$("#folder-browser-bad").remove();

// The top: folders first, then files; what each holds.
if (names() !== "Archive | Documents | Photos | notes.txt") return "top: " + names();
if (notes() !== "Empty | 2 items | 2 items | 2 KB") return "notes: " + notes();
if (crumbs() !== "My files") return "crumbs: " + crumbs();
if (!back().disabled) return "no Back at the top";
if (box.querySelector(".ui-folder-browser-crumb").getAttribute("aria-current") !== "page") return "the crumb marks the place";

// A file opens; folders go in, the crumbs grow, Back goes up.
await tap(open("notes"));
if (log() !== "open notes") return "on_open: " + log();
await tap(open("docs"));
if (names() !== "Taxes | Lease.pdf" || crumbs() !== "My files / Documents") return "Documents: " + names();
if (log() !== "folder docs") return "on_folder: " + log();
if (notes() !== "1 item | 1.8 MB") return "notes inside: " + notes();
await tap(open("taxes"));
await tap(open("y26"));
if (crumbs() !== "My files / Documents / Taxes / 2026") return "deep: " + crumbs();
if (notes() !== "From the scanner") return "a given note: " + notes();
await tap(back());
if (crumbs() !== "My files / Documents / Taxes") return "Back: " + crumbs();
await tap(open("y26"));
const c2 = [...box.querySelectorAll(".ui-folder-browser-crumb")];
await tap(c2[1]);
if (crumbs() !== "My files / Documents" || names() !== "Taxes | Lease.pdf") return "a crumb: " + crumbs();
await tap(box.querySelector(".ui-folder-browser-crumb"));
if (crumbs() !== "My files") return "the top crumb: " + crumbs();

// An empty folder says so.
await tap(open("empty"));
if (box.querySelector(".ui-folder-browser-none").textContent !== "This folder is empty.") return "empty";
await tap(back());

// The crumbs stay at their end when deep, on a narrow bar.
const bar = box.querySelector(".ui-folder-browser-crumbs");
await tap(open("docs"));
await tap(open("taxes"));
await tap(open("y26"));
await wait(60);
if (bar.scrollWidth > bar.clientWidth && Math.ceil(bar.scrollLeft + bar.clientWidth) < bar.scrollWidth) return "the last crumb should show: " + bar.scrollLeft;
await tap(box.querySelector(".ui-folder-browser-crumb"));

// Each folder keeps its scroll.
const scroller = box.querySelector(".ui-folder-browser-scroll");
const list = box.querySelector(".ui-folder-browser-list");
list.style.paddingBottom = "2000px";
scroller.scrollTop = 20;
await wait(50);
await tap(open("docs"));
await wait(50);
if (scroller.scrollTop !== 0) return "a new folder starts at the top: " + scroller.scrollTop;
await tap(back());
await wait(50);
if (scroller.scrollTop !== 20) return "Back should return to the place: " + scroller.scrollTop;
scroller.scrollTop = 0;
list.style.paddingBottom = "";

// The sheet: actions, Rename in the same sheet with the name selected up to the extension.
await tap(open("docs"));
await tap(more("lease"));
if (!dlg.open) return "the sheet should open";
if (dlg.querySelector("h2").textContent !== "Lease.pdf") return "its title: " + dlg.querySelector("h2").textContent;
await tap(act("Rename"));
await wait(50);
if (document.activeElement !== input() || input().value !== "Lease.pdf") return "rename should focus: " + input().value;
if (input().selectionStart !== 0 || input().selectionEnd !== 5) return "the name without .pdf: " + input().selectionStart + " " + input().selectionEnd;
if (dlg.querySelector("h2").textContent !== "Rename Lease.pdf") return "its title: " + dlg.querySelector("h2").textContent;

// What is wrong with a name, as it is typed.
const tryName = async (t) => { type(input(), t); await wait(30); return why(); };
if (await tryName("  ") !== "A name cannot be empty." || !doBtn().disabled) return "empty: " + why();
if (await tryName("a/b") !== "A name cannot have / or \\ in it.") return "slash: " + why();
if (await tryName("a\\b") !== "A name cannot have / or \\ in it.") return "backslash: " + why();
if (await tryName("..") !== "That name is kept for the system.") return "dots: " + why();
if (await tryName("x".repeat(121)) !== "A name can be 120 characters at most.") return "long: " + why();
if (await tryName("TAXES") !== "A folder here already has that name.") return "taken, in any case: " + why();
if (await tryName("Lease.pdf") !== "") return "its own name: " + why();
if (await tryName("  Rent 2026.pdf ") !== "" || doBtn().disabled) return "a good name: " + why();
await tap(doBtn());
await shut();
if (dlg.open) return "the sheet should close";
if (names() !== "Taxes | Rent 2026.pdf") return "renamed: " + names();
if (log() !== "rename lease Rent 2026.pdf") return "on_rename: " + log();
if (say() !== "Renamed to Rent 2026.pdf.") return "says: " + say();

// A refusal puts it back and says so.
$("#folder-browser-refuse").click();
await wait(60);
await tap(more("lease"));
await tap(act("Rename"));
type(input(), "Other.pdf");
await wait(30);
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await wait(120);
if (names() !== "Taxes | Rent 2026.pdf") return "a refused rename should go back: " + names();
if (say() !== "That could not be renamed." || !box.querySelector(".ui-folder-browser-say").hasAttribute("data-bad")) return "refused: " + say();

// Move: refused too.
await tap(more("lease"));
await tap(act("Move"));
await wait(50);
const moveBar = () => part(2).querySelector(".ui-folder-browser-where span").textContent;
const up = () => part(2).querySelector('[aria-label="Up one folder"]');
if (moveBar() !== "Documents") return "move starts where it is: " + moveBar();
if (why() !== "It is already here." || !doBtn().disabled) return "already here: " + why();
await tap(up());
if (moveBar() !== "My files") return "up: " + moveBar();
if (!up().disabled) return "no further up";
await tap(doBtn());
await shut();
if (names() !== "Taxes | Rent 2026.pdf" || say() !== "That could not be moved.") return "a refused move: " + names() + " " + say();
$("#folder-browser-refuse").click();
await wait(60);

// Moved to a name in use: no.
await tap(more("lease"));
await tap(act("Rename"));
type(input(), "Lease.pdf");
await wait(30);
await tap(doBtn());
await shut();
await tap(more("lease"));
await tap(act("Move"));
await wait(40);
await tap(up());
await tap(act("Photos"));
if (moveBar() !== "Photos") return "into Photos: " + moveBar();
if (why() !== "Something here already has that name." || !doBtn().disabled) return "a taken name, in any case: " + why();
await tap(up());
await tap(act("Archive"));
if (doBtn().textContent !== "Move to Archive") return "the button says where: " + doBtn().textContent;
await tap(doBtn());
await shut();
if (names() !== "Taxes") return "it should leave: " + names();
if (log() !== "move lease empty") return "on_move: " + log();
if (say() !== "Moved to Archive.") return "says: " + say();

// A folder cannot go into itself or what it holds, and is not listed as a way there.
await tap(box.querySelector(".ui-folder-browser-crumb"));
await tap(more("docs"));
await tap(act("Move"));
await wait(40);
if (act("Documents")) return "a folder is not offered itself";
if (why() !== "It is already here.") return "docs at the top: " + why();
await tap(dlg.querySelector('[aria-label="Close"]'));
await shut();
await tap(open("docs"));
await tap(more("taxes"));
await tap(act("Move"));
await wait(40);
await tap(up());
await tap(act("Archive"));
await tap(doBtn());
await shut();
await tap(box.querySelector(".ui-folder-browser-crumb"));
await tap(open("empty"));
if (names() !== "Taxes | Lease.pdf") return "the folder should arrive, folders first: " + names();
await tap(open("taxes"));
if (crumbs() !== "My files / Archive / Taxes") return "the path follows: " + crumbs();
await tap(open("y26"));
await tap(back());
await tap(back());
await tap(more("taxes"));
await tap(act("Move"));
await wait(40);
if (moveBar() !== "Archive") return "from Archive: " + moveBar();
await tap(up());
await tap(act("Archive"));
if (why() !== "It is already here.") return "here again: " + why();
if (act("Taxes")) return "the folder moving is not offered";
await tap(dlg.querySelector('[aria-label="Close"]'));
await shut();

// Closing: Escape, the backdrop, the handle.
await tap(box.querySelector(".ui-folder-browser-crumb"));
await tap(more("notes"));
dlg.close();
await shut();
if (dlg.open) return "close";
await tap(more("notes"));
await wait(300);
const r = dlg.getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 195, y: 30 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(120);
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 10, y: 20 });
await cdp("Input.dispatchMouseEvent", { type: "mousePressed", x: 10, y: 20, button: "left", clickCount: 1 });
await cdp("Input.dispatchMouseEvent", { type: "mouseReleased", x: 10, y: 20, button: "left", clickCount: 1 });
await shut();
if (dlg.open) return "a tap above the sheet should close it";

if (device === "phone") {
    const grip = dlg.querySelector(".ui-folder-browser-grip");
    await tap(more("notes"));
    await wait(300);
    const h = dlg.offsetHeight;
    // Short and slow: springs back.
    await drag(grip, 0, h * 0.2, 600);
    await wait(280);
    if (!dlg.open || dlg.style.transform !== "") return "a short drag should spring back: " + dlg.style.transform;
    // Mid-drag it follows; cancelled, it stays.
    const p = middle(grip);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 8 * i }]); await wait(30); }
    await wait(40);
    if (dlg.style.transform !== "translateY(40px)") return "mid-drag: " + dlg.style.transform;
    // State changing under the finger must leave the drag alone.
    act("Move").click();
    await wait(60);
    if (dlg.querySelector("h2").textContent !== "Move notes.txt") return "the state should have changed: " + dlg.querySelector("h2").textContent;
    if (dlg.style.transform !== "translateY(40px)" || !dlg.classList.contains("ui-folder-browser-dragging")) return "a state change undid the drag: " + dlg.style.transform;
    await fingers("touchCancel", []);
    await wait(280);
    if (!dlg.open || dlg.style.transform !== "") return "a cancelled drag: " + dlg.style.transform;
    // Past a third: gone. The sheet has grown, showing Move.
    await drag(grip, 0, dlg.offsetHeight * 0.5, 600);
    await wait(280);
    if (dlg.open) return "a long drag should close it";
    if (dlg.style.transform !== "") return "it should open clean next time: " + dlg.style.transform;
    // A flick from a short way.
    await tap(more("notes"));
    await wait(300);
    const q = middle(grip);
    await fingers("touchStart", [q]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x, y: q.y + 17 * i }]); await wait(6); }
    await fingers("touchEnd", []);
    await wait(280);
    if (dlg.open) return "a flick should close it";
    // Above the keyboard, as iOS reports one.
    await tap(more("notes"));
    await wait(300);
    const vv = visualViewport, realH = vv.height;
    Object.defineProperty(vv, "height", { configurable: true, get: () => realH - 300 });
    vv.dispatchEvent(new Event("resize"));
    await wait(40);
    const gap = innerHeight - dlg.getBoundingClientRect().bottom;
    delete vv.height;
    vv.dispatchEvent(new Event("resize"));
    if (Math.abs(gap - 300) > 1.5) return "the sheet should stand above the keyboard: " + gap;
    dlg.close();
    await shut();
    if (dlg.getBoundingClientRect().width > innerWidth) return "the sheet is too wide";
} else {
    // A tablet: the tree beside the list, all folders by depth, a sheet in the middle.
    const tree = box.querySelector(".ui-folder-browser-tree");
    const main = box.querySelector(".ui-folder-browser-main").getBoundingClientRect();
    if (getComputedStyle(tree).display !== "block" || tree.getBoundingClientRect().right > main.left + 1) return "the tree stands beside the list";
    const branches = () => [...tree.querySelectorAll(".ui-folder-browser-branch")];
    if (branches().map((b) => b.textContent).join(" ") !== "My files Archive Taxes 2026 Documents Photos") return "the tree: " + branches().map((b) => b.textContent).join(" ");
    if (branches()[2].style.getPropertyValue("--depth").trim() !== "2") return "depth: " + branches()[2].getAttribute("style");
    await tap(branches()[3]);
    if (crumbs() !== "My files / Archive / Taxes / 2026") return "a branch: " + crumbs();
    if (branches()[3].getAttribute("aria-current") !== "true") return "the branch is marked";
    await tap(more("receipt"));
    await wait(300);
    const s = dlg.getBoundingClientRect();
    if (Math.abs(s.left + s.width / 2 - innerWidth / 2) > 2 || Math.abs(s.top + s.height / 2 - innerHeight / 2) > 2 || s.width !== 440) return "a box in the middle: " + s.left + " " + s.top + " " + s.width;
    if (getComputedStyle(dlg.querySelector(".ui-folder-browser-grip")).display !== "none") return "no handle on a box";
    // Rename keeps a name's inner dots.
    await tap(act("Rename"));
    if (input().selectionEnd !== "receipt.final".length) return "up to the last dot: " + input().selectionEnd;
    dlg.close();
    await shut();
}
