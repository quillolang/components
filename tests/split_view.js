// tablet
const W = innerWidth, H = innerHeight;
const big = W >= 840 ? "expanded" : "medium";
const view = $$(".ui-split-view")[0], two = $$(".ui-split-view")[1];
const panes = [...view.querySelectorAll(".ui-split-view-panes > *")];
if (panes.length !== 3 || !panes.every((p) => p.classList.contains("ui-split-view-pane"))) return `the panes are not the row's children: ${panes.map((p) => p.tagName + "." + p.className).join(", ")}`;
const seen = (el = view) => [...el.querySelectorAll(".ui-split-view-panes > *")].map((p, i) => getComputedStyle(p).visibility === "visible" ? i : -1).filter((i) => i >= 0).join("");
const bars = () => [...view.querySelectorAll(".ui-split-view-divider")].filter((d) => getComputedStyle(d).display !== "none");
const w = (p) => p.getBoundingClientRect().width;
const rowW = () => view.querySelector(".ui-split-view-body").getBoundingClientRect().width;
const turn = async (a, b) => { await cdp("Emulation.setDeviceMetricsOverride", { width: a, height: b, deviceScaleFactor: 2, mobile: true }); await wait(400); };
const button = (name) => view.querySelector(`[data-go="${name}"]`);

// Which panes show at this size, with the pane in use being Notes.
if (view.dataset.size !== big) return `at ${W} it says ${view.dataset.size}`;
if (big === "expanded") {
    if (seen() !== "012") return `at ${W} the panes showing are ${seen()}`;
    if (Math.abs(w(panes[0]) - rowW() * 0.22) > 2) return `the first pane is ${w(panes[0])} of ${rowW()}, not 22%`;
    if (Math.abs(w(panes[1]) - rowW() * 0.33) > 2) return `the second pane is ${w(panes[1])}, not 33%`;
    if (bars().length !== 2) return `${bars().length} dividers at three panes`;
} else {
    if (seen() !== "12") return `at ${W} the panes showing are ${seen()}, not Notes and Reader`;
    if (Math.abs(w(panes[1]) - rowW() * 0.4) > 2) return `the left pane is ${w(panes[1])}, not 40%`;
    if (bars().length !== 1) return `${bars().length} dividers at two panes`;
    if (!button("back") || !button("back").textContent.includes("Folders")) return "no way back to the folders";
}

// A selection survives a real turn, and the scroll with it, out to a phone's width and back.
const row = view.querySelector('[data-note="9"]');
panes[1].scrollTop = row.offsetTop - panes[1].offsetTop - 60;
await wait(60);
{ const q = row.getBoundingClientRect(), hit = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); if (!row.contains(hit)) return `the row's middle is covered by ${hit.tagName}.${hit.className} ${JSON.stringify(q)}`; }
await tap(row);
if (view.querySelector("#split-demo-title").textContent !== "Site visit 9") return `a tap on a note did not open it: ${view.querySelector("#split-demo-title").textContent}, at ${view.dataset.at}`;
if (row.getAttribute("aria-current") !== "true") return "the row is not marked";
const scroll = panes[1].scrollTop;
if (scroll < 200) return `the list did not scroll: ${scroll}`;
$("#split-demo-reply").value = "Keys on Friday";
await turn(H, W);
if (view.dataset.at !== "2") return `the pane in use became ${view.dataset.at}`;
if ($("#split-demo-title").textContent !== "Site visit 9" || row.getAttribute("aria-current") !== "true") return "a turn lost the selection";
if ($("#split-demo-reply").value !== "Keys on Friday") return "a turn lost what was typed";
await turn(390, 844);
if (view.dataset.size !== "compact") return `a phone's width says ${view.dataset.size}`;
if (seen() !== "2") return `on a phone the pane showing is ${seen()}, not the reader the person was in`;
if (w(panes[2]) !== 390) return `the pane is ${w(panes[2])} on a 390 screen`;
if (bars().length !== 0) return "a single pane has no divider";
if (!button("back").textContent.includes("Notes")) return `Back says ${button("back").textContent}`;
await tap(button("back"));
if (seen() !== "1") return `Back shows ${seen()}`;
if (panes[1].scrollTop !== scroll) return `the list came back at ${panes[1].scrollTop}, not ${scroll}`;
await tap(button("back"));
if (seen() !== "0") return `Back again shows ${seen()}`;
if (button("back")) return "at the first pane there is nothing to go back to";
await tap(button("next"));
await tap(button("next"));
if (seen() !== "2" || button("next")) return `Next twice shows ${seen()}`;
await turn(W, H);
if ($("#split-demo-title").textContent !== "Site visit 9") return "the selection did not last the trip";
if (panes[1].scrollTop !== scroll) return `after the trip the list is at ${panes[1].scrollTop}, not ${scroll}`;

// Now the divider, at this size. First back to a known place.
view.querySelector("[data-note='7']").click(); await wait(60);
const bar = bars()[0];
const value = () => +bar.getAttribute("aria-valuenow");
const pos = () => (bar.getBoundingClientRect().left + 22 - view.querySelector(".ui-split-view-body").getBoundingClientRect().left) / rowW() * 100;
const start = value();
if (Math.abs(pos() - start) > 1) return `the divider says ${start} and sits at ${pos()}`;
if (bar.tabIndex !== 0 || bar.getAttribute("role") !== "separator") return "the divider is not a focusable separator";

// Keys.
bar.focus();
key(bar, "ArrowRight"); await wait(40);
if (value() !== start + 4) return `ArrowRight made ${value()} from ${start}`;
key(bar, "ArrowLeft"); await wait(40);
if (value() !== start) return `ArrowLeft made ${value()}`;
bar.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", shiftKey: true, bubbles: true })); await wait(40);
if (value() !== start + 12) return `Shift+ArrowRight made ${value()}`;
const lowest = 200 / view.clientWidth * 100;
key(bar, "Home"); await wait(40);
if (Math.abs(w(big === "expanded" ? panes[0] : panes[1]) - 200) > 2) return `Home leaves the pane ${w(big === "expanded" ? panes[0] : panes[1])} wide, not the 200 least`;
key(bar, "ArrowLeft"); await wait(40);
if (Math.abs(value() - lowest) > 1) return "ArrowLeft went past the least width";
key(bar, "End"); await wait(40);
const last = big === "expanded" ? panes[1] : panes[2];
if (Math.abs(w(last) - 200) > 2) return `End leaves the next pane ${w(last)} wide, not 200`;
if (!$("#split-demo-said").textContent.startsWith("First")) return "on_resize did not reach the page";

// A real drag, short of a limit: the sizes follow and stay.
const body = view.querySelector(".ui-split-view-body");
const mid = () => { const r = bar.getBoundingClientRect(); return r.left + 22; };
key(bar, "Home"); await wait(40);
const from = mid();
await drag(bar, 60, 0, 300);
await wait(300);
if (Math.abs(mid() - from - 60) > 3) return `a drag of 60 moved it ${mid() - from}`;
if (!bar.matches(":focus")) return "the divider lost the focus to a drag";
// Up and down is the page's: the divider stays.
const still = mid();
await drag(bar, 0, 80, 200);
await wait(300);
if (Math.abs(mid() - still) > 1) return `a vertical pull moved it ${mid() - still}`;
// Under the threshold: nothing.
await drag(bar, 3, 0, 80);
await wait(100);
if (Math.abs(mid() - still) > 1) return `three px moved it ${mid() - still}`;
// A touch the system takes back returns where it was.
const p = { x: mid(), y: body.getBoundingClientRect().top + 200 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
for (let n = 1; n <= 5; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + n * 12, y: p.y }] }); await wait(16); }
await wait(80); // a touch move is handed over with the next frame
if (Math.abs(mid() - still - 60) > 3) return "the divider did not follow the finger";
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(350);
if (Math.abs(mid() - still) > 1) return `a cancelled drag left it ${mid() - still} away`;

// State changing mid-drag, even what the root's style reads: the divider stays under the finger.
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
for (let n = 1; n <= 5; n++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + n * 12, y: p.y }] }); await wait(16); }
await wait(80);
const styled = view.getAttribute("style");
$("#split-demo-tall").click(); await wait(80);
if (view.getAttribute("style") === styled) return "the height did not change, so this proves nothing";
if (Math.abs(mid() - still - 60) > 3) return `a change of state moved the divider ${mid() - still - 60} off the finger`;
view.querySelector('[data-note="3"]').click(); await wait(80);
if (Math.abs(mid() - still - 60) > 3) return `a selection mid-drag moved the divider ${mid() - still - 60} off the finger`;
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + 72, y: p.y }] });
await wait(80);
if (Math.abs(mid() - still - 72) > 3) return "the divider stopped following after a change of state";
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(350);
if (Math.abs(mid() - still - 72) > 3) return `after the drag it is ${mid() - still} away, not 72`;
$("#split-demo-tall").click(); await wait(80);
if (Math.abs(mid() - still - 72) > 3) return "a later change of state undid the drag";
view.querySelector("[data-note='7']").click(); await wait(60);
key(bar, "Home"); await wait(40);

if (big === "expanded") {
    // Past the least width: it stops, gives a little, and a hard pull puts the pane away.
    key(bar, "Home"); await wait(40);
    const at = mid();
    await drag(bar, -30, 0, 400);
    await wait(350);
    if (Math.abs(mid() - at) > 1) return `a short pull past the limit did not spring back: ${mid() - at}`;
    if (seen() !== "012") return "a short pull past the limit folded the pane";
    await drag(bar, -90, 0, 500);
    await wait(350);
    if (view.dataset.fold !== "first" || seen() !== "12") return `a hard pull: fold ${view.dataset.fold}, showing ${seen()}`;
    if (!button("hide").textContent.includes("Show Folders")) return "the bar does not offer the pane back";
    if (bar.getBoundingClientRect().left !== view.getBoundingClientRect().left) return "the divider did not wait at the edge";
    await tap(button("hide"));
    if (seen() !== "012") return `Show brought back ${seen()}`;
    // A flick.
    key(bar, "ArrowRight"); key(bar, "ArrowRight"); await wait(40);
    await drag(bar, -70, 0, 40);
    await wait(350);
    if (view.dataset.fold !== "first") return "a flick did not put the pane away";
    await tap(button("hide"));
    // Enter, on either divider.
    bar.focus();
    key(bar, "Enter"); await wait(60);
    if (seen() !== "12") return `Enter shows ${seen()}`;
    const other = bars().find((b) => b.dataset.index === "1");
    other.focus(); key(other, "Enter"); await wait(60);
    // One pane is away at a time: the second brings the first back.
    if (seen() !== "01") return `Enter on the second shows ${seen()}`;
    // The divider stays at the edge with the focus, so the keys can undo what they did.
    if (document.activeElement !== other) return "the divider lost the focus to Enter";
    if (Math.abs(other.getBoundingClientRect().right - view.getBoundingClientRect().right) > 1) return "the divider did not wait at the edge";
    if (other.getAttribute("aria-valuenow") !== "100") return `put away it says ${other.getAttribute("aria-valuenow")}`;
    key(other, "ArrowLeft"); await wait(40);
    if (other.getAttribute("aria-valuenow") !== "100") return "the arrows moved a divider with nothing beside it";
    key(other, "Enter"); await wait(60);
    if (seen() !== "012") return `Enter again shows ${seen()}`;
    key(other, "Enter"); await wait(60);
    // And a tap on it at the edge brings the pane back.
    await tap(other);
    await wait(300);
    if (seen() !== "012") return `everything back shows ${seen()}`;
}

// Two panes: Files and Preview share the same rules with one divider.
const twoPanes = [...two.querySelectorAll(".ui-split-view-panes > *")];
if (two.dataset.count !== "2") return "the second one is not two panes";
if (seen(two) !== "01") return `two panes showing ${seen(two)}`;
if (Math.abs(w(twoPanes[0]) - two.clientWidth * 0.4) > 2) return `the first of two is ${w(twoPanes[0])}, not 40%`;
if (two.querySelectorAll(".ui-split-view-divider").length !== 1) return "two panes have one divider";
two.scrollIntoView({ block: "center" });
const hideTwo = two.querySelector('[data-go="hide"]');
await tap(hideTwo);
if (seen(two) !== "1") return `Hide shows ${seen(two)}`;
await tap(hideTwo);
if (seen(two) !== "01") return `Show gives ${seen(two)}`;

// In a narrower box, with the screen the same: Split View.
const frame = view.closest(".demo-tablet");
frame.style.width = "500px";
await wait(120);
if (view.dataset.size !== "compact" || seen().length !== 1) return `in 500 px: ${view.dataset.size}, showing ${seen()}`;
frame.style.width = "";
await wait(120);
if (view.dataset.size !== big) return "the box's width came back and the size did not";
