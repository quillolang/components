const views = $$(".ui-diff");
if (views.length !== 4) return `expected 4 diffs, found ${views.length}`;
const [uni, split, folded, same] = views;
const rows = (v) => [...v.querySelectorAll("tbody tr")];
const cells = (tr) => [...tr.children].map((td) => td.textContent);
// unified: before has 11 lines, after has 11 lines
const kinds = rows(uni).map((tr) => tr.classList.contains("ui-diff-add") ? "+" : tr.classList.contains("ui-diff-del") ? "-" : "=");
if (kinds.join("") !== "=--++=+==--+===") return `unified kinds: ${kinds.join("")}`;
const stat = uni.querySelector(".ui-diff-stat").textContent.replace(/\s+/g, " ");
if (!stat.includes("+4") || !stat.includes("−4")) return `the header counts: ${stat}`;
const first = rows(uni)[1];
if (!first.querySelector("del") || first.children[0].textContent !== "2" || first.children[1].textContent !== "") return `a removed line: ${cells(first)}`;
if (!first.querySelector("del").textContent.startsWith("Removed: ")) return "a removed line does not say so to screen readers";
const add = rows(uni)[3];
if (!add.querySelector("ins") || add.children[0].textContent !== "" || add.children[1].textContent !== "2") return `an added line: ${cells(add)}`;
if (add.querySelector("ins").lastChild.textContent !== "port = 8443") return "the added text is wrong";
const tail = rows(uni).at(-1);
if (cells(tail)[0] !== "11" || cells(tail)[1] !== "11" || !tail.textContent.includes('from = "hello@example.com"')) return `last line: ${cells(tail)}`;
const bg = (el) => getComputedStyle(el).backgroundColor;
if (bg(rows(uni)[1]) === bg(rows(uni)[3]) || bg(rows(uni)[0]) === bg(rows(uni)[1])) return "added and removed lines are not coloured apart";
if (getComputedStyle(rows(uni)[0].children[3]).whiteSpace !== "pre") return "indentation would be lost";
if (uni.querySelector(".ui-diff-names").textContent.trim() !== "config/app.toml") return "the same name twice shows twice";
// split: removed lines on the left, added on the right, paired
const s = rows(split);
const pair = s.find((tr) => tr.querySelector("del") && tr.querySelector("ins"));
if (!pair || pair.querySelector("del").textContent !== "Removed: port = 8080" || pair.querySelector("ins").textContent !== "Added: port = 8443") return "split mode does not pair the changed lines";
if (s.length !== 12) return `split rows: ${s.length}`;
const lone = s.find((tr) => tr.querySelector("ins") && tr.children[0].textContent === "");
if (!lone || !lone.children[0].classList.contains("ui-diff-none")) return "an added line with nothing on the left is not shaded empty";
if (!split.textContent.includes("→")) return "two names are not shown as before → after";
// context folds unchanged runs
const f = rows(folded);
const folds = f.filter((tr) => tr.classList.contains("ui-diff-fold")).map((tr) => tr.textContent.trim());
if (folds.join("|") !== "⋯ 9 unchanged lines|⋯ 16 unchanged lines") return `folds: ${folds}`;
if (f.length !== 8) return `context=2 shows ${f.length} rows`;
if (f[1].children[0].textContent !== "10") return "the context does not start two lines before the change";
// same text
if (same.querySelector("table") || !same.textContent.includes("No changes")) return "equal texts do not say No changes";
const sc = uni.querySelector(".ui-diff-scroll");
if (sc.tabIndex !== 0 || !sc.getAttribute("aria-label")?.includes("config/app.toml")) return "the scroll area is not focusable or named";
