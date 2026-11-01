// mobile
const KEY = "ui-notify-prompt-demo";
const note = () => $("#notify-prompt-demo-note").textContent;
const card = () => $(".ui-notifyask-card");
const text = () => (card()?.textContent ?? "").replace(/\s+/g, " ").trim();
const back = async () => { document.dispatchEvent(new Event("visibilitychange")); await wait(200); };
const N = window.Notification;
const stand = (permission, answer) => {
    const made = [];
    function Fake(t, o) { made.push([t, o.body]); }
    Fake.permission = permission;
    Fake.requestPermission = async () => { Fake.asked = (Fake.asked ?? 0) + 1; const a = await answer(); Fake.permission = a; return a; };
    Fake.made = made;
    window.Notification = Fake;
    return Fake;
};
try {
    localStorage.removeItem(KEY);
    await cdp("Browser.resetPermissions");
    await back();

    // Never asked: the card first, and the system's question has not been asked.
    if (!text().startsWith("Turn on notifications?We'll tell you when your parcel is at the door")) return "card: " + text();
    if ($$(".ui-notifyask-list li").length !== 4) return "reasons: " + $$(".ui-notifyask-list li").length;
    const cols = getComputedStyle($(".ui-notifyask-list")).gridTemplateColumns.split(" ").length;
    if (cols !== (device === "tablet" ? 2 : 1)) return device + " reason columns: " + cols;
    // On a tablet the choice stands beside the case; on a phone, under it.
    const words = $(".ui-notifyask-words").getBoundingClientRect(), yes = $(".ui-notifyask-yes").getBoundingClientRect();
    if (device === "tablet" && !(yes.left >= words.right)) return "tablet: the buttons should stand beside the words";
    if (device === "phone" && !(yes.top >= words.bottom)) return "phone: the buttons should be under the words";

    // Yes: only now is the system asked; allowed.
    let f = stand("default", async () => "granted");
    await back();
    if (f.asked) return "asked before a tap";
    await tap($(".ui-notifyask-yes"));
    await wait(100);
    if (f.asked !== 1) return "asked " + f.asked + " times";
    if (!text().startsWith("Notifications are on.")) return "granted: " + text();
    if (note() !== "on_result: granted") return "result: " + note();

    // Sending a test through the web.
    await tap($(".ui-notifyask-test"));
    await wait(100);
    if (JSON.stringify(f.made) !== '[["Notifications are on","This is how they will look."]]') return "test: " + JSON.stringify(f.made);
    if (!text().endsWith("Sent.")) return "sent: " + text();
    // Where the constructor refuses, as on Android's Chrome.
    function Throws() { throw new TypeError("Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead"); }
    Throws.permission = "granted";
    window.Notification = Throws;
    await tap($(".ui-notifyask-test"));
    await wait(100);
    if (!text().endsWith("This browser sends notifications only through a service worker.")) return "throwing: " + text();

    // Through a service worker: its Promise is waited for, so a refusal is not "Sent."
    const swc = ServiceWorkerContainer.prototype, gr = swc.getRegistration;
    f = stand("granted", async () => "granted");
    await back();
    let shown = [], show = async (t, o) => { shown.push([t, o.body]); };
    swc.getRegistration = async () => ({ showNotification: (t, o) => show(t, o) });
    await tap($(".ui-notifyask-test"));
    await wait(100);
    if (JSON.stringify(shown) !== '[["Notifications are on","This is how they will look."]]' || f.made.length) return "service worker: " + JSON.stringify(shown);
    if (!text().endsWith("Sent.")) return "sent by a worker: " + text();
    show = () => Promise.reject(new TypeError("No active registration"));
    await tap($(".ui-notifyask-test"));
    await wait(100);
    swc.getRegistration = gr;
    if (text().endsWith("Sent.")) return "a refused worker read as sent";

    // Refused at the question: says where to look, with no Settings button in a browser.
    f = stand("default", async () => "denied");
    await back();
    if (!$(".ui-notifyask-yes")) return "should ask again: " + text();
    await tap($(".ui-notifyask-yes"));
    await wait(100);
    if (text() !== "Notifications are blocked for this page. Allow them in your browser's site settings, then come back.") return "refused: " + text();
    if ($(".ui-notifyask-settings")) return "no Settings button in a browser";
    if (note() !== "on_result: refused") return "refused result: " + note();

    // Changed in the settings, then back: read again.
    f.permission = "granted";
    await back();
    if (!text().startsWith("Notifications are on.")) return "allowed from settings: " + text();
    if (note() !== "on_result: granted") return "result after settings: " + note();

    // The question closed with no answer: still never asked, and it says so.
    f = stand("default", async () => "default");
    await back();
    await tap($(".ui-notifyask-yes"));
    await wait(100);
    if (!text().includes("The question closed with no answer.") || !$(".ui-notifyask-yes")) return "dismissed: " + text();
    if (note() !== "on_result: dismissed") return "dismissed result: " + note();

    // Not now: nothing asked, remembered for 7 days, and the way back stays.
    const asked = f.asked;
    const t0 = Date.now();
    await tap($(".ui-notifyask-no"));
    await wait(100);
    if (f.asked !== asked) return "Not now asked anyway";
    if (!text().startsWith("Notifications are off for now.")) return "later: " + text();
    const saved = localStorage.getItem(KEY);
    const until = Number(saved.split(":")[1]);
    if (!saved.startsWith("later:") || Math.abs(until - t0 - 7 * 86400000) > 2000) return "stored: " + saved;
    await back();
    if (!text().startsWith("Notifications are off for now.")) return "a snooze should stand: " + text();
    // Its time is up: the card again.
    localStorage.setItem(KEY, "later:" + (Date.now() - 1000));
    await back();
    if (!$(".ui-notifyask-yes")) return "snooze over: " + text();
    // A person may ask early.
    localStorage.setItem(KEY, "later:" + (Date.now() + 100000));
    await back();
    await tap($(".ui-notifyask-again"));
    await wait(100);
    if (!$(".ui-notifyask-yes")) return "asking early: " + text();
    // A bad value in the store means nothing.
    localStorage.setItem(KEY, "later:soon");
    await back();
    if (!$(".ui-notifyask-yes")) return "bad store: " + text();
    localStorage.removeItem(KEY);

    // Chrome's own permission, not a stand-in.
    window.Notification = N;
    await cdp("Browser.setPermission", { permission: { name: "notifications" }, setting: "denied" });
    await back();
    if (!text().startsWith("Notifications are blocked")) return "real denied: " + text();
    await cdp("Browser.setPermission", { permission: { name: "notifications" }, setting: "granted" });
    await back();
    if (!text().startsWith("Notifications are on.")) return "real granted: " + text();
    await cdp("Browser.resetPermissions");

    // The app: no reading to go on, so the first notification is the question.
    await tap($("#notify-prompt-demo-forget"));
    const sent = [];
    let settings = 0, answer = async (...a) => { sent.push(a); return "abc"; };
    window.quilloNative = { notify: (...a) => answer(...a), openSettings: async () => { settings++; return true; } };
    await back();
    if (!$(".ui-notifyask-yes")) return "app, never asked: " + text();
    await tap($(".ui-notifyask-yes"));
    await wait(100);
    if (JSON.stringify(sent) !== '[["Notifications are on","This is how they will look.",2]]') return "app asked with: " + JSON.stringify(sent);
    if (!text().startsWith("Notifications are on.") || localStorage.getItem(KEY) !== "on") return "app granted: " + text();
    await back();
    if (!text().startsWith("Notifications are on.")) return "the app should remember: " + text();
    if ($("#notify-prompt-demo-kept").textContent !== "To keep in the app's database: on") return "on_save: " + $("#notify-prompt-demo-kept").textContent;
    // A new launch: the port changed, so localStorage is empty. `saved` still knows, and it does not nag.
    localStorage.removeItem(KEY);
    await back();
    if (!text().startsWith("Notifications are on.")) return "a new launch forgot: " + text();
    // Without it, it can only ask again.
    await tap($("#notify-prompt-demo-forget"));
    await back();
    if (!$(".ui-notifyask-yes")) return "nothing saved should ask: " + text();
    await tap($(".ui-notifyask-yes"));
    await wait(100);
    sent.length = 1;

    // A test from the app, refused since: the answer is believed, and remembered.
    await tap($(".ui-notifyask-test"));
    await wait(100);
    if (!text().endsWith("It will arrive in 2 seconds.")) return "app test: " + text();
    answer = async () => { throw new Error("notifications are turned off for this app"); };
    await tap($(".ui-notifyask-test"));
    await wait(100);
    if (text() !== "Notifications are turned off for this app. You can turn them on in Settings.Open Settings" && !text().startsWith("Notifications are turned off for this app.")) return "app refused: " + text();
    if (localStorage.getItem(KEY) !== "refused") return "not remembered: " + localStorage.getItem(KEY);
    await back();
    if (!$(".ui-notifyask-settings")) return "a way to Settings: " + text();

    // To Settings and back: asked again, and it worked.
    answer = async (...a) => { sent.push(a); return "abc"; };
    const before = sent.length;
    await tap($(".ui-notifyask-settings"));
    await wait(100);
    if (settings !== 1) return "openSettings: " + settings;
    await back();
    if (sent.length !== before + 1) return "should ask again on coming back: " + sent.length;
    if (!text().startsWith("Notifications are on.")) return "back from Settings: " + text();
    delete window.quilloNative;
    localStorage.removeItem(KEY);

    // Neither there. A desktop browser's words; iOS has its own.
    const none = [];
    delete window.Notification;
    const ua = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");
    const agent = (a) => Object.defineProperty(Navigator.prototype, "userAgent", { configurable: true, get: () => a });
    agent("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36");
    await back();
    none.push(text());
    agent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15");
    await back();
    none.push(text());
    // An iPad says it is a Mac, and is told by its touch screen, which this test has.
    agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15");
    await back();
    none.push(text());
    Object.defineProperty(Navigator.prototype, "userAgent", ua);
    if (none[0] !== "This browser cannot show notifications.") return "none: " + none[0];
    if (!none[1].startsWith("On iPhone and iPad, a site can send notifications once it is on the Home Screen.")) return "ios: " + none[1];
    if (none[2] !== none[1]) return "ipad: " + none[2];
} finally {
    window.Notification = N;
    delete window.quilloNative;
    localStorage.removeItem(KEY);
    await cdp("Browser.resetPermissions");
}
