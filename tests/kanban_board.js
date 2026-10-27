const board = $(".ui-kb");
const cols = () => [...board.querySelectorAll(".ui-kb-col")];
const cards = (c) => [...cols()[c].querySelectorAll(".ui-kb-card")].map((x) => x.querySelector(".ui-kb-card-title").textContent);
const card = (t) => [...board.querySelectorAll(".ui-kb-card")].find((x) => x.querySelector(".ui-kb-card-title").textContent === t);
const note = () => board.closest(".demo-stack").querySelector(".demo-note").textContent;
const live = () => board.querySelector("[aria-live]").textContent;
if (cols().length !== 4 || cards(0).length !== 3) return "the board does not show its columns and cards";
if (!cols()[3].textContent.includes("No cards")) return "an empty column does not say so";
if (cols()[1].querySelector(".ui-kb-count").textContent.replace(/\s+/g, " ").trim() !== "2 / 2 cards") return `the limit count: ${cols()[1].querySelector(".ui-kb-count").textContent}`;
const c1 = card("Export invoices as CSV");
if (c1.tabIndex !== 0 || !c1.getAttribute("aria-describedby") || !document.getElementById(c1.getAttribute("aria-describedby")).textContent.includes("Space")) return "a card is not focusable or has no instructions";
// keyboard navigation without carrying
c1.focus(); key(c1, "ArrowDown"); await wait();
if (document.activeElement !== card("Dark mode for the dashboard")) return "ArrowDown does not go to the next card";
key(document.activeElement, "ArrowRight"); await wait();
if (document.activeElement !== card("Upgrade to Postgres 17")) return "ArrowRight does not go to the next column";
// keyboard carry: pick up "Dark mode", move right twice, up, drop
const dm = card("Dark mode for the dashboard"); dm.focus();
key(dm, " "); await wait();
if (!card("Dark mode for the dashboard").classList.contains("ui-kb-lifted") || !live().includes("picked up")) return "Space does not pick up";
key(document.activeElement, "ArrowRight"); await wait();
if (cards(1).join("|") !== "Search across projects|Dark mode for the dashboard|Upgrade to Postgres 17") return `→ while carrying: ${cards(1)}`;
if (document.activeElement !== card("Dark mode for the dashboard")) return "the carried card loses the focus moving to another column";
if (!card("Dark mode for the dashboard").classList.contains("ui-kb-lifted")) return "the card is dropped when it changes column";
if (!live().includes("In progress, position 2 of 3")) return `the move is not announced: ${live()}`;
if (!cols()[1].classList.contains("ui-kb-over")) return "a column over its limit is not marked";
key(document.activeElement, "ArrowUp"); await wait();
if (cards(1)[0] !== "Dark mode for the dashboard") return `↑ while carrying: ${cards(1)}`;
if (note() !== "Backlog: 3 · In progress: 2 · Review: 1 · Done: 0") return "on_change was called before the card was put down";
key(document.activeElement, "Enter"); await wait();
if (card("Dark mode for the dashboard").classList.contains("ui-kb-lifted")) return "Enter does not put it down";
if (note() !== "Backlog: 2 · In progress: 3 · Review: 1 · Done: 0") return `on_change after the drop: ${note()}`;
// Escape puts it back
const rv = card("Keyboard shortcuts help"); rv.focus();
key(rv, " "); await wait(); key(document.activeElement, "ArrowRight"); await wait();
if (cards(3).join() !== "Keyboard shortcuts help") return "→ into an empty column";
key(document.activeElement, "Escape"); await wait();
if (cards(2).join() !== "Keyboard shortcuts help" || cards(3).length !== 0) return "Escape does not put it back";
if (document.activeElement !== card("Keyboard shortcuts help")) return "Escape loses the focus";
// buttons
const move = card("Rate-limit the login form").querySelector('button[aria-label="Move Rate-limit the login form to In progress"]');
if (!move) return "the card's move button is missing or unnamed";
move.click(); await wait();
if (cards(1).at(-1) !== "Rate-limit the login form") return `the move button: ${cards(1)}`;
// drag and drop: drag "Export invoices" before "Keyboard shortcuts help"
const src = card("Export invoices as CSV"), dst = card("Keyboard shortcuts help");
const dt = new DataTransfer();
src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt })); await wait(50);
if (dt.getData("text/plain") !== "c1") return "dragstart does not set the data";
const r = dst.getBoundingClientRect();
dst.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 10, clientY: r.top + 2 })); await wait(50);
if (!card("Keyboard shortcuts help").classList.contains("ui-kb-before")) return "dragging over a card does not show where it goes";
card("Keyboard shortcuts help").dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt })); await wait();
src.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt })); await wait();
if (cards(2).join("|") !== "Export invoices as CSV|Keyboard shortcuts help") return `drop before a card: ${cards(2)}`;
// drag into the empty end of a column
const done = cols()[3].querySelector(".ui-kb-list");
const dt2 = new DataTransfer();
card("Search across projects").dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt2 })); await wait(50);
done.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt2 })); await wait(50);
done.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt2 })); await wait();
if (cards(3).join() !== "Search across projects") return `drop into an empty column: ${cards(3)}`;
if (!note().endsWith("Done: 1")) return `on_change after a drag: ${note()}`;
