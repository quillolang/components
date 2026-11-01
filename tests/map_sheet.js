// mobile
const host = () => $(".ui-mapsheet");
const sheet = () => $(".ui-mapsheet-sheet");
const body = () => $(".ui-mapsheet-body");
const grip = () => $(".ui-mapsheet-grip");
const stop = () => $(".map-sheet-demo-stop").textContent;
const chosen = () => $(".map-sheet-demo-chosen").textContent;
const pins = () => $$(".ui-mapsheet-pin");
const pin = (n) => pins().find((p) => p.textContent === String(n));
const row = (id) => $(`.ui-mapsheet-row[data-id="${id}"]`);
const shown = () => host().getBoundingClientRect().bottom - sheet().getBoundingClientRect().top;
for (let i = 0; i < 40 && pins().length === 0; i++) await wait(100);
await wait(400);

// Every place with a position has a pin, numbered as its row; the one with none is listed, and has none.
if (pins().length !== 17) return "pins: " + pins().length;
if (!pin(1).getAttribute("title").startsWith("A Brasileira")) return "pin 1: " + pin(1).getAttribute("title");
if (row(12).querySelector(".ui-mapsheet-note").textContent !== "No position") return "row 12: " + row(12).textContent;
if (row(5).querySelector(".ui-mapsheet-num").textContent !== "5") return "row number";
const pinBox = pin(1).getBoundingClientRect();
if (pinBox.width < 44 || pinBox.height < 44) return "pin size: " + pinBox.width;
if ($(".leaflet-control-attribution a")) return "the attribution has a link too small to press";

// What fits: all the pins stand clear of the sheet at the start.
const leftEdge = device === "tablet" ? sheet().getBoundingClientRect().right : 0;
const clear = () => { const top = device === "tablet" ? host().getBoundingClientRect().bottom : sheet().getBoundingClientRect().top; return pins().every((p) => { const b = p.getBoundingClientRect(); return b.top + 22 <= top + 1 && b.left + 22 >= leftEdge - 1; }); };
if (!clear()) return "a pin starts under the sheet";
if ($(".ui-mapsheet-count").textContent !== "17 of 17 in view") return "count: " + $(".ui-mapsheet-count").textContent;

// A pin pressed, by a real tap: its row is marked, and in sight.
const press = pin(3);
await tap(press);
await wait(450);
if (row(3).getAttribute("aria-current") !== "true") return "pin to row: " + $$(".ui-mapsheet-row[aria-current]").map((r) => r.dataset.id) + " chosen " + chosen();
if (chosen() !== "Miradouro de Santa Luzia") return "on_pick: " + chosen();
if (!press.classList.contains("ui-mapsheet-on")) return "the pin is not marked";
// Centring pin 3 can take pin 11 out of sight, so all of them come back first.
await tap($(".ui-mapsheet-all"));
await wait(500);
await tap(pin(11));
await wait(450);
if (row(11).getAttribute("aria-current") !== "true" || row(3).hasAttribute("aria-current")) return "another pin: " + $$(".ui-mapsheet-row[aria-current]").map((r) => r.dataset.id);
if (pin(3).classList.contains("ui-mapsheet-on")) return "the first pin stayed marked";
const rb = row(11).getBoundingClientRect(), bb = body().getBoundingClientRect();
if (rb.top < bb.top - 1 || rb.top > bb.bottom - 30) return `the row was not scrolled to: ${rb.top} in ${bb.top}-${bb.bottom}`;

// A row pressed: its pin comes to the middle of what the sheet leaves showing.
await tap(row(5));
await wait(600);
if (chosen() !== "Castelo de Sao Jorge" || row(5).getAttribute("aria-current") !== "true") return "row: " + chosen();
const middleOf = () => {
    const hb = host().getBoundingClientRect(), sb = sheet().getBoundingClientRect();
    return device === "tablet" ? { x: (sb.right + hb.right) / 2, y: (hb.top + hb.bottom) / 2 } : { x: (hb.left + hb.right) / 2, y: (hb.top + sb.top) / 2 };
};
const onMiddle = (n) => { const b = pin(n).getBoundingClientRect(), m = middleOf(); return Math.hypot(b.left + 22 - m.x, b.top + 22 - m.y); };
if (onMiddle(5) > 4) return "the pin is not in the middle of the view: " + onMiddle(5);
if (!pin(5).classList.contains("ui-mapsheet-on")) return "row to pin";

// From the page.
await tap($(".map-sheet-demo-page"));
await wait(600);
if (row(10).getAttribute("aria-current") !== "true" || onMiddle(10) > 4) return "from the page: " + onMiddle(10);

// Zoom by button; pins out of sight dim their rows and the count says so.
await tap($(".ui-mapsheet-all"));
await wait(500);
await tap($(".ui-mapsheet-zoom-in"));
await wait(600);
await tap($(".ui-mapsheet-zoom-in"));
await wait(600);
await tap($(".ui-mapsheet-zoom-in"));
await wait(600);
const m1 = /^(\d+) of 17 in view$/.exec($(".ui-mapsheet-count").textContent);
if (!m1 || +m1[1] >= 17) return "zoomed count: " + $(".ui-mapsheet-count").textContent;
const dim = $$(".ui-mapsheet-row[data-seen='no']").length;
if (dim !== 17 - +m1[1]) return `dimmed ${dim} with ${m1[1]} in view`;
await tap($(".ui-mapsheet-all"));
await wait(600);
if ($(".ui-mapsheet-count").textContent !== "17 of 17 in view") return "fit again: " + $(".ui-mapsheet-count").textContent;

// A real drag of the map under a finger moves the pins.
const before = pin(1).getBoundingClientRect().left;
const mapEl = $(".leaflet-container");
const free = device === "tablet" ? { x: host().getBoundingClientRect().right - 120, y: 300 } : { x: 195, y: 120 };
await fingers("touchStart", [free]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: free.x + i * 5, y: free.y }]); await wait(16); }
await wait(150);
await fingers("touchEnd", []);
await wait(400);
const movedBy = pin(1).getBoundingClientRect().left - before;
if (Math.abs(movedBy - 40) > 6) return "the map drag moved pins by " + movedBy;

if (device === "tablet") {
    // A tablet has a card down the side, at full height, with nothing to drag.
    if (getComputedStyle(grip()).display !== "none") return "a grip on a tablet";
    const s = sheet().getBoundingClientRect(), h = host().getBoundingClientRect();
    if (s.width !== 340 || s.top - h.top !== 12 || h.bottom - s.bottom !== 12) return `side card: ${s.width} ${s.top} ${s.bottom}`;
    await drag($(".ui-mapsheet-head"), 0, 200, 300);
    if (sheet().getBoundingClientRect().top - host().getBoundingClientRect().top !== 12) return "dragged a side card";
}

// The rest is a phone's. In a function of its own, as a plain `return` here would skip the checks
// the harness runs after a test's last line.
const asPhone = async () => {
// As a phone. It starts at half.
const H = sheet().offsetHeight;
if (Math.abs(shown() - H / 2) > 2) return `half: ${shown()} of ${H}`;

// A drag that falls short: down 40, and it springs back.
await drag(grip(), 0, 40, 500);
await wait(450);
if (Math.abs(shown() - H / 2) > 2 || stop() !== "half") return "short drag: " + shown() + stop();
// Down far, slowly: nearest stop is peek. More of the map shows.
await drag(grip(), 0, Math.round(H / 2) - 130, 900);
await wait(450);
if (stop() !== "peek" || Math.abs(shown() - 116) > 2) return "to peek: " + stop() + " " + shown();
// A short flick up goes up one stop.
await drag(grip(), 0, -120, 60);
await wait(450);
if (stop() !== "half") return "flick up: " + stop() + " " + shown();
await drag(grip(), 0, -120, 60);
await wait(450);
if (stop() !== "full" || Math.abs(shown() - H) > 2) return "flick to full: " + stop() + " " + shown();

// Past the top it resists and comes back: 12 px of room above, and the finger goes 60 up.
const g = middle(grip());
await fingers("touchStart", [g]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: g.x, y: Math.max(1, g.y - i * 3) }]); await wait(16); }
await wait(120);
const over = shown();
await fingers("touchEnd", []);
await wait(450);
if (!(over > H && over < H + 40)) return `past the top: ${over} of ${H}`;
if (Math.abs(shown() - H) > 2 || stop() !== "full") return "after pulling past the top: " + shown();

// The system takes the gesture: back at its stop.
const p2 = middle($(".ui-mapsheet-head"));
await fingers("touchStart", [p2]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p2.x, y: p2.y + i * 20 }]); await wait(16); }
const during = sheet().style.transform;
await fingers("touchCancel", []);
await wait(450);
if (during === "" ) return "the sheet did not follow the finger";
if (Math.abs(shown() - H) > 2 || sheet().style.transform !== "") return "cancelled: " + shown();

// State changing under a held finger leaves the drag where it is: a row marked, and the map
// moved, while the sheet is held down. Back at half, then held 60 px lower.
key(grip(), "ArrowDown");
await wait(450);
const heldAt = middle(grip());
await fingers("touchStart", [heldAt]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: heldAt.x, y: heldAt.y + i * 10 }]); await wait(16); }
await wait(60);
const heldTransform = sheet().style.transform, heldTop = sheet().getBoundingClientRect().top;
row(6).click();
await wait(120);
$(".ui-mapsheet-zoom-in").click();
await wait(450);
const afterTransform = sheet().style.transform, afterTop = sheet().getBoundingClientRect().top, marked = row(6).getAttribute("aria-current");
await fingers("touchMove", [{ x: heldAt.x, y: heldAt.y + 70 }]);
await wait(40);
const followed = sheet().getBoundingClientRect().top;
await fingers("touchCancel", []);
await wait(450);
if (heldTransform === "" || afterTransform !== heldTransform || Math.abs(afterTop - heldTop) > 1) return `a state change moved the sheet: ${heldTransform} to ${afterTransform}, ${heldTop} to ${afterTop}`;
if (marked !== "true") return "no state changed during the drag";
if (Math.abs(followed - heldTop - 10) > 2) return `the drag did not go on after the change: ${heldTop} to ${followed}`;
if (stop() !== "half" || Math.abs(shown() - H / 2) > 2 || sheet().style.transform !== "") return "after the held drag: " + stop() + " " + shown();
key(grip(), "ArrowUp");
await wait(450);

// At full the list scrolls under a finger, and the sheet stays.
body().scrollTop = 0;
await wait(60);
await drag(row(8), 0, -260, 500);
await wait(500);
const scrolled = body().scrollTop;
if (!(scrolled > 120)) return "the list did not scroll: " + scrolled;
if (stop() !== "full" || Math.abs(shown() - H) > 2) return "the sheet moved with the list: " + stop();
// Pulled down, it scrolls back first, and the sheet stays.
await drag(row(9), 0, 70, 500);
await wait(500);
if (!(body().scrollTop < scrolled) || stop() !== "full") return "scrolling back: " + body().scrollTop + " " + stop();

// With the list at its top a drag down moves the sheet instead.
body().scrollTop = 0;
await wait(60);
await drag(row(3), 0, 200, 300);
await wait(450);
if (stop() === "full") return "a drag down on the list at its top: " + stop();
if (body().scrollTop !== 0) return "the list scrolled instead";

// The same finger: the list scrolls to its top, then the sheet takes over, in one drag.
for (let i = 0; i < 3 && stop() !== "full"; i++) { await tap(grip()); await wait(450); }
body().scrollTop = 40;
await wait(60);
await drag(row(4), 0, 320, 700);
await wait(500);
if (body().scrollTop !== 0) return "one drag: the list did not reach its top: " + body().scrollTop;
if (stop() === "full") return "one drag: the sheet did not take over";

// At half, a drag up on the list moves the sheet, not the list.
const rowNow = row(2);
await tap(grip());
await wait(450);
if (stop() !== "half" && stop() !== "full" && stop() !== "peek") return "stop: " + stop();
for (let i = 0; i < 3 && stop() !== "half"; i++) { await tap(grip()); await wait(450); }
await drag(rowNow, 0, -Math.round(H / 2) + 40, 800);
await wait(450);
if (stop() !== "full" || body().scrollTop !== 0) return "a drag up on the list: " + stop() + " " + body().scrollTop;

// The handle: a tap, and keys, the equals of the drag.
await tap(grip());
await wait(450);
if (stop() !== "peek") return "tap from full wraps to peek: " + stop();
grip().focus();
key(grip(), "ArrowUp");
await wait(450);
if (stop() !== "half") return "ArrowUp: " + stop();
key(grip(), "ArrowUp");
await wait(450);
if (stop() !== "full") return "ArrowUp again: " + stop();
key(grip(), "ArrowUp");
await wait(100);
if (stop() !== "full") return "past the top: " + stop();
key(grip(), "ArrowDown");
await wait(450);
if (stop() !== "half") return "ArrowDown: " + stop();

// A row pressed at full comes down to half, so that its pin can be seen.
key(grip(), "ArrowUp");
await wait(450);
await tap(row(2));
await wait(650);
if (stop() !== "half") return "a row at full: " + stop();
if (onMiddle(2) > 4) return "the pin at half: " + onMiddle(2);
// A pin pressed at peek brings the sheet up to show its row.
key(grip(), "ArrowDown");
await wait(650);
if (onMiddle(2) > 4) return "the pin stays in the middle as the sheet moves: " + onMiddle(2);
await tap(pin(2));
await wait(650);
if (stop() !== "half") return "a pin at peek: " + stop();

// Turned: the stop and the mark stay, and it becomes a side card.
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await wait(500);
const turned = [sheet().getBoundingClientRect().width, row(2).getAttribute("aria-current")];
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await wait(600);
if (turned[0] !== 340 || turned[1] !== "true") return "turned: " + turned;
if (stop() !== "half" || Math.abs(shown() - sheet().offsetHeight / 2) > 2) return "after turning back: " + stop() + " " + shown();

// No script: the list works, and it says so.
const hadL = window.L;
await tap($(".map-sheet-demo-toggle"));
await wait(100);
delete window.L;
await tap($(".map-sheet-demo-toggle"));
await wait(500);
window.L = hadL;
if ($(".ui-mapsheet-nomap")?.textContent !== "The map could not load. The list still works.") return "no script: " + $(".ui-mapsheet-nomap")?.textContent;
await tap(row(4));
await wait(300);
if (row(4).getAttribute("aria-current") !== "true" || chosen() !== "Se de Lisboa") return "no script, a row: " + chosen();
const hh = sheet().offsetHeight;
await drag(grip(), 0, Math.round(hh / 2) - 130, 900);
await wait(450);
if (stop() !== "peek") return "no script, the drag: " + stop();
await tap($(".map-sheet-demo-toggle"));
await wait(100);
await tap($(".map-sheet-demo-toggle"));
await wait(400);
};
if (device === "phone") { const wrong = await asPhone(); if (wrong) return wrong; }
