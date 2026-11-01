// mobile
const size = $("#wheel-picker-demo-size"), seat = $("#wheel-picker-demo-seat");
const out = () => $("#wheel-picker-demo-out").textContent;
const list = (s) => s.closest(".ui-wheel-picker").querySelector(".ui-wheel-picker-list");
const rest = async () => { await wait(700); };
if (size.tagName !== "SELECT" || size.getAttribute("aria-label") !== "Size") return "no named select under the wheel";
if (size.value !== "M") return `it starts on ${size.value}`;
if (list(size).scrollTop !== 3 * 44) return `the wheel starts at ${list(size).scrollTop}`;
if (getComputedStyle(list(size)).scrollSnapType !== "y mandatory") return "no scroll snap";
if (getComputedStyle(list(size)).overscrollBehaviorY !== "contain") return "a pull reaches the page";
// A short pull goes back to its row.
await drag(list(size), 0, -14, 200); await rest();
if (size.value !== "M" || list(size).scrollTop !== 132) return `a short pull left it on ${size.value} at ${list(size).scrollTop}`;
// A slow drag of three rows.
await drag(list(size), 0, -132, 1200); await rest();
if (size.value !== "XXL" || !out().startsWith("Size XXL,")) return `three rows on: ${size.value}; ${out()}`;
if (list(size).scrollTop !== 6 * 44) return `not on a row: ${list(size).scrollTop}`;
// A flick carries on past what the finger moved.
await drag(list(size), 0, 70, 50); await wait(1500);
const flicked = (6 * 44 - list(size).scrollTop) / 44;
if (flicked < 2 || !Number.isInteger(flicked)) return `a flick of 70 px moved ${flicked} rows`;
const names = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL"];
if (size.value !== names[6 - flicked] || !out().startsWith(`Size ${names[6 - flicked]},`)) return `after a flick ${size.value}`;
// A value set from outside moves the wheel.
await tap($("#wheel-picker-demo-set")); await rest();
if (size.value !== "XL" || list(size).scrollTop !== 5 * 44) return `set from outside: ${size.value} at ${list(size).scrollTop}`;
// Keyboard route, on the select.
size.focus(); key(size, "ArrowUp"); await rest();
if (size.value !== "L" || !out().startsWith("Size L,")) return `ArrowUp: ${size.value}`;
key(size, "End"); await rest();
if (size.value !== "4XL") return `End: ${size.value}`;
key(size, "Home"); await rest();
if (size.value !== "XXS") return `Home: ${size.value}`;
key(size, "ArrowUp"); await rest();
if (size.value !== "XXS") return `ArrowUp past the top: ${size.value}`;
key(size, "PageDown"); await rest();
if (size.value !== "XL") return `PageDown: ${size.value}`;
// A screen reader sets the select itself.
size.selectedIndex = 3; size.dispatchEvent(new Event("change", { bubbles: true })); await rest();
if (list(size).scrollTop !== 3 * 44 || !out().startsWith("Size M,")) return `the select's change: ${list(size).scrollTop}, ${out()}`;
// A tap on a row goes there.
await tap(list(size).querySelectorAll(".ui-wheel-picker-item")[4]); await rest();
if (size.value !== "L") return `a tapped row: ${size.value}`;
// Rows that cannot be chosen: the wheel moves off them, the keys pass over them.
if (seat.value !== "14c" || seat.options[1].disabled !== true) return `seat starts on ${seat.value}`;
seat.focus(); key(seat, "ArrowUp"); await rest();
if (seat.value !== "14a") return `ArrowUp over a taken seat: ${seat.value}`;
await tap(list(seat).querySelectorAll(".ui-wheel-picker-item")[1]); await rest();
if (seat.value !== "14a" && seat.value !== "14c") return `a tap on a taken seat: ${seat.value}`;
if (list(seat).scrollTop % 44 !== 0) return `off a row: ${list(seat).scrollTop}`;
await drag(list(seat), 0, 60, 900); await rest();
if (seat.options[seat.selectedIndex].disabled) return "the wheel rests on a taken seat";
// A mouse drags it too, past a threshold, and a mouse click is no drag.
const box = list(size), mid = box.getBoundingClientRect();
box.scrollIntoView({ block: "center" }); await wait(100);
const r = box.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
const m = (type, y2, buttons = 1) => cdp("Input.dispatchMouseEvent", { type, x, y: y2, button: type === "mouseMoved" ? "none" : "left", buttons, clickCount: 1 });
const was = size.value;
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
await m("mousePressed", y); await m("mouseMoved", y - 2); await m("mouseReleased", y - 2, 0); await rest();
if (size.value !== was) return `a mouse click moved it from ${was} to ${size.value}`;
const before = names.indexOf(size.value);
await cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
await m("mousePressed", y);
for (let i = 1; i <= 10; i++) { await m("mouseMoved", y + i * 9); await wait(16); }
await wait(200); await m("mouseReleased", y + 90, 0); await rest();
if (names.indexOf(size.value) !== before - 2) return `a mouse drag of 90 px went from ${names[before]} to ${size.value}`;
// A wheel that was out of sight gets its place back when it is shown again, as in a sheet.
const holder = box.closest(".ui-wheel-picker"), place = box.scrollTop;
holder.style.display = "none"; await wait(100);
holder.style.display = ""; await wait(500);
if (box.scrollTop !== place) return `shown again at ${box.scrollTop}, not ${place}`;
// Each row passed is felt, in the apps.
const felt = []; window.quilloNative = { haptic: (k) => { felt.push(k); return Promise.resolve(); } };
await drag(box, 0, 88, 1000); await rest();
delete window.quilloNative;
if (felt.length < 2 || felt.some((k) => k !== "selection")) return `felt: ${felt}`;
// Turning the phone keeps the choice, the place and the focus.
size.focus();
const seenNow = size.value, top = box.scrollTop, w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true, screenOrientation: { type: "landscapePrimary", angle: 90 } }); await wait(400);
const turned = [size.value, box.scrollTop, document.activeElement === size];
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(400);
if (turned[0] !== seenNow || turned[1] !== top || !turned[2]) return `turned: ${turned}`;
if (size.value !== seenNow || box.scrollTop !== top) return "turned back";
// What cannot be chosen from does not stop it.
const odd = document.getElementById("wheel-picker-demo-odd"), named = (l) => odd.querySelector(`select[aria-label="${l}"]`);
if (named("Nothing").options.length !== 0) return "options out of nowhere";
key(named("Nothing"), "ArrowDown"); await wait(100);
if (named("Lost").value !== "B") return `a value that is not there: ${named("Lost").value}`;
if (!named("Off").disabled || named("Off").value !== "C") return "a wheel that is off";
if (getComputedStyle(list(named("Off"))).overflowY !== "hidden") return "a wheel that is off can be turned";
// The form sends the select.
const f = new FormData($("#wheel-picker-demo-form"));
if (f.get("slot") !== "Tuesday") return `the form sends ${f.get("slot")}`;
if ([...$$("[data-i]")].some((e) => !e.closest("[aria-hidden]"))) return "the drawn rows are not hidden from screen readers";
