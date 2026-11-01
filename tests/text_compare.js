const a = $("#text-compare-demo-before"), b = $("#text-compare-demo-after"), c = a.closest(".ui-text-compare");
const said = () => $("#text-compare-demo-said").textContent;
const stats = () => [...c.querySelectorAll(".ui-text-compare-stats dd")].map((d) => d.textContent).join(" ");
const del = () => [...c.querySelectorAll("del")].map((d) => d.textContent);
const ins = () => [...c.querySelectorAll("ins")].map((d) => d.textContent);
const notes = () => [...c.querySelectorAll(".ui-text-compare-note")].map((n) => n.textContent).join(" | ");
const two = async (x, y) => { type(a, x); type(b, y); await wait(); };
if (a.name !== "before" || b.name !== "after" || a.labels[0]?.textContent !== "Before" || b.labels[0]?.textContent !== "After") return "the fields' names or labels";
// The demo: brown, jumps and sunny go; red, leaps, rainy, at and all come in.
if (del().join("|") !== "brown |jumps |sunny " || ins().join("|") !== "red |leaps |rainy |at all") return `demo: ${del()} / ${ins()}`;
// "The quick brown fox" and "The slow brown dog": The and brown kept, 2 of 4 each: 2 * 2 / 8 = 50%.
await two("The quick brown fox", "The slow brown dog");
if (stats() !== "50.0% 2 2 2") return `50%: ${stats()}`;
if (said() !== "50.0% similar: 2 words added, 2 words removed.") return said();
if (del().join("|") !== "quick |fox" || ins().join("|") !== "slow |dog") return `marks: ${del()} / ${ins()}`;
// Myers's own example: the longest common subsequence of ABCABBA and CBABAC is 4 long. 2 * 4 / 13 = 61.5%.
await two("A B C A B B A", "C B A B A C");
if (stats() !== "61.5% 2 3 4") return `Myers: ${stats()}`;
// Moved words: one kept, one out, one in.
await two("alpha beta", "beta alpha");
if (stats() !== "50.0% 1 1 1") return `moved: ${stats()}`;
// A word added at the end is one change, and not a change of spacing.
await two("hello", "hello world");
if (stats() !== "66.6% 1 0 1" || ins().join() !== "world") return `added: ${stats()} / ${ins()}`;
await two("hello world", "hello");
if (stats() !== "66.6% 0 1 1" || del().join() !== "world" || c.querySelector(".ui-text-compare-panel").textContent !== "hello world") return `removed: ${stats()} / ${c.querySelector(".ui-text-compare-panel").textContent}`;
// A change of several words shows as one removal and one insertion.
await two("x a b c y", "x d e f y");
if (del().join("|") !== "a b c " || ins().join("|") !== "d e f ") return `one mark: ${del()} / ${ins()}`;
// Punctuation is its own token, so that a word stays matched.
await two("It was fine.", "It was fine!");
if (del().join() !== "." || ins().join() !== "!" || stats() !== "75.0% 0 0 3") return `punctuation: ${del()} ${ins()} ${stats()}`;
// The same: identical, then only by case, only by spacing, with the options.
await two("Same text here", "Same text here");
if (said() !== "The texts are the same." || stats() !== "100.0% 0 0 3") return `same: ${said()} ${stats()}`;
await two("Hello World", "hello world");
if (stats() !== "0.0% 2 2 0") return `case matters: ${stats()}`;
$("#text-compare-demo-case").click(); await wait();
if (said() !== "The texts are the same." || del().length) return `ignore case: ${said()}`;
$("#text-compare-demo-case").click(); await wait();
await two("a  b\nc", "a b c");
if (stats() !== "99.9% 0 0 3 2") return `spacing: ${stats()}`;
if (c.querySelectorAll(".ui-text-compare-space").length !== 4) return "spacing is not marked";
$("#text-compare-demo-space").click(); await wait();
if (said() !== "The texts are the same." || stats() !== "100.0% 0 0 3") return `ignore spacing: ${said()} ${stats()}`;
$("#text-compare-demo-space").click(); await wait();
// Leading and trailing spaces count, unless spacing is ignored.
await two("  x ", "x");
if (stats() !== "99.9% 0 0 1 2") return `ends: ${stats()}`;
// Side by side: the left has the removals, the right the insertions, each its own whole text.
await two("one two three", "one 2 three");
c.querySelector("input[type=radio][value=side]").click(); await wait();
const left = $("#text-compare-demo-left"), right = $("#text-compare-demo-right");
if (!left || !right || left.textContent !== "one two three" || right.textContent !== "one 2 three" || left.querySelector("del").textContent !== "two " || right.querySelector("ins").textContent !== "2 ") return `side: ${left?.innerHTML} / ${right?.innerHTML}`;
if (left.querySelector("ins") || right.querySelector("del")) return "each side has its own marks";
c.querySelector("input[type=radio][value=inline]").click(); await wait();
if (!$("#text-compare-demo-inline") || $("#text-compare-demo-left")) return "back to one column";
// Unicode and HTML as text.
await two("Cafés 😀 <b>été</b> Мир", "Cafés 😁 <b>été</b> Мир!");
if (del().join() !== "😀 " || !ins().includes("😁 ") || !ins().includes("!")) return `unicode: ${del()} / ${ins()}`;
if (c.querySelector(".ui-text-compare-panel b")) return "markup in a text is not text";
// One side empty, then both.
await two("just this", "");
if (stats() !== "0.0% 0 2 0" || del().join() !== "just this") return `one empty: ${stats()}`;
await two("", "just that");
if (stats() !== "0.0% 2 0 0") return `other empty: ${stats()}`;
await two("  \n", "   ");
if (said() !== "Type or paste two texts to compare them." || c.querySelector(".ui-text-compare-stats")) return said();
// Long texts: a small change in two very long ones is quick and exact.
const words = Array.from({ length: 15000 }, (_, i) => `w${i % 977}x`);
const changed = [...words]; changed[7000] = "CHANGED"; changed.splice(12000, 1);
let t0 = performance.now();
await two(words.join(" "), changed.join(" "));
let took = performance.now() - t0 - 250;
if (took > 800) return `a small change took ${took} ms`;
if (stats() !== "99.9% 1 2 14998") return `a small change: ${stats()}`;
// Two long texts with nothing in common: it stops, says so, and stays quick.
const others = Array.from({ length: 15000 }, (_, i) => `z${i}q`);
t0 = performance.now();
await two(words.join(" "), others.join(" "));
took = performance.now() - t0 - 250;
if (took > 1500) return `different texts took ${took} ms`;
if (!notes().includes("differ too much to follow past 2,000 changes")) return `no word of the stop: ${notes()}`;
if (stats() !== "0.0% 15000 15000 0") return `different: ${stats()}`;
// Few words shuffled: as hard as it gets.
const shuffled = Array.from({ length: 15000 }, (_, i) => "abcd"[(i * i + (i >> 3)) % 4]);
const shuffled2 = Array.from({ length: 15000 }, (_, i) => "abcd"[(i * 7 + (i >> 2) + (i * i >> 5)) % 4]);
t0 = performance.now();
await two(shuffled.join(" "), shuffled2.join(" "));
took = performance.now() - t0 - 250;
if (took > 2000) return `shuffled took ${took} ms`;
// Past the limit it reads the start and says so.
await two(Array(25000).fill("word").join(" "), Array(25000).fill("word").join(" "));
if (!notes().includes("Only the first 20,000 words of each text were compared.")) return `limit: ${notes()}`;
await two("", "");
// on_change.
const live = $("#text-compare-demo-live-after"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.name !== "second" || live.labels[0].textContent !== "Second draft" || !$("#text-compare-demo-live-left")) return "props";
type(live, "Draft one of the note."); await wait();
if (note() !== "on_change: 100% similar.") return note();
