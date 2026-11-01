// mobile
const town = $("#sheet-select-demo-town"), extras = $("#sheet-select-demo-extras");
const panelOf = (b) => b.closest(".ui-sheet-select").querySelector("dialog");
const out = () => $("#sheet-select-demo-out").textContent;
const item = (b, v) => panelOf(b).querySelector(`[data-value="${v}"]`);
const items = (b) => [...panelOf(b).querySelectorAll(".ui-sheet-select-item")];
if (!town || town.getAttribute("aria-haspopup") !== "dialog") return "no button";
if (town.textContent.replace(/\s+/g, " ").trim() !== "TownCebu City") return `the button says ${town.textContent}`;
// Long list: a search box, which does not take the focus and raise the keyboard.
await tap(town);
for (let i = 0; i < 30 && !panelOf(town).open; i++) await wait(100);
await wait(350);
const p = panelOf(town), find = p.querySelector("input[type=search]");
if (!p.open || town.getAttribute("aria-expanded") !== "true") return "tapping does not open the sheet";
if (!find) return "12 options and no search";
if (document.activeElement === find) return "opening raises the keyboard";
if (document.activeElement !== item(town, "Cebu City")) return `focus went to ${document.activeElement.tagName}`;
const pr = p.getBoundingClientRect();
if (device === "phone") {
    if (Math.abs(pr.bottom - innerHeight) > 1 || Math.abs(pr.left) > 1 || Math.abs(pr.right - innerWidth) > 1) return `a phone's sheet is at ${pr.left},${pr.bottom} of ${innerWidth}x${innerHeight}`;
} else {
    const b = town.getBoundingClientRect();
    if (pr.bottom === innerHeight || pr.width > 500 || Math.abs(pr.left - b.left) > 9) return `a tablet's panel is at ${pr.left},${pr.top} ${pr.width}x${pr.height}; the button at ${b.left}`;
    if (getComputedStyle(p.querySelector(".ui-sheet-select-grip")).display !== "none") return "a tablet's panel has a grip";
}
// Search: words in any order, any case; nothing found is said.
type(find, "CITY  cEBu"); await wait();
if (items(town).length !== 1 || !items(town)[0].textContent.includes("Cebu City")) return `search: ${items(town).length}`;
type(find, "zzz"); await wait();
if (items(town).length !== 0 || !p.querySelector("[role=status]").textContent.includes('"zzz"')) return "an empty search says nothing";
type(find, "<b>("); await wait();
if (items(town).length !== 0) return "odd characters in a search";
type(find, "da"); await wait();
if (items(town).map((e) => e.dataset.value).join() !== "Davao") return `"da": ${items(town).map((e) => e.dataset.value)}`;
await tap(item(town, "Davao")); await wait(350);
if (p.open || out() !== "Town: Davao. Extras: egg.") return `choosing: open ${p.open}, ${out()}`;
if (document.activeElement !== town) return "focus did not come back to the button";
// Short list: no search; multiple with Done.
await tap(extras); await wait(350);
const q = panelOf(extras);
if (q.querySelector("input[type=search]")) return "4 options have a search";
if (q.querySelector("[role=listbox]").getAttribute("aria-multiselectable") !== "true") return "not multi-selectable";
await tap(item(extras, "rice")); await tap(item(extras, "soup")); await wait(100);
await tap(item(extras, "cake")); await wait(100);
if (!q.open) return "a tick closed the sheet";
if (item(extras, "cake").getAttribute("aria-selected") !== "false") return "a sold-out option was ticked";
if (q.querySelector("[role=status]").textContent !== "3 chosen") return `count: ${q.querySelector("[role=status]").textContent}`;
if (out() !== "Town: Davao. Extras: egg.") return "ticks took effect before Done";
await tap(q.querySelector(".ui-sheet-select-done")); await wait(350);
if (q.open || out() !== "Town: Davao. Extras: egg, rice, soup.") return `Done: ${out()}`;
if (!extras.textContent.includes("Fried egg, Extra rice and 1 more")) return `summary: ${extras.textContent}`;
// Closing without Done drops the ticks.
await tap(extras); await wait(350);
await tap(item(extras, "egg")); await tap(q.querySelector(".ui-sheet-select-close")); await wait(350);
if (q.open || out() !== "Town: Davao. Extras: egg, rice, soup.") return `Close kept ticks: ${out()}`;
await tap(extras); await wait(350);
if (item(extras, "egg").getAttribute("aria-selected") !== "true") return "dropped ticks came back";
// Keys: arrows along the list, Escape closes.
item(extras, "egg").focus();
key(item(extras, "egg"), "ArrowDown"); await wait(50);
if (document.activeElement !== item(extras, "rice")) return "ArrowDown does not go along the list";
key(item(extras, "rice"), "ArrowDown"); await wait(50);
if (document.activeElement !== item(extras, "soup")) return `a second ArrowDown: ${document.activeElement.textContent}`;
key(item(extras, "soup"), "ArrowUp"); await wait(50);
if (document.activeElement !== item(extras, "rice")) return "ArrowUp does not come back";
// The arrow must be taken at once, or the browser scrolls the list as well.
const arrow = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
item(extras, "rice").dispatchEvent(arrow);
if (!arrow.defaultPrevented) return "the arrow key is left to the browser";
await wait(50);
q.close(); await wait(300);
if (device === "phone") {
    // A drag on the sheet's top: short springs back, far closes.
    await tap(extras); await wait(350);
    const head = q.querySelector(".ui-sheet-select-grip");
    const top0 = q.getBoundingClientRect().top;
    await drag(head, 0, 40, 500); await wait(350);
    if (!q.open || Math.abs(q.getBoundingClientRect().top - top0) > 1) return `a short drag: open ${q.open}, moved ${q.getBoundingClientRect().top - top0}`;
    await drag(head, 0, Math.round(q.offsetHeight * 0.6), 500); await wait(350);
    if (q.open) return "a long drag did not close it";
    // A flick closes on speed: little distance, fast.
    await tap(extras); await wait(350);
    await drag(head, 0, 60, 40); await wait(350);
    if (q.open) return "a flick did not close it";
    // Sideways is not this gesture.
    await tap(extras); await wait(350);
    await drag(head, 120, 10, 400); await wait(350);
    if (!q.open || q.style.transform) return `a sideways drag: open ${q.open}, ${q.style.transform}`;
    // The system takes the gesture: back where it was.
    const m = (() => { const r = head.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })();
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
    for (let i = 1; i <= 6; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x, y: m.y + i * 10 }] }); await wait(16); }
    await wait(100);
if (!(parseFloat(q.style.transform.slice(11)) >= 40)) return `the sheet does not follow the finger: ${q.style.transform}`;
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] }); await wait(350);
    if (!q.open || q.style.transform) return `pointercancel: open ${q.open}, ${q.style.transform}`;
    q.close(); await wait(300);
}
// The sheet stays above the on-screen keyboard: a stand-in for what iOS does, its layout
// staying and the visual viewport shrinking.
const real = window.visualViewport, fake = new EventTarget();
Object.assign(fake, { height: innerHeight - 300, offsetTop: 0, width: innerWidth, scale: 1 });
Object.defineProperty(window, "visualViewport", { value: fake, configurable: true });
await tap(town); await wait(350);
const kb = p.style.getPropertyValue("--kb");
if (kb !== "300px") return `the keyboard's height: ${kb}`;
if (device === "phone" && Math.abs(p.getBoundingClientRect().bottom - (innerHeight - 300)) > 1) return `over the keyboard? ${p.getBoundingClientRect().bottom}`;
fake.height = innerHeight; fake.dispatchEvent(new Event("resize")); await wait(100);
if (p.style.getPropertyValue("--kb") !== "0px") return "it does not follow the keyboard down";
p.close(); await wait(300);
Object.defineProperty(window, "visualViewport", { value: real, configurable: true });
// Turning the phone keeps the sheet, the search and the focus, and places it again.
await tap(town); await wait(350);
const w = innerWidth, h = innerHeight;
type(find, "o"); await wait(100);
const many = items(town).length, spot = p.style.getPropertyValue("--left") + p.style.getPropertyValue("--wide");
find.focus();
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } }); await wait(400);
const turned = [p.open, find.value, items(town).length === many, document.activeElement === find];
const tr = p.getBoundingClientRect();
const fits = tr.bottom <= innerHeight + 1 && tr.top >= -1;
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(400);
if (turned.join() !== "true,o,true,true") return `turned: ${turned}`;
if (!fits) return `turned, it runs off the screen: ${tr.top} to ${tr.bottom} of ${h}`;
p.close(); await wait(300);
// The form: a real field, required, reset.
const form = $("#sheet-select-demo-form"), size = $("#sheet-select-demo-size"), cols = $("#sheet-select-demo-colours");
if (form.checkValidity()) return "required with nothing chosen is valid";
await tap(size); await wait(350);
await tap(item(size, "Large")); await wait(350);
if (!form.checkValidity()) return "still invalid with a choice";
let sent = new FormData(form);
if (sent.get("size") !== "Large" || sent.getAll("colours").join() !== "Red,Blue") return `the form sends ${sent.get("size")}, ${sent.getAll("colours")}`;
await tap(cols); await wait(350);
await tap(item(cols, "Green")); await wait(100);
await tap(panelOf(cols).querySelector(".ui-sheet-select-done")); await wait(350);
if (new FormData(form).getAll("colours").join() !== "Red,Green,Blue") return `ticked: ${new FormData(form).getAll("colours")}`;
await tap($("#sheet-select-demo-reset")); await wait(300);
sent = new FormData(form);
if (sent.get("size") !== "" || sent.getAll("colours").join() !== "Red,Blue") return `after reset: ${sent.get("size")}, ${sent.getAll("colours")}`;
if (!size.textContent.includes("Choose")) return `the button after reset: ${size.textContent}`;
