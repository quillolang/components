const box = $("#amount-demo");
const wrap = box.closest(".ui-amountin");
const hid = (w, n) => w.querySelector(`input[name="${n}"]`).value;
const shown = (w = wrap) => w.querySelector(".ui-amountin-out strong")?.textContent;
const bad = (w = wrap) => w.querySelector(".ui-amountin-bad")?.textContent;
const ways = (w = wrap) => [...w.querySelectorAll(".ui-amountin-way")];
if (hid(wrap, "price") !== "1500.00" || hid(wrap, "price_currency") !== "USD" || shown() !== "$1,500.00") return `start: ${hid(wrap, "price")} ${shown()}`;
if (box.name) return "the words do not go in the form";
const reads = [
    ["1.5k", "1500.00", "USD"], ["2m", "2000000.00", "USD"], ["1,234.50", "1234.50", "USD"], ["1.234,50", "1234.50", "USD"], ["$12", "12.00", "USD"],
    ["EUR 40", "40.00", "EUR"], ["eur40", "40.00", "EUR"], ["40 eur", "40.00", "EUR"], ["12.50 €", "12.50", "EUR"], ["£3.5k", "3500.00", "GBP"], ["¥1,000", "1000", "JPY"],
    ["JPY 1,500.5", "1501", "JPY"], ["1 234,50 €", "1234.50", "EUR"], ["1 234,50 €", "1234.50", "EUR"], ["1'234.50 CHF", "1234.50", "CHF"],
    ["12,34,567.00", "1234567.00", "USD"], ["1,234,567", "1234567.00", "USD"], ["1.234.567", "1234567.00", "USD"], [".5", "0.50", "USD"], ["5.", "5.00", "USD"],
    ["1,5", "1.50", "USD"], ["0,125", "0.13", "USD"], ["1234.567", "1234.57", "USD"], ["1,2345", "1.23", "USD"], ["1.5 million", "1500000.00", "USD"], ["2bn", "2000000000.00", "USD"],
    ["3 lakh", "300000.00", "USD"], ["2 crore", "20000000.00", "USD"], ["1.5K", "1500.00", "USD"], ["2M USD", "2000000.00", "USD"], ["$2.5m", "2500000.00", "USD"], ["12 dollars", "12.00", "USD"],
    ["20 euros", "20.00", "EUR"], ["R$ 10", "10.00", "BRL"], ["US$5", "5.00", "USD"], ["0", "0.00", "USD"], ["007", "7.00", "USD"], ["KWD 1.5", "1.500", "KWD"],
];
for (const [text, amount, cur] of reads) {
    type(box, text); await wait(20);
    if (hid(wrap, "price") !== amount || hid(wrap, "price_currency") !== cur) return `"${text}": ${hid(wrap, "price")} ${hid(wrap, "price_currency")}, not ${amount} ${cur} (${bad() ?? ""})`;
}
type(box, "0,125"); await wait(30);
if (!wrap.textContent.includes("Rounded: USD has 2 decimals.")) return "rounding is not said";
type(box, "1,234"); await wait(30);
if (hid(wrap, "price") !== "1234.00" || !wrap.querySelector(".ui-amountin-unsure")?.textContent.includes('"1,234" can be read two ways') || ways().length !== 2) return `1,234 is flagged: ${hid(wrap, "price")}`;
if (ways()[0].getAttribute("aria-pressed") !== "true" || ways()[1].getAttribute("aria-pressed") !== "false") return "the likelier way is the pressed one";
ways()[1].click(); await wait(30);
if (hid(wrap, "price") !== "1.23" || shown() !== "$1.23" || ways()[1].getAttribute("aria-pressed") !== "true") return `picking the decimal: ${hid(wrap, "price")} ${shown()}`;
type(box, "1.234"); await wait(30);
if (hid(wrap, "price") !== "1234.00" || ways().length !== 2) return `a pick goes with the text, and 1.234 does not fit USD: ${hid(wrap, "price")}`;
type(box, "KWD 1.234"); await wait(30);
if (hid(wrap, "price") !== "1.234" || ways().length !== 2) return `three decimals fit KWD: ${hid(wrap, "price")}`;
type(box, "0.234"); await wait(30);
if (ways().length !== 0 || hid(wrap, "price") !== "0.23") return `a leading 0 cannot group: ${hid(wrap, "price")}`;
type(box, "1234,567"); await wait(30);
if (ways().length !== 0 || hid(wrap, "price") !== "1234.57") return `four digits cannot start a group: ${hid(wrap, "price")}`;
const faults = [
    ["abcd", `"a" cannot be part of an amount (character 1).`], ["12abc", `"ABC" is not a currency code.`], ["12qq", `"q" cannot be part of an amount (character 3).`],
    ["1e3", `"e" cannot be part of an amount (character 2).`], ["1,23,4", `Digits are grouped in threes: "1,23,4" is not.`], ["1.2.3", `Digits are grouped in threes: "1.2.3" is not.`],
    ["1.234.56,78", `Digits are grouped in threes: "1.234.56" is not.`], ["1,234.56,78", `"," comes twice, and only the decimal mark should come last: "1,234.56,78".`],
    ["12 34", `Spaces and apostrophes group digits in threes: "12 34" does not.`], ["$", "There is no number here yet."], ["EUR", "There is no number here yet."], ["k", "There is no number here yet."],
    ["xyz 12", `"XYZ" is not a currency code.`], ["-", "Type a number."], [".", "There is no number here yet."], ["99999999999999999999", "That amount is too long: 16 digits before the decimal mark at most."],
    ["9999999999999999m", "That amount is too long: 16 digits before the decimal mark at most."], ["-12", "A negative amount is not allowed here."], ["(12.50)", "A negative amount is not allowed here."],
    ["😀", `"😀" cannot be part of an amount (character 1).`], ["1".repeat(65), "That is too long to be an amount: 64 characters at most."],
];
for (const [text, says] of faults) {
    type(box, text); await wait(20);
    if (bad() !== says) return `"${text}" says: ${bad()}`;
    if (hid(wrap, "price") !== "" || box.getAttribute("aria-invalid") !== "true") return `"${text}" keeps a value: ${hid(wrap, "price")}`;
}
type(box, "  "); await wait(30);
if (hid(wrap, "price") !== "" || bad() || shown() || box.getAttribute("aria-invalid")) return "blank";
const live = $("#amount-demo-live"), lw = live.closest(".ui-amountin"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
type(live, "1.234,50"); await wait(30);
if (shown(lw) !== "1.234,50 €" || note() !== "on_change: 1234.50 EUR") return `de-DE: ${shown(lw)} ${note()}`;
type(live, "-1.5k"); await wait(30);
if (hid(lw, "budget") !== "-1500.00" || note() !== "on_change: -1500.00 EUR") return `negative allowed: ${hid(lw, "budget")} ${note()}`;
type(live, "(12,50)"); await wait(30);
if (hid(lw, "budget") !== "-12.50") return `brackets are negative: ${hid(lw, "budget")}`;
type(live, "1,234"); await wait(30);
if (ways(lw).length !== 2) return "de-DE flags it too";
ways(lw)[1].click(); await wait(30);
if (note() !== "on_change: 1.23 EUR") return `on_change on a pick: ${note()}`;
const fare = $("#amount-demo-fixed"), fw = fare.closest(".ui-amountin");
type(fare, "$12"); await wait(30);
if (hid(fw, "fare") !== "12.00" || hid(fw, "fare_currency") !== "CAD" || shown(fw) !== "CA$12.00") return `a $ stays in a CAD field: ${hid(fw, "fare_currency")} ${shown(fw)}`;
type(fare, "EUR 12"); await wait(30);
if (bad(fw) !== "This field takes CAD, not EUR." || hid(fw, "fare") !== "" || hid(fw, "fare_currency") !== "CAD") return `fixed: ${bad(fw)}`;
if (box.labels[0]?.textContent.trim() !== "Price") return "the label";
if (wrap.querySelector(".ui-amountin-out").getAttribute("aria-live") !== "polite") return "the amount is not announced";
