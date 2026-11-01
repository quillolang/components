// mobile
const lists = $$(".ui-grplist");
if (lists.length !== 3) return `expected 3 lists, found ${lists.length}`;
const [main, dark, bad] = lists;
const groups = [...main.querySelectorAll(".ui-grplist-group")];
if (groups.length !== 3) return `expected 3 groups, found ${groups.length}`;
if (main.getAttribute("aria-label") !== "Your account") return "the label does not reach the list";
if (groups[0].querySelector(".ui-grplist-title").textContent !== "Account") return "the first heading is wrong";
if (groups[2].querySelector(".ui-grplist-title")) return "a group with no title has a heading";
if (groups[0].querySelector(".ui-grplist-note").textContent !== "Your name shows on orders and receipts.") return "the footer is wrong";
if (groups[1].querySelector(".ui-grplist-note")) return "a group with no footer has one";
// Which rows are what.
const rows = [...main.querySelectorAll(".ui-grplist-row")];
const names = rows.map((r) => r.tagName + ":" + r.querySelector(".ui-grplist-text").firstChild.textContent);
const want = ["BUTTON:Name", "BUTTON:Email", "BUTTON:Plan", "A:What's new", "BUTTON:Version", "DIV:Old sync", "BUTTON:Sign out"];
if (names.join() !== want.join()) return `rows are ${names.join()}`;
const chev = rows.map((r) => !!r.querySelector(".ui-grplist-chevron"));
if (chev.join() !== "true,true,true,true,true,true,false") return `chevrons are ${chev.join()}`;
if (rows[5].getAttribute("aria-disabled") !== "true" || getComputedStyle(rows[5]).opacity !== "0.5") return "the disabled row is not dimmed";
if (getComputedStyle(rows[6]).color !== "rgb(198, 42, 47)") return `the danger row is ${getComputedStyle(rows[6]).color}`;
// Tap targets are whole rows.
for (const r of rows) {
    const b = r.getBoundingClientRect(), box = r.closest(".ui-grplist-rows").getBoundingClientRect();
    if (b.height < 44) return `a row is ${b.height} tall`;
    if (Math.abs(b.width - box.width) > 0.5) return `a row is ${b.width} wide in ${box.width}`;
}
// The separator starts at the text, after the icon, on all but a group's first row.
const line = (r) => getComputedStyle(r.querySelector(".ui-grplist-body")).borderTopWidth;
if (line(rows[0]) !== "0px" || line(rows[1]) !== "1px") return `separators are ${line(rows[0])} and ${line(rows[1])}`;
if (rows[1].querySelector(".ui-grplist-body").getBoundingClientRect().left <= rows[1].getBoundingClientRect().left + 16) return "the separator starts at the edge";
// A real tap anywhere on a row, on the far right of the empty part as well.
const last = () => $("[data-last]").textContent;
await tap(rows[1]);
if (last() !== "Email") return `tapping Email gave ${last()}`;
rows[6].scrollIntoView({ block: "center" });
const r6 = rows[6].getBoundingClientRect();
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r6.right - 6, y: r6.top + r6.height / 2 }] });
await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await wait();
if (last() !== "Sign out") return `tapping the far end of a row gave ${last()}`;
await tap(rows[5]);
if (last() !== "Sign out") return "a disabled row answered a tap";
// The link is a link, and its callback hears it too.
if (rows[3].getAttribute("href") !== "#grouped-list-new") return "the link lost its address";
await tap(rows[3]);
if (last() !== "What's new" || location.hash !== "#grouped-list-new") return `the link gave ${last()} and ${location.hash}`;
// Dark comes from the theme: the group is told apart from the page either way.
const bg = (e) => getComputedStyle(e).backgroundColor;
const darkPage = bg(dark), darkCard = bg(dark.querySelector(".ui-grplist-rows"));
if (darkPage === darkCard) return "in dark, a group does not stand out from the page";
if (darkPage !== "rgb(15, 14, 23)") return `the dark page is ${darkPage}`;
if (bg(main) === darkPage) return "the dark look leaked into the light list";
if (getComputedStyle(dark).color !== "rgb(236, 235, 243)") return `dark text is ${getComputedStyle(dark).color}`;
// Bad input leaves out what cannot be shown.
const badRows = [...bad.querySelectorAll(".ui-grplist-row")];
if (badRows.length !== 1 || badRows[0].textContent.trim() !== "The one good row") return `bad data gave ${badRows.length} rows`;
if (bad.querySelectorAll(".ui-grplist-group").length !== 1) return "an empty group was shown";
// Reaches the keyboard: a real <button> and link.
if (main.querySelector("button.ui-grplist-row").tabIndex !== 0) return "a row cannot be reached by keys";
// One column on a phone; in a wide pane (the gallery's own sidebar out of the way), two.
const cols = () => getComputedStyle(main.querySelector(".ui-grplist-cols")).gridTemplateColumns.split(" ").length;
if (device === "phone" && cols() !== 1) return `a phone has ${cols()} columns`;
if (device === "tablet") {
    if (rows[1].getBoundingClientRect().height > 47) return `in a wide pane the address breaks: ${rows[1].getBoundingClientRect().height}`;
    await wait(100);
    if (cols() !== 2) return `a wide pane has ${cols()} columns`;
    const [a, b] = groups.map((g) => g.getBoundingClientRect());
    if (Math.abs(a.top - b.top) > 1 || b.left <= a.right - 1) return "the groups do not stand side by side";
}
