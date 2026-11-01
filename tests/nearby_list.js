// mobile
delete window.quilloNative;
// With no time from the page, opening appears once it has started, by the phone's clock, and the
// server's page has none, so that server and browser agree.
const own = $(".nearby-list-demo-own");
if (own.querySelector(".ui-nearby-open")?.textContent !== "Opencloses 00:00") return "own clock: " + own.querySelector(".ui-nearby-open")?.textContent;
const html = await (await fetch(location.href)).text();
if (new DOMParser().parseFromString(html, "text/html").querySelector(".nearby-list-demo-own .ui-nearby-open")) return "the server said what is open with no time";

const rows = () => $$(".ui-nearby-row").filter((r) => !r.closest(".nearby-list-demo-own"));
const names = () => rows().map((r) => r.querySelector(".ui-nearby-name").textContent);
const row = (id) => $(`.ui-nearby:not(.nearby-list-demo-own) .ui-nearby-row[data-id="${id}"]`);
const far = (id) => row(id).querySelector(".ui-nearby-far").textContent;
const walk = (id) => row(id).querySelector(".ui-nearby-walk").textContent;
const open = (id) => row(id).querySelector(".ui-nearby-open")?.textContent ?? null;
const say = () => $(".ui-nearby-say").textContent.trim();

// From Rossio, worked out by a haversine apart from the component: e 95.4 m, c 409.7, b 947.1, d 3221.4, a 5828.7.
const order = "Pharmacy on the corner,A Brasileira,Time Out Market,Museu do Oriente,Pasteis de Belem,The kiosk nobody mapped";
if (names().join() !== order) return "from Rossio: " + names();
if (far("e") !== "100 m" || far("c") !== "410 m" || far("b") !== "950 m" || far("d") !== "3.2 km" || far("a") !== "5.8 km") return "km: " + rows().map((r) => r.querySelector(".ui-nearby-far").textContent);
// Minutes: metres x 1.3 / 80 a minute, rounded up.
if (walk("e") !== "2 min walk" || walk("c") !== "7 min walk" || walk("b") !== "16 min walk" || walk("d") !== "53 min walk" || walk("a") !== "1 h 35 min walk") return "walk: " + rows().map((r) => r.querySelector(".ui-nearby-walk").textContent);
if (far("f") !== "No position") return "no position: " + far("f");

// Tuesday 14:05, read in the place's own hours: spans past midnight, and open all day.
if (open("a") !== "Opencloses 20:00") return "a: " + open("a");
if (open("b") !== "Closes soon14:20") return "b: " + open("b");
if (open("c") !== "Closedopens Tue 18:00") return "c: " + open("c");
if (open("d") !== null) return "no hours but said: " + open("d");
if (open("e") !== "Opencloses 00:00") return "e: " + open("e");
if (row("b").querySelector(".ui-nearby-open").dataset.state !== "soon") return "b should be soon";

// Miles, by a real tap. 95.4 m is 313 ft, to the nearest ten; 947.1 m is 0.589 mi.
await tap($('.ui-nearby-chip[data-unit="mi"]'));
if ($('.ui-nearby-chip[data-unit="mi"]').getAttribute("aria-pressed") !== "true") return "mi not pressed";
if (far("e") !== "310 ft" || far("c") !== "0.3 mi" || far("b") !== "0.6 mi" || far("d") !== "2.0 mi" || far("a") !== "3.6 mi") return "mi: " + rows().map((r) => r.querySelector(".ui-nearby-far").textContent);
if (walk("e") !== "2 min walk") return "walking time changes with units";
if ($(".nearby-list-demo-unit").textContent !== "mi") return "on_units: " + $(".nearby-list-demo-unit").textContent;
await tap($('.ui-nearby-chip[data-unit="km"]'));

// Sorted live: focus stays on the row it was on as it moves down the list.
const first = row("e");
first.focus();
await tap($(".nearby-list-demo-next"));
first.focus();
if (names().join() !== "Time Out Market,A Brasileira,Pharmacy on the corner,Museu do Oriente,Pasteis de Belem,The kiosk nobody mapped") return "from Cais do Sodre: " + names();
if (far("b") !== "160 m" || far("e") !== "1.0 km" || far("a") !== "5.2 km") return "Cais: " + far("b") + far("e") + far("a");
if (row("e") !== first) return "the row was made again";
if (document.activeElement !== first) return "focus left the moved row";
await tap($(".nearby-list-demo-next"));
if (names().join() !== "Pasteis de Belem,Museu do Oriente,Time Out Market,A Brasileira,Pharmacy on the corner,The kiosk nobody mapped") return "from Belem: " + names();
if ($(".ui-nearby-sr").textContent !== "Nearest now: Pasteis de Belem, 260 m") return "said: " + $(".ui-nearby-sr").textContent;
await tap($(".nearby-list-demo-next"));
if (names()[0] !== "Pharmacy on the corner") return "back at Rossio: " + names();

// A row pressed.
await tap(row("c"));
if ($(".nearby-list-demo-picked").textContent !== "A Brasileira") return "on_pick: " + $(".nearby-list-demo-picked").textContent;

// A new time from the page: evening, Tuesday 21:30.
await tap($(".nearby-list-demo-late"));
if (open("a") !== "Closedopens Wed 08:00") return "evening a: " + open("a");
if (open("b") !== "Closedopens Wed 10:00") return "evening b: " + open("b");
if (open("c") !== "Opencloses 02:00") return "evening c: " + open("c");

// The clock runs by itself: five hours on, 02:30 on Wednesday, past Tuesday's late closing.
const realNow = Date.now;
Date.now = () => realNow.call(Date) + 5 * 3600 * 1000;
await wait(1300);
Date.now = realNow;
if (open("c") !== "Closedopens Wed 18:00") return "the clock did not move: " + open("c");
await wait(1300);
if (open("c") !== "Opencloses 02:00") return "the clock did not come back: " + open("c");

// Open now, by tap.
await tap($(".ui-nearby-only"));
if (names().join() !== "Pharmacy on the corner,A Brasileira") return "open only: " + names();
await tap($(".ui-nearby-only"));
if (rows().length !== 6) return "all again: " + rows().length;

// A position that is no place: no distance, no error, the list in its own order.
await tap($(".nearby-list-demo-lost"));
if (names()[0] !== "Pasteis de Belem" || far("a") !== "") return "bad position: " + names() + far("a");
if (say() !== "Press Near me to sort these by distance.") return "bad position says: " + say();

// The phone's own place, as a watch, real in Chrome, moved along Belem to Rossio.
await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
await cdp("Emulation.setGeolocationOverride", { latitude: 38.6967, longitude: -9.2060, accuracy: 10 });
await tap($(".ui-nearby-me"));
await wait(400);
if ($(".ui-nearby-me").getAttribute("aria-pressed") !== "true") return "not following: " + say();
if (names()[0] !== "Pasteis de Belem" || far("a") !== "260 m") return "following: " + names()[0] + far("a");
await cdp("Emulation.setGeolocationOverride", { latitude: 38.7139, longitude: -9.1394, accuracy: 10 });
await wait(600);
if (names()[0] !== "Pharmacy on the corner") return "the watch did not re-sort: " + names();
await tap($(".ui-nearby-me"));
if ($(".ui-nearby-me").getAttribute("aria-pressed") !== "false") return "did not stop";

// Refused, in a browser: said, and no button for Settings.
await cdp("Browser.setPermission", { permission: { name: "geolocation" }, setting: "denied" });
await tap($(".ui-nearby-me"));
await wait(300);
if (!say().startsWith("Location is blocked for this page")) return "refused: " + say();
if ($(".ui-nearby-settings")) return "no Settings in a browser";
if ($(".ui-nearby-me").getAttribute("aria-pressed") !== "false") return "still following after a refusal";
await cdp("Browser.resetPermissions");
await cdp("Emulation.clearGeolocationOverride");

// The app: its own call, polled, refused, then Settings.
const calls = [];
let answer = { lat: 38.7036, lon: -9.1741, accuracy: 5 };
window.quilloNative = { location: async () => { calls.push("location"); if (answer === null) throw new Error("Location is turned off for this app"); return answer; }, openSettings: async () => { calls.push("settings"); } };
await tap($(".ui-nearby-me"));
await wait(200);
if (calls[0] !== "location" || names()[0] !== "Museu do Oriente" || far("d") !== "0 m") return "app: " + calls + " " + names()[0];
await tap($(".ui-nearby-me"));
answer = null;
await tap($(".ui-nearby-me"));
await wait(200);
if (!say().startsWith("Location is turned off for this app")) return "app refused: " + say();
await tap($(".ui-nearby-settings"));
if (calls[calls.length - 1] !== "settings") return "Settings: " + calls;
delete window.quilloNative;

// A tablet's stage has room for two columns; a phone's does not.
const cols = getComputedStyle($(".ui-nearby-list")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return "columns: " + cols;
