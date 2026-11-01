const c = $("#regex-tester-demo");
const pat = $("#regex-tester-demo-pattern"), sample = $("#regex-tester-demo-sample"), rep = $("#regex-tester-demo-replacement");
const flag = (l) => c.querySelector(`[name=flag_${l}]`);
const setFlags = async (f) => { for (const l of "ims") { const on = f.includes(l); if (flag(l).checked !== on) { flag(l).click(); } } await wait(30); };
const marks = () => [...c.querySelectorAll("mark")].map((m) => m.textContent);
const count = () => c.querySelector(".ui-rxt-count")?.textContent;
const err = () => c.querySelector(".ui-rxt-error span")?.textContent;
const rows = () => [...c.querySelectorAll("tbody tr")].map((r) => [...r.children].map((td) => td.textContent));
const heads = () => [...c.querySelectorAll("thead th")].map((t) => t.textContent);
// The start: dates, with named groups and one group that takes no part.
if (count() !== "2 matches" || marks().join("|") !== "2026-11-01|2027-01") return `start: ${count()} ${marks()}`;
if (heads().join("|") !== "#|At|Match|1: year|2: month|Group 3") return heads().join("|");
if (JSON.stringify(rows()) !== JSON.stringify([["1", "5-15", "2026-11-01", "2026", "11", "-01"], ["2", "21-28", "2027-01", "2027", "01", "no part"]])) return JSON.stringify(rows());
const out = c.querySelector(".ui-rxt-out");
if (out.textContent.replace(/\s+$/, "") !== sample.value) return `the sample keeps its text: ${out.textContent}`;
const preview = () => c.querySelector("[data-preview]")?.textContent;
if (preview() !== "Paid 11/2026, due 01/2027 or never") return preview();
// Explanations.
const says = () => [...c.querySelectorAll(".ui-rxt-token")].map((t) => `${t.querySelector("code").textContent} = ${t.querySelector("span").textContent}`);
if (says().join("; ") !== "(?<year> = start of group 1, named year; \\d{4} = a digit, exactly 4 times; ) = end of group 1; - = \"-\"; (?<month> = start of group 2, named month; \\d{2} = a digit, exactly 2 times; ) = end of group 2; ( = start of group 3; - = \"-\"; \\d{2} = a digit, exactly 2 times; )? = end of group 3, optional") return says().join("; ");
type(pat, "^abc+?[a-z0-9_]{2,}|x\\.y*$"); await wait(40);
if (says().join("; ") !== "^ = the start of the text; ab = \"a\", then \"b\"; c+? = \"c\", 1 or more times, as few as possible; [a-z0-9_]{2,} = one of \"a\" to \"z\", \"0\" to \"9\", \"_\", 2 or more times; | = or; x\\. = \"x\", then \".\"; y* = \"y\", 0 or more times; $ = the end of the text") return says().join("; ");
await setFlags("m");
if (!says()[0].endsWith("the start of a line")) return says()[0];
await setFlags("");
type(rep, "");
// Agreement with the browser's own engine, which `re` uses, on patterns `re` takes.
const table = [
    ["a*", "", "baaa"], ["", "", "ab"], ["\\b", "", "hi there"], ["\\B", "", "hi"], ["(a|ab)(c|bcd)(d*)", "", "abcd"], ["a{2,3}", "", "aaaaaaa"], ["a{2,3}?", "", "aaaaaaa"],
    ["(a*)*", "", "aab"], ["(a*)+", "", "b"], ["(?:(a)|b)*", "", "abab"], ["(a|b)*?c", "", "abcabc"], ["(z)?(y)?", "", "zy y"], ["[^a-c]+", "", "abcdefabc"], ["[\\d\\s]+", "", "ab 12 3c"],
    ["^.+$", "m", "one\ntwo\r\nthree"], ["^.+$", "", "one\ntwo"], [".+", "s", "one\ntwo"], ["HeLLo", "i", "hello HELLO heLLo"], ["[a-z]+", "i", "AbC 123 dEf"], ["\\w+@\\w+\\.com", "", "me@ex.com, you@b.com"],
    ["\\u00e9+", "", "caféé"], ["\\u{1F600}", "", "a😀b"], [".", "", "😀é"], ["[😀-😂]", "", "😁x"], ["\\x41", "", "ABA"], ["\\.", "", "a.b"], ["a|", "", "ba"], ["(?:)", "", "ab"], ["\\/", "", "a/b"], ["\\t", "", "a\tb"],
    ["(a)|(b)", "", "ab"], ["((a)|(b))+", "", "ab"], ["a??", "", "aa"], ["(?:a|b){3}", "", "abab"], ["x{0}", "", "xy"], ["\\s+", "", "a   b"], ["\\S\\D\\W", "", "ab!"], ["$", "m", "a\nb"], ["^", "m", "a\nb\n"],
];
for (const [p, f, t] of table) {
    type(pat, p); type(sample, t); await setFlags(f); await wait(30);
    const want = [...t.matchAll(new RegExp(p, "gu" + f))];
    const got = marks();
    if (err()) return `${p}: refused: ${err()}`;
    if (got.length !== want.length || got.some((m, i) => m !== want[i][0])) return `/${p}/${f} on ${JSON.stringify(t)}: ${JSON.stringify(got)}, the browser ${JSON.stringify(want.map((m) => m[0]))}`;
    const shown = rows();
    for (let i = 0; i < want.length; i++) {
        const gs = shown[i].slice(3), ws = want[i].slice(1).map((g) => g === undefined ? "no part" : g);
        if (gs.join("|") !== ws.join("|")) return `/${p}/${f} match ${i} groups: ${gs}, the browser ${ws}`;
    }
}
await setFlags("");
// `re`'s reasons, at the place of the mistake.
const errors = [
    ["(abc", "Column 1: `(` without its `)`"],
    ["ab)c", "Column 3: `)` without its `(`"],
    ["ab[c", "Column 3: `[` without its `]`"],
    ["*a", "Column 1: nothing to repeat before `*`"],
    ["a**", "Column 3: nothing to repeat before `*`"],
    ["a{2,1}", "Column 2: in {n,m}, n is more than m"],
    ["a{1001}", "Column 2: repeating more than 1000 times is not supported"],
    ["a{", "Column 2: `{` on its own: write `\\{`, or repeat with {n}, {n,} or {n,m}"],
    ["[z-a]", "Column 3: a range in [...] goes from the lower character to the higher"],
    ["[]", "Column 1: an empty class `[]` matches nothing: write `\\[\\]` for the brackets"],
    ["[\\d-z]", "Column 4: a range in [...] is between two characters, not \\d, \\w or \\s"],
    ["x\\q", "Column 2: `\\q` is not one of the escapes patterns have"],
    ["\\1", "Column 1: backreferences (\\1, \\k<name>) are not supported"],
    ["(?=a)", "Column 1: lookahead and lookbehind ((?= (?! (?<= (?<!) are not supported"],
    ["(?i)a", "Column 1: flags go in the last argument (\"i\", \"m\", \"s\"), not in the pattern"],
    ["(?<a>x)(?<a>y)", "Column 11: two groups are named `a`"],
    ["(?<1a>x)", "Column 1: a group's name is letters, digits and `_`, as in (?<name>...)"],
    ["\\p{L}", "Column 1: Unicode classes (\\p{...}) are not supported"],
    ["ab]", "Column 3: `]` on its own: write `\\]`"],
    ["ab\\", "Column 3: the pattern ends with `\\`"],
    ["\\ud83d", "Column 1: half of a surrogate pair on its own"],
    ["((a{1000}){1000})", "Column 1: This pattern grows too large to run: its repeats make over 20000 steps of program."],
    ["(".repeat(70), "Column 65: Groups inside groups go at most 64 deep."],
    ["a".repeat(1001), "Column 1001: A pattern here is at most 1000 characters; this has 1001."],
];
for (const [p, msg] of errors) {
    type(pat, p); await wait(30);
    if (err() !== msg) return `${p.slice(0, 30)}: ${err()}, wanted ${msg}`;
    if (pat.getAttribute("aria-invalid") !== "true" || c.querySelector("mark")) return `${p}: not marked as an error`;
}
const caret = () => c.querySelector(".ui-rxt-error pre").textContent;
type(pat, "ab)c"); await wait(30);
if (caret() !== "ab)c\n  ^") return `the caret: ${JSON.stringify(caret())}`;
// A pattern that would hang a browser ends at once.
type(pat, "(a+)+$"); type(sample, "a".repeat(40) + "b"); await wait(30);
const t0 = performance.now();
type(pat, "(a+)+$"); pat.value = "(a+)+$b"; pat.dispatchEvent(new Event("input", { bubbles: true })); await wait(0);
pat.value = "(a+)+$"; pat.dispatchEvent(new Event("input", { bubbles: true })); await wait(0);
const ms = performance.now() - t0;
await wait(30);
const warns = [...c.querySelectorAll(".ui-rxt-warn")].map((w) => w.textContent);
if (!warns.some((w) => w.startsWith("Gave up after 500,000 steps"))) return `no giving up: ${warns}`;
if (!warns.some((w) => w.startsWith("A repeat inside a repeat, at column 1:"))) return `no warning on the nested repeat: ${warns}`;
if (ms > 2500) return `the guard took ${ms} ms`;
if (count() !== "0 or more matches") return count();
// A safe pattern on a long text is not cut, a text past the cap is, and says so.
type(pat, "\\d+"); type(sample, "12 ".repeat(1000)); await wait(60);
if (count() !== "1000 matches") return count();
if (c.querySelectorAll("tbody tr").length !== 200 || !c.textContent.includes("The first 200 are listed and marked.")) return `the list's cap: ${c.querySelectorAll("tbody tr").length}`;
type(pat, "x"); type(sample, "x".repeat(25000)); await wait(100);
if (!c.textContent.includes("Only the first 20,000 characters are tested; 5,000 are left out.")) return "the sample's cap";
// Replace.
type(pat, "(\\w)(\\w)"); type(sample, "ab cd"); type(rep, "$2$1-$$-$0-$"); await wait(40);
if (preview() !== "ba-$-ab-$ dc-$-cd-$") return preview();
type(rep, "$3"); await wait(40);
if (err() !== "Column 1: $3, but the pattern has 2 groups." || rep.getAttribute("aria-invalid") !== "true") return err();
type(rep, "x$<nope>"); await wait(40);
if (err() !== "Column 2: No group is named nope.") return err();
type(rep, "x$<nope"); await wait(40);
if (err() !== "Column 2: `$<` without its `>`.") return err();
type(rep, ""); await wait(30);
if (preview() !== undefined) return "an empty replacement shows no preview";
// Awkward: empty text, empty pattern, unicode, HTML in the sample.
type(pat, ""); type(sample, ""); await wait(40);
if (count() !== "1 match" || err()) return `the empty pattern on nothing: ${count()}`;
type(pat, "<b>"); type(sample, "<b>&amp;</b>"); await wait(40);
if (c.querySelector("mark b") || marks()[0] !== "<b>") return "the sample's markup must stay text";
if (pat.name !== "pattern" || sample.name !== "sample" || rep.name !== "replacement" || pat.labels[0].textContent !== "Pattern") return "the fields' names and labels";
// on_change.
const live = $("#regex-tester-demo-live-pattern");
const note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
const lc = $("#regex-tester-demo-live");
if (lc.querySelector("[name=flag_i]").checked !== true || lc.querySelector(".ui-rxt-count").textContent !== "2 matches") return `the flag from its prop: ${lc.querySelector(".ui-rxt-count").textContent}`;
type(live, "ord"); await wait(40);
if (note() !== 'on_change: 3 found with flags "i".') return note();
type(live, "ord("); await wait(40);
if (note() !== "on_change: column 4 is wrong.") return note();
