// mobile
const box = $("#contacts-demo");
const input = box.querySelector(".ui-contlist-input");
const names = (b = box) => [...b.querySelectorAll(".ui-contlist-name")].map((n) => n.textContent);
const letters = (b = box) => [...b.querySelectorAll(".ui-contlist-letter")].map((n) => n.textContent);
const same = (a, b) => a.join("|") === b.join("|");
// Sorted by the folded name, whatever its case or accent, with # last.
const order = ["Ada Lovelace", "Alan Turing", "edsger dijkstra", "Émile Borel", "Grace Hopper", "Katherine Johnson", "Linus Pauling", "Night Pharmacy", "Niklaus Wirth", "Ørsted Hans", "Radia Perlman", "Yukihiro Matsumoto", "Żaneta Nowak", "007 Bond", "李雷"];
if (!same(names(), order)) return `the order is ${names().join(", ")}`;
if (!same(letters(), ["A", "E", "G", "K", "L", "N", "O", "R", "Y", "Z", "#"])) return `the letters are ${letters()}`;
// Avatars come from initials, with one word giving two letters and a name in other scripts kept.
const initials = [...box.querySelectorAll(".ui-avatar")].map((a) => a.textContent);
if (initials[0] !== "AL" || initials[3] !== "ÉB" || initials[7] !== "NP" || initials[14] !== "李雷") return `initials are ${initials}`;
const rowOf = (n, b = box) => [...b.querySelectorAll(".ui-contlist-row")].find((r) => r.querySelector(".ui-contlist-name").textContent === n);
// Actions: real links, in the form the phone takes, 44 px, one row with no number has none.
const acts = (r) => [...r.querySelectorAll(".ui-contlist-act")];
const grace = acts(rowOf("Grace Hopper"));
if (grace.length !== 2) return `Grace has ${grace.length} actions`;
if (grace[1].getAttribute("href") !== "tel:+12125550147" || grace[0].getAttribute("href") !== "sms:+12125550147") return `Grace's links are ${grace.map((a) => a.getAttribute("href"))}`;
if (acts(rowOf("edsger dijkstra"))[1].getAttribute("href") !== "tel:0205550123") return "a local number keeps no punctuation";
if (grace[1].getAttribute("aria-label") !== "Call Grace Hopper" || grace[0].getAttribute("aria-label") !== "Message Grace Hopper") return "the actions are not named";
if (acts(rowOf("Linus Pauling")).length !== 0) return "a person with no number has actions";
for (const a of grace) { const r = a.getBoundingClientRect(); if (r.width < 44 || r.height < 44) return `an action is ${r.width}x${r.height}`; }
// Tapping a row, and the two actions do not tap the row.
await tap(rowOf("Alan Turing").querySelector(".ui-contlist-who"));
if ($("[data-picked]").textContent !== "Alan Turing") return `a tap gave ${$("[data-picked]").textContent}`;
const stop = (e) => { if (e.target.closest("a[href^='tel:'], a[href^='sms:']")) e.preventDefault(); };
document.addEventListener("click", stop, true);
const clicks = [];
const seen = (e) => clicks.push(e.target.closest("a")?.getAttribute("aria-label"));
box.addEventListener("click", seen);
await tap(acts(rowOf("Ada Lovelace"))[1]);
if ($("[data-picked]").textContent !== "Alan Turing" || clicks.join() !== "Call Ada Lovelace") return `Call did ${clicks}`;
box.removeEventListener("click", seen);
document.removeEventListener("click", stop, true);
// The app: a tel: link goes nowhere there, so the number goes to the share sheet, and it says so.
const shared = [];
window.quilloNative = { share: (t) => { shared.push(t); } };
await tap(acts(rowOf("Alan Turing"))[1]);
await tap(acts(rowOf("Alan Turing"))[0]);
delete window.quilloNative;
if (shared.join() !== "+44 20 7946 0954,+44 20 7946 0954") return `the app shared ${shared}`;
if (box.querySelector(".ui-contlist-note").textContent !== "This app cannot send a message: +44 20 7946 0954 is in the share sheet.") return `the note says ${box.querySelector(".ui-contlist-note").textContent}`;
// Search: known answers.
const find = async (q) => { type(input, q); await wait(40); return names(); };
let got = await find("ada");
if (!same(got, ["Ada Lovelace"])) return `"ada" found ${got}`;
if (box.querySelector(".ui-contlist-found").textContent !== "1 person") return "the status is wrong for one";
got = await find("EMILE");
if (!same(got, ["Émile Borel"])) return `no accent found ${got}`;
got = await find("sorbonne");
if (!same(got, ["Émile Borel"])) return `the organisation found ${got}`;
got = await find("a l");
if (!same(got, ["Ada Lovelace", "Alan Turing", "Linus Pauling", "Niklaus Wirth", "Radia Perlman"])) return `two words found ${got}`;
got = await find("555 0123");
if (!same(got, ["edsger dijkstra"])) return `a spaced number found ${got}`;
got = await find("(020) 555-01");
if (!same(got, ["edsger dijkstra"])) return `a number as written found ${got}`;
got = await find("+1 646");
if (!same(got, ["Grace Hopper"])) return `a second number found ${got}`;
got = await find("0800555");
if (!same(got, ["Night Pharmacy"])) return `digits with no spaces found ${got}`;
// 007 is in a name, and in a number: the one person has both.
got = await find("007");
if (!same(got, ["007 Bond"])) return `"007" found ${got}`;
got = await find("李");
if (!same(got, ["李雷"])) return `Chinese found ${got}`;
got = await find("zzzz");
if (got.length !== 0 || box.querySelector(".ui-contlist-none").textContent !== "No one matches “zzzz”") return "nothing found says otherwise";
if (box.querySelector(".ui-contlist-found").textContent !== "0 people") return "the count is wrong for none";
// Bad text: what would break a pattern.
got = await find("(((");
if (got.length !== 0) return `punctuation found ${got}`;
await tap(box.querySelector(".ui-contlist-clear"));
if (input.value !== "" || names().length !== 15) return "Clear did not bring back everyone";
type(input, "ada"); await wait(40);
input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await wait(40);
if (input.value !== "") return "Escape did not clear";
input.focus();
const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }); input.dispatchEvent(e);
if (!e.defaultPrevented || document.activeElement === input) return "Enter did not put the keyboard away";
// Sticky: the letter stands under the search as the list goes by, under a real finger.
box.scrollTop = 0; await wait(40);
await drag(rowOf("Grace Hopper"), 0, -300, 280); await wait(250);
if (box.scrollTop < 100) return `the list scrolled ${box.scrollTop}`;
const bar = box.querySelector(".ui-contlist-search").getBoundingClientRect();
const heads = [...box.querySelectorAll(".ui-contlist-letter")].filter((h) => { const r = h.getBoundingClientRect(); return Math.abs(r.top - bar.bottom) < 1.5; });
if (heads.length < 1) return "no letter sticks under the search";
if (Math.abs(bar.top - box.getBoundingClientRect().top) > 1) return "the search did not stay at the top";
box.scrollTop = 0;
// By last name, and callbacks in place of links.
const last = $("#contacts-last");
if (!same(names(last), ["Grace Hopper", "Ada Lovelace", "Plato"])) return `by last name: ${names(last)}`;
if (!same(letters(last), ["H", "L", "P"])) return `the last-name letters are ${letters(last)}`;
last.scrollIntoView({ block: "center" });
await wait(100);
{ const a = acts(rowOf("Ada Lovelace", last))[1], r = a.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  if (!a.contains(hit)) return `the call button at ${r.top} is under ${hit?.className}`; }
await tap(acts(rowOf("Ada Lovelace", last))[1]);
if ($("[data-called]").textContent !== "Ada Lovelace") return `on_call gave ${$("[data-called]").textContent}`;
await tap(acts(rowOf("Ada Lovelace", last))[0]);
if ($("[data-called]").textContent !== "Ada Lovelace by message") return "on_message did not hear";
if (acts(rowOf("Grace Hopper", last))[1].getAttribute("href") !== "tel:12") return "a number with no + is wrong";
if (last.querySelector("button.ui-contlist-who")) return "a row with no on_select is pressable";
// Two thousand people: the limit, then Show all; and a search that stays quick.
const many = $("#contacts-many");
if (many.querySelectorAll(".ui-contlist-row").length !== 120) return `the limit shows ${many.querySelectorAll(".ui-contlist-row").length}`;
const mi = many.querySelector(".ui-contlist-input");
let t0 = performance.now();
type(mi, "ana abbott");
await new Promise(requestAnimationFrame);
let took = performance.now() - t0;
if (took > 600) return `a search of 2000 took ${took} ms`;
const hits = many.querySelector(".ui-contlist-found").textContent;
// Ana Abbott is every 400th, 5 of them, and Hana Abbott (with "ana" in it) 5 more.
if (hits !== "10 people") return `the search of 2000 found ${hits}`;
type(mi, "+1 555 2999"); await wait(60);
// Person 1999: first name 1999 % 20 = 19, Tara; last name (13993 + 99) % 20 = 12, Moss.
if (names(many).join() !== "Tara Moss") return `a number among 2000 found ${names(many)}`;
type(mi, ""); await wait(60);
const all = many.querySelector(".ui-contlist-all");
if (all.textContent !== "Show all 2000") return `the button says ${all.textContent}`;
await tap(all); await wait(400);
if (many.querySelectorAll(".ui-contlist-row").length !== 2000) return "Show all did not show all";
// Bad input.
if (!same(names($("#contacts-bad")), ["No name", "Twin", "Twin"])) return `bad people gave ${names($("#contacts-bad"))}`;
if ($("#contacts-empty .ui-contlist-none").textContent !== "Nobody yet") return "the empty text is wrong";
// One column on a phone, two in a wide pane.
const cols = () => getComputedStyle(box.querySelector(".ui-contlist-rows")).gridTemplateColumns.split(" ").length;
if (device === "phone" && getComputedStyle(box.querySelector(".ui-contlist-rows")).display !== "block") return "a phone has columns";
if (device === "tablet") {
    await wait(200);
    if (cols() !== 2) return `a wide pane has ${cols()} columns`;
}
