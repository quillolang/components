// mobile
const dlg = () => $(".ui-seatps-dlg");
const seat = (id) => $(`[data-seat="${id}"]`);
const view = () => $(".ui-seatps-view");
const plane = () => $(".ui-seatps-plane");
const held = () => $(".ui-seatps-held").textContent;
const note = () => $(".ui-seatps-note").textContent;
const matrix = () => new DOMMatrix(getComputedStyle(plane()).transform);
const zoom = () => matrix().a;
const open = async () => { await tap($(".ui-seatps-open")); await wait(450); };

// The cabin is not in the page until it is asked for.
if ($$("[data-seat]").length !== 0) return "seats before opening: " + $$("[data-seat]").length;
await open();
if (!dlg().open) return "it did not open";
// 24 rows of 10 seats.
if ($$("[data-seat]").length !== 240) return "seats: " + $$("[data-seat]").length;
// Row 13 is skipped, so the rows run 1 to 12, then 14 to 25.
if (!seat("12A") || seat("13A") || !seat("25K")) return "skip_rows";
if (seat("1A").getAttribute("aria-disabled") !== "true") return "1A is taken";
if (seat("3C").getAttribute("aria-label") !== "Row 3, seat C, aisle, accessible, €42.50") return "label: " + seat("3C").getAttribute("aria-label");
if (seat("12A").getAttribute("aria-label") !== "Row 12, seat A, window, exit row, €55.00") return "exit label: " + seat("12A").getAttribute("aria-label");
if (seat("7E").getAttribute("aria-label") !== "Row 7, seat E, middle, €18.00") return "middle: " + seat("7E").getAttribute("aria-label");

// The cabin fits the width: ten seats and two aisles are wider than a phone, so it starts small.
const vw = view().clientWidth, pw = plane().offsetWidth;
const fit = Math.min(1, vw / pw);
if (Math.abs(zoom() - fit) > 0.01) return `fit: ${zoom()} wanted ${fit}`;
if (device === "phone" && !(fit * 44 < 40)) return "the phone's seats should start too small: " + fit * 44;

if (device === "phone") {
    // Too small to be sure of: the first tap zooms in on the seat, and takes nothing.
    await tap(seat("7D"));
    await wait(450);
    if (Math.abs(zoom() - 1) > 0.01) return "first tap zoom: " + zoom();
    if (held() !== "Pick 2 seats.") return "the first tap took it: " + held();
    if (seat("7D").getBoundingClientRect().width !== 44) return "seat size: " + seat("7D").getBoundingClientRect().width;
} else {
    await tap($(".ui-seatps-more"));
    await wait(450);
}

// Now it is taken: 7D, in no band, 18.00. 7E and 7C... the aisle is on its left.
await tap(seat("7D"));
if (seat("7D").getAttribute("aria-pressed") !== "true") return "7D: " + held();
if (held() !== "7D. €18.00.") return "held: " + held();
if (note() !== "Beside you: an empty seat.") return "beside: " + note();
if ($(".seat-picker-sheet-demo-changes").textContent !== "1") return "on_change: " + $(".seat-picker-sheet-demo-changes").textContent;

// A taken seat cannot be had.
await tap(seat("6C"));
if (seat("6C").getAttribute("aria-pressed") === "true" || !note().includes("That seat is taken.")) return "taken: " + note();

// The neighbour, across no aisle: together.
await tap(seat("7E"));
if (held() !== "7D, 7E. €36.00.") return "two: " + held();
if (note() !== "Beside you: your party and an empty seat. Your party sits together.") return "together: " + note();

// A third press gives up the oldest.
await tap(seat("7F"));
if (held() !== "7E, 7F. €36.00.") return "oldest: " + held();
await tap(seat("7E"));
if (held() !== "7F. €18.00.") return "giving one up: " + held();

// Across the aisle counts as together, and says so. 7C is beside 7D across it.
await tap(seat("7D"));
await tap(seat("7C"));
if (!note().includes("Your party sits together, across the aisle.")) return "aisle: " + held() + " " + note();
await tap(seat("7C"));
if (held() !== "7D. €18.00.") return "after giving up 7C: " + held();

// A pinch on the cabin: the seat under the fingers stays under them.
const before = zoom();
const m = seat("7D").getBoundingClientRect();
await pinch(view(), 1.6);
await wait(450);
if (!(zoom() > before * 1.3)) return "pinch: " + zoom() + " from " + before;
await pinch(view(), 0.5);
await wait(450);
if (!(zoom() < before)) return "pinch in: " + zoom();
await pinch(view(), 0.2);
await pinch(view(), 0.2);
await wait(450);
if (Math.abs(zoom() - fit) > 0.01) return "never smaller than the fit: " + zoom() + " " + fit;
for (let i = 0; i < 6; i++) { await pinch(view(), 2.4); await wait(350); }
if (Math.abs(zoom() - 2.5) > 0.01) return "never past 2.5: " + zoom();

// A real drag pans. Held still before lifting, so no coasting.
await tap($(".ui-seatps-less"));
await wait(400);
await tap($(".ui-seatps-less"));
await wait(400);
const z1 = zoom();
const m0 = matrix();
const vb = view().getBoundingClientRect();
const c = { x: vb.left + vb.width / 2, y: vb.top + vb.height / 2 };
await fingers("touchStart", [c]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: c.x, y: c.y - i * 12 }]); await wait(16); }
await wait(160);
await fingers("touchEnd", []);
await wait(450);
const m1 = matrix();
if (Math.abs(m1.f - m0.f + 120) > 1) return `pan: ${m0.f} to ${m1.f}`;
if (held() !== "7D. €18.00.") return "a pan pressed a seat: " + held();

// A flick goes on after the finger has gone.
await drag(view(), 0, -100, 60);
await wait(450);
const m2 = matrix();
if (!(m1.f - m2.f > 110)) return `flick: ${m1.f} to ${m2.f}`;

// Dragged too far it stops at the end of the cabin.
for (let i = 0; i < 12; i++) { await drag(view(), 0, 300, 120); await wait(60); }
await wait(400);
if (Math.abs(matrix().f) > 0.5) return "the top: " + matrix().f;

// The system takes the gesture.
await fingers("touchStart", [c]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: c.x + i * 5, y: c.y - i * 12 }]); await wait(16); }
await fingers("touchCancel", []);
await wait(450);
if (held() !== "7D. €18.00.") return "cancelled gesture: " + held();

// State changing under a held finger leaves the cabin where the finger has it.
const panFrom = matrix().f;
await fingers("touchStart", [c]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: c.x, y: c.y - i * 10 }]); await wait(16); }
await wait(60);
const heldPan = plane().style.transform;
$(".ui-seatps-need").click();
await wait(150);
const panAfter = plane().style.transform, needOn = $(".ui-seatps-need").getAttribute("aria-pressed");
$(".ui-seatps-need").click();
await wait(150);
await fingers("touchMove", [{ x: c.x, y: c.y - 70 }]);
await wait(40);
const panOn = matrix().f;
await fingers("touchCancel", []);
await wait(450);
if (heldPan === "" || panAfter !== heldPan) return `a state change moved the cabin: ${heldPan} to ${panAfter}`;
if (needOn !== "true") return "no state changed during the pan";
if (Math.abs(panOn - (panFrom - 70)) > 1) return `the pan did not go on: ${panFrom} to ${panOn}`;
if (held() !== "7D. €18.00.") return "after the held pan: " + held();

// Keys walk the seats, and bring them into sight. Only one seat is in Tab's way.
const stops = $$("[data-seat][tabindex='0']");
if (stops.length !== 1) return "tab stops: " + stops.length;
const from = stops[0].dataset.seat;
stops[0].focus();
key(stops[0], "ArrowDown");
await wait(420);
const went = document.activeElement.dataset.seat;
if (went === from || went !== from.replace(/^\d+/, (n) => String(+n === 12 ? 14 : +n + 1))) return `down from ${from}: ${went}`;
const k1 = document.activeElement.getBoundingClientRect();
if (k1.top < vb.top - 1 || k1.bottom > vb.bottom + 1) return "the seat a key went to is out of sight";
key(document.activeElement, "ArrowLeft");
await wait(420);
// Enter or Space on a focused button is the browser's own: click.
document.activeElement.click();
await wait(100);

// Exit rows: taken with a warning; closed when an accessible seat is needed, and given up.
seat("12A").click();
await wait(100);
if (!note().includes("Exit row: you must be able to help in an emergency.")) return "exit: " + note();
await tap($(".ui-seatps-need"));
if (seat("12A").getAttribute("aria-pressed") === "true") return "an exit seat stays after asking for access";
if (seat("12A").getAttribute("aria-disabled") !== "true") return "exit row not closed";
if (!seat("3C").hasAttribute("data-access")) return "accessible seats are not marked";
if (!note().includes("Green seats")) return "need: " + note();
seat("12B").click();
await wait(100);
if (!note().includes("Exit rows need someone able to help in an emergency.")) return "closed exit: " + note();
await tap($(".ui-seatps-need"));

// Finding two together: the cheapest pair, Back at 9.99, row 18, seats A and B.
await tap($(".ui-seatps-find"));
await wait(420);
if (held() !== "18A, 18B. €19.98.") return "find: " + held();
if (note() !== "Beside you: your party. Your party sits together.") return "beside the found pair: " + note();
if (seat("18A").getBoundingClientRect().top > vb.bottom) return "found seats are not brought into sight";

// The hidden field, and confirming: seats and an exact total.
const hidden = $('input[name="seats"]');
if (hidden.value !== "18A,18B") return "field: " + hidden.value;
const go = $(".ui-seatps-confirm");
if (go.textContent.trim() !== "Confirm 2 seats, €19.98") return "confirm: " + go.textContent;
await tap(go);
await wait(200);
if (dlg().open) return "confirm did not close";
if ($(".seat-picker-sheet-demo-seats").textContent !== "18A, 18B" || $(".seat-picker-sheet-demo-total").textContent !== "19.98") return "on_confirm: " + $(".seat-picker-sheet-demo-seats").textContent + " " + $(".seat-picker-sheet-demo-total").textContent;
if ($(".seat-picker-sheet-demo-closed").textContent !== "1") return "on_close: " + $(".seat-picker-sheet-demo-closed").textContent;

// Open again: the seats are still held, and the cabin is not made again.
const sameSeat = seat("18A");
await open();
if (seat("18A") !== sameSeat || seat("18A").getAttribute("aria-pressed") !== "true") return "lost on reopening";
const dW = dlg().getBoundingClientRect();

if (device === "tablet") {
    // A tablet: a card in the middle, cabin beside the fares, no handle.
    if (getComputedStyle($(".ui-seatps-grip")).display !== "none") return "a handle on a tablet";
    if (dW.left < 20 || dW.bottom > innerHeight - 20) return "not in the middle: " + JSON.stringify(dW);
    const inRow = getComputedStyle($(".ui-seatps-in-row")).flexDirection;
    if (inRow !== "row") return "the cabin should stand beside the fares: " + inRow;
    await tap($(".ui-seatps-close"));
    if (dlg().open) return "Close";
}

// The rest is a phone's. In a function of its own, as a plain `return` here would skip the checks
// the harness runs after a test's last line.
const asPhone = async () => {
// As a phone. The handle: a pull that falls short springs back.
const grip = $(".ui-seatps-grip");
await drag(grip, 0, 60, 600);
await wait(400);
if (!dlg().open) return "a short pull closed it";
if (dlg().style.transform !== "") return "did not spring back: " + dlg().style.transform;
// The system takes the gesture.
const g = middle(grip);
await fingers("touchStart", [g]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + i * 30 }]); await wait(16); }
const dur = dlg().style.transform;
await fingers("touchCancel", []);
await wait(400);
if (dur === "" || !dlg().open || dlg().style.transform !== "") return "cancelled pull: " + dur;
// State changing under the held handle leaves the sheet where the finger has it.
await fingers("touchStart", [g]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: g.x, y: g.y + i * 10 }]); await wait(16); }
await wait(60);
const pullAt = dlg().style.transform;
$(".ui-seatps-need").click();
await wait(150);
const pullAfter = dlg().style.transform;
$(".ui-seatps-need").click();
await wait(150);
await fingers("touchCancel", []);
await wait(400);
if (pullAt !== "translateY(60px)" || pullAfter !== pullAt) return `a state change moved the sheet: ${pullAt} to ${pullAfter}`;
if (!dlg().open || dlg().style.transform !== "") return "after the held pull: " + dlg().style.transform;
// A flick closes it, short as it is.
await drag(grip, 0, 80, 60);
await wait(400);
if (dlg().open) return "a flick did not close it";
// A long slow pull closes it too.
await open();
await drag($(".ui-seatps-grip"), 0, Math.round(innerHeight * 0.4), 900);
await wait(400);
if (dlg().open) return "a long pull did not close it";
// The handle pressed closes it, as a button.
await open();
await tap($(".ui-seatps-grip"));
await wait(200);
if (dlg().open) return "the handle pressed";

// Turned: the seats stay, and the view is fitted again.
await open();
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await wait(500);
const turned = [held(), zoom(), view().clientWidth];
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await wait(500);
if (turned[0] !== "18A, 18B. €19.98.") return "turned: " + turned;
if (Math.abs(zoom() - Math.min(1, view().clientWidth / plane().offsetWidth)) > 0.01 && zoom() < 0.5) return "after turning: " + zoom();
await tap($(".ui-seatps-close"));
};
if (device === "phone") { const wrong = await asPhone(); if (wrong) return wrong; }
