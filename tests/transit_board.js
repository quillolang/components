// mobile
const rows = () => $$(".ui-tboard-row").filter((r) => !r.closest(".transit-board-demo-clockless"));
const row = (id) => $(`.ui-tboard-row[data-id="${id}"]`);
const ids = () => rows().map((r) => r.dataset.id).join("");
const wait_of = (id) => row(id).querySelector(".ui-tboard-wait").textContent;
const sub = (id) => row(id).querySelector(".ui-tboard-sub").textContent.replace(/\s+/g, " ").trim();

if ($(".ui-tboard-stop").textContent !== "Cais do Sodre") return "stop: " + $(".ui-tboard-stop").textContent;
if ($(".ui-tboard-clock").textContent !== "14:05") return "clock: " + $(".ui-tboard-clock").textContent;

// Sorted by when each really leaves: b 14:05:30, c 14:11, a 14:12 (14:09 + 3), d 14:20, e 15:12. g has gone.
if (ids() !== "bcade") return "order: " + ids();
if (row("g")) return "a departure long gone is still there";
if (wait_of("b") !== "Due" || row("b").dataset.state !== "due") return "b: " + wait_of("b");
// Whole minutes, down: the demo's clock has been running a second or more since 14:05:00.
if (wait_of("c") !== "5 min" || wait_of("a") !== "6 min") return "minutes: " + wait_of("c") + " " + wait_of("a");
// An hour off shows the clock's time, as a board does.
if (wait_of("e") !== "15:12") return "e: " + wait_of("e");
if (sub("a") !== "14:09+3 minPlatform 2") return "delay: " + sub("a");
if (!row("a").querySelector("s")) return "the old time is not struck out";
if (sub("b") !== "14:05On timePlatform 1, step free") return "b sub: " + sub("b");
if (sub("c") !== "14:11On timePlatform 4 (was 3)") return "platform change: " + sub("c");
if (wait_of("d") !== "Cancelled" || row("d").dataset.state !== "cancelled") return "d: " + wait_of("d");
if (sub("d") !== "14:20Platform 6") return "d sub: " + sub("d");
const inks = ["c", "e"].map((id) => getComputedStyle(row(id).querySelector(".ui-tboard-line")));
if (inks[0].backgroundColor !== "rgb(41, 128, 185)" || inks[0].color !== "rgb(255, 255, 255)") return "line colour: " + inks[0].backgroundColor + inks[0].color;
// A pale line gets dark words: #fc0 weighs 255 x .299 + 204 x .587 = 196.
if (inks[1].backgroundColor !== "rgb(255, 204, 0)" || inks[1].color !== "rgb(17, 17, 17)") return "pale line: " + inks[1].backgroundColor + inks[1].color;
if (!$(".ui-tboard").textContent.includes("One departure has no time that can be read.")) return "the bad row is not counted";
if ($(".ui-tboard-sr").textContent !== "Next: 15E to Praca da Figueira, Due") return "said: " + $(".ui-tboard-sr").textContent;
if ($(".ui-tboard-fresh").textContent !== "Updated just now") return "fresh: " + $(".ui-tboard-fresh").textContent;
if ($(".ui-tboard-note").textContent !== "") return "a warning with fresh data: " + $(".ui-tboard-note").textContent;

// A filter by line, by tap.
await tap($('.ui-tboard-chip[data-line="714"]'));
if (ids() !== "c") return "714 only: " + ids();
await tap($('.ui-tboard-chip[data-line=""]'));
if (ids() !== "bcade") return "all: " + ids();

// New data: the row moves down, keeps its element, and counts from the new time.
const keep = row("c");
await tap($(".transit-board-demo-delay"));
if (ids() !== "badce") return "after the delay: " + ids();
if (row("c") !== keep) return "the row was made again";
if (wait_of("c") !== "25 min" || sub("c") !== "14:11+20 minPlatform 4 (was 3)") return "delayed c: " + wait_of("c") + " " + sub("c");

// 14:10:40: b left at 14:05:30, gone past its 30 s. Data 6 min 10 s old is stale.
await tap($(".transit-board-demo-later"));
if ($(".ui-tboard-clock").textContent !== "14:10") return "clock later: " + $(".ui-tboard-clock").textContent;
if (ids() !== "adce") return "later: " + ids();
if (wait_of("a") !== "1 min") return "a later: " + wait_of("a");
if ($(".ui-tboard-note").textContent !== "These times may be out of date. Last update 14:04.") return "stale: " + $(".ui-tboard-note").textContent;
if ($(".ui-tboard-fresh").textContent !== "") return "fresh while stale";

// Refresh: a callback, and the warning goes.
await tap($(".ui-tboard-refresh"));
if ($(".transit-board-demo-refreshed").textContent !== "1") return "on_refresh: " + $(".transit-board-demo-refreshed").textContent;
if ($(".ui-tboard-note").textContent !== "") return "still stale: " + $(".ui-tboard-note").textContent;

// The clock runs by itself. Ten minutes on, a (14:12) has gone, and c is 10 minutes away.
const realNow = Date.now;
Date.now = () => realNow.call(Date) + 10 * 60000;
await wait(1200);
Date.now = realNow;
if (row("a")) return "a did not go";
if ($(".ui-tboard-clock").textContent !== "14:20") return "clock ran to: " + $(".ui-tboard-clock").textContent;
if (wait_of("c") !== "10 min") return "c counts: " + wait_of("c");

// Offline, by Chrome's own network state, then back.
await cdp("Network.enable");
await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
const off = $(".ui-tboard-note").textContent;
await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
await wait(300);
if (off !== "You are offline. Times are from 14:10 and may have changed.") return "offline: " + off;
if ($(".ui-tboard-note").textContent !== "") return "still offline: " + $(".ui-tboard-note").textContent;

// With no time from the page, the phone's own clock takes over once it has started, in the
// phone's own zone, and the page from the server had no time in it.
const own = $(".transit-board-demo-clockless");
const pad = (n) => String(n).padStart(2, "0"), d = new Date();
const mins = [d, new Date(d - 60000), new Date(+d + 60000)].map((t) => `${pad(t.getHours())}:${pad(t.getMinutes())}`);
if (!mins.includes(own.querySelector(".ui-tboard-clock").textContent)) return "own clock: " + own.querySelector(".ui-tboard-clock").textContent + " at " + mins;
if (own.querySelector(".ui-tboard-wait").textContent !== "09:30") return "own clock row: " + own.querySelector(".ui-tboard-wait").textContent;
const html = await (await fetch(location.href)).text();
const server = new DOMParser().parseFromString(html, "text/html").querySelector(".transit-board-demo-clockless .ui-tboard-clock");
if (server.textContent !== "") return "the server wrote a clock: " + server.textContent;

// A tablet lays it out as a board: the platform's column lines up across rows.
const a = rows()[0].querySelector(".ui-tboard-to").getBoundingClientRect(), b = rows()[1].querySelector(".ui-tboard-to").getBoundingClientRect();
if (a.left !== b.left) return "rows do not line up";
const cols = getComputedStyle(rows()[0]).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 4 : 3)) return "columns: " + cols;
