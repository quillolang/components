const c = $("#branching-survey-demo");
const q = () => c.querySelector(".ui-bsurvey-question")?.textContent;
const prog = () => c.querySelector("[data-progress]")?.textContent;
const pct = () => c.querySelector("[role=progressbar]")?.getAttribute("aria-valuenow");
const next = async () => { c.querySelector("button[type=submit]").click(); await wait(50); };
const back = async () => { c.querySelector("[data-back]").click(); await wait(50); };
const choose = (v) => c.querySelector(`input[value="${v}"]`).click();
const said = () => c.closest(".demo-stack").querySelector("[data-said]").textContent;
const err = () => c.querySelector(".ui-bsurvey-error")?.textContent ?? null;
if (c.querySelector(".ui-bsurvey-problems")) return `a good survey reports nothing: ${c.querySelector(".ui-bsurvey-problems").textContent}`;
// The longest ways from `used`, worked out by hand: used, score, problem, bookings, contact
// and used, score, liked, calendar, contact, 5 questions each, so at most 4 more.
if (q() !== "Have you used the new booking page?" || prog() !== "Question 1, at most 4 more after this." || pct() !== "0") return `start: ${q()} / ${prog()} / ${pct()}`;
// An answer is needed; the message clears when one is given.
await next();
if (err() !== "This one needs an answer." || q() !== "Have you used the new booking page?") return `no answer: ${err()}`;
if (c.querySelector("fieldset").getAttribute("aria-invalid") !== "true") return "the error marks the field";
choose("No"); await wait(40);
if (err() !== null) return "choosing clears the error";
await next();
// The short path: why_not, contact.
if (q() !== "What kept you away?" || prog() !== "Question 2, at most 1 more after this." || pct() !== "33") return `no: ${q()} / ${prog()} / ${pct()}`;
if (document.activeElement !== c.querySelector(".ui-bsurvey-question")) return "focus moves to the new question";
const box = c.querySelector("input[name=why_not]");
type(box, "No time"); await wait(30);
await back();
if (q() !== "Have you used the new booking page?" || !c.querySelector('input[value="No"]').checked) return `back keeps the answer: ${c.querySelector("input:checked")?.value}`;
await next();
if (c.querySelector("input[name=why_not]").value !== "No time") return "forward again keeps what was typed";
await back();
// A new answer takes the long path; progress goes back up as the path grows.
choose("Yes"); await wait(30);
await next();
if (q() !== "How easy was it?" || prog() !== "Question 2, at most 3 more after this." || pct() !== "20") return `yes: ${q()} ${prog()} ${pct()}`;
if (c.querySelector(".ui-bsurvey-help").textContent !== "1 is very hard, 5 is very easy.") return "the help";
const labels = [...c.querySelectorAll(".ui-bsurvey-choice")].map((l) => l.textContent.trim()).join();
if (labels !== "1,2,3,4,5") return `the scale: ${labels}`;
choose("4"); await wait(30);
await next();
if (q() !== "What did you like?") return `4 falls through: ${q()}`;
if (prog() !== "Question 3, at most 2 more after this.") return prog();
choose("Speed"); choose("Calendar"); await wait(40);
await next();
if (q() !== "Which calendar do you use?") return `a multi jumps when it holds: ${q()}`;
await back();
choose("Calendar"); await wait(30);
if (c.querySelector('input[value="Calendar"]').checked) return "unticked";
await next();
if (q() !== "May we contact you?") return `without Calendar: ${q()}`;
await back(); await back();
choose("2"); await wait(30);
await next();
if (q() !== "What went wrong?") return `a low score jumps: ${q()}`;
await next();
if (err() !== "This one needs an answer.") return err();
type(c.querySelector("input[name=problem]"), "   "); await wait(30);
await next();
if (err() !== "This one needs an answer.") return "spaces are no answer";
const box2 = c.querySelector("input[name=problem]");
type(box2, "The date picker"); await wait(30);
// Enter in a field goes on, as the form's submit.
c.querySelector("form").requestSubmit(); await wait(50);
if (q() !== "How many bookings a year do you make?") return q();
for (const [t, msg] of [["abc", "This needs a number."], ["-3", "The lowest is 0."], ["1e3", "This needs a number."]]) {
    type(c.querySelector("input[name=bookings]"), t); await wait(30);
    await next();
    if (err() !== msg) return `${t}: ${err()}`;
}
type(c.querySelector("input[name=bookings]"), "12"); await wait(30);
await next();
// bookings falls through to contact, next in the list.
if (q() !== "May we contact you?") return q();
await next();
// The summary: the path taken and nothing else.
if (q() !== "Your answers" || prog() !== "All done: check your answers." || pct() !== "100") return `end: ${q()} ${prog()} ${pct()}`;
const lines = () => [...c.querySelectorAll("[data-line]")].map((l) => `${l.dataset.line}=${l.querySelector("dd").textContent}`).join("; ");
if (lines() !== "used=Yes; score=2; problem=The date picker; bookings=12; contact=No answer") return lines();
if ([...c.querySelectorAll("input[type=hidden]")].map((i) => `${i.name}=${i.value}`).join() !== "used=Yes,score=2,problem=The date picker,bookings=12") return "the hidden fields a plain form would send";
// Change an answer on the path: what the old path held stays out, and liked's Speed comes back.
c.querySelector("[data-line=score] button").click(); await wait(50);
if (q() !== "How easy was it?" || !c.querySelector('input[value="2"]').checked) return `change: ${q()}`;
choose("5"); await wait(30);
await next(); await next(); await next();
if (lines() !== "used=Yes; score=5; liked=Speed; contact=No answer") return `the old path's answers are not shown: ${lines()}`;
c.querySelector("button[type=submit]").click(); await wait(60);
if (said() !== 'on_finish: {"used":"Yes","score":"5","liked":["Speed"]}') return said();
if (c.querySelector("[role=status]").textContent !== "Thank you: your answers are in.") return "the thanks";
// The broken one reports each thing, and cannot be trapped.
const b = $("#branching-survey-demo-broken");
const list = [...b.querySelectorAll(".ui-bsurvey-problems li")].map((l) => l.textContent);
for (const w of ["Two questions have the id a: the second is left out.", "Question 6 has no id.", "a jumps to ghost, which is no question.", "a jumps on \"z\", which is no option.", "No path reaches lost.", "A loop: a → b → c → a. Coming back to a question ends the survey there."]) {
    if (!list.includes(w)) return `not reported: ${w}\n${list.join("\n")}`;
}
const bq = () => b.querySelector(".ui-bsurvey-question").textContent;
const bnext = async () => { b.querySelector("button[type=submit]").click(); await wait(50); };
b.querySelector('input[value="x"]').click(); await wait(30); await bnext();
type(b.querySelector("input[name=b]"), "1"); await wait(30); await bnext();
type(b.querySelector("input[name=c]"), "2"); await wait(30); await bnext();
if (bq() !== "Your answers") return `the loop must end: ${bq()}`;
if (b.querySelector(".ui-bsurvey-note").textContent !== 'The survey stopped here, as "A" would have come round again.') return b.querySelector(".ui-bsurvey-note")?.textContent;
