// mobile
const view = $(".ui-defect-view"), sheet = $(".ui-defect-sheet");
const where = () => $(".ui-defect-where").textContent;
const sum = () => $(".ui-defect-sum").textContent;
const live = () => $("#defect-demo-said").textContent;
const btn = (t) => { const b = $$(".ui-defect .ui-btn").find((x) => x.textContent.trim() === t || x.getAttribute("aria-label") === t); b?.scrollIntoView({ block: "center" }); return b; };
const pin = () => $(".ui-defect-pin");
const finger = (type, points) => cdp("Input.dispatchTouchEvent", { type, touchPoints: points });
const at = (fx, fy) => { sheet.scrollIntoView({ block: "center" }); const r = sheet.getBoundingClientRect(); return { x: r.left + r.width * fx, y: r.top + r.height * fy }; };
const tapAt = async (fx, fy) => { const p = at(fx, fy); await wait(40); await finger("touchStart", [p]); await finger("touchEnd", []); await wait(150); };
const pct = () => [parseFloat($(".ui-defect-spot").style.left), parseFloat($(".ui-defect-spot").style.top)];
const near = (a, b, d = 0.6) => Math.abs(a - b) <= d;
const offline = (on) => cdp("Network.emulateNetworkConditions", { offline: on, latency: 0, downloadThroughput: on ? 0 : -1, uploadThroughput: on ? 0 : -1 });
const share0 = navigator.share, now0 = Date.now, off0 = Date.prototype.getTimezoneOffset;
const done = async () => { Date.now = now0; Date.prototype.getTimezoneOffset = off0; delete window.quilloNative; if (share0) navigator.share = share0; else delete navigator.share; await offline(false); };
const fail = async (m) => { await done(); return m; };
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await cdp("Emulation.setGeolocationOverride", { latitude: 45.5, longitude: -73.5, accuracy: 10 });
await wait(150);
if (where() !== "No pin yet.") return fail("no pin: " + where());
// A tap places it: 25% across and 25% down is C2 of 8 by 6: 0.25 x 8 = 2, so C; 0.25 x 6 = 1.5, so 2. Kitchen.
await tapAt(0.25, 0.25);
if (!pin()) return fail("a tap sets the pin");
if (!near(pct()[0], 25) || !near(pct()[1], 25)) return fail("where: " + pct());
if (where() !== "Level 2, grid C2, Kitchen") return fail("words: " + where());
// A second tap moves it. 90%, 75% is H5, and Bath, the smaller of what is there.
await tapAt(0.9, 0.75);
if (where() !== "Level 2, grid H5, Bath") return fail("second tap: " + where());
// A finger that scrolls the page over the drawing sets nothing: real touch, real scroll.
const was = pct().join();
const y0 = scrollY;
const box0 = at(0.3, 0.3);
await wait(40);
await finger("touchStart", [box0]);
for (let i = 1; i <= 12; i++) { await finger("touchMove", [{ x: box0.x, y: box0.y - i * 8 }]); await wait(16); }
await finger("touchEnd", []);
await wait(300);
if (pct().join() !== was) return fail("a scroll moved the pin: " + pct() + " from " + was);
// A short nudge on the pin is no drag.
pin().scrollIntoView({ block: "center" }); await wait(50);
await drag(pin(), 3, 2, 80);
if (pct().join() !== was) return fail("a nudge moved the pin: " + pct());
// A drag moves it, by the finger's distance as a share of the sheet.
const w = sheet.getBoundingClientRect().width, h = sheet.getBoundingClientRect().height;
await tapAt(0.5, 0.5);
const [x1, y1] = pct();
pin().scrollIntoView({ block: "center" }); await wait(50);
await drag(pin(), -w * 0.2, h * 0.1, 200);
if (!near(pct()[0], x1 - 20, 1.5) || !near(pct()[1], y1 + 10, 1.5)) return fail("a drag: " + pct() + " from " + [x1, y1]);
if (pin().style.transform !== "") return fail("the drag's transform goes at release: " + pin().style.transform);
// A drag past the edge stops at the edge.
pin().scrollIntoView({ block: "center" }); await wait(50);
await drag(pin(), -w * 2, 0, 200);
if (pct()[0] !== 0) return fail("the edge: " + pct());
await tapAt(0.5, 0.5);
// Cancelled by the system: back to where it was.
const before = pct().join();
pin().scrollIntoView({ block: "center" }); await wait(50);
const pr = pin().getBoundingClientRect(), pp = { x: pr.left + pr.width / 2, y: pr.top + pr.height / 2 };
await finger("touchStart", [pp]);
for (let i = 1; i <= 6; i++) { await finger("touchMove", [{ x: pp.x + i * 8, y: pp.y }]); await wait(16); }
const mid = pin().style.transform;
await finger("touchCancel", []);
await wait(200);
if (!/^translate\(48px/.test(mid)) return fail("it follows the finger by transform: " + mid);
if (pct().join() !== before || pin().style.transform !== "") return fail("cancel springs back: " + pct() + " " + pin().style.transform);
// Turning the phone keeps the pin at its place on the drawing, not on the screen.
const tall = device === "phone" ? [390, 844] : [820, 1180];
const spot = pct().join();
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[1], height: tall[0], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
const sideways = sheet.getBoundingClientRect().width;
const kept = pct().join();
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[0], height: tall[1], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
if (kept !== spot) return fail("turning moves the pin: " + kept);
if (sideways <= sheet.getBoundingClientRect().width * 0.9 && device === "phone") return fail("the drawing uses the width: " + sideways);
// State changing under a held finger must not send the pin home: typing elsewhere, the
// connection going, each repaint the page. The pin stays with the finger and lands there.
await tapAt(0.5, 0.5);
pin().scrollIntoView({ block: "center" }); await wait(50);
const hr = pin().getBoundingClientRect(), hp = { x: hr.left + hr.width / 2, y: hr.top + hr.height / 2 };
const held0 = pct();
await finger("touchStart", [hp]);
for (let i = 1; i <= 5; i++) { await finger("touchMove", [{ x: hp.x + i * 6, y: hp.y }]); await wait(16); }
if (!/^translate\(30px/.test(pin().style.transform)) return fail("before the change: " + pin().style.transform);
type($("#ui-defect-title"), "typed mid-drag");
await wait(60);
if (!/typed mid-drag/.test(sum())) return fail("the state did change: " + sum());
if (!/^translate\(30px/.test(pin().style.transform)) return fail("a state change wiped the drag: '" + pin().style.transform + "'");
await offline(true); await wait(120);
if (!/^translate\(30px/.test(pin().style.transform)) return fail("the connection going wiped the drag: '" + pin().style.transform + "'");
await offline(false); await wait(80);
const heldLeft = pin().getBoundingClientRect().left;
if (Math.abs(heldLeft - (hr.left + 30)) > 1.5) return fail("the pin jumped on screen: " + heldLeft + " not " + (hr.left + 30));
for (let i = 6; i <= 8; i++) { await finger("touchMove", [{ x: hp.x + i * 6, y: hp.y }]); await wait(16); }
if (!/^translate\(48px/.test(pin().style.transform)) return fail("the drag goes on after: " + pin().style.transform);
await finger("touchEnd", []);
await wait(200);
if (!near(pct()[0], held0[0] + 48 * 100 / sheet.getBoundingClientRect().width, 1)) return fail("lands where it was let go: " + pct() + " from " + held0);
type($("#ui-defect-title"), ""); await wait(50);
// The keyboard's route: arrows, Shift for five, Delete.
pin().focus();
const k0 = pct();
const press = async (k, shift) => { for (const type of ["keyDown", "keyUp"]) await cdp("Input.dispatchKeyEvent", { type, key: k, code: k, modifiers: shift ? 8 : 0, windowsVirtualKeyCode: { ArrowRight: 39, ArrowDown: 40, Delete: 46 }[k] }); await wait(30); };
await press("ArrowRight");
await press("ArrowDown", true);
if (!near(pct()[0], k0[0] + 1, 0.01) || !near(pct()[1], k0[1] + 5, 0.01)) return fail("arrows: " + pct() + " from " + k0);
if (document.activeElement !== pin()) return fail("the pin keeps its focus: " + document.activeElement.tagName);
await press("Delete");
if (pin() || where() !== "No pin yet.") return fail("Delete");
// No pointer: the middle, and rooms from a list.
await tap(btn("Middle of the drawing"));
// 50, 50 is on the corner of three rooms, and Kitchen is one of the two smallest, and first.
if (where() !== "Level 2, grid E4, Kitchen") return fail("the middle: " + where());
const room = $("#ui-defect-room");
room.value = "Living room"; room.dispatchEvent(new Event("change", { bubbles: true }));
await wait(100);
// The middle of 50..100 by 0..50 is 75, 25: G2.
if (where() !== "Level 2, grid G2, Living room") return fail("a room: " + where());
if ($("#ui-defect-room").value !== "Living room") return fail("the list follows the pin");
// Zoomed, a tap lands where the drawing shows it.
await tap(btn("Zoom in"));
if (sheet.getBoundingClientRect().width < view.clientWidth * 1.9) return fail("zoom: " + sheet.getBoundingClientRect().width);
view.scrollLeft = 200; view.scrollTop = 0; await wait(80);
view.scrollIntoView({ block: "center" }); await wait(60);
const sr2 = sheet.getBoundingClientRect(), vr2 = view.getBoundingClientRect();
const point = { x: vr2.left + 40, y: vr2.top + 40 };
const wantX = (point.x - sr2.left) * 100 / sr2.width, wantY = (point.y - sr2.top) * 100 / sr2.height;
await finger("touchStart", [point]); await finger("touchEnd", []); await wait(150);
if (!near(pct()[0], wantX) || !near(pct()[1], wantY)) return fail("zoomed tap: " + pct() + " wanted " + [wantX, wantY]);
await tap(btn("Zoom out"));
// Another drawing clears the pin and has no rooms.
const other = $$(".ui-defect-plan")[1];
other.scrollIntoView({ block: "center" });
await tap(other);
if (pin()) return fail("a pin belongs to its drawing");
if ($("#ui-defect-room")) return fail("no rooms there");
await tap($$(".ui-defect-plan")[0]);
await tapAt(0.25, 0.25);
// Refused until it is whole, with what is missing.
await tap(btn("Send report"));
const open = () => $$(".ui-defect-open li").map((l) => l.textContent).join(" | ");
if (open() !== "How serious it is | What is wrong | 1 more photo") return fail("missing: " + open());
const level = (t) => { const l = $$(".ui-defect-level").find((x) => x.textContent.startsWith(t)); l.scrollIntoView({ block: "center" }); return l; };
await tap(level("High"));
const title = $("#ui-defect-title");
await tap(title);
await cdp("Input.insertText", { text: "Crack in the wall" });
await wait(40);
if (document.activeElement !== title || title.value !== "Crack in the wall") return fail("typing: " + title.value);
const pic = document.createElement("canvas"); pic.width = 60; pic.height = 40; pic.getContext("2d").fillRect(0, 0, 60, 40);
const blob = await new Promise((r) => pic.toBlob(r, "image/jpeg"));
const dt = new DataTransfer(); dt.items.add(new File([blob], "s.jpg", { type: "image/jpeg" }));
const fi = $(".ui-phev-file"); fi.files = dt.files; fi.dispatchEvent(new Event("change", { bubbles: true }));
for (let n = 0; n < 60 && !$(".ui-defect .ui-phev-grid img"); n++) await wait(100);
if (!/Crack in the wall/.test($(".ui-defect .ui-phev-grid img").alt)) return fail("the photo's stamp names the defect");
// The summary, whole. Sent offline, it waits.
await offline(true); await wait(150);
if (!/No connection/.test($(".ui-defect").textContent)) return fail("says offline");
Date.now = () => 1793631909000;
Date.prototype.getTimezoneOffset = () => 240;
await tap(btn("Send report"));
const want = ["HIGH: Crack in the wall", "Where: Level 2, grid C2, Kitchen", "Photos: 1", "Job: Block C, unit 12", "By: J. Tremblay", "Ref: DR-20261102-1105"].join("\n");
if (sum() !== want) return fail("summary: " + JSON.stringify(sum()));
if (live() !== "Nothing sent yet.") return fail("nothing offline");
if (!/Waiting to send/.test($(".ui-defect").textContent)) return fail("waiting");
await offline(false); await wait(250);
if (live() !== "Sent C2 Kitchen high 1") return fail("sent: " + live());
// Sharing it: the system's sheet, in the app.
let shared = null;
window.quilloNative = { share: (t) => { shared = t; return Promise.resolve(true); } };
await tap(btn("Share"));
if (shared !== want) return fail("shared: " + shared);
// iOS answers a map and Android true, and a refusal says so; neither of the first two stops the handler.
window.quilloNative = { share: () => Promise.resolve({ shared: true, to: null }) };
await tap(btn("Share"));
if ($(".ui-defect-said").textContent !== "") return fail("iOS's answer: " + $(".ui-defect-said").textContent);
window.quilloNative = { share: () => Promise.reject(new Error("no screen")) };
await tap(btn("Share"));
if ($(".ui-defect-said").textContent !== "It could not be shared from here.") return fail("a refused share: " + $(".ui-defect-said").textContent);
delete window.quilloNative;
await tap(btn("Report another"));
if (pin() || title.value !== "" || $$(".ui-defect-level input:checked").length !== 0) return fail("a new one starts clean");
// On a tablet the drawing has the wider half, beside the form.
const cols = $$(".ui-defect-col"), a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? !(b.left > a.left && a.width > b.width) : b.top <= a.top) return fail("layout: " + device);
await done();
