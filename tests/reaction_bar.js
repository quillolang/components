// mobile
const first = $("#reaction-bar-first");
const target = first.querySelector(".ui-reaction-bar-target");
const bar = first.querySelector("[role=menu]");
const note = () => $("#reaction-bar-note").textContent;
const chips = (r = first) => [...r.querySelectorAll(".ui-reaction-bar-tally button:not(.ui-reaction-bar-add)")].map((b) => b.textContent.trim().replace(/\s+/g, " ") + (b.getAttribute("aria-pressed") === "true" ? "*" : ""));
const isOpen = () => bar.matches(":popover-open");
const items = () => [...bar.querySelectorAll("button")];
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); return true; } };
if (chips().join() !== "👍 3,❤️ 1") return "the counts start wrong: " + chips().join();
if (getComputedStyle(target).touchAction !== "pan-y") return "the page must still scroll from the message";

// A tap is not a long press.
await tap(target); await wait(500);
if (isOpen()) return "a tap raised the bar";
// A short hold is not one either.
await hold(target, 200); await wait(300);
if (isOpen()) return "a hold of 200 ms raised the bar";

const midOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const down = async () => { const p = midOf(target); await fingers("touchStart", [p]); await wait(520); return p; };
const to = async (p, q, steps = 6) => { for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x + (q.x - p.x) * i / steps, y: p.y + (q.y - p.y) * i / steps }]); await wait(20); } };
const up = async () => { await fingers("touchEnd", []); await wait(120); };

// Held: the bar rises while the finger is still down, on screen, and it is felt.
let p = await down();
if (!isOpen()) return "a long press did not raise the bar";
if (felt.join() !== "medium") return "the rise was not felt: " + felt.join();
{
    const r = bar.getBoundingClientRect();
    if (r.left < 8 - 0.5 || r.right > innerWidth - 8 + 0.5) return `the bar is off the screen: ${r.left} to ${r.right} of ${innerWidth}`;
    const t = target.getBoundingClientRect();
    if (r.bottom > t.top + 1 && r.top < t.bottom - 1) return "the bar sits on the message";
}
if (items().length !== 6) return "six choices, found " + items().length;
// Slide to Funny, the third: picked on letting go, one felt tap for each item crossed.
const scrollBefore = scrollY;
await to(p, midOf(items()[2]));
if (!items()[2].classList.contains("ui-reaction-bar-on")) return "sliding did not mark the item under the finger";
if (scrollY !== scrollBefore) return "the page scrolled under the slide";
await up();
if (isOpen()) return "letting go on an item should close the bar";
if (chips().join() !== "👍 3,❤️ 1,😂 1*") return "after picking Funny: " + chips().join();
if (note() !== "😂: Like 3, Love 1, Funny 1") return "on_change: " + note();
if (!felt.includes("selection")) return "moving over items was not felt";

// Another: the old one comes off, one reaction a person.
p = await down();
await to(p, midOf(items()[0]));
await up();
if (chips().join() !== "👍 4*,❤️ 1") return "after picking Like, one per person: " + chips().join();

// The same again takes it back.
p = await down();
await to(p, midOf(items()[0]));
await up();
if (chips().join() !== "👍 3,❤️ 1") return "picking the same takes it back: " + chips().join();
if (note() !== "none: Like 3, Love 1") return "on_change with none: " + note();

// Slid off the bar: nothing.
p = await down();
const off = midOf(items()[3]);
await to(p, { x: off.x, y: off.y + 300 });
await up();
if (isOpen()) return "letting go off the bar should close it";
if (chips().join() !== "👍 3,❤️ 1") return "letting go off the bar picked something: " + chips().join();

// Up and down over a long distance with the finger held: the page stays.
p = await down();
const y0 = scrollY;
await to(p, { x: p.x, y: p.y + 160 }, 8);
await to({ x: p.x, y: p.y + 160 }, { x: p.x, y: p.y - 80 }, 8);
if (scrollY !== y0) return "the page moved under the held finger: " + y0 + " to " + scrollY;
await fingers("touchCancel", []); await wait(150);
// The system took the gesture: the bar goes, nothing picked.
if (isOpen()) return "a cancelled press left the bar up";
if (chips().join() !== "👍 3,❤️ 1") return "a cancelled press picked something";

// A long press with no slide leaves it up to tap.
p = await down();
await up();
if (!isOpen()) return "a long press with no slide should leave the bar up";
await tap(items()[1]); await wait(100);
if (isOpen() || chips().join() !== "👍 3,❤️ 2*") return "tapping an item: " + chips().join();
// Up again, and a tap elsewhere closes it, picking nothing.
p = await down();
await up();
await tap($("#reaction-bar-note")); await wait(100);
if (isOpen()) return "a tap elsewhere should close the bar";

// Moving first is a scroll: no bar, and the page does move.
{
    const tall = document.documentElement.scrollHeight > innerHeight + 120;
    if (tall) { scrollTo(0, 100); await wait(100); }
    const q = midOf(target), sy = scrollY;
    await fingers("touchStart", [q]);
    await to(q, { x: q.x, y: q.y + 60 }, 6);
    await wait(600);
    await fingers("touchEnd", []);
    await wait(300);
    if (isOpen()) return "a finger that moved first is a scroll, not a press";
    if (tall && scrollY >= sy) return `a drag from the message should scroll the page: ${sy} to ${scrollY}`;
}

// A chip is a toggle: taking mine back, then adding.
const chipBtn = (i) => first.querySelectorAll(".ui-reaction-bar-tally button:not(.ui-reaction-bar-add)")[i];
await tap(chipBtn(1));
if (chips().join() !== "👍 3,❤️ 1") return "a chip of mine should come off: " + chips().join();
await tap(chipBtn(0));
if (chips().join() !== "👍 4*,❤️ 1") return "a chip should add: " + chips().join();
if (!chipBtn(0).getAttribute("aria-label").endsWith("4, yours")) return "the chip's label: " + chipBtn(0).getAttribute("aria-label");

// The keyboard route: the same bar, starting on what is mine.
const add = first.querySelector(".ui-reaction-bar-add");
add.focus(); add.click(); await wait(120);
if (!isOpen() || add.getAttribute("aria-expanded") !== "true") return "the React button did not open the bar";
if (document.activeElement !== items()[0]) return "focus should start on my reaction";
if (items()[0].getAttribute("aria-checked") !== "true") return "my reaction is not marked";
key(bar, "ArrowRight"); await wait(60);
if (document.activeElement !== items()[1]) return "ArrowRight did not move";
key(bar, "End"); await wait(60);
if (document.activeElement !== items()[5]) return "End did not move";
key(bar, "ArrowRight"); await wait(60);
if (document.activeElement !== items()[0]) return "ArrowRight did not wrap";
key(bar, "ArrowLeft"); await wait(60);
key(bar, "Escape"); await wait(100);
if (isOpen() || document.activeElement !== add) return "Escape should close and go back";
if (chips().join() !== "👍 4*,❤️ 1") return "Escape changed something";
add.click(); await wait(120);
key(bar, "ArrowRight"); await wait(60);
document.activeElement.click(); await wait(120);
if (chips().join() !== "👍 3,❤️ 2*") return "picking by keys: " + chips().join();
if (first.querySelector("[role=status]").textContent !== "You reacted with Love") return "not told: " + first.querySelector("[role=status]").textContent;

// Starts with mine, and an emoji not offered is still counted.
const second = $("#reaction-bar-mine");
if (chips(second).join() !== "😂 2*,🦆 4") return "the second starts wrong: " + chips(second).join();

// With no room above, the bar goes under. Scrolled to the top of the screen.
target.style.marginTop = "0";
second.querySelector(".ui-reaction-bar-target").scrollIntoView({ block: "start" }); await wait(100);
{
    const t2 = second.querySelector(".ui-reaction-bar-target"), p2 = midOf(t2), bar2 = second.querySelector("[role=menu]");
    await fingers("touchStart", [p2]); await wait(520);
    const r = bar2.getBoundingClientRect(), t = t2.getBoundingClientRect();
    await fingers("touchEnd", []); await wait(100);
    if (t.top < r.height + 16 && r.top < t.bottom) return `with no room above it should go under: ${r.top} ${t.bottom}`;
    bar2.hidePopover?.();
    second.querySelector(".ui-reaction-bar-add").click(); await wait(80);
    second.querySelector(".ui-reaction-bar-add").click(); await wait(80);
}
delete window.quilloNative;
