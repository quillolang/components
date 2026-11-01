// tablet
const W = innerWidth, H = innerHeight;
const turnTo = async (w, h) => {
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
    await wait(450);
};
const rect = (s) => $(s).getBoundingClientRect();
const facing = () => $("#rotation-demo-facing").textContent;
const layout = $(".ui-rotation");

// The arrangement comes from the page's own CSS and HTML, before any script: no flash.
const html = await (await fetch(location.href)).text();
if (!html.includes("--ui-rotation-l-areas")) return "the arrangements are not in the server's HTML, so a script would have to place them";
if (layout.querySelector(".ui-rotation-grid").getAttribute("style")) return "a script is placing the grid";

const upright = async () => {
    if (facing() !== "portrait") return `upright it says ${facing()}`;
    const p = rect("#rotation-demo-photo"), s = rect(".ui-rotation-area-scroll"), n = rect("#rotation-demo-name");
    if (!(p.bottom <= n.top && n.bottom <= s.top)) return `upright the areas are not stacked: ${p.bottom} ${n.top} ${n.bottom} ${s.top}`;
    if (Math.abs(p.height - 180) > 1) return `the photo's row is ${p.height} px, not the 180 asked for`;
    if (Math.abs(p.width - (innerWidth - 24)) > 1) return `the photo is ${p.width} wide in ${innerWidth}`;
    if (getComputedStyle($("#rotation-demo-tip")).visibility !== "hidden") return "the landscape-only area shows upright";
};
const turned = async () => {
    if (facing() !== "landscape") return `turned it says ${facing()}`;
    const p = rect("#rotation-demo-photo"), s = rect(".ui-rotation-area-scroll"), n = rect("#rotation-demo-name");
    if (!(p.right < s.left)) return `turned, the stops are not beside the photo: ${p.right} ${s.left}`;
    if (!(n.top >= p.bottom)) return "turned, the details are not under the photo";
    const share = p.width / (p.width + s.width);
    if (Math.abs(share - 0.6) > 0.02) return `turned, the columns are not 3fr 2fr: ${share}`;
    if (getComputedStyle($("#rotation-demo-tip")).visibility !== "visible") return "the landscape-only area is hidden when turned";
};
const startPortrait = H > W;
let bad = await (startPortrait ? upright : turned)();
if (bad) return bad;

// Everything a person has going, across a real turn and back.
const field = $("#rotation-demo-name"), list = field.closest(".ui-rotation").querySelector(".ui-rotation-area-scroll");
const nodes = [...layout.querySelectorAll(".ui-rotation-area")];
await tap(field);
if (document.activeElement !== field) return "a tap did not focus the field";
field.value = "North gate";
list.scrollTop += $("#rotation-demo-stop-14").getBoundingClientRect().top - list.getBoundingClientRect().top + 9;
await wait(120);
const before = $("#rotation-demo-stop-14").getBoundingClientRect().top - list.getBoundingClientRect().top;
if (Math.abs(before + 9) > 40) return `the list is not at stop 14: ${before}`;
const height14 = rect("#rotation-demo-stop-3").height;

await turnTo(H, W);
bad = await (startPortrait ? turned : upright)();
if (bad) return `after the turn: ${bad}`;
if (document.activeElement !== field) return "the focus was lost in the turn";
if (field.value !== "North gate") return "the text was lost in the turn";
if ([...layout.querySelectorAll(".ui-rotation-area")].some((n, i) => n !== nodes[i])) return "an area was made again";
if (rect("#rotation-demo-stop-3").height === height14) return "the rows should change height in a turn, or this proves nothing";
const after = $("#rotation-demo-stop-14").getBoundingClientRect().top - list.getBoundingClientRect().top;
if (Math.abs(after - before) > 2) return `stop 14 was ${before} from the top and is now ${after}`;

// And a second turn, reading the list by a real finger between them.
await drag(list, 0, -120, 200);
await wait(150);
const moved = list.scrollTop;
const topRow = [...list.querySelectorAll("p")].find((p) => p.getBoundingClientRect().bottom > list.getBoundingClientRect().top + 2);
const was = topRow.getBoundingClientRect().top - list.getBoundingClientRect().top;
await turnTo(W, H);
bad = await (startPortrait ? upright : turned)();
if (bad) return `after the turn back: ${bad}`;
const now = topRow.getBoundingClientRect().top - list.getBoundingClientRect().top;
if (Math.abs(now - was) > 2) return `the row at the top was ${was} from the edge and is now ${now} (scroll ${moved} to ${list.scrollTop})`;

// A box's own shape, whatever the screen.
const boxes = $$(".ui-rotation");
const shape = boxes[1], wrap = $("#rotation-demo-box-wrap");
if (shape.dataset.orientation !== "landscape") return `a 480 by 200 box says ${shape.dataset.orientation}`;
const a = rect("#rotation-demo-a"), b = rect("#rotation-demo-b");
if (!(a.right < b.left && Math.abs(a.top - b.top) < 1)) return "in a wide box the two are not side by side";
wrap.style.width = "150px"; await wait(150);
if (shape.dataset.orientation !== "portrait") return `a 150 by 200 box says ${shape.dataset.orientation}`;
const a2 = rect("#rotation-demo-a"), b2 = rect("#rotation-demo-b");
if (!(a2.bottom <= b2.top && Math.abs(a2.left - b2.left) < 1)) return "in a tall box the two are not stacked";
if (!$(".demo-note").textContent.includes("portrait")) return "on_turn did not reach the page";
wrap.style.width = "100%";

// Not a rectangle: it says none, and the areas stack rather than land on each other.
const odd = boxes[2].style;
if (odd.getPropertyValue("--ui-rotation-p-areas").trim() !== "none") return `"a b / b a" gave ${odd.getPropertyValue("--ui-rotation-p-areas")}`;
if (odd.getPropertyValue("--ui-rotation-l-areas").trim() !== "none") return `uneven rows gave ${odd.getPropertyValue("--ui-rotation-l-areas")}`;
const tiles = $$("#rotation-demo-bad .demo-rotation-tile").map((t) => t.getBoundingClientRect());
if (tiles.length !== 2 || tiles[0].bottom > tiles[1].top + 1 && tiles[0].right > tiles[1].left + 1) return "the bad layout's areas overlap";
