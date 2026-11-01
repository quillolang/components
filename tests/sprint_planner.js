const c = $("#sprint-planner-demo-title").closest(".ui-sprint-planner");
const used = () => c.querySelector(".ui-sprint-planner-used").textContent;
const left = () => c.querySelector(".ui-sprint-planner-left").textContent;
const ids = (l) => [...c.querySelectorAll(`[data-list=${l}] [data-item]`)].map((i) => i.dataset.item).join(" ");
const why = (id) => c.querySelector(`[data-item=${id}] .ui-sprint-planner-why`)?.textContent;
const warn = () => [...c.querySelectorAll(".ui-sprint-planner-warnings li")].map((l) => l.textContent);
const note = () => c.closest(".demo-stack").querySelector(".demo-note").textContent;
const move = (id) => c.querySelector(`[data-item=${id}] button`).click();
const fit = () => c.querySelector(".ui-sprint-planner-fit").click();
// (8 + 10 + 2) days x 0.8 = 16. By priority: A 5, then B brings D first, 2.5 + 8; 15.5 used. C needs 13, E needs 3, 0.5 left.
if (used() !== "15.5 of 16 points" || left() !== "0.5 left") return `start: ${used()} ${left()}`;
if (ids("in") !== "A B D") return `in: ${ids("in")}`;
if (ids("out") !== "C G H E F I") return `out: ${ids("out")}`;
if (why("C") !== "Needs 13 points; 0.5 left.") return `C: ${why("C")}`;
if (why("E") !== "Needs 3 points; 0.5 left.") return `E: ${why("E")}`;
if (why("F") !== "Depends on Z, which is not in the backlog.") return `F: ${why("F")}`;
if (why("G") !== "In a cycle: G → H → G." && why("G") !== "In a cycle: H → G → H.") return `G: ${why("G")}`;
if (why("I") !== "Depends on H, which cannot be planned.") return `I: ${why("I")}`;
// Capacity live: Cara off 10 days takes 1.6 away, so the sprint is over without anything moving.
const off = $("#sprint-planner-demo-off-2");
type(off, "10"); await wait();
if (used() !== "15.5 of 14.4 points" || left() !== "1.1 over" || !warn().includes("The sprint is 1.1 points over capacity.")) return `live capacity: ${used()} ${left()} ${warn()}`;
// Auto-fit again: A; B with D needs 10.5 of the 9.4 left and is passed over; C 13 too; then D 2.5 and E 3 fit on their own, 3.9 left.
fit(); await wait();
if (ids("in") !== "A D E" || used() !== "10.5 of 14.4 points") return `refit: ${ids("in")} / ${used()}`;
if (why("B") !== "Needs 8 points; 3.9 left." || why("C") !== "Needs 13 points; 3.9 left.") return `the reasons are of the final plan: ${why("B")} / ${why("C")}`;
if (c.querySelector(".ui-sprint-planner-said").textContent !== "3 of 9 items fit, 10.5 of 14.4 points.") return "fit is not announced";
if (note() !== "on_change: 10.5 of 14.4 points, A D E.") return `on_change: ${note()}`;
type(off, "8"); type($("#sprint-planner-demo-off-0"), "abc"); await wait();
if (!c.querySelector(".ui-sprint-planner-team ~ [role=alert]") || $("#sprint-planner-demo-off-0").getAttribute("aria-invalid") !== "true") return "a bad day-off is not said";
if (used() !== "10.5 of 17.6 points") return `bad day off counts as 0: ${used()}`;
type($("#sprint-planner-demo-off-0"), "99"); await wait();
if ($("#sprint-planner-demo-off-0").getAttribute("aria-invalid") !== "true") return "more days off than days";
type($("#sprint-planner-demo-off-0"), "2"); await wait();
fit(); await wait();
if (ids("in") !== "A B D") return `back: ${ids("in")}`;
// By hand: D out breaks B, said at once.
move("D"); await wait();
if (warn().join() !== "B needs D, which is not in the sprint." || used() !== "13 of 16 points" || why("D") !== "Moved out by hand.") return `out by hand: ${warn()} ${used()} ${why("D")}`;
// In by hand past capacity is allowed and shown.
move("C"); await wait();
if (used() !== "26 of 16 points" || left() !== "10 over" || !c.querySelector(".ui-sprint-planner-full")) return `over by hand: ${used()}`;
if (note() !== "on_change: 26 of 16 points, A B C.") return `hand on_change: ${note()}`;
move("C"); await wait();
// A stuck item can still be moved by hand, with the warning.
move("F"); await wait();
if (!warn().includes("F needs Z, which is not in the sprint.")) return `stuck by hand: ${warn()}`;
if (c.querySelector("input[name=sprint_planned]").value !== "A,B,F") return `the form's field: ${c.querySelector("input[name=sprint_planned]").value}`;
// Dragging: into the other list.
const item = c.querySelector("[data-list=in] [data-item=A]"), to = c.querySelector("[data-list=out]");
item.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: new DataTransfer() }));
to.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true })); to.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true })); await wait();
if (ids("in").includes("A")) return `drag: ${ids("in")}`;
const b = c.querySelector("[data-list=out] [data-item=A]"), back = c.querySelector("[data-list=in]");
b.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: new DataTransfer() }));
back.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true })); await wait();
if (!ids("in").includes("A")) return "drag back";
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
