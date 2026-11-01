// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#tax-brackets-demo-title").closest(".ui-tax-brackets");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent.trim().replace(/\s+/g, " ");
const f = (n, id = "tax-brackets-demo") => $(`#${id}-${n}`);
const rows = (x = c) => [...x.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((d) => d.textContent).join(" ")).join("|");
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
// 62,000 less 12,000 is 50,000: 1,000 + 6,000 + 3,000, less 500 credit: by hand.
if (rows() !== "$0.00 to $10,000.00 10% $10,000.00 $1,000.00|$10,000.00 to $40,000.00 20% $30,000.00 $6,000.00|Over $40,000.00 30% $10,000.00 $3,000.00") return `slices: ${rows()}`;
if (s("taxable") !== "$50,000.00" || s("before") !== "$10,000.00" || s("used") !== "$500.00" || s("tax") !== "$9,500.00") return `tax: ${s("taxable")} ${s("before")} ${s("used")} ${s("tax")}`;
if (s("effective") !== "15.32%" || s("marginal") !== "30%" || s("home") !== "$52,500.00") return `rates: ${s("effective")} ${s("marginal")} ${s("home")}`;
if (s("raise") !== "Of a raise of $5,000.00 you keep $3,500.00 (70.0%), as tax goes up by $1,500.00.") return `raise: ${s("raise")}`;
// Exactly on a boundary: the last unit was at 20%, the next is at 30%, and the 30% row is the next one.
type(f("deductions"), "22000"); await tick();
if (s("taxable") !== "$40,000.00" || s("tax") !== "$6,500.00" || s("marginal") !== "30%") return `on a boundary: ${s("tax")} ${s("marginal")}`;
if (c.querySelector(".ui-tax-brackets-next td").textContent !== "Over $40,000.00") return `the next bracket: ${c.querySelector(".ui-tax-brackets-next td").textContent}`;
if (s("raise") !== "Of a raise of $5,000.00 you keep $3,500.00 (70.0%), as tax goes up by $1,500.00.") return `raise from a boundary: ${s("raise")}`;
type(f("deductions"), "22000.01"); await tick();
if (s("marginal") !== "20%" || s("tax") !== "$6,500.00") return `one cent under: ${s("marginal")} ${s("tax")}`;
// A raise across a boundary: 40,000 - 0.01 ... 5,000: taxed at 20% for a cent.
type(f("deductions"), "30000"); await tick();
if (s("raise") !== "Of a raise of $5,000.00 you keep $4,000.00 (80.0%), as tax goes up by $1,000.00.") return `inside: ${s("raise")}`;
type(f("raise"), "10000"); await tick();
if (s("raise") !== "Of a raise of $10,000.00 you keep $7,800.00 (78.0%), as tax goes up by $2,200.00. Part of it falls in the 30% bracket.") return `crossing: ${s("raise")}`;
type(f("raise"), "10%"); await tick();
if (s("raise") !== "Of a raise of $6,200.00 you keep $4,960.00 (80.0%), as tax goes up by $1,240.00.") return `a percent: ${s("raise")}`;
type(f("raise"), ""); await tick();
if (s("raise")) return "no raise";
type(f("deductions"), "12000"); await tick();
// Credits stop at the tax, or are paid out when refundable.
type(f("credits"), "20000"); await tick();
if (s("tax") !== "$0.00" || s("used") !== "$10,000.00" || s("unused") !== "$10,000.00 of the credits is more than the tax, and goes unused." || s("home") !== "$62,000.00") return `credits: ${s("tax")} ${s("unused")}`;
c.querySelector("input[name=tax_refundable]").click(); await tick();
if (s("tax") !== "-$10,000.00" || s("home") !== "$72,000.00" || s("unused")) return `refundable: ${s("tax")} ${s("home")}`;
c.querySelector("input[name=tax_refundable]").click(); type(f("credits"), "500"); await tick();
// Nothing, a loss, deductions past the income.
type(f("income"), ""); await tick();
if (s("tax") !== "$0.00" || s("effective") !== "0%" || s("marginal") !== "10%") return `no income: ${s("tax")} ${s("effective")} ${s("marginal")}`;
type(f("income"), "-2,500.50"); await tick();
if (s("tax") !== "$0.00" || s("home") !== "-$2,500.50" || s("taxable") !== "$0.00" || !c.querySelector(".ui-tax-brackets-note").textContent.includes("loss")) return `a loss: ${s("home")}`;
type(f("income"), "5000"); await tick();
if (s("taxable") !== "$0.00" || s("tax") !== "$0.00" || s("home") !== "$5,000.00") return `deductions past income: ${s("taxable")}`;
// Half a cent in one slice rounds half up.
type(f("income"), "12000.05"); type(f("credits"), ""); await tick();
if (s("tax") !== "$0.01") return `half a cent: ${s("tax")}`;
type(f("income"), "62000"); type(f("credits"), "500"); await tick();
// Bad figures and bad data.
for (const [n, t, want] of [["income", "abc", "income must"], ["income", "--5", "income must"], ["deductions", "-1", "deductions must"], ["credits", "12,50", "credits must"], ["raise", "lots", "raise must"], ["raise", "-5", "raise must"], ["income", "1e300", "income must"]]) {
    const was = f(n).value;
    type(f(n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-tax-brackets-out")) return `${n} ${t}: ${alert()}`;
    type(f(n), was);
}
await tick();
const box = f("brackets");
const good = box.value;
for (const [t, want] of [["{oops", "not valid JSON"], ["", "not valid JSON"], ["[]", "at least one bracket"], ["5", "at least one bracket"], ["[1]", "Bracket 1 must be a map"],
    ['[{"upto":null}]', "Bracket 1 needs a rate"], ['[{"upto":null,"rate":120}]', "Bracket 1 needs a rate"], ['[{"upto":100,"rate":10}]', "last bracket must have no upper limit"],
    ['[{"upto":null,"rate":10},{"upto":null,"rate":20}]', "only the last may leave it out"], ['[{"upto":100,"rate":10},{"upto":50,"rate":20},{"upto":null,"rate":30}]', "Bracket 2 ends at 50, which is not above where it starts, 100"],
    ['[{"upto":"x","rate":10},{"upto":null,"rate":30}]', "Bracket 1 needs upto"], ['[{"upto":[1],"rate":10},{"upto":null,"rate":30}]', "Bracket 1 needs upto"]]) {
    type(box, t); await tick();
    if (!alert().includes(want)) return `data ${t}: ${alert()}`;
}
if (!c.querySelector("details").open) return "bad data should open the box";
// New brackets as data; one flat rate.
type(box, '[{"upto":null,"rate":12.5}]'); await tick();
if (s("before") !== "$6,250.00" || s("marginal") !== "12.5%" || rows() !== "Over $0.00 12.5% $50,000.00 $6,250.00") return `flat: ${s("before")} ${rows()}`;
type(box, good); await tick();
if (s("before") !== "$10,000.00") return "back to the data";
// A top bracket and a percent raise, with on_change: UK-like bands.
const d = $("#tax-brackets-demo-live-title").closest(".ui-tax-brackets");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("before", d) !== "€3,500.00" || s("tax", d) !== "-€500.00" || s("home", d) !== "€30,500.00") return `live: ${s("before", d)} ${s("tax", d)} ${s("home", d)}`;
if (s("raise", d) !== "Of a raise of €1,200.00 you keep €960.00 (80.0%), as tax goes up by €240.00.") return `live raise: ${s("raise", d)}`;
type(f("income", "tax-brackets-demo-live"), "50000"); await tick();
if (s("marginal", d) !== "40%") return `live boundary: ${s("marginal", d)}`;
if (note() !== "on_change: tax 3500.00, 7.00% effective, 40% marginal, take-home 46500.00, keeps 1200.00.") return `on_change: ${note()}`;
