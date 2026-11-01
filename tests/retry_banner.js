// mobile
const banner = () => $("#rtry-demo");
const title = () => banner()?.querySelector(".ui-rtry-title").textContent;
const what = () => banner()?.querySelector(".ui-rtry-what").textContent;
const line = () => banner()?.querySelector(".ui-rtry-line").textContent;
const now_ = () => banner()?.querySelector(".ui-rtry-btn");
const tries = () => parseInt($("#rtry-tries").textContent.match(/\d+/)[0]);
const net = async (offline) => { await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(150); };
const until = async (test, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (test()) return true; await wait(10); } return false; };
const said = () => banner()?.parentElement.querySelector(".ui-sr")?.textContent ?? $(".ui-rtry-host .ui-sr").textContent;

if (banner()) return "nothing failed, nothing shows";
// The instance that gives up: 300 ms, twice, then it stops and waits for a person. It ran from the start.
await until(() => $("#rtry-gave").textContent === "Gave up on 1.", 2000);
const stops = $("#rtry-stops");
if ($("#rtry-gave").textContent !== "Gave up on 1.") return "max_tries: " + $("#rtry-gave").textContent;
if (stops.querySelector(".ui-rtry-line").textContent !== "Stopped trying. Try now when you are ready.") return "stopped: " + stops.querySelector(".ui-rtry-line").textContent;
if (stops.querySelector(".ui-rtry-title").textContent !== "1 thing did not load") return "one: " + stops.querySelector(".ui-rtry-title").textContent;

await tap($("#rtry-fail"));
if (title() !== "2 things did not load" || what() !== "Prices, Stock") return "what failed: " + title() + " " + what();
if (!/^Trying again in [01] s$/.test(line())) return "the countdown: " + line();
// The back-off, measured: 1 s, 2 s, 4 s, then held at the limit of 4 s. Each round tries both.
const start = tries();
const times = [];
for (let n = 1; n <= 4; n++) {
    if (!(await until(() => tries() >= start + n * 2 - 1, 6000))) return "try " + n + " never came";
    times.push(performance.now());
    await until(() => tries() >= start + n * 2, 500);
    await wait(40);
    if (n === 1 && line() !== "Trying again in 2 s") return "after one failure: " + line();
    if (n === 2 && line() !== "Trying again in 4 s") return "after two: " + line();
    if (n === 4 && line() !== "Trying again in 4 s") return "the limit: " + line();
    if (n === 2) { await wait(1200); if (line() !== "Trying again in 3 s" && line() !== "Trying again in 2 s") return "it counts down: " + line(); }
}
const gaps = [times[1] - times[0], times[2] - times[1], times[3] - times[2]];
if (Math.abs(gaps[0] - 2000) > 400 || Math.abs(gaps[1] - 4000) > 400 || Math.abs(gaps[2] - 4000) > 400) return "the gaps: " + gaps.map(Math.round);
if ($("#rtry-log").textContent.trim().split(" ").slice(0, 2).join(" ") !== "prices Stock") return "each is tried: " + $("#rtry-log").textContent;

// Try now: at once, and a second press does nothing while it tries. It does not lengthen the wait.
const a = tries();
const b = now_();
b.click(); b.click();
if (!(await until(() => tries() === a + 2, 400))) return "Try now is at once: " + (tries() - a);
await wait(120);
if (tries() !== a + 2) return "a double press tries twice: " + (tries() - a);
if (line() !== "Trying again in 4 s") return "Try now keeps the wait: " + line();

// One comes back: it leaves the banner, and the back-off starts again.
await tap($("#rtry-mend-a"));
await tap(now_());
await until(() => title() === "1 thing did not load", 500);
if (title() !== "1 thing did not load" || what() !== "Stock") return "one cleared: " + title() + " " + what();
await wait(40);
if (line() !== "Trying again in 1 s") return "the back-off starts again: " + line();
if ($("#rtry-cleared").textContent !== "Cleared: 0.") return "not all clear yet";
// The last: by itself. The banner goes and says so.
await tap($("#rtry-mend-b"));
if (!(await until(() => !banner(), 2500))) return "it clears on success";
if ($("#rtry-cleared").textContent !== "Cleared: 1.") return "on_clear: " + $("#rtry-cleared").textContent;
await wait(30);
if ($(".ui-rtry-ok")?.textContent !== "All loaded") return "it says so";
if ($(".ui-rtry-host .ui-sr").textContent !== "All loaded.") return "a reader hears it: " + $(".ui-rtry-host .ui-sr").textContent;
await until(() => !$(".ui-rtry-ok"), 3000);
if ($(".ui-rtry-ok")) return "the word goes";

// Offline: nothing tried, nothing counted; back, it tries at once.
await tap($("#rtry-fail"));
await net(true);
let c;
try {
    if (line() !== "Waiting for the connection.") return "offline: " + line();
    c = tries();
    await wait(1500);
    if (tries() !== c) return "tried while offline";
    if (line() !== "Waiting for the connection.") return "no countdown offline: " + line();
} finally { await net(false); }
if (!(await until(() => tries() >= c + 1, 300))) return "back, it tries at once";

// In the background nothing is tried; on return, it tries at once, by the clock.
await until(() => line().startsWith("Trying again in"), 800);
const t = await cdp("Target.createTarget", { url: "about:blank" });
await wait(100);
if (document.visibilityState !== "hidden") { await cdp("Target.closeTarget", { targetId: t.targetId }); return "the test could not hide the tab"; }
const d = tries();
await wait(2600);
const whileHidden = tries() - d;
await cdp("Target.closeTarget", { targetId: t.targetId });
await wait(50);
if (whileHidden !== 0) return "tried in the background: " + whileHidden;
if (!(await until(() => tries() > d, 500))) return "on return it tries at once";

// A server that says when: that wait, not the back-off.
await tap($("#rtry-busy"));
await tap(now_());
await until(() => line() === "Trying again in 3 s", 600);
if (line() !== "Trying again in 3 s") return "retry_after: " + line();
await tap($("#rtry-busy"));
// Taken out by the page, it goes; failing again later, it comes back.
await tap($("#rtry-none"));
if (banner()) return "the page dropped them";
await tap($("#rtry-fail"));
if (title() !== "2 things did not load") return "they can fail again: " + title();
await tap($("#rtry-none"));
// Try now after giving up: a real try.
const before = stops.querySelector(".ui-rtry-line").textContent;
await tap(stops.querySelector(".ui-rtry-btn")); await wait(30);
if (before !== "Stopped trying. Try now when you are ready.") return "still stopped";
