// mobile
try { localStorage.removeItem("ui-filtsh-demo-shoes"); } catch {}
const again = $("#filter-demo-again");
await tap(again); await wait(300);
const dlg = () => $("dialog.ui-cartsh"), open = () => $(".ui-filtsh-open");
const show = () => dlg().querySelector(".ui-filtsh-acts .ui-btn-full");
const list = () => $("#filter-demo-list").textContent;
const row = (name) => [...dlg().querySelectorAll(".ui-filtsh-opt")].find((l) => l.querySelector("span").textContent === name);
const n = (name) => row(name).querySelector(".ui-filtsh-n").textContent;
const counts = (names) => names.map(n).join(" ");
if (open().textContent.trim() !== "Filters") return "no count at the start: " + open().textContent;
await tap(open()); await wait(300);
if (!dlg().open) return "the button opens it";
if (show().textContent.trim() !== "Show 8 shoes") return "at the start: " + show().textContent;
// Known counts over the eight shoes.
if (counts(["Northpeak", "Hollis", "Ace & Co"]) !== "3 3 2") return "brands: " + counts(["Northpeak", "Hollis", "Ace & Co"]);
if (counts(["7", "8", "9", "10", "11", "12"]) !== "2 4 5 4 2 0") return "sizes: " + counts(["7", "8", "9", "10", "11", "12"]);
if (!row("12").querySelector("input").disabled) return "an option giving none is off";
// Tick Hollis: sizes narrow to its shoes; the brand's own numbers stay, as ticking another would widen.
await tap(row("Hollis"));
if (show().textContent.trim() !== "Show 3 shoes") return "Hollis: " + show().textContent;
if (counts(["Northpeak", "Hollis", "Ace & Co"]) !== "3 3 2") return "a facet's own numbers stay: " + counts(["Northpeak", "Hollis", "Ace & Co"]);
if (counts(["7", "8", "9", "10"]) !== "2 3 2 0") return "sizes of Hollis: " + counts(["7", "8", "9", "10"]);
if (!row("10").querySelector("input").disabled) return "size 10 has no Hollis";
// Either brand.
await tap(row("Ace & Co"));
if (show().textContent.trim() !== "Show 5 shoes") return "two brands widen: " + show().textContent;
// Size 9 narrows: Canvas high, Court classic, Slip-on.
await tap(row("9"));
if (show().textContent.trim() !== "Show 3 shoes") return "and a size: " + show().textContent;
// One result is singular.
const flag = () => dlg().querySelector('input[id$="-in_stock"]');
const low = () => dlg().querySelector('input[id$="-price-low"]'), high = () => dlg().querySelector('input[id$="-price-high"]');
flag().click(); await wait(100);
if (show().textContent.trim() !== "Show 2 shoes") return "in stock only: " + show().textContent;
low().focus(); type(low(), "80"); await wait(100);
if (document.activeElement !== low()) return "typing keeps the focus";
if (show().textContent.trim() !== "Show 1 shoe") return "from 80, one: " + show().textContent;
// Bad input says so and holds Show.
type(low(), "cheap"); await wait(100);
if (!show().disabled || !/Enter a number/.test(dlg().textContent)) return "bad text holds Show";
type(low(), "100"); type(high(), "90"); await wait(100);
if (!show().disabled || !/lowest is above/.test(dlg().textContent)) return "low above high holds Show";
type(low(), "55.00"); type(high(), "90.00"); await wait(100);
// Nothing outside: closing without Show drops the draft.
if (show().textContent.trim() !== "Show 2 shoes") return "55 to 90: " + show().textContent;
await tap(dlg().querySelector(".ui-cartsh-x")); await wait(150);
if (dlg().open) return "the button closes";
if (open().querySelector(".ui-filtsh-count")) return "closing applies nothing";
if (list().indexOf("8 shown") !== 0) return "the list behind is untouched: " + list();
await tap(open()); await wait(300);
if (show().textContent.trim() !== "Show 8 shoes") return "the draft went: " + show().textContent;
if (row("Hollis").querySelector("input").checked) return "ticks went";
// Apply.
await tap(row("Hollis")); await tap(row("Black"));
if (show().textContent.trim() !== "Show 2 shoes") return "Hollis black: " + show().textContent;
const clear = dlg().querySelector(".ui-filtsh-acts .ui-btn-outline");
if (clear.disabled) return "Clear is on with ticks";
await tap(show()); await wait(200);
if (dlg().open) return "Show closes it";
if (list() !== "2 shown: Canvas high, Slip-on") return "on_apply: " + list();
if (open().querySelector(".ui-filtsh-count").textContent !== "2") return "the button counts 2: " + open().textContent;
// Saved: the next visit starts from it, and tells the caller.
if (localStorage.getItem("ui-filtsh-demo-shoes") !== '{"brand":["Hollis"],"colour":["Black"]}') return "saved: " + localStorage.getItem("ui-filtsh-demo-shoes");
await tap(again); await wait(400);
if (open().querySelector(".ui-filtsh-count")?.textContent !== "2") return "the count came back: " + open().textContent;
if (list() !== "2 shown: Canvas high, Slip-on") return "the list came back: " + list();
await tap(open()); await wait(300);
if (!/from last time/.test(dlg().textContent)) return "it says they are from last time";
if (!row("Black").querySelector("input").checked) return "ticks came back";
// Clear, then Show.
await tap(dlg().querySelector(".ui-filtsh-acts .ui-btn-outline"));
if (show().textContent.trim() !== "Show 8 shoes") return "Clear: " + show().textContent;
if (row("Black").querySelector("input").checked) return "Clear unticks";
await tap(show()); await wait(200);
if (open().querySelector(".ui-filtsh-count")) return "no count now";
if (list().indexOf("8 shown") !== 0) return "all shown: " + list();
// A saved text that makes no sense, and one that has gone out of date.
for (const bad of ["{not json", "[1,2]", '{"brand":"Hollis","sizes":[1],"price":{"low":"x"},"in_stock":"yes"}']) {
    localStorage.setItem("ui-filtsh-demo-shoes", bad);
    await tap(again); await wait(300);
    if (open().querySelector(".ui-filtsh-count")) return "bad saved text is dropped: " + bad + " " + open().textContent;
}
localStorage.setItem("ui-filtsh-demo-shoes", '{"brand":["Hollis","Gone"],"constructor":["x"]}');
await tap(again); await wait(300);
if (open().querySelector(".ui-filtsh-count")?.textContent !== "1") return "an option gone is dropped";
// Storage that throws, as a full or private one does: the filter still applies, with nothing in the console.
const set0 = Storage.prototype.setItem, get0 = Storage.prototype.getItem;
Storage.prototype.setItem = () => { throw new DOMException("full", "QuotaExceededError"); };
await tap(open()); await wait(300);
await tap(row("Black"));
await tap(show()); await wait(250);
Storage.prototype.setItem = set0;
if (dlg().open) { return "Show closes even when nothing can be kept"; }
if (open().querySelector(".ui-filtsh-count")?.textContent !== "2") return "it applies even when nothing can be kept: " + open().textContent;
Storage.prototype.getItem = () => { throw new DOMException("no", "SecurityError"); };
await tap(again); await wait(300);
Storage.prototype.getItem = get0;
if (open().querySelector(".ui-filtsh-count")) return "unreadable storage starts empty";
await tap(open()); await wait(300);
await tap(dlg().querySelector(".ui-cartsh-x")); await wait(150);
// A phone app keeps it itself and passes it in, whatever localStorage says: from the first render.
await tap($("#filter-demo-app")); await wait(300);
if (open().querySelector(".ui-filtsh-count")?.textContent !== "1") return "saved comes in as a prop: " + open().textContent;
if (list() !== "2 shown: Road racer, Court pro") return "on_apply at the start: " + list();
await tap(open()); await wait(300);
if (!/from last time/.test(dlg().textContent) || !row("Red").querySelector("input").checked) return "ticks from the prop";
await tap(dlg().querySelector(".ui-cartsh-x")); await wait(150);
// A tablet has the facets side by side.
await tap(open()); await wait(300);
const fs = [...dlg().querySelectorAll(".ui-filtsh-facets > div")].map((f) => Math.round(f.getBoundingClientRect().left));
if (device === "tablet" && new Set(fs).size !== 2) return "two columns on a tablet: " + fs;
if (device === "phone" && new Set(fs).size !== 1) return "one column on a phone: " + fs;
// Rotation keeps the ticks.
await tap(row("Black"));
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(250);
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(250);
if (!row("Black").querySelector("input").checked || !dlg().open) return "rotation keeps it";
await tap(dlg().querySelector(".ui-cartsh-x")); await wait(150);
localStorage.removeItem("ui-filtsh-demo-shoes");
