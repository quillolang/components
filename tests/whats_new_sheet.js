// mobile
const name = "ui-demo-whats-new";
const dlgs = $$("dialog.ui-whats-new"), dlg = dlgs[0], all = dlgs[1];
const said = () => $("#whats-new-sheet-demo-said").textContent;
const start = $("#whats-new-sheet-demo-start"), old = $("#whats-new-sheet-demo-old");
const live = () => $$("dialog.ui-whats-new")[0];
const items = (d = live()) => [...d.querySelectorAll(".ui-whats-new-item")].map((e) => e.dataset.version);
const kept = () => { const c = document.cookie.split("; ").find((x) => x.startsWith(name + "=")); return c ? decodeURIComponent(c.split("=")[1]) : null; };
const clear = () => { document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name); };
const got = () => [...live().querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === "Got it");
const begin = async () => { await tap(start); await wait(350); };
const tiny = (box) => [...box.querySelectorAll("button, a[href], select, textarea, input:not([type=hidden]):not([type=radio]):not([type=checkbox])")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).map((e) => e.tagName + " " + e.textContent.trim().slice(0, 20));
const lastSaw = async (v) => { document.cookie = name + "=" + encodeURIComponent(v) + "; path=/"; localStorage.setItem(name, v); await begin(); };
clear(); await begin();

// A new install is not told what is new, and that version is noted.
if (live().open) return "a new install sees nothing";
if (kept() !== "2.11.0" || localStorage.getItem(name) !== "2.11.0") return "a new install notes the version: " + kept();
await begin();
if (live().open) return "the same version shows nothing";

// After an update: only what came since, newest first, by number. 2.10.0 > 2.9.5, as a number.
await tap(old); await wait(350);
if (!live().open) return "an update shows the sheet";
if (tiny(live()).length) return "too small in the sheet: " + tiny(live());
if (items().join() !== "2.11.0,2.10.1,2.10.0") return "since 2.9.5, newest first: " + items();
if (live().textContent.includes("Unreadable") || live().textContent.includes("From the future")) return "unreadable and future entries are left out";
if (live().textContent.includes("And ")) return "nothing more to say: the limit was just met";
if (!live().querySelector("a[href='#changelog']")) return "the whole list's link";
if (live().querySelector(".ui-whats-new-art svg") == null || !live().textContent.includes("🎙")) return "art of both kinds";

// Shown once per version: closing keeps it.
await tap(got()); await wait(300);
if (live().open) return "Got it closes";
if (said() !== "Saw 2.11.0.") return "on_seen: " + said();
if (kept() !== "2.11.0") return "closing keeps the version: " + kept();
await begin();
if (live().open) return "not twice for one version";

// More than the limit says how many more.
await lastSaw("2.0");
if (items().join() !== "2.11.0,2.10.1,2.10.0" || !live().textContent.includes("And 1 more.")) return "limit: " + items() + " " + live().textContent;
live().close(); await wait(150);

// Odd storage.
await lastSaw("not a version");
if (live().open) return "a kept version that cannot be read shows nothing";
if (kept() !== "2.11.0") return "and is put right: " + kept();
await lastSaw("3.0.0");
if (live().open) return "a person who went back a version sees nothing";
if (kept() !== "3.0.0") return "and keeps the newer one: " + kept();
await lastSaw("2.11.0");
if (live().open) return "the same version: nothing";
await lastSaw("2.10.5");
if (items().join() !== "2.11.0") return "one since: " + items();

// The handle: short springs back; far and flick close; cancel springs back.
const grip = () => live().querySelector(".ui-whats-new-grip");
if (getComputedStyle(grip()).display !== "none") {
    if (getComputedStyle(grip()).touchAction !== "none") return "touch-action on the handle";
    await drag(grip(), 0, 30, 400); await wait(300);
    if (!live().open || live().style.transform !== "") return "a short drag springs back";
    const r = grip().getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top + 20 };
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + i * 10 }]); await wait(16); }
    await wait(120);       // the last move reaches the page a frame or two later
    if (live().style.transform !== "translateY(50px)") return "follows the finger: " + live().style.transform;
    await fingers("touchCancel", []); await wait(300);
    if (!live().open || live().style.transform !== "") return "a cancelled drag springs back";
    await drag(grip(), 0, Math.round(live().offsetHeight * 0.5), 400); await wait(300);
    if (live().open) return "a long drag closes";
    if (kept() !== "2.11.0") return "closing by the handle counts as seen";
    await lastSaw("2.10.5");
    await drag(grip(), 0, 70, 30); await wait(300);
    if (live().open) return "a flick closes";
} else {
    const r = live().getBoundingClientRect();
    if (Math.abs(r.left + r.width / 2 - innerWidth / 2) > 2 || r.bottom >= innerHeight) return "a centred card: " + JSON.stringify(r);
    live().close(); await wait(150);
}
// Keyboard: Enter on the handle, and Escape.
await lastSaw("2.10.5");
if (device === "phone") {
    grip().focus();
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await wait(300);
    if (live().open) return "Enter on the handle closes";
    await lastSaw("2.10.5");
}
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(300);
if (live().open) return "Escape closes";
if (kept() !== "2.11.0") return "Escape counts as seen too";

// On request: everything, and nothing noted.
const before = said();
await tap($$("button[aria-haspopup]").at(-1)); await wait(300);
if (!all.open || items(all).join() !== "2.11.0,2.10.1,2.10.0,2.9.0") return "on request, every entry up to this version: " + items(all);
if (said() !== before) return "on request says nothing of seen";
if (all.querySelector(".ui-whats-new-rest")) return "six by default, so no more";
all.close(); await wait(150);
clear();

// Opened from state as it comes to the page, with an older version kept, so it is asked both ways at once.
document.cookie = "ui-demo-whats-new-2=2.9.5; path=/"; localStorage.setItem("ui-demo-whats-new-2", "2.9.5");
await tap($("#whats-new-sheet-demo-now")); await wait(400);
const now = $$("dialog.ui-whats-new").at(-1);
if (!now.open || !now.matches(":modal")) return "open at mount";
await tap([...now.querySelectorAll(".ui-btn")].find((b) => b.textContent.trim() === "Got it")); await wait(300);
if ($$("dialog[open]").length) return "closing tells the parent";
document.cookie = "ui-demo-whats-new-2=; max-age=0; path=/"; localStorage.removeItem("ui-demo-whats-new-2");
