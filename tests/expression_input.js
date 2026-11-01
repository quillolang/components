const box = $("#expression-demo");
const wrap = box.closest(".ui-exprinput");
const out = () => wrap.querySelector(".ui-exprinput-out strong")?.textContent;
const bad = () => wrap.querySelector(".ui-exprinput-bad")?.textContent.trim();
const hidden = () => wrap.querySelector("input[type=hidden]").value;
const mark = () => wrap.querySelector(".ui-exprinput-where mark")?.textContent;
if (hidden() !== "40" || out() !== "40") return `start: ${hidden()} ${out()}`;
if (box.name || wrap.querySelector("input[type=hidden]").name !== "qty") return "only the answer goes in the form";
const sums = [
    ["12*3+4", "40"], ["2+3*4", "14"], ["(2+3)*4", "20"], ["10-2-3", "5"], ["100/4/5", "5"], ["15% of 80", "12"], ["(1+2)/3", "1"],
    ["0.1+0.2", "0.3"], ["1/3*3", "1"], ["1/7*7", "1"], ["1/3+1/6", "0.5"], ["-3*-2", "6"], ["--5", "5"], ["+5", "5"], ["-(2+3)", "-5"],
    ["100 + 10%", "110"], ["100 - 10%", "90"], ["50% * 20", "10"], ["50%", "0.5"], ["10% + 5%", "0.15"], ["1,234.50 * 2", "2469"], ["1.10*3", "3.3"],
    ["2×3÷4", "1.5"], ["2 x 3", "6"], ["5 − 2", "3"], [".5+.5", "1"], ["  7  ", "7"], ["1.50", "1.5"], ["0.000000000000000000000000001*3", "0.000000000000000000000000003"],
    ["9999999999999*9999999999999", "99999999999980000000000001"], ["2/8", "0.25"], ["3 OF 5", null], ["0-0", "0"], ["1/8", "0.125"],
];
for (const [text, want] of sums) {
    type(box, text); await wait(20);
    if (want === null) continue;
    if (hidden() !== want) return `"${text}" is ${hidden()}, not ${want} (${bad() ?? ""})`;
}
type(box, "1234567.5"); await wait(30);
if (out() !== "1,234,567.5" || hidden() !== "1234567.5") return `grouped on the page, plain in the field: ${out()} ${hidden()}`;
type(box, "1/3"); await wait(30);
if (hidden() !== "0.3333333333333333333333333333" || !wrap.querySelector(".ui-exprinput-note")?.textContent.includes("never end")) return `1/3: ${hidden()}`;
type(box, "1/8"); await wait(30);
if (wrap.querySelector(".ui-exprinput-note")) return "1/8 ends, and is not rounded";
const faults = [
    ["1+", "Something is missing at the end: a number. (character 3)", " "],
    ["(1+2", "This bracket is never closed. (character 1)", "("],
    ["1+2)", "No bracket was opened for this one. (character 4)", ")"],
    ["1/0", "Cannot divide by zero. (character 3)", "0"],
    ["1/(2-2)", "Cannot divide by zero. (character 3)", "("],
    ["12*abc", `"a" cannot be read here: use numbers, + - * / %, brackets and "of". (character 4)`, "a"],
    ["1 2", "An operator should come here, such as + or *. (character 3)", "2"],
    ["2(3)", "An operator should come here, such as + or *. (character 2)", "("],
    ["1**2", "A number should come here. (character 3)", "*"],
    ["()", "A number should come before this bracket. (character 2)", ")"],
    ["3 of 5", `"of" follows a percentage, as in 15% of 80. (character 3)`, "o"],
    ["1,2+3", "A comma groups thousands, as in 1,234. A decimal is written with a point. (character 2)", ","],
    ["1234567890123456789012345678901", "This number is too long: 28 digits at most. (character 1)", "1"],
    ["9999999999999999999999999999*9999999999999999999999999999", "The answer is too large: past 28 digits. (character 29)", "*"],
    ["😀+1", `"😀" cannot be read here: use numbers, + - * / %, brackets and "of". (character 1)`, "😀"],
    ["1+😀", `"😀" cannot be read here: use numbers, + - * / %, brackets and "of". (character 3)`, "😀"],
    ["(".repeat(70) + "1", "Too deep: 64 brackets at most. (character 65)", "("],
    ["1+".repeat(300) + "1", "Too long to work out: 500 characters at most. (character 501)", null],
];
for (const [text, says, at] of faults) {
    type(box, text); await wait(30);
    if (bad() !== says) return `"${text.slice(0, 30)}" says: ${bad()}`;
    if (at !== null && mark() !== at) return `"${text.slice(0, 30)}" marks "${mark()}", not "${at}"`;
    if (hidden() !== "" || box.getAttribute("aria-invalid") !== "true") return `"${text.slice(0, 30)}" keeps a value or is not marked: ${hidden()}`;
}
const t0 = performance.now();
type(box, "1+".repeat(249) + "1"); await wait(30);
if (hidden() !== "250") return `a long sum: ${hidden()} ${bad()}`;
if (performance.now() - t0 > 400) return `a long sum took ${performance.now() - t0} ms`;
type(box, "   "); await wait(30);
if (hidden() !== "" || out() || bad() || box.getAttribute("aria-invalid")) return "blank is no answer and no error";
const live = $("#expression-demo-live"), lr = live.closest(".ui-exprinput"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
const lh = () => lr.querySelector("input[type=hidden]").value;
if (lh() !== "1380.00") return `start with decimals: ${lh()}`;
type(live, "10/3"); await wait(30);
if (lh() !== "3.33" || note() !== "on_change: 3.33" || !lr.textContent.includes("Rounded to 2 places.")) return `decimals: ${lh()} ${note()}`;
type(live, "1.005"); await wait(30);
if (lh() !== "1.01") return `half up from the exact value: ${lh()}`;
type(live, "2.50"); await wait(30);
if (lh() !== "2.50" || lr.textContent.includes("Rounded")) return `nothing cut: ${lh()}`;
type(live, "1-2"); await wait(30);
if (lh() !== "" || lr.querySelector(".ui-exprinput-bad")?.textContent !== "The answer must be at least 0." || note() !== "Change the sum to see on_change.") return `lowest: ${lh()} ${note()}`;
type(live, "99999"); await wait(30);
if (lr.querySelector(".ui-exprinput-bad")?.textContent !== "The answer must be at most 10000.") return "highest";
if (box.labels[0]?.textContent.trim() !== "Quantity") return "the label";
if (wrap.querySelector(".ui-exprinput-out").getAttribute("aria-live") !== "polite") return "the answer is not announced";
