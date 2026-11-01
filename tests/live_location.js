// mobile
const text = (s) => $(s)?.textContent.trim();
const dist = () => text(".ui-liveloc-distance"), speed = () => text(".ui-liveloc-speed"), acc = () => text(".ui-liveloc-accuracy");
const say = () => text(".ui-liveloc-say");
const note = () => $("#live-location-demo-note").textContent;
const status = () => $(".ui-liveloc").dataset.status;
const vis = (v) => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v }); document.dispatchEvent(new Event("visibilitychange")); };
// The bar ignores a second press inside 350 ms, so a test leaves more than that between them.
const press = async (el) => { await tap(el); await wait(150); };
const R = 6371008.8, rad = Math.PI / 180;
const hav = (a, b) => { const la = a.lat * rad, lb = b.lat * rad, dl = (b.lon - a.lon) * rad, h = Math.sin((lb - la) / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dl / 2) ** 2; return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
// The same filter worked out here, independently, for the walk in the demo.
const walk = [[14.58320, 120.97950, 8], [14.58340, 120.97960, 8], [14.58360, 120.97975, 6], [14.58385, 120.97990, 6], [14.58400, 120.98015, 5], [14.58410, 120.98040, 7]];
let est = { lat: walk[0][0], lon: walk[0][1] }, P = walk[0][2] ** 2, anchor = est, total = 0, last = est, sp = null;
for (const [lat, lon, a] of walk.slice(1)) {
    P += 10 * 9;
    const k = P / (P + a * a);
    const next = { lat: est.lat + k * (lat - est.lat), lon: est.lon + k * (lon - est.lon) };
    P = (1 - k) * P;
    const seen = hav(last, next) / 10;
    sp = sp === null ? seen : sp * 0.6 + seen * 0.4;
    const step = hav(anchor, next);
    if (step >= Math.max(a / 2, 3)) { total += step; anchor = next; }
    est = last = next;
}
if (Math.abs(hav({ lat: 0, lon: 0 }, { lat: 1, lon: 0 }) - 111195.08) > 0.1) return "the worked haversine is off";
try {
    // The saved walk, replayed.
    await wait(100);
    if (dist() !== `${Math.round(total)} m`) return "replay distance: " + dist() + " wanted " + Math.round(total);
    if (speed() !== `${(sp * 3.6).toFixed(1)} km/h`) return "replay speed: " + speed() + " wanted " + (sp * 3.6).toFixed(1);
    if (acc() !== "±7 m") return "replay accuracy: " + acc();
    if ($$(".ui-liveloc-path").length !== 1) return "one run of path: " + $$(".ui-liveloc-path").length;
    const pts = $(".ui-liveloc-path").getAttribute("points").split(" ").map((p) => p.split(",").map(Number));
    if (pts.length !== 6) return "points in the path: " + pts.length;
    // North up, east right, and all of it inside the map.
    if (!(pts[5][1] < pts[0][1])) return "north should be up: " + pts[0] + " " + pts[5];
    if (!(pts[5][0] > pts[0][0])) return "east should be right: " + pts[0] + " " + pts[5];
    for (const [x, y] of pts) if (x < 0 || x > 300 || y < 0 || y > 200) return "off the map: " + x + "," + y;
    if (!$(".ui-liveloc-start") || text(".ui-liveloc-start") !== "Carry on") return "button: " + text(".ui-liveloc-start");

    // A double tap on Stop: it turns into "Carry on" and Reset under the same finger.
    await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
    await cdp("Emulation.setGeolocationOverride", { latitude: 10, longitude: 20, accuracy: 5 });
    await press($(".ui-liveloc-start"));
    await wait(100);
    for (const share of [0.25, 0.8]) {
        if (!$(".ui-liveloc-stop")) { await press($(".ui-liveloc-start")); await wait(100); }
        const bar = $(".ui-liveloc-stop").getBoundingClientRect(), p = { x: bar.left + bar.width * share, y: bar.top + bar.height / 2 };
        for (let i = 0; i < 2; i++) { await fingers("touchStart", [p]); await fingers("touchEnd", []); await wait(90); }
        await wait(400);
        if (!$(".ui-liveloc-start") || status() !== "idle") return "a double tap on Stop started it again: " + status();
        if (dist() === "0 m") return "a double tap on Stop reset the walk";
    }

    // Reset, then a real watch from Chrome with real positions.
    await press($(".ui-liveloc-reset"));
    if (dist() !== "0 m" || speed() !== "--" || acc() !== "--" || $(".ui-liveloc-path")) return "reset: " + dist();
    await cdp("Browser.grantPermissions", { permissions: ["geolocation"] });
    await cdp("Emulation.setGeolocationOverride", { latitude: 10, longitude: 20, accuracy: 5 });
    await press($(".ui-liveloc-start"));
    await wait(400);
    if (status() !== "on" || acc() !== "±5 m") return "watching: " + status() + " " + acc();
    await cdp("Emulation.setGeolocationOverride", { latitude: 10.0005, longitude: 20, accuracy: 5 });
    await wait(1200);
    await cdp("Emulation.setGeolocationOverride", { latitude: 10.001, longitude: 20, accuracy: 5 });
    await wait(400);
    const metres = parseInt(dist());
    if (!(metres > 40 && metres < 112)) return "real distance: " + dist();
    if (!note().startsWith("3 fixes, 0 left out")) return "real callback: " + note();

    // Stop, with its callback, and nothing goes on arriving.
    await press($(".ui-liveloc-stop"));
    if (!note().includes(`Stopped at ${metres} m.`) && !note().includes("Stopped at")) return "on_stop: " + note();
    await cdp("Emulation.setGeolocationOverride", { latitude: 10.002, longitude: 20, accuracy: 5 });
    await wait(300);
    if (parseInt(dist()) !== metres) return "moved after stopping: " + dist();
    await press($(".ui-liveloc-reset"));
    await cdp("Emulation.clearGeolocationOverride");

    // From here, fixes by hand with exact times, through a stand-in watch.
    let send = null, fail = null, opts = null, cleared = 0, watched = 0;
    const g = navigator.geolocation;
    Object.defineProperty(g, "watchPosition", { configurable: true, value: (ok, bad, o) => { send = ok; fail = bad; opts = o; watched++; return 7; } });
    Object.defineProperty(g, "clearWatch", { configurable: true, value: (id) => { if (id === 7) cleared++; } });
    const fix = (lat, lon, accuracy, at, sp = null) => { send({ coords: { latitude: lat, longitude: lon, accuracy, speed: sp }, timestamp: at }); return wait(30); };
    await press($(".ui-liveloc-start"));
    if (opts.enableHighAccuracy !== true || opts.maximumAge !== 0) return "options: " + JSON.stringify(opts);
    if (say() !== "Waiting for the first fix.") return "asking: " + say();

    // Standing still with GPS wandering 2 m either way: no distance at all.
    let at = 1000000;
    await fix(0, 0, 5, at);
    if (status() !== "on" || say() !== "") return "first fix: " + status() + " " + say();
    for (let i = 1; i <= 20; i++) await fix(i % 2 ? 0.00002 : -0.00002, 0, 5, (at += 1000));
    if (dist() !== "0 m") return "standing still walked " + dist();

    // Real walking, north at 1.5 m/s, a good fix each 2 s. Lands within one step of the truth.
    const start = parseFloat(0), step = 3 / 111194.9;
    for (let i = 1; i <= 50; i++) await fix(i * step, 0, 5, (at += 2000));
    const walked = parseInt(dist());
    if (!(walked >= 140 && walked <= 150)) return "150 m walked read as " + dist();
    if (speed() !== "5.4 km/h") return "speed from places: " + speed();

    // The device's own speed goes ahead of the worked one.
    await fix(51 * step, 0, 5, (at += 2000), 2.5);
    if (speed() !== "9.0 km/h") return "device speed: " + speed();
    // iOS's -1 is no speed.
    await fix(52 * step, 0, 5, (at += 2000), -1);
    if (speed() === "--" || speed().startsWith("-")) return "speed -1: " + speed();

    // Left out, each counted: poor, stale and a jump. None of them move anything.
    const before = dist(), kept = note();
    await fix(53 * step, 0, 500, (at += 2000));
    if (acc() !== "±500 m") return "a poor fix should still show its accuracy: " + acc();
    if (dist() !== before) return "a poor fix: " + dist();
    await fix(0, 0, 5, at - 60000);
    if (dist() !== before) return "a stale fix: " + dist();
    await fix(5, 5, 5, (at += 2000));
    if (dist() !== before) return "a jump: " + dist();
    await fix(54 * step, 0, 5, (at += 2000));
    if (!note().includes("2 left out")) return "left out: " + note();
    await fix(NaN, 0, 5, (at += 1000));
    await fix(91, 0, 5, (at += 1000));
    await fix(55 * step, 0, 5, (at += 1000));
    if (!note().includes("4 left out")) return "bad fixes: " + note();

    // Off the screen: the watch stops, and comes back with a break in the path.
    const c0 = cleared, w0 = watched;
    vis("hidden");
    await wait(60);
    if (cleared !== c0 + 1 || status() !== "away" || say() !== "Stopped while this page is off the screen.") return "away: " + status() + " " + cleared;
    if (text(".ui-liveloc-stop") !== "Stop") return "Stop stays while away";
    vis("visible");
    await wait(60);
    if (watched !== w0 + 1) return "should watch again on coming back";
    const gone = dist();
    await fix(0.01, 0, 5, (at += 600000));
    if ($$(".ui-liveloc-path").length !== 2) return "a break in the path: " + $$(".ui-liveloc-path").length;
    if (dist() !== gone) return "the break should add nothing: " + dist() + " vs " + gone;
    await fix(0.01 + 2 * step, 0, 5, (at += 1000));
    await fix(0.01 + 4 * step, 0, 5, (at += 1000));
    if (parseInt(dist()) <= parseInt(gone)) return "after the break it goes on: " + dist();

    // Stopping while hidden stays stopped.
    await press($(".ui-liveloc-stop"));
    const c1 = cleared, w1 = watched;
    vis("hidden"); vis("visible");
    await wait(60);
    if (watched !== w1 || status() !== "idle") return "came back on by itself: " + status();

    // Errors: a weak signal goes on; a refusal ends it.
    await press($(".ui-liveloc-reset"));
    await press($(".ui-liveloc-start"));
    fail({ code: 3, message: "timeout" });
    await wait(40);
    if (status() !== "weak" || say() !== "No signal just now. Still trying.") return "weak: " + say();
    await fix(1, 1, 5, 5000);
    if (status() !== "on" || say() !== "") return "signal back: " + say();
    fail({ code: 1, message: "denied" });
    await wait(40);
    if (!say().startsWith("Location is blocked for this page") || $(".ui-liveloc-settings")) return "refused: " + say();
    delete g.watchPosition; delete g.clearWatch;
    await press($(".ui-liveloc-reset"));

    // A place from Chrome's real refusal.
    await cdp("Browser.setPermission", { permission: { name: "geolocation" }, setting: "denied" });
    await press($(".ui-liveloc-start"));
    await wait(200);
    if (status() !== "refused") return "real refusal: " + status();
    await cdp("Browser.resetPermissions");

    // The app: asked every second here, with no watch at all.
    let n = 0, answer = () => { n++; return { lat: n * 0.0001, lon: 0, accuracy: 4, at: 2000000 + n * 1000, speed: 1 }; };
    let settings = 0;
    window.quilloNative = { location: async () => answer(), openSettings: async () => { settings++; return true; } };
    await press($(".ui-liveloc-start"));
    await wait(150);
    if (n !== 1) return "the first ask: " + n;
    await wait(2300);
    if (n < 3 || n > 4) return "the app should be asked once a second: " + n;
    if (status() !== "on") return "app: " + status();
    if (parseInt(dist()) < 8) return "app distance: " + dist();
    if (speed() !== "3.6 km/h") return "app speed: " + speed();

    // A slow answer: one ask at a time.
    const n0 = n;
    let release, slow = true;
    const old = answer;
    answer = () => { n++; return new Promise((r) => { release = r; }); };
    await wait(3200);
    if (n !== n0 + 1) return "asks stacked up: " + (n - n0);
    answer = old;
    release({ lat: 0.5, lon: 0, accuracy: 4, at: 1 });
    await wait(100);

    // Leaving the screen stops the asking.
    vis("hidden");
    await wait(60);
    const n1 = n;
    await wait(1400);
    if (n !== n1) return "the app was asked while away";
    vis("visible");
    await wait(1400);
    if (n <= n1) return "asks should start again on coming back";

    // Refused in the app: a way to Settings, and back.
    answer = () => { throw new Error("location is turned off for this app"); };
    await wait(1300);
    if (status() !== "refused" || !$(".ui-liveloc-settings")) return "app refused: " + status();
    if (!say().includes("allow it in Settings")) return "app refused words: " + say();
    answer = old;
    await tap($(".ui-liveloc-settings"));
    if (settings !== 1) return "settings: " + settings;
    vis("visible");
    await wait(200);
    if (status() !== "on" && status() !== "asking") return "back from Settings: " + status();
    await press($(".ui-liveloc-stop"));
    delete window.quilloNative;

    // `start`: follows from its first moment, with no tap on it. Miles here.
    const second = $("#live-location-demo-second");
    let m2 = 0;
    window.quilloNative = { location: async () => { m2++; return { lat: m2 * 0.01, lon: 0, accuracy: 4, at: 3000000 + m2 * 60000 }; } };
    await tap(second);
    await wait(1400);
    const two = $$(".ui-liveloc")[1];
    if (!two || two.dataset.status !== "on") return "start: " + two?.dataset.status;
    if (m2 < 2) return "start should go on asking: " + m2;
    if (!two.querySelector(".ui-liveloc-distance").textContent.endsWith(" mi")) return "start, in miles: " + two.querySelector(".ui-liveloc-distance").textContent;
    // Leaving the page stops it, with nobody pressing Stop.
    await tap(second);
    const m3 = m2;
    await wait(1300);
    if (m2 !== m3) return "still asking after leaving the page: " + (m2 - m3);
    delete window.quilloNative;

    // Nothing at all.
    await press($(".ui-liveloc-reset"));
    const gd = Object.getOwnPropertyDescriptor(Navigator.prototype, "geolocation");
    Object.defineProperty(Navigator.prototype, "geolocation", { configurable: true, get: () => undefined });
    await press($(".ui-liveloc-start"));
    await wait(60);
    const none = say();
    Object.defineProperty(Navigator.prototype, "geolocation", gd);
    if (none !== "This browser cannot give a location.") return "none: " + none;

    // The status comes and goes without moving the buttons.
    const y0 = $(".ui-liveloc-start").getBoundingClientRect().top;
    if ($(".ui-liveloc-say").getBoundingClientRect().top < y0) return "the status should come after the buttons";

    // Tablet: numbers beside the map; phone, under it.
    const m = $(".ui-liveloc-map").getBoundingClientRect(), s = $(".ui-liveloc-stats").getBoundingClientRect();
    if (device === "tablet" && !(s.left >= m.right)) return "tablet layout";
    if (device === "phone" && !(s.top >= m.bottom)) return "phone layout";
} finally {
    delete window.quilloNative;
    delete document.visibilityState;
    delete navigator.geolocation.watchPosition;
    delete navigator.geolocation.clearWatch;
    await cdp("Emulation.clearGeolocationOverride");
    await cdp("Browser.resetPermissions");
}
