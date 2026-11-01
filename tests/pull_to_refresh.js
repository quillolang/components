// mobile
const scroll = $(".ui-pull-refresh-scroll");
const btn = $(".ui-pull-refresh-btn");
const status = () => $(".ui-pull-refresh-status").textContent;
const shown = () => { const t = scroll.style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const count = () => +$("#pull-demo-count").textContent.match(/finished: (\d+)/)[1];
const rows = () => $$(".demo-pull-row").length;
const until = async (text) => { for (let i = 0; i < 80 && status() !== text; i++) await wait(25); };
const settle = async () => { for (let i = 0; i < 80 && (status() !== "" || scroll.style.transform !== ""); i++) await wait(50); };
await wait(300);
if (rows() !== 30) return "starts with 30 rows, has " + rows();
if (getComputedStyle(scroll).overscrollBehaviorY !== "contain") return "the browser's own pull is not kept out";

// A pull held mid-way: a finger 180 px down shows 180 * 180 / 360 = 90 px.
const at = middle(scroll);
await fingers("touchStart", [at]);
for (let i = 1; i <= 8; i++) { await fingers("touchMove", [{ x: at.x, y: at.y + 2 * i }]); await wait(8); }
const base = at.y + 8;
await fingers("touchMove", [{ x: at.x, y: base + 180 }]);
await wait(30);
if (Math.abs(shown() - 90) > 0.01) return "a finger 180 px down should show about 90, shows " + shown();
if (!$(".ui-pull-refresh-on")) return "no pulling state";
if ($(".ui-pull-refresh-ind").textContent.trim() !== "Release to refresh") return "past the threshold: " + $(".ui-pull-refresh-ind").textContent;
if (getComputedStyle(scroll).userSelect !== "none") return "selection is not off during the pull";
// A prop of the outer element changing in mid-pull: the indicator and the list stay where the finger has them.
const pulled = scroll.style.transform;
$("#pull-demo-resize").click();
await wait(80);
if (getComputedStyle($(".ui-pull-refresh-ind")).opacity !== "1") return "a prop changing in mid-pull lost the indicator: opacity " + getComputedStyle($(".ui-pull-refresh-ind")).opacity;
if (scroll.style.transform !== pulled) return "a prop changing in mid-pull moved the list: " + scroll.style.transform;
await fingers("touchMove", [{ x: at.x, y: base + 30 }]);
await wait(120);
await fingers("touchEnd", []);
await wait(400);
if (scroll.style.transform !== "") return "a short pull should spring back: " + scroll.style.transform;
if (count() !== 0) return "a short pull refreshed";

// Past the threshold, a slow pull that stops: refresh, spinner, then success.
await drag(scroll, 0, 170, 500);
if (!$(".ui-pull-refresh-spin") && count() === 0) return "no spinner while refreshing";
if (shown() !== 56) return "the indicator should hold at 56, is at " + shown();
if (status() !== "Refreshing") return "status while busy: " + status();
await drag(scroll, 0, 170, 100);
await until("Up to date");
if (count() !== 1) return "one refresh should have finished, with a pull during it ignored: " + count();
if (rows() !== 31) return "the refresh did not add its row: " + rows();
if (status() !== "Up to date") return "success not shown: " + status();
await settle();
if (scroll.style.transform !== "") return "did not close after success";

// 112 px past the lock shows 180 * 112 / 292 = 69, short of 70. Slowly, it springs back.
const pull = async (steps, gap) => {
    await fingers("touchStart", [at]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: at.x, y: at.y + 120 * i / steps }]); await wait(gap); }
    await fingers("touchEnd", []);
    await wait(200);
};
await pull(10, 80);
if (scroll.style.transform !== "") return "a slow pull short of the threshold should spring back: " + scroll.style.transform;
if (status() !== "") return "a slow short pull refreshed";
// The same distance as a flick refreshes.
await pull(3, 12);
if (shown() !== 56) return "a flick should refresh, shows " + shown();
await wait(900);
await settle();
if (count() !== 2) return "the flick's refresh did not finish";

// Failure, kept on screen, and the list is as it was.
$("#pull-demo-fail").click();
await wait(60);
await drag(scroll, 0, 170, 400);
await until("Could not refresh");
if (status() !== "Could not refresh") return "failure not shown: " + status();
if (!$(".ui-pull-refresh-failed")) return "failure is not marked";
const before = rows();
await settle();
if (rows() !== before) return "a failed refresh changed the list";
$("#pull-demo-fail").click();
await wait(60);

// Scrolled down, a pull is the list's own.
scroll.scrollTop = 120;
await wait(60);
await drag(scroll, 0, 100, 200);
if (scroll.style.transform !== "") return "a pull from the middle of the list moved it";
if (scroll.scrollTop >= 120) return "the list did not scroll: " + scroll.scrollTop;
if (status() !== "") return "a scroll started a refresh";
scroll.scrollTop = 0;
await wait(100);

// Turned, the list keeps its scroll.
scroll.scrollTop = 150;
await wait(60);
const vw = innerWidth, vh = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: vh, height: vw, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (scroll.scrollTop !== 150) return "turning lost the scroll: " + scroll.scrollTop;
await cdp("Emulation.setDeviceMetricsOverride", { width: vw, height: vh, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (scroll.scrollTop !== 150) return "turning back lost the scroll: " + scroll.scrollTop;
scroll.scrollTop = 0;
await wait(60);

// With the page scrolled so the area's top is off the screen, a pull is the page's.
document.body.style.paddingBottom = "1600px";
await wait(40);
scrollTo(0, scrollY + $(".ui-pull-refresh").getBoundingClientRect().top + 60);
await wait(60);
if ($(".ui-pull-refresh").getBoundingClientRect().top >= 0) return "the test's page did not scroll far enough";
const pageY = scrollY;
await drag(scroll, 0, 150, 250);
await wait(100);
if (scroll.style.transform !== "") return "a pull with the top off the screen moved the list";
if (status() !== "") return "a pull with the top off the screen refreshed";
if (scrollY >= pageY) return "the page should have scrolled: " + pageY + " to " + scrollY;
document.body.style.paddingBottom = "";
scrollTo(0, 0);
await wait(60);

// Up from the top scrolls, and sideways is not ours.
await drag(scroll, 0, -120, 200);
await wait(200);
if (scroll.style.transform !== "") return "up should scroll, not pull";
if (scroll.scrollTop <= 0) return "up from the top did not scroll";
scroll.scrollTop = 0;
await wait(100);
await drag(scroll, 120, 12, 200);
if (scroll.style.transform !== "") return "sideways moved the list";
if (status() !== "") return "sideways started a refresh";

// The system taking the gesture springs back with nothing started. A cancel in CDP.
const n = count();
const at2 = middle(scroll);
await fingers("touchStart", [at2]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: at2.x, y: at2.y + 12 * i }]); await wait(8); }
await wait(30);
if (shown() < 40) return "cancel test: the pull did not start: " + shown();
await fingers("touchCancel", []);
await wait(350);
if (scroll.style.transform !== "") return "a cancelled pull did not spring back";
if (status() !== "" || count() !== n) return "a cancelled pull refreshed";

// The button is the equal.
btn.click();
await wait(60);
if (status() !== "Refreshing") return "the button did not refresh: " + status();
if (btn.getAttribute("aria-disabled") !== "true") return "the button should be off while busy";
btn.click();
await wait(900);
if (count() !== n + 1) return "the button's refresh: " + count();
await settle();
if (device === "tablet" && getComputedStyle($(".ui-pull-refresh-btn-text")).display === "none") return "a tablet has room for the word";
if (device === "phone" && getComputedStyle($(".ui-pull-refresh-btn-text")).display !== "none") return "a phone shows the icon alone";

// Each way a callback can answer, as it may wait or not.
const answers = $$("#pull-demo-hooks .ui-pull-refresh");
const says = async (i, want) => {
    answers[i].querySelector(".ui-pull-refresh-btn").click();
    await wait(200);
    const got = answers[i].querySelector(".ui-pull-refresh-status").textContent;
    return got === want ? null : answers[i].textContent.trim() + " should say " + want + ", says " + (got || "nothing");
};
for (const [i, want] of [[0, "Up to date"], [1, "Could not refresh"], [2, "Up to date"], [3, "Could not refresh"], [4, "Up to date"], [5, "Could not refresh"]]) {
    const wrong = await says(i, want);
    if (wrong) return wrong;
}
