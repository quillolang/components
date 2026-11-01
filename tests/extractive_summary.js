const box = $("#extractive-summary-demo-text"), c = box.closest(".ui-extractive-summary");
const said = () => $("#extractive-summary-demo-said").textContent;
const out = () => c.querySelector(".ui-extractive-summary-text")?.textContent;
const marks = () => [...c.querySelectorAll(".ui-extractive-summary-marked mark")].map((m) => m.textContent);
const slider = () => $("#extractive-summary-demo-keep");
const slide = async (n) => { const s = slider(); s.value = n; s.dispatchEvent(new Event("input", { bubbles: true })); await wait(); };
if (box.name !== "body" || box.labels[0]?.textContent !== "Text to summarise") return "the field's name or label";
if (slider().name !== "keep" || slider().max !== "7" || slider().value !== "2" || !slider().labels[0].textContent.includes("Sentences to keep: 2")) return `slider: ${slider().max} ${slider().value}`;
// Worked out by hand. Without common words:
//   bees 3 times, honey 3, the rest once. Means of each sentence's word counts:
//   S1 bees make honey hive: 2; S2 honey feeds bees winter: 2; S3 weather nice yesterday: 1;
//   S4 bees store honey cold months: 9/5 = 1.8; S5 cousin plays violin: 1.
//   Share of the best (2): 1, 1, .5, .9, .5; half the place: .5, .4, .3, .2, .1.
//   Scores: 1.5, 1.4, .8, 1.1, .6.
const bees = "Bees make honey in the hive. Honey feeds bees through the winter. The weather was nice yesterday. Bees store honey for cold months. My cousin plays the violin.";
type(box, bees); await wait();
if (out() !== "Bees make honey in the hive. Honey feeds bees through the winter.") return `top 2: ${out()}`;
await slide(3);
if (out() !== "Bees make honey in the hive. Honey feeds bees through the winter. Bees store honey for cold months.") return `top 3: ${out()}`;
await slide(4);
if (out() !== "Bees make honey in the hive. Honey feeds bees through the winter. The weather was nice yesterday. Bees store honey for cold months.") return `top 4 in order: ${out()}`;
// 6 + 6 + 5 + 6 = 23 of 28 words: 82%.
if (said() !== "Kept 4 of 5 sentences, 23 of 28 words: 82% of the text.") return said();
if (JSON.stringify(marks()) !== JSON.stringify(["Bees make honey in the hive.", "Honey feeds bees through the winter.", "The weather was nice yesterday.", "Bees store honey for cold months."])) return `marks: ${marks()}`;
await slide(5);
if (said() !== "Kept 5 of 5 sentences, 28 of 28 words: 100% of the text.") return said();
// The source is shown whole, with the marks in it.
if (c.querySelector(".ui-extractive-summary-marked").textContent !== bees) return "the source changed";
// Kept in the text's order, though the last scores most. bees 3, honey 2, the rest once:
// S1 cousin plays violin: mean 1; S2 bees make honey hive: 7/4; S3 bees eat honey bees: 9/4.
// Share of the best: .44, .78, 1; with half the place: .94, 1.11, 1.17.
await slide(2);
type(box, "My cousin plays the violin. Bees make honey in the hive. Most bees eat honey, as bees do."); await wait();
if (out() !== "Bees make honey in the hive. Most bees eat honey, as bees do.") return `order: ${out()}`;
// The slider follows the sentences there are.
type(box, "One thing is here. Two things are here."); await wait();
if (slider().max !== "2" || slider().value !== "2") return `the slider's range: ${slider().max} ${slider().value}`;
// A sentence said twice is kept once.
type(box, "Bees make honey. Bees make honey. Ants carry leaves home daily."); await wait();
if (said().startsWith("Kept 2 of 2") !== true) return `twice: ${said()}`;
if (out() !== "Bees make honey. Ants carry leaves home daily.") return `twice: ${out()}`;
// Abbreviations do not cut a sentence.
await slide(1);
type(box, "Dr. Lee paid 3.50 for e.g. a pen today. It rained."); await wait();
if (!said().includes("of 2 sentences")) return said();
// Other languages and alphabets.
type(box, "Пчёлы делают мёд. Пчёлы любят мёд. Кошки спят."); await wait();
if (out() !== "Пчёлы делают мёд.") return `Cyrillic: ${out()}`;
// Bad input.
type(box, "Only one sentence here."); await wait();
if (said() !== "There is only one sentence, so there is nothing to shorten." || slider() || out()) return said();
type(box, "!!! ... 😀 ???"); await wait();
if (said() !== "There are no sentences in this text.") return said();
type(box, "   \n "); await wait();
if (said() !== "Type or paste some text to summarise it.") return said();
// A long text stays quick and says it was cut.
const long = "Bees make honey in the hive all day. Ants carry leaves back home at night. ".repeat(1000), t0 = performance.now();
type(box, long); await wait(50);
const took = performance.now() - t0;
if (!c.textContent.includes("Only the first 50,000 characters were read.")) return "no word of the limit";
if (took > 1500) return `long text took ${took} ms`;
type(box, ""); await wait();
// on_change, from the slider.
const live = $("#extractive-summary-demo-live-keep"), lc = live.closest(".demo-stack"), note = () => lc.querySelector(".demo-note").textContent;
if ($("#extractive-summary-demo-live-text").name !== "article" || live.name !== "article_keep") return "name props";
live.value = 2; live.dispatchEvent(new Event("input", { bubbles: true })); await wait();
if (note() !== "on_change: Tea cools fast in a wide cup. Tea stays hot in a narrow cup.") return note();
