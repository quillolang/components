const c = $("#spaced-repetition-demo-title").closest(".ui-spaced-rep");
const front = (r = c) => r.querySelector(".ui-spaced-rep-front")?.textContent;
const kind = () => c.querySelector(".ui-spaced-rep-kind")?.textContent;
const left = () => c.querySelector(".ui-spaced-rep-left").textContent;
const note = () => c.closest(".demo-stack").querySelector(".demo-note").textContent;
const said = () => c.querySelector(".ui-spaced-rep-said[aria-live]").textContent;
const data = (id) => [...c.querySelectorAll(`tr[data-card="${id}"] td`)].map((t) => t.textContent).join(" ");
const stored = (id) => JSON.parse(c.querySelector("input[name=cards]").value).find((k) => k.id === id);
const show = () => c.querySelector(".ui-spaced-rep-show").click();
const grade = (q) => c.querySelectorAll(".ui-spaced-rep-grade")[q].click();
// The queue: overdue, due, then two new; la neige is over the new limit.
if (left() !== "4 to go") return `queue: ${left()}`;
if (front() !== "le soleil" || kind() !== "Overdue by 3") return `first: ${front()} ${kind()}`;
if (c.querySelector(".ui-spaced-rep-back")) return "the answer shows before it is asked for";
// The previews, soleil at ease 1.3, 10 days, 3 reps: grade 5 gives ease 1.4 and 14 days.
show(); await wait();
if (c.querySelector(".ui-spaced-rep-back").textContent !== "the sun") return "answer";
const hints = [...c.querySelectorAll(".ui-spaced-rep-grade small")].map((s) => s.textContent);
if (hints.join("|") !== "again today, then tomorrow|again today, then tomorrow|again today, then tomorrow|again today, then in 13 days|in 13 days|in 14 days") return `previews: ${hints}`;
grade(5); await wait();
if (data("soleil") !== "soleil 1.40 14 4 2026-11-16") return `soleil: ${data("soleil")}`;
if (note() !== "on_review: soleil, grade 5, ease 1.40, due 2026-11-16.") return `on_review: ${note()}`;
if (left() !== "3 to go" || front() !== "la lune" || kind() !== "Review") return `next: ${left()} ${front()} ${kind()}`;
if (!said().startsWith("Next in 14 days: 2026-11-16, ease 1.40.")) return `said: ${said()}`;
// Keyboard: Space shows, 3 grades. la lune: ease 2.5 - 0.14 = 2.36, 6 x 2.36 = 14.16, up to 15. Under 4 it comes round again.
const box = c.querySelector(".ui-spaced-rep-card");
box.focus(); key(box, " "); await wait();
if (!c.querySelector(".ui-spaced-rep-back")) return "Space does not show the answer";
key(box, "9"); await wait(60);
if (data("lune") !== "lune 2.5 6 2 2026-11-02") return "a key that is no grade did something";
key(box, "3"); await wait();
if (data("lune") !== "lune 2.36 15 3 2026-11-17") return `lune: ${data("lune")}`;
if (document.activeElement !== box) return "focus left the card";
if (left() !== "3 to go") return `lune comes back at the end: ${left()}`;
// A new card: right at once, ease 2.6, one day; then wrong on its go tomorrow would reset, so grade 2 on the next new card.
if (front() !== "la mer" || kind() !== "New") return `new: ${front()}`;
show(); await wait(); grade(4); await wait();
if (data("mer") !== "mer 2.50 1 1 2026-11-03") return `mer: ${data("mer")}`;
// Grade 2 on a new card: no repetitions, ease unchanged, tomorrow, and again today.
show(); await wait(); grade(2); await wait();
if (data("vent") !== "vent 2.5 1 0 2026-11-03") return `vent: ${data("vent")}`;
if (stored("vent").lapses !== 0) return "a new card wrong is not a lapse";
if (c.querySelector(".ui-spaced-rep-new").textContent !== "2 of 2 new" || c.querySelector(".ui-spaced-rep-reviews").textContent !== "2 of 5 reviews") return "the counts";
// The go-rounds: lune then vent, marked as again; they change no dates.
if (front() !== "la lune" || kind() !== "Again today") return `round again: ${front()} ${kind()}`;
show(); await wait();
if (!c.querySelector(".ui-spaced-rep-grade small").textContent.startsWith("again today")) return "again hints";
grade(1); await wait();
if (data("lune") !== "lune 2.36 15 3 2026-11-17" || front() !== "le vent") return `a go-round changed the card: ${data("lune")}`;
if (note() !== "on_review: lune, grade 1, ease 2.36, due 2026-11-17.") return `again's on_review: ${note()}`;
show(); await wait(); grade(4); await wait();
if (front() !== "la lune") return "vent stays in the queue";
show(); await wait(); grade(5); await wait();
if (left() !== "0 to go") return left();
if (!c.querySelector(".ui-spaced-rep-empty").textContent.startsWith("All done")) return "done";
const held = [...c.querySelectorAll(".ui-spaced-rep-card .ui-spaced-rep-said")].map((p) => p.textContent);
if (held[0] !== "Held back by today's limits: 1 new." || held[1] !== "Next due 2026-11-03.") return `held: ${held}`;
// Awkward data, each said; ease under 1.3 lifted; a limit of one review and no new.
const b = $("#spaced-repetition-demo-bad-title").closest(".ui-spaced-rep");
const p = [...b.querySelectorAll(".ui-spaced-rep-problems li")].map((l) => l.textContent);
for (const want of ["Card 1: it has no front.", "Card 2: this is not a card.", 'Card 3: its ease "soft" is not a number.', 'Card 4: its due date "2026-02-30" is not a date.', "Card 5: its interval and reps", "Card 7: the id e is used twice."])
    if (!p.some((l) => l.startsWith(want))) return `missing "${want}": ${p}`;
if (front(b) !== "Only this is fine" || b.querySelector(".ui-spaced-rep-left").textContent !== "1 to go") return `bad deck: ${front(b)}`;
if (b.querySelector('tr[data-card="e"]').children[1].textContent !== "1.30") return "ease not lifted to 1.3";
// Ease floor: grade 3 at 1.3 stays 1.3: 3 x 1.3 = 3.9, up to 4.
b.querySelector(".ui-spaced-rep-show").click(); await wait();
b.querySelectorAll(".ui-spaced-rep-grade")[3].click(); await wait();
if ([...b.querySelectorAll('tr[data-card="e"] td')].map((t) => t.textContent).join(" ") !== "e 1.30 4 4 2026-11-06") return "the ease floor";
b.querySelector(".ui-spaced-rep-show").click(); await wait();
b.querySelectorAll(".ui-spaced-rep-grade")[5].click(); await wait();
const hb = b.querySelector(".ui-spaced-rep-card .ui-spaced-rep-said")?.textContent;
if (hb !== "Held back by today's limits: 1 review and 1 new.") return `held: ${hb}`;
