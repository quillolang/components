// tablet
const W = innerWidth, H = innerHeight;
const big = W >= 960 ? 3 : 2;
const view = $(".ui-three-col"), frame = view.closest(".demo-tablet");
const col = (n) => view.querySelector(`.ui-three-col-${n}`);
const rect = (el) => el.getBoundingClientRect();
const seen = (el) => getComputedStyle(el).visibility === "visible" && rect(el).right > rect(view).left + 1 && rect(el).left < rect(view).right - 1;
const columns = () => ["side", "list", "detail"].filter((n) => seen(col(n))).join(" ");
const showing = () => col("detail").querySelector("h2").textContent;
const row = (id) => view.querySelector(`[data-item="${id}"]`);
const folder = (id) => view.querySelector(`[data-folder="${id}"]`);
const go = (name) => view.querySelector(`.ui-three-col-go-${name}`);
const on = (b) => getComputedStyle(b).display !== "none" && getComputedStyle(b).visibility === "visible";
const width = async (w) => { frame.style.width = w == null ? "" : w + "px"; await wait(120); };
const edge = async (dx, dy = 0, steps = 10, gap = 20, end = "touchEnd") => {
    const r = rect(view), p = { x: r.left + 12, y: r.top + 200 };
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
    for (let i = 1; i <= steps; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }] }); await wait(gap); }
    return end ? (await cdp("Input.dispatchTouchEvent", { type: end, touchPoints: [] }), await wait(350)) : null;
};

// As it starts: what shows at this width, with the second item open.
if (view.dataset.columns !== String(big)) return `at ${W} it has ${view.dataset.columns} columns`;
if (columns() !== (big === 3 ? "side list detail" : "list detail")) return `at ${W} the columns are ${columns()}`;
if (showing() !== "Survey dates") return `open at the start: ${showing()}`;
if (row(2).getAttribute("aria-current") !== "true") return "the open row is not marked";
if (big === 3) {
    if (Math.abs(rect(col("side")).right - rect(col("list")).left) > 1 || Math.abs(rect(col("list")).right - rect(col("detail")).left) > 1) return "the three are not side by side";
    if (on(go("folders")) || on(go("back"))) return "with all three showing nothing needs a way back";
} else {
    if (!on(go("folders"))) return "the sidebar went and left no way to it";
    if (on(go("back"))) return "the list is beside it: no Back needed";
}

// Columns go in order: the sidebar, then the list.
await width(960);
if (view.clientWidth === 960 && view.dataset.columns !== "3") return `at 960 px: ${view.dataset.columns} columns`;
await width(959);
if (view.dataset.columns !== "2" || columns() !== "list detail") return `at 959 px: ${view.dataset.columns}, ${columns()}`;
await width(600);
if (view.dataset.columns !== "2") return `at 600 px: ${view.dataset.columns}`;
await width(599);
if (view.dataset.columns !== "1" || columns() !== "detail") return `at 599 px: ${view.dataset.columns}, ${columns()}`;
if (!on(go("back")) || !go("back").textContent.includes("Inbox")) return "at one column there is no Back to Inbox";

// One column: the open item is what shows, and Back goes up a level at a time, the item staying open.
await tap(go("back"));
await wait(350);
if (columns() !== "list") return `Back shows ${columns()}`;
if (document.activeElement !== row(2)) return "Back did not return the focus to the row";
if (row(2).getAttribute("aria-current") !== "true" || showing() !== "Survey dates") return "Back lost the open item";
await tap(go("folders"));
await wait(350);
if (columns() !== "side") return `Folders shows ${columns()}`;
await tap(folder("work"));
await wait(350);
if (columns() !== "list" || !view.querySelector('[data-item="5"]')) return "picking a folder did not show its list";
if (showing() !== "Survey dates") return "a change of folder closed the open item";
if ($("#three-demo-said").textContent !== "In Work") return `on_folder: ${$("#three-demo-said").textContent}`;
await tap(row(5));
await wait(350);
if (columns() !== "detail" || showing() !== "Crew rota") return `opening shows ${columns()}, ${showing()}`;
if ($("#three-demo-said").textContent !== "Opened Crew rota") return `on_open: ${$("#three-demo-said").textContent}`;
if (document.activeElement !== col("detail").querySelector("h2")) return "the focus did not go to what opened";
if (go("back").textContent.trim().replace(/\s+/g, " ") !== "‹ Work") return `Back says ${go("back").textContent}`;

// The edge swipe: short springs back, the wrong way does nothing, cancelled springs back, long goes, a flick goes.
await edge(100);
if (view.dataset.depth !== "2") return "a short swipe went back";
if (col("detail").style.transform !== "" || rect(col("detail")).left !== rect(view).left) return `a short swipe left it at ${col("detail").style.transform}`;
await edge(10, 160);
if (view.dataset.depth !== "2") return "an upward pull from the edge went back";
await edge(200, 0, 10, 16, null);
await wait(80); // a touch move is handed over with the next frame
if (Math.abs(rect(col("detail")).left - rect(view).left - 200) > 3) return `the column did not follow the finger: ${rect(col("detail")).left - rect(view).left}`;
if (!seen(col("list"))) return "the list did not show under the finger";
// State changing mid-swipe: the column stays under the finger, the list still showing.
$("#three-demo-add").click(); await wait(80);
if (Math.abs(rect(col("detail")).left - rect(view).left - 200) > 3) return `a change of state moved the swipe: ${rect(col("detail")).left - rect(view).left}`;
if (!seen(col("list"))) return "a change of state hid the list under the finger";
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(350);
if (view.dataset.depth !== "2" || rect(col("detail")).left !== rect(view).left || columns() !== "detail") return "a cancelled swipe did not spring back";
await edge(300);
if (view.dataset.depth !== "1" || columns() !== "list") return `a long swipe: depth ${view.dataset.depth}, ${columns()}`;
if (row(5).getAttribute("aria-current") !== "true") return "the long swipe lost the open row";
await tap(row(5));
await wait(350);
await edge(60, 0, 4, 8);
if (view.dataset.depth !== "1") return "a flick did not go back";
await tap(row(5));
await wait(350);

// From the middle a swipe belongs to the column.
const mid = await (async () => { await drag(col("detail"), 200, 0, 200); await wait(300); return view.dataset.depth; })();
if (mid !== "2") return "a swipe from the middle went back";

// Escape, a real key.
const esc = async () => { await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(350); };
col("detail").querySelector("h2").focus();
await esc();
if (view.dataset.depth !== "1") return `Escape: depth ${view.dataset.depth}`;
await tap(row(5)); await wait(350);

// Back up to full width: the open item is still it, everywhere.
await width(null);
if (showing() !== "Crew rota") return "widening lost the open item";
if (view.dataset.depth !== "2") return `after widening depth is ${view.dataset.depth}`;

// The folders over the list, at two columns.
await width(700);
if (columns() !== "list detail") return `at 700 px: ${columns()}`;
await tap(go("folders"));
await wait(350);
if (!seen(col("side")) || getComputedStyle(view.querySelector(".ui-three-col-scrim")).display === "none") return "the folders did not slide over";
if (rect(col("side")).left !== rect(view).left) return "the folders stopped short";
await tap(folder("2026"));
await wait(350);
if (seen(col("side"))) return "picking a folder left them over the list";
if (!view.querySelector('[data-item="7"]')) return `a folder named by a number-like id did not open: ${col("list").textContent}`;
if (showing() !== "Crew rota") return "the folder change lost the open item";
await tap(go("folders")); await wait(350);
const scrimAt = rect(view).right - 40;
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: scrimAt, y: rect(view).top + 300 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait(400);
if (seen(col("side"))) return "a tap beside them did not close the folders";
await tap(go("folders")); await wait(350);
await drag(col("side"), -40, 0, 300); await wait(350);
if (!seen(col("side"))) return "a short swipe closed the folders";
await drag(col("side"), -200, 0, 300); await wait(350);
if (seen(col("side"))) return "a swipe left did not close the folders";
await tap(go("folders")); await wait(350);
await esc();
if (seen(col("side"))) return "Escape did not close the folders";
await width(null);

// Empty folder, as an item open elsewhere stays.
if (big === 2) { await tap(go("folders")); await wait(350); }
await tap(folder("void")); await wait(350);
if (!col("list").textContent.includes("Nothing here")) return "an empty folder says nothing";
if (showing() !== "Crew rota") return "an empty folder closed the open item";

// The keys in a list.
if (big === 2) { await tap(go("folders")); await wait(350); }
await tap(folder("inbox")); await wait(350);
const r1 = row(1); r1.focus();
key(r1, "ArrowDown"); await wait(40);
if (document.activeElement !== row(2)) return "ArrowDown did not move along the list";
const lastRow = [...col("list").querySelectorAll("[data-item]")].pop();
key(row(2), "End"); await wait(40);
if (document.activeElement !== lastRow) return "End did not go to the last row";
key(lastRow, "ArrowDown"); await wait(40);
if (document.activeElement !== lastRow) return "ArrowDown ran off the end";
key(lastRow, "Home"); await wait(40);
if (document.activeElement !== r1) return "Home did not go to the first row";
// An item with no sender or time is still a row.
if (!row(4).textContent.includes("No sender")) return "the row with little in it is not shown";

// A new message changes the list and not what is open; the open one taken away says so.
await tap(row(2));
await tap($("#three-demo-add"));
if (!row(108) || showing() !== "Survey dates") return `a new message disturbed the open item: ${showing()}`;
await tap($("#three-demo-remove"));
if (showing() !== "No longer here" || !col("detail").textContent.includes("moved or deleted")) return `the item taken away shows ${showing()}`;
if (row(2)) return "the row stayed";

// A real turn, and the width of a phone, on an open item.
await tap(row(1));
await cdp("Emulation.setDeviceMetricsOverride", { width: H, height: W, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (showing() !== "Keys for the north gate") return "a turn lost the open item";
await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (columns() !== "detail" || showing() !== "Keys for the north gate") return `on a phone: ${columns()}, ${showing()}`;
if (rect(go("back")).height < 44) return "Back is too small on a phone";
await cdp("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await wait(400);
if (showing() !== "Keys for the north gate" || view.dataset.columns !== String(big)) return "the trip lost something";
