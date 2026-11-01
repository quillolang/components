const c = $("#ab-test-calc-demo-va").closest(".ui-ab-test-calc");
const dd = (cls) => c.querySelector(`[data-k=${cls}] dd`)?.textContent.replace(/\s+/g, " ").trim();
const verdict = () => c.querySelector(".ui-ab-test-calc-verdict")?.textContent;
const notes = () => [...c.querySelectorAll(".ui-ab-test-calc-notes li")].map((l) => l.textContent);
const errors = () => [...c.querySelectorAll(".ui-ab-test-calc-errors li")].map((l) => l.textContent);
const va = $("#ab-test-calc-demo-va"), ca = $("#ab-test-calc-demo-ca"), vb = $("#ab-test-calc-demo-vb"), cb = $("#ab-test-calc-demo-cb");
const level = $("#ab-test-calc-demo-level");
// Worked out apart with Python: z 2.50284, p 0.01232, interval 0.17 to 1.43 points, lift 16%.
if (dd("rate-a") !== "5.00%" || dd("rate-b") !== "5.80%") return `rates: ${dd("rate-a")} ${dd("rate-b")}`;
if (dd("lift") !== "+16.00%" || dd("diff") !== "+0.80 pts" || dd("z") !== "2.503" || dd("p") !== "0.0123") return `figures: ${dd("lift")} ${dd("diff")} ${dd("z")} ${dd("p")}`;
if (dd("ci") !== "+0.17 pts to +1.43 pts") return `interval: ${dd("ci")}`;
if (verdict() !== "Variant beats Control by 0.80 points at 95% confidence (p = 0.0123).") return `verdict: ${verdict()}`;
if (!c.querySelector(".ui-ab-test-calc-win") || notes().length) return `a clean win is green with no warnings: ${notes()}`;
if (va.name !== "visitors_a" || level.name !== "confidence" || !va.labels[0].textContent.includes("Visitors")) return "names and labels";
// At 99% the same test is no longer significant, and the interval crosses 0.
level.value = "99"; level.dispatchEvent(new Event("change", { bubbles: true })); await wait();
if (!verdict().startsWith("No clear winner: a difference of 0.80 points could well be chance")) return `at 99%: ${verdict()}`;
if (dd("ci") !== "-0.02 pts to +1.62 pts") return `the interval at 99%: ${dd("ci")}`;
if (!c.textContent.includes("reliably show a difference of about 1.09 points")) return `detectable: ${c.querySelector(".ui-ab-test-calc-hint")?.textContent}`;
level.value = "95"; level.dispatchEvent(new Event("change", { bubbles: true })); await wait();
// A loss: 500 of 10,000 against 420 of 10,000: control wins, lift -16%.
type(cb, "420"); await wait();
if (dd("lift") !== "-16.00%" || dd("z") !== "-2.700" || dd("p") !== "0.0069") return `a loss: ${dd("lift")} ${dd("z")} ${dd("p")}`;
if (!verdict().startsWith("Control beats Variant by 0.80 points")) return `a loss's verdict: ${verdict()}`;
// Equal rates: p of exactly 1.
type(cb, "500"); await wait();
if (dd("z") !== "0.000" || dd("p") !== "1.0000" || !verdict().startsWith("No clear winner")) return `equal: ${dd("z")} ${dd("p")} ${verdict()}`;
// Too small: 3 of 40 against 6 of 42 is called early, however it looks.
type(va, "40"); type(ca, "3"); type(vb, "42"); type(cb, "6"); await wait();
if (verdict() !== "Too early to call: the sample is too small to trust either way.") return `small: ${verdict()}`;
if (!c.querySelector(".ui-ab-test-calc-early") || notes()[0] !== "Control has 3 conversions from 40 visitors; the test needs at least 10 of each outcome in each variant.") return `small note: ${notes()}`;
if (notes().length !== 2) return `both arms are named: ${notes()}`;
// A big effect on a tiny sample stays too early: 0 of 8 against 8 of 8.
type(va, "8"); type(ca, "0"); type(vb, "8"); type(cb, "8"); await wait();
if (!verdict().startsWith("Too early") || !dd("lift").startsWith("None")) return `0 of 8: ${verdict()} ${dd("lift")}`;
// Nobody converting anywhere: no test, no division by zero.
type(va, "500"); type(vb, "500"); type(ca, "0"); type(cb, "0"); await wait();
if (!verdict().startsWith("Nobody converted") || dd("z") !== "None" || dd("p") !== "None") return `no conversions: ${verdict()} ${dd("z")}`;
// Everybody converting.
type(ca, "500"); type(cb, "500"); await wait();
if (!verdict().startsWith("Everybody converted")) return `all converted: ${verdict()}`;
// A lopsided split is warned about; with commas it still reads.
type(va, "10,000"); type(ca, "500"); type(vb, "5,000"); type(cb, "250"); await wait();
if (!notes().some((n) => n.startsWith("Traffic split 66.7% to 33.3%"))) return `split: ${notes()}`;
// Bad input says where, and shows no result.
type(ca, "20000"); await wait();
if (errors()[0] !== "Control: conversions (20,000) cannot be above visitors (10,000)." || verdict() != null || ca.getAttribute("aria-invalid") !== "true") return `over: ${errors()} ${verdict()}`;
type(ca, "abc"); await wait();
if (errors()[0] !== 'Control: conversions must be a whole number, not "abc".') return `text: ${errors()}`;
type(ca, "-5"); await wait();
if (errors().length !== 1 || !errors()[0].includes('"-5"')) return `negative: ${errors()}`;
type(ca, "1.5"); await wait();
if (!errors()[0].includes('"1.5"')) return `fraction: ${errors()}`;
type(ca, "٣"); await wait();
if (!errors()[0].includes("٣")) return `other digits: ${errors()}`;
type(ca, "1"); type(va, "0"); await wait();
if (errors()[0] !== "Control: visitors must be above 0." || va.getAttribute("aria-invalid") !== "true") return `zero visitors: ${errors()}`;
type(va, "999999999999999999999"); await wait();
if (!errors()[0].startsWith("Control: visitors must be a whole number")) return `huge: ${errors()}`;
type(va, "   "); await wait();
if (errors()[0] !== "Control: visitors is empty.") return `blank: ${errors()}`;
for (const f of [va, ca, vb, cb]) type(f, "");
await wait();
if (!c.textContent.includes("Enter visitors and conversions for both variants.") || errors().length) return "all empty is a hint, not an error";
// The largest allowed sizes do not throw.
type(va, "999,999,999,999,999"); type(ca, "100000000000000"); type(vb, "999999999999999"); type(cb, "100000000000001"); await wait();
if (dd("rate-a") !== "10.00%" || dd("p") == null) return `huge counts: ${dd("rate-a")} ${dd("p")}`;
// The callback, and name's prefix, on the second one.
const live = $("#ab-test-calc-demo-live-va").closest(".ui-ab-test-calc");
const seen = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
const lv = (cls) => live.querySelector(`[data-k=${cls}] dd`)?.textContent.trim();
if (lv("z") !== "0.729" || lv("p") !== "0.4657") return `second: ${lv("z")} ${lv("p")}`;
if (live.querySelector("legend").textContent !== "Old page" || $("#ab-test-calc-demo-live-va").name !== "pricing_visitors_a") return "names of the variants, or the prefix";
type($("#ab-test-calc-demo-live-cb"), "160"); await wait();
if (seen() !== "on_change: winner b, significant true.") return `on_change: ${seen()}`;
type($("#ab-test-calc-demo-live-cb"), "x"); await wait();
if (seen() !== "on_change: not a complete test.") return `on_change on bad input: ${seen()}`;
