// mobile
const live = () => $("#picklist-demo-said").textContent;
const said = () => $(".ui-picklist-said").textContent;
const loc = () => $(".ui-picklist-loc")?.textContent;
const qty = () => $(".ui-picklist-qty")?.textContent;
const count = () => $(".ui-picklist-count").textContent;
const walk = () => $$(".ui-picklist-row b").map((b) => b.textContent).join();
const btn = (t) => { const b = $$(".ui-picklist-big, .ui-picklist-other").find((x) => x.textContent.trim() === t); b?.scrollIntoView({ block: "center" }); return b; };
const field = () => $("#ui-picklist-in-code");
const enter = async () => { for (const type of ["keyDown", "keyUp"]) await cdp("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: type === "keyDown" ? "\r" : undefined }); };
const scan = async (code) => { field().focus(); await cdp("Input.insertText", { text: code }); await enter(); await wait(150); };
const beeps = [];
const start0 = OscillatorNode.prototype.start;
OscillatorNode.prototype.start = function (...a) { beeps.push(this.frequency.value); return start0.apply(this, a); };
const done = async () => {
    OscillatorNode.prototype.start = start0; localStorage.removeItem("ui-picklist-demo");
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
};
const fail = async (m) => { await done(); return m; };
localStorage.removeItem("ui-picklist-demo");
// By hand: aisle A rising, then B falling, then C rising; A-03-1 before A-03-2; no place last.
if (walk() !== "A-03-1,A-03-2,A-12-3,B-20-1,B-07-2,C-01-1,None") return fail("walking order: " + walk());
if (loc() !== "A-03-1" || qty() !== "0 of 2") return fail("starts: " + loc() + " " + qty());
if (count() !== "0 of 7 lines, 0 of 11 units") return fail("count: " + count());
if ($(".ui-picklist-big").getBoundingClientRect().height < 72) return fail("big enough for a glove");
if (!/Then A-03-2/.test($(".ui-picklist-next").textContent)) return fail("says where next: " + $(".ui-picklist-next").textContent);
await tap(field());
// A wrong item is caught at the shelf.
await scan("1111111111111");
if (said() !== "Wrong item: 1111111111111. You need Notebook, A5." || qty() !== "0 of 2") return fail("wrong: " + said());
if (beeps[beeps.length - 1] !== 330) return fail("low sound");
// The right one, by scanner: two of two, and it moves on.
await scan("5901234123457");
if (said() !== "Notebook, A5: 1 of 2." || qty() !== "1 of 2") return fail("scan: " + said());
if (beeps[beeps.length - 1] !== 1480) return fail("good sound");
await scan("5901234123457");
if (said() !== "Notebook, A5: all 2 picked." || loc() !== "A-03-2") return fail("moves on: " + loc());
// Over: its line is done, so a third is refused.
await scan("5901234123457");
if (said() !== "Notebook, A5 is already done. Do not pick more.") return fail("full: " + said());
// UPC-A reads the same as EAN-13.
await scan("012345678905");
if (said() !== "Sticky notes: all 1 picked." || loc() !== "A-12-3") return fail("upc: " + said());
// Tapped, with a thumb.
await tap(btn("Picked one"));
if (said() !== "Marker pen, black: all 1 picked." || loc() !== "B-20-1") return fail("tap: " + said());
// Undo brings the line back, with its place.
await tap(btn("Undo"));
if (loc() !== "A-12-3" || !/Undone: Marker pen/.test(said())) return fail("undo: " + loc());
await tap(btn("Picked one"));
// Short with some found: of 4, 3 found, 1 short. Found cannot reach what was wanted.
await tap(btn("Short"));
const more = $('[aria-label="One more found"]');
more.scrollIntoView({ block: "center" });
for (let i = 0; i < 3; i++) await tap(more);
if (!more.disabled || $(".ui-picklist-found b").textContent !== "3") return fail("found: " + $(".ui-picklist-found b").textContent);
const why = (t) => { const r = $$(".ui-picklist-reason").find((x) => x.textContent.trim() === t); r.scrollIntoView({ block: "center" }); return r; };
await tap(why("Not enough"));
await tap(btn("Record short"));
if (said() !== "Label rolls: 1 short, not enough.") return fail("short of some: " + said());
if (!/1 short/.test($$(".ui-picklist-row")[3].textContent) || count() !== "4 of 7 lines, 7 of 11 units") return fail("short row: " + count() + " " + $$(".ui-picklist-row")[3].textContent);
await tap(btn("Undo"));
if (loc() !== "B-20-1" || qty() !== "0 of 4") return fail("a short can be undone: " + loc() + qty());
// All at once: 4 of 4 by one press.
if (qty() !== "0 of 4") return fail("before All: " + qty());
await tap(btn("All 4"));
if (said() !== "Label rolls: all 4 picked." || loc() !== "B-07-2") return fail("all: " + said());
// Skip puts it last; the next open line comes up; it comes round again.
await tap(btn("Skip"));
if (loc() !== "C-01-1") return fail("skip: " + loc());
if ($$(".ui-picklist-row")[4].dataset.state !== "skipped" || !/Later/.test($$(".ui-picklist-row")[4].textContent)) return fail("marked later");
// Out of order: its code, from another shelf, counts on its own line and says so.
await scan("SKU-999");
if (!/Pallet wrap, from the dock: all 1 picked\. It was out of order/.test(said())) return fail("out of order: " + said());
if (loc() !== "C-01-1") return fail("back in order: " + loc());
// A short: how many found, why; both needed.
await tap(btn("Short"));
if (!btn("Record short").disabled) return fail("a reason is needed");
const reason = (t) => { const r = $$(".ui-picklist-reason").find((x) => x.textContent.trim() === t); r.scrollIntoView({ block: "center" }); return r; };
await tap(reason("Damaged"));
await tap(btn("Record short"));
if (said() !== "Work gloves, large: 1 short, damaged.") return fail("short: " + said());
if (loc() !== "B-07-2") return fail("what was put off comes round: " + loc());
// Going to a line by the list: a done one does nothing.
await tap($$(".ui-picklist-row")[0]);
if (loc() !== "B-07-2") return fail("a done line is not reopened");
// A reload picks up where it was left.
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:400px;opacity:0;pointer-events:none"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await wait(400);
const fd = frame.contentDocument;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
for (let n = 0; n < 40 && !/picked up/.test(fd.querySelector(".ui-picklist-said")?.textContent); n++) await wait(100);
const back = [fd.querySelector(".ui-picklist-count").textContent, fd.querySelector(".ui-picklist-loc").textContent]; frame.remove();
if (back[0] !== "6 of 7 lines, 9 of 11 units" || back[1] !== "B-07-2") return fail("reload: " + back);
if (count() !== "6 of 7 lines, 9 of 11 units") return fail("count: " + count());
// The last line, then the end, offline.
await tap(btn("Picked one"));
if ($(".ui-picklist-card")) return fail("no card past the last line");
if (!/10 of 11 units picked/.test($(".ui-picklist-end").textContent) || !/Work gloves, large: 1 short, damaged/.test($(".ui-picklist-end").textContent)) return fail("end: " + $(".ui-picklist-end").textContent);
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(150);
if (!/No connection/.test($(".ui-picklist").textContent)) return fail("offline");
await tap(btn("Finish pick"));
if (live() !== "Nothing sent yet." || !/Waiting to send/.test($(".ui-picklist-end h4").textContent)) return fail("waits: " + live());
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
if (live() !== "Sent 10 of 11, 1 short") return fail("sent: " + live());
if (!/Pick sent/.test($(".ui-picklist-end h4").textContent)) return fail("says sent");
// Turning keeps the scroll of the list and what it shows.
const tall = device === "phone" ? [390, 844] : [820, 1180];
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[1], height: tall[0], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
const turned = count();
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[0], height: tall[1], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
if (turned !== "7 of 7 lines, 10 of 11 units") return fail("turned: " + turned);
// Side by side on a tablet.
const cols = $$(".ui-picklist-col"), a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
await done();
