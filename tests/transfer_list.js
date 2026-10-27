const left = $("#tl-perms-left-list"), right = $("#tl-perms-right-list");
const tl = left.closest(".ui-tl");
const labels = (l) => [...l.querySelectorAll("[role=option]")].map((o) => o.textContent.trim());
const posted = () => [...tl.querySelectorAll("input[type=hidden][name=permissions]")].map((i) => i.value).join();
if (left.getAttribute("role") !== "listbox" || left.getAttribute("aria-multiselectable") !== "true") return "the lists are not multi-select listboxes";
if (labels(right).join() !== "Read posts,Write posts,Read comments") return `chosen at first: ${labels(right)}`;
if (labels(left).length !== 9) return `available at first: ${labels(left).length}`;
if (posted() !== "posts.read,posts.write,comments.read") return `posted: ${posted()}`;
const [add, addAll, remove, removeAll] = tl.querySelectorAll(".ui-tl-moves button");
if (!add.disabled || !remove.disabled) return "move buttons are enabled with nothing selected";
// click selects, click again unselects
const opt = (l, t) => [...l.querySelectorAll("[role=option]")].find((o) => o.textContent.trim() === t);
opt(left, "Delete posts").click(); await wait();
if (opt(left, "Delete posts").getAttribute("aria-selected") !== "true" || add.disabled) return "a click does not select";
opt(left, "Invite users").click(); await wait();
if (!tl.querySelector(".ui-tl-count").textContent.includes("2 of 9 selected")) return `the count: ${tl.querySelector(".ui-tl-count").textContent}`;
add.click(); await wait();
if (posted() !== "posts.read,posts.write,posts.delete,comments.read,users.invite") return `after Add: ${posted()}`;
if (labels(left).includes("Delete posts")) return "moved options stay on the left";
if (!tl.querySelector("[aria-live]").textContent.includes("Added 2 options")) return "the move is not announced";
// keyboard: focus, arrows, shift-select, Enter
left.focus(); await wait();
const ad = () => left.getAttribute("aria-activedescendant");
if (document.getElementById(ad())?.textContent.trim() !== "View billing") return "after a move the keys are not on the option next to where it was";
key(left, "Home"); await wait();
if (document.getElementById(ad()).textContent.trim() !== labels(left)[0]) return "Home does not go to the first option";
key(left, "ArrowDown"); await wait();
if (document.getElementById(ad()).textContent.trim() !== labels(left)[1]) return "ArrowDown does not move";
key(left, " "); await wait();
if (document.getElementById(ad()).getAttribute("aria-selected") !== "true") return "Space does not select";
left.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true }));
left.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", shiftKey: true, bubbles: true })); await wait();
const selNow = [...left.querySelectorAll('[aria-selected="true"]')].map((o) => o.textContent.trim());
if (selNow.join() !== "Manage users,View billing,Change billing") return `Shift+ArrowDown selected ${selNow}`;
key(left, "Enter"); await wait();
if (labels(right).length !== 8) return `Enter moved: ${labels(right)}`;
// Ctrl+A on the right, then remove
right.focus(); right.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true, bubbles: true })); await wait();
if (right.querySelectorAll('[aria-selected="true"]').length !== 8) return "Ctrl+A did not select all";
remove.click(); await wait();
if (posted() !== "" || labels(left).length !== 12) return `Remove did not clear: ${posted()}`;
// filter + add all shown
const f = tl.querySelector("input.ui-tl-filter");
if (f.getAttribute("aria-label") !== "Filter available") return "the filter has no name";
type(f, "BILL"); await wait();
if (labels(left).join() !== "View billing,Change billing") return `filter: ${labels(left)}`;
addAll.click(); await wait();
if (posted() !== "billing.read,billing.write") return `Add all shown: ${posted()}`;
type(f, "zzz"); await wait();
if (!left.textContent.includes("No matches")) return "an empty filter result does not say so";
type(f, ""); await wait();
// double click moves one
opt(right, "View billing").dispatchEvent(new MouseEvent("dblclick", { bubbles: true })); await wait();
if (posted() !== "billing.write") return `double click: ${posted()}`;
removeAll.click(); await wait();
if (posted() !== "") return "Remove all";
// on_change
const cl = $("#tl-cols-left-list");
[...cl.querySelectorAll("[role=option]")].find((o) => o.textContent.trim() === "Plan").click(); await wait();
cl.focus(); key(cl, "Enter"); await wait();
const note = cl.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "Showing: Name, Email, Plan") return `on_change: ${note}`;
if ($("#tl-cols-left-list").closest(".ui-tl").querySelector("input.ui-tl-filter")) return "search={false} still shows a filter";
