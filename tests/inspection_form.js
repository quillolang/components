// mobile
const form = $(".ui-inspect");
const item = (id) => $$("[data-item]").find((x) => x.dataset.item === id);
const opt = (id, v) => { const l = item(id).querySelector(`input[value="${v}"]`).closest("label"); l.scrollIntoView({ block: "center" }); return l; };
const said = () => $(".ui-inspect-said")?.textContent ?? "";
const sum = () => $(".ui-inspect-sum").textContent;
const live = () => $("#inspect-demo-said").textContent;
const btn = (t) => $$(".ui-inspect .ui-btn").find((b) => b.textContent.trim() === t);
const done = async () => {
    delete window.quilloNative; localStorage.removeItem("ui-inspect-demo"); Storage.prototype.setItem = set0;
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
};
const set0 = Storage.prototype.setItem;
const fail = async (m) => { await wait(800); await done(); return m; };
const picture = async () => {
    const c = document.createElement("canvas"); c.width = 60; c.height = 40;
    c.getContext("2d").fillRect(0, 0, 60, 40);
    return new File([await new Promise((r) => c.toBlob(r, "image/jpeg"))], "s.jpg", { type: "image/jpeg" });
};
const shoot = async (id) => {
    const i = item(id).querySelector(".ui-phev-file"), d = new DataTransfer(); d.items.add(await picture()); i.files = d.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    for (let n = 0; n < 60 && !item(id).querySelector(".ui-phev-grid img"); n++) await wait(100);
    await wait(100);
};
localStorage.removeItem("ui-inspect-demo");
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await cdp("Emulation.setGeolocationOverride", { latitude: 45.5017, longitude: -73.5673, accuracy: 12 });
if (sum() !== "0 of 8 answeredNo score yet") return fail("start: " + sum());
if (opt("brakes", "pass").getBoundingClientRect().height < 56) return fail("big targets");
// Radios are real, named by id, and two sections' items do not share a group.
await tap(opt("brakes", "pass"));
if (!item("brakes").querySelector("input[name='ui-inspect-brakes'][value='pass']").checked) return fail("a real radio");
if (sum() !== "1 of 8 answeredScore 100%") return fail("one pass: " + sum());
// Submit with lines open goes to the first and says how many.
await tap(btn("Submit"));
if (said() !== "7 lines need attention first.") return fail("submit early: " + said());
if (document.activeElement !== item("horn").querySelector("input")) return fail("focus goes to the first open line");
if (item("horn").querySelector(".ui-inspect-need").textContent !== "Needs an answer") return fail("the line says so: " + item("horn").querySelector(".ui-inspect-need").textContent);
// A fail shows a note and a photo, both needed.
await tap(opt("horn", "fail"));
if (item("horn").dataset.answer !== "fail" || !item("horn").querySelector("textarea")) return fail("a fail opens its fields");
if (item("horn").querySelector(".ui-inspect-need").textContent !== "Needs a note and a photo") return fail("needs: " + item("horn").querySelector(".ui-inspect-need").textContent);
// Typing with real keys keeps the focus as the score and the draft go on.
const ta = item("horn").querySelector("textarea");
ta.focus();
for (const ch of ["Horn ", "is ", "dead"]) { await cdp("Input.insertText", { text: ch }); await wait(30); }
if (document.activeElement !== item("horn").querySelector("textarea") || item("horn").querySelector("textarea").value !== "Horn is dead") return fail("typing: " + item("horn").querySelector("textarea")?.value + " on " + document.activeElement.tagName);
if (item("horn").querySelector(".ui-inspect-need").textContent !== "Needs a photo") return fail("note done: " + item("horn").querySelector(".ui-inspect-need").textContent);
await shoot("horn");
if (item("horn").querySelector(".ui-inspect-need").textContent !== "") return fail("photo done: " + item("horn").querySelector(".ui-inspect-need").textContent);
if (!/Horn works/.test(item("horn").querySelector("img").alt)) return fail("the photo's stamp names the line: " + item("horn").querySelector("img").alt);
// A photo can be taken out, and is needed again.
await tap(item("horn").querySelector(".ui-phev-drop"));
if (item("horn").querySelector(".ui-inspect-need").textContent !== "Needs a photo") return fail("photo removed");
await shoot("horn");
// An item with its photo rule off asks only for a note, with its note rule off only for a photo.
await tap(opt("straps", "fail"));
if (item("straps").querySelector(".ui-inspect-need").textContent !== "Needs a note") return fail("straps: " + item("straps").querySelector(".ui-inspect-need").textContent);
await tap(opt("straps", "pass"));
if (item("straps").querySelector("textarea")) return fail("a pass closes the fields");
await tap(opt("insurance", "fail"));
if (item("insurance").querySelector(".ui-inspect-need").textContent !== "Needs a photo") return fail("insurance: " + item("insurance").querySelector(".ui-inspect-need").textContent);
await tap(opt("insurance", "pass"));
// Score by hand: possible brakes 3 + horn 1 + lights 1 + tyres 2 + straps 1 + insurance 1 + aid 1 = 10, N/A out, horn fails: 9 of 10.
for (const [k, v] of [["lights", "pass"], ["tyres", "pass"], ["mirrors", "na"], ["first_aid", "pass"]]) await tap(opt(k, v));
if (sum() !== "8 of 8 answeredScore 90%") return fail("score: " + sum());
if ($(".ui-inspect-sum [data-outcome]").dataset.outcome !== "pass") return fail("90 passes 85");
// A failed critical line fails the whole, whatever the sum. By hand: 6 of 10, as the horn fails too.
await tap(opt("brakes", "fail"));
if (sum() !== "8 of 8 answeredScore 60%, critical failure") return fail("critical: " + sum());
await tap(opt("brakes", "pass"));
// A draft: kept soon after typing stops, and back in a page of its own, as after a reload.
await wait(900);
const kept = JSON.parse(localStorage.getItem("ui-inspect-demo") ?? "null");
if (!kept || kept.answers.horn.note !== "Horn is dead" || kept.answers.horn.photos.length !== 1) return fail("draft: " + JSON.stringify(kept)?.slice(0, 100));
if (+$("#inspect-demo-drafts").textContent < 1) return fail("on_draft");
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:400px;opacity:0;pointer-events:none"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await wait(400);
const fd = frame.contentDocument;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
for (let n = 0; n < 40 && !fd.querySelector(".ui-inspect-note"); n++) await wait(100);
const back = [fd.querySelector(".ui-inspect-note")?.textContent, fd.querySelector("[data-item='horn'] textarea")?.value, fd.querySelector(".ui-inspect-sum")?.textContent];
frame.remove();
if (!/Draft picked up: 8 answered/.test(back[0] ?? "") || back[1] !== "Horn is dead" || back[2] !== "8 of 8 answeredScore 90%") return fail("reload: " + back);
// A browser with no room keeps the words, says so, and the photo stays on the page.
Storage.prototype.setItem = function (k, v) { if (k === "ui-inspect-demo" && v.includes("data:image")) throw new DOMException("full", "QuotaExceededError"); return set0.call(this, k, v); };
await tap(opt("first_aid", "na"));
await tap(opt("first_aid", "pass"));
await wait(900);
Storage.prototype.setItem = set0;
if (!/no room for the photos/.test(form.textContent)) return fail("a full store says so");
const light = JSON.parse(localStorage.getItem("ui-inspect-demo") ?? "null");
if (light?.answers?.horn?.note !== "Horn is dead" || light.answers.horn.photos.length !== 0) return fail("the words are kept: " + JSON.stringify(light)?.slice(0, 120));
if (!item("horn").querySelector(".ui-phev-grid img")) return fail("the photo is still here");
// Turning the phone keeps what is typed, the focus and the place on the page.
const tall = device === "phone" ? [390, 844] : [820, 1180];
const hornBox = item("horn").querySelector("textarea");
hornBox.focus();
hornBox.scrollIntoView({ block: "center" });
await wait(60);
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[1], height: tall[0], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
const onScreen = item("horn").querySelector("textarea").getBoundingClientRect();
const turned = [document.activeElement === hornBox, hornBox.value, onScreen.bottom > 0 && onScreen.top < innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: tall[0], height: tall[1], deviceScaleFactor: 1, mobile: device === "phone" });
await wait(250);
hornBox.blur();
if (!turned[0] || turned[1] !== "Horn is dead") return fail("turning loses the note: " + turned);
// Offline: Submit waits; it goes when the connection does.
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(150);
if (!/No connection/.test(form.textContent)) return fail("says offline");
await tap(btn("Submit"));
if (live() !== "Nothing sent yet.") return fail("nothing offline: " + live());
if (!/Waiting to send: passed, 90%/.test($(".ui-inspect-done h4").textContent)) return fail("waiting: " + $(".ui-inspect-done h4").textContent);
if (!item("horn").querySelector("textarea").disabled) return fail("locked once submitted");
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
if (live() !== "Sent: pass, 90%, 1 failed, 8 lines") return fail("sent: " + live());
if (localStorage.getItem("ui-inspect-demo") !== null) return fail("a sent form leaves no draft");
// Start again: the whole form clears.
await tap(btn("Start a new one"));
if (sum() !== "0 of 8 answeredNo score yet") return fail("again: " + sum());
if ($$(".ui-inspect input:checked").length !== 0) return fail("radios cleared");
// A tablet has the sections beside the form, each with its count, and a tap goes there.
const side = $(".ui-inspect-side");
if (device === "tablet") {
    if (getComputedStyle(side).display === "none") return fail("sections beside the form");
    const body = $$(".ui-inspect-jump");
    if (body[1].textContent !== "Body0/3") return fail("section count: " + body[1].textContent);
    await tap(body[2]);
    await wait(500);
    if (document.activeElement !== item("insurance").querySelector("input")) return fail("jump: " + document.activeElement.outerHTML.slice(0, 80));
    await tap(opt("tyres", "pass"));
    if ($$(".ui-inspect-jump")[1].textContent !== "Body1/3") return fail("count moves");
} else if (getComputedStyle(side).display !== "none") return fail("a phone has no side list");
await done();
