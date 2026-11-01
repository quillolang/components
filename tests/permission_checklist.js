// mobile
const origin = location.origin;
const row = (k) => $(`.ui-permission-checklist-row[data-kind="${k}"]`);
const state = (k) => row(k).dataset.state;
const again = $("#permission-checklist-demo-again");
const said = () => $("#permission-checklist-demo-said").textContent;
const set = (name, setting) => cdp("Browser.setPermission", { permission: { name }, setting, origin });
const count = () => $(".ui-permission-checklist-count").textContent;
const done = () => [...$$(".ui-permission-checklist .ui-btn")].find((b) => b.textContent.trim() === "Continue");
// Start over, and wait for the rows to have heard from the browser: a busy machine can take longer than a fixed pause.
const fresh = async () => {
    await tap(again); await wait(200);
    for (let i = 0; i < 60 && $$('.ui-permission-checklist-row[data-state="checking"]').length; i++) await wait(50);
    await wait(150);
};
await set("geolocation", "prompt"); await set("notifications", "prompt"); await set("camera", "prompt"); await set("microphone", "prompt");
await fresh();

if ($$(".ui-permission-checklist-row").length !== 6) return "six rows";
if (state("telepathy") !== "none") return "a kind with no such thing: " + state("telepathy");
if (!row("telepathy").textContent.includes("does not have it")) return "says it is not there";
if (row("telepathy").querySelector(".ui-btn")) return "nothing to press for what is not there";
if (state("location") !== "ask") return "location starts unasked: " + state("location");
if (!row("location").textContent.includes("Never in the background")) return "the reason shows";
if (!row("location").textContent.includes("Needed")) return "required shows";
// Required holds the button, and says why.
if (!done().disabled) return "Continue waits for what is required";
if (!$(".ui-permission-checklist-missing").textContent.includes("Location needed to go on.")) return "says what is missing: " + $(".ui-permission-checklist-missing")?.textContent;
if (count() !== "1 of 5 allowed") return "motion needs no asking here, so one of five: " + count();

// Live: changed from outside, with no press and no reload.
await set("geolocation", "denied"); await wait(400);
if (state("location") !== "refused") return "a refusal from outside should show: " + state("location");
if (!row("location").textContent.includes("Refused")) return "says refused";
if (row("location").querySelector(".ui-btn")) return "no Settings button in a browser";
const help = row("location").querySelector(".ui-permission-checklist-help")?.textContent ?? "";
if (!help.includes("allow location")) return "browser's words on undoing it: " + help;
if (!said().includes("location: refused")) return "on_change: " + said();
await set("geolocation", "granted"); await wait(400);
if (state("location") !== "allowed") return "allowed from outside should show: " + state("location");
if (done().disabled) return "Continue opens once allowed";
if (count() !== "2 of 5 allowed") return "count: " + count();
await set("geolocation", "prompt"); await wait(400);
if (state("location") !== "allowed") return "a prompt reading does not take back what was allowed: " + state("location");

// Allow: a real ask, with a fake camera the harness allows, and the tracks stopped.
await tap(row("camera").querySelector(".ui-btn")); await wait(500);
if (state("camera") !== "allowed") return "camera should be allowed: " + state("camera");
if (row("camera").querySelector(".ui-btn")) return "nothing left to press once allowed";

// The web's location, refused by the browser.
await fresh();
await cdp("Browser.grantPermissions", { permissions: ["geolocation"], origin });
await cdp("Emulation.setGeolocationOverride", { latitude: 38.72, longitude: -9.14, accuracy: 10 });
await wait(300);
if (state("location") !== "allowed") return "granted reads as allowed: " + state("location");
await cdp("Browser.resetPermissions", {});
await cdp("Emulation.clearGeolocationOverride", {});

// In the app: the stand-in refuses, Settings is the way, coming back looks again.
const calls = [];
let place = "location is turned off for this app";
window.quilloNative = {
    location: async () => { calls.push("location"); if (place) throw new Error(place); return { lat: 1, lon: 2 }; },
    notify: async (t, b, s) => { calls.push(`notify ${t} ${s}`); return "id"; },
    openSettings: async () => { calls.push("settings"); return true; },
};
await fresh();
const allow = row("location").querySelector(".ui-btn");
if (!allow || allow.getAttribute("aria-label") !== "Allow Location") return "Allow for location: " + allow?.getAttribute("aria-label");
await tap(allow); await wait(300);
if (state("location") !== "refused" || calls[0] !== "location") return "the app's refusal: " + state("location") + " " + calls;
const go = row("location").querySelector(".ui-btn");
if (!go || go.textContent.trim() !== "Open Settings") return "the app offers Settings: " + go?.textContent;
await tap(go); await wait(200);
if (calls[1] !== "settings") return "openSettings not called: " + calls;
if (state("location") !== "refused") return "still refused until back";
place = null;
window.dispatchEvent(new Event("focus")); await wait(300);
if (state("location") !== "allowed" || calls[2] !== "location") return "coming back from Settings should look again: " + state("location") + " " + calls;
// Without a fix but not refused: that is allowed.
await fresh();
place = "no location: none came";
await tap(row("location").querySelector(".ui-btn")); await wait(300);
if (state("location") !== "allowed") return "no fix is not a refusal: " + state("location");
// Notifications in the app are one real note.
await tap(row("notifications").querySelector(".ui-btn")); await wait(300);
if (state("notifications") !== "allowed" || !calls.includes("notify Notifications are on 1")) return "the app's notify: " + state("notifications") + " " + calls;
if (done().disabled) return "Continue should be open";
await tap(done()); await wait(200);
if (said() !== "Done with allowed location.") return "on_done: " + said();
delete window.quilloNative;
await fresh();

// iOS: motion is asked about, by a tap. Stand-ins: its call, and no query for it, so the row waits on the button.
let answer = "granted", asks = 0;
const realQuery = navigator.permissions.query.bind(navigator.permissions);
navigator.permissions.query = (d) => d.name === "accelerometer" ? Promise.reject(new TypeError("no such permission")) : realQuery(d);
DeviceOrientationEvent.requestPermission = async () => { asks++; return answer; };
await fresh();
if (state("motion") !== "ask") return "motion should wait to be asked: " + state("motion");
await tap(row("motion").querySelector(".ui-btn")); await wait(300);
if (state("motion") !== "allowed" || asks !== 1) return "iOS's yes: " + state("motion") + " " + asks;
await set("microphone", "prompt");
await fresh();
answer = "denied";
await tap(row("motion").querySelector(".ui-btn")); await wait(300);
if (state("motion") !== "refused") return "iOS's no: " + state("motion");
// Asking did not stick: the next row can still be asked.
if (!row("microphone").querySelector(".ui-btn")) return "the microphone should still be unasked: " + state("microphone");
await tap(row("microphone").querySelector(".ui-btn")); await wait(500);
if (state("microphone") !== "allowed") return "a row after motion can still be asked: " + state("microphone");
// A browser with no such call: nothing to ask, so allowed.
delete DeviceOrientationEvent.requestPermission;
await fresh();
await tap(row("motion").querySelector(".ui-btn")); await wait(300);
if (state("motion") !== "allowed") return "no such call: " + state("motion");
delete navigator.permissions.query;
await fresh();

// Tablet: two columns.
const cols = getComputedStyle($(".ui-permission-checklist-list")).gridTemplateColumns.split(" ").length;
if (cols !== (innerWidth >= 560 ? 2 : 1)) return "columns at " + innerWidth + ": " + cols;
if (cols === 2) {
    const [a, b] = [row("camera").getBoundingClientRect(), row("microphone").getBoundingClientRect()];
    if (Math.round(a.top) !== Math.round(b.top) || a.right > b.left) return "two rows side by side";
}
