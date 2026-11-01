// tablet
const W = innerWidth, H = innerHeight;
const view = $(".ui-inspector"), panel = $(".ui-inspector-panel"), stage = $(".ui-inspector-stage");
const rect = (el) => el.getBoundingClientRect();
const shape = (id) => $(`#inspect-demo-${id}`);
const field = (key) => panel.querySelector(`[data-field="${key}"]`);
const input = (key) => field(key).querySelector("input, select");
const heading = () => panel.querySelector(".ui-inspector-heading p").textContent;
const said = () => $("#inspect-demo-said").textContent;
const typeIn = async (el, text) => { el.focus(); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); await wait(50); };

// Beside the stage, and empty.
if (Math.abs(rect(panel).width - 300) > 1) return `the panel is ${rect(panel).width} wide`;
if (Math.abs(rect(panel).right - rect(view).right) > 1 || Math.abs(rect(stage).right - rect(panel).left) > 1) return "it is not down the right of the stage";
if (rect(panel).height !== rect(view).height) return "it does not run the height of the box";
if (!panel.textContent.includes("Nothing selected") || panel.querySelector(".ui-inspector-section")) return "with nothing selected it should say so";
if (getComputedStyle(panel.querySelector(".ui-inspector-grip")).display !== "none") return "a side panel has no grip";

// A selection shows its values, in sections.
await tap(shape("a"));
if (heading() !== "Header") return `the heading is ${heading()}`;
const titles = [...panel.querySelectorAll("summary")].map((s) => s.textContent).join();
if (titles !== "About,Place,Look") return `sections for a rect: ${titles}`;
if (input("x").value !== "40" || input("width").value !== "180" || input("name").value !== "Header" || input("corners").value !== "8") return "the fields do not show the selection";
if (input("fill").value !== "#5b4bdb" || input("layer").value !== "Front" || input("locked").checked) return "fill, layer or locked is wrong";
if (field("kind").querySelector(".ui-inspector-read").textContent !== "rect") return "the read-only field is wrong";
if (input("width").type !== "text" || input("width").inputMode !== "decimal") return "a number field should ask for a decimal keyboard";

// Live, out: typing moves the thing as it is typed, and focus stays.
await typeIn(input("width"), "200");
if (rect(shape("a")).width !== 200) return `typing 200 made it ${rect(shape("a")).width} wide`;
if (said() !== "width is 200") return `on_change: ${said()}`;
if (document.activeElement !== input("width")) return "typing lost the focus";
if (input("width").value !== "200") return `the field says ${input("width").value}`;
await typeIn(input("width"), "210.5");
if (rect(shape("a")).width !== 210.5) return "a decimal did not go out";
await typeIn(input("width"), "210,5");
if (said() !== "width is 210.5") return `a comma as the point gave ${said()}`;

// Bad numbers: said, not sent, and put back on leaving.
const good = rect(shape("a")).width;
for (const [text, note] of [["abc", "Must be a number"], ["", "Must be a number"], ["1e3", "Must be a number"], ["--4", "Must be a number"], ["12.", "Must be a number"],
                            ["43", "At least 44"], ["401", "At most 400"], ["99999999999999999999", "Must be a number"]]) {
    await typeIn(input("width"), text);
    await wait(30);
    const n = field("width").querySelector(".ui-inspector-note");
    if (!n || n.textContent !== note) return `"${text}" says ${n ? n.textContent : "nothing"}`;
    if (rect(shape("a")).width !== good) return `"${text}" changed the shape`;
    if (input("width").value !== text) return `"${text}" was changed under the fingers to ${input("width").value}`;
    if (input("width").getAttribute("aria-invalid") !== "true") return "a bad field is not marked";
}
input("x").focus(); await wait(60);
if (input("width").value !== "210.5" || field("width").querySelector(".ui-inspector-note")) return `leaving a bad field left ${input("width").value}`;

// Live, in: the thing moved from outside shows in the panel, but not over someone typing.
await tap(input("x"));
await tap($("#inspect-demo-nudge"));
if (input("x").value !== "45") return `the panel shows x ${input("x").value} after a nudge`;
await typeIn(input("x"), "4");
const nudge = $("#inspect-demo-nudge");
nudge.click(); await wait(60);
if (input("x").value !== "4") return `a change from outside overwrote what was being typed: ${input("x").value}`;
await tap(input("y"));
if (input("x").value !== "9") return `after leaving it the field shows ${input("x").value}, not the value 9`;

// The steppers: by the field's step, kept in range.
const stepUp = field("width").querySelector('[aria-label="More Width"]'), stepDown = field("width").querySelector('[aria-label="Less Width"]');
await typeIn(input("width"), "390");
await tap(stepUp);
if (input("width").value !== "400" || rect(shape("a")).width !== 400) return `+ made ${input("width").value}`;
await tap(stepUp);
if (input("width").value !== "400") return "+ went past max";
await typeIn(input("width"), "50");
await tap(stepDown);
if (input("width").value !== "44") return `- past min gave ${input("width").value}`;
await tap(stepDown);
if (input("width").value !== "44") return "- went on past min";

// The other kinds of field.
await typeIn(input("name"), "Banner");
if (shape("a").textContent !== "Banner" || heading() !== "Banner") return "the name did not follow";
input("layer").value = "Back"; input("layer").dispatchEvent(new Event("change", { bubbles: true })); await wait(50);
if (said() !== "layer is Back") return `the select: ${said()}`;
await tap(field("locked").querySelector("label"));
if (!input("locked").checked || said() !== "locked is true") return `the toggle, by its label: ${said()}`;
input("fill").value = "#ff0000"; input("fill").dispatchEvent(new Event("input", { bubbles: true })); await wait(50);
if (getComputedStyle(shape("a")).backgroundColor !== "rgb(255, 0, 0)") return "the colour did not go out";

// Another selection: another kind, other fields; a folded section stays folded.
const look = [...panel.querySelectorAll("details")].find((d) => d.querySelector("summary").textContent === "Place");
look.querySelector("summary").click(); await wait(60);
if (look.open) return "the section did not fold";
await tap(shape("b"));
if (heading() !== "Badge") return `the second selection: ${heading()}`;
if (field("corners")) return "a field for rects shows for a circle";
const rounding = [...panel.querySelectorAll("details")].find((d) => d.querySelector("summary").textContent === "Rounding");
if (!rounding || rounding.open) return "a section for circles should show, folded";
if (look.open || !look.isConnected) return "the folded section did not stay folded";
if (input("locked").checked !== true || input("layer").value !== "Middle") return "the second selection's values are wrong";
await tap(shape("a"));
if (input("width").value !== "44" || heading() !== "Banner") return "coming back, the edits are gone";
look.querySelector("summary").click(); await wait(60);

// Nothing selected again.
await tap($("#inspect-demo-none"));
if (!panel.textContent.includes("Nothing selected") || panel.querySelector(".ui-inspector-section")) return "it did not go back to empty";
await tap(shape("c"));

// Hide and Show, with the stage taking the room.
await tap(panel.querySelector(".ui-inspector-hide"));
if (panel.getClientRects().length) return "Hide did not hide it";
if (Math.abs(rect(stage).width - rect(view).width) > 1) return "the stage did not take the room";
await tap(view.querySelector(".ui-inspector-show"));
if (!panel.getClientRects().length || heading() !== "Photo") return "Show did not bring it back";

// A real turn with a field in use.
await tap(input("y"));
await typeIn(input("y"), "21");
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (heading() !== "Photo" || document.activeElement !== input("y") || input("y").value !== "21") return "a turn lost the selection, the focus or the text";
if (Math.abs(rect(panel).width - 300) > 1) return "turned, it should still be the side panel";

// A phone: a sheet, with the thing still in view.
const grip = panel.querySelector(".ui-inspector-grip");
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(450);
const room = view.clientHeight, half = Math.round(room * 0.52);
const tall = () => Math.round(rect(panel).height);
const detent = () => panel.dataset.detent;
const settle = () => wait(320);
if (detent() !== "half") return `the sheet is at ${detent()}`;
if (Math.abs(tall() - half) > 2) return `half is ${tall()}, not ${half}`;
if (rect(panel).left !== 0 || rect(panel).width !== 390 || Math.abs(rect(panel).bottom - rect(view).bottom) > 1) return "it is not a sheet along the bottom";
if (document.activeElement !== input("y") || input("y").value !== "21") return "becoming a sheet lost the field";
if (panel.querySelector(".ui-inspector-hide").getClientRects().length) return "a sheet has its own way down";
if (getComputedStyle(grip).touchAction !== "none") return "the grip must keep the page from taking the drag";
document.activeElement.blur(); await wait(60);

// Thing is live under it: a tap on a shape still in view changes the selection, and it stays up.
await tap(shape("a"));
if (heading() !== "Banner" || detent() !== "half") return `tapping behind the sheet: ${heading()}, ${detent()}`;

// A short drag springs back, a drag past half way up settles at full, a flick goes one step.
await drag(grip, 0, -40, 400); await settle();
if (detent() !== "half" || Math.abs(tall() - half) > 2) return `a short drag: ${detent()}, ${tall()}`;
await drag(grip, 0, -(room - half - 90), 500); await settle();
if (detent() !== "full") return `a long drag up: ${detent()}`;
if (Math.abs(tall() - (room - 24)) > 2) return `full is ${tall()}`;
await drag(grip, 0, 120, 50); await settle();
if (detent() !== "half") return `a flick down from full: ${detent()}`;
await drag(grip, 0, 120, 50); await settle();
if (detent() !== "peek" || tall() !== 96) return `a flick down from half: ${detent()}, ${tall()}`;
if (heading() !== "Banner") return "the strip does not name the selection";
await drag(grip, 0, -60, 40); await settle();
if (detent() !== "half") return `a flick up from the strip: ${detent()}`;
// Across does nothing.
await drag(grip, 100, 0, 200); await settle();
if (detent() !== "half") return `a sideways drag: ${detent()}`;
// Cancelled.
const g = rect(grip), p = { x: g.left + g.width / 2, y: g.top + g.height / 2 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
for (let n = 1; n <= 6; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x, y: p.y - n * 15 }] }); await wait(16); }
await wait(80);
if (Math.abs(tall() - half - 90) > 3) return `the sheet did not follow the finger: ${tall()}`;
// State changing mid-drag: a thing moved from outside, a new height for the whole. It stays under the finger.
const pulledTo = panel.style.height, rootStyle = view.getAttribute("style");
$("#inspect-demo-nudge").click(); await wait(80);
if (panel.style.height !== pulledTo) return `a nudge took the drag to ${panel.style.height}`;
$("#inspect-demo-tall").click(); await wait(80);
if (view.getAttribute("style") === rootStyle) return "the height did not change, so this proves nothing";
if (panel.style.height !== pulledTo) return `a change of height took the drag to ${panel.style.height}`;
$("#inspect-demo-tall").click(); await wait(80);
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await settle();
if (detent() !== "half" || Math.abs(tall() - half) > 2) return `a cancelled drag: ${detent()}, ${tall()}`;
// A tap, and the keys.
await tap(grip); await settle();
if (detent() !== "full") return `a tap from half: ${detent()}`;
await tap(grip); await settle();
if (detent() !== "half") return `a tap from full: ${detent()}`;
grip.focus();
key(grip, "ArrowDown"); await settle();
if (detent() !== "peek") return `ArrowDown: ${detent()}`;
key(grip, "ArrowDown"); await wait(40);
if (detent() !== "peek") return "ArrowDown went past the strip";
key(grip, "ArrowUp"); await wait(40); key(grip, "ArrowUp"); await settle();
if (detent() !== "full") return `ArrowUp twice: ${detent()}`;
key(grip, "ArrowDown"); await settle();
// Selecting nothing lowers it; selecting raises it.
await tap($("#inspect-demo-none")); await settle();
if (detent() !== "peek") return `selecting nothing leaves it at ${detent()}`;
await tap(shape("a")); await settle();
if (detent() !== "half") return `selecting something leaves it at ${detent()}`;

// The keyboard: by a stand-in, as above it.
const vv = visualViewport, shut = vv.height;
Object.defineProperty(vv, "height", { configurable: true, get: () => shut - 300 });
vv.dispatchEvent(new Event("resize"));
await settle();
if (Math.abs(rect(panel).bottom - (shut - 300)) > 1) return `over the keyboard it ends at ${rect(panel).bottom}`;
// The root's style changing does not drop it behind the keyboard.
$("#inspect-demo-tall").click(); await settle();
if (panel.getBoundingClientRect().bottom > shut - 300 + 1) return `a change of height dropped it to ${rect(panel).bottom}`;
$("#inspect-demo-tall").click(); await settle();
delete vv.height;
vv.dispatchEvent(new Event("resize"));
await settle();
if (Math.abs(rect(panel).bottom - rect(view).bottom) > 1) return "it did not come down";

await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(450);
if (Math.abs(rect(panel).width - 300) > 1 || panel.style.height) return "back on a tablet it is not the side panel";
if (heading() !== "Banner") return "the trip lost the selection";
