// mobile
const live = () => $("#pod-demo-said").textContent;
const btn = (t) => $$(".ui-pod .ui-btn").find((b) => b.textContent.trim() === t);
const step = () => $$(".ui-pod-step").filter((s) => getComputedStyle(s).display !== "none").map((s) => s.dataset.kind).join();
const opt = (text) => { const o = $$(".ui-pod-opt").find((l) => l.textContent.trim() === text); o.scrollIntoView({ block: "center" }); return o; };
const next = () => btn("Next");
const go = async (kind) => { if (device === "phone") { await tap(next()); await wait(60); if (step() !== kind) throw new Error("step " + step() + " not " + kind); } };
const place = (latitude, longitude, accuracy = 10) => cdp("Emulation.setGeolocationOverride", { latitude, longitude, accuracy });
const now0 = Date.now, off0 = Date.prototype.getTimezoneOffset, share0 = navigator.share, clip = navigator.clipboard;
const done = async () => {
    Date.now = now0; Date.prototype.getTimezoneOffset = off0; delete window.quilloNative;
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp("Emulation.clearGeolocationOverride");
};
const fail = async (m) => { await done(); return m; };
const picture = async () => {
    const c = document.createElement("canvas"); c.width = 60; c.height = 40; c.getContext("2d").fillRect(0, 0, 60, 40);
    return new File([await new Promise((r) => c.toBlob(r, "image/jpeg"))], "s.jpg", { type: "image/jpeg" });
};
const shoot = async () => {
    const n = $$(".ui-pod .ui-phev-grid li").length;
    const i = $(".ui-pod .ui-phev-file"), d = new DataTransfer(); d.items.add(await picture()); i.files = d.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    for (let k = 0; k < 60 && $$(".ui-pod .ui-phev-grid li").length === n; k++) await wait(100);
    await wait(100);
};
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await place(45.5017, -73.5673, 10);
// Nothing goes on before the outcome is said.
if (device === "phone") {
    if (step() !== "outcome") return fail("starts: " + step());
    if (!next().disabled) return fail("Next waits for an outcome");
}
await tap(opt("Handed to someone"));
// By the demo's rules: handed at 240, so a name, a signature (240 is over 100) and the place. No photo.
const list = () => $$(".ui-pod-list li").map((l) => l.textContent).join(" | ");
if (list() !== "OutcomeHanded to someone | Who took itMissing | SignatureMissing | PlaceMissing") return fail("needs: " + list());
await go("who");
if (device === "tablet" && getComputedStyle($('[data-kind="photo"]')).display !== "none") return fail("a photo is not needed");
if (device === "tablet" && step() !== "outcome,who,signature,place,review") return fail("a tablet shows it all: " + step());
if (device === "phone" && document.activeElement.tagName !== "H4") return fail("the heading takes the focus");
const name = $("input[name='ui-pod-recipient']");
await tap(name);
await cdp("Input.insertText", { text: "Luc Moreau" });
await wait(50);
await tap(opt("Family"));
if (name.value !== "Luc Moreau") return fail("name kept");
await go("signature");
// A real signature: a finger across the pad.
const pad = $(".ui-pod canvas");
pad.scrollIntoView({ block: "center" });
await drag(pad, 120, 30);
if (!/Signed/.test($(".ui-pod .ui-signature-pad").textContent)) return fail("the pad takes a finger");
if ($("input[name='ui-pod-signature']").value.slice(0, 22) !== "data:image/png;base64,") return fail("the signature");
const clear = $(".ui-pod .ui-signature-pad-btn");
if (clear.getBoundingClientRect().height < 44) return fail("the pad's buttons are for fingers");
await tap(clear);
if ($$(".ui-pod-list li")[2].textContent !== "SignatureMissing") return fail("a cleared signature counts as none: " + list());
await drag(pad, 120, -30);
await go("place");
// Too far: 45.5100 is 923 m north, against 200 m.
await place(45.51, -73.5673, 10);
await tap(btn("Confirm the place"));
for (let n = 0; n < 40 && !$(".ui-pod-place"); n++) await wait(100);
if (!/45\.51000, -73\.56730 within 10 m, 923 m from the address/.test($(".ui-pod-place").textContent)) return fail("place: " + $(".ui-pod-place").textContent);
if (!/That is 923 m from the address\. Allowed: 200 m\./.test($(".ui-pod-warn").textContent)) return fail("too far: " + $(".ui-pod-warn").textContent);
if ($$(".ui-pod-list li")[3].textContent !== "PlaceMissing") return fail("too far is not done: " + list());
// A sentence stands in for it, and goes on the receipt.
const why = $("#ui-pod-exception");
await tap(why);
await cdp("Input.insertText", { text: "Address is across the river" });
await wait(50);
if ($$(".ui-pod-list li")[3].textContent !== "PlaceDone") return fail("a reason answers it: " + list());
await go("review");
// Finish, at a known moment: 2026-11-02 15:05:09Z at -04:00.
Date.now = () => 1793631909000;
Date.prototype.getTimezoneOffset = () => 240;
await tap(btn("Finish delivery"));
const receipt = () => $(".ui-pod-receipt").textContent;
if ($(".ui-pod-ref").textContent !== "POD-8841-20261102-1105") return fail("ref: " + $(".ui-pod-ref").textContent);
const words = $(".ui-pod-receipt pre").textContent;
const want = ["Proof of delivery POD-8841-20261102-1105", "Delivery: 8841", "For: A. Moreau", "Address: 12 Rue Saint-Paul, Montreal", "Items: Two boxes of tiles, Adhesive",
    "Outcome: Handed to someone", "Received by: Luc Moreau (family)", "Signature: yes", "Place: 45.51000, -73.56730 within 10 m", "Note: Address is across the river", "Driver: J. Tremblay", "Time: 2026-11-02 11:05:09 -04:00"].join("\n");
if (words !== want) return fail("receipt: " + JSON.stringify(words));
if (!$(".ui-pod-sign")?.src.startsWith("data:image/png")) return fail("the signature is on it");
if (live() !== "Sent POD-8841-20261102-1105") return fail("on_complete: " + live());
if (!/Delivered and sent/.test(receipt())) return fail("sent: " + receipt());
// Shared by the web's way, the clipboard's, and the app's sheet.
let shared = null;
navigator.share = (d) => { shared = d.text; return Promise.resolve(); };
await tap(btn("Share receipt"));
if (shared !== want) return fail("share: " + shared);
navigator.share = () => Promise.reject(new DOMException("Share canceled", "AbortError"));
await tap(btn("Share receipt"));
if ($(".ui-pod-receipt .ui-pod-said").textContent !== "") return fail("closing the sheet is no failure: " + $(".ui-pod-receipt .ui-pod-said").textContent);
navigator.share = undefined;
let copied = null;
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (t) => { copied = t; return Promise.resolve(); } } });
await tap(btn("Share receipt"));
if (copied !== want || $(".ui-pod-receipt .ui-pod-said").textContent !== "Copied.") return fail("copied: " + $(".ui-pod-receipt .ui-pod-said").textContent);
delete navigator.clipboard;
if (share0) navigator.share = share0; else delete navigator.share;
let native = null;
window.quilloNative = { share: (t) => { native = t; return Promise.resolve(true); } };
await tap(btn("Share receipt"));
if (native !== want) return fail("the app's sheet: " + native);
// iOS answers a map and Android true; a refusal says so.
window.quilloNative = { share: () => Promise.resolve({ shared: false, to: null }) };
await tap(btn("Share receipt"));
if ($(".ui-pod-receipt .ui-pod-said").textContent === "It could not be shared from here.") return fail("iOS's answer is no refusal");
window.quilloNative = { share: () => Promise.reject(new Error("no screen")) };
await tap(btn("Share receipt"));
if ($(".ui-pod-receipt .ui-pod-said").textContent !== "It could not be shared from here.") return fail("a refused share: " + $(".ui-pod-receipt .ui-pod-said").textContent);
delete window.quilloNative;
await done();
Date.now = now0;
// The rest are other ways it can go, in a fresh instance.
await tap($("#pod-demo-more"));
const sec = () => $$(".ui-pod")[1];
const o2 = (t) => { const o = [...sec().querySelectorAll(".ui-pod-opt")].find((l) => l.textContent.trim() === t); o.scrollIntoView({ block: "center" }); return o; };
const b2 = (t) => { const b = [...sec().querySelectorAll(".ui-btn")].find((x) => x.textContent.trim() === t); b?.scrollIntoView({ block: "center" }); return b; };
const l2 = () => [...sec().querySelectorAll(".ui-pod-list li")].map((l) => l.textContent).join(" | ");
const go2 = async () => { if (device === "phone") { await tap(b2("Next")); await wait(60); } };
await tap(o2("Left in a safe place"));
// The value 40 is under the demo's line of 100, so no signature, and left needs a spot, two photos and the place.
if (l2() !== "OutcomeLeft in a safe place | Where it was leftMissing | PhotoMissing | PlaceMissing") return fail("left: " + l2());
await go2();
await tap(o2("Porch"));
if (sec().querySelector("#pod2-spot-text").value !== "Porch") return fail("a common place fills the field");
await go2();
const shot2 = async () => {
    const n = sec().querySelectorAll(".ui-phev-grid li").length;
    const i = sec().querySelector(".ui-phev-file"), d = new DataTransfer(); d.items.add(await picture()); i.files = d.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    for (let k = 0; k < 60 && sec().querySelectorAll(".ui-phev-grid li").length === n; k++) await wait(100);
    await wait(100);
};
await shot2();
if (!/PhotoMissing/.test(l2())) return fail("two photos: " + l2());
await shot2();
if (!/PhotoDone/.test(l2())) return fail("two photos done: " + l2());
await go2();
// Offline, a strict place: refused, and a sentence does not answer it.
window.quilloNative = { location: () => Promise.reject(new Error("Location is turned off for this app")), wait: () => new Promise(() => {}), openSettings: () => Promise.resolve(true) };
await tap(b2("Confirm the place"));
for (let n = 0; n < 30 && !sec().querySelector(".ui-pod-warn"); n++) await wait(100);
if (!/needs the place/.test(sec().textContent) || !b2("Open Settings")) return fail("strict: " + sec().textContent.slice(0, 300));
if (sec().querySelector("#pod2-exception")) return fail("no reason stands in on a strict rule");
await go2();
await tap(b2("Finish delivery"));
if (!/Still needed: place/.test(sec().textContent)) return fail("finish refuses: " + sec().textContent.slice(-200));
window.quilloNative = { location: () => Promise.resolve({ lat: 45.5017, lon: -73.5673, accuracy: 5 }), wait: () => new Promise(() => {}) };
if (device === "phone") { await tap(b2("Back")); await wait(60); }
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(150);
await tap(b2("Confirm the place"));
for (let n = 0; n < 30 && !sec().querySelector(".ui-pod-place"); n++) await wait(100);
await go2();
await tap(b2("Finish delivery"));
const r2 = sec().querySelector(".ui-pod-receipt");
if (!/Finished, waiting to send/.test(r2.textContent)) return fail("offline: " + r2.textContent);
if (!/Left at: Porch/.test(r2.textContent) || !/Photos: 2/.test(r2.textContent) || /Signature/.test(r2.textContent)) return fail("what was needed is what is on it: " + r2.textContent);
if ($("#pod-demo-said2").textContent !== "") return fail("nothing offline");
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(250);
if (!/^Sent POD-8842-/.test($("#pod-demo-said2").textContent)) return fail("goes when back: " + $("#pod-demo-said2").textContent);
await done();
