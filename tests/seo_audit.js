const f = (n) => $(`#seo-audit-demo-${n}`), c = f("title").closest(".ui-seo-audit");
const said = () => $("#seo-audit-demo-said").textContent;
const failed = () => [...c.querySelectorAll("#seo-audit-demo-failed li")].map((l) => l.querySelector("b").textContent);
const detail = (name) => [...c.querySelectorAll(".ui-seo-audit-checks li")].find((l) => l.querySelector("b").textContent === name)?.querySelector("span").textContent;
const fixOf = (name) => [...c.querySelectorAll("#seo-audit-demo-failed li")].find((l) => l.querySelector("b").textContent === name)?.querySelector("small")?.textContent;
const counts = () => [...c.querySelectorAll(".ui-seo-audit-counts dd")].map((d) => d.textContent).join(" ");
const body = async (t) => { type(f("body"), t); await wait(); };
for (const n of ["title", "description", "slug", "keyword", "body"]) if (f(n).name !== n || !f(n).labels[0]) return `field ${n}`;
// The demo, by hand. Possible 110. Passed: H1 10, internal 5, external 5, keyword in title 10, description 5, slug 5, paragraph 5, heading 5 = 50. 50/110 = 45.
if (said() !== "Score 45 of 100. 8 of 15 checks passed, 7 to fix.") return `demo: ${said()}`;
if (failed().join() !== "Title length,Description length,Slug,Heading order,Image descriptions,Body length,Keyword share of the text") return `failed: ${failed()}`;
if (counts() !== "32 2 2 1 1") return `counts: ${counts()}`;
if (detail("Title length") !== "17 characters." || fixOf("Title length") !== "Say more: aim for 30 to 60 characters.") return detail("Title length");
if (detail("Slug") !== "It has capital letters.") return detail("Slug");
if (detail("Heading order") !== `"What you need" is an H3 after an H1.`) return detail("Heading order");
if (detail("Image descriptions") !== "1 image has no alt text: /img/beans.jpg.") return detail("Image descriptions");
// "cold brew" twice, 4 of 32 words: 12.5%.
if (detail("Keyword share of the text") !== "12.5% of the words." || fixOf("Keyword share of the text") !== "Use it less: over 3% reads as stuffing.") return detail("Keyword share of the text");
if (!c.querySelector(".ui-seo-audit-poor")) return "45 is a poor score";
// Fixing things raises the score: each field is read as typed.
type(f("slug"), "cold-brew"); await wait();
if (!said().startsWith("Score 50 of 100.")) return `a good slug: ${said()}`;
type(f("title"), "Cold brew at home: an easy guide for beginners"); await wait();
if (!said().startsWith("Score 64 of 100.")) return `a good title: ${said()}`;
// Limits, at their edges: 30 and 60, 70 and 160.
type(f("title"), "x".repeat(30)); await wait();
if (failed().includes("Title length")) return "30 characters is enough";
type(f("title"), "x".repeat(29)); await wait();
if (!failed().includes("Title length")) return "29 characters is too few";
type(f("title"), "x".repeat(60)); await wait();
if (failed().includes("Title length")) return "60 characters is allowed";
type(f("title"), "x".repeat(61)); await wait();
if (fixOf("Title length") !== "Shorten it to 60 characters or fewer, or search engines will cut it.") return "61 characters";
type(f("description"), "y".repeat(160)); await wait();
if (failed().includes("Description length")) return "160 characters is allowed";
type(f("description"), "y".repeat(161)); await wait();
if (!failed().includes("Description length")) return "161 characters is too many";
type(f("description"), "y".repeat(70)); await wait();
if (failed().includes("Description length")) return "70 characters is enough";
// Slugs.
for (const [slug, want] of [["", "There is no slug."], ["my_post", "It has underscores."], ["my post", "It has spaces."], ["café-noir", "It has characters other than letters, numbers and hyphens."], ["my--post", "It has stray hyphens."], ["-post", "It has stray hyphens."], ["a".repeat(61), "It has 61 characters, over 60."]]) {
    type(f("slug"), slug); await wait();
    if (detail("Slug") !== want) return `slug ${slug}: ${detail("Slug")}`;
}
type(f("slug"), "/blog/cold-brew/"); await wait();
if (failed().includes("Slug")) return `a path: ${detail("Slug")}`;
// Headings: none, two, and what is hidden does not count.
await body("<p>No headings at all.</p>");
if (detail("One main heading") !== "0 H1s found." || fixOf("One main heading") !== "Add one H1 to say what the page is about.") return detail("One main heading");
await body("<h1>One</h1><h1 class='x'>Two</h1>");
if (detail("One main heading") !== "2 H1s found." || fixOf("One main heading") !== "Keep one H1 and make the others H2.") return detail("One main heading");
await body("<H1>Caps</H1><!-- <h1>Comment</h1> --><script>let a = '<h1>x</h1>';</script><pre><h1>Code</h1></pre><style>h1 { }</style><h2\n id='a'>Next</h2>");
if (detail("One main heading") !== "1 H1 found." || counts().split(" ")[1] !== "2") return `hidden headings: ${detail("One main heading")} ${counts()}`;
if (detail("Heading order") !== "No level is skipped.") return detail("Heading order");
// Going back up a level is no skip.
await body("<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><h3>E</h3>");
if (failed().includes("Heading order")) return "going up is fine";
await body("<h1>A</h1><h2>B</h2><h4>C</h4>");
if (detail("Heading order") !== `"C" is an H4 after an H2.`) return detail("Heading order");
// Images: quotes of any kind, > in an attribute, an alt that is empty on purpose, and data-alt is not alt.
await body(`<p>x</p><img src='a.png' alt='fine'><IMG SRC="b.png" ALT="a > b"><img alt=plain src=c.png><img src="d.png" alt=""><img src="e.png" data-alt="no">`);
if (counts().split(" ")[2] !== "5" || detail("Image descriptions") !== "1 image has no alt text: e.png.") return `images: ${counts()} ${detail("Image descriptions")}`;
await body("<p>x</p><img src='a.png' alt='fine'><img src='b.png' alt='fine'>");
if (detail("Image descriptions") !== "All 2 images have alt text.") return detail("Image descriptions");
await body("<p>x</p>");
if (detail("Image descriptions") !== "No images.") return detail("Image descriptions");
// Links: this site with and without www and on another scheme; a relative one; others; and those that do not count.
await body(`<p><a href="https://blog.example.com/a">1</a><a href="http://www.blog.example.com/b">2</a><a href="/c">3</a><a href="d.html">4</a><a href="https://other.org/">5</a><a href="//cdn.other.org/x">6</a><a href="#top">no</a><a href="mailto:a@b.c">no</a><a href="tel:123">no</a><a>no</a></p>`);
if (counts().split(" ").slice(3).join(" ") !== "4 2") return `links: ${counts()}`;
// The keyword by whole words: "tea" is not in "steam", any case, and a phrase over a line break counts.
type(f("keyword"), "tea"); await wait();
type(f("title"), "Steam rises over the teapot on a cold morning"); await wait();
if (!failed().includes("Keyword in the title")) return "tea is not in steam or teapot";
type(f("title"), "TEA, steam and a cold morning at the window"); await wait();
if (failed().includes("Keyword in the title")) return "any case";
type(f("keyword"), "cold brew"); await wait();
await body("<p>Cold\nbrew keeps well.</p>");
if (failed().includes("Keyword in the first paragraph")) return "a phrase over a line break";
await body("<p>No mention here.</p><p>Cold brew keeps well.</p>");
if (!failed().includes("Keyword in the first paragraph")) return "only the first paragraph counts";
type(f("keyword"), "café"); await wait();
type(f("title"), "A CAFÉ near the station, with room for all"); await wait();
if (failed().includes("Keyword in the title")) return "an accented keyword, in capitals";
// The share of the text, at its edges: 3 in 100 is allowed, 4 in 100 is not, 1 in 201 is under 0.5%.
const fill = (n) => Array.from({ length: n }, (_, i) => `w${i}x`).join(" ");
type(f("keyword"), "tea"); await wait();
await body(`<p>tea tea tea ${fill(97)}</p>`);
if (failed().includes("Keyword share of the text")) return `3 in 100: ${detail("Keyword share of the text")}`;
await body(`<p>tea tea tea tea ${fill(96)}</p>`);
if (detail("Keyword share of the text") !== "4.0% of the words.") return detail("Keyword share of the text");
await body(`<p>tea ${fill(200)}</p>`);
if (fixOf("Keyword share of the text") !== "Use it a little more: aim for 0.5% to 3%.") return `1 in 201: ${fixOf("Keyword share of the text")}`;
// 300 words is enough, 299 is not.
await body(`<p>${fill(300)}</p>`);
if (failed().includes("Body length")) return "300 words";
await body(`<p>${fill(299)}</p>`);
if (detail("Body length") !== "299 words.") return detail("Body length");
// Without a keyword, its checks are left out, not failed.
type(f("keyword"), "   "); await wait();
if (c.querySelectorAll(".ui-seo-audit-checks li").length !== 9 || !c.textContent.includes("Give a focus keyword")) return "no keyword";
// Markdown.
await body("Intro with [a link](https://other.org/x \"Title\") and `[no](/x)`.\n\nTitle\n=====\n\nSub\n---\n\n```\n# Not a heading\n![no](x.png)\n```\n\n#### Deep ####\n\n![alt](a.png) ![](b.png)\n\n<https://y.org/> and https://z.org/q. See [in](/in) too.\n");
if (!c.textContent.includes("Read as Markdown.")) return "not read as Markdown";
if (counts().split(" ").slice(1).join(" ") !== "3 2 1 3") return `Markdown: ${counts()}`;
if (detail("Heading order") !== `"Deep" is an H4 after an H2.`) return detail("Heading order");
if (detail("Image descriptions") !== "1 image has no alt text: b.png.") return detail("Image descriptions");
// Bad input: broken markup, and nothing at all.
await body("<h1>Never closed <img src= <a href=\"x <p");
if (said().indexOf("Score ") !== 0) return `broken markup: ${said()}`;
await body("<<<<>>>> &&& <");
for (const n of ["title", "description", "slug", "keyword", "body"]) type(f(n), "  "); await wait();
if (said() !== "Fill in the fields to audit the page." || c.querySelector(".ui-seo-audit-counts")) return said();
// A long body stays quick and says it was cut.
const t0 = performance.now();
await body(`<p>${"<img src='a.png'> word ".repeat(10000)}</p>`);
if (performance.now() - t0 > 1500) return `a long body took ${performance.now() - t0} ms`;
if (!c.textContent.includes("Only the first 100,000 characters of the body were read.")) return "no word of the limit";
// Bodies made to trip a pattern up: each takes a moment, not minutes.
for (const [what, s] of [["h1", "<h1>".repeat(25000)], ["comment", "<!--".repeat(25000)], ["script", "<script>".repeat(12000)], ["img", "<img \"".repeat(16000)], ["a", "<a '".repeat(25000)],
                         ["angle", "<".repeat(100000)], ["bracket", "[".repeat(100000)], ["image", "![a](".repeat(20000)], ["lines", "\n".repeat(99999) + "x"]]) {
    const t = performance.now();
    await body(s);
    if (performance.now() - t > 1500) return `${what} took ${performance.now() - t} ms`;
}
await body("");
// on_change, and the name prefix.
const live = $("#seo-audit-demo-live-title"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (live.name !== "post_title" || $("#seo-audit-demo-live-body").name !== "post_body") return "name prefix";
type($("#seo-audit-demo-live-description"), "Tea at home takes three minutes, a kettle and a cup, and costs almost nothing to make."); await wait();
if (!/^on_change: the score is \d+\.$/.test(note())) return note();
