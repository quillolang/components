// mobile
const host = $("#device-preview-demo"), little = $("#device-preview-demo-tablet");
const screen_ = () => host.querySelector(".ui-device-preview-screen");
const fit = () => host.querySelector(".ui-device-preview-fit");
const select = host.querySelector("select");
const press = (t) => [...host.querySelectorAll("button.ui-device-preview-key")].find((b) => b.textContent === t);
const out = () => $("#device-preview-demo-out").textContent;
const size = () => host.querySelector(".ui-device-preview-size").textContent;
const v = (name) => getComputedStyle(screen_()).getPropertyValue(name);
const insets = () => ["top", "right", "bottom", "left"].map((s) => v(`--ui-safe-${s}`)).join(" ");
const pad = () => { const s = getComputedStyle($("#device-preview-demo-safe")); return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(" "); };
const room = () => host.querySelector(".ui-device-preview-stage").clientWidth;
const expected = (w, h) => Math.floor(Math.min(1, room() / (w + 20), 620 / (h + 20)) * 1000) / 1000;
const shown = () => +getComputedStyle(host.querySelector(".ui-device-preview-body")).getPropertyValue("--ui-device-preview-scale");
const settle = () => wait(380);
const pickModel = async (id) => { select.value = id; select.dispatchEvent(new Event("change", { bubbles: true })); await settle(); };
await settle();

// The screen is the model's size, in its own points, whatever it is scaled to.
if (screen_().offsetWidth !== 393 || screen_().offsetHeight !== 852) return `iPhone 15: ${screen_().offsetWidth}x${screen_().offsetHeight}`;
if (insets() !== "59px 0px 34px 0px") return "insets: " + insets();
if (pad() !== "59px 0px 34px 0px") return "a SafeArea inside takes the model's insets: " + pad();
const sc = expected(393, 852);
if (shown() !== sc) return `the scale is ${shown()}, not ${sc}`;
if (Math.abs(fit().getBoundingClientRect().width - 413 * sc) > 0.6) return `fit: ${fit().getBoundingClientRect().width}, ${413 * sc}`;
if (Math.abs(fit().getBoundingClientRect().height - 872 * sc) > 0.6) return `fit height: ${fit().getBoundingClientRect().height}, ${872 * sc}`;
if (size() !== `iPhone 15, 393 × 852, shown at ${Math.round(sc * 100)}%`) return "size: " + size();
// What it draws: the safe areas at the real insets, at their real places.
const bands = () => [...host.querySelectorAll(".ui-device-preview-band")].map((b) => b.textContent).join();
if (bands() !== "59,34,,") return "bands: " + bands();
const b0 = host.querySelector(".ui-device-preview-band").getBoundingClientRect();
if (Math.abs(b0.height - 59 * sc) > 0.6) return `the top band is ${b0.height}, not ${59 * sc}`;
if (!host.querySelector(".ui-device-preview-cut-island") || !host.querySelector(".ui-device-preview-home")) return "the island or the home bar";

// State inside comes through: a real tap, then a turn, a theme, a model.
const count = $("#device-preview-demo-count");
await tap(count); await tap(count);
if (count.textContent !== "2") return "a tap inside: " + count.textContent;
await tap(press("Turn")); await settle();
if (screen_().offsetWidth !== 852 || screen_().offsetHeight !== 393) return `turned: ${screen_().offsetWidth}x${screen_().offsetHeight}`;
if (insets() !== "0px 59px 21px 59px") return "turned, insets: " + insets();
if (pad() !== "0px 59px 21px 59px") return "turned, the SafeArea: " + pad();
if (bands() !== ",21,59,59") return "turned, bands: " + bands();
if (shown() !== expected(852, 393)) return `turned, the scale: ${shown()}`;
if (press("Turn").getAttribute("aria-pressed") !== "true") return "Turn pressed";
if (count.textContent !== "2" || !count.isConnected) return "turning remade what is inside";
if (out() !== "1 changes. iphone-15 true light true") return "on_change: " + out();
await tap(press("Dark"));
if (!screen_().classList.contains("ui-dark") || screen_().classList.contains("ui-light")) return "dark";
if (getComputedStyle(screen_()).backgroundColor !== "rgb(15, 14, 23)") return "dark, the background: " + getComputedStyle(screen_()).backgroundColor;
if (getComputedStyle(document.body).backgroundColor === "rgb(15, 14, 23)") return "dark reached the page";
await tap(press("Dark"));
if (getComputedStyle(screen_()).backgroundColor !== "rgb(255, 255, 255)") return "light again: " + getComputedStyle(screen_()).backgroundColor;
await tap(press("Safe areas"));
if (host.querySelector(".ui-device-preview-band")) return "bands with Safe areas off";
if (insets() !== "0px 59px 21px 59px") return "hiding the marks changed the insets";
await tap(press("Safe areas"));
if (out() !== "5 changes. iphone-15 true light true") return "five changes: " + out();
await tap(press("Turn")); await settle();

// Models: an old phone has no cut and no home bar, and the insets go.
await pickModel("iphone-se");
if (screen_().offsetWidth !== 375 || screen_().offsetHeight !== 667) return "SE: " + screen_().offsetWidth;
if (insets() !== "20px 0px 0px 0px") return "SE, insets: " + insets();
if (host.querySelector(".ui-device-preview-cut") || host.querySelector(".ui-device-preview-home")) return "SE has no island";
await tap(press("Turn")); await settle();
if (insets() !== "0px 0px 0px 0px") return "SE turned: " + insets();
await tap(press("Turn")); await settle();
// A tablet model in the preview: the container queries inside see its width, so three columns.
await pickModel("ipad-11");
const cols = () => getComputedStyle($("#device-preview-demo-cards")).gridTemplateColumns.split(" ").length;
if (cols() !== 3) return `a tablet's width inside: ${cols()} columns`;
if (shown() !== expected(834, 1194)) return `tablet, the scale: ${shown()}, ${expected(834, 1194)}`;
if (insets() !== "24px 0px 20px 0px") return "tablet, insets: " + insets();
await tap(press("Turn")); await settle();
if (insets() !== "24px 0px 20px 0px") return "a tablet keeps its insets on its side: " + insets();
if (shown() !== expected(1194, 834)) return `tablet turned, the scale: ${shown()}`;
await tap(press("Turn")); await settle();
await pickModel("pixel-8");
if (cols() !== 1) return `a phone's width inside: ${cols()} columns`;
if (!host.querySelector(".ui-device-preview-cut-punch")) return "the Pixel's camera";
if (count.textContent !== "2") return "changing model remade what is inside";

// Set by props, with no controls, dark, on its side, and held to 300 px tall.
const ss = little.querySelector(".ui-device-preview-screen");
if (ss.offsetWidth !== 1194 || ss.offsetHeight !== 834) return `the tablet: ${ss.offsetWidth}x${ss.offsetHeight}`;
if (!ss.classList.contains("ui-dark")) return "the tablet's theme";
if (little.querySelector(".ui-device-preview-bar")) return "controls with controls off";
const f2 = little.querySelector(".ui-device-preview-fit").getBoundingClientRect();
if (f2.height > 300.5) return `over max_height: ${f2.height}`;
if (f2.width > little.clientWidth + 0.5) return `wider than its place: ${f2.width}`;
if (ss.getAttribute("aria-label") !== "A tablet") return "label";

// The room changes with the window: a real turn of the device showing it.
const W = innerWidth, H = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true }); await settle();
if (shown() !== expected(412, 915)) return `in a turned window: ${shown()}, ${expected(412, 915)}`;
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true }); await settle();
if (shown() !== expected(412, 915)) return `back: ${shown()}`;
// Tablets use the room: the controls beside it, not over it.
const bar = host.querySelector(".ui-device-preview-bar").getBoundingClientRect(), st = host.querySelector(".ui-device-preview-stage").getBoundingClientRect();
if (device === "tablet" ? !(bar.right <= st.left && Math.abs(bar.top - st.top) < 2) : !(bar.bottom <= st.top)) return `controls: ${bar.right}, ${st.left}, ${bar.bottom}, ${st.top}`;
