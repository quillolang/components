// mobile
const main = $("#settings-demo");
const input = main.querySelector(".ui-setlist-input");
const rowsOf = (b = main) => [...b.querySelectorAll(".ui-setlist-row")];
const row = (k, b = main) => b.querySelector(`.ui-setlist-row[data-key="${k}"]`);
const log = () => $("[data-log]").textContent;
if (rowsOf().length !== 12) return `expected 12 rows, found ${rowsOf().length}`;
const check = (k) => row(k).querySelector("input");
// values wins over a row's own value, and a value row shows its words.
if (check("bluetooth").checked !== true) return "values did not win";
if (check("wifi").checked !== true || check("vibrate").checked !== true) return "a toggle started wrong";
if (row("roaming").querySelector(".ui-setlist-value").textContent !== "Ask first") return "the value row does not show its label";
if (check("wifi").getAttribute("role") !== "switch") return "a toggle is not a switch";
// The whole row is the press: a real tap on the row's far left.
for (const r of rowsOf()) if (r.getBoundingClientRect().height < 44) return `a row is ${r.getBoundingClientRect().height} tall`;
const on = async (el, x) => { el.scrollIntoView({ block: "center" }); const r = el.getBoundingClientRect(); await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.left + x, y: r.top + r.height / 2 }] }); await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(); };
await on(row("bluetooth"), 12);
if (check("bluetooth").checked !== false || log() !== "bluetooth=bool:false") return `a tap at the row's start gave ${log()}`;
// A switch that another row needs: off dims it, on brings it back.
if (check("wifi_ask").disabled) return "the dependent row starts disabled";
await tap(row("wifi"));
if (log() !== "wifi=bool:false") return `Wi-Fi gave ${log()}`;
if (!check("wifi_ask").disabled || !row("wifi_ask").classList.contains("ui-setlist-off")) return "the dependent row stayed live";
const before = log();
await on(row("wifi_ask"), 40);
if (log() !== before) return "a dimmed row answered";
await tap(row("wifi"));
if (check("wifi_ask").disabled) return "the dependent row stayed dimmed";
// Value rows: the phone's picker is the browser's, so it is driven through the select. The number stays a number.
const sel = row("volume").querySelector("select");
if ([...sel.options].map((o) => o.textContent).join() !== "0,25,50,75,100") return "the options are wrong";
if (sel.selectedOptions[0].textContent !== "50") return "the select does not start on the value";
sel.value = "4"; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
if (log() !== "volume=int:100") return `the volume gave ${log()}`;
if (row("volume").querySelector(".ui-setlist-value").textContent !== "100") return "the row does not show the new value";
const r2 = row("roaming").querySelector("select");
r2.value = "2"; r2.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
if (log() !== "roaming=str:on" || row("roaming").querySelector(".ui-setlist-value").textContent !== "Always") return `roaming gave ${log()}`;
// The select lies over the whole row, so the phone's picker opens from anywhere on it.
const sr = sel.getBoundingClientRect(), rr = row("volume").getBoundingClientRect();
if (Math.abs(sr.width - rr.width) > 1 || Math.abs(sr.height - rr.height) > 1) return `the select is ${sr.width}x${sr.height} on a row of ${rr.width}x${rr.height}`;
if (getComputedStyle(sel).fontSize !== "16px" || getComputedStyle(input).fontSize !== "16px") return "a field under 16 px makes iOS zoom";
// Links.
const a = row("guide");
if (a.tagName !== "A" || a.getAttribute("href") !== "#settings-sound-guide") return "the link is not a link";
await tap(row("legal"));
if ($("[data-opened]").textContent !== "legal") return "on_open did not hear the link with no address";
// Disabled and info.
if (!check("old").disabled) return "a disabled toggle can be pressed";
if (row("version").querySelector(".ui-setlist-value").textContent !== "4.2.1") return "the info row shows no value";
// Search: words, keywords, what a row is set to, group titles, accents, several words, case.
const search = async (q) => { type(input, q); await wait(60); return rowsOf().map((r) => r.querySelector(".ui-setlist-text").firstChild.textContent); };
const same = (a, b) => a.join("|") === b.join("|");
let got = await search("wifi");
if (!same(got, [])) { /* Wi-Fi has a dash: the query must match it as written. */ return `"wifi" found ${got}`; }
if (main.querySelector(".ui-setlist-none").textContent !== "No settings match “wifi”") return `the empty text is ${main.querySelector(".ui-setlist-none").textContent}`;
if (main.querySelector(".ui-setlist-found").textContent !== "0 settings") return "the status says otherwise";
got = await search("internet");
if (!same(got, ["Wi-Fi"])) return `the keyword found ${got}`;
if (main.querySelector(".ui-setlist-found").textContent !== "1 setting") return "the status is wrong for one";
got = await search("TRAVEL");
if (!same(got, ["Data roaming"])) return `a keyword text in capitals found ${got}`;
got = await search("marimba");
if (!same(got, [])) return `an option not chosen found ${got}`;
got = await search("bell");
if (!same(got, ["Ringtone"])) return `what a row is set to found ${got}`;
got = await search("sound");
if (!same(got, ["Ringtone", "Alert volume", "Vibrate on silent", "Sound guide"])) return `a group's title found ${got}`;
if ($$("#settings-demo .ui-setlist-title").map((t) => t.textContent).join() !== "Sound") return "the group's heading did not stay";
got = await search("cafe");
if (!same(got, ["Résumé when back"])) return `no accent in the query found ${got}`;
got = await search("RÉSUME");
if (!same(got, ["Résumé when back"])) return `accents in the query found ${got}`;
got = await search("  sound   vibrate ");
if (!same(got, ["Vibrate on silent"])) return `two words found ${got}`;
if (main.querySelector(".ui-setlist-group").querySelector("p.ui-setlist-note")) return "a footer stayed where it had no row";
// A toggle pressed while searching keeps its value, and the search keeps the row.
await tap(row("vibrate"));
if (log() !== "vibrate=bool:false" || check("vibrate").checked !== false) return `a toggle in search gave ${log()}`;
if (document.activeElement === input) input.blur();
got = await search("sound vibrate");
// The field stays what it is; Clear and Escape both empty it, focus is kept.
if (input.value !== "sound vibrate") return "the field lost what was typed";
await tap(main.querySelector(".ui-setlist-clear"));
if (input.value !== "" || rowsOf().length !== 12) return "Clear did not bring back all rows";
await search("zzz");
input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait(60);
if (input.value !== "" || rowsOf().length !== 12) return "Escape did not clear";
input.focus();
const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }); input.dispatchEvent(e);
if (document.activeElement === input || !e.defaultPrevented) return "Enter did not put the keyboard away";
// Sticks at the top as the list scrolls under a finger.
main.scrollTop = 0; await wait(60);
await drag(row("tone"), 0, -200, 280); await wait(250);
if (main.scrollTop < 80) return `the list scrolled ${main.scrollTop}`;
if (Math.abs(main.querySelector(".ui-setlist-search").getBoundingClientRect().top - main.getBoundingClientRect().top) > 1) return "the search did not stay at the top";
main.scrollTop = 0;
// Bad input, an odd key included.
const bad = $("#settings-bad");
const keys = rowsOf(bad).map((r) => r.dataset.key);
if (keys.join() !== "fine,constructor") return `bad rows left ${keys.join()}`;
if (row("fine", bad).querySelector(".ui-setlist-value").textContent !== "gone") return "a value not among the options does not show";
if (row("fine", bad).querySelector("select").selectedOptions[0].textContent !== "gone") return "the select does not show that value";
if (row("constructor", bad).querySelector("input").checked) return "a key named constructor reads a function";
// A phone has no side list; a wide pane has one.
const side = (b) => getComputedStyle(b.querySelector(".ui-setlist-side")).display;
if (device === "phone" && side(main) !== "none") return "a phone shows the side list";
if (device === "tablet") {
    await wait(150);
    const wide = $("#settings-wide");
    if (side(wide) !== "grid") return `a wide pane's side list is ${side(wide)}`;
    // With no search above it the side list starts with the rows, not 64 px down.
    const badBox = $("#settings-bad");
    const firstJump = badBox.querySelector(".ui-setlist-jump").getBoundingClientRect(), firstHead = badBox.querySelector(".ui-setlist-title").getBoundingClientRect();
    if (Math.abs(firstJump.top - firstHead.top) > 24) return `with no search the side list starts at ${firstJump.top}, the rows at ${firstHead.top}`;
    const jumps = [...wide.querySelectorAll(".ui-setlist-jump")];
    if (jumps.map((j) => j.textContent).join() !== "Connections,Sound,Café mode,About") return `the side list is ${jumps.map((j) => j.textContent)}`;
    await tap(jumps[2]); await wait(600);
    if (jumps[2].getAttribute("aria-current") !== "true") return "the side list does not mark where it went";
    // As far as the list goes: the group under the search, or the list at its end.
    const room = wide.querySelector(".ui-setlist-search").offsetHeight, g = wide.querySelector('[data-group="2"]');
    const want = Math.min(g.offsetTop - room, wide.scrollHeight - wide.clientHeight);
    if (Math.abs(wide.scrollTop - want) > 1) return `the list scrolled to ${wide.scrollTop}, not ${want}`;
    wide.querySelector(".ui-setlist-input").scrollIntoView({ block: "nearest" });
}
