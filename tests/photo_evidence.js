// mobile
const say = () => $$(".ui-phev-say").map((p) => p.textContent).join(" | ");
const live = () => $("#phev-demo-said").textContent;
const btn = (t) => $$(".ui-phev .ui-btn").find((b) => b.textContent.trim() === t);
const picture = async (w = 800, h = 600) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.fillStyle = "#e00000"; g.fillRect(0, 0, w / 2, h); g.fillStyle = "#0000e0"; g.fillRect(w / 2, 0, w / 2, h);
    const blob = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.9));
    return new File([blob], "shot.jpg", { type: "image/jpeg" });
};
const give = async (file, sel = ".ui-phev-file") => {
    const i = $(sel), d = new DataTransfer(); d.items.add(file); i.files = d.files;
    i.dispatchEvent(new Event("change", { bubbles: true }));
    for (let n = 0; n < 60; n++) { await wait(100); if (!/Stamping/.test(say()) && !$(".ui-phev-add .ui-btn[aria-busy='true']")) break; }
    await wait(120);
};
const now0 = Date.now, off0 = Date.prototype.getTimezoneOffset;
const clock = (ms, off) => { Date.now = () => ms; Date.prototype.getTimezoneOffset = () => off; };
const done = async () => {
    Date.now = now0; Date.prototype.getTimezoneOffset = off0; delete window.quilloNative; localStorage.removeItem("ui-phev-demo");
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp("Emulation.clearGeolocationOverride");
};
const fail = async (m) => { await done(); return m; };
localStorage.removeItem("ui-phev-demo");
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin: location.origin });
await cdp("Emulation.setGeolocationOverride", { latitude: 45.5017, longitude: -73.5673, accuracy: 12 });
// Nothing missing is claimed at the start; Done refuses and says what is wanted.
await tap(btn("Done"));
if (!/Not yet\. Still needed: Front: 1 more, Damage: 2 more/.test(say())) return fail("done too early: " + say());
if ($("input[name='ui-phev-tag']:checked").value !== "Front") return fail("starts on the first required tag");
// A real photo, at a known moment: 2026-11-02T15:05:09Z, four hours west of UTC.
clock(1793631909000, 240);
await give(await picture());
const stamp = () => $(".ui-phev-view-foot p").textContent;
await tap($(".ui-phev-thumb"));
if (!$(".ui-phev-view").open) return fail("the large view opens");
if (stamp() !== "2026-11-02 11:05:09 -04:00\n45.50170, -73.56730 within 12 m\nJob 4471  Front") return fail("stamp: " + JSON.stringify(stamp()));
// The stamp is in the picture itself: dark bar along the bottom, the photo above it unchanged.
const px = await (async () => {
    const i = new Image(); i.src = $(".ui-phev-view img").src; await i.decode();
    const c = document.createElement("canvas"); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(i, 0, 0);
    const at = (x, y) => [...g.getImageData(x, y, 1, 1).data].slice(0, 3);
    return { w: i.naturalWidth, h: i.naturalHeight, red: at(100, 100), blue: at(700, 100), bar: at(790, 590) };
})();
if (px.w !== 800 || px.h !== 600) return fail("size kept: " + px.w + "x" + px.h);
if (px.red[0] < 180 || px.red[2] > 60) return fail("left half stays red: " + px.red);
if (px.blue[2] < 180 || px.blue[0] > 60) return fail("right half stays blue: " + px.blue);
// The bar is black at 72% over blue 224: about 63 of blue, and red about 0.
if (px.bar[2] > 90 || px.bar[0] > 40) return fail("the stamp's bar: " + px.bar);
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Close"));
if ($(".ui-phev-view").open) return fail("the large view closes");
// One Front done, so it moves on to Damage by itself.
if ($("input[name='ui-phev-tag']:checked").value !== "Damage") return fail("moves on to the next tag wanted");
if ($$(".ui-phev-tag small")[0].textContent !== "1/1" || $$(".ui-phev-tag small")[1].textContent !== "0/2") return fail("counts: " + $$(".ui-phev-tag small").map((x) => x.textContent));
if (live() !== "Sent: Front") return fail("on_send is called: " + live());
// Offline, truly: the browser goes offline, photos wait, and go when it comes back.
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
await wait(200);
if (!/No connection/.test($(".ui-phev-line")?.textContent ?? "")) return fail("says offline: " + $(".ui-phev-line")?.textContent);
// Leap day, east of UTC by 5:30: 2028-02-29T18:29:59Z is 2028-02-29 23:59:59, one more second is March.
clock(Date.UTC(2028, 1, 29, 18, 29, 59), -330);
await give(await picture(3200, 2400));
clock(Date.UTC(2028, 1, 29, 18, 30, 0), -330);
await give(await picture(400, 900));
if (live() !== "Sent: Front") return fail("nothing goes while offline: " + live());
if (!/2 waiting to send/.test($(".ui-phev-line").textContent)) return fail("waiting: " + $(".ui-phev-line").textContent);
if ($$(".ui-phev-wait").length !== 2) return fail("each waiting photo is marked");
await tap($$(".ui-phev-thumb")[1]);
if (!stamp().startsWith("2028-02-29 23:59:59 +05:30")) return fail("leap: " + stamp());
const big = $(".ui-phev-view img"); await big.decode();
if (big.naturalWidth !== 1600 || big.naturalHeight !== 1200) return fail("a large photo is made smaller: " + big.naturalWidth);
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Close"));
await tap($$(".ui-phev-thumb")[2]);
if (!stamp().startsWith("2028-03-01 00:00:00 +05:30")) return fail("into March: " + stamp());
// Taking one out, by the large view, and putting it back, in its place.
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Take out"));
if ($$(".ui-phev-thumb").length !== 2) return fail("taken out");
if (!/Still needed: Damage: 1 more/.test(say())) return fail("wanted again: " + say());
await tap(btn("Undo"));
if ($$(".ui-phev-thumb").length !== 3 || !/All the photos needed/.test(say())) return fail("undo: " + say());
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
if (live() !== "Sent: Front, Damage, Damage") return fail("sent on coming back, in order: " + live());
if ($$(".ui-phev-wait").length !== 0) return fail("no longer marked");
// Done now goes through.
await tap(btn("Done"));
if (live() !== "Done with 3 photos.") return fail("on_done: " + live());
// Kept in this browser: read back in a page of its own, as a reload would.
const kept = JSON.parse(localStorage.getItem("ui-phev-demo") ?? "[]");
if (kept.length !== 3 || !kept[0].url.startsWith("data:image/jpeg")) return fail("kept: " + kept.length);
const frame = document.createElement("iframe"); frame.src = location.href; frame.style.cssText = "position:fixed;left:0;top:0;width:390px;height:400px;opacity:0;pointer-events:none"; document.body.append(frame);
await new Promise((r) => (frame.onload = r));
await wait(400);
const fd = frame.contentDocument;
for (const i of fd.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
for (let n = 0; n < 40 && fd.querySelectorAll(".ui-phev-thumb").length !== 3; n++) await wait(100);
const again = fd.querySelectorAll(".ui-phev-thumb").length, tagNow = [...fd.querySelectorAll(".ui-phev-tag small")].map((x) => x.textContent).join();
frame.remove();
if (again !== 3 || tagNow !== "1/1,2/2") return fail("a reload brings them back: " + again + " " + tagNow);
// The limit of 6.
clock(Date.UTC(2028, 2, 1), 0);
for (let i = 0; i < 3; i++) await give(await picture(40, 40));
if ($$(".ui-phev-thumb").length !== 6) return fail("up to the limit: " + $$(".ui-phev-thumb").length);
if (!$(".ui-phev-add .ui-btn").disabled) return fail("no more past the limit");
localStorage.removeItem("ui-phev-demo");
// A file that is no picture says so and adds nothing: take one out first to free the limit.
await tap($$(".ui-phev-thumb")[5]);
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Take out"));
await give(new File(["not a picture"], "x.jpg", { type: "image/jpeg" }));
if (!/could not be read as a picture/.test(say())) return fail("a bad file: " + say());
if ($$(".ui-phev-thumb").length !== 5) return fail("a bad file adds nothing");
// A library photo says so on its stamp.
await give(await picture(40, 40), ".ui-phev-album");
if ($$(".ui-phev-thumb").length !== 6) return fail("library");
await tap($$(".ui-phev-thumb")[5]);
if (!stamp().startsWith("From library, added 2028-03-01")) return fail("library stamp: " + stamp());
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Take out"));
// In the app: quilloNative gives the place, and a refusal keeps the photo and offers Settings.
let settings = 0;
window.quilloNative = { location: () => Promise.reject(new Error("Location is turned off for this app")), wait: () => new Promise(() => {}), openSettings: () => { settings++; return Promise.resolve(true); } };
await give(await picture(40, 40));
if (!/Location is off for this app/.test(say())) return fail("refused in the app: " + say());
if ($$(".ui-phev-thumb").length !== 6) return fail("a refusal keeps the photo");
await tap($$(".ui-phev-thumb")[5]);
if (!/Place not known/.test(stamp())) return fail("the stamp says so: " + stamp());
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Take out"));
await tap(btn("Open Settings"));
if (settings !== 1) return fail("Settings opens");
window.quilloNative = { location: () => Promise.resolve({ lat: -33.8688, lon: 151.2093, accuracy: 7.4 }), wait: () => new Promise(() => {}) };
await give(await picture(40, 40));
await tap($$(".ui-phev-thumb")[5]);
if (!/-33\.86880, 151\.20930 within 7 m/.test(stamp())) return fail("the app's place: " + stamp());
await tap($$(".ui-phev-view .ui-btn").find((b) => b.textContent.trim() === "Take out"));
// A place that never comes does not hold the photo: the wait wins.
window.quilloNative = { location: () => new Promise(() => {}), wait: () => Promise.resolve(true) };
await give(await picture(40, 40));
if (!/No place came in time/.test(say())) return fail("timeout: " + say());
// The two columns are a tablet's.
const side = $(".ui-phev-side").getBoundingClientRect(), other = $$(".ui-phev-side")[1].getBoundingClientRect();
if (device === "tablet" ? other.left <= side.left : other.top <= side.top) return fail("layout: " + device);
await done();
