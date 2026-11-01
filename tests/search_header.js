// mobile
const again = () => [...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Build it again");
const KEY = "ui-search-header-demo";
const fresh = async () => { again().click(); await wait(150); };
// The phone's run and the tablet's share one browser.
localStorage.removeItem(KEY);
await fresh();
let box = $(".ui-searchhead"), input = $("#search-header-demo"), drop = $(".ui-searchhead-drop");
const isOn = () => box.classList.contains("ui-searchhead-on");
const note = () => $(".demo-note").textContent;
const recents = () => $$(".ui-searchhead-pick").map((b) => b.textContent);
const results = () => [...drop.querySelectorAll(".ui-searchhead-demo-list button")].map((b) => b.textContent);
const status = () => $(".ui-sr[aria-live]").textContent;
const pageEl = () => $(".ui-searchhead-page");
const typeIn = async (text) => { input.value = text; input.dispatchEvent(new Event("input", { bubbles: true })); await wait(60); };

if (input.tagName !== "INPUT" || input.type !== "search") return "the field";
for (const [k, v] of [["enterkeyhint", "search"], ["autocapitalize", "off"], ["autocomplete", "off"], ["spellcheck", "false"]]) if (input.getAttribute(k) !== v) return k;
if (parseFloat(getComputedStyle(input).fontSize) < 16) return "iOS zooms on a smaller field";
if (isOn() || getComputedStyle(drop).display !== "none") return "starts open";
if (getComputedStyle($(".ui-searchhead-cancel")).display !== "none") return "Cancel shows from the start";
if ($(".ui-searchhead-title").textContent !== "Contacts") return "title";

// Tap: it opens in place, Cancel appears, recent searches show, the same element keeps the focus.
await tap(input);
await wait(250);
if (!isOn()) return "a tap did not open it";
if (document.activeElement !== input) return "the tap did not focus the field";
if (getComputedStyle($(".ui-searchhead-cancel")).display === "none") return "no Cancel";
// (A repeat in another case, a number and a blank in `recent` are dropped.)
if (recents().join() !== "Grace,Ben,Luis") return "recents: " + recents().join();
if (!pageEl().hasAttribute("inert")) return "the screen under it can be reached";

if (device === "phone") {
    if (getComputedStyle($(".ui-searchhead-top")).visibility !== "hidden") return "the title stayed on a phone";
    const d = drop.getBoundingClientRect(), b = $(".ui-searchhead-body").getBoundingClientRect();
    if (d.width !== b.width || d.height !== b.height) return `a phone's results take the screen: ${d.width}x${d.height}`;
} else {
    if (getComputedStyle($(".ui-searchhead-top")).visibility !== "visible") return "a tablet lost its title";
    const d = drop.getBoundingClientRect(), r = box.getBoundingClientRect();
    if (Math.round(d.width) !== 420) return "a tablet's panel is " + d.width;
    if (d.height >= r.height * 0.75) return "a tablet's panel covers the screen: " + d.height;
    const i = input.getBoundingClientRect();
    if (i.right > r.right - 16 || i.width > 420) return "field: " + i.width;
    if (d.left > i.left + 200) return "the panel is not under the field";
    if (getComputedStyle(drop).boxShadow === "none") return "no shadow";
}

// Typing: results come, the field is the same element and keeps the focus, each key.
for (const t of ["g", "gr", "gra"]) {
    await typeIn(t);
    if (document.activeElement !== input) return "typing took the focus at " + t;
}
if (input.value !== "gra") return "what was typed went: " + input.value;
if (results().join() !== "Grace Tan") return "results: " + results().join();
if (status() !== "1 result") return "status: " + status();
if (recents().length) return "recents beside results";
if (!/Query: gra;/.test(note())) return note();
if ($("#search-header-demo") !== input) return "the field was made again";

// A real tap on a result: what it does happens, and the keyboard stays.
await tap(drop.querySelector(".ui-searchhead-demo-list button"));
if (!note().includes("picked: Grace Tan")) return note();
if (document.activeElement !== input) return "a tap on a result took the focus: " + document.activeElement.tagName;

// Scrolling the results with a finger leaves it up too.
await typeIn("a");
if (results().length !== 12) return "results for a: " + results().join();
await drag(drop, 0, -100, 200);
if (document.activeElement !== input) return "scrolling took the focus";

// Keys through plain links in the results, each in turn: elements Quillo's == cannot tell apart.
await typeIn("grace");
const res = [...drop.querySelectorAll("a[href], button")];
if (res.length !== 4 && res.length !== 5) return "items in the results: " + res.length;
const links = res.filter((x) => x.tagName === "A");
if (links.length !== 3) return "links in the results: " + links.length;
const press = (k) => document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
links[0].focus();
press("ArrowDown");
await wait(30);
if (document.activeElement !== links[1]) return "ArrowDown from the first link: " + document.activeElement.textContent;
press("ArrowDown");
await wait(30);
if (document.activeElement !== links[2]) return "ArrowDown from the second link: " + document.activeElement.textContent;
press("ArrowUp");
await wait(30);
if (document.activeElement !== links[1]) return "ArrowUp from the third link: " + document.activeElement.textContent;
input.focus();
await wait(30);

// Nothing found.
await typeIn("zz<b>");
if (status() !== "0 results") return status();
if ($(".ui-searchhead-none").textContent !== "Nobody by that name") return "empty text";
if (drop.querySelector("b")) return "text came out as markup";

// Clear keeps it open, with the focus.
await tap($(".ui-searchhead-clear"));
await wait(60);
if (input.value !== "" || !isOn()) return "clear";
if (document.activeElement !== input) return "clear took the focus";
if (recents().join() !== "Grace,Ben,Luis") return "recents after clear: " + recents().join();
if ($(".ui-searchhead-clear")) return "a clear button with nothing to clear";

// A recent search: fills the field, shows results, moves to the top, focus stays.
await tap($$(".ui-searchhead-pick")[2]);
await wait(60);
if (input.value !== "Luis") return "recent: " + input.value;
if (document.activeElement !== input) return "a recent search took the focus";
if (results().join() !== "Luis Ortega") return "recent's results: " + results().join();
if (!note().includes("sent: Luis;")) return note();
await typeIn("");
if (recents().join() !== "Luis,Grace,Ben") return "recents after a pick: " + recents().join();

// The keyboard's Search key: remembered, in any case a repeat, keyboard stays.
await typeIn("  ben ");
input.form.requestSubmit();
await wait(60);
if (!note().includes("sent: ben;")) return note();
if (document.activeElement !== input) return "Search took the focus";
await typeIn("");
if (recents().join() !== "ben,Luis,Grace") return "a repeat in another case: " + recents().join();

// Removing one, and the tap keeps the focus.
await tap($$(".ui-searchhead-forget")[1]);
await wait(60);
if (recents().join() !== "ben,Grace") return "remove: " + recents().join();
if (document.activeElement !== input) return "remove took the focus";

// Keys: down into the list, down again, up and back to the field.
input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
await wait(30);
const items = [...drop.querySelectorAll("button")];
if (document.activeElement !== items[0]) return "ArrowDown from the field: " + document.activeElement.className;
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== items[1]) return "ArrowDown in the list";
// From each place to the next, as elements that look alike must not read as one.
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== items[2]) return "ArrowDown twice in the list: " + items.indexOf(document.activeElement);
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== items[3]) return "ArrowDown three times: " + items.indexOf(document.activeElement);
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== items[2]) return "ArrowUp in the list: " + items.indexOf(document.activeElement);
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== items[1]) return "ArrowUp again: " + items.indexOf(document.activeElement);
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
await wait(30);
document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
await wait(30);
if (document.activeElement !== input) return "ArrowUp back to the field";

// The keyboard's cover: the last rows scroll clear of it. There is no keyboard to raise
// here, so visualViewport says what it would.
const vv = visualViewport, fake = (height, top, scale) => {
    Object.defineProperty(vv, "height", { configurable: true, get: () => height });
    Object.defineProperty(vv, "offsetTop", { configurable: true, get: () => top });
    Object.defineProperty(vv, "scale", { configurable: true, get: () => scale });
    vv.dispatchEvent(new Event("resize"));
};
fake(innerHeight - 300, 0, 1);
await wait(40);
if (box.style.getPropertyValue("--ui-searchhead-kb") !== "300px") return "cover: " + box.style.getPropertyValue("--ui-searchhead-kb");
if (getComputedStyle(drop).paddingBottom !== (device === "phone" ? "300px" : "0px")) return "padding: " + getComputedStyle(drop).paddingBottom;
// A tablet's panel stops above the keyboard instead, with no room wasted inside it.
if (device === "tablet" && drop.getBoundingClientRect().bottom > innerHeight - 300) return "the panel runs under the keyboard: " + drop.getBoundingClientRect().bottom;
fake(innerHeight - 300, 120, 1);
await wait(40);
if (box.style.getPropertyValue("--ui-searchhead-kb") !== "180px") return "cover with the page panned: " + box.style.getPropertyValue("--ui-searchhead-kb");
fake(innerHeight / 2, 0, 2);
await wait(40);
if (box.style.getPropertyValue("--ui-searchhead-kb") !== "0px") return "cover when zoomed: " + box.style.getPropertyValue("--ui-searchhead-kb");
delete vv.height; delete vv.offsetTop; delete vv.scale;
vv.dispatchEvent(new Event("resize"));

// Cancel: closed, empty, the keyboard let go, the focus on the heading.
await typeIn("ana");
await tap($(".ui-searchhead-cancel"));
await wait(250);
if (isOn() || input.value !== "") return "Cancel: " + input.value;
if (document.activeElement !== $(".ui-searchhead-title")) return "after Cancel the focus is on " + document.activeElement.tagName;
if (!/Query: ;/.test(note())) return "Cancel did not clear the search: " + note();
if (pageEl().hasAttribute("inert")) return "the screen stayed inert";

// Escape does too, and a second open starts empty, with its recents.
input.focus();
await wait(100);
if (!isOn()) return "focus did not open it";
await typeIn("x");
key(input, "Escape");
await wait(100);
if (isOn() || input.value !== "") return "Escape";
input.focus();
await wait(100);
if (recents().join() !== "ben,Grace") return "recents on a second open: " + recents().join();
key(input, "Escape");
await wait(50);

// On a tablet the screen shows behind the panel, and a tap on it closes the panel. On a
// phone the results cover it, so a tap there is in the results.
if (device === "tablet") {
    input.focus();
    await wait(60);
    await typeIn("an");
    const b = box.getBoundingClientRect();
    await fingers("touchStart", [{ x: b.left + 100, y: b.bottom - 100 }]);
    await fingers("touchEnd", []);
    await wait(250);
    if (isOn()) return "a tap beside the panel did not close it";
    if (!/picked: Grace Tan/.test(note())) return "the tap went through to the screen: " + note();
}

// Bad input: a blank search is not remembered, and a very long one is cut.
input.focus();
await wait(60);
await typeIn("   ");
input.form.requestSubmit();
await wait(40);
await typeIn("");
if (recents().join() !== "ben,Grace") return "a blank was remembered: " + recents().join();
await typeIn("q".repeat(5000));
input.form.requestSubmit();
await wait(60);
await typeIn("");
if (recents()[0].length !== 200) return "a long search: " + recents()[0].length;
await tap($(".ui-searchhead-drop-all"));
await wait(40);
if (recents().length !== 0) return "Clear: " + recents().length;
if (document.activeElement !== input) return "Clear took the focus";
key(input, "Escape");
await wait(50);

// Rotation: the text, the results and the focus stay.
input.focus();
await wait(60);
await typeIn("gr");
const w0 = innerWidth, h0 = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(300);
const turned = [input.value, document.activeElement === input, results().join()];
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (turned.join("|") !== "gr|true|Grace Tan") return "turned: " + turned.join("|");
await typeIn("");
key(input, "Escape");
await wait(60);

// delay: nothing until a pause, then the last text once; Clear does not wait.
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Wait for a pause in typing").click();
await wait(40);
input.focus();
await wait(60);
await typeIn("c");
await wait(120);
await typeIn("ca");
await wait(120);
await typeIn("car");
await wait(120);
if (!/Query: ;/.test(note())) return "delay: it did not wait: " + note();
await wait(350);
if (!/Query: car;/.test(note())) return "delay: it never came: " + note();
await typeIn("");
await wait(30);
if (!/Query: ;/.test(note())) return "delay: emptying waited: " + note();
key(input, "Escape");
await wait(60);

// on_recent: each change, once. (From here on, recents only change through what is pressed.)
const changed = () => Number(/recents changed (\d+)/.exec(note())[1]);
const c0 = changed();
input.focus();
await wait(60);
await typeIn("tan");
input.form.requestSubmit();
await wait(60);
if (changed() !== c0 + 1) return "on_recent: " + (changed() - c0);
await typeIn("");
key(input, "Escape");
await wait(60);

// Storage: what was used comes back when it is built again.
await wait(50);
localStorage.setItem(KEY, JSON.stringify(["one", "two", 3, "", null, "x".repeat(300)]));
await fresh();
box = $(".ui-searchhead"); input = $("#search-header-demo"); drop = $(".ui-searchhead-drop");
input.focus();
await wait(100);
if (recents().length !== 3 || recents()[0] !== "one" || recents()[1] !== "two" || recents()[2].length !== 200) return "stored recents: " + recents().join();
await typeIn("three");
input.form.requestSubmit();
await wait(80);
if (localStorage.getItem(KEY) === null || JSON.parse(localStorage.getItem(KEY))[0] !== "three") return "not stored: " + localStorage.getItem(KEY);
await typeIn("");
key(input, "Escape");
await wait(60);

// Garbage in storage is none at all: the recents given stand.
for (const bad of ["{not json", "42", '{"a":1}', "null", ""]) {
    localStorage.setItem(KEY, bad);
    await fresh();
    input = $("#search-header-demo"); drop = $(".ui-searchhead-drop");
    input.focus();
    await wait(100);
    if (recents().join() !== "Grace,Ben,Luis") return `stored ${bad}: ` + recents().join();
    key(input, "Escape");
    await wait(60);
}

// Storage that refuses, as a private window may: it works on, and nothing is thrown.
const getItem = Storage.prototype.getItem, setItem = Storage.prototype.setItem;
Storage.prototype.getItem = () => { throw new DOMException("refused", "SecurityError"); };
Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
await fresh();
input = $("#search-header-demo"); drop = $(".ui-searchhead-drop");
input.focus();
await wait(100);
const refused = recents().join();
await typeIn("still works");
input.form.requestSubmit();
await wait(80);
const sentAfter = note();
await tap($(".ui-searchhead-clear"));
await wait(60);
const after = recents().join();
// What comes after a refused write still runs: the callback and the focus.
await tap($$(".ui-searchhead-pick")[1]);
await wait(80);
const sent2 = note(), focused2 = document.activeElement === input;
await typeIn("");
// What comes after a refused read too: the cover of the keyboard.
const b2 = $(".ui-searchhead");
Object.defineProperty(visualViewport, "height", { configurable: true, get: () => innerHeight - 200 });
visualViewport.dispatchEvent(new Event("resize"));
await wait(40);
const cover2 = b2.style.getPropertyValue("--ui-searchhead-kb");
delete visualViewport.height;
visualViewport.dispatchEvent(new Event("resize"));
Storage.prototype.getItem = getItem;
Storage.prototype.setItem = setItem;
if (refused !== "Grace,Ben,Luis") return "storage refused: " + refused;
if (!sentAfter.includes("sent: still works;")) return "storage refused, on_submit: " + sentAfter;
if (after !== "still works,Grace,Ben,Luis") return "storage refused, after a search: " + after;
if (!sent2.includes("sent: Grace;") || !focused2) return "storage refused, a recent: " + sent2 + " " + focused2;
if (cover2 !== "200px") return "storage refused, the cover: " + cover2;
key(input, "Escape");
await wait(60);
localStorage.removeItem(KEY);
