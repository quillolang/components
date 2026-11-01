// mobile
delete window.quilloNative;
const area = (id) => $(`.ui-geofence-area[data-id="${id}"]`);
const st = (id) => area(id).dataset.state;
const far = (id) => area(id).querySelector(".ui-geofence-far").textContent;
const east = $(".geofence-status-demo-east");
const go = async (m) => { type(east, String(m)); await wait(60); };
const events = () => $(".geofence-status-demo-events").textContent;
const say = () => $(".ui-geofence-say").textContent.trim();

// The first reading comes from the server's page and crosses nothing. 100 m in a 150 m area.
if (st("yard") !== "inside" || far("yard") !== "50 m inside the edge") return "first: " + st("yard") + " " + far("yard");
if (st("gate") !== "outside" || far("gate") !== "460 m from the edge") return "gate: " + st("gate") + " " + far("gate");
if (events() !== "") return "the first reading crossed: " + events();
if (!$(".ui-geofence-list").textContent.includes("One area has no usable place or radius.")) return "the bad area is not said";

// Going out: the edge is 150 and the band 15, so inside holds until past 165.
for (const m of [149, 151, 160, 165]) { await go(m); if (st("yard") !== "inside") return `left at ${m}`; }
if (far("yard") !== "15 m past the edge, not left yet") return "in the band: " + far("yard");
await go(166);
if (st("yard") !== "outside" || events() !== "out The yard") return "at 166: " + st("yard") + " " + events();

// Jitter at the edge: back and forth from 136 to 164 changes nothing, any number of times.
for (const m of [149, 151, 140, 160, 136, 164, 137, 163, 136]) { await go(m); if (st("yard") !== "outside") return `came in at ${m}`; }
if (far("yard") !== "14 m inside the edge, not in yet") return "still in the band: " + far("yard");
if (events() !== "out The yard") return "flapped: " + events();
await go(134);
if (st("yard") !== "inside" || events() !== "out The yard, in The yard") return "at 134: " + st("yard") + " " + events();

// A worse fix widens the band to its own accuracy: 40 m, so inside holds to 190.
await tap($(".geofence-status-demo-acc-40"));
await go(190);
if (st("yard") !== "inside") return "left at 190 with a 40 m fix";
await go(191);
if (st("yard") !== "outside") return "still in at 191";
await go(100);
if (st("yard") !== "inside") return "back in at 100";
// A small area: the band is never over half the radius, here 20 of Gate 3's 40, whatever the fix.
await tap($(".geofence-status-demo-acc-5"));

// Worse than 100 m: nothing changes, wherever the fix says it is.
await tap($(".geofence-status-demo-acc-150"));
await go(700);
if (st("yard") !== "inside" || far("yard") !== "Weak signal, holding") return "weak: " + st("yard") + " " + far("yard");
if (st("gate") !== "outside") return "weak fix moved the gate";

// A good fix again finds the truth: at 700, out of the yard; then at 600, into the gate. Newest first.
await tap($(".geofence-status-demo-acc-5"));
await go(600);
if (st("yard") !== "outside" || st("gate") !== "inside" || far("gate") !== "40 m inside the edge") return "good fix: " + st("yard") + " " + st("gate") + " " + far("gate");
const log = $$(".ui-geofence-log li").map((l) => l.textContent.replace(/^\d\d:\d\d:\d\d /, ""));
if (log.slice(0, 2).join() !== "Entered Gate 3,Left The yard") return "log: " + log;
if ($$(".ui-geofence-log li").length !== 5) return "the log should stop at 5: " + $$(".ui-geofence-log li").length;
if (!/^\d\d:\d\d:\d\d /.test($(".ui-geofence-log li").textContent)) return "no time in the log";

// The phone's own place: a real watch, with a real crossing, and it says it is following.
await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
await cdp("Emulation.setGeolocationOverride", { latitude: 38.7139, longitude: -9.1394, accuracy: 5 });
await tap($(".ui-geofence-follow"));
await wait(400);
if (!say().startsWith("Following while this screen is open")) return "following says: " + say();
if (st("yard") !== "inside") return "the watch did not bring it in: " + st("yard");
await tap($(".ui-geofence-follow"));
if ($(".ui-geofence-follow").getAttribute("aria-pressed") !== "false" || say() !== "") return "did not stop: " + say();

// Refused.
await cdp("Browser.setPermission", { permission: { name: "geolocation" }, setting: "denied" });
await tap($(".ui-geofence-follow"));
await wait(300);
if (!say().startsWith("Location is blocked for this page")) return "refused: " + say();
if ($(".ui-geofence-settings")) return "no Settings in a browser";
await cdp("Browser.resetPermissions");
await cdp("Emulation.clearGeolocationOverride");

// The app: its own call, a refusal, and Settings.
const calls = [];
window.quilloNative = { location: async () => { calls.push("location"); throw new Error("Location is turned off for this app"); }, openSettings: async () => { calls.push("settings"); } };
await tap($(".ui-geofence-follow"));
await wait(200);
if (!say().startsWith("Location is turned off for this app")) return "app refused: " + say();
await tap($(".ui-geofence-settings"));
if (calls.join() !== "location,settings") return "app calls: " + calls;
delete window.quilloNative;

const cols = getComputedStyle($(".ui-geofence-body")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
