const first = $("#headline-analyzer-demo-0"), c = first.closest(".ui-headline-analyzer");
const said = () => $("#headline-analyzer-demo-said").textContent;
const cards = () => [...c.querySelectorAll(".ui-headline-analyzer-card")];
const score = (k) => k.querySelector(".ui-headline-analyzer-score").textContent;
const grade = (k) => k.querySelector(".ui-headline-analyzer-grade").textContent;
const points = (k) => [...k.querySelectorAll(".ui-headline-analyzer-checks b")].map((b) => b.textContent).join(" ");
const views = (k) => [...k.querySelectorAll(".ui-headline-analyzer-view")].map((v) => [...v.querySelectorAll(".ui-headline-analyzer-cutoff")].map((s) => s.textContent).join(" / "));
const tags = (k) => [...k.querySelectorAll(".ui-headline-analyzer-view small")].map((s) => s.textContent);
const inputs = () => [...c.querySelectorAll(".ui-headline-analyzer-entry input")];
const addBtn = () => c.querySelector(".ui-headline-analyzer-add");
if (first.name !== "headline" || first.labels[0]?.textContent !== "Headline 1") return "the field's name or label";
// Three variants, side by side. By hand: 8 words in 45 characters 30; 1 common of 8 is an eighth, 10; a number 10; power words 20; no weak 15; shape 5.
if (cards().length !== 3) return `cards: ${cards().length}`;
if (score(cards()[0]) !== "90" || grade(cards()[0]) !== "Strong" || points(cards()[0]) !== "30/30 10/20 10/10 20/20 15/15 5/5") return `first: ${score(cards()[0])} ${points(cards()[0])}`;
// 7 words 30; 3 common of 7, 20; no number; no power word; three weak words, 0; shape 5.
if (score(cards()[1]) !== "55" || grade(cards()[1]) !== "Okay" || points(cards()[1]) !== "30/30 20/20 0/10 0/20 0/15 5/5") return `second: ${score(cards()[1])} ${points(cards()[1])}`;
if (!cards()[1].textContent.includes("Weak words: some, things, might")) return "the weak words are not named";
// 19 words in 110 characters: no length points.
if (score(cards()[2]) !== "60" || points(cards()[2]) !== "0/30 20/20 0/10 20/20 15/15 5/5") return `third: ${score(cards()[2])} ${points(cards()[2])}`;
if (said() !== "Compared 3 headlines. The best scores 90.") return said();
if (cards().map((k) => k.querySelector(".ui-headline-analyzer-flag")?.textContent ?? "").join() !== "Best,,") return "the best is not marked";
// Where it is cut, from Arial's widths: 1,003 pixels; 583 for the words before "...", and that falls after "on" and a space.
if (views(cards()[2])[0] !== "Why the City Council Finally Approved the New Bicycle Lanes on..." || !tags(cards()[2])[0].includes("cut off")) return `search: ${views(cards()[2])[0]}`;
if (views(cards()[2])[1] !== "Why the City Council Finally Approved / the New Bicycle Lanes on Main Street..." || !tags(cards()[2])[1].includes("cut off")) return `phone: ${views(cards()[2])[1]}`;
if (views(cards()[0])[0] !== "5 Simple Ways to Write Better Headlines Today" || tags(cards()[0])[0].includes("cut off")) return "a headline that fits is not cut";
if (views(cards()[0])[1] !== "5 Simple Ways to Write Better Headlines / Today") return `phone lines: ${views(cards()[0])[1]}`;
// With no space to cut at: 30 W are 566.4 pixels and "..." 16.7, 583.1 of the 600; a 31st does not fit.
type(first, "W".repeat(40)); await wait();
if (views(cards()[0])[0] !== "W".repeat(30) + "...") return `no spaces: ${views(cards()[0])[0]}`;
// Shape: shouting, a full stop, two exclamation marks.
type(first, "BREAKING NEWS TODAY"); await wait();
if (!cards()[0].textContent.includes("All capitals read as shouting.")) return "shouting";
type(first, "A calm and simple headline for you."); await wait();
if (!cards()[0].textContent.includes("A headline ends without a full stop.")) return "a full stop";
type(first, "Wow, that was simple!!"); await wait();
if (!cards()[0].textContent.includes("One exclamation mark is plenty.")) return "!!";
// A number word counts as a number.
type(first, "Three small changes for a better inbox"); await wait();
if (!cards()[0].textContent.includes("Has three.")) return `number word: ${cards()[0].textContent}`;
// Curly apostrophes and hyphens are one word: 3 words.
type(first, "Don’t over-think headlines"); await wait();
if (!cards()[0].textContent.includes("3 words: aim for 6 to 12.")) return `word shapes: ${cards()[0].textContent}`;
// Another script is judged on length and shape alone: 5 characters, 5 words is half of 30, with 5 for shape, so 20 of 35: 57.
type(first, "東京の天気"); await wait();
if (score(cards()[0]) !== "57" || points(cards()[0]) !== "15/30 5/5" || !cards()[0].textContent.includes("judged on length and shape alone")) return `Japanese: ${score(cards()[0])} ${points(cards()[0])}`;
// An emoji is one wide character and does not break anything.
type(first, "😀 Launch day is here for everyone at last"); await wait();
if (!views(cards()[0])[0].startsWith("😀 Launch")) return views(cards()[0])[0];
// Bad input: empty fields drop out; a huge text is cut to 300 characters.
type(inputs()[1], "   "); await wait();
if (cards().length !== 2) return `a blank variant: ${cards().length}`;
const t0 = performance.now();
type(first, "word ".repeat(200000)); await wait(50);
if (performance.now() - t0 > 1000) return "a huge headline hangs";
if (!cards()[0].textContent.includes("Only the first 300 characters were read.")) return "no word of the cap";
type(first, ""); await wait();
type(inputs()[2], ""); await wait();
if (said() !== "Type a headline to score it." || cards().length) return said();
// Add, by keyboard: the new field takes the focus. At six the button goes.
type(first, "One"); await wait();
addBtn().focus(); addBtn().click(); await wait();
if (inputs().length !== 4 || document.activeElement !== inputs()[3]) return `add: ${inputs().length}`;
addBtn().click(); await wait(); addBtn().click(); await wait();
if (inputs().length !== 6 || addBtn()) return `the limit: ${inputs().length}`;
// Removing keeps the others' text and hands the focus on.
type(inputs()[1], "Second"); await wait();
const removes = () => [...c.querySelectorAll(".ui-headline-analyzer-entry button")];
removes()[0].focus(); removes()[0].click(); await wait();
if (inputs().length !== 5 || inputs()[0].value !== "Second" || document.activeElement !== inputs()[0]) return `remove: ${inputs().map((i) => i.value)}`;
if (c.querySelector(`label[for="${inputs()[0].id}"]`).textContent !== "Headline 1") return "labels are not renumbered";
// on_change gives the best.
const live = $("#headline-analyzer-demo-live-0"), lc = live.closest(".demo-stack"), note = () => lc.querySelector(".demo-note").textContent;
if (live.name !== "title" || live.labels[0].textContent !== "Headline") return "name, or a lone field's label";
type(live, "5 Simple Ways to Write Better Headlines"); await wait();
if (note() !== `on_change: the best is "5 Simple Ways to Write Better Headlines".`) return note();
