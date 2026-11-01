// mobile
const host = $("#empty-screen-demo"), title = () => $("#empty-screen-demo h1").textContent;
const k = (x) => tap($(`#empty-screen-demo-k${x}`));
const tips = () => [...host.querySelectorAll(".ui-empty-screen-tips li")].map((l) => l.textContent);
const chips = () => [...host.querySelectorAll(".ui-empty-screen-chip")];
const box = $("#empty-screen-demo-q");
const main = () => host.querySelector(".ui-empty-screen-actions .ui-btn");
const out = () => $("#empty-screen-demo-out").textContent;
const q = async (t) => { type(box, t); await wait(60); };

// None found: says what was looked for, with advice fitted to it.
if (host.dataset.kind !== "none") return "kind: " + host.dataset.kind;
if (title() !== "No invoices match “red bicycle lamp”") return "title: " + title();
if (tips().join("|") !== "Take off a filter to see more.|Try fewer words.") return "tips: " + tips();
if (chips().length !== 2 || chips()[0].getAttribute("aria-label") !== "Take off the filter Open only") return "chips";
if (main().textContent.trim() !== "Clear the search") return "main: " + main().textContent;
// Off with one filter: it goes, the rest stay, and the focus does not matter to the rest.
await tap(chips()[0]);
if (chips().length !== 1 || chips()[0].textContent.trim() !== "This week") return "taking off a filter";
await tap(chips()[0]);
if (chips().length !== 0) return "the last filter";
if (host.querySelector(".ui-empty-screen-chips")) return "an empty row of chips";
if (tips().join("|") !== "Try fewer words.|Check the spelling.") return "tips without filters: " + tips();
// The advice follows the search: known answers, one by one.
const cases = [["ab", "Try a longer word.|Check the spelling."], ["order 1234", "Check the number.|Check the spelling."], ["bicycle", "Check the spelling."],
               ["  bicycle  ", "Check the spelling."], ["a b c 4", "Try fewer words.|Check the number."]];
for (const [text, want] of cases) { await q(text); if (tips().join("|") !== want) return `${text}: ${tips().join("|")}`; }
await q("  bicycle  ");
if (title() !== "No invoices match “bicycle”") return "trimmed: " + title();
// A long search is cut for the heading, not by the screen; odd text stays text.
await q("x".repeat(50));
if (title() !== `No invoices match “${"x".repeat(40)}…”`) return "long: " + title();
await q("😀".repeat(50));
if (title() !== `No invoices match “${"😀".repeat(40)}…”`) return "long emoji: " + title();
await q('<b>x</b> "y"');
if (host.querySelector("h1 b") || !title().includes("<b>x</b>")) return "text was taken for markup";
// With nothing typed and no filters there is nothing to clear.
await q("");
if (title() !== "No invoices found") return "bare: " + title();
if (host.querySelector(".ui-empty-screen-actions")) return "nothing to clear, yet a button";
if (tips().length) return "bare tips";
await q("again");
// The main action, a real tap, clears through the callback.
await tap(main());
if (box.value !== "" || !out().startsWith("1 actions")) return "clear: " + out();

// First use: the steps, the next one marked, and marking one done moves it on.
await k("first");
if (host.dataset.kind !== "first") return "kind: first";
if (title() !== "No invoices yet") return "first: " + title();
if (host.querySelector(".ui-empty-screen-text").textContent !== "When you have invoices, they will show up here.") return "first text";
const steps = () => [...host.querySelectorAll(".ui-empty-screen-step")];
const count = () => host.querySelector(".ui-empty-screen-count").textContent;
const next = () => host.querySelector(".ui-empty-screen-step-next");
if (steps().length !== 3 || count() !== "1 of 3 done") return "steps: " + count();
if (next() !== steps()[1] || next().getAttribute("aria-current") !== "step") return "the next step";
if (!steps()[0].classList.contains("ui-empty-screen-step-done") || !steps()[0].textContent.includes("(done)")) return "a done step";
const held = steps()[1];
await tap(held);
if (count() !== "2 of 3 done" || next() !== steps()[2]) return "after a step: " + count();
if (steps()[1] !== held) return "a press remade the step";
await tap(steps()[2]);
if (count() !== "3 of 3 done" || next()) return "all steps done";
if (main().textContent.trim() !== "Create an invoice") return "first main: " + main().textContent;
await tap(main());
if (!out().startsWith("2 actions")) return "first action: " + out();
await tap(host.querySelector(".ui-empty-screen-actions .ui-btn-outline"));
if (!out().includes("1 others")) return "secondary: " + out();

// All done: good news, a count, and what comes next.
await k("done");
if (title() !== "All invoices done") return "done: " + title();
if (host.querySelector(".ui-empty-screen-text").textContent !== "The next ones come on Monday.") return "done text";
if (host.querySelector(".ui-empty-screen-count").textContent !== "12 finished") return "done count";
if (host.querySelector(".ui-empty-screen-steps")) return "done shows the steps";
if (host.querySelector(".ui-empty-screen-chip")) return "done shows the filters";
if (!host.classList.contains("ui-empty-screen-done")) return "done, its look";

// On a plain page it needs no script: links for what to do.
const plain = $("#empty-screen-demo-plain");
const link = plain.querySelector("a.ui-btn"), stepLink = plain.querySelector("a.ui-empty-screen-step");
if (link.getAttribute("href") !== "/reports/new" || stepLink.getAttribute("href") !== "/templates") return "links";
if (stepLink.getAttribute("aria-current") !== "step") return "the plain next step";

// A tablet: the picture beside the words. A phone: one column, centred.
const pa = plain.querySelector(".ui-empty-screen-art").getBoundingClientRect(), ti = plain.querySelector("h1").getBoundingClientRect();
if (device === "tablet") { if (!(pa.right <= ti.left)) return `tablet: ${pa.right}, ${ti.left}`; }
else if (!(pa.bottom <= ti.top)) return `phone: ${pa.bottom}, ${ti.top}`;
// The tick is drawn, and stands still under reduced motion.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }); await wait(80);
const tick = host.querySelector(".ui-empty-screen-tick");
if (getComputedStyle(tick).animationName !== "none" || getComputedStyle(tick).strokeDashoffset !== "0px") return "reduced motion: " + getComputedStyle(tick).animationName;
await cdp("Emulation.setEmulatedMedia", { features: [] });
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 44, right: 44, bottom: 34 } }); await wait(120);
const st = getComputedStyle(host);
if (st.paddingTop !== "47px" || st.paddingBottom !== "34px" || st.paddingLeft !== "44px") return `safe area: ${st.paddingTop} ${st.paddingLeft} ${st.paddingBottom}`;
await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } }); await wait(80);
