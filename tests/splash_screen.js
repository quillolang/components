// mobile
const light = () => $("#splash-screen-demo-light .ui-splash-screen"), dark = () => $("#splash-screen-demo-dark .ui-splash-screen");
const said = () => $("#splash-screen-demo-said").textContent;
const again = $("#splash-screen-demo-again"), ready = $("#splash-screen-demo-ready");

// It is in the page the server sends, and its background in a stylesheet in <head>, which holds the first paint back until it has come.
const html = await (await fetch(location.href)).text();
const headEnd = html.indexOf("</head>"), place = html.indexOf('class="ui-splash-screen ui-splash-screen-fixed"');
if (place < 0) return "not in the server's page";
const sheet = html.slice(0, headEnd).match(/<link rel="stylesheet" href="([^"]+)"/);
if (!sheet) return "no stylesheet in <head>";
const text = await (await fetch(sheet[1])).text();
if (!/\.ui-splash-screen[^{]*\{[^}]*background:\s*var\(--ui-bg/.test(text)) return "its background should be in the sheet in <head>";
if (html.slice(place, place + 200).includes("hidden")) return "held from the start";

await tap(again); await wait(150);
if (!light() || !dark()) return "both hold";
// Both themes, from the theme's own colours.
const bg = (e) => getComputedStyle(e).backgroundColor;
const white = "rgb(255, 255, 255)", night = "rgb(15, 14, 23)";
if (bg(light()) !== white) return "light background: " + bg(light());
if (bg(dark()) !== night) return "dark background, no white flash: " + bg(dark());
if (getComputedStyle(dark()).color === getComputedStyle(light()).color) return "words change with the theme";
// It covers its frame, and the mark is in the middle.
for (const box of [light(), dark()]) {
    const f = box.parentElement.closest(".demo-phone").getBoundingClientRect(), r = box.getBoundingClientRect();
    if (Math.abs(r.width - f.width) > 3 || Math.abs(r.height - f.height) > 3) return "covers the frame: " + r.width + "x" + r.height;
    const m = box.querySelector(".ui-splash-screen-mark").getBoundingClientRect();
    if (Math.abs(m.left + m.width / 2 - (r.left + r.width / 2)) > 1) return "the mark is centred";
    if (m.width < 40) return "the mark is too small: " + m.width;
}
if (light().getAttribute("role") !== "status" || light().getAttribute("aria-label") !== "Loading Fieldbook") return "tells a screen reader";
if (light().getAttribute("aria-busy") !== "true") return "busy while it holds";
// The CSS end, for when no script ever comes: 60 s here, from the prop.
const cs = getComputedStyle(light());
if (!cs.animationName.includes("ui-splash-screen-yield") || cs.animationDelay !== "60s") return "the CSS way out: " + cs.animationName + " " + cs.animationDelay;
await wait(500);
if (!light() || said() !== "Held.") return "holds until told";

// Told it is ready: gone within a quick moment.
const t0 = performance.now();
await tap(ready);
while (light() && performance.now() - t0 < 1500) await wait(10);
const took = performance.now() - t0;
if (light()) return "should have gone";
if (took > 700) return "should yield quickly: " + took;     // tap() itself waits 250 ms
if (said() !== "Gone: ready.") return "on_gone: " + said();

// min_ms: ready at once, but holds, so a mark does not blink.
const t1 = performance.now();
await tap($("#splash-screen-demo-min"));
await wait(120);
if (!light()) return "min_ms should hold it";
while (light() && performance.now() - t1 < 2000) await wait(10);
const held = performance.now() - t1;
if (held < 700 || held > 1600) return "held for min_ms and the fade, 0.6 s and 0.18 s: " + held;
if (said() !== "Gone: ready.") return "said: " + said();

// max_ms: never told, it goes by itself, and says so.
await tap($("#splash-screen-demo-max"));
await wait(100);
if (!light()) return "holds a moment";
await wait(900);
if (light()) return "max_ms should end it";
if (said() !== "Gone: timeout.") return "timeout: " + said();
// The wrong way round still ends.
await tap($("#splash-screen-demo-odd"));
await wait(800);
if (light()) return "max wins over min";

// With no script at all: the server's page in a frame that runs none. It goes by CSS.
await tap(again); await wait(100);
const frame = document.createElement("iframe");
frame.setAttribute("sandbox", "allow-same-origin");     // (no scripts; those in the page are taken out, or Chrome logs each one refused)
frame.style.cssText = "position: fixed; left: -2000px; width: 390px; height: 800px";
frame.srcdoc = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/--ui-splash-screen-max: \d+ms/g, "--ui-splash-screen-max: 300ms");
document.body.append(frame);
await new Promise((r) => { frame.onload = r; });
const inner = frame.contentDocument.querySelector(".ui-splash-screen");
if (!inner) { frame.remove(); return "the frame has it"; }
const before = frame.contentWindow.getComputedStyle(inner).visibility;
await wait(700);
const after = frame.contentWindow.getComputedStyle(inner).visibility;
frame.remove();
if (before !== "visible" || after !== "hidden") return "with no script it should still go: " + before + " " + after;

// Rotation changes nothing.
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(200);
if (!light()) return "still holds when turned";
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(200);

// A tablet: a larger mark, by the box and not the screen.
const big = light().querySelector(".ui-splash-screen-mark").offsetWidth;
// 40% of the 260 px box on a tablet, as here it is a strip; on a phone 32% of the narrower way.
if (innerWidth >= 600 ? big !== 104 : big > 120) return "the mark at " + innerWidth + ": " + big;
await tap(ready); await wait(300);
