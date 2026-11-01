// mobile
const field = () => $("#ui-mread-value");
const said = () => $(".ui-mread-said").textContent;
const status = () => $(".ui-mread-said").dataset.status;
const last = () => $("#mread-demo-last").textContent;
const pad = (k) => $$(".ui-mread-key").find((b) => b.getAttribute("aria-label") === k);
const btn = (t) => { const b = $$(".ui-mread .ui-btn").find((x) => x.textContent.trim() === t); b?.scrollIntoView({ block: "center" }); return b; };
const press = async (keys) => { for (const k of keys) { const b = pad(k === "." ? "Point" : k); b.scrollIntoView({ block: "center" }); await tap(b); } };
const left = () => $(".ui-mread-sum").textContent;
const clear = async () => { while (field().value) { const b = pad("Delete"); b.scrollIntoView({ block: "center" }); await tap(b); } };
const fail = (m) => m;
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await cdp("Emulation.setGeolocationOverride", { latitude: 45.5, longitude: -73.5, accuracy: 10 });
const picture = async () => {
    const c = document.createElement("canvas"); c.width = 60; c.height = 40; c.getContext("2d").fillRect(0, 0, 60, 40);
    return new File([await new Promise((r) => c.toBlob(r, "image/jpeg"))], "s.jpg", { type: "image/jpeg" });
};
const shoot = async () => {
    const n = $$(".ui-phev-grid li").length;
    const i = $(".ui-phev-file"), d = new DataTransfer(); d.items.add(await picture()); i.files = d.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    for (let k = 0; k < 60 && $$(".ui-phev-grid li").length === n; k++) await wait(100);
    await wait(100);
};
if (left() !== "4 of 4 left.") return fail("start: " + left());
if (field().inputMode !== "none") return fail("the phone's keyboard stays down");
if (pad("5").getBoundingClientRect().height < 64) return fail("big keys");
// Water: 1234.5 on 2026-10-03 to 2026-11-02 is 30 days, at 2.5 a day about 75, and three times that is 225.
await press("1300");
if (field().value !== "1300" || status() !== "ok" || said() !== "Used 65.5 m³. Looks right.") return fail("usual: " + said());
// A point left out: 13105 uses 11870.5, far too much, and 1310.5 uses 76: offered.
await tap(pad("Delete"));
await press("0");
await clear();
await press("13105");
if (status() !== "odd" || said() !== "Used 11870.5 m³ in 30 days. Usually about 75 m³.Use 1310.5") return fail("a point left out: " + said());
await tap(btn("Use 1310.5"));
if (field().value !== "1310.5" || status() !== "ok" || said() !== "Used 76 m³. Looks right.") return fail("the offer: " + field().value + " " + said());
// Keypad: a second point does nothing, and a first on nothing is 0.
await press(".");
if (field().value !== "1310.5") return fail("two points: " + field().value);
await tap(btn("Save reading"));
if (last() !== "w1 1310.5 ok ok used 76") return fail("saved: " + last());
if (left() !== "Saved Water main. 3 of 4 left.") return fail("left: " + left());
// Power: 999980 on a dial of six digits, and 100 now went round: 1000000 - 999980 + 100 = 120, which is just the usual 4 x 30.
if (!/Power, floor 2/.test($(".ui-mread-meter").textContent)) return fail("moves on: " + $(".ui-mread-meter").textContent);
await press("100");
if (status() !== "odd" || said() !== "Looks like the dial went round past 999999: 120 kWh used.") return fail("rollover: " + said());
await tap(btn("Save reading"));
if (left() !== "Take a photo of the dial first. 3 of 4 left.") return fail("odd needs a photo: " + left());
await shoot();
const why = $("#ui-mread-why");
await tap(why);
await cdp("Input.insertText", { text: "New dial fitted" });
await wait(40);
if (document.activeElement !== why || why.value !== "New dial fitted") return fail("the note keeps its focus");
await tap(btn("Save reading"));
if (last() !== "e1 100 odd rollover used 120") return fail("rollover saved: " + last());
// Digits past the dial cannot be saved.
await tap($$(".ui-mread-row")[1]);
await clear();
await press("1000000");
if (status() !== "bad" || said() !== "This dial has only 6 digits." || !btn("Save reading").disabled) return fail("too long: " + said());
await clear();
await press("100");
await tap(btn("Save reading"));
// Gas: 560 again is no change in 30 days, usually 30.
await press("560");
if (status() !== "odd" || said() !== "No change in 30 days. Usually about 30 m³.") return fail("no change: " + said());
await clear();
await press("565");
// 5 used, and 5 x 3 is under 30.
if (status() !== "odd" || said() !== "Only 5 m³ in 30 days. Usually about 30 m³.") return fail("low: " + said());
await clear();
await press("500");
if (status() !== "odd" || said() !== "Lower than the last reading, 560 m³.") return fail("below, no dial: " + said());
await clear();
// Typed, on the phone's keyboard: text is refused with a reason, and a comma is a point.
await tap(btn("Keyboard"));
if (field().inputMode !== "decimal" || pad("5")) return fail("the keyboard route");
await tap(field());
await cdp("Input.insertText", { text: "abc" });
await wait(50);
if (status() !== "bad" || said() !== "That is not a reading: digits and one point.") return fail("text: " + said());
if (document.activeElement !== field()) return fail("focus stays while typing");
field().select();
await cdp("Input.insertText", { text: "590,5" });
await wait(50);
if (status() !== "ok" || said() !== "Used 30.5 m³. Looks right.") return fail("a comma: " + said());
await tap(btn("Keypad"));
await clear();
// Cannot read it: a reason, and it counts as done.
await tap(btn("Cannot read it"));
await tap(btn("No access"));
if (last() !== "g1 null skipped skipped used null") return fail("skip: " + last());
// Pressure: a gauge goes both ways, within 0.8 to 2.5, and 0.5 from the last is the limit.
await press("3.1");
if (status() !== "odd" || said() !== "Outside the sane range: 0.8 to 2.5 bar.") return fail("range: " + said());
await clear();
await press("2.1");
if (status() !== "odd" || said() !== "Moved 0.7 bar from the last, 1.4 bar.") return fail("jump: " + said());
await clear();
await press("1.3");
if (status() !== "ok") return fail("down is fine on a gauge: " + said());
await tap(btn("Save reading"));
// Done: what happened, and Finish.
if (!/Every meter is done/.test($(".ui-mread-done").textContent)) return fail("done");
if (!/3 read, 1 odd, 1 skipped/.test($(".ui-mread-done").textContent)) return fail("sum: " + $(".ui-mread-done").textContent);
// Going back to one opens what was saved, and a change replaces it.
await tap($$(".ui-mread-row")[0]);
if (field().value !== "1310.5") return fail("reopens: " + field().value);
await clear();
await press("1311");
await tap(btn("Save reading"));
if (last() !== "w1 1311 ok ok used 76.5") return fail("redo: " + last());
if ($$(".ui-mread-row")[0].querySelector("small").textContent !== "1311") return fail("row: " + $$(".ui-mread-row")[0].textContent);
await tap(btn("Finish the round"));
if ($("#mread-demo-said").textContent !== "Finished: 4 readings") return fail("finish: " + $("#mread-demo-said").textContent);
// The list and the entry sit side by side on a tablet.
const a = $(".ui-mread-list").getBoundingClientRect(), b = $(".ui-mread-done").getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
