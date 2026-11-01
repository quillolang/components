// mobile
delete window.quilloNative;
const stage = () => $(".ui-pindrop-stage");
const coords = () => $(".ui-pindrop-coords").textContent;
const field = () => $('input[name="pin-dropper-demo"]').value.split(",").map(Number);
const rest = () => $(".pin-dropper-demo-rest").textContent;
const spot = () => $(".pin-dropper-demo-spot").textContent;
const say = () => $(".ui-pindrop-say").textContent;
const settled = async (ms = 500) => { await wait(ms); };
for (let i = 0; i < 40 && !$(".leaflet-tile-pane"); i++) await wait(100);
if (!$(".leaflet-tile-pane")) return "no map";
await settled(300);

if (coords() !== "38.71390, -9.13940") return "start: " + coords();
// 156543.03392 x cos(38.7139) / 65536 is 1.864 m.
if ($(".ui-pindrop-near").textContent !== "About 1.9 m a pixel") return "scale: " + $(".ui-pindrop-near").textContent;

// The pin's tip is the middle of the map, whatever the size of the screen.
const pinBox = $(".ui-pindrop-pin").getBoundingClientRect(), mapBox = $(".ui-pindrop-map").getBoundingClientRect();
if (Math.abs(pinBox.bottom - (mapBox.top + mapBox.height / 2)) > 1 || Math.abs(pinBox.left + pinBox.width / 2 - (mapBox.left + mapBox.width / 2)) > 1) return "the pin is not in the middle";
if (getComputedStyle($(".ui-pindrop-pin")).pointerEvents !== "none") return "the pin takes touches";

// A drag moves the map under it. Held still before lifting, so that no coasting follows: 100 px
// left is 100 x 360 / (256 x 2^16) = 0.0021458 degrees east, and the same word for word in the readout.
const p = middle($(".ui-pindrop-map"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x - i * 10, y: p.y }]); await wait(16); }
await wait(40);
const lifted = $(".ui-pindrop").hasAttribute("data-moving"), during = coords();
await wait(150);
await fingers("touchEnd", []);
await settled();
if (!lifted) return "the pin does not lift while moving";
if (during === "38.71390, -9.13940") return "the coordinates did not follow during the drag";
if ($(".ui-pindrop").hasAttribute("data-moving")) return "the pin stayed up";
const [lat1, lng1] = field();
if (Math.abs(lat1 - 38.7139) > 0.00003) return "a drag sideways moved north: " + lat1;
// Leaflet takes the first pixels as a threshold of its own, 3 at most.
if (Math.abs(lng1 - (-9.1394 + 0.0021458)) > 0.00008) return "drag east: " + lng1;
if (rest() !== `${lat1}, ${lng1}`) return "on_move: " + rest();

// Stands where it was put; press to pick, with a real tap.
await tap($(".ui-pindrop-go"));
if (spot() !== `${lat1}, ${lng1}`) return "on_pick: " + spot();
if (!$(".ui-pindrop-picked").textContent.startsWith("Picked ")) return "no word of the pick";

// Back to a known place, from the page.
await tap($(".pin-dropper-demo-porto"));
await settled();
if (coords() !== "41.14960, -8.61100") return "Porto: " + coords();
if (spot() === "none yet") return "the pick went";
if ($(".ui-pindrop-picked").textContent !== "") return "an old pick stays after moving";

// Keys. Worked out apart from the component: from 41.1496, 40 px east at zoom 16 is 0.00085831
// degrees, and 40 px north 0.000646 more of latitude, by Mercator's stretch at that latitude.
const world = 256 * 2 ** 16;
const mercY = (d) => 0.5 - Math.log(Math.tan(Math.PI / 4 + d * Math.PI / 360)) / (2 * Math.PI);
const fromY = (y) => (2 * Math.atan(Math.exp((0.5 - y) * 2 * Math.PI)) - Math.PI / 2) * 180 / Math.PI;
stage().focus();
key(stage(), "ArrowRight");
await settled();
if (Math.abs(field()[1] - (-8.6110 + 40 / world * 360)) > 0.000006) return "ArrowRight: " + field();
if (Math.abs(field()[0] - 41.1496) > 0.000006) return "ArrowRight moved north: " + field();
key(stage(), "ArrowUp");
await settled();
if (Math.abs(field()[0] - fromY(mercY(41.1496) - 40 / world)) > 0.000006) return "ArrowUp: " + field();
key(stage(), "ArrowDown");
await settled();
key(stage(), "ArrowLeft");
await settled();
if (Math.abs(field()[1] - (-8.6110)) > 0.00001 || Math.abs(field()[0] - 41.1496) > 0.00001) return "back by keys: " + field();

// The buttons, which reach every key's job with a finger or a switch.
await tap($(".ui-pindrop-east"));
await settled();
if (Math.abs(field()[1] - (-8.6110 + 40 / world * 360)) > 0.00001) return "east button: " + field();
await tap($(".ui-pindrop-west"));
await settled();

// Zoom about the pin: same place, new scale.
const before = field();
key(stage(), "+");
await settled(700);
// At 41.1496: 156543.03392 x cos(lat) / 2^17 is 0.8995 m, and at zoom 16 twice that.
if ($(".ui-pindrop-near").textContent !== "About 0.9 m a pixel") return "zoom in: " + $(".ui-pindrop-near").textContent;
if (Math.abs(field()[0] - before[0]) > 0.00001 || Math.abs(field()[1] - before[1]) > 0.00001) return "zoom moved it: " + field() + " from " + before;
await tap($(".ui-pindrop-out-z"));
await settled(700);
if ($(".ui-pindrop-near").textContent !== "About 1.8 m a pixel") return "zoom out: " + $(".ui-pindrop-near").textContent;

// A pinch zooms about the pin as well.
const pinchFrom = field();
await pinch($(".ui-pindrop-map"), 2.2);
await settled(800);
const zoomed = $(".ui-pindrop-near").textContent;
if (zoomed === "About 1.8 m a pixel") return "the pinch did not zoom";
if (Math.abs(field()[0] - pinchFrom[0]) > 0.00002 || Math.abs(field()[1] - pinchFrom[1]) > 0.00002) return "pinch moved it: " + field() + " from " + pinchFrom;
key(stage(), "-");
await settled(700);

// Enter picks.
key(stage(), "Enter");
await wait();
if (!spot().startsWith("41.1")) return "Enter: " + spot();

// Turned: the place stays, and the pin is still on it.
const was = field();
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await settled();
const turned = field();
const box2 = $(".ui-pindrop-map").getBoundingClientRect(), pin2 = $(".ui-pindrop-pin").getBoundingClientRect();
const wide = getComputedStyle($(".ui-pindrop-in")).flexDirection;
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await settled();
if (Math.abs(turned[0] - was[0]) > 0.00001 || Math.abs(turned[1] - was[1]) > 0.00001) return "turning moved it: " + turned + " from " + was;
if (Math.abs(pin2.bottom - (box2.top + box2.height / 2)) > 1) return "turned, the pin left the middle";
if (wide !== "row") return "turned, the panel should go aside: " + wide;
if (getComputedStyle($(".ui-pindrop-in")).flexDirection !== (device === "tablet" ? "row" : "column")) return "layout: " + getComputedStyle($(".ui-pindrop-in")).flexDirection;

// My location: the web's, real in Chrome.
await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
await cdp("Emulation.setGeolocationOverride", { latitude: 38.7, longitude: -9.2, accuracy: 10 });
await tap($(".ui-pindrop-locate"));
await settled();
if (Math.abs(field()[0] - 38.7) > 0.00001 || Math.abs(field()[1] + 9.2) > 0.00001) return "located: " + field();
await cdp("Browser.setPermission", { permission: { name: "geolocation" }, setting: "denied" });
await tap($(".ui-pindrop-locate"));
await wait(300);
if (!say().startsWith("Location is blocked for this page")) return "refused: " + say();
await cdp("Browser.resetPermissions");
await cdp("Emulation.clearGeolocationOverride");

// In the app, the same with its own call, and a way to Settings.
const calls = [];
let refuse = false;
window.quilloNative = { location: async () => { calls.push("location"); if (refuse) throw new Error("Location is turned off for this app"); return { lat: 41.5, lon: -8.4 }; }, openSettings: async () => { calls.push("settings"); } };
await tap($(".ui-pindrop-locate"));
await settled();
if (Math.abs(field()[0] - 41.5) > 0.00001) return "app place: " + field();
refuse = true;
await tap($(".ui-pindrop-locate"));
await wait(300);
if (!say().startsWith("Location is turned off for this app")) return "app refused: " + say();
await tap($(".ui-pindrop-settings"));
if (calls.join() !== "location,location,settings") return "app calls: " + calls;
delete window.quilloNative;

// No script: the pin stays and the arrows still move the numbers.
const hadL = window.L;
await tap($(".pin-dropper-demo-toggle"));
await wait(100);
delete window.L;
await tap($(".pin-dropper-demo-toggle"));
await wait(300);
window.L = hadL;
if (!say().startsWith("The map could not load")) return "no script says: " + say();
const c0 = field();
stage().focus();
key(stage(), "ArrowRight");
await wait(100);
if (field()[1] === c0[1]) return "no script: the arrows do nothing";
if (coords() === `${c0[0]}`) return "no script: the readout";
await tap($(".pin-dropper-demo-toggle"));
await wait(100);
await tap($(".pin-dropper-demo-toggle"));
await wait(300);
