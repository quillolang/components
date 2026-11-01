// mobile
const box = $("#secfeed-demo");
const scroll = box.querySelector(".ui-secfeed-scroll");
const secs = [...box.querySelectorAll(".ui-secfeed-section")];
const heads = secs.map((s) => s.querySelector(".ui-secfeed-head"));
const pill = box.querySelector(".ui-secfeed-pill");
const jump = () => box.querySelector(".ui-secfeed-jump");
const v = (k) => $(`[data-${k}]`).textContent;
const stop = async (el = scroll) => { for (let was = NaN, i = 0; i < 50 && el.scrollTop !== was; i++) { was = el.scrollTop; await wait(80); } };
// Headings worked out by hand from Sunday 2026-11-01.
const wanted = ["20 Oct", "Tuesday", "Friday", "Yesterday", "Today", "Tomorrow", "20 Nov", "5 Jan 2027"];
if (heads.map((h) => h.textContent).join() !== wanted.join()) return `the headings are ${heads.map((h) => h.textContent).join()}`;
if (getComputedStyle(heads[0]).position !== "sticky") return "the heading is not sticky";
if (!secs[4].classList.contains("ui-secfeed-today")) return "today is not marked";
// Starts at the top, so today is out of sight below: the button points down.
if (!jump() || jump().textContent.trim() !== "Today") return "no jump button";
if (jump().querySelector("svg").getAttribute("style")) return "the arrow should point down";
// A real finger: a heading sticks at the top, and the pill shows, then fades.
const y0 = scroll.scrollTop;
await drag(secs[0].querySelectorAll(".ui-secfeed-row")[4], 0, -240, 280);
await wait(100);
if (scroll.scrollTop <= y0 + 100) return `a drag scrolled ${scroll.scrollTop}`;
if (!pill.hasAttribute("data-on")) return "the pill did not show on scrolling";
await stop(); await wait(1400);
if (pill.hasAttribute("data-on") || getComputedStyle(pill).opacity !== "0") return "the pill did not fade";
// Sticks, exactly: 5 px into the third section its heading stands at the top, and the pill reads its date.
const top = () => scroll.getBoundingClientRect().top;
scroll.scrollTop = secs[2].offsetTop + 5; await wait(160);
if (Math.abs(heads[2].getBoundingClientRect().top - top()) > 1) return `the heading stands at ${heads[2].getBoundingClientRect().top}, the top at ${top()}`;
if (pill.textContent !== "Friday 30 October 2026") return `the pill reads ${pill.textContent}`;
if (v("sec") !== "2") return `on_section gave ${v("sec")}`;
// Just before the next section, the next heading pushes it up: their edges touch.
scroll.scrollTop = secs[3].offsetTop - 12; await wait(120);
const old = heads[2].getBoundingClientRect(), next = heads[3].getBoundingClientRect();
if (Math.abs(old.bottom - next.top) > 1.5) return `the old heading ends at ${old.bottom}, the next starts at ${next.top}`;
if (old.top >= top() - 1) return `the old heading was not pushed: ${old.top}`;
if (Math.abs(old.bottom - secs[3].getBoundingClientRect().top) > 1.5) return "the old heading left its section";
if (old.bottom > next.top + 2) return "headings overlap";
// Past it, the next has taken over.
scroll.scrollTop = secs[3].offsetTop + 1; await wait(120);
if (v("sec") !== "3" || Math.abs(heads[3].getBoundingClientRect().top - top()) > 1) return `the next did not take over: ${v("sec")}`;
if (pill.textContent !== "Saturday 31 October 2026") return `the pill reads ${pill.textContent}`;
// Today in view from here, so no button; from the top there is one. Jump to today, going down.
if (jump()) return "the button shows with today in view";
scroll.scrollTop = 0; await wait(160);
await tap(jump()); await stop(); await wait(120);
if (Math.abs(secs[4].getBoundingClientRect().top - top()) > 1) return `today stands at ${secs[4].getBoundingClientRect().top}`;
if (jump()) return "the button stayed with today in view";
if (document.activeElement !== heads[4]) return "focus did not go to today's heading";
// Past today, it points up.
scroll.scrollTop = secs[6].offsetTop + 10; await wait(160);
if (!jump() || !/rotate\(180deg\)/.test(jump().querySelector("svg").getAttribute("style") ?? "")) return "the arrow should point up";
await tap(jump()); await stop(); await wait(120);
if (Math.abs(secs[4].getBoundingClientRect().top - top()) > 1) return "the jump back up missed";
// Keys: it can take focus, so the browser's keys scroll it; a tap opens a row.
if (scroll.tabIndex !== 0) return "the scroller cannot take focus";
await tap(secs[4].querySelector(".ui-secfeed-row"));
if (v("picked") !== "Today item 1") return `a tap picked ${v("picked")}`;
const rw = secs[4].querySelector(".ui-secfeed-row").getBoundingClientRect();
if (rw.height < 44) return `a row is ${rw.height} tall`;
// start_today opens there.
const start = $("#secfeed-start");
const sscroll = start.querySelector(".ui-secfeed-scroll"), ssecs = [...start.querySelectorAll(".ui-secfeed-section")];
if (Math.abs(sscroll.scrollTop - ssecs[4].offsetTop) > 1) return `start_today stands at ${sscroll.scrollTop}, not ${ssecs[4].offsetTop}`;
if (start.querySelector(".ui-secfeed-jump")) return "a feed at today offers to go to today";
// No section today: the nearest date (11-08 is 2 days off, 11-12 too: the earlier wins), under its own words.
const near = $("#secfeed-near");
const nsecs = [...near.querySelectorAll(".ui-secfeed-section")];
if (!nsecs[1].classList.contains("ui-secfeed-today")) return "the nearest date is not the one marked";
const nscroll = near.querySelector(".ui-secfeed-scroll");
nscroll.scrollTop = nsecs[2].offsetTop + 200; await wait(160);
const nj = near.querySelector(".ui-secfeed-jump");
if (!nj || nj.textContent.trim() !== "Closest") return "today_text does not reach the button";
// Bad input.
const bad = $("#secfeed-bad");
if ([...bad.querySelectorAll(".ui-secfeed-head")].map((h) => h.textContent).join() !== "Undated,Own title") return "bad sections show wrong";
if (bad.querySelector(".ui-secfeed-jump")) return "no today, yet a button";
if ($("#secfeed-none .ui-secfeed-none").textContent !== "No activity") return "the empty text is wrong";
// Turning the device keeps the section.
scroll.scrollTop = secs[5].offsetTop; await wait(120);
const size = device === "phone" ? [390, 844] : [820, 1180];
await cdp("Emulation.setDeviceMetricsOverride", { width: size[1], height: size[0], deviceScaleFactor: 2, mobile: true });
await wait(300);
await cdp("Emulation.setDeviceMetricsOverride", { width: size[0], height: size[1], deviceScaleFactor: 2, mobile: true });
await wait(300);
if (Math.abs(scroll.scrollTop - secs[5].offsetTop) > 2) return `turning the device left it at ${scroll.scrollTop}, not ${secs[5].offsetTop}`;
// A phone stacks; a wide pane keeps headings in a column of their own, sticking, with no pill.
if (device === "phone" && getComputedStyle(secs[0]).display === "grid") return "a phone has columns";
if (device === "tablet") {
    await wait(250);
    if (getComputedStyle(secs[0]).gridTemplateColumns.split(" ").length !== 2) return "a wide pane has no heading column";
    if (getComputedStyle(pill).display !== "none") return "a wide pane shows the pill";
    scroll.scrollTop = secs[4].offsetTop + 60; await wait(160);
    const h = heads[4].getBoundingClientRect(), r = secs[4].querySelector(".ui-secfeed-rows").getBoundingClientRect();
    if (Math.abs(h.top - top()) > 1 || h.right > r.left + 1) return "the heading does not stick in its column";
}
