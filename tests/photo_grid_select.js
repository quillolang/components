// mobile
const cell = (i) => $(`.ui-pgsel-cell[data-i="${i}"]`);
const on = () => $$(".ui-pgsel-on").map((c) => Number(c.dataset.i));
const count = () => $(".ui-pgsel-count").textContent;
const note = () => $("#pgsel-demo-note").textContent;
const picked = () => note().match(/Picked (.*); opened/)[1];
const box = $(".ui-pgsel-scroll");
const mode = () => $(".ui-pgsel-mode");
const button = (t) => $$(".ui-pgsel-btn").find((b) => b.textContent === t);
const centre = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const lift = async () => { await fingers("touchEnd", []); await wait(160); };
const slide = async (from, to, n = 6) => { for (let i = 1; i <= n; i++) { await fingers("touchMove", [{ x: from.x + (to.x - from.x) * i / n, y: from.y + (to.y - from.y) * i / n }]); await wait(16); } await wait(40); };
const cols = (() => { const y = cell(0).getBoundingClientRect().top; return $$(".ui-pgsel-section")[0].querySelectorAll(".ui-pgsel-cell").length && [...$$(".ui-pgsel-section")[0].querySelectorAll(".ui-pgsel-cell")].filter((c) => c.getBoundingClientRect().top === y).length; })();

// The pure parts, by hand. 73 usable, newest month first, no date last, bad rows gone.
if (count() !== "73 photos") return "73 photos: " + count();
if ($$(".ui-pgsel-month h3").map((h) => h.textContent).join() !== "October 2026,September 2026,August 2026,No date") return "months: " + $$(".ui-pgsel-month h3").map((h) => h.textContent).join();
if ($$(".ui-pgsel-section").map((s) => s.querySelectorAll(".ui-pgsel-cell").length).join() !== "18,40,14,1") return "photos in each: " + $$(".ui-pgsel-section").map((s) => s.querySelectorAll(".ui-pgsel-cell").length).join();
if (cell(0).getAttribute("aria-label") !== "Photo 117") return "newest first: " + cell(0).getAttribute("aria-label");
if (Math.round(cell(0).offsetWidth) !== Math.round(cell(0).offsetHeight)) return "square: " + cell(0).offsetWidth + "x" + cell(0).offsetHeight;
if (cell(0).offsetWidth < 44) return "a finger's width";
const gap = cell(1).getBoundingClientRect().left - cell(0).getBoundingClientRect().right;
if (gap > (device === "phone" ? 2.5 : 4.5)) return "tight: " + gap;
if (device === "phone" && cols !== 4) return "four across on a phone: " + cols;
if (device === "tablet") {
    if (cols < 5) return "more across on a tablet: " + cols;
    if (cell(0).offsetWidth < 124) return "and larger: " + cell(0).offsetWidth;
    if ($(".ui-pgsel-month").getBoundingClientRect().right > cell(0).getBoundingClientRect().left) return "the month beside the photos";
}
if (getComputedStyle(cell(0)).touchAction !== "pan-y") return "up and down stay the browser's: " + getComputedStyle(cell(0)).touchAction;
if (getComputedStyle(cell(0)).webkitTouchCallout !== "none" && getComputedStyle(cell(0)).userSelect !== "none") return "no callout or selection on a photo";

// Not picking, a tap opens.
await tap(cell(0));
if (!note().endsWith("opened 117 at 0")) return "on_open: " + note();
if (count() !== "73 photos") return "and picks nothing";

// Select: tap to pick, tap to let go.
await tap(mode());
if (count() !== "0 selected" || mode().textContent !== "Cancel") return "Select: " + count();
await tap(cell(0));
if (on().join() !== "0" || count() !== "1 selected") return "a tap picks: " + on().join();
if (cell(0).getAttribute("aria-pressed") !== "true") return "aria-pressed";
if (picked() !== "117") return "on_change: " + picked();
if (note().indexOf("opened 117 at 0") < 0) return "picking does not open";
await tap(cell(0));
if (on().length !== 0 || picked() !== "") return "a tap lets go: " + on().join();

// A run: sideways, then down the rows, then back. Counted live, kept at the lift.
const a = centre(cell(1));
await fingers("touchStart", [a]);
await slide(a, centre(cell(3)));
if (on().join() !== "1,2,3") return "a run across a row: " + on().join();
if (count() !== "3 selected") return "the count goes with it: " + count();
if (picked() !== "") return "the page is told at the lift: " + picked();
await slide(centre(cell(3)), centre(cell(3 + cols)));
const wantDown = Array.from({ length: 3 + cols }, (_, i) => i + 1).join();
if (on().join() !== wantDown) return "down a row takes everything between: " + on().join();
await slide(centre(cell(3 + cols)), centre(cell(2)));
if (on().join() !== "1,2") return "back lets go: " + on().join();
if (count() !== "2 selected") return "the count too: " + count();
await lift();
if (on().join() !== "1,2") return "kept at the lift: " + on().join();
if (picked() !== "116 115") return "on_change after the lift: " + picked();

// Started on a picked photo, a run unpicks. What it does not reach stays.
await tap(cell(5));
const b = centre(cell(1));
await fingers("touchStart", [b]);
await slide(b, centre(cell(2)));
if (on().join() !== "5") return "a run from a picked one lets go: " + on().join();
await lift();
if (picked() !== "112") return "kept: " + picked();

// The system taking it back: as it was.
const c = centre(cell(0));
await fingers("touchStart", [c]);
await slide(c, centre(cell(3)));
if (on().length < 3) return "the run shows";
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(150);
if (on().join() !== "5" || count() !== "1 selected" || picked() !== "112") return "a cancelled run changes nothing: " + on().join() + " " + count();

// Up and down first is a scroll, even when picking.
const top0 = box.scrollTop;
const d = centre(cell(8));
await fingers("touchStart", [d]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: d.x, y: d.y - i * 20 }]); await wait(16); }
await wait(120);
await lift();
await wait(200);
if (box.scrollTop <= top0 + 40) return "a finger going up scrolls: " + box.scrollTop;
if (on().join() !== "5") return "and picks nothing: " + on().join();
box.scrollTop = 0; await wait(120);

// Cancel leaves picking and lets go of everything.
await tap(mode());
if (count() !== "73 photos" || on().length !== 0 || picked() !== "") return "Cancel: " + count();

// A long press starts picking, and from there the finger is ours in every direction,
// where it would have been a scroll: the grid must not move.
const e0 = centre(cell(0));
await fingers("touchStart", [e0]);
await wait(600);
if (on().join() !== "0" || mode().textContent !== "Cancel") return "a long press picks: " + on().join();
const st = box.scrollTop;
await slide(e0, centre(cell(cols * 2)));
if (box.scrollTop !== st) return "the grid holds still after a long press: " + box.scrollTop + " from " + st;
const wantLong = Array.from({ length: cols * 2 + 1 }, (_, i) => i).join();
if (on().join() !== wantLong) return "and the run goes down the rows: " + on().join();
await lift();
if (on().join() !== wantLong) return "kept: " + on().join();
if (note().indexOf("opened 117 at 0") < 0) return "a long press opens nothing";
await tap(mode());

// A photo pressed and let go early is a tap, not a long press.
await fingers("touchStart", [e0]); await wait(150); await fingers("touchEnd", []); await wait(500);
if (mode().textContent !== "Select") return "a short press does not pick";
if (!note().endsWith("opened 117 at 0")) return "it opens: " + note();
// A press that moves is no long press.
await fingers("touchStart", [e0]);
await fingers("touchMove", [{ x: e0.x, y: e0.y - 30 }]);
await wait(600);
await lift();
if (mode().textContent !== "Select") return "a press that moves does not pick";
box.scrollTop = 0; await wait(150);

// At the edge the grid moves on, and the run goes with it.
await tap(mode());
const edgeY = box.getBoundingClientRect().bottom - 24;
const s0 = box.scrollTop;
const f = centre(cell(0));
await fingers("touchStart", [f]);
await slide(f, { x: centre(cell(2)).x, y: f.y });
await slide({ x: centre(cell(2)).x, y: f.y }, { x: centre(cell(2)).x, y: edgeY });
await wait(800);
if (box.scrollTop <= s0 + 80) { await lift(); return "it scrolls by itself: " + box.scrollTop; }
const far = on().length;
await lift();
if (far < cols * 3) return "and picks as it goes: " + far;
if (count() !== far + " selected") return "and counts: " + count();
await tap(mode());
box.scrollTop = 0; await wait(150);

// Month buttons, Select all, Clear.
await tap($('.ui-pgsel-btn[aria-label="Select October 2026"]'));
if (count() !== "18 selected" || mode().textContent !== "Cancel") return "a month: " + count();
await tap($('.ui-pgsel-btn[aria-label="Clear October 2026"]'));
if (count() !== "0 selected") return "and back: " + count();
await tap(button("Select all"));
if (count() !== "73 selected") return "all: " + count();
await tap(button("Clear"));
if (count() !== "0 selected") return "clear: " + count();
await tap(mode());

// The keys. One stop for the grid; the arrows walk it.
if ($$(".ui-pgsel-cell").filter((x) => x.tabIndex === 0).length !== 1) return "one tab stop";
cell(0).focus();
key(cell(0), "ArrowRight"); await wait(60);
if (document.activeElement !== cell(1)) return "ArrowRight: " + document.activeElement.dataset.i;
key(cell(1), "ArrowDown"); await wait(60);
if (document.activeElement !== cell(1 + cols)) return "ArrowDown is a row: " + document.activeElement.dataset.i + " with " + cols;
key(cell(1 + cols), "ArrowUp"); await wait(60);
key(cell(1), " "); await wait(60);
if (on().join() !== "1" || mode().textContent !== "Cancel") return "Space picks: " + on().join();
cell(1).dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true, cancelable: true })); await wait(60);
if (on().join() !== "1,2") return "Shift and an arrow picks as it goes: " + on().join();
key(cell(2), "Home"); await wait(60);
if (document.activeElement !== cell(0)) return "Home";
key(cell(0), "End"); await wait(60);
if (document.activeElement !== cell(72)) return "End: " + document.activeElement.dataset.i;
key(cell(72), "ArrowRight"); await wait(60);
if (document.activeElement !== cell(72)) return "stops at the end";
await tap(mode());
box.scrollTop = 0;

// The page's own: a new `selected`, and `reveal`.
await tap($("#pgsel-demo-give")); await wait(150);
if (on().join() !== "16,17" || count() !== "2 selected") return "selected from the page: " + on().join();
await tap(mode());
await tap($("#pgsel-demo-reveal")); await wait(250);
const i230 = $$(".ui-pgsel-cell").find((x) => x.getAttribute("aria-label") === "Photo 230");
if (document.activeElement !== i230) return "reveal gives focus: " + document.activeElement.className;
const rr = i230.getBoundingClientRect(), br = box.getBoundingClientRect();
if (rr.top < br.top || rr.bottom > br.bottom) return "and brings it into view";

// A turn keeps the same photo at the top.
const target = cell(30);
box.scrollTop += target.getBoundingClientRect().top - box.getBoundingClientRect().top - 50;
await wait(250);
const topCell = (() => { const r = box.getBoundingClientRect(); const c2 = document.elementFromPoint(r.right - 30, r.top + 60).closest(".ui-pgsel-cell"); return c2; })();
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await wait(400);
const r1 = box.getBoundingClientRect(), t1 = topCell.getBoundingClientRect();
const visible = t1.top >= r1.top - 2 && t1.top < r1.top + 80;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await wait(400);
if (!visible) return "turned, the same photo is at the top: " + t1.top + " in " + r1.top;
const r2 = box.getBoundingClientRect(), t2 = topCell.getBoundingClientRect();
if (!(t2.top >= r2.top - 2 && t2.top < r2.top + 90)) return "turned back, too: " + t2.top + " in " + r2.top;
