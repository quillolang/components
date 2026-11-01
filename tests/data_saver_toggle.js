// mobile
const cookieOff = () => { document.cookie = "ui-data-saver=; path=/; max-age=0"; };
const box = $("#dsave-demo");
const opt = (m) => box.querySelector(`input[value="${m}"]`);
const lab = (m) => opt(m).closest("label");
const status = () => box.querySelector(".ui-dsave-status").textContent;
const lasts = () => box.querySelector(".ui-dsave-lasts").textContent;
const count = () => box.querySelector(".ui-dsave-count").textContent;
const values = () => [...box.querySelectorAll(".ui-dsave-value")].map((v) => v.textContent).join(" | ");
const told = () => $("#dsave-told").textContent;
const img = $("#dsave-photo"), clip = $("#dsave-clip");
const root = document.documentElement;
const full = img.getAttribute("src"), lite = img.getAttribute("data-lite"), srcset = img.getAttribute("srcset");
const until = async (test, ms = 1500) => { const t = Date.now(); while (Date.now() - t < ms) { if (test()) return true; await wait(15); } return false; };
const frame = async () => {
    const f = document.createElement("iframe");
    f.style.cssText = "position:fixed;inset:0;width:100%;height:100%;border:0;z-index:99999;background:#fff";
    f.src = "/?only=data_saver_toggle";
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(900);
    return f;
};
// The radios under a finger are the real ones.
const r = opt("on").getBoundingClientRect();
if (r.height < 44 || r.width < 44) return "the radio is what a finger presses: " + r.width + "x" + r.height;

// Chrome here says it is off, by navigator.connection.
if (!opt("follow").checked) return "it starts following";
if (status() !== "Data saver is off, because this device's is.") return "status: " + status();
if (values() !== "Full size | Plays by itself | Loaded at once") return "values: " + values();
if (count() !== "Nothing on this page has changed.") return "count: " + count();
if (root.getAttribute("data-data-saver") !== "off") return "the page's mark: " + root.getAttribute("data-data-saver");
if (img.getAttribute("src") !== full || !clip.hasAttribute("autoplay")) return "off changes nothing";

// A real video, playing, so the stop is seen. A canvas stands in for a file.
const canvas = document.createElement("canvas"); canvas.width = 16; canvas.height = 16;
canvas.getContext("2d").fillRect(0, 0, 16, 16);
clip.srcObject = canvas.captureStream(5);
await clip.play();
await wait(50);
if (clip.paused) return "the clip should be playing";

// On, by a real tap on the real radio.
await tap(lab("on"));
if (!opt("on").checked || opt("follow").checked) return "a tap chooses";
if (status() !== "Data saver is on.") return "status: " + status();
if (values() !== "Lighter versions | Waits for a press | Loaded on a press") return "values: " + values();
if (root.getAttribute("data-data-saver") !== "on") return "the page's mark: " + root.getAttribute("data-data-saver");
if (img.getAttribute("src") !== lite) return "the picture is the light one";
if (img.hasAttribute("srcset")) return "srcset would choose the full one again";
if (clip.hasAttribute("autoplay") || !clip.paused || clip.getAttribute("preload") !== "none") return "the clip stops: " + clip.paused;
if (count() !== "On this page: 1 picture lighter, 1 video stopped.") return "count: " + count();
if (told() !== "on_change: true on.") return "on_change: " + told();
if (!document.cookie.includes("ui-data-saver=on")) return "the cookie: " + document.cookie;
if (lasts() !== "This choice stays on this device.") return "lasts: " + lasts();

// What comes later is treated too.
await tap($("#dsave-more"));
if (!(await until(() => $(".dsave-added")?.getAttribute("src") === lite))) return "a picture added later";
if (count() !== "On this page: 2 pictures lighter, 1 video stopped.") return "count after adding: " + count();

// A reload, or a new launch: cookies last. The next page starts on, on its own first paint too.
let f = await frame();
const inside = (s) => f.contentDocument.querySelector(s);
const fOpt = inside('#dsave-demo input[value="on"]').checked;
const fImg = inside("#dsave-photo").getAttribute("src");
f.remove();
if (!fOpt) return "the choice comes back from the cookie";
if (fImg !== lite) return "and takes effect there";

// Off: all put back, and the clip plays again.
await tap(lab("off"));
if (status() !== "Data saver is off.") return "status: " + status();
if (img.getAttribute("src") !== full || img.getAttribute("srcset") !== srcset) return "the picture is put back";
if (!clip.hasAttribute("autoplay") || clip.hasAttribute("preload")) return "the clip's attributes are put back";
if (!(await until(() => !clip.paused))) return "the clip plays again";
if ($(".dsave-added").getAttribute("src") !== full) return "the added picture is put back";
if (told() !== "on_change: false off.") return "on_change: " + told();
if (root.getAttribute("data-data-saver") !== "off") return "the mark";

// Keyboard: arrow keys move in the group, for real.
opt("off").focus();
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
await wait(100);
if (!opt("on").checked) return "arrow keys choose";
await tap(lab("off"));

// Cookies blocked: said so, and it still works for now.
const was = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");
Object.defineProperty(document, "cookie", { configurable: true, get: () => "", set: () => {} });
await tap(lab("on"));
delete document.cookie;
if (lasts() !== "Cookies are blocked here, so this lasts until the page closes.") return "cookies blocked: " + lasts();
if (status() !== "Data saver is on.") return "it works all the same";
await tap(lab("off"));
if (lasts() !== "This choice stays on this device.") return "cookies back: " + lasts();
if (!was) return "the test lost the cookie's descriptor";
cookieOff();

// The phone's own setting, the real one in Chrome, as the page starts.
await cdp("Emulation.setDataSaverOverride", { dataSaverEnabled: true });
f = await frame();
const onStatus = inside("#dsave-demo .ui-dsave-status").textContent, onImg = inside("#dsave-photo").getAttribute("src"), onFollow = inside('#dsave-demo input[value="follow"]').checked;
f.remove();
await cdp("Emulation.setDataSaverOverride", { dataSaverEnabled: false });
if (!onFollow) return "follow stays the choice";
if (onStatus !== "Data saver is on, because this device's is.") return "following the device: " + onStatus;
if (onImg !== lite) return "and it acts on it";

// It changes while open: a stand-in, as Chrome sends no event for the override.
let add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "{ const c = new EventTarget(); c.saveData = false; Object.defineProperty(navigator, 'connection', { value: c, configurable: true }); window.__conn = c; }" });
f = await frame();
const before = inside("#dsave-demo .ui-dsave-status").textContent;
f.contentWindow.__conn.saveData = true;
f.contentWindow.__conn.dispatchEvent(new f.contentWindow.Event("change"));
await wait(100);
const after = inside("#dsave-demo .ui-dsave-status").textContent, fromPhone = inside("#dsave-told").textContent;
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
if (before !== "Data saver is off, because this device's is.") return "before: " + before;
if (after !== "Data saver is on, because this device's is.") return "it follows as it changes: " + after;
if (fromPhone !== "on_change: true follow.") return "on_change from the device: " + fromPhone;

// iOS: nothing is told. It says so, and is honest about being off.
add_ = await cdp("Page.addScriptToEvaluateOnNewDocument", { source: "Object.defineProperty(navigator, 'connection', { value: undefined, configurable: true });" });
f = await frame();
const none = inside("#dsave-demo .ui-dsave-status").textContent;
inside('#dsave-demo input[value="on"]').click(); await wait(100);
const chosen = inside("#dsave-photo").getAttribute("src");
f.remove();
await cdp("Page.removeScriptToEvaluateOnNewDocument", { identifier: add_.identifier });
cookieOff();
if (none !== "Data saver is off. This device does not tell apps about its own, so choose here.") return "not told: " + none;
if (chosen !== lite) return "and the choice here works";

// Two columns where there is room.
const set_ = box.querySelector(".ui-dsave-set").getBoundingClientRect(), what = box.querySelector(".ui-dsave-what").getBoundingClientRect();
if (device === "tablet" ? what.left < set_.right - 1 : what.top < set_.bottom - 1) return "layout on a " + device;
