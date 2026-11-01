const box = $("#readability-meter-demo-text"), c = box.closest(".ui-readability-meter");
const ease = () => c.querySelector(".ui-readability-meter-ease")?.textContent;
const band = () => c.querySelector(".ui-readability-meter-band")?.textContent;
const grade = () => c.querySelector(".ui-readability-meter-grade")?.textContent;
const said = () => $("#readability-meter-demo-said").textContent;
const stat = (i) => c.querySelectorAll(".ui-readability-meter-stats dd")[i].textContent;
const notes = () => [...c.querySelectorAll(".ui-readability-meter-note")].map((n) => n.textContent).join(" | ");
if (box.name !== "body" || box.labels[0]?.textContent !== "Text to score") return "the field's name or label";
// The demo: five sentences, with "Dr.", "3.5" and "e.g." not ending any.
if (stat(0) !== "5") return `demo sentences: ${stat(0)}`;
if (stat(1) !== "50") return `demo words: ${stat(1)}`;
if (c.querySelectorAll(".ui-readability-meter-hardest li").length !== 2 || !c.querySelector(".ui-readability-meter-hardest li").textContent.startsWith("Dr. Lee tested")) return `hardest: ${c.querySelector(".ui-readability-meter-hardest")?.textContent}`;
// 14 words, 3 sentences, 16 syllables: 206.835 - 1.015 * 14/3 - 84.6 * 16/14 = 105.41; grade -0.28.
type(box, "I like red apples. You like green pears. We all eat fruit every day."); await wait();
if (ease() !== "105.4" || band() !== "Very easy" || grade() !== "below grade 1") return `three sentences: ${ease()} ${band()} ${grade()}`;
if (stat(0) !== "3" || stat(1) !== "14" || stat(2) !== "16") return `counts: ${stat(0)} ${stat(1)} ${stat(2)}`;
// 14 words at 240 a minute is 3.5 s, so 4 s.
if (stat(3) !== "4 s") return `reading time: ${stat(3)}`;
if (!notes().includes("rough guide")) return `a short text says so: ${notes()}`;
// 6 words, 1 sentence, 6 syllables: 116.145.
type(box, "The cat sat on the mat."); await wait();
if (ease() !== "116.1" || !said().startsWith("Reading ease 116.1, very easy")) return `the cat: ${ease()} / ${said()}`;
// A hard sentence: long words, 9 words, 22 syllables. 206.835 - 1.015 * 9 - 84.6 * 22/9 = -3.1, grade 19.0.
type(box, "Institutional bureaucracy systematically undermines organisational effectiveness across international communities."); await wait();
if (band() !== "Very difficult" || !c.querySelector(".ui-readability-meter-hard")) return `hard text: ${ease()} ${band()}`;
if (stat(1) !== "9") return `hard words: ${stat(1)}`;
// Abbreviations, decimals, initials, numbered lines and quotes.
type(box, "Dr. Lee paid 3.50 dollars to e.g. J. Smith. It cost No. 5 at 9 a.m. Then he left. She said \"no.\" He left."); await wait();
if (stat(0) !== "5") return `abbreviations split sentences: ${stat(0)}`;
type(box, "1. First line\n2. Second line\n\nA new paragraph"); await wait();
if (stat(0) !== "3") return `list lines: ${stat(0)}`;
type(box, "Is it? Yes! Well... maybe so. Done"); await wait();
if (stat(0) !== "4") return `?, !, an ellipsis before a small letter: ${stat(0)}`;
// Words with apostrophes, hyphens and accents are one word each.
type(box, "Don't over-think the café's naïve menu."); await wait();
if (stat(1) !== "6") return `word shapes: ${stat(1)}`;
// Other languages and scripts: counted, not scored, and it says why.
type(box, "El gato se sentó en la alfombra roja y durmió toda la tarde en la casa de su dueña."); await wait();
if (ease() || !said().includes("looks like Spanish")) return `Spanish: ${ease()} / ${said()}`;
if (stat(1) !== "19" || stat(2) !== "–") return `Spanish counts: ${stat(1)} ${stat(2)}`;
type(box, "Москва — столица России. Это большой город."); await wait();
if (ease() || !said().includes("Cyrillic")) return `Russian: ${said()}`;
if (stat(0) !== "2" || stat(1) !== "6") return `Russian counts: ${stat(0)} ${stat(1)}`;
type(box, "東京は大きい。京都は古い。"); await wait();
if (ease() || !said().includes("Chinese or Japanese") || stat(0) !== "2" || stat(1) !== "11") return `Japanese: ${said()} ${stat(0)} ${stat(1)}`;
type(box, "Zzxq vrbl ptkn wrtz hjkl"); await wait();
if (ease() || !said().includes("does not look like English")) return `no language: ${said()}`;
// Bad input.
type(box, "!!! ??? ... 😀"); await wait();
if (ease() || said() !== "There are no words to score." || stat(1) !== "0") return `symbols: ${said()}`;
type(box, "   \n  "); await wait();
if (said() !== "Type or paste some text to score it." || stat(0) !== "0") return `blank: ${said()}`;
// Past the limit it scores the start, says so, and stays quick.
const long = "The quick brown fox jumps over the lazy dog. ".repeat(6000), t0 = performance.now();
type(box, long); await wait(50);
const took = performance.now() - t0;
if (!notes().includes("first 100,000 characters")) return `long text: ${notes()}`;
if (took > 1500) return `long text took ${took} ms`;
// Text made to trip a pattern up: a page of stops.
for (const s of [".".repeat(100000) + "a", "!?".repeat(50000), "\n".repeat(99999) + "a", "a.".repeat(50000)]) {
    const t = performance.now();
    type(box, s); await wait(30);
    if (performance.now() - t > 1500) return `${JSON.stringify(s.slice(0, 4))} took ${performance.now() - t} ms`;
}
type(box, ""); await wait();
// on_change
const live = $("#readability-meter-demo-live-text"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (!note().startsWith("Change the draft")) return note();
type(live, "The cat sat on the mat."); await wait();
if (note() !== "on_change: the reading ease is 116.") return note();
