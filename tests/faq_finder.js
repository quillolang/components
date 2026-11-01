const q = $("#faq-finder-demo-q");
const c = q.closest(".ui-faqf");
const list = (box = c) => [...box.querySelectorAll("ol.ui-faqf-list summary span:first-child")].map((s) => s.textContent);
const why = (i = 0, box = c) => box.querySelectorAll("ol.ui-faqf-list .ui-faqf-why")[i]?.textContent;
const count = (box = c) => box.querySelector("[aria-live]").textContent;
const say = async (t, box = c, field = q) => { type(field, t); await wait(100); };
// Synonyms as data: "money back" is not in the FAQ, but refund is.
if (list()[0] !== "How do I get a refund?") return `a synonym: ${list()}`;
if (why(0) !== 'Found by "money back" means "refund" in the question') return why(0);
if (!c.querySelector("details[open] .ui-faqf-answer")?.textContent.startsWith("Send the item back")) return "the best answer is not open";
if (count() !== '1 answer for "money back".') return count();
if (q.name !== "q" || !q.labels[0]) return "the field's name and label";
// Term weighting: a word in the question beats it in an answer; the rarer word decides.
await say("warranty");
if (list().join() !== "What does the warranty cover?") return `one entry: ${list()}`;
if (why(0) !== 'Found by "warranty" in the question') return why(0);
await say("returned");
if (list()[0] !== "What is your returns policy?" || why(0) !== 'Found by "returned" in the question') return `an ending: ${list()} / ${why(0)}`;
await say("refunded");
if (list()[0] !== "How do I get a refund?") return `refunded: ${list()}`;
await say("cancelling");
if (list()[0] !== "Can I cancel an order?") return `cancelling: ${list()}`;
await say("cancellation");
if (list()[0] !== "Can I cancel an order?") return `cancellation: ${list()}`;
await say("deliveries");
if (list()[0] !== "Do you deliver abroad?") return `deliveries: ${list()}`;
await say("policies");
if (list()[0] !== "What is your returns policy?") return `policies: ${list()}`;
// "order" stands in three questions; with "cancel" that entry is first, and one with both words beats one with one.
await say("cancel order");
if (list()[0] !== "Can I cancel an order?" || why(0) !== 'Found by "cancel" in the question; "order" in the question') return `two words: ${list()} / ${why(0)}`;
// In a question beats in an answer: "ship" is an answer word for abroad, and a question word for shipping.
await say("shipping");
if (list().join("|") !== "How long does shipping take?|Do you deliver abroad?") return `question first: ${list().join("|")}`;
if (why(1) !== 'Found by "shipping" in the answer') return why(1);
// Tags count.
await say("parcel");
if (list()[0] !== "Where is my order?") return `tags: ${list()}`;
// Typos.
await say("shiping");
if (list()[0] !== "How long does shipping take?") return `the stem forgives this one: ${list()}`;
await say("shpping");
if (list()[0] !== "How long does shipping take?" || why(0) !== 'Found by "shpping" read as "shipping" in the question') return `a letter left out: ${list()} / ${why(0)}`;
await say("waranty");
if (list()[0] !== "What does the warranty cover?") return `waranty: ${list()}`;
await say("pasword");
if (list()[0] !== "I forgot my password") return `pasword: ${list()}`;
await say("wrranty");
if (list()[0] !== "What does the warranty cover?") return `wrranty: ${list()}`;
await say("refnud");
if (list()[0] !== "How do I get a refund?") return `two letters swapped: ${list()}`;
await say("recieving");
if (list()[0] !== "How do I get a refund?") return `recieving: ${list()}`;
// While typing, the start of a word.
await say("passw");
if (list()[0] !== "I forgot my password" || why(0) !== 'Found by "passw" as the start of "password" in the question') return `a start: ${list()} / ${why(0)}`;
// Case, accents, and stop words alone.
await say("WARRANTY!!");
if (list()[0] !== "What does the warranty cover?") return "capitals and marks";
await say("wárranty");
if (list()[0] !== "What does the warranty cover?") return `an accent: ${list()}`;
await say("how do i");
if (!count().includes('for "how do i"')) return `only small words: ${count()}`;
// Nothing found: what was looked for, the nearest, the common questions.
await say("giraffe");
if (count() !== 'No answers for "giraffe".') return count();
if (c.querySelector(".ui-faqf-none p").textContent !== 'Nothing here mentions "giraffe".') return c.querySelector(".ui-faqf-none p").textContent;
if (c.querySelector("h4")?.textContent !== "Common questions" || [...c.querySelectorAll("ul.ui-faqf-list summary span:first-child")].map((s) => s.textContent).join("|") !== "How long does shipping take?|Where is my order?|How do I get a refund?") return "the common questions";
await say("zxqwv");
if (c.querySelector(".ui-faqf-offers")) return "offers for what is like nothing";
// Too far for a typo, near enough to offer.
await say("warantie");
if (!c.querySelector(".ui-faqf-none") && list()[0] !== "What does the warranty cover?") return "warantie";
await say("garanty");
if (c.querySelector(".ui-faqf-none p")?.textContent !== 'Nothing here mentions "garanty".') return `garanty: ${list()}`;
const offers = [...c.querySelectorAll(".ui-faqf-offer")].map((b) => b.textContent);
if (offers[0] !== "warranty") return `did you mean: ${offers}`;
c.querySelector(".ui-faqf-offer").click(); await wait(120);
if (q.value !== "warranty" || document.activeElement !== q || list()[0] !== "What does the warranty cover?") return `taking the offer: ${q.value}`;
// Bad and awkward input.
await say("");
if (count() !== "9 questions to search." || c.querySelector("ol.ui-faqf-list") || !c.querySelector("h4")) return `empty: ${count()}`;
await say("     ");
if (count() !== "9 questions to search.") return "spaces";
await say("constructor toString __proto__ hasOwnProperty");
if (list().length) return `names of JavaScript: ${list()}`;
await say("的 🥚 ¿qué?");
if (c.querySelector(".ui-faqf-none p") == null) return "unicode";
await say("<b>warranty</b>");
if (list()[0] !== "What does the warranty cover?") return "markup in a search";
const t0 = performance.now();
await say("refund ".repeat(3000) + "typoword ".repeat(3000));
if (performance.now() - t0 > 900) return `a huge search is slow: ${performance.now() - t0}`;
if (!c.textContent.includes("Only the first 200 characters are searched")) return "the cap";
// Keys.
await say("order");
key(q, "ArrowDown"); await wait(60);
const sums = [...c.querySelectorAll("ol.ui-faqf-list summary")];
if (document.activeElement !== sums[0]) return "Down from the box";
key(sums[0], "ArrowDown"); await wait(60);
if (document.activeElement !== sums[1]) return "Down in the list";
key(sums[1], "ArrowUp"); await wait(60);
key(sums[0], "ArrowUp"); await wait(60);
if (document.activeElement !== q) return "Up to the box";
key(q, "Escape"); await wait(100);
if (q.value !== "" ) return "Escape";
// The live one, with no synonyms: a limit, a name, and on_no_match once for each.
const lq = $("#faq-finder-demo-live-q");
const live = lq.closest(".ui-faqf");
if (lq.name !== "help") return "name";
// With no synonyms given, "money back" has only "back" to go on, in an answer.
await say("money back", live, lq);
if (list(live)[0] !== "How do I get a refund?" || why(0, live) !== 'Found by "back" in the answer') return `no synonyms: ${list(live)} / ${why(0, live)}`;
const note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if (!note().startsWith("Search for something")) return `told for a match: ${note()}`;
await say("giraffe", live, lq);
if (live.querySelector(".ui-faqf-contact")?.textContent !== "Ask us instead" || live.querySelector(".ui-faqf-contact").getAttribute("href") !== "#contact") return `the way to ask: ${live.querySelector(".ui-faqf-none")?.textContent}`;
if (note() !== "on_no_match: giraffe.") return note();
key(lq, "Enter"); await wait(60);
if (note() !== "on_no_match: giraffe.") return `told twice: ${note()}`;
await say("zebra", live, lq);
if (note() !== "on_no_match: giraffe, zebra.") return note();
await say("order", live, lq);
if (list(live).length !== 3) return `the limit: ${list(live).length}`;
if (note() !== "on_no_match: giraffe, zebra.") return `told for a match: ${note()}`;
