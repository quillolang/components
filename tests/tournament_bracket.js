const area = $("#tournament-bracket-demo-entrants");
const c = area.closest(".ui-tourney");
const rounds = (box = c) => [...box.querySelectorAll(".ui-tourney-round")];
const match = (r, i, box = c) => rounds(box)[r].querySelectorAll(".ui-tourney-match")[i];
const seats = (m) => [...m.querySelectorAll(".ui-tourney-seat")];
const who = (m) => seats(m).map((s) => s.querySelector(".ui-tourney-who").textContent).join(" v ");
const seed = (m) => seats(m).map((s) => s.querySelector(".ui-tourney-seed").textContent).join("v");
const status = (box = c) => box.querySelector(".ui-tourney-status").textContent;
const said = (box = c) => box.querySelector("[role=status]")?.textContent;
const hit = async (r, i, s, box = c) => { seats(match(r, i, box))[s].click(); await wait(60); };
const results = (box = c) => box.querySelector('input[type=hidden]').value;
// Six entrants in a bracket of eight: seeds 1 and 2 have byes; 4 v 5, 3 v 6.
if (rounds().map((r) => r.querySelector("h4").textContent).join() !== "Quarterfinals,Semifinals,Final") return "round names";
if (who(match(0, 0)) !== "Ada v Bye" || who(match(0, 1)) !== "Di v Ed" || who(match(0, 2)) !== "Bo v Bye" || who(match(0, 3)) !== "Cy v Flo") return `the first round: ${[0, 1, 2, 3].map((i) => who(match(0, i)))}`;
if (seed(match(0, 1)) !== "4v5" || seed(match(0, 3)) !== "3v6") return "seeds";
if (who(match(1, 0)) !== "Ada v Winner of match 1" || who(match(1, 1)) !== "Bo v Winner of match 2") return `byes carry through: ${who(match(1, 0))} / ${who(match(1, 1))}`;
if (who(match(2, 0)) !== "Winner of match 3 v Winner of match 4") return who(match(2, 0));
if (!c.textContent.includes("The top 2 seeds have byes") || status() !== "0 of 5 matches decided") return status();
if (!seats(match(1, 0))[0].disabled || seats(match(0, 0))[0].disabled !== true) return "a match not ready, or a bye, takes no click";
// Play it through.
await hit(0, 1, 1);
if (who(match(1, 0)) !== "Ada v Ed" || status() !== "1 of 5 matches decided" || said() !== "Ed moves on.") return `Ed: ${who(match(1, 0))} ${status()} ${said()}`;
if (seats(match(0, 1))[1].getAttribute("aria-pressed") !== "true" || seats(match(0, 1))[0].getAttribute("aria-pressed") !== "false") return "aria-pressed";
await hit(0, 3, 0); await hit(1, 0, 1); await hit(1, 1, 1); await hit(2, 0, 0);
if (status() !== "Champion: Ed" || results() !== '{"0-1":5,"0-3":3,"1-0":5,"1-1":3,"2-0":5}') return `to the end: ${status()} ${results()}`;
// A changed result clears the path to the final, but not the other side.
await hit(0, 1, 0);
if (who(match(1, 0)) !== "Ada v Di") return who(match(1, 0));
if (said() !== "Di moves on. Cleared 2 later results: Semifinals, Final.") return `changing: ${said()}`;
if (status() !== "3 of 5 matches decided" || results() !== '{"0-1":4,"0-3":3,"1-1":3}') return `after changing: ${status()} ${results()}`;
if (who(match(2, 0)) !== "Winner of match 3 v Cy") return who(match(2, 0));
// Clicking a winner again undoes it, with what followed.
await hit(1, 0, 0); await hit(2, 0, 1);
if (status() !== "Champion: Cy") return status();
await hit(1, 0, 0);
if (said() !== "Ada's win is undone. Cleared 1 later result: Final." || results() !== '{"0-1":4,"0-3":3,"1-1":3}') return `undo: ${said()} ${results()}`;
// The field's size and the pairing for sixteen.
const pairs = (n) => { type(area, Array.from({ length: n }, (_, i) => `P${i + 1}`).join("\n")); };
pairs(16); await wait(120);
if (said() !== "The number of entrants changed, so the results were cleared.") return `a new size: ${said()}`;
const firsts = [...rounds()[0].querySelectorAll(".ui-tourney-match")].map(seed).join(" ");
if (firsts !== "1v16 8v9 4v13 5v12 2v15 7v10 3v14 6v11") return `sixteen: ${firsts}`;
if (rounds()[0].querySelector("h4").textContent !== "Round 1" || status() !== "0 of 15 matches decided") return status();
pairs(5); await wait(120);
// Five in eight: three byes, 4 v 5 the only first-round match.
if (seed(match(0, 1)) !== "4v5" || who(match(1, 1)) !== "P2 v P3" || status() !== "0 of 4 matches decided" || !c.textContent.includes("top 3 seeds")) return `five: ${who(match(1, 1))} ${status()}`;
pairs(3); await wait(120);
if (who(match(0, 0)) !== "P1 v Bye" || who(match(0, 1)) !== "P2 v P3" || !c.textContent.includes("The top seed has a bye")) return `three: ${who(match(0, 1))}`;
pairs(2); await wait(120);
if (rounds().length !== 1 || who(match(0, 0)) !== "P1 v P2") return "two";
pairs(1); await wait(120);
if (status() !== "Champion: P1" || rounds().length) return `one: ${status()}`;
pairs(0); await wait(120);
if (status() !== "Add entrants to make the draw.") return status();
// Awkward input: blanks, numbers in front, repeats, too many.
type(area, "  \n1. Ada\n2) Bo\n\nada\n 李 \n"); await wait(120);
if (who(match(0, 0)) !== "Ada v Bye" || who(match(0, 1)) !== "Bo v 李") return `tidying: ${who(match(0, 1))}`;
if (!c.querySelector(".ui-tourney-error")?.textContent.includes("ada is on the list twice")) return "a name twice";
pairs(130); await wait(200);
if (!c.querySelector(".ui-tourney-error")?.textContent.includes("Only the first 128 entrants are drawn: 2 left out") || status() !== "0 of 127 matches decided") return `the cap: ${status()}`;
// A new name in the same place keeps the results.
type(area, "A\nB\nC\nD"); await wait(120); await hit(0, 0, 0); type(area, "Ann\nB\nC\nD"); await wait(120);
if (status() !== "1 of 3 matches decided" || who(match(1, 0)) !== "Ann v Winner of match 2") return `a rename: ${status()} ${who(match(1, 0))}`;
// Results given at the start, the callback, and a name prefix.
const four = $("#tournament-bracket-demo-four-entrants").closest(".ui-tourney");
if (status(four) !== "1 of 3 matches decided" || who(match(1, 0, four)) !== "Rovers v Winner of match 2") return `given results: ${status(four)}`;
if ($("#tournament-bracket-demo-four-entrants").name !== "club_entrants" || four.querySelector("input[type=hidden]").name !== "club_results") return "name prefix";
await hit(0, 1, 0, four); await hit(1, 0, 1, four);
if (status(four) !== "Champion: United") return status(four);
const note = four.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "on_change: 3 of 3 decided, champion United.") return note;
