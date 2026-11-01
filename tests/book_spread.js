// tablet
await wait(400);
// The text is the first book on the page.
const book = $(".demo-tablet .ui-book-spread");
const view = book.querySelector(".ui-book-spread-view"), flow = book.querySelector(".ui-book-spread-flow");
const btn = (t) => [...book.querySelectorAll(".ui-book-spread-btn")].find((b) => b.getAttribute("aria-label") === t);
const foot = () => book.querySelector(".ui-book-spread-foot span").textContent;
const placeNote = () => $("#book-spread-place").textContent;
const quote = () => $("#book-spread-quote").textContent;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
const wide = innerWidth > innerHeight;
const pageNo = () => parseInt(foot().match(/\d+/)[0]);
if (flow.getAttribute("style") === null) return "the flow was not laid out";

// Bad data, and a place whose words moved to another block.
const saved = $("#book-spread-saved"), empty = $("#book-spread-empty");
if (empty.textContent.indexOf("Nothing to read yet.") < 0) return "no text: " + empty.textContent;
const odd = $("#book-spread-odd");
if (odd.querySelectorAll("[data-i]").length !== 2) return "bad blocks: " + odd.querySelectorAll("[data-i]").length;
if (odd.querySelector("[data-i='1']").getAttribute("role") !== "heading") return "a heading is not one";
// Block 0 no longer holds the words at offset 500: they are at the end of the book, and that is where it opens.
const savedView = saved.querySelector(".ui-book-spread-view").getBoundingClientRect();
const lastBlock = [...saved.querySelectorAll("[data-i]")].at(-1);
if (!lastBlock.textContent.endsWith("(8.12)")) return "the demo's last block: " + lastBlock.textContent;
const words12 = lastBlock.firstChild, rg = document.createRange();
rg.setStart(words12, words12.length - 6); rg.setEnd(words12, words12.length - 5);
const wordsAt = rg.getClientRects()[0];
if (!wordsAt || wordsAt.left < savedView.left - 1 || wordsAt.right > savedView.right + 1) return "a place by its words: at " + (wordsAt && wordsAt.left) + " in " + savedView.left + ".." + savedView.right;
saved.remove();
empty.remove();
odd.remove();
await wait(100);

// Independent of the component: what the first character on the screen is.
const firstShown = () => {
    const v = view.getBoundingClientRect();
    for (const el of flow.querySelectorAll("[data-i]")) {
        const rects = [...el.getClientRects()];
        const hit = rects.find((r) => r.right > v.left + 1 && r.left < v.right);
        if (!hit) continue;
        const node = el.firstChild, range = document.createRange();
        for (let i = 0; i < node.length - 1; i++) {
            range.setStart(node, i); range.setEnd(node, i + 1);
            const c = range.getClientRects()[0];
            if (c && c.left >= v.left - 1 && c.width > 0) { range.setEnd(node, Math.min(i + 40, node.length)); return range.toString().trim(); }
        }
    }
    return "";
};
// Columns on the screen, by where text stands.
const columns = () => {
    const v = view.getBoundingClientRect(), lefts = new Set();
    for (const el of flow.querySelectorAll("[data-i]")) for (const r of el.getClientRects()) if (r.left >= v.left - 1 && r.right <= v.right + 1) lefts.add(Math.round(r.left));
    return lefts.size;
};
const expectCols = view.clientWidth > view.clientHeight ? 2 : 1;
if (columns() !== expectCols) return "columns at " + innerWidth + ": " + columns();
if ((book.querySelector(".ui-book-spread-gutter") !== null) !== (expectCols === 2)) return "the gutter";
const step = expectCols;

// Button: one screen on, the words at the top are what on_position says.
await tap(btn("Next page"));
await wait(300);
if (pageNo() !== 1 + step) return "Next: " + foot();
if (!placeNote().includes(`/`)) return "on_position: " + placeNote();
if (firstShown() !== quote().trim()) return "the place is not what shows: '" + firstShown() + "' and '" + quote() + "'";

// A short drag springs back; a little way off it follows.
const m = middle(view);
const base = () => new DOMMatrix(getComputedStyle(flow).transform).m41;
const rest = base();
await drag(view, -60, 0, 400);
await wait(320);
if (pageNo() !== 1 + step) return "a short drag turned the page: " + foot();
if (Math.abs(base() - rest) > 1) return "it did not spring back: " + base() + " from " + rest;
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 20, y: m.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 120, y: m.y }] });
await wait(60);
if (Math.abs(base() - rest + 120) > 1) return "the page should follow: " + base() + " from " + rest;
if (!flow.classList.contains("ui-book-spread-swiping")) return "no selection guard during a swipe";
// A cancel puts it back.
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(320);
if (pageNo() !== 1 + step || Math.abs(base() - rest) > 1) return "a cancel: " + foot();

// A state change mid-swipe. The type size relays the book: the swipe ends, the flow keeps
// its columns and stands on a whole page, with the same words first.
const words = firstShown();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [m] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 20, y: m.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: m.x - 90, y: m.y }] });
await wait(40);
btn("Larger type").click();
await wait(200);
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(320);
if (!flow.style.columnWidth || !flow.style.height) return "a state change wiped the flow's layout: " + flow.getAttribute("style");
const stepPx = parseFloat(flow.style.columnWidth) + parseFloat(flow.style.columnGap);
if (Math.abs(base() / stepPx - Math.round(base() / stepPx)) > 0.01) return "the flow stands between pages: " + base() + " by " + stepPx;
if (!firstShownHolds(words)) return "the swipe's state change lost the place: '" + words + "' and '" + firstShown() + "'";
btn("Smaller type").click();
await wait(200);

function firstShownHolds(text) {
    // The words kept are on this screen, though a new size may start the screen a little earlier.
    const v = view.getBoundingClientRect();
    const needle = text.slice(0, 20);
    for (const el of flow.querySelectorAll("[data-i]")) {
        const at = el.textContent.indexOf(needle);
        if (at < 0) continue;
        const r = document.createRange();
        r.setStart(el.firstChild, at); r.setEnd(el.firstChild, at + 1);
        const c = r.getClientRects()[0];
        if (c && c.left >= v.left - 1 && c.right <= v.right + 1) return true;
    }
    return false;
}

// Far enough turns it; a flick turns it; back the other way.
const p0 = pageNo();
await drag(view, -Math.round(view.clientWidth * 0.4), 0, 400);
await wait(300);
if (pageNo() !== p0 + step) return "a long swipe: " + foot() + " from " + p0;
await drag(view, -140, 0, 40);
await wait(300);
if (pageNo() !== p0 + step * 2) return "a flick: " + foot();
await drag(view, Math.round(view.clientWidth * 0.4), 0, 300);
await wait(300);
if (pageNo() !== p0 + step) return "a swipe back: " + foot();
// Up and down is not a turn.
await drag(view, 6, 200, 200);
await wait(200);
if (pageNo() !== p0 + step) return "a drag down turned the page: " + foot();

// Edge taps, and the middle does nothing.
const v = view.getBoundingClientRect();
const at = async (fx) => { await fingers("touchStart", [{ x: v.left + v.width * fx, y: v.top + v.height / 2 }]); await fingers("touchEnd", []); await wait(320); };
await at(0.9);
if (pageNo() !== p0 + step * 2) return "a tap at the right edge: " + foot();
await at(0.1);
if (pageNo() !== p0 + step) return "a tap at the left edge: " + foot();
await at(0.5);
if (pageNo() !== p0 + step) return "a tap in the middle: " + foot();

// Keys.
view.focus();
const press = async (k, code, vk) => { await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk }); await wait(300); };
await press("ArrowRight", "ArrowRight", 39);
if (pageNo() !== p0 + step * 2) return "the right arrow: " + foot();
await press("PageUp", "PageUp", 33);
if (pageNo() !== p0 + step) return "Page Up: " + foot();
await press("End", "End", 35);
const lastFoot = foot();
if (!btn("Next page").disabled) return "End: " + foot();
if (!book.querySelector(".ui-book-spread-foot").textContent.endsWith("100%")) return "the end should be 100%: " + book.querySelector(".ui-book-spread-foot").textContent;
// Past the last page it gives a little and stays.
await drag(view, -300, 0, 200);
await wait(300);
if (foot() !== lastFoot) return "past the end: " + foot();
await press("Home", "Home", 36);
if (pageNo() !== 1 || !btn("Last page").disabled) return "Home: " + foot();
await drag(view, 300, 0, 200);
await wait(300);
if (pageNo() !== 1) return "before the start: " + foot();

// The place is text. Go well in, turn the tablet: the page number changes, the words stay.
// A screen that starts part way through a paragraph, which a page number or a block alone would lose.
for (let i = 0; i < 6; i++) await press("ArrowRight", "ArrowRight", 39);
for (let i = 0; i < 12 && / ?\d+:0 /.test(" " + placeNote()); i++) await press("ArrowRight", "ArrowRight", 39);
if (/^\d+:0 /.test(placeNote())) return "no screen starts inside a paragraph: " + placeNote();
const before = firstShown(), pagesBefore = foot();
if (before !== quote().trim()) return "the place in a paragraph: '" + before + "' and '" + quote() + "'";
if (before.length < 5) return "no words to follow: " + before;
await (wide ? size(820, 1180) : size(1180, 820));
await wait(450);
if (columns() !== (view.clientWidth > view.clientHeight ? 2 : 1)) return "columns after turning: " + columns();
if (!firstShownHolds(before)) return "turning lost the words: '" + before + "', now '" + firstShown() + "'";
if (foot() === pagesBefore) return "the page numbers should change on turning: " + foot();
await (wide ? size(1180, 820) : size(820, 1180));
await wait(450);
if (!firstShownHolds(before)) return "turning back lost the words: '" + before + "', now '" + firstShown() + "'";

// Larger type: more pages, the same words on the screen; focus stays through it all.
const pagesWas = parseInt(foot().match(/of (\d+)/)[1]);
await tap(btn("Larger type"));
await tap(btn("Larger type"));
await wait(300);
const pagesNow = parseInt(foot().match(/of (\d+)/)[1]);
if (pagesNow <= pagesWas) return "larger type should make more pages: " + pagesNow + " from " + pagesWas;
if (!firstShownHolds(before)) return "a type size lost the words: '" + before + "', now '" + firstShown() + "'";
