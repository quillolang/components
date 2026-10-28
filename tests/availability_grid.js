const grid = $(".ui-availability-grid");
const note = () => grid.closest(".demo-stack").querySelector(".demo-note").textContent;
const cell = (slot) => grid.querySelector(`[data-slot="${slot}"]`);
const hidden = () => grid.querySelector("input[type=hidden][name=slots]").value;
const count = () => grid.querySelector(".ui-availability-grid-count").textContent;
if (!grid || grid.getAttribute("role") !== "group" || grid.getAttribute("aria-label") !== "When can you meet?") return "the grid is not a named group";
const heads = [...grid.querySelectorAll(".ui-availability-grid-head")].map((h) => h.textContent);
if (heads.join() !== "Mon,Tue,Wed,Thu,Fri") return `the days read ${heads}`;
const hours = [...grid.querySelectorAll(".ui-availability-grid-hour")].map((h) => h.textContent);
if (hours.length !== 8 || hours[0] !== "09:00" || hours.at(-1) !== "16:00") return `the hours read ${hours}`;
if (grid.querySelectorAll(".ui-availability-grid-cell").length !== 40) return "expected 5 × 8 cells";
if (cell("Mon-10:00").getAttribute("aria-pressed") !== "true" || cell("Mon-09:00").getAttribute("aria-pressed") !== "false") return "the starting slots are not marked";
if (cell("Mon-10:00").getAttribute("aria-label") !== "Mon 10:00") return `a cell is heard as ${cell("Mon-10:00").getAttribute("aria-label")}`;
if (hidden() !== "Mon-10:00,Mon-11:00,Wed-14:00" || count() !== "3 slots marked") return `it starts with ${hidden()} / ${count()}`;
// A click marks and unmarks.
const down = (el) => el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
const enter = (el) => el.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
const up = (el) => el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
down(cell("Tue-09:00")); up(cell("Tue-09:00")); await wait();
if (cell("Tue-09:00").getAttribute("aria-pressed") !== "true" || hidden() !== "Mon-10:00,Mon-11:00,Tue-09:00,Wed-14:00") return `a click did not mark in order: ${hidden()}`;
if (note() !== "Marked: Mon-10:00, Mon-11:00, Tue-09:00, Wed-14:00.") return `on_change did not reach the note: ${note()}`;
down(cell("Tue-09:00")); up(cell("Tue-09:00")); await wait();
if (cell("Tue-09:00").getAttribute("aria-pressed") !== "false" || count() !== "3 slots marked") return "a second click did not unmark";
// Dragging paints: from an unmarked cell, every cell entered is marked.
down(cell("Thu-13:00")); enter(cell("Thu-14:00")); enter(cell("Thu-15:00")); up(cell("Thu-15:00")); await wait();
if (["Thu-13:00", "Thu-14:00", "Thu-15:00"].some((s) => cell(s).getAttribute("aria-pressed") !== "true") || count() !== "6 slots marked") return `painting marked ${hidden()}`;
enter(cell("Thu-16:00")); await wait();
if (cell("Thu-16:00").getAttribute("aria-pressed") !== "false") return "painting went on after the pointer was let go";
// From a marked cell, dragging unmarks.
down(cell("Thu-14:00")); enter(cell("Thu-15:00")); up(cell("Thu-15:00")); await wait();
if (cell("Thu-14:00").getAttribute("aria-pressed") !== "false" || cell("Thu-15:00").getAttribute("aria-pressed") !== "false" || cell("Thu-13:00").getAttribute("aria-pressed") !== "true") return "painting from a marked cell did not unmark";
// The keyboard: arrows move, Space toggles (a click with detail 0).
cell("Fri-09:00").focus(); key(cell("Fri-09:00"), "ArrowDown"); await wait(50);
if (document.activeElement !== cell("Fri-10:00")) return `ArrowDown moved to ${document.activeElement?.dataset.slot}`;
key(document.activeElement, "ArrowLeft"); await wait(50);
if (document.activeElement !== cell("Thu-10:00")) return `ArrowLeft moved to ${document.activeElement?.dataset.slot}`;
document.activeElement.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 })); await wait();
if (cell("Thu-10:00").getAttribute("aria-pressed") !== "true") return "a keyboard click did not mark";
key(cell("Fri-09:00"), "ArrowUp"); await wait(50);
if (document.activeElement !== cell("Thu-10:00")) return `ArrowUp at the top row moved the focus to ${document.activeElement?.tagName} ${document.activeElement?.dataset?.slot} ${document.activeElement?.className}`;
// Dates as days, half-hour steps, disabled.
const dates = $("#availability-grid-demo-dates .ui-availability-grid");
const dheads = [...dates.querySelectorAll(".ui-availability-grid-head")].map((h) => h.textContent);
if (dheads.join() !== "Mon2,Tue3,Wed4") return `date columns read ${dheads}`;
if (dates.querySelectorAll(".ui-availability-grid-cell").length !== 18 || !dates.classList.contains("ui-availability-grid-half")) return "step={30} over three hours does not give 6 rows";
const dc = dates.querySelector('[data-slot="2026-11-02-09:30"]');
if (dc.getAttribute("aria-pressed") !== "true" || dc.getAttribute("aria-label") !== "Monday 2 November 09:30" || !dc.disabled) return `the date cell: ${dc.getAttribute("aria-label")}, disabled ${dc.disabled}`;
if (dates.querySelector(".ui-availability-grid-foot")) return "legend={false} still shows the key";
