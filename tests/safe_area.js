// mobile
const box = $("#safe-area-demo-box"), sides = $("#safe-area-demo-sides"), frame = $("#safe-area-demo-frame");
const insets = async (top, right, bottom, left) => { await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top, right, bottom, left } }); await wait(150); };
const pad = (el) => { const s = getComputedStyle(el); return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].join(" "); };
const guide = () => { const d = $(".ui-safe-area-guide").dataset; return [d.safeTop, d.safeRight, d.safeBottom, d.safeLeft].join(" "); };
const words = () => $(".ui-safe-area-numbers").textContent;
const button = (t) => $$("button").find((b) => b.textContent.trim() === t);
try {
    // The system's own values, through Chrome's override, not a stand-in.
    if (pad(box) !== "8px 8px 8px 8px") return `least on a flat screen: ${pad(box)}`;
    await insets(47, 0, 34, 0);
    if (pad(box) !== "47px 8px 34px 8px") return `a notch: ${pad(box)}`;
    if (guide() !== "47 0 34 0") return `the guide reads ${guide()}`;
    if (words() !== "top 47 · right 0 · bottom 34 · left 0") return `the numbers: ${words()}`;
    // Only the sides asked for, with the floor and the extra: top and bottom, at least 12, plus 4.
    if (pad(sides) !== "51px 0px 38px 0px") return `top and bottom, 47 and 34: ${pad(sides)}`;
    await insets(5, 0, 0, 0);
    if (pad(sides) !== "16px 0px 16px 0px") return `under the floor: ${pad(sides)}`;
    // Turned: the notch moves to a side, and the left and right pads follow it.
    await insets(0, 59, 21, 59);
    if (pad(box) !== "8px 59px 21px 59px") return `turned: ${pad(box)}`;
    if (guide() !== "0 59 21 59") return `the guide turned: ${guide()}`;
    const rect = (s) => { const r = $(s).getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; };
    const bw = box.getBoundingClientRect();
    if (rect(".ui-safe-area-band-left") !== `59x${Math.round(bw.height)}`) return `the left band: ${rect(".ui-safe-area-band-left")}`;
    if (rect(".ui-safe-area-band-bottom") !== `${Math.round(bw.width)}x21`) return `the bottom band: ${rect(".ui-safe-area-band-bottom")}`;
    // The content sits inside the pads, not under them.
    const inner = $(".safe-area-demo-fill").getBoundingClientRect();
    if (Math.round(inner.left - bw.left) !== 59 || Math.round(bw.right - inner.right) !== 59) return "the content is under the side pads";
    if ($(".ui-safe-area-band-left").textContent !== "59" || $(".ui-safe-area-band-bottom").textContent !== "21") return "the numbers on the bands";
    await insets(0, 0, 0, 0);
    if (pad(box) !== "8px 8px 8px 8px") return `gone: ${pad(box)}`;

    // A frame's stand-in wins over the system, for DevicePreview; a real tap on real buttons.
    await tap(button("Notch"));
    if (pad(box) !== "59px 8px 34px 8px") return `the frame's notch: ${pad(box)}`;
    if (guide() !== "59 0 34 0") return `the guide in a frame: ${guide()}`;
    await tap(button("Turned"));
    if (guide() !== "0 59 21 59") return `the guide turned in a frame: ${guide()}`;
    await tap(button("Flat"));
    if (guide() !== "0 0 0 0") return `flat: ${guide()}`;

    // Rotation keeps it: a real change of the screen, with the guide still on.
    const w = innerWidth, h = innerHeight;
    await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
    await insets(0, 47, 21, 47);
    if (guide() !== "0 47 21 47") return `after a real turn: ${guide()}`;
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
    await insets(0, 0, 0, 0);

    // The warning: the gallery's page has no viewport-fit=cover, and says so until it has.
    const warn = () => $(".ui-safe-area-warn")?.textContent ?? "";
    if (!warn().includes("viewport-fit=cover")) return `no warning: ${warn()}`;
    const meta = document.querySelector("meta[name=viewport]"), before = meta.content;
    meta.content = "width=device-width, initial-scale=1,  VIEWPORT-FIT = cover";
    dispatchEvent(new Event("resize")); await wait(120);
    if (warn()) return `a page with cover is warned: ${warn()}`;
    meta.content = before;
    dispatchEvent(new Event("resize")); await wait(120);

    // Debug off: no guide, the pads stay, and it never blocks a press.
    if (getComputedStyle($(".ui-safe-area-guide")).pointerEvents !== "none") return "the guide takes presses";
    await tap(button("Hide insets"));
    if ($(".ui-safe-area-guide")) return "the guide stays with debug off";
    if (pad(box) !== "8px 8px 8px 8px") return `debug off: ${pad(box)}`;
    await tap(button("Show insets"));
    if (!$(".ui-safe-area-guide")) return "the guide does not come back";
} finally {
    await cdp("Emulation.clearSafeAreaInsetsOverride").catch?.(() => {});
    await insets(0, 0, 0, 0);
}
