const c = $("#ranked-vote-demo-ballots").closest(".ui-rcv");
const result = (box = c) => box.querySelector(".ui-rcv-result").textContent;
const rounds = (box = c) => [...box.querySelectorAll(".ui-rcv-round")];
const tally = (r) => [...r.querySelectorAll(".ui-rcv-line")].map((l) => `${l.querySelector(".ui-rcv-name").textContent} ${l.querySelector(".ui-rcv-count").textContent.split(" ")[0]}`).join(", ");
const move = (r) => r.querySelector(".ui-rcv-move")?.textContent;
const need = (r) => r.querySelector(".ui-rcv-need").textContent;
const say = async (text, names = "") => { type($("#ranked-vote-demo-names"), names); type($("#ranked-vote-demo-ballots"), text); await wait(80); };
const problems = () => [...c.querySelectorAll(".ui-rcv-problems li")].map((l) => l.textContent);
// The Tennessee capital example: Knoxville wins from third.
let r = rounds();
if (r.length !== 3) return `rounds: ${r.length}`;
if (tally(r[0]) !== "Memphis 42, Nashville 26, Knoxville 17, Chattanooga 15") return `round 1: ${tally(r[0])}`;
if (move(r[0]) !== "Chattanooga goes out: 15 to Knoxville.") return `round 1's move: ${move(r[0])}`;
if (tally(r[1]) !== "Memphis 42, Knoxville 32, Nashville 26" || move(r[1]) !== "Nashville goes out: 26 to Knoxville.") return `round 2: ${tally(r[1])} ${move(r[1])}`;
if (tally(r[2]) !== "Knoxville 58, Memphis 42") return `round 3: ${tally(r[2])}`;
if (need(r[0]) !== "100 ballots in play, 51 to win") return need(r[0]);
if (result() !== "Knoxville wins in round 3, with 58 of the 100 ballots in play (58.0%). 0 ballots exhausted.") return result();
if (r[1].querySelector(".ui-rcv-gain").textContent !== "+15") return "the gain";
if ($("#ranked-vote-demo-ballots").name !== "ballots" || $("#ranked-vote-demo-rule").name !== "tie_rule" || $("#ranked-vote-demo-names").name !== "candidates") return "field names";
// A first-round majority.
await say("3: A > B\n2: B > A");
r = rounds();
if (r.length !== 1 || result() !== "A wins in round 1, with 3 of the 5 ballots in play (60.0%). 0 ballots exhausted.") return `a majority: ${result()}`;
// Exhausted ballots leave the ballots in play, and lower the line: 4 A, 3 B, 2 C alone, 1 C > B.
await say("4: A\n3: B\n2: C\n1: C > B");
r = rounds();
if (tally(r[0]) !== "A 4, B 3, C 3") return `exhausted, round 1: ${tally(r[0])}`;
if (need(r[0]) !== "10 ballots in play, 6 to win") return need(r[0]);
// B and C level on 3; in round 1 there is nothing earlier, so the one listed last (C) goes.
if (move(r[0]) !== "B and C tied on 3. C goes out: 1 to B and 2 exhausted. Broken by listed last.") return `the tie: ${move(r[0])}`;
if (tally(r[1]) !== "A 4, B 4") return `round 2: ${tally(r[1])}`;
if (need(r[1]) !== "8 ballots in play, 5 to win, 2 exhausted") return need(r[1]);
// A and B level on 4; looking back, B had fewer in round 1 and goes, and all four of its ballots run out.
if (move(r[1]) !== "A and B tied on 4. B goes out: 4 exhausted. Broken by fewest in round 1.") return move(r[1]);
if (result() !== "A wins in round 3, with 4 of the 4 ballots in play (100.0%). 6 ballots exhausted. The tie rule decided this.") return `level at the end: ${result()}`;
// Tie rules. 5 A, 2 B, 3 C, 2 D > B, 1 D > C. Round 1: A 5, C 3, D 3, B 2: B goes, its 2 run out. Round 2: C and D level all along.
await say("5: A\n2: B\n3: C\n2: D > B\n1: D > C");
r = rounds();
if (move(r[0]) !== "B goes out: 2 exhausted.") return move(r[0]);
if (move(r[1]) !== "C and D tied on 3. D goes out: 1 to C and 2 exhausted. Broken by listed last.") return `back, level all along: ${move(r[1])}`;
// Looking back separates a later tie.
await say("6: A\n4: B\n3: C\n1: D > C\n1: E > B\n1: F > C");
// Round 1: A 6, B 4, C 3, D 1, E 1, F 1: F listed last, goes, 1 to C. Round 2: A 6, B 4, C 4, D 1, E 1. E goes (D, E tied, level so far), 1 to B.
// Round 3: A 6, B 5, C 4, D 1: D out, 1 to C. Round 4: A 6, B 5, C 5: B and C tied; round 3 had C fewer: C goes.
r = rounds();
if (r.length !== 5) return `rounds in the long tie: ${r.length} / ${result()}`;
if (!move(r[3]).startsWith("B and C tied on 5. C goes out") || !move(r[3]).includes("Broken by fewest in round 3")) return `looking back: ${move(r[3])}`;
// The first-preference rule: the same tie by fewest first preferences: B 4, C 3, so C too; listed: C is last of the two.
const rule = $("#ranked-vote-demo-rule");
rule.value = "first"; rule.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
if (!c.querySelector(".ui-rcv-rule").textContent.includes("fewest first preferences goes out")) return "the rule is not stated";
if (!move(rounds()[3]).includes("Broken by fewest first preferences")) return `first: ${move(rounds()[3])}`;
// Here the rules part: B and C level on 3 with B first listed, C having fewer first preferences (1 against 2).
await say("2: B\n1: C\n2: A\n2: D > C\n1: E > B\n", "A, B, C, D, E");
// Round 1: B 2, A 2, D 2, C 1, E 1: of C and E, level on first preferences, E (listed last) goes, 1 to B.
r = rounds();
if (move(r[0]) !== "C and E tied on 1. E goes out: 1 to B. Broken by listed last.") return `first, level: ${move(r[0])}`;
rule.value = "listed"; rule.dispatchEvent(new Event("change", { bubbles: true })); await wait(80);
if (!c.querySelector(".ui-rcv-rule").textContent.includes("the one listed last goes out")) return "the listed rule";
// Bad input.
await say("");
if (result() !== "No ballots to count yet." || rounds().length) return result();
await say("   \n\n");
if (result() !== "No ballots to count yet.") return "only spaces";
await say("A > A > B\nB > Z\n> >\n1: \n2: A", "A, B");
const p = problems();
if (p[0] !== "Line 1: A is ranked twice; the first counts." || p[1] !== 'Line 2: "Z" is not a candidate, so it is left off the ballot.') return `problems: ${p}`;
// "> >" and "1: " name no one: B > Z counts for B, A > B for A, 2 for A.
if (!result().includes("2 ballots named no candidate")) return `spoiled: ${result()}`;
// Names match whatever their case, and a list of names keeps out what is not on it.
await say("ada > BO\n2 x bo\n3 * ADA", "Ada, Bo");
if (!result().startsWith("Ada wins in round 1, with 4 of the 6")) return result();
await say("Ада > 李\n李 > Ада\n李");
if (!result().startsWith("李 wins in round 1, with 2 of the 3")) return `unicode: ${result()}`;
await say(Array.from({ length: 60 }, (_, i) => `N${i}`).join("\n"));
if (!problems()[0].includes("60 candidates: 50 is the most") || rounds().length) return `too many: ${problems()}`;
const huge = Array.from({ length: 2500 }, (_, i) => `A${i % 7} > A${(i + 3) % 7} > A${(i + 5) % 7}`).join("\n");
const t0 = performance.now(); await say(huge);
if (performance.now() - t0 > 1500) return `slow: ${performance.now() - t0}`;
if (problems()[0] !== "Only the first 2000 lines are read.") return `the cap: ${problems()}`;
// Ballots given as lists, and the callback.
const m = $("#ranked-vote-demo-club-ballots").closest(".ui-rcv");
if ($("#ranked-vote-demo-club-ballots").value !== "4: Ada > Bo\n3: Bo > Ada\n2: Cy\nCy > Bo") return $("#ranked-vote-demo-club-ballots").value;
// 4 Ada, 3 Bo, 3 Cy: Bo and Cy level, also on first preferences, so Cy goes: 1 to Bo, 2 exhausted. Ada 4, Bo 4 of 8:
// Ada and Bo level; on first preferences Bo has fewer (3), and goes: 3 to Ada, 1 exhausted. Ada has 7 of 7.
if (result(m) !== "Ada wins in round 3, with 7 of the 7 ballots in play (100.0%). 3 ballots exhausted. The tie rule decided this.") return `lists: ${result(m)}`;
type($("#ranked-vote-demo-club-ballots"), "4: Ada\n3: Bo\n2: Cy > Bo"); await wait(80);
if (m.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: Bo in 2 rounds, 0 exhausted.") return m.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#ranked-vote-demo-club-ballots").name !== "club_ballots") return "name prefix";
