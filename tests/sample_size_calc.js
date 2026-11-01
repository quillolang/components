const c = $("#sample-size-calc-demo-baseline").closest(".ui-sample-size-calc");
const dd = (k) => c.querySelector(`[data-k=${k}] dd`)?.textContent.trim();
const err = () => c.querySelector(".ui-sample-size-calc-error")?.textContent;
const worked = () => c.querySelector("code[data-k=worked]")?.textContent.replace(/\s+/g, " ");
const f = (n) => $(`#sample-size-calc-demo-${n}`);
// R's power.prop.test(p1 = .10, p2 = .12, power = .8) gives 3840.85.
if (dd("per") !== "3,841" || dd("total") !== "7,682" || dd("days") !== "4 days") return `start: ${dd("per")} ${dd("total")} ${dd("days")}`;
if (worked() !== "n = (1.960 × 0.4425 + 0.842 × 0.4423)² / 0.0200² = 3,840.8, rounded up") return `worked: ${worked()}`;
if (!c.textContent.includes("n = (z₁ √(2 p̄ (1 − p̄)) + z₂ √(p₁(1 − p₁) + p₂(1 − p₂)))² / (p₂ − p₁)²")) return "the formula is not shown";
if (!c.textContent.includes("Testing 10% against 12%")) return "the rates tested";
if (!c.querySelector(".ui-sample-size-calc-note")?.textContent.startsWith("Under a week")) return "a run under a week says so";
if (f("baseline").name !== "baseline" || f("daily").name !== "daily_visitors" || !f("power").labels[0].textContent.includes("Power")) return "field names or labels";
// 5% lifted by 10%: 31,233.44 up to 31,234.
type(f("baseline"), "5"); type(f("effect"), "10"); await wait();
if (dd("per") !== "31,234") return `5% +10%: ${dd("per")}`;
if (dd("days") !== "32 days" || c.querySelector(".ui-sample-size-calc-note")) return `32 days needs no note: ${dd("days")}`;
// Points: 10 and -2 is 10% against 8%, 3,212.9.
c.querySelector("input[value=absolute]").click(); await wait();
type(f("baseline"), "10"); type(f("effect"), "-2"); await wait();
if (dd("per") !== "3,213" || !f("effect").labels[0].textContent.startsWith("Smallest effect (points)")) return `points: ${dd("per")}`;
c.querySelector("input[value=relative]").click(); await wait();
type(f("effect"), "20"); await wait();
// One-sided: 3,025.3.
f("sides").value = "one"; f("sides").dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (dd("per") !== "3,026" || !c.textContent.includes("z(1 − α) = 1.645")) return `one-sided: ${dd("per")}`;
f("sides").value = "two"; f("sides").dispatchEvent(new Event("change", { bubbles: true })); await wait();
// 1% significance, 90% power, 50% to 51%: 74,387.02.
type(f("baseline"), "50"); type(f("effect"), "2"); type(f("significance"), "1"); type(f("power"), "90"); await wait();
if (dd("per") !== "74,388") return `50%: ${dd("per")}`;
type(f("significance"), "5"); type(f("power"), "80"); type(f("baseline"), "10"); type(f("effect"), "20"); await wait();
// Three variants share the traffic.
type(f("variants"), "3"); await wait();
if (dd("total") !== "11,523" || dd("days") !== "6 days") return `three: ${dd("total")} ${dd("days")}`;
type(f("variants"), "2"); type(f("daily"), ""); await wait();
if (dd("days") !== "Add traffic") return `no traffic: ${dd("days")}`;
type(f("daily"), "10"); await wait();
if (dd("days") !== "769 days" && dd("days") !== "2 years") return `slow: ${dd("days")}`;
if (!c.querySelector(".ui-sample-size-calc-note")?.textContent.startsWith("Over three months")) return "a long run says so";
type(f("daily"), "2000"); await wait();
// No answer: past 100%, under 0%, nothing to find.
type(f("baseline"), "80"); type(f("effect"), "50"); await wait();
if (err() !== "A change of 50% takes 80% to 120%, and a rate stops short of 100%." || dd("per") != null) return `past 100%: ${err()}`;
if (f("effect").getAttribute("aria-invalid") !== "true") return "the effect field is not marked";
type(f("effect"), "-100"); await wait();
if (err() !== "A change of -100% takes 80% to 0%, and a rate stays above 0%.") return `0%: ${err()}`;
type(f("effect"), "0"); await wait();
if (!err()?.startsWith("The effect cannot be 0")) return `zero: ${err()}`;
type(f("effect"), "20"); type(f("baseline"), "0"); await wait();
if (!err()?.startsWith("The baseline rate must be above 0%") || f("baseline").getAttribute("aria-invalid") !== "true") return `baseline 0: ${err()}`;
type(f("baseline"), "100"); await wait();
if (!err()?.startsWith("The baseline rate must be above 0%")) return `baseline 100: ${err()}`;
type(f("baseline"), "10"); type(f("significance"), "0"); await wait();
if (!err()?.startsWith("Significance must be")) return `significance 0: ${err()}`;
type(f("significance"), "51"); await wait();
if (!err()?.startsWith("Significance must be")) return `significance 51: ${err()}`;
type(f("significance"), "5"); type(f("power"), "100"); await wait();
if (!err()?.startsWith("Power must be above 0%")) return `power 100: ${err()}`;
// One-sided, power below significance: the sum of the z values goes under 0.
f("sides").value = "one"; f("sides").dispatchEvent(new Event("change", { bubbles: true }));
type(f("significance"), "40"); type(f("power"), "20"); await wait();
if (!err()?.startsWith("Power of 20% is below what significance alone gives")) return `power too low: ${err()}`;
f("sides").value = "two"; f("sides").dispatchEvent(new Event("change", { bubbles: true }));
type(f("significance"), "5"); type(f("power"), "80"); await wait();
// An effect too small to count, text, unicode, and empty fields.
type(f("baseline"), "50"); type(f("effect"), "0.0000001"); await wait();
if (!err()?.startsWith("That effect is too small")) return `tiny: ${err()}`;
type(f("baseline"), "10"); type(f("effect"), "lots"); await wait();
if (err() !== 'The effect must be a number, not "lots".') return `text: ${err()}`;
type(f("effect"), "٢٠"); await wait();
if (err() !== 'The effect must be a number, not "٢٠".') return `other digits: ${err()}`;
type(f("effect"), "20"); type(f("power"), "   "); await wait();
if (err() !== "Power is empty.") return `blank: ${err()}`;
type(f("power"), "80%"); type(f("variants"), "1"); await wait();
if (!err()?.startsWith("Variants must be") || f("variants").getAttribute("aria-invalid") !== "true") return `variants: ${err()}`;
type(f("variants"), "2.5"); await wait();
if (!err()?.startsWith("Variants must be")) return `variants 2.5: ${err()}`;
type(f("variants"), "2"); type(f("daily"), "0"); await wait();
if (!err()?.startsWith("Daily visitors must be above 0")) return `daily 0: ${err()}`;
type(f("daily"), "abc"); await wait();
if (err() !== 'Daily visitors must be a number, not "abc".') return `daily text: ${err()}`;
type(f("daily"), "2,000"); await wait();
if (dd("per") !== "3,841" || err()) return `recovers: ${dd("per")} ${err()}`;
// A second one starts one-sided, with the callback and the prefix: p 3% to 2.4%.
const live = $("#sample-size-calc-demo-live-baseline").closest(".ui-sample-size-calc");
const note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
if ($("#sample-size-calc-demo-live-baseline").name !== "signup_baseline") return "the name prefix";
if (!live.textContent.includes("Testing 3% against 2.4%")) return `the fall: ${live.textContent}`;
type($("#sample-size-calc-demo-live-baseline"), "4"); await wait();
const shown = live.querySelector("[data-k=per] dd").textContent.replaceAll(",", "");
if (note() !== `on_change: ${shown} a variant.`) return `on_change: ${note()}`;
type($("#sample-size-calc-demo-live-baseline"), "0"); await wait();
if (note() !== "on_change: refused at baseline.") return `on_change refused: ${note()}`;
