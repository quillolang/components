// mobile
const go = () => $(".ui-jobcard-go");
const said = () => $(".ui-jobcard-said").textContent;
const live = () => $("#jobcard-demo-said").textContent;
const status = () => $("#jobcard-demo-status").textContent;
const tag = () => $(".ui-jobcard-tag[data-status]").textContent;
const side = (t) => $$(".ui-jobcard-side").find((b) => b.textContent.trim() === t);
const tick = (t) => { const l = $$(".ui-jobcard-tick").find((x) => x.textContent.includes(t)); l.scrollIntoView({ block: "center" }); return l; };
const now0 = Date.now, off0 = Date.prototype.getTimezoneOffset;
const clock = (ms) => { Date.now = () => ms; };
const done = () => { Date.now = now0; Date.prototype.getTimezoneOffset = off0; delete window.quilloNative; };
const fail = (m) => { done(); return m; };
// Every target suits a glove.
for (const el of [go(), ...$$(".ui-jobcard-side"), ...$$(".ui-jobcard-tick"), ...$$(".ui-jobcard-step")]) {
    const r = el.getBoundingClientRect();
    if (r.height < 64 || r.width < 64) return fail("too small for a glove: " + el.textContent + " " + r.width + "x" + r.height);
}
if ($(".ui-jobcard-tag[data-priority]").textContent !== "Urgent") return fail("priority");
if (go().textContent !== "Start travelling" || tag() !== "Not started") return fail("start: " + go().textContent);
let t = Date.UTC(2026, 10, 2, 12, 0, 0);
clock(t);
// A double tap moves one status, not two.
const p = go().getBoundingClientRect(), at = { x: p.left + p.width / 2, y: p.top + p.height / 2 };
const finger = (type, points) => cdp("Input.dispatchTouchEvent", { type, touchPoints: points });
await finger("touchStart", [at]); await finger("touchEnd", []);
await finger("touchStart", [at]); await finger("touchEnd", []);
await wait(250);
if (tag() !== "Travelling" || status() !== "travelling") return fail("a double tap goes one step: " + tag());
if (go().textContent !== "Arrived on site") return fail("next: " + go().textContent);
clock(t += 3000);
await tap(go());
if (tag() !== "On site") return fail("arrived: " + tag());
// Required steps stop it.
clock(t += 3000);
await tap(go());
if (said() !== "Still to do: Isolate the supply, Test the gas valve" || tag() !== "On site") return fail("blocked: " + said());
await tap(tick("Isolate"));
await tap(tick("Test the gas"));
if (live() !== 'on_site: 2 steps, 1 parts, note ""') return fail("on_change: " + live());
if ($(".ui-jobcard-req")) return fail("Required goes when done");
// Parts, by hand: 1 used to start, then +2 valves, -1 seal: 2 used.
await tap($('[aria-label="One more Gas valve"]'));
await tap($('[aria-label="One more Gas valve"]'));
await tap($('[aria-label="One fewer Flue seal"]'));
if (!/Parts, 2 used/.test($$(".ui-jobcard-col h4")[1].textContent)) return fail("parts: " + $$(".ui-jobcard-col h4")[1].textContent);
if (!/Planned 1, 1 extra/.test($(".ui-jobcard-part").textContent)) return fail("extra: " + $(".ui-jobcard-part").textContent);
if (!$('[aria-label="One fewer Flue seal"]').disabled) return fail("not below none");
// A note keeps its focus through real typing, and reaches on_change.
const box = $("#ui-jobcard-note");
await tap(box);
await cdp("Input.insertText", { text: "Valve seized" });
await wait(40);
if (document.activeElement !== box || box.value !== "Valve seized") return fail("typing: " + box.value);
box.blur(); await wait(60);
if (live() !== 'on_site: 2 steps, 2 parts, note "Valve seized"') return fail("note: " + live());
// Hold: it needs a reason; cancel changes nothing.
await tap(side("Put on hold"));
if (!side("Confirm hold").disabled) return fail("hold needs a reason");
await tap(side("Cancel"));
if ($(".ui-jobcard-hold") || tag() !== "On site") return fail("cancel");
await tap(side("Put on hold"));
await tap(side("Waiting for parts"));
await tap(side("Confirm hold"));
if (tag() !== "On hold" || status() !== "on_hold") return fail("hold: " + tag());
if (!/On hold: Waiting for parts/.test($(".ui-jobcard-log").textContent)) return fail("the log has why: " + $(".ui-jobcard-log").textContent);
await tap(go());
if (tag() !== "On site") return fail("resume goes back: " + tag());
// Completing takes two presses; a pause disarms it.
clock(t += 3000);
await tap(go());
if (go().textContent !== "Press again to complete" || tag() !== "On site") return fail("armed: " + go().textContent);
// A step undone disarms it.
await tap(tick("Clean the sensor"));
if (go().textContent !== "Complete job") return fail("a change disarms: " + go().textContent);
clock(t += 3000);
await tap(go());
clock(t += 3000);
await tap(go());
if (tag() !== "Done" || status() !== "done") return fail("done: " + tag());
if (!go().disabled || go().textContent !== "Job done") return fail("no more moves");
if (!$(".ui-jobcard-tick input").disabled) return fail("locked");
if ($("#ui-jobcard-note").disabled !== true) return fail("note locked");
if (side("Put on hold")) return fail("no hold on a done job");
// tel: in a browser; in the app, the share sheet.
const call = side("Call");
if (call.tagName !== "A" || call.getAttribute("href") !== "tel:+15145550100") return fail("tel: " + call.outerHTML);
if (!side("Map").href.includes("query=4%20Quay%20St%2C%20Montreal") && !side("Map").href.includes("query=4+Quay+St")) return fail("map: " + side("Map").href);
// In the app, which lets no tel: link out, the number goes to the share sheet. The app's
// object is there from the start of a page, so a page of its own has it.
const script = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "window.quilloNative = { share: (t) => { window.__shared = t; return Promise.resolve(true); } };" });
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:800px;border:0;z-index:99"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: script.identifier });
await wait(400);
const fd = frame.contentDocument, fw = frame.contentWindow;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
let phone = null;
for (let n = 0; n < 40 && !phone; n++) { await wait(100); phone = [...fd.querySelectorAll("button.ui-jobcard-side")].find((b) => b.textContent === "Call"); }
if (!phone) { frame.remove(); return fail("the app offers a button, not a tel: link"); }
phone.click();
await wait(150);
const shared = fw.__shared; frame.remove();
if (shared !== "+1 514 555 0100") return fail("the number goes to the sheet: " + shared);
// Columns on a tablet.
const cols = $$(".ui-jobcard-col"), a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
done();
