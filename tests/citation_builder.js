const f = (n) => $(`#citation-builder-demo-${n}`), c = f("title").closest(".ui-citation-builder");
const text = (s) => $(`#citation-builder-demo-${s} p`).textContent;
const bib = () => $("#citation-builder-demo-bibtex pre").textContent;
const said = () => $("#citation-builder-demo-said").textContent;
const notes = () => [...c.querySelectorAll(".ui-citation-builder-notes li")].map((l) => l.textContent);
const read = () => c.querySelector(".ui-citation-builder-read")?.textContent;
const kind = async (k) => { c.querySelector(`input[type=radio][value=${k}]`).click(); await wait(); };
const authors = async (t) => { type(f("authors"), t); await wait(); };
for (const n of ["authors", "title", "year", "publisher", "place", "edition"]) if (f(n).name !== n || !f(n).labels[0]) return `field ${n}`;
if (said() !== "Citation ready.") return said();
// A book, in all four styles.
if (text("apa") !== "Le Guin, U. K. (1974). The Dispossessed (2nd ed.). Harper & Row.") return `APA: ${text("apa")}`;
if (text("mla") !== "Le Guin, Ursula K. The Dispossessed. 2nd ed., Harper & Row, 1974.") return `MLA: ${text("mla")}`;
if (text("chicago") !== "Le Guin, Ursula K. The Dispossessed. 2nd ed. New York: Harper & Row, 1974.") return `Chicago: ${text("chicago")}`;
if (bib() !== "@book{leguin1974dispossessed,\n  author = {Le Guin, Ursula K.},\n  title = {The Dispossessed},\n  publisher = {Harper \\& Row},\n  address = {New York},\n  year = {1974},\n  edition = {2nd}\n}") return `BibTeX: ${bib()}`;
// The title is in italics, the rest is not.
if ($("#citation-builder-demo-apa i")?.textContent !== "The Dispossessed" || $("#citation-builder-demo-mla i")?.textContent !== "The Dispossessed") return "a book's title is not in italics";
// An article, as the style guides write Watson and Crick.
const a = (s) => $(`#citation-builder-demo-article-${s} p`).textContent;
if (a("apa") !== "Watson, J. D., & Crick, F. (1953). Molecular structure of nucleic acids. Nature, 171(4356), 737–738. https://doi.org/10.1038/171737a0") return `APA article: ${a("apa")}`;
if (a("mla") !== "Watson, James D., and Francis Crick. “Molecular structure of nucleic acids.” Nature, vol. 171, no. 4356, 1953, pp. 737-38, https://doi.org/10.1038/171737a0.") return `MLA article: ${a("mla")}`;
if (a("chicago") !== "Watson, James D., and Francis Crick. “Molecular structure of nucleic acids.” Nature 171, no. 4356 (1953): 737–738. https://doi.org/10.1038/171737a0.") return `Chicago article: ${a("chicago")}`;
if ([...$$("#citation-builder-demo-article-apa i")].map((i) => i.textContent).join("|") !== "Nature|171") return "APA italics the journal and the volume";
if ($("#citation-builder-demo-article-bibtex pre").textContent !== "@article{watson1953molecular,\n  author = {Watson, James D. and Crick, Francis},\n  title = {Molecular structure of nucleic acids},\n  journal = {Nature},\n  year = {1953},\n  volume = {171},\n  number = {4356},\n  pages = {737--738},\n  doi = {10.1038/171737a0}\n}") return "BibTeX article";
// How names are read.
for (const [t, want] of [["Ursula Le Guin", "Guin, Ursula Le"], ["Smith, John; Doe, Jane", "Smith, John; Doe, Jane"], ["John Smith and Jane Doe", "Smith, John; Doe, Jane"], ["John Smith & Jane Doe", "Smith, John; Doe, Jane"],
                         ["John Smith, Jane Doe, and Al Poe", "Smith, John; Doe, Jane; Poe, Al"], ["Smith, John, Doe, Jane", "Smith, John; Doe, Jane"], ["John Smith\nJane Doe", "Smith, John; Doe, Jane"],
                         ["van der Berg, Anna", "van der Berg, Anna"], ["Anna van der Berg", "van der Berg, Anna"], ["Ludwig van Beethoven", "van Beethoven, Ludwig"], ["King, Martin Luther, Jr.", "King, Martin Luther, Jr."],
                         ["Martin Luther King, Jr.", "King, Martin Luther, Jr."], ["World Health Organization", "World Health Organization (organisation)"], ["{Mandarin Duck}", "Mandarin Duck (organisation)"],
                         ["American Society for Testing and Materials", "American Society for Testing and Materials (organisation)"], ["Plato", "Plato"], ["Müller, Jürgen", "Müller, Jürgen"], ["{Ben & Jerry}; Plato", "Ben & Jerry (organisation); Plato"]]) {
    await authors(t);
    if (read() !== `Read as: ${want}`) return `${t}: ${read()}`;
}
// Initials: several, hyphenated, already written, any alphabet.
await authors("Tolkien, John Ronald Reuel"); if (!text("apa").startsWith("Tolkien, J. R. R. (1974).")) return text("apa");
await authors("Sartre, Jean-Paul"); if (!text("apa").startsWith("Sartre, J.-P. (1974).")) return text("apa");
await authors("Tolkien, J.R.R."); if (!text("apa").startsWith("Tolkien, J. R. R. (1974).")) return text("apa");
await authors("Östlund, Åke"); if (!text("apa").startsWith("Östlund, Å. (1974).")) return text("apa");
await authors("King, Martin Luther, Jr."); if (!text("apa").startsWith("King, M. L., Jr. (1974).")) return text("apa");
// An organisation is not inverted, and BibTeX protects it.
await authors("{Mandarin Duck Group}");
if (!text("apa").startsWith("Mandarin Duck Group. (1974).") || !text("mla").startsWith("Mandarin Duck Group. The") || !bib().includes("author = {{Mandarin Duck Group}}")) return `org: ${text("apa")} / ${bib()}`;
// One name alone.
await authors("Plato");
if (!text("apa").startsWith("Plato. (1974).") || !bib().includes("author = {Plato}")) return `Plato: ${text("apa")}`;
// Three authors: APA all, MLA et al., Chicago all.
await authors("Smith, John; Doe, Jane; Poe, Al");
if (!text("apa").startsWith("Smith, J., Doe, J., & Poe, A. (1974).")) return text("apa");
if (!text("mla").startsWith("Smith, John, et al. The")) return text("mla");
if (!text("chicago").startsWith("Smith, John, Jane Doe, and Al Poe. The")) return text("chicago");
if (!bib().includes("author = {Smith, John and Doe, Jane and Poe, Al}")) return bib();
// Twenty is all of them in APA; 21 is 19, dots and the last. Eleven in Chicago is seven and et al.; ten is all.
const many = (n) => Array.from({ length: n }, (_, i) => `Name${i + 1}, Al`).join("; ");
await authors(many(20));
if (!text("apa").includes("Name19, A., & Name20, A. (1974)")) return `20: ${text("apa").slice(0, 300)}`;
await authors(many(21));
if (!text("apa").includes("Name18, A., Name19, A., . . . Name21, A. (1974)") || text("apa").includes("Name20")) return `21: ${text("apa").slice(0, 400)}`;
await authors(many(10));
if (!text("chicago").includes("Al Name9, and Al Name10. The")) return `10: ${text("chicago").slice(0, 300)}`;
await authors(many(11));
if (!text("chicago").includes("Al Name6, Al Name7, et al. The") || text("chicago").includes("Name8")) return `11: ${text("chicago").slice(0, 300)}`;
// No author: the title leads. No year: n.d. in APA, nothing in the others.
await authors("");
if (text("apa") !== "The Dispossessed (2nd ed.) (1974). Harper & Row." || !text("mla").startsWith("The Dispossessed. 2nd ed.")) return `no author: ${text("apa")} / ${text("mla")}`;
if (!bib().startsWith("@book{anon1974dispossessed,")) return bib();
await authors("Le Guin, Ursula K.");
type(f("year"), ""); await wait();
if (!text("apa").startsWith("Le Guin, U. K. (n.d.).") || !text("mla").endsWith("Harper & Row.")) return `no year: ${text("apa")} / ${text("mla")}`;
if (said() !== "Citation built. Still needed: Year." || !f("year").closest(".ui-citation-builder-need")) return `missing: ${said()}`;
type(f("year"), "1974"); await wait();
// A title ending in ? or ! keeps it, with no full stop after.
type(f("title"), "What Is to Be Done?"); await wait();
type(f("edition"), ""); await wait();
if (text("apa") !== "Le Guin, U. K. (1974). What Is to Be Done? Harper & Row.") return `?: ${text("apa")}`;
if (text("mla") !== "Le Guin, Ursula K. What Is to Be Done? Harper & Row, 1974.") return `?: ${text("mla")}`;
// Editions, written any way.
for (const [e, want] of [["2", "2nd"], ["2nd", "2nd"], ["3rd ed.", "3rd"], ["11", "11th"], ["21", "21st"], ["12th edition", "12th"], ["Revised", "Revised"]]) {
    type(f("edition"), e); await wait();
    if (!text("mla").includes(`${want} ed.,`)) return `edition ${e}: ${text("mla")}`;
}
type(f("edition"), ""); await wait();
// BibTeX's special characters.
type(f("title"), "100% of R&D_x #1 $5 {a}"); await wait();
if (!bib().includes("title = {100\\% of R\\&D\\_x \\#1 \\$5 \\{a\\}}")) return bib();
type(f("title"), "The Dispossessed"); await wait();
// Warnings: dates, future, bad year. Today is 2026-11-01.
type(f("year"), "2027"); await wait();
if (!notes().includes("Year is after this year.")) return `future: ${notes()}`;
type(f("year"), "sometime"); await wait();
if (!notes().includes("Year is not a year: write it as 2026.")) return `bad year: ${notes()}`;
type(f("year"), "1974"); await wait();
type(f("doi"), "not-a-doi"); await wait();
if (!notes()[0]?.startsWith("DOI does not look like one")) return `DOI: ${notes()}`;
type(f("doi"), "doi:10.1000/xyz123"); await wait();
if (notes().length || !text("apa").endsWith("https://doi.org/10.1000/xyz123") || !bib().includes("doi = {10.1000/xyz123}")) return `doi: ${notes()} ${text("apa")}`;
type(f("doi"), ""); await wait();
type(f("url"), "example.com/x"); await wait();
if (notes()[0] !== "Address does not start with http:// or https://.") return `url: ${notes()}`;
type(f("url"), ""); await wait();
// Title Case is noted for APA, and a title in sentence case is not.
type(f("title"), "The Theory Of Moral Sentiments And Other Writings"); await wait();
if (!notes().some((n) => n.startsWith("APA capitalises only"))) return `title case: ${notes()}`;
type(f("title"), "The theory of moral sentiments"); await wait();
if (notes().length) return `sentence case: ${notes()}`;
// A web page, keeping what was typed in shared fields.
await kind("web");
if (f("publisher") || !f("site") || f("title").value !== "The theory of moral sentiments" || f("accessed").value !== "2026-11-01") return "switching to a web page";
type(f("title"), "Drinking-water"); await wait();
await authors("{World Health Organization}");
type(f("site"), "WHO"); await wait();
type(f("date"), "2023-09-13"); await wait();
type(f("url"), "https://www.who.int/fact-sheets/drinking-water"); await wait();
if (text("apa") !== "World Health Organization. (2023, September 13). Drinking-water. WHO. https://www.who.int/fact-sheets/drinking-water") return `web APA: ${text("apa")}`;
if (text("mla") !== "World Health Organization. “Drinking-water.” WHO, 13 Sept. 2023, www.who.int/fact-sheets/drinking-water.") return `web MLA: ${text("mla")}`;
if (text("chicago") !== "World Health Organization. “Drinking-water.” WHO. September 13, 2023. https://www.who.int/fact-sheets/drinking-water.") return `web Chicago: ${text("chicago")}`;
if (!bib().startsWith("@misc{worldhealthorganization2023drinking,") || !bib().includes("howpublished = {\\url{https://www.who.int/fact-sheets/drinking-water}}") || !bib().includes("note = {WHO. Accessed 2026-11-01}")) return bib();
// When the author is the site, APA says it once.
type(f("site"), "World Health Organization"); await wait();
if (text("apa") !== "World Health Organization. (2023, September 13). Drinking-water. https://www.who.int/fact-sheets/drinking-water") return `same site: ${text("apa")}`;
// Dates that do not exist, and those to come.
type(f("date"), "2023-02-30"); await wait();
if (!notes().includes("Date published is not a date: write it as 2026, 2026-03 or 2026-03-05.") || !text("apa").includes("(n.d.)")) return `bad date: ${notes()}`;
type(f("date"), "2023-13"); await wait();
if (!notes().length) return "month 13";
type(f("date"), "2027-01-01"); await wait();
if (!notes().includes("Date published is after today.")) return `future date: ${notes()}`;
type(f("date"), "2023-09"); await wait();
if (notes().length || !text("apa").includes("(2023, September)") || !text("mla").includes("Sept. 2023,")) return `month only: ${text("apa")}`;
// With no date, the date it was seen stands in, for those that ask for it.
type(f("date"), ""); await wait();
if (!text("chicago").includes("Accessed November 1, 2026.") || !text("mla").endsWith("Accessed 1 Nov. 2026.")) return `accessed: ${text("chicago")} / ${text("mla")}`;
// Back to an article: pages in any dash, MLA's short range.
await kind("article");
if (f("site") || !f("journal")) return "switching to an article";
for (const [p, mla, apa] of [["1-10", "pp. 1-10", "1–10"], ["112 – 134", "pp. 112-34", "112–134"], ["195—205", "pp. 195-205", "195–205"], ["1000-1020", "pp. 1000-20", "1000–1020"], ["e123", "p. e123", "e123"]]) {
    type(f("pages"), p); await wait();
    if (!text("mla").includes(mla) || !text("apa").includes(apa)) return `pages ${p}: ${text("mla")} / ${text("apa")}`;
}
type(f("pages"), "twelve"); await wait();
if (!notes().includes("Pages are not a range: write them as 12-34.")) return `pages: ${notes()}`;
// Bad input.
for (const n of ["authors", "title", "journal", "year", "volume", "issue", "pages", "doi", "url"]) type(f(n), "   ");
await wait();
if (said() !== "Fill in the fields to build the citation." || c.querySelector(".ui-citation-builder-out")) return `blank: ${said()}`;
await authors(";;; , ,, {} { } and & \n\n");
if (c.querySelector(".ui-citation-builder-out") && text("apa").includes("undefined")) return text("apa");
await authors("{unclosed brace; Doe, Jane");
if (!read()?.includes("Doe, Jane")) return `a brace left open: ${read()}`;
const t0 = performance.now();
await authors(many(5000));
if (performance.now() - t0 > 1500) return `5,000 authors took ${performance.now() - t0} ms`;
await authors("");
// Copy gives the plain text, and on_change the reference.
const clip = navigator.clipboard; let copied = null;
Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: (s) => { copied = s; return Promise.resolve(); } } });
$("#citation-builder-demo-article-mla .ui-copy-btn").click(); await wait(100);
Object.defineProperty(navigator, "clipboard", { configurable: true, value: clip });
if (copied !== a("mla")) return `copied: ${copied}`;
const live = $("#citation-builder-demo-live-site"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.name !== "cite_site") return "name prefix";
type(live, "WHO"); await wait();
if (note() !== "on_change: World Health Organization. (n.d.). Drinking-water. WHO.") return note();
