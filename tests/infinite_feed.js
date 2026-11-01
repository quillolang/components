// mobile
const q = (s) => $$(".ui-infeed")[0].querySelector(s);
const box = () => q(".ui-infeed-scroll");
const cells = (b = box()) => [...b.querySelectorAll(".ui-infeed-item")];
const foot = (b = box()) => b.querySelector(".ui-infeed-foot").textContent.trim();
const callLog = () => $("[data-calls]").textContent;
let callsFrom = 0;
const calls = () => callLog().slice(callsFrom);
const until = async (f, ms = 3000) => { const t = performance.now(); while (performance.now() - t < ms) { if (f()) return true; await wait(40); } return false; };
const toEnd = async () => { const b = box(); b.scrollTop = b.scrollHeight; await wait(120); };
// The gallery's first load saved a place in this tab, and the feed has rightly taken it up.
// This test wants a feed with none: forget it, and come back to the feed.
const storeSet = Storage.prototype.setItem;
Storage.prototype.setItem = function () {};
sessionStorage.clear();
await until(() => cells().length > 0 && box().getAttribute("aria-busy") === "false");
await tap(cells()[0].querySelector("button"));
if (!await until(() => $("[data-reading]"))) return "the first row did not open";
callsFrom = callLog().length + (callLog() ? 1 : 0);
await tap($("#infeed-back"));
if (!await until(() => $$(".ui-infeed")[0].closest("[data-frame]"))) return "the feed did not come back at the start";
Storage.prototype.setItem = storeSet;
// The first page, and it is a feed.
if (box().getAttribute("role") !== "feed" || box().getAttribute("aria-label") !== "Stories") return "it is not a feed";
if (cells()[0].querySelector(".ui-infeed-title").textContent !== "Story 1") return "the first row is wrong";
if (cells()[0].getAttribute("aria-posinset") !== "1" || cells()[0].getAttribute("aria-setsize") !== "-1") return "rows do not say their place";
// The frame is short of its 900 px ahead, so page 2 comes by itself.
if (!await until(() => calls() === "2")) return `page 2 was not asked for: ${calls()}`;
if (!await until(() => box().getAttribute("aria-busy") === "false")) return "it stayed busy";
// A real finger going down reaches the failure at page 3: it shows, and asks no more.
await drag(cells()[2], 0, -400, 260);
if (!await until(() => /That did not load/.test(foot()))) { await toEnd(); }
if (!await until(() => /That did not load/.test(foot()))) return `no failure: ${foot()} after ${calls()}`;
const retry = q(".ui-infeed-retry");
if (!retry || retry.textContent !== "Try again") return "no retry button";
if (retry.getBoundingClientRect().height < 44) return "retry is too small";
const before = calls();
await toEnd(); await wait(300);
if (calls() !== before) return `after a failure it asked again by itself: ${calls()}`;
// While loading it says so, and is busy.
await tap(q(".ui-infeed-retry"));
if (!await until(() => /Loading/.test(foot()) && box().getAttribute("aria-busy") === "true", 400) && !/3,3/.test(calls())) return `no loading state: ${foot()}`;
if (!await until(() => !/Loading/.test(foot()) && box().getAttribute("aria-busy") === "false")) return "it stayed loading";
if (!/^2,3,3/.test(calls())) return `the retry asked ${calls()}`;
// To the end: page 9 is short, so the feed ends, says so, and asks no more.
for (let i = 0; i < 40 && !/caught up/.test(foot()); i++) { await toEnd(); await wait(160); }
if (foot() !== "You're all caught up") return `the end reads ${foot()}, after ${calls()}`;
if (calls() !== "2,3,3,4,5,6,7,8,9") return `pages asked: ${calls()}`;
const total = 12 * 8 + 5;
if (cells()[0].getAttribute("aria-setsize") !== String(total)) return `the size says ${cells()[0].getAttribute("aria-setsize")}, not ${total}`;
const last = cells()[cells().length - 1];
if (last.querySelector(".ui-infeed-title").textContent !== `Story ${total}`) return `the last row is ${last.textContent}`;
await toEnd(); await wait(200);
if (calls() !== "2,3,3,4,5,6,7,8,9") return "it asked past the end";
// Windowing: with 101 items only what is near the screen is on the page, and space stands for the rest.
const onPage = cells().length;
if (onPage > 40) return `${onPage} rows on the page`;
const space = q(".ui-infeed-above").getBoundingClientRect().height;
if (space < 2000) return `the space above is ${space}`;
const sh = box().scrollHeight;
if (sh < 6000) return `the feed is ${sh} tall`;
// Rows come and go as it scrolls; each index is where it should be, and the top is the top, to the pixel.
box().scrollTop = Math.round(sh / 2); await wait(250);
const mid = cells().map((c) => Number(c.dataset.i));
if (mid[0] < 10 || mid.length > 40) return `in the middle the rows are ${mid[0]} to ${mid[mid.length - 1]}`;
if (!mid.every((v, i) => v === mid[0] + i)) return "rows are out of order";
const bh = box().getBoundingClientRect();
const inView = cells().filter((c) => { const r = c.getBoundingClientRect(); return r.bottom > bh.top && r.top < bh.bottom; });
if (!inView.length) return "nothing shows in the middle: the space and the rows disagree";
box().scrollTop = 0; await wait(250);
if (cells()[0].dataset.i !== "0" || Math.abs(cells()[0].getBoundingClientRect().top - box().getBoundingClientRect().top) > 1) return "the top is not the top";
if (q(".ui-infeed-above").getBoundingClientRect().height !== 0) return "space stands above the first row";
// Row heights vary and are measured: long text is taller than short.
const hs = cells().slice(0, 6).map((c) => c.getBoundingClientRect().height);
if (!(hs[2] > hs[1] + 20)) return `rows are ${hs.join()}`;
// Scrolling back through measured rows holds the item in view still.
box().scrollTop = 1500; await wait(250);
box().scrollTop = 1200; await wait(250);
const onTop = () => { const t = box().getBoundingClientRect().top; const c = cells().find((c) => c.getBoundingClientRect().bottom > t + 1); return { i: c.dataset.i, off: Math.round(c.getBoundingClientRect().top - t) }; };
// Open an item, come back: the same item at the same place, with no page asked again.
const here = cells().find((c) => { const r = c.getBoundingClientRect(); return r.top > bh.top + 40 && r.top < bh.bottom - 100; });
const title = here.querySelector(".ui-infeed-title").textContent;
const was = onTop(), yWas = box().scrollTop, asked = calls();
await tap(here.querySelector("button"));
if (!await until(() => $("[data-reading]"))) return "the row did not open";
if ($("[data-reading]").textContent !== title) return `opened ${$("[data-reading]").textContent}, not ${title}`;
if ($$(".ui-infeed")[0].closest("[data-frame]")) return "the feed stayed on the page behind the item";
await tap($("#infeed-back"));
if (!await until(() => q(".ui-infeed-scroll") && q(".ui-infeed-rows") && $$(".ui-infeed")[0].closest("[data-frame]"))) return "the feed did not come back";
await wait(350);
const now = onTop();
if (now.i !== was.i || Math.abs(now.off - was.off) > 2) return `back at item ${now.i}+${now.off}, was ${was.i}+${was.off}; y ${box().scrollTop}, was ${yWas}`;
if (calls() !== asked) return `coming back asked ${calls()}`;
if (foot() !== "You're all caught up") return `coming back lost the end: ${foot()}`;
// A page going away, or an app put aside, saves the place by itself.
box().scrollTop = 1800; await wait(250);
window.dispatchEvent(new Event("pagehide"));
const kept = JSON.parse(sessionStorage.getItem("ui-infeed:infeed-demo"));
if (kept.items.length !== total || kept.done !== true || Math.abs(kept.y - box().scrollTop) > 1) return `the saved place holds ${kept.items.length} items at ${kept.y}`;
// Turning the device keeps the item at the top, though rows take new heights.
const size = device === "phone" ? [390, 844] : [820, 1180];
box().scrollTop = 2600; await wait(250);
const turn = onTop();
await cdp("Emulation.setDeviceMetricsOverride", { width: size[1], height: size[0], deviceScaleFactor: 2, mobile: true });
await wait(500);
const sideways = onTop();
await cdp("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 2, mobile: true });
await wait(500);
const again = onTop();
if (again.i !== turn.i || Math.abs(again.off - turn.off) > 12) return `turned and back, the top is ${again.i}+${again.off}, was ${turn.i}+${turn.off} (sideways ${sideways.i})`;
// A full store does not stop it, nor a corrupt place on return.
const realSet = Storage.prototype.setItem;
Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); };
await tap(cells().find((c) => c.getBoundingClientRect().top > bh.top + 20).querySelector("button"));
if (!await until(() => $("[data-reading]"))) return "a full store stopped the row opening";
Storage.prototype.setItem = realSet;
sessionStorage.setItem("ui-infeed:infeed-demo", "{not json");
await tap($("#infeed-back"));
if (!await until(() => $$(".ui-infeed")[0].closest("[data-frame]"))) return "a corrupt place stopped the feed";
await wait(350);
if (cells()[0].querySelector(".ui-infeed-title").textContent !== "Story 1") return "a corrupt place did not start afresh";
// Storage blocked: reading it throws in a private window, and the feed must start all the same.
await until(() => cells().length > 0);
await tap(cells()[0].querySelector("button"));
if (!await until(() => $("[data-reading]"))) return "the row did not open with storage about to be blocked";
const storeGet = Storage.prototype.getItem;
Storage.prototype.getItem = function () { throw new DOMException("blocked", "SecurityError"); };
await tap($("#infeed-back"));
if (!await until(() => $$(".ui-infeed")[0].closest("[data-frame]"))) return "blocked storage stopped the feed coming back";
await wait(350);
Storage.prototype.getItem = storeGet;
const moved = box();
moved.scrollTop = 900; await wait(350);
if (!cells().some((c) => Number(c.dataset.i) > 4)) return "with blocked storage the feed does not follow its scroll";
// Bad answers: each shows the retry; then the good one, with overlaps cleaned.
const brokenBox = $("#infeed-broken .ui-infeed-scroll");
if (!await until(() => /Broken/.test(foot(brokenBox)))) return `a bad answer shows ${foot(brokenBox)}`;
// Back online, it tries by itself. This try throws, which is one more failure.
const failedAt = foot(brokenBox);
window.dispatchEvent(new Event("online"));
await wait(100);
if (!await until(() => /Broken/.test(foot(brokenBox)) && brokenBox.querySelector(".ui-infeed-retry"))) return `a throw shows ${foot(brokenBox)}`;
await wait(100);
await tap(brokenBox.querySelector(".ui-infeed-retry"));
await wait(150);
if (!/Broken/.test(foot(brokenBox))) return `a bad map shows ${foot(brokenBox)}`;
await tap(brokenBox.querySelector(".ui-infeed-retry"));
if (!await until(() => /caught up/.test(foot(brokenBox)))) return `the good answer shows ${foot(brokenBox)}`;
const titles = cells(brokenBox).map((c) => c.querySelector(".ui-infeed-title").textContent);
if (titles.join() !== "One,Two,No id") return `the merge gave ${titles.join()}`;
// Your own row.
if ($("#infeed-own [data-own]")?.textContent !== "Mine, drawn by you") return "row() is not used";
// Nothing at all, and no load at all.
const noneBox = $("#infeed-none .ui-infeed-scroll");
if (!await until(() => foot(noneBox) === "No stories yet")) return `empty shows ${foot(noneBox)}`;
const still = $("#infeed-still .ui-infeed-scroll");
if (foot(still) !== "Only these") return `no load shows ${foot(still)}`;
if (cells(still).map((c) => c.querySelector(".ui-infeed-title").textContent).join() !== "Plain text,A map") return "plain items show wrong";
if (still.querySelector("button")) return "a row with no on_open is pressable";
// Columns: one on a phone; in a wide pane, two.
const wide = $("#infeed-wide .ui-infeed-scroll");
const tracks = () => getComputedStyle(wide.querySelector(".ui-infeed-rows")).gridTemplateColumns.split(" ").length;
if (device === "phone" && tracks() !== 1) return `a phone has ${tracks()} columns`;
if (device === "tablet") {
    await wait(500);
    if (tracks() !== 2) return `a wide pane has ${tracks()} columns, ${wide.clientWidth} wide`;
    // Beside a taller row a short one keeps its words at the top.
    const main = $$(".ui-infeed")[0];
    const tall2 = [...main.querySelectorAll(".ui-infeed-item")].filter((c) => Number(c.dataset.i) % 2 === 0)[0];
    if (tall2) {
        const pair = main.querySelector(`[data-i="${Number(tall2.dataset.i) + 1}"]`);
        const t1 = tall2.querySelector(".ui-infeed-title").getBoundingClientRect().top, t2 = pair.querySelector(".ui-infeed-title").getBoundingClientRect().top;
        if (Math.abs(t1 - t2) > 1) return `side by side, titles stand at ${t1} and ${t2}`;
    }
    const [a, b, c] = cells(wide).map((x) => x.getBoundingClientRect());
    if (Math.abs(a.top - b.top) > 1 || b.left < a.right - 1 || c.top < a.bottom - 1) return "the rows do not stand in two columns";
    wide.scrollTop = wide.scrollHeight; await wait(300);
    wide.scrollTop = wide.scrollHeight; await wait(300);
    wide.scrollTop = wide.scrollHeight; await wait(300);
    if (!await until(() => /caught up/.test(foot(wide)))) return `two columns did not reach the end: ${foot(wide)}`;
    if (cells(wide).length % 2 && cells(wide).length > 37) return "too many rows on the page";
}
// A page going away saves its place; so the next run starts afresh.
Storage.prototype.setItem = function () {};
