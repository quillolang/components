// mobile
const name = "ui-demo-update";
const host = () => $("#force-update-demo-frame .ui-force-update-host");
const mode = () => host().dataset.mode;
const box = () => $("#force-update-demo-frame .ui-force-update");
const cur = $("#force-update-demo-current"), min = $("#force-update-demo-minimum"), lat = $("#force-update-demo-latest");
const again = $("#force-update-demo-again");
const clear = () => { document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name); };
const put = async (c, m, l) => { type(cur, c); type(min, m); type(lat, l); await wait(60); };
clear(); await tap(again); await wait(250);

// Numbers, not text, worked out by hand. Each row is: have, least, latest, what shows.
const cases = [
    ["1.9.9", "1.10.0", "1.12.3", "hard"],      // 9 < 10, though "9" > "1" as text
    ["1.10.0", "1.10.0", "1.12.3", "soft"],     // at the least, under the latest
    ["1.12.3", "1.10.0", "1.12.3", "none"],     // up to date
    ["1.12.4", "1.10.0", "1.12.3", "none"],     // newer than the store, as a tester has
    ["2.0", "1.10.0", "2.0.0", "none"],         // missing numbers are 0
    ["1.2", "1.2.0.0", "1.2.0.0.1", "soft"],    // 1.2 = 1.2.0.0, under 1.2.0.0.1
    ["v1.100", "1.99", "1.100", "none"],        // a v, and 100 > 99
    ["01.02", "1.2", "1.2.1", "soft"],          // leading zeros
    ["1.2.0-beta.1", "1.2.0", "1.2.0", "hard"], // a pre-release is older than its release
    ["1.2.0-beta.2", "1.2.0-beta.1", "1.2.0-beta.11", "soft"], // and 2 < 11 inside one
    ["1.2.0-alpha", "1.2.0-1", "1.2.0", "soft"], // numbers before words
    ["1.2.0+45", "1.2.0+99", "1.2.0", "none"],  // a build number is ignored
    ["99999999999999999999.1", "99999999999999999999.2", "99999999999999999999.2", "hard"], // past any int
    // Nothing that cannot be read locks anyone out.
    ["garbage", "1.0", "2.0", "none"],
    ["1.0", "", "2.0", "soft"],
    ["1.0", "not a version", "not one either", "none"],
    ["1..2", "9", "9", "none"],
    ["1.2.3.4.5.6.7.8.9", "9", "9", "none"],
    ["-1", "9", "9", "none"],
    [" 1.0 ", "1.0", "1.0", "none"],
];
for (const [c, m, l, want] of cases) {
    await put(c, m, l);
    if (mode() !== want) return `${c} against ${m} and ${l} should be ${want}: ${mode()}`;
}

// Hard: no way past it.
await put("1.9.9", "1.10.0", "1.12.3");
const text = box().textContent;
if (!text.includes("Update needed") || !text.includes("You have 1.9.9, and it needs 1.10.0 or newer.")) return "the hard words: " + text;
if ([...box().querySelectorAll(".ui-btn")].some((b) => b.textContent.trim() === "Later")) return "no Later on the hard screen";
if (box().getAttribute("role") !== "alertdialog") return "an alert";
const f = $("#force-update-demo-frame").getBoundingClientRect(), r = box().getBoundingClientRect();
if (Math.abs(r.width - f.width) > 3 || Math.abs(r.height - f.height) > 3) return "fills the frame: " + r.width + "x" + r.height + " in " + f.width + "x" + f.height;

// The link by platform, by what the browser says it is.
const link = () => box().querySelector("a.ui-btn");
const agent = async (ua, touches) => {
    await cdp("Emulation.setUserAgentOverride", { userAgent: ua, platform: "x" });
    await cdp("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: touches });
    await tap(again); await wait(250);
};
const real = navigator.userAgent;
await agent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148", 5);
if (host().dataset.platform !== "ios" || !link().href.startsWith("https://apps.apple.com/") || link().textContent.trim() !== "Open the App Store") return "iOS: " + host().dataset.platform + " " + link()?.href;
await agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", 5);
if (host().dataset.platform !== "ios") return "an iPad says it is a Mac: " + host().dataset.platform;
await agent("Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36; wv", 5);
if (host().dataset.platform !== "android" || !link().href.startsWith("https://play.google.com/") || link().textContent.trim() !== "Open Google Play") return "Android: " + host().dataset.platform;
await agent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", 5);
await agent("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36", 5);
if (host().dataset.platform !== "web" || !link().href.startsWith("https://quillolang.org/") || link().textContent.trim() !== "Update now") return "web: " + host().dataset.platform;
await cdp("Emulation.setUserAgentOverride", { userAgent: real });
await tap(again); await wait(250);

// Soft: Later is kept, for that version, and a new version asks again.
clear(); await put("1.10.0", "1.10.0", "1.12.3"); await tap(again); await wait(250);
if (!box() || !box().textContent.includes("Version 1.12.3 of Fieldbook is ready. You have 1.10.0.")) return "the soft words: " + box()?.textContent;
if (!box().textContent.includes("Faster sync")) return "the notes";
const later = () => [...box().querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === "Later");
const tiny = (box) => [...box.querySelectorAll("button, a[href], select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((e) => e.tagName + " " + e.textContent.trim().slice(0, 20));
if (tiny(box()).length) return "too small on the sheet: " + tiny(box());
await tap(later()); await wait(200);
if (box()) return "Later puts it off";
if (!$("#force-update-demo-frame").textContent.includes("Later: 1.")) return "on_later: " + $("#force-update-demo-frame").textContent;
await tap(again); await wait(250);
if (box()) return "put off on the next start too";
type(lat, "1.12.4"); await tap(again); await wait(250);
if (!box()) return "a newer version asks again";
await tap(later()); await wait(200);
// Run out, then bad storage: it asks.
const days3 = JSON.parse(decodeURIComponent(document.cookie.split("; ").find((c) => c.startsWith(name + "=")).split("=")[1]));
const left = days3.until - Date.now();
if (days3.version !== "1.12.4" || left < 2.9 * 86400000 || left > 3.01 * 86400000) return "three days: " + JSON.stringify(days3);
document.cookie = name + "=" + encodeURIComponent(JSON.stringify({ version: "1.12.4", until: Date.now() - 1 })) + "; path=/";
await tap(again); await wait(250);
if (!box()) return "a Later that has run out asks again";
await tap(later()); await wait(200);
document.cookie = name + "=%7Bbad; path=/";
await tap(again); await wait(250);
if (!box()) return "bad storage asks";
// Escape on the soft one is not a Later: gone now, and back at the next start. Not modal in the frame, so closed as Escape would.
box().close(); await wait(150);
if (box()) return "closed, it goes";
await tap(again); await wait(250);
if (!box()) return "asked again at the next start";
if (device === "tablet") {
    // A card in the middle of a tablet, not a bar across it.
    const c = box().getBoundingClientRect(), f2 = $("#force-update-demo-frame").getBoundingClientRect();
    if (c.width > 490 || Math.abs(c.left + c.width / 2 - (f2.left + f2.width / 2)) > 2 || c.bottom > f2.bottom - 10) return "a centred card: " + JSON.stringify(c);
}

// Filling the window, modal: Escape, twice, does not get past it, and the page is out of reach.
await put("1.12.3", "1.0", "1.0"); clear();
await tap($("#force-update-demo-full")); await wait(300);
const full = $$("dialog.ui-force-update-hard").at(-1);
if (!full.matches(":modal")) return "taken up as modal";
// Only links a phone app's web view drops: refused, so a store's name instead, Reload elsewhere (this Chrome with touch on a Mac reads as an iPad).
if (full.querySelector("a")) return "itms-apps: and market: do nothing in an app, and must not be offered: " + full.querySelector("a").href;
if (navigator.userAgent.includes("Macintosh") ? !full.textContent.includes("Open your phone's app store and look for Fieldbook.") : !full.textContent.includes("Reload")) return "with no link: " + full.textContent;
const esc = async () => {
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(150);
};
await esc(); if (!full.open) return "Escape must not close the hard screen";
await esc(); if (!full.open) return "nor a second Escape";
full.close(); await wait(100);
if (!full.open || !full.matches(":modal")) return "closed by a script, it comes back";
$("#force-update-demo-end").click(); await wait(200);
if ($$("dialog.ui-force-update-hard").length) return "the demo's own end";
clear();
