const list = $("#sortable-list-demo-plain");
const labels = () => [...list.querySelectorAll(".ui-sortable-list-item .ui-sortable-list-text > span:first-child")].map((s) => s.textContent);
const item = (t) => [...list.querySelectorAll(".ui-sortable-list-item")].find((li) => li.querySelector(".ui-sortable-list-text span").textContent === t);
const wrap = list.closest(".ui-sortable-list");
const posted = () => [...wrap.querySelectorAll("input[type=hidden][name=priorities]")].map((i) => i.value).join();
const live = () => wrap.querySelector("[aria-live]").textContent;
if (labels().join() !== "Price,Speed,Support,Design" || posted() !== "Price,Speed,Support,Design") return `the start: ${labels()} / ${posted()}`;
if (document.getElementById(list.getAttribute("aria-labelledby"))?.textContent !== "Rank what matters most") return "the list is not named by its label";
if (!document.getElementById(list.getAttribute("aria-describedby"))?.textContent.includes("Space")) return "the list has no instructions";
const first = item("Price");
if (first.tabIndex !== 0 || first.getAttribute("draggable") !== "true" || first.querySelector(".ui-sortable-list-num").textContent !== "1") return "an item is not focusable, draggable and numbered";
// arrows move the focus without carrying
first.focus(); key(first, "ArrowDown"); await wait(80);
if (document.activeElement !== item("Speed")) return "ArrowDown does not move the focus";
// pick up Speed, move it down twice, put it down
key(item("Speed"), " "); await wait();
if (!item("Speed").classList.contains("ui-sortable-list-lifted") || !live().includes("picked up, position 2 of 4")) return `Space does not pick up: ${live()}`;
key(document.activeElement, "ArrowDown"); await wait(80); key(document.activeElement, "ArrowDown"); await wait(80);
if (labels().join() !== "Price,Support,Design,Speed") return `carrying down: ${labels()}`;
if (document.activeElement !== item("Speed")) return "the carried item loses the focus";
if (posted() !== "Price,Support,Design,Speed") return "the hidden inputs do not follow";
key(document.activeElement, "Enter"); await wait();
if (item("Speed").classList.contains("ui-sortable-list-lifted") || !live().includes("moved to position 4 of 4")) return `Enter does not put it down: ${live()}`;
// Escape puts back
item("Price").focus(); key(item("Price"), " "); await wait(); key(document.activeElement, "ArrowDown"); await wait(80);
key(document.activeElement, "Escape"); await wait(80);
if (labels().join() !== "Price,Support,Design,Speed" || !live().includes("put back")) return `Escape does not put back: ${labels()}`;
// Alt+ArrowUp moves at once
item("Design").focus();
item("Design").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", altKey: true, bubbles: true, cancelable: true })); await wait(80);
if (labels().join() !== "Price,Design,Support,Speed") return `Alt+ArrowUp: ${labels()}`;
// drag Price below Speed
const dt = new DataTransfer();
item("Price").dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt })); await wait(50);
const r = item("Speed").getBoundingClientRect();
item("Speed").dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 10, clientY: r.bottom - 2 })); await wait(50);
if (!item("Speed").classList.contains("ui-sortable-list-after")) return "dragging over the lower half does not show where it goes";
item("Speed").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })); await wait();
item("Price").dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt })); await wait();
if (labels().join() !== "Design,Support,Speed,Price") return `drop after the last: ${labels()}`;
// on_change
const l2 = $("#sortable-list-demo-live");
const ship = [...l2.querySelectorAll(".ui-sortable-list-item")].find((li) => li.dataset.value === "ship");
if (l2.querySelector(".ui-sortable-list-num")) return "numbered={false} still numbers";
ship.focus(); key(ship, " "); await wait(); key(document.activeElement, "Home"); await wait(80);
if ($(".demo-note").textContent.trim() !== "Order: write → review → ship") return "on_change was called before the item was put down";
key(document.activeElement, " "); await wait();
if ($(".demo-note").textContent.trim() !== "Order: ship → write → review") return `on_change after Home and drop: ${$(".demo-note").textContent}`;
