const box = $("#barcode-demo");
const wrap = box.closest(".ui-barcodein");
const hid = (w = wrap) => w.querySelector("input[type=hidden]").value;
const said = (w = wrap) => w.querySelector(".ui-barcodein-out p")?.textContent;
const use = (w = wrap) => w.querySelector(".ui-barcodein-out > button");
const others = (w = wrap) => [...w.querySelectorAll(".ui-barcodein-others > div")].map((d) => `${d.querySelector("dt").textContent} ${d.querySelector("dd").textContent}`);
if (hid() !== "0306406152" || said() !== "ISBN-10: the check digit is right." || others().join() !== "ISBN-13 9780306406157") return `start: ${hid()} ${said()} ${others()}`;
for (const [code, name, form] of [
    ["4006381333931", "EAN-13", ""], ["73513537", "EAN-8", ""], ["036000291452", "UPC-A", "EAN-13 0036000291452"], ["0 36000 29145 2", "UPC-A", "EAN-13 0036000291452"],
    ["0012345678905", "EAN-13", "UPC-A 012345678905"], ["9780306406157", "ISBN-13", "ISBN-10 0306406152"], ["978-0-306-40615-7", "ISBN-13", "ISBN-10 0306406152"],
    ["9791069150003", "ISBN-13", ""], ["080442957X", "ISBN-10", "ISBN-13 9780804429573"], ["080442957x", "ISBN-10", "ISBN-13 9780804429573"], ["0-8044-2957-X", "ISBN-10", "ISBN-13 9780804429573"],
    ["043942089X", "ISBN-10", "ISBN-13 9780439420891"], ["155404295X", "ISBN-10", "ISBN-13 9781554042951"],
]) {
    type(box, code); await wait(20);
    if (said() !== `${name}: the check digit is right.`) return `"${code}": ${said()}`;
    if (others().join() !== form) return `"${code}" converts to: ${others()}`;
    if (hid() !== code.replace(/[\s-]/g, "").toUpperCase()) return `"${code}" goes in the form as ${hid()}`;
}
for (const [code, says, fixed] of [
    ["4006381333932", "EAN-13: the check digit should be 1, not 2.", "4006381333931"], ["73513530", "EAN-8: the check digit should be 7, not 0.", "73513537"],
    ["036000291453", "UPC-A: the check digit should be 2, not 3.", "036000291452"], ["0306406153", "ISBN-10: the check digit should be 2, not 3.", "0306406152"],
    ["0804429570", "ISBN-10: the check digit should be X, not 0.", "080442957X"], ["9780306406158", "ISBN-13: the check digit should be 7, not 8.", "9780306406157"],
]) {
    type(box, code); await wait(20);
    if (said() !== says) return `"${code}": ${said()}`;
    if (hid() !== "" || box.getAttribute("aria-invalid") !== "true") return `"${code}" goes through`;
    if (use()?.textContent !== `Use ${fixed}` || wrap.querySelector(".ui-barcodein-digits mark")?.textContent !== code.slice(-1)) return `the fix for "${code}": ${use()?.textContent}`;
}
use().click(); await wait(40);
if (box.value !== "9780306406157" || hid() !== "9780306406157" || document.activeElement !== box) return `the fix: ${box.value}`;
wrap.querySelector(".ui-barcodein-others button").click(); await wait(40);
if (box.value !== "0306406152" || said() !== "ISBN-10: the check digit is right.") return `converting: ${box.value}`;
wrap.querySelector(".ui-barcodein-others button").click(); await wait(40);
if (box.value !== "9780306406157") return `and back: ${box.value}`;
for (const [code, says, fixed] of [
    ["7351353", "One digit short of an EAN-8: its check digit would be 7.", "73513537"], ["03600029145", "One digit short of a UPC-A: its check digit would be 2.", "036000291452"],
    ["030640615", "One digit short of an ISBN-10: its check digit would be 2.", "0306406152"], ["080442957", "One digit short of an ISBN-10: its check digit would be X.", "080442957X"],
    ["978030640615", "One digit short of an ISBN-13: its check digit would be 7.", "9780306406157"],
]) {
    type(box, code); await wait(20);
    if (said() !== says || use()?.textContent !== `Use ${fixed}` || hid() !== "" || box.getAttribute("aria-invalid")) return `"${code}": ${said()}`;
}
for (const [code, says, invalid] of [
    ["123", "3 digits: a barcode has 8, 12 or 13, an ISBN 10 or 13.", false], ["1", "1 digit: a barcode has 8, 12 or 13, an ISBN 10 or 13.", false], ["12345678901234", "14 digits: a barcode has 8, 12 or 13, an ISBN 10 or 13.", false],
    ["12a4", `"A" is not a digit (character 3).`, true], ["😀", `"😀" is not a digit (character 1).`, true], ["08X4429570", "X only ends an ISBN-10 (character 3).", true], ["12345678901X", "X only ends an ISBN-10 (character 12).", true],
    ["1".repeat(41), "That is too long for a barcode: 40 characters at most.", true],
]) {
    type(box, code); await wait(20);
    if (said() !== says) return `"${code.slice(0, 20)}": ${said()}`;
    if ((box.getAttribute("aria-invalid") === "true") !== invalid || hid() !== "") return `"${code.slice(0, 20)}" marked wrongly`;
}
type(box, "  -- "); await wait(30);
if (said() || hid() !== "" || box.getAttribute("aria-invalid")) return "blank";
const live = $("#barcode-demo-live"), lw = live.closest(".ui-barcodein"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
type(live, "4006381333931"); await wait(30);
if (note() !== "on_change: ean13 valid 4006381333931") return `on_change: ${note()}`;
type(live, "4006381333930"); await wait(30);
if (note() !== "on_change: ean13 not valid 4006381333930") return `on_change, bad: ${note()}`;
use(lw).click(); await wait(40);
if (note() !== "on_change: ean13 valid 4006381333931") return `on_change on a fix: ${note()}`;
const books = $("#barcode-demo-books"), bw = books.closest(".ui-barcodein");
type(books, "4006381333931"); await wait(30);
if (said(bw) !== "This field takes ISBN-10, ISBN-13, and this has the shape of an EAN-13." || hid(bw) !== "") return `kinds: ${said(bw)}`;
type(books, "036000291452"); await wait(30);
if (said(bw) !== "This field takes ISBN-10, ISBN-13, and this has the shape of a UPC-A.") return `kinds: ${said(bw)}`;
type(books, "9780306406157"); await wait(30);
if (hid(bw) !== "9780306406157") return "a book passes";
