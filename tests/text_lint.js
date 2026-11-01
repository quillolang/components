const box = $("#text-lint-demo-text"), c = box.closest(".ui-text-lint");
const rows = () => [...c.querySelectorAll(".ui-text-lint-issue")];
const where = () => rows().map((r) => r.querySelector(".ui-text-lint-where").textContent);
const said = () => $("#text-lint-demo-said").textContent;
const fixBtn = (i) => rows()[i].querySelectorAll("button")[1];
const marks = (cls) => [...c.querySelectorAll(`.ui-text-lint-mark-${cls}`)].map((m) => m.textContent);
const rule = (r) => $(`#text-lint-demo-rule-${r}`);
if (box.name !== "body" || box.labels[0]?.textContent !== "Text to check") return "the field's name or label";
// The demo, worked out by hand: nine issues and every place.
if (said() !== "9 issues found.") return `demo: ${said()}`;
const want = ["Line 1, column 12: Passive voice", "Line 1, column 43: Filler words", "Line 1, column 50: Filler words", "Line 1, column 66: Repeated words",
    "Line 1, column 81: Double spaces", "Line 2, column 1: Cliches", "Line 2, column 31: Filler words", "Line 2, column 43: Cliches", "Line 2, column 66: Filler words"];
if (JSON.stringify(where()) !== JSON.stringify(want)) return `places: ${where().join(" / ")}`;
if (marks("passive").join() !== "was written" || marks("repeated").join() !== "the the" || marks("cliche").length !== 2 || marks("filler").length !== 4) return `marks: ${marks("filler")}`;
// Passive voice has no fix; it can only be shown.
if (rows()[0].querySelectorAll("button").length !== 1) return "passive voice has no fix";
// Show selects the words in the box.
rows()[0].querySelector("button").click(); await wait(50);
if (document.activeElement !== box || box.value.slice(box.selectionStart, box.selectionEnd) !== "was written") return `Show selected "${box.value.slice(box.selectionStart, box.selectionEnd)}"`;
// One fix: "the the" loses its second word, by keyboard, and the focus stays in the list.
const repeat = rows().findIndex((r) => r.textContent.includes("is repeated"));
fixBtn(repeat).focus(); fixBtn(repeat).click(); await wait();
if (!box.value.includes("clear, and the results") || box.value.includes("the the")) return `fix one: ${box.value}`;
if (said() !== `8 issues found. Fixed "the the".`) return said();
if (document.activeElement !== $("#text-lint-demo-issues")) return "the focus is lost after a fix";
// The rest of the fixes.
[...c.querySelectorAll(".ui-text-lint-bar button")][0].click(); await wait();
if (box.value !== "The report was written by the team. It is clear, and the results speak for themselves.\nIn the end, we met to think differently. The plan is simple.") return `fix all: ${box.value}`;
if (said() !== "1 issue found. Fixed 7 issues." || c.querySelector(".ui-text-lint-bar button")) return `after fix all: ${said()}`;
// A cliche with no plain word has no fix; a capital carries over.
type(box, "Only time will tell. Game changer ahead."); await wait();
if (where().length !== 2 || rows()[0].querySelectorAll("button").length !== 1 || fixBtn(1).textContent !== `Use "breakthrough"`) return `cliches: ${where()}`;
fixBtn(1).click(); await wait();
if (box.value !== "Only time will tell. Breakthrough ahead.") return box.value;
// Removing the first word of a sentence moves its capital on; and the last word of a line takes the space before it.
type(box, "Actually it works. It is good, really\nNext."); await wait();
fixBtn(0).click(); await wait();
if (box.value !== "It works. It is good, really\nNext.") return `a capital: ${box.value}`;
fixBtn(0).click(); await wait();
if (box.value !== "It works. It is good,\nNext.") return `the space before: ${JSON.stringify(box.value)}`;
// Passive: an adverb between, irregular participles, and adjectives that are not passive.
type(box, "It was quickly eaten. They were built. She is tired. I am interested. He was fed up. We ate."); await wait();
if (marks("passive").join("|") !== "was quickly eaten|were built") return `passive: ${marks("passive").join("|")}`;
// Repeated words: any alphabet, any case, over a line break; "had had" and numbers are left alone.
type(box, "Être être là. Мир мир. The\nthe end. He had had it. 5 5 ok."); await wait();
if (marks("repeated").join("|") !== "Être être|Мир мир|The\nthe") return `repeated: ${JSON.stringify(marks("repeated"))}`;
// Double spaces between words only: not the indent of a line, nor spaces at its end.
type(box, "    Indented line  \nTwo  spaces   three."); await wait();
if (marks("spaces").length !== 2 || where().join() !== "Line 2, column 4: Double spaces,Line 2, column 12: Double spaces") return `spaces: ${where()}`;
// A sentence over the limit (18 in this demo) is marked as a whole, and a word in it stays marked too.
const words19 = Array.from({ length: 19 }, (_, i) => `w${i}`).join(" ") + " very.";
type(box, words19); await wait();
if (!c.querySelector(".ui-text-lint-mark-long") || !rows().some((r) => r.textContent.includes("20 words in one sentence: the limit is 18."))) return `long: ${where()}`;
if (marks("filler").join() !== "very") return `a word in a long sentence: ${marks("filler")}`;
type(box, Array.from({ length: 18 }, (_, i) => `w${i}`).join(" ") + "."); await wait();
if (c.querySelector(".ui-text-lint-mark-long")) return "18 words is within the limit";
// Rules turn off and back on, keeping the text.
type(box, "It is very good  now."); await wait();
if (said() !== "2 issues found.") return said();
rule("filler").click(); await wait();
if (said() !== "1 issue found." || marks("filler").length) return `filler off: ${said()}`;
rule("spaces").click(); await wait();
if (said() !== "No issues found.") return `spaces off: ${said()}`;
rule("filler").click(); await wait(); rule("spaces").click(); await wait();
if (said() !== "2 issues found.") return `back on: ${said()}`;
// An emoji counts as one character in the list and two in the box.
type(box, "😀😀 go very fast"); await wait();
if (where().join() !== "Line 1, column 7: Filler words") return `emoji place: ${where()}`;
rows()[0].querySelector("button").click(); await wait(50);
if (box.value.slice(box.selectionStart, box.selectionEnd) !== "very") return `emoji select: ${box.value.slice(box.selectionStart, box.selectionEnd)}`;
// Bad input.
type(box, "   \n "); await wait();
if (said() !== "Type or paste some text to check it." || rows().length || c.querySelector(".ui-text-lint-marked")) return `blank: ${said()}`;
type(box, "<b>&amp;</b> 123 !!! "); await wait();
if (said() !== "No issues found.") return `symbols: ${said()}`;
// A long text: it stays quick, says what it checked, and caps the list.
const long = "It is very good. ".repeat(4000), t0 = performance.now();
type(box, long); await wait(50);
const took = performance.now() - t0;
if (!c.textContent.includes("Only the first 50,000 characters were checked")) return "no word of the limit";
if (rows().length !== 200 || !c.textContent.includes("more: fix these to see them")) return `list cap: ${rows().length}`;
if (took > 2000) return `long text took ${took} ms`;
type(box, ""); await wait();
// on_change, with rules from a prop.
const live = $("#text-lint-demo-live-text"), lc = live.closest(".ui-text-lint"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#text-lint-demo-live-rule-passive").checked || !$("#text-lint-demo-live-rule-filler").checked) return "the rules prop";
if (lc.querySelectorAll(".ui-text-lint-issue").length !== 2) return "the live demo starts with two";
lc.querySelector(".ui-text-lint-issue button:nth-child(2)").click(); await wait();
if (note() !== "on_change: 1 left." || live.value !== "A very short note.") return `${note()} / ${live.value}`;
