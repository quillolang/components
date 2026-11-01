// mobile
const bar = $(".ui-sbb"), page = $("#sticky-demo-page"), mine = $("#sticky-demo-buy"), note = $("#sticky-demo-note");
const up = () => bar.classList.contains("ui-sbb-up") && getComputedStyle(bar).visibility === "visible";
if (up()) return "hidden while the page's button shows";
if (!bar.inert) return "out of reach while hidden";
// Nothing above the safe area test can set, but the padding asks for it.
if (!getComputedStyle(bar).paddingBottom.endsWith("px")) return "padding";
// A short scroll keeps the page's button in view: no bar.
await drag(page, 0, -40, 200); await wait(300);
if (page.scrollTop <= 0) return "a real drag scrolls the page: " + page.scrollTop;
if (up()) return "the button still shows: no bar";
// Scroll on until it is gone, by finger.
for (let i = 0; i < 6 && mine.getBoundingClientRect().bottom > page.getBoundingClientRect().top; i++) { await drag(page, 0, -220, 250); await wait(450); }
if (mine.getBoundingClientRect().bottom > page.getBoundingClientRect().top) return "the button has gone: " + mine.getBoundingClientRect().bottom;
await wait(350);
if (!up()) return "the bar rises when the button has gone";
if (bar.inert) return "reachable when up";
const b = bar.getBoundingClientRect();
if (Math.abs(b.bottom - page.parentElement.getBoundingClientRect().bottom) > 2) return "the bar sits on the bottom of its frame: " + b.bottom;
const price = bar.textContent.replace(/\s+/g, " ");
if (!/\$129\.00/.test(price) || !/\$149\.00/.test(price)) return "price and old price: " + price;
// Its button works: the same count the page's own moves.
await tap(bar.querySelector("button"));
if (!/Bought 1 so far/.test(page.textContent)) return "on_buy: " + page.textContent.slice(0, 100);
// The field takes focus: the bar goes before the keyboard does.
note.focus(); await wait(300);
if (up()) return "typing hides the bar";
note.blur(); await wait(300);
if (!up()) return "leaving the field brings it back";
// A checkbox or a button does not raise a keyboard.
const box = document.createElement("input"); box.type = "checkbox"; page.append(box);
box.focus(); await wait(300);
if (!up()) return "a checkbox has no keyboard";
box.remove(); await wait(100);
// The visual viewport says the keyboard is up: iOS keeps innerHeight the same.
const vv = visualViewport, h = vv.height;
const fake = (v) => { Object.defineProperty(vv, "height", { configurable: true, get: () => v }); vv.dispatchEvent(new Event("resize")); };
fake(h - 300); await wait(300);
if (up()) return "a keyboard hides the bar";
fake(h - 60); await wait(300);
if (!up()) return "a browser's toolbar is no keyboard";
fake(h); await wait(50);
// A pinch shrinks the viewport by its scale: no keyboard.
Object.defineProperty(vv, "scale", { configurable: true, get: () => 2 });
fake(h / 2); await wait(300);
const pinched = up();
delete vv.scale; delete vv.height; vv.dispatchEvent(new Event("resize")); await wait(300);
if (!pinched) return "a pinch is no keyboard";
// A turn is a new height, not a keyboard.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(400);
const turned = up();
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (!turned) return "turning the phone keeps the bar";
if (!up()) return "turning back keeps the bar";
// Back to the top: it goes.
await drag(page, 0, 3000, 200); await wait(900);
page.scrollTop = 0; await wait(400);
if (up()) return "the button is back: no bar";
if (!bar.inert) return "out of reach again";
// Tablet width: the name shows, by the bar's own width.
page.scrollTop = 900; await wait(400);
const name = bar.querySelector(".ui-sbb-name");
const wide = bar.getBoundingClientRect().width >= 600;
if (wide !== (getComputedStyle(name).display !== "none")) return "the name shows from 600 px: " + bar.getBoundingClientRect().width + " " + getComputedStyle(name).display;
page.scrollTop = 0; await wait(300);
