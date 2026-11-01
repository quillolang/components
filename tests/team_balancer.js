const area = $("#team-balancer-demo-people"), together = $("#team-balancer-demo-together"), apart = $("#team-balancer-demo-apart"), count = $("#team-balancer-demo-count");
const c = area.closest(".ui-teambal");
const teams = (box = c) => [...box.querySelectorAll(".ui-teambal-team")].map((t) => ({
    name: t.querySelector(".ui-teambal-name").textContent, total: t.querySelector(".ui-teambal-total").textContent,
    members: [...t.querySelectorAll(".ui-teambal-members li span:first-child")].map((s) => s.textContent) }));
const totals = (box = c) => teams(box).map((t) => Number(t.total)).sort((a, b) => a - b);
const team_of = (n, box = c) => teams(box).findIndex((t) => t.members.includes(n));
const summary = (box = c) => box.querySelector(".ui-teambal-summary")?.textContent;
const error = () => c.querySelector(".ui-teambal-error")?.textContent;
const notes = () => [...c.querySelectorAll(".ui-teambal-problems li")].map((l) => l.textContent);
const set = async (p, n, t = "", a = "") => { type(together, t); type(apart, a); type(area, p); type(count, String(n)); await wait(100); };
const sig = () => teams().map((t) => [...t.members].sort().join()).sort().join("|");
// The demo: nine people into three, Ada with Ivy, Bo apart from Cy. The ratings add to 50.5, so 16.83 on average.
let t = teams();
if (t.length !== 3 || t.some((x) => x.members.length !== 3)) return `three of three: ${JSON.stringify(t)}`;
if (team_of("Ada") !== team_of("Ivy") || team_of("Bo") === team_of("Cy")) return `the rules at the start: ${JSON.stringify(t)}`;
if (Math.abs(totals().reduce((a, b) => a + b) - 50.5) > 1e-9) return `nobody lost: ${totals()}`;
if (!summary().includes("16.83 on average") || !summary().includes("All 2 rules are kept")) return summary();
if (Math.max(...totals()) - Math.min(...totals()) > 1) return `a poor balance: ${totals()}`;
// Answers known by hand: 1 to 6 into two is 10 and 11, into three is 7, 7 and 7.
const six = "A, 1\nB, 2\nC, 3\nD, 4\nE, 5\nF, 6";
await set(six, 2);
if (totals().join() !== "10,11" || !summary().startsWith("Spread 1 between")) return `two teams: ${totals()} / ${summary()}`;
await set(six, 3);
if (totals().join() !== "7,7,7" || !summary().startsWith("Spread 0 between")) return `three teams: ${totals()} / ${summary()}`;
// Odd numbers: 7 into 3 gives 3, 2 and 2.
await set("A 5\nB 5\nC 5\nD 5\nE 5\nF 5\nG 5", 3);
if (teams().map((x) => x.members.length).sort().join() !== "2,2,3") return `sizes: ${teams().map((x) => x.members.length)}`;
// Decimals stay exact: 0.1 + 0.2 is 0.3, against 0.3.
await set("A 0.1\nB 0.2\nC 0.3", 2);
if (![...c.querySelectorAll(".ui-teambal-total")].some((e) => e.textContent === "0.3") || teams().map((x) => x.total).includes("0.30000000000000004")) return `decimals: ${teams().map((x) => x.total)}`;
// Rules bind, even where they cost balance: A and B, the two best, together, in two teams of two: 9+8 against 2+1.
await set("A 9\nB 8\nC 2\nD 1", 2, "A, B");
if (totals().join() !== "3,17" || !summary().startsWith("Spread 14 between") || !summary().includes("The 1 rule is kept")) return `together: ${totals()} / ${summary()}`;
await set("A 9\nB 8\nC 2\nD 1", 2, "", "A, D\nB, C");
// A with C, B with D: 11 and 9, and no other split keeps both.
if (team_of("A") !== team_of("C") || totals().join() !== "9,11" || !summary().includes("All 2 rules")) return `apart: ${JSON.stringify(teams())}`;
// A group can ride with others: three together in teams of three.
await set("A 9\nB 8\nC 7\nD 3\nE 2\nF 1", 2, "A, B\nB, C");
if (team_of("A") !== team_of("C") || totals().join() !== "6,24") return `chained: ${totals()}`;
// Reshuffle: another split, every rule kept each time.
await set("A 5\nB 5\nC 5\nD 5\nE 5\nF 5\nG 5\nH 5", 2, "A, B", "C, D\nE, F");
const seen = new Set([sig()]);
const button = c.querySelector(".ui-teambal-shuffle");
for (let i = 0; i < 6; i++) {
    const was = sig();
    button.click(); await wait(100);
    if (sig() === was) return "reshuffle gave the same split";
    if (team_of("A") !== team_of("B") || team_of("C") === team_of("D") || team_of("E") === team_of("F")) return `a rule broken by reshuffling: ${sig()}`;
    if (teams().some((x) => x.members.length !== 4)) return "uneven after reshuffling";
    seen.add(sig());
}
if (seen.size < 3) return `few splits: ${seen.size}`;
if (c.querySelector("[role=status]").textContent !== "Reshuffled, under the same rules.") return "said nothing";
// The only split: reshuffling says so.
await set("A 1\nB 2", 2);
button.click(); await wait(100);
if (!c.querySelector("[role=status]")?.textContent.startsWith("No other split came up") ) return "one split";
// Rules that cannot be met.
await set(six, 2, "", "A, B, C");
if (error() !== "A, B and C must all be apart, which takes 3 teams, and there are 2." || teams().length) return `apart: ${error()}`;
await set(six, 2, "A, B, C, D");
if (error() !== "A, B, C and D must stay together, but a team holds at most 3.") return `too many together: ${error()}`;
await set(six, 2, "A, B", "B, A");
if (error() !== "B and A must be kept together and kept apart: drop one rule.") return `both: ${error()}`;
await set(six, 2, "A, B\nB, C", "A, C");
if (!error()?.includes("kept together and kept apart")) return `through a third: ${error()}`;
// A triangle of conflicts through groups: A+B apart from C+D, E+F apart from both, in two teams.
await set(six, 2, "A, B\nC, D\nE, F", "A, C\nC, E\nA, E");
if (error() !== "No split into 2 even teams keeps every rule: try fewer rules or another number of teams.") return `no line says it, but no split works: ${error()}`;
if (button.disabled !== true) return "reshuffle with no split";
await set("A 1\nB 1\nC 1\nD 1\nE 1\nF 1", 3, "A, B, C");
if (error() !== "A, B and C must stay together, but a team holds at most 2.") return error();
// Bad input.
await set("", 2);
if (error() !== "Add people to make teams.") return `empty: ${error()}`;
await set("   \n  ", 2);
if (error() !== "Add people to make teams.") return `spaces: ${error()}`;
await set(six, 0);
if (error() !== "There must be at least one team." || count.getAttribute("aria-invalid") !== "true") return `no teams: ${error()}`;
await set(six, "abc");
if (error() !== "There must be at least one team.") return `text as teams: ${error()}`;
await set(six, 9);
if (error() !== "There are 9 teams for 6 people: fewer teams, or more people.") return error();
await set(six, 25);
if (error() !== "20 teams is the most this makes.") return error();
await set(six, 1);
if (totals().join() !== "21" || !summary().startsWith("Spread 0")) return `one team: ${totals()}`;
await set("Ann\nBob -3\nann, 4\nLi Wei: 7.5\n, 4\n李 6", 2, "Ann, Zed", "Bob, Ann");
const n = notes().join(" / ");
if (!n.includes("Line 1: Ann has no rating, so counts as 5") || !n.includes("Line 2: a rating is 0 or more, so Bob counts as 5") || !n.includes("Line 3: ann is already on the list") || !n.includes("Line 5: no name") || !n.includes("Keep together, line 1: no one called Zed")) return `notes: ${n}`;
if (teams().flatMap((x) => x.members).sort().join() !== "Ann,Bob,Li Wei,李") return `names: ${teams().flatMap((x) => x.members)}`;
// Size and speed: the cap, and a keystroke stays quick.
const many = Array.from({ length: 130 }, (_, i) => `P${i}, ${(i * 37) % 100}`).join("\n");
const t0 = performance.now();
type(together, ""); type(apart, ""); type(count, "8"); type(area, many); await wait(50);
if (performance.now() - t0 > 2500) return `slow: ${performance.now() - t0}`;
if (!notes().some((x) => x.includes("only the first 120 people"))) return `the cap: ${notes()}`;
if (teams().flatMap((x) => x.members).length !== 120 || Math.max(...totals()) - Math.min(...totals()) > 3) return `at the cap: ${totals()}`;
// Team names, a list of people, a callback and a name prefix. Ann 6 + Fay 1 = 7, the rest 14 to share: 10 and 11.
const box = $("#team-balancer-demo-six-people").closest(".ui-teambal");
if (teams(box).map((x) => x.name).join() !== "Reds,Blues" || team_of("Ann", box) !== team_of("Fay", box) || totals(box).join() !== "10,11") return `the live demo: ${JSON.stringify(teams(box))}`;
if ($("#team-balancer-demo-six-people").name !== "squad_people" || !JSON.parse(box.querySelector("input[type=hidden]").value)[0].name) return "name prefix or the result field";
type($("#team-balancer-demo-six-count"), "3"); await wait(120);
if (totals(box).join() !== "7,7,7" || box.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: a spread of 0.") return `on_change: ${totals(box)} ${box.closest(".demo-stack").querySelector(".demo-note").textContent}`;
