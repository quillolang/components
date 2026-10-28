const figs = $$("figure.ui-lbc");
if (figs.length !== 3) return `expected 3 line break charts, found ${figs.length}`;
if (/NaN|Infinity|undefined/.test(root.innerHTML)) return "a chart has NaN, Infinity or undefined in it";
const three = $("#line_break_chart-demo-three figure"), two = $("#line_break_chart-demo-two figure"), plain = $("#line_break_chart-demo-closes figure");
const num = (s) => Number(s.replace(/[$,]/g, ""));
const lines = (f) => [...f.querySelectorAll("table.ui-sr tbody tr")].map((r) => [...r.querySelectorAll("td")].map((td) => td.textContent));
// 10 to 13 rises in three lines; 12.5, 11.5 and 10.8 do not break the last three; 13.4 goes on up;
// 9.5 breaks the low of the last three (12, 13 and 13.4's lines start at 11, 12, 13), and 9 goes on down.
const got = lines(plain).map((r) => r.slice(0, 3).join(" "));
const want = ["Up 10.00 11.00", "Up 11.00 12.00", "Up 12.00 13.00", "Up 13.00 13.40", "Down 13.00 9.50", "Down 9.50 9.00"];
if (got.join("|") !== want.join("|")) return `the closes made: ${got.join(" | ")}`;
if (plain.querySelector(".ui-lbc-meta").textContent !== "3-line break · 6 lines") return `meta: ${plain.querySelector(".ui-lbc-meta").textContent}`;
const t = lines(three), w = lines(two);
if (t.length < 5 || three.querySelectorAll(".ui-lbc-col").length !== t.length) return "not a column per line";
if (w.length < t.length) return `a two-line break (${w.length} lines) turns less often than three (${t.length})`;
for (let i = 1; i < t.length; i++) {
    const [d, from] = [t[i][0], num(t[i][1])], [pd, pfrom, pto] = [t[i - 1][0], num(t[i - 1][1]), num(t[i - 1][2])];
    const want = pd === d ? pto : pfrom;
    if (Math.abs(from - want) > 0.001) return `line ${i + 1} starts at ${from}, not ${want}`;
    if (three.querySelectorAll(".ui-lbc-col")[i].classList.contains("ui-lbc-up") !== (d === "Up")) return `line ${i + 1}'s colour`;
}
// Taller moves are taller boxes.
const cols = [...three.querySelectorAll(".ui-lbc-col")];
const size = (i) => Math.abs(num(t[i][2]) - num(t[i][1]));
const hgt = (i) => cols[i].querySelector(".ui-lbc-box").getBoundingClientRect().height;
const big = t.map((_, i) => i).reduce((a, i) => (size(i) > size(a) ? i : a), 0), small = t.map((_, i) => i).reduce((a, i) => (size(i) < size(a) ? i : a), 0);
if (hgt(big) <= hgt(small)) return "a bigger move is not a taller box";
const tip = cols[1].querySelector(".ui-lbc-tip").textContent;
if (!tip.includes(`line 2`) || !tip.includes(`To${t[1][2]}`)) return `line 2's details: ${tip}`;
if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
