// tablet
// The turned size is what this run started at: every check is made against it.
const W = innerWidth, H = innerHeight;
const big = W >= 840 ? "expanded" : "medium";
const now = () => $("#size-demo-now").textContent;
const size = () => $(".ui-size-class").dataset.sizeClass;
const shown = () => $$(".ui-size-class-slot").filter((s) => getComputedStyle(s).visibility === "visible").map((s) => s.dataset.when).join("|");
if (size() !== big || now() !== big) return `at ${W} px it says ${size()}, the demo was told ${now()}, not ${big}`;
if (shown() !== big) return `at ${W} px the slots shown are ${shown()}`;

// By its own box, with the screen the same: Split View and Slide Over.
const pressRoom = async (id) => { await tap($(`#size-demo-room-${id}`)); await wait(120); };
await pressRoom("over");
if ($("#size-demo-box").getBoundingClientRect().width !== 320) return "the Slide Over stand-in is not 320 px wide";
if (size() !== "compact" || now() !== "compact" || shown() !== "compact") return `in 320 px: ${size()}, told ${now()}, showing ${shown()}`;
if (innerWidth !== W) return "the screen changed, which would prove nothing";

// The edges of each size, by the box's real width.
const box = $("#size-demo-box");
for (const [w, want] of [[599, "compact"], [600, "medium"], [839, "medium"], [840, "expanded"]]) {
    if (w > W) continue;
    box.style.width = w + "px"; await wait(80);
    const inner = $(".ui-size-class").clientWidth;
    box.style.width = (w + (w - inner)) + "px"; await wait(80);
    if ($(".ui-size-class").clientWidth !== w) return `the box did not come to ${w}: ${$(".ui-size-class").clientWidth}`;
    if (size() !== want || shown() !== want) return `${w} px gives ${size()}, showing ${shown()}, not ${want}`;
}
box.style.width = "";
await pressRoom("full");
if (size() !== big) return "back at full width it did not come back";

// A count in one slot survives the others being shown.
const count = $(`#size-demo-count-${big}`);
await tap(count); await tap(count); await tap(count);
if (!count.textContent.includes("Packed 3")) return `three taps show ${count.textContent}`;
await pressRoom("over");
if (getComputedStyle(count).visibility !== "hidden") return "the count should be out of sight in a compact box";
const tiny = $("#size-demo-count-compact");
await tap(tiny);
if (!tiny.textContent.includes("Packed 1")) return "the compact slot has its own count";
await pressRoom("full");
if ($(`#size-demo-count-${big}`) !== count) return "the button was made again, not kept";
if (!count.textContent.includes("Packed 3")) return `the count came back as ${count.textContent}`;
if (!tiny.textContent.includes("Packed 1")) return "the compact count was lost";

// A list scrolled away from comes back where it was, though the slot is out of sight.
const list = $(`#size-demo-list-${big}`);
list.scrollTop = 300; await wait(60);
await pressRoom("over");
await pressRoom("full");
if (list.scrollTop !== 300) return `the slot's list came back at ${list.scrollTop}, not 300`;

// data-keep: the note follows the person, with its text, caret and focus.
const note = $(`#size-demo-note-${big}`), other = $("#size-demo-note-compact");
note.focus(); note.value = "Ring twice"; note.setSelectionRange(4, 4);
await wait(40);
await pressRoom("over");
await wait(120);
// Tapping the room's button took the focus, as a finger does, so only the text moves.
if (other.value !== "Ring twice") return `the kept text is "${other.value}"`;
if (other.scrollTop !== 0) return "a short note has no scroll";
// Focus follows when the change comes while typing, as it does in a turn.
other.focus(); other.setSelectionRange(2, 2); await wait(40);
box.style.width = "100%"; await wait(150);
const next = $(`#size-demo-note-${big}`);
if (document.activeElement !== next) return `after the change the focus is on ${document.activeElement.id || document.activeElement.tagName}`;
if (next.selectionStart !== 2) return `the caret came over as ${next.selectionStart}`;
// The list's scroll goes with its name, into the size coming into view.
await pressRoom("full");
list.scrollTop = 420; await wait(60);
await pressRoom("over");
if ($("#size-demo-list-compact").scrollTop !== 420) return `the kept list is at ${$("#size-demo-list-compact").scrollTop}, not 420`;
await pressRoom("full");

// A real turn, through the browser: the size changes, and nothing else does.
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(400);
const turned = H >= 840 ? "expanded" : "medium";
if (size() !== turned || now() !== turned) return `turned to ${H} px it says ${size()}, told ${now()}`;
if (turned !== big && !$(`#size-demo-count-${turned}`).textContent.includes("Packed 0")) return "the other slot has its own count";
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (!count.textContent.includes("Packed 3")) return `after a turn and back the count is ${count.textContent}`;
if (size() !== big) return "the turn back did not give the first size";
