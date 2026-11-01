// mobile
const [first, second, third] = $$(".ui-pagedots");
const row = first.querySelector(".ui-pagedots-row"), track = $("#page-dots-demo"), mark = first.querySelector(".ui-pagedots-mark");
const room = device === "tablet" ? 9 : 5;
const sizes = () => [...first.querySelectorAll(".ui-pagedots-dot")].map((d) => d.dataset.size);
// A dot's middle against the marker's: on a page they are one.
const markAt = (el = mark) => new DOMMatrix(getComputedStyle(el).transform).m41 - 4;
const said = (el = first) => el.querySelector(".ui-sr").textContent;
const go = async (i) => { track.scrollTo({ left: i * track.clientWidth, behavior: "instant" }); await wait(100); };
const want = (start) => Array.from({ length: 12 }, (_, i) => {
    const off = i < start ? start - i : i > start + room - 1 ? i - (start + room - 1) : 0;
    return ["full", "mid", "far"][off] ?? "gone";
}).join();
await wait(300);
if (sizes().length !== 12) return "dots: " + sizes().length;
if (sizes().join() !== want(0)) return "first sizes: " + sizes().join();
if (row.getAttribute("role") !== "slider") return "role: " + row.getAttribute("role");
if (row.getAttribute("aria-valuetext") !== "Photo 1 of 12") return row.getAttribute("aria-valuetext");
if (row.getAttribute("aria-valuemax") !== "12") return "valuemax";
if (said() !== "Photo 1 of 12") return "said: " + said();
if (first.querySelector(".ui-sr").getAttribute("aria-live") !== "polite") return "not a live region";
// The row is 44 px tall at least, as it is pressed.
if (row.getBoundingClientRect().height < 44) return "row height: " + row.getBoundingClientRect().height;

// Scrolling a page at a time moves the marker, not the window, until its end.
await go(1);
if (Math.abs(markAt() - 16) > 0.5) return "marker after one page: " + markAt();
const onDot = (i) => { const d = first.querySelectorAll(".ui-pagedots-dot")[i].getBoundingClientRect(), m = mark.getBoundingClientRect(); return Math.abs(d.left + d.width / 2 - (m.left + m.width / 2)); };
if (onDot(1) > 0.5) return "the marker is off its dot by " + onDot(1);
if (said() !== "Photo 2 of 12") return "said: " + said();
if (sizes().join() !== want(0)) return "the window moved: " + sizes().join();
await go(room - 1);
if (sizes().join() !== want(0)) return "the window moved early: " + sizes().join();
await go(room);
if (sizes().join() !== want(1)) return `window at page ${room}: ` + sizes().join();
if (row.getAttribute("aria-valuenow") !== String(room + 1)) return "valuenow: " + row.getAttribute("aria-valuenow");
await go(11);
if (sizes().join() !== want(12 - room)) return "window at the end: " + sizes().join();
await wait(260);
if (Math.abs(new DOMMatrix(getComputedStyle(first.querySelector(".ui-pagedots-strip")).transform).m41 - (2 - (12 - room)) * 16) > 0.5) return "strip's shift";
// The marker stands inside the row at the end.
const mr = mark.getBoundingClientRect(), rr = row.getBoundingClientRect();
if (mr.left < rr.left || mr.right > rr.right) return "the marker left the row";
// Back to the middle: the window waits for the marker.
await go(4);
if (sizes().join() !== want(device === "tablet" ? 3 : 4)) return "window coming back: " + sizes().join();

// Follows a finger: partway it is between two dots, and nothing is said.
await go(0);
await wait(260);
const r = track.getBoundingClientRect(), y = r.top + r.height / 2, x = r.left + r.width - 20;
await fingers("touchStart", [{ x, y }]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: x - r.width * .06 * i, y }]); await wait(16); }
await wait(80);
const partway = markAt(), place = track.scrollLeft / (track.scrollWidth - track.clientWidth) * 11;
if (track.scrollLeft < 40) return "the finger did not scroll: " + track.scrollLeft;
if (Math.abs(partway - place * 16) > 1.5) return `partway: ${partway}, wanted ${place * 16}`;
if (partway === 0 || partway % 16 === 0) return "the marker jumps: " + partway;
if (said() !== "Photo 1 of 12") return "said on the way: " + said();
await fingers("touchEnd", []);
await wait(700);
if (said() !== "Photo 2 of 12") return "after a swipe: " + said() + " at " + track.scrollLeft;
if (Math.abs(markAt() - 16) > 0.5) return "marker after a swipe: " + markAt();

// A tap on either half steps once.
await tap(row);
const half = row.getBoundingClientRect();
const press = async (px) => { await fingers("touchStart", [{ x: px, y: half.top + half.height / 2 }]); await fingers("touchEnd", []); await wait(700); };
await press(half.left + half.width - 6);
if (Math.round(track.scrollLeft / track.clientWidth) < 2) return "a tap on the right: " + track.scrollLeft;
const before = Math.round(track.scrollLeft / track.clientWidth);
await press(half.left + 6);
if (Math.round(track.scrollLeft / track.clientWidth) !== before - 1) return "a tap on the left: " + track.scrollLeft;

// Keys scroll it too.
await go(3);
row.focus();
key(row, "ArrowRight");
await wait(700);
if (Math.round(track.scrollLeft / track.clientWidth) !== 4) return "ArrowRight: " + track.scrollLeft;
key(row, "Home");
await wait(1500);
if (track.scrollLeft !== 0) return "Home: " + track.scrollLeft;
key(row, "End");
await wait(1500);
if (Math.round(track.scrollLeft / track.clientWidth) !== 11) return "End: " + track.scrollLeft;
key(row, "ArrowRight");
await wait(100);
if (Math.round(track.scrollLeft / track.clientWidth) !== 11) return "past the end";

// A place given by your state, with on_change.
const row2 = second.querySelector(".ui-pagedots-row"), mark2 = second.querySelector(".ui-pagedots-mark");
if (second.querySelectorAll('.ui-pagedots-dot[data-size="full"]').length !== 3) return "three dots, none shrunk";
if (Math.abs(row2.getBoundingClientRect().width - 48) > 0.5) return "row of three: " + row2.getBoundingClientRect().width;
key(row2, "ArrowRight");
await wait(100);
if (!$$(".demo-note").some((n) => n.textContent.startsWith("Step 2 of 3"))) return "on_change by key";
if (Math.abs(markAt(mark2) - 16) > 0.5) return "the second marker: " + markAt(mark2);
if (said(second) !== "Step 2 of 3") return "said: " + said(second);
[...document.querySelectorAll(".g-stage button")].find((b) => b.textContent.trim() === "Next step").click();
await wait(100);
if (row2.getAttribute("aria-valuetext") !== "Step 3 of 3") return "prop did not reach: " + row2.getAttribute("aria-valuetext");

// A place between pages from a prop, and no slider without anything to change.
const row3 = third.querySelector(".ui-pagedots-row");
if (row3.getAttribute("role") !== "img" || row3.hasAttribute("tabindex")) return "a picture: " + row3.getAttribute("role");
if (row3.getAttribute("aria-label") !== "Slide 3 of 4") return "picture's name: " + row3.getAttribute("aria-label");
if (Math.abs(markAt(third.querySelector(".ui-pagedots-mark")) - 24) > 0.5) return "1.5: " + markAt(third.querySelector(".ui-pagedots-mark"));
