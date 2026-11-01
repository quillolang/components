// mobile
const dlg = $("dialog.ui-cartsh"), open = $(".ui-cartsh-open");
const shown = (s) => dlg.querySelector(s);
const sums = () => [...dlg.querySelectorAll(".ui-cartsh-sums dd")].map((d) => d.textContent.trim()).join(" ");
const names = () => [...dlg.querySelectorAll(".ui-cartsh-front")].map((f) => f.dataset.line).join(",");
if (open.textContent.replace(/\s+/g, " ").trim() !== "Cart6") return "the trigger counts 6: " + open.textContent;
await tap(open);
await wait(300);
if (!dlg.open) return "the trigger opens it";
if (!dlg.matches(":modal")) return "it is a modal dialog";
// Known sums: 48 + 39.98 + 22.05 = 110.03; 8% is 8.8024, so 8.80; 110.03 + 6.95 + 8.80.
if (sums() !== "$110.03 $6.95 $8.80 $125.78") return "sums at the start: " + sums();
if (!/Add \$39\.97 more for free shipping/.test(dlg.textContent)) return "the note wants 39.97 more: " + shown(".ui-cartsh-note").textContent;
const rect = dlg.getBoundingClientRect();
if (device === "phone") {
    if (Math.abs(rect.bottom - innerHeight) > 1 || rect.width !== innerWidth) return "a phone has a bottom sheet: " + JSON.stringify(rect);
} else {
    if (Math.abs(rect.right - innerWidth) > 1 || rect.width > 441 || rect.height < innerHeight - 1) return "a tablet has a side panel: " + JSON.stringify(rect);
    if (getComputedStyle(shown(".ui-cartsh-grip")).display !== "none") return "a side panel has no grip";
}
// Quantities: + on the socks, a real tap, in decimals: 7.35 x 4 = 29.40.
const more = dlg.querySelector('[aria-label="One more Wool socks"]'), pay = dlg.querySelector(".ui-btn-full");
await tap(more);
if (dlg.querySelector(".ui-btn-full") !== pay) return "a change of quantity remakes the checkout button";
if (sums() !== "$117.38 $6.95 $9.39 $133.72") return "after one more sock: " + sums();
// The shirt has a stock of 3, and stops there; and at 1 the minus is off.
const shirtMore = dlg.querySelector('[aria-label="One more Linen shirt"]');
await tap(shirtMore); await tap(shirtMore);
if (!shirtMore.disabled) return "stock 3 stops the plus";
if (!dlg.querySelector('[aria-label="One fewer Linen shirt"]') || dlg.querySelector('[aria-label="One fewer Canvas tote"]').disabled) return "minus works above 1";
await tap(dlg.querySelector('[aria-label="One fewer Linen shirt"]'));
await tap(dlg.querySelector('[aria-label="One fewer Linen shirt"]'));
if (!dlg.querySelector('[aria-label="One fewer Linen shirt"]').disabled) return "minus stops at 1";
await tap(dlg.querySelector('[aria-label="One fewer Wool socks"]'));
if (sums() !== "$110.03 $6.95 $8.80 $125.78") return "back to the start: " + sums();
// A swipe that falls short springs back.
const front = shown('[data-line="tote"]'), w = front.offsetWidth;
await drag(front.querySelector(".ui-cartsh-name"), -60, 0, 400);
await wait(300);
if (names() !== "shirt,tote,socks") return "a short swipe removes nothing: " + names();
if (front.style.transform !== "") return "a short swipe springs back: " + front.style.transform;
// A swipe down the list is not a swipe, and a swipe right does nothing.
await drag(front.querySelector(".ui-cartsh-name"), 80, 0, 300);
if (names() !== "shirt,tote,socks") return "a swipe right removes nothing";
// Past 40%.
await drag(front.querySelector(".ui-cartsh-name"), -Math.round(w * 0.55), 0, 400);
await wait(350);
if (names() !== "shirt,socks") return "a long swipe removes: " + names();
if (!/Canvas tote removed/.test(shown(".ui-cartsh-snack").textContent)) return "it says what went";
// 48 + 22.05 = 70.05; 8% is 5.604, so 5.60; 70.05 + 6.95 + 5.60 = 82.60.
if (sums() !== "$70.05 $6.95 $5.60 $82.60") return "sums after removing: " + sums();
await tap(shown(".ui-cartsh-undo"));
if (names() !== "shirt,tote,socks") return "undo puts it back in its place: " + names();
if (sums() !== "$110.03 $6.95 $8.80 $125.78") return "sums after undo: " + sums();
// A flick: short and fast.
await drag(shown('[data-line="tote"] .ui-cartsh-name'), -90, 0, 40);
await wait(350);
if (names() !== "shirt,socks") return "a flick removes: " + names();
// A cancelled gesture puts it back: the system took the finger.
const f2 = shown('[data-line="socks"]'), n2 = f2.querySelector(".ui-cartsh-name");
const r2 = n2.getBoundingClientRect(), p = { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - 40, y: p.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - 120, y: p.y }] });
await wait(40);
if (!f2.style.transform.includes("translateX")) return "the line follows the finger: " + f2.style.transform;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(250);
if (f2.style.transform !== "" || names() !== "shirt,socks") return "a cancel springs back: " + f2.style.transform + " " + names();
// The keyboard's route: Remove takes focus to Undo.
const del = dlg.querySelector('[aria-label="Remove Wool socks"]');
del.focus(); del.click();
await wait(350);
if (names() !== "shirt") return "Remove removes: " + names();
if (!/^2 lines removed/.test(shown(".ui-cartsh-snack").textContent)) return "two gone: " + shown(".ui-cartsh-snack").textContent;
if (document.activeElement !== shown(".ui-cartsh-undo")) return "focus goes to Undo";
await tap(shown(".ui-cartsh-undo"));
if (names() !== "shirt,socks") return "undo brings the latest first: " + names();
await tap(shown(".ui-cartsh-undo"));
if (names() !== "shirt,tote,socks") return "undo brings back the one before: " + names();
if (shown(".ui-cartsh-snack")) return "nothing left to undo";
// Undo goes by itself.
await tap(dlg.querySelector('[aria-label="Remove Canvas tote"]'));
await wait(300);
if (!shown(".ui-cartsh-snack")) return "undo is offered";
await wait(6300);
if (shown(".ui-cartsh-snack")) return "undo goes after its seconds";
// Free shipping, 150: 7 more socks and the shirt up to 3 pass it.
await tap(dlg.querySelector('[aria-label="One more Linen shirt"]'));
await tap(dlg.querySelector('[aria-label="One more Linen shirt"]'));
if (!/Shipping is free/.test(shown(".ui-cartsh-note").textContent)) return "free shipping from 150: " + shown(".ui-cartsh-note").textContent;
// 144 + 22.05 = 166.05; 8% is 13.284, so 13.28.
if (sums() !== "$166.05 Free $13.28 $179.33") return "sums with free shipping: " + sums();
await tap(dlg.querySelector(".ui-btn-full"));
if ($("#cart-sheet-said").textContent !== "Checkout: 2 lines, 179.33") return "on_checkout: " + $("#cart-sheet-said").textContent;
// Pull the sheet down: short springs back, long closes. On a tablet, Escape's and the button's.
if (device === "phone") {
    await drag(shown(".ui-cartsh-head h2"), 0, 60, 400);
    await wait(260);
    if (!dlg.open || dlg.style.transform !== "") return "a short pull springs back: " + dlg.style.transform;
    await drag(shown(".ui-cartsh-head h2"), 0, Math.round(dlg.offsetHeight * 0.5), 400);
    await wait(320);
    if (dlg.open) return "a long pull closes";
    await tap(open); await wait(300);
    await drag(shown(".ui-cartsh-head h2"), 0, 70, 40);
    await wait(320);
    if (dlg.open) return "a flick closes";
    await tap(open); await wait(300);
    await drag(shown(".ui-cartsh-head h2"), 90, 8, 300);
    await wait(260);
    if (!dlg.open) return "sideways does not close";
}
if (!dlg.open) { await tap(open); await wait(300); }
await tap(shown(".ui-cartsh-x"));
await wait(100);
if (dlg.open) return "the button closes it";
// Rotation keeps everything: 390 by 844 turned, and back.
await tap(open); await wait(300);
const before = sums();
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (!dlg.open || sums() !== before) return "rotation keeps the sheet";
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (!dlg.open || sums() !== before) return "rotating back keeps the sheet";
// A press on the backdrop closes; a press inside does not: elements must be told apart.
const outside = device === "phone" ? { x: 195, y: 8 } : { x: 40, y: 500 };
await tap(shown(".ui-cartsh-head h2"));
if (!dlg.open) return "a press inside stays open";
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [outside] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(300);
if (dlg.open) return "a press on the backdrop closes";
await tap(open); await wait(300);
// The on-screen keyboard: visualViewport says it is up; the sheet goes above it.
const vv = visualViewport, h = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => h - 300 });
vv.dispatchEvent(new Event("resize"));
await wait(60);
const kb = Math.round(innerHeight - dlg.getBoundingClientRect().bottom);
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await wait(60);
if (device === "phone" && kb !== 300) return "the sheet sits on the keyboard: " + kb;
if (dlg.hasAttribute("data-keyboard")) return "it comes back down";
await tap(shown(".ui-cartsh-x")); await wait(100);
// The page adds a line: the sheet follows, and what was changed in the sheet stands.
const was = open.textContent.replace(/\D/g, "");
await tap($("#cart-sheet-more"));
await wait(100);
if (open.textContent.replace(/\D/g, "") !== String(+was + 1)) return "a line from the page counts: " + open.textContent;
await tap(open); await wait(300);
if (!shown('[data-line="cap"]')) return "a line from the page shows";
if (dlg.querySelector('[aria-label="One more Linen shirt"]').disabled !== true) return "a stock limit survives the trip through the page";
await tap(shown(".ui-cartsh-x")); await wait(100);
