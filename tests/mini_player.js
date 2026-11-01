// mobile
// A flick with its speed fixed by the events' own times, so a busy machine cannot slow it.
const flick = async (el, dx, dy = 0) => {
    const p = middle(el), t0 = Date.now() / 1000, steps = 5;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p], timestamp: t0 });
    for (let i = 1; i <= steps; i++) await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }], timestamp: t0 + i * 0.012 });
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [], timestamp: t0 + 0.07 });
    await wait();
};
const panel = () => $(".ui-miniplay"), bar = () => $(".ui-miniplay-bar"), grip = () => $(".ui-miniplay-grip"), mainBtn = () => $(".ui-miniplay-main");
const audio = $("#mini-demo");
const frame = $(".demo-phone").getBoundingClientRect();
const tabs = $(".ui-bottomnav").getBoundingClientRect();
const note = () => $("#mini-demo-note").textContent;
const isOpen = () => panel().classList.contains("ui-miniplay-open");
const y = () => panel().getBoundingClientRect().top;
const settle = () => wait(400);
const count = () => Number(note().match(/closed (\d+) times/)[1]);

// It sits on the tabs, by `above`.
await settle();
const bb = bar().getBoundingClientRect();
if (Math.abs(bb.bottom - tabs.top) > 1.5) return "the bar sits on the tabs: " + bb.bottom + " " + tabs.top;
if (bb.height !== 64) return "64 px: " + bb.height;
if (getComputedStyle(bar()).touchAction !== "none") return "the bar's movement is ours";
if ($(".ui-miniplay-names b").textContent !== "Harbour Lights" || $(".ui-miniplay-names span").textContent !== "The Low Tides") return "says what is playing";
const seekShown = getComputedStyle($(".ui-miniplay-seek")).display !== "none";
if (seekShown !== (device === "tablet")) return "a seek bar in the bar on a tablet only: " + seekShown;
if (device === "phone" && getComputedStyle($(".ui-miniplay-line")).display === "none") return "a progress line on a phone";

// The page behind works, past the invisible panel.
await tap($("#mini-demo-open"));
await settle();
if (!isOpen() || note().indexOf("is open") < 0) return "the page's own state opens it: " + note();
if (Math.abs(y() - frame.top) > 1) return "open, it fills the frame: " + y() + " " + frame.top;
await tap(grip());
await settle();
if (isOpen() || note().indexOf("is closed") < 0) return "a tap on the top closes it, and tells the page: " + note();

// Play from the bar, without opening it: the press does not count as opening.
const n0 = count();
await tap($(".ui-miniplay-play"));
await wait(400);
if (audio.paused) return "the play button plays";
if ($(".ui-miniplay-play").getAttribute("aria-label") !== "Pause") return "it turns to Pause";
if (isOpen() || count() !== n0) return "and does not open it";
audio.currentTime = 7; await wait(300);
if (Math.abs(Number($(".ui-miniplay-line").getAttribute("aria-valuenow")) - 50) > 3) return "the progress: " + $(".ui-miniplay-line").getAttribute("aria-valuenow");
await tap($(".ui-miniplay-play")); await wait(150);
if (!audio.paused) return "and pauses";

// A slow short pull follows the finger and comes back.
const rest = y();
const m = middle($(".ui-miniplay-names"));
await fingers("touchStart", [m]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: m.x, y: m.y - i * 10 }]); await wait(30); }
await wait(120);
if (Math.abs(y() - (rest - 80)) > 2) return "the panel follows the finger: " + y() + " wanted " + (rest - 80);
const faded = Number(bar().style.opacity);
const span = rest - frame.top;
if (Math.abs(faded - (span - 80) / span) > 0.02) return "the bar fades as it goes: " + faded;
await fingers("touchEnd", []);
await settle();
if (isOpen() || Math.abs(y() - rest) > 1) return "short of the way it springs back: " + y();
if (panel().style.transform !== "" || bar().style.opacity !== "") return "and leaves no inline style: " + panel().style.transform;

// Held part way while it plays: the progress changes state four times a second, and the panel stays.
await tap($(".ui-miniplay-play")); await wait(200);
await fingers("touchStart", [m]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: m.x, y: m.y - i * 10 }]); await wait(30); }
await wait(120);
const heldY = y(), heldBar = bar().style.opacity;
await wait(800);
const heldLater = y(), barLater = bar().style.opacity;
await fingers("touchEnd", []);
await settle();
await tap($(".ui-miniplay-play")); await wait(150);
if (Math.abs(heldLater - heldY) > 1) return "playing moved the panel under the finger: " + heldLater + " from " + heldY;
if (barLater !== heldBar) return "playing changed the fade: " + barLater;

// Past a quarter of the way, slowly: open.
await drag($(".ui-miniplay-names"), 0, -Math.round(span * 0.4), 700);
await settle();
if (!isOpen()) return "past a quarter opens";
if (document.activeElement !== grip()) return "focus goes to the top";
if (!bar().inert || $(".ui-miniplay-body").inert) return "the bar goes inert, the body wakes";
if (mainBtn().getAttribute("aria-expanded") !== "true") return "aria-expanded";

// Pull down: short stays, long closes, flick closes.
await drag(grip(), 0, Math.round(span * 0.12), 700);
await settle();
if (!isOpen()) return "a short pull down stays";
await drag(grip(), 0, Math.round(span * 0.5), 700);
await settle();
if (isOpen()) return "a long pull down closes";
if (document.activeElement !== mainBtn()) return "focus comes back to the bar: " + document.activeElement.className;
await flick($(".ui-miniplay-names"), 0, -90);
await settle();
if (!isOpen()) return "a flick up opens";
await flick(grip(), 0, 90);
await settle();
if (isOpen()) return "a flick down closes";

// A flick up that turns back at the end stays.
const n1 = count();
// The system taking it: back where it was, nothing said.
await fingers("touchStart", [m]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: m.x, y: m.y - i * 40 }]); await wait(16); }
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await settle();
if (isOpen() || count() !== n1 || panel().style.transform !== "") return "a cancelled pull changes nothing";
// Sideways first is not for the bar, even if it then goes up.
await fingers("touchStart", [m]);
for (let i = 1; i <= 4; i++) { await fingers("touchMove", [{ x: m.x + i * 6, y: m.y }]); await wait(16); }
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: m.x + 24, y: m.y - i * 30 }]); await wait(16); }
await fingers("touchEnd", []);
await settle();
if (isOpen() || count() !== n1 || Math.abs(y() - rest) > 1) return "locked sideways, nothing moves: " + y();
// A tap on the bar opens, once.
await tap(mainBtn());
await settle();
if (!isOpen() || count() !== n1 + 1) return "a tap opens, once: " + count() + " " + (n1 + 1);

// The keys. Tab stays inside; Escape closes; ArrowUp opens; ArrowDown on the top closes.
const inside = $$(".ui-miniplay-body button:not([disabled]), .ui-miniplay-body [tabindex='0']").filter((b) => b.getClientRects().length);
const last = inside[inside.length - 1];
last.focus();
const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
last.dispatchEvent(tab); await wait(60);
if (document.activeElement !== grip()) return "Tab goes round: " + document.activeElement.className;
grip().dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true })); await wait(60);
if (document.activeElement !== last) return "and back";
key(last, "Escape"); await settle();
if (isOpen()) return "Escape closes";
mainBtn().focus();
key(mainBtn(), "ArrowUp"); await settle();
if (!isOpen()) return "ArrowUp opens";
key(grip(), "ArrowDown"); await settle();
if (isOpen()) return "ArrowDown closes";
mainBtn().click(); await settle();
if (!isOpen()) return "Enter on the bar opens";
grip().click(); await settle();
if (isOpen()) return "Enter on the top closes";

// What fills it is the real player, which follows from the same audio.
await tap(mainBtn()); await settle();
const nowBtn = $('.ui-nowp-btn[aria-label="Next"]');
await tap(nowBtn); await wait(300);
if ($(".ui-miniplay-names b").textContent !== "Night Ferry") return "the bar follows the track: " + $(".ui-miniplay-names b").textContent;
if ($(".ui-nowp").getBoundingClientRect().bottom > frame.bottom + 1) return "the player fits";
// Turning keeps it open, and a turn while closed keeps it on the tabs.
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await settle();
const openTurned = isOpen() && Math.abs(y() - $(".demo-phone").getBoundingClientRect().top) < 1;
await tap(grip()); await settle();
const b2 = bar().getBoundingClientRect(), t2 = $(".ui-bottomnav").getBoundingClientRect();
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await settle();
if (!openTurned) return "turned, it stays open";
if (Math.abs(b2.bottom - t2.top) > 1.5) return "turned and closed, on the tabs: " + b2.bottom + " " + t2.top;

// The plain one, with audio of its own and no children.
await tap($("#mini-demo-own")); await wait(400);
const own = $("#mini-demo-own-audio");
if (!own) return "it has its own audio";
if ($(".ui-miniplay-names b").textContent !== "Episode 12: Views first") return "its title";
if ($(".ui-miniplay-art").textContent !== "E") return "no art: the first letter: " + $(".ui-miniplay-art").textContent;
await flick($(".ui-miniplay-names"), 0, -90);
await settle();
if (!isOpen()) return "it opens the same";
const plainPlay = $(".ui-miniplay-bigplay");
await tap(plainPlay); await wait(350);
if (own.paused) return "its big button plays";
if ($(".ui-miniplay-bigplay").getAttribute("aria-label") !== "Pause") return "and shows it";
await tap($(".ui-miniplay-bigplay")); await wait(150);

// A device refusing to start: said in the bar.
await tap(grip()); await settle();
const realPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap($(".ui-miniplay-play")); await wait(150);
HTMLMediaElement.prototype.play = realPlay;
if ($(".ui-miniplay-names span").textContent !== "Tap play again") return "a refusal is said: " + $(".ui-miniplay-names span").textContent;
if ($(".ui-miniplay-play").getAttribute("aria-label") !== "Play") return "and it stays Play";
await tap($("#mini-demo-own")); await wait(300);
