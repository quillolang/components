const box = $("#keyword-extractor-demo-text"), c = box.closest(".ui-keyword-extractor");
const tables = () => [...c.querySelectorAll(".ui-keyword-extractor-table")];
const rows = (t) => t ? [...t.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((x) => x.textContent.trim()).join(" ")) : [];
const words = () => rows(tables()[0]), phrases = () => rows(tables()[1]);
const said = () => $("#keyword-extractor-demo-said").textContent;
const notes = () => [...c.querySelectorAll(".ui-keyword-extractor-note")].map((n) => n.textContent).join(" | ");
const warns = () => [...c.querySelectorAll(".ui-keyword-extractor-warn")].map((n) => n.textContent);
const tags = () => $("#keyword-extractor-demo-tags")?.textContent;
const hidden = () => c.querySelector("input[type=hidden]");
const lang = $("#keyword-extractor-demo-language");
const pick = async (v) => { lang.value = v; lang.dispatchEvent(new Event("change", { bubbles: true })); await wait(); };
if (box.name !== "body" || hidden().name !== "tags" || box.labels[0]?.textContent !== "Text to analyse" || lang.labels[0]?.textContent !== "Language") return "the fields' names or labels";
// The demo, counted by hand: 43 words; cold 4 (9.3%), brew, coffee and beans 3 (7.0%), matter 2 (4.7%).
if (said() !== "43 words, 6 keywords shown.") return `demo: ${said()}`;
if (JSON.stringify(words().slice(0, 5)) !== JSON.stringify(["cold 4 9.3%", "brew 3 7.0%", "coffee 3 7.0%", "beans 3 7.0%", "matter 2 4.7%"])) return `words: ${words()}`;
// A phrase counts both its words: 3 * 2 / 43 = 14.0%. "matter, and" and "beans. Grind" are no phrases.
if (JSON.stringify(phrases()) !== JSON.stringify(["cold brew 3 14.0%", "beans matter 2 9.3%"])) return `phrases: ${phrases()}`;
if (!notes().includes("Common words of English left out (worked out from the text).")) return notes();
if (warns().length !== 5 || warns()[0] !== `"cold" is 9.3% of the text, over the 3% that reads as keyword stuffing.`) return `warnings: ${warns()}`;
if (!c.querySelector("tr.ui-keyword-extractor-over")) return "a stuffed word's row is not marked";
if (tags() !== "cold, brew, coffee, beans, matter, made, cold brew, beans matter" || hidden().value !== tags()) return `tags: ${tags()}`;
// Unticking leaves a keyword out of the tags; ticking brings it back in its place.
const tick = (t) => c.querySelector(`input[aria-label="Use ${t} as a tag"]`);
tick("made").click(); await wait();
if (tags() !== "cold, brew, coffee, beans, matter, cold brew, beans matter" || hidden().value !== tags()) return `untick: ${tags()}`;
tick("made").click(); await wait();
if (!tags().includes("matter, made, cold")) return `tick: ${tags()}`;
// Copy gives the clipboard the tags.
const clip = navigator.clipboard; let copied = null;
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (s) => { copied = s; return Promise.resolve(); } } });
c.querySelector(".ui-copy-btn").click(); await wait(100);
Object.defineProperty(navigator, "clipboard", { configurable: true, value: clip });
if (copied !== tags()) return `copied: ${copied}`;
// Stuffing only past the limit: 3 in 100 is 3.0%, not over; 3 in 99 is 3.03%, shown as 3.0%.
const filler = (n) => Array.from({ length: n }, (_, i) => `w${i}x`).join(" ");
type(box, `apple apple apple ${filler(97)}`); await wait();
if (warns().length) return `3 in 100: ${warns()}`;
type(box, `apple apple apple ${filler(96)}`); await wait();
if (warns().length !== 1 || !warns()[0].startsWith(`"apple" is 3.0%`)) return `3 in 99: ${warns()}`;
// A short text is not warned about, and neither is a word said twice in 30.
type(box, "apple apple apple banana"); await wait();
if (warns().length) return `a short text: ${warns()}`;
if (words()[0] !== "apple 3 75.0%") return `short: ${words()}`;
type(box, `apple apple ${filler(28)}`); await wait();
if (warns().length) return `twice in 30: ${warns()}`;
// Apostrophes: curly and straight are one word, the possessive goes, and a contraction is a common word.
type(box, "The dog’s bowl and the dog's lead. It's the dogs' day, and don't we know it."); await wait();
if (words()[0] !== "dog 2 12.5%") return `apostrophes: ${words()}`;
if (words().some((w) => /^(it's|don't|it|the)\b/.test(w))) return `common words kept: ${words()}`;
// Names that are JavaScript's own are words like any other.
type(box, "the constructor and the constructor call __proto__ toString toString hasOwnProperty valueOf prototype prototype prototype"); await wait();
if (words()[0] !== "prototype 3 21.4%" || !words().includes("constructor 2 14.3%") || !words().includes("tostring 2 14.3%")) return `JavaScript's names: ${words()}`;
// Each language's common words.
type(box, "El gato de la casa y el gato de la calle son los gatos de la ciudad."); await wait();
if (!notes().includes("Common words of Spanish") || words()[0] !== "gato 2 11.8%" || words().some((w) => /^(el|de|la|y|son|los)\b/.test(w))) return `Spanish: ${notes()} ${words()}`;
type(box, "L'homme et l’homme de l'école: la maison de l'homme."); await wait();
if (!notes().includes("Common words of French") || words()[0] !== "homme 3 33.3%" || !words().includes("école 1 11.1%")) return `French: ${notes()} ${words()}`;
type(box, "Der Hund und die Katze sind in dem Haus, und der Hund schläft."); await wait();
if (!notes().includes("Common words of German") || words()[0] !== "hund 2 15.4%") return `German: ${notes()} ${words()}`;
// A language picked by hand, and None.
await pick("en");
if (!notes().includes("Common words of English left out.") || notes().includes("worked out")) return `picked: ${notes()}`;
if (!words().includes("der 2 15.4%")) return `German read as English: ${words()}`;
await pick("none");
type(box, "the cat and the dog"); await wait();
if (!notes().startsWith("No words left out.") || words()[0] !== "the 2 40.0%") return `none: ${notes()} ${words()}`;
await pick("auto");
// Any alphabet.
type(box, "Москва город. Москва столица. Кириллица."); await wait();
if (words()[0] !== "москва 2 40.0%" || !notes().includes("No language recognised")) return `Cyrillic: ${words()} ${notes()}`;
type(box, "東京 東京"); await wait();
if (words()[0] !== "東 2 50.0%" || words()[1] !== "京 2 50.0%" || phrases()[0] !== "東京 2 100.0%") return `Japanese: ${words()} / ${phrases()}`;
// A phrase does not run across punctuation; numbers are not keywords.
type(box, "red apple, red: apple. red, apple 2026 2026 3.14 3.14 x x"); await wait();
if (JSON.stringify(words()) !== JSON.stringify(["red 3 25.0%", "apple 3 25.0%"]) || tables()[1]) return `punctuation: ${words()} / ${phrases()}`;
if (!notes().includes("No two-word phrase comes twice.")) return notes();
// Bad input.
type(box, "the and of it"); await wait();
if (said() !== "4 words, all of them common words or numbers, so no keywords." || tables().length || hidden().value !== "") return `common words: ${said()}`;
type(box, "!!! ... 😀"); await wait();
if (said() !== "There are no words in this text.") return said();
type(box, "  \n "); await wait();
if (said() !== "Type or paste some text to find its keywords." || c.querySelector(".ui-keyword-extractor-tags")) return said();
// A long text with many different words stays quick and says it was cut.
const long = Array.from({ length: 30000 }, (_, i) => `word${i}x`).join(" "), t0 = performance.now();
type(box, long); await wait(50);
const took = performance.now() - t0;
if (!notes().includes("Only the first 100,000 characters were read.")) return `long: ${notes()}`;
if (took > 1500) return `long text took ${took} ms`;
type(box, ""); await wait();
// on_change.
const live = $("#keyword-extractor-demo-live-text"), lc = live.closest(".ui-keyword-extractor"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (lc.querySelector("input[type=hidden]").name !== "post_tags") return "tags_name";
if (lc.querySelectorAll("tbody tr").length !== 3) return "top";
lc.querySelector("tbody input").click(); await wait();
if (note() !== "on_change: lait, matin") return note();
