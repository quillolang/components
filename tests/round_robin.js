const area = $("#round-robin-demo-teams");
const c = area.closest(".ui-rrobin");
const rounds = (box = c) => [...box.querySelectorAll(".ui-rrobin-round")];
const games = (r) => [...r.querySelectorAll(".ui-rrobin-game")].map((g) => `${g.querySelector(".ui-rrobin-home").textContent}-${g.querySelector(".ui-rrobin-away").textContent}`);
const all = (box = c) => rounds(box).map((r) => games(r).join(" ")).join(" / ");
const order = (box = c) => [...box.querySelectorAll("tbody tr")].map((r) => r.children[1].textContent).join(" ");
const row = (t, box = c) => [...box.querySelectorAll("tbody tr")].find((r) => r.children[1].textContent === t);
const cells = (t, box = c) => [...row(t, box).children].slice(2, 11).map((x) => x.textContent).join(" ");
const why = (t, box = c) => row(t, box).children[11].textContent;
const note = (box = c) => box.querySelector("[aria-live]").textContent;
const score = async (h, a, x, y, box = c) => {
    const g = [...box.querySelectorAll(".ui-rrobin-game")].find((e) => e.querySelector(".ui-rrobin-home").textContent === h && e.querySelector(".ui-rrobin-away").textContent === a);
    const [p, q] = g.querySelectorAll("input");
    type(p, String(x)); type(q, String(y)); await wait(30);
};
// Four teams: first stays, the rest turn. The classic list, with home and away within one.
if (all() !== "Ada-Di Bo-Cy / Cy-Ada Di-Bo / Ada-Bo Cy-Di") return `four: ${all()}`;
if (note() !== "0 of 6 games played, over 3 rounds. Every team has 1 or 2 games at home.") return note();
if ([..."Ada Bo Cy Di".split(" ")].map((t) => row(t).children[10].textContent).join() !== "2/1,1/2,2/1,1/2") return "home and away";
if (order() !== "Ada Bo Cy Di" || why("Ada") !== "") return `no games: ${order()}`;
// Standings. A 2-0 D, B 1-1 C, C 0-1 A, D 2-1 B, A 0-1 B, C 3-0 D.
await score("Ada", "Di", 2, 0); await score("Bo", "Cy", 1, 1); await score("Cy", "Ada", 0, 1);
await score("Di", "Bo", 2, 1); await score("Ada", "Bo", 0, 1); await score("Cy", "Di", 3, 0); await wait(60);
if (order() !== "Ada Cy Bo Di") return `the order: ${order()}`;
if (cells("Ada") !== "3 2 0 1 3 1 +2 6 2/1" || cells("Bo") !== "3 1 1 1 3 3 0 4 1/2" || cells("Cy") !== "3 1 1 1 4 2 +2 4 2/1" || cells("Di") !== "3 1 0 2 2 6 -4 3 1/2") return `figures: ${cells("Ada")} | ${cells("Bo")} | ${cells("Cy")} | ${cells("Di")}`;
if (why("Cy") !== "Ahead of Bo on goal difference.") return `why: ${why("Cy")}`;
if (note() !== "6 of 6 games played, over 3 rounds. Every team has 1 or 2 games at home.") return note();
// B beats C 1-0: A and B level on 6. B won their game, A has the better difference: the rule decides it.
await score("Bo", "Cy", 1, 0); await wait(60);
if (order() !== "Bo Ada Cy Di" || why("Bo") !== "Ahead of Ada on the games between them.") return `head to head: ${order()} / ${why("Bo")}`;
const rule = $("#round-robin-demo-rule");
rule.value = "difference"; rule.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
if (order() !== "Ada Bo Cy Di" || why("Ada") !== "Ahead of Bo on goal difference.") return `difference first: ${order()} / ${why("Ada")}`;
rule.value = "head"; rule.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
// Level on everything is said to be so.
await score("Ada", "Bo", 1, 1); await score("Bo", "Cy", 1, 1); await score("Di", "Bo", 1, 1); await score("Ada", "Di", 1, 1); await score("Cy", "Ada", 1, 1); await score("Cy", "Di", 1, 1); await wait(60);
if (order() !== "Ada Bo Cy Di" || why("Ada") !== "Level with Bo on everything: listed order.") return `all level: ${order()} / ${why("Ada")}`;
// Three level on points in a ring, each beating one: their mini league is level on points, and its goal difference
// sorts them (Ada +1, Cy 0, Bo -1), though Cy has the best overall.
await score("Ada", "Bo", 2, 0); await score("Bo", "Cy", 1, 0); await score("Cy", "Ada", 1, 0);
await score("Ada", "Di", 1, 0); await score("Di", "Bo", 0, 1); await score("Cy", "Di", 3, 0); await wait(60);
if (order() !== "Ada Cy Bo Di" || why("Ada") !== "Ahead of Cy on goal difference in the games between them." || why("Cy") !== "Ahead of Bo on goal difference in the games between them.") return `a ring of three: ${order()} / ${why("Ada")} / ${why("Cy")}`;
if (why("Bo") !== "") return `Bo is ahead of Di on points: ${why("Bo")}`;
// Half a score does not count, and is no error; a bad one names itself.
const first = c.querySelector(".ui-rrobin-game input");
type(first, ""); await wait(60);
if (note() !== "5 of 6 games played, over 3 rounds. Every team has 1 or 2 games at home.") return `half a score: ${note()}`;
type(first, "-1"); await wait(60);
if (c.querySelector(".ui-rrobin-error")?.textContent !== "Round 1, Ada v Di: a score is a whole number from 0 to 999." || first.getAttribute("aria-invalid") !== "true") return `a bad score: ${c.querySelector(".ui-rrobin-error")?.textContent}`;
type(first, "x"); await wait(60);
if (!c.querySelector(".ui-rrobin-error") ) return "text as a score";
type(first, "1"); await wait(60);
// A double round: the same rounds the other way about, and scores kept.
$("#round-robin-demo-double").click(); await wait(100);
if (all() !== "Ada-Di Bo-Cy / Cy-Ada Di-Bo / Ada-Bo Cy-Di / Di-Ada Cy-Bo / Ada-Cy Bo-Di / Bo-Ada Di-Cy") return `double: ${all()}`;
if (!note().startsWith("6 of 12 games played, over 6 rounds. Every team has 3 at home and 3 away.")) return note();
$("#round-robin-demo-double").click(); await wait(100);
// Odd numbers rest one team each round, and every team is even.
type(area, "A\nB\nC"); await wait(100);
if (all() !== "A-B / C-A / B-C") return `three: ${all()}`;
if (rounds().map((r) => r.querySelector(".ui-rrobin-rest")?.textContent).join() !== "C rests this round.,B rests this round.,A rests this round.") return "rests";
if (!note().endsWith("Every team has 1 at home and 1 away.")) return note();
// Larger fields: every pair once, nobody twice in a round, balance within one.
for (const n of [6, 7, 8, 9, 12, 13, 24]) {
    const names = Array.from({ length: n }, (_, i) => `T${i}`);
    type(area, names.join("\n")); await wait(n > 12 ? 300 : 120);
    const seen = new Set(), homes = {};
    for (const r of rounds()) {
        const inRound = new Set();
        for (const g of games(r)) {
            const [h, a] = g.split("-");
            const k = [h, a].sort().join("|");
            if (seen.has(k)) return `${n} teams: ${k} meet twice`;
            seen.add(k);
            if (inRound.has(h) || inRound.has(a)) return `${n} teams: twice in a round: ${g}`;
            inRound.add(h); inRound.add(a);
            homes[h] = (homes[h] ?? 0) + 1;
        }
        if (inRound.size !== n - n % 2) return `${n} teams: a round of ${inRound.size}`;
    }
    if (seen.size !== n * (n - 1) / 2) return `${n} teams: ${seen.size} games`;
    const h = names.map((t) => homes[t] ?? 0);
    if (Math.max(...h) - Math.min(...h) > (n % 2 ? 0 : 1)) return `${n} teams: homes ${h}`;
    if (rounds().length !== (n % 2 ? n : n - 1)) return `${n} teams: ${rounds().length} rounds`;
}
// Awkward lists.
type(area, ""); await wait(100);
if (!c.textContent.includes("Add at least two teams") || rounds().length || c.querySelector("table")) return "no teams";
type(area, "Solo"); await wait(100);
if (!c.textContent.includes("Add at least two teams")) return "one team";
type(area, "  A \n\n a\n李\n"); await wait(100);
if (all() !== "A-李" || !c.querySelector(".ui-rrobin-error")?.textContent.includes("a is on the list twice")) return `tidying: ${all()}`;
type(area, Array.from({ length: 26 }, (_, i) => `T${i}`).join("\n")); await wait(300);
if (!c.querySelector(".ui-rrobin-error")?.textContent.includes("Only the first 24 teams are drawn: 2 left out")) return "the cap";
// Points as props, a bye, the callback and a name prefix.
const five = $("#round-robin-demo-five-teams").closest(".ui-rrobin");
if (rounds(five).length !== 5 || rounds(five)[0].querySelector(".ui-rrobin-rest").textContent !== "Ed rests this round.") return `five: ${rounds(five).length}`;
if (!note(five).endsWith("Every team has 2 at home and 2 away.")) return note(five);
if ($("#round-robin-demo-five-teams").name !== "league_teams" || !five.querySelector(".ui-rrobin-game input").name.startsWith("league_score_1_0_")) return "name prefix";
const g = games(rounds(five)[0])[0].split("-");
await score(g[0], g[1], 3, 1, five); await wait(60);
if (cells(g[0], five).split(" ")[7] !== "2") return `two points for a win: ${cells(g[0], five)}`;
if (five.closest(".demo-stack").querySelector(".demo-note").textContent !== `on_change: 1 of 10 played, ${g[0]} first.`) return five.closest(".demo-stack").querySelector(".demo-note").textContent;
