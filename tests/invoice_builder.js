// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#invoice-builder-demo-title").closest(".ui-invoice-builder");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent;
const rates = (x = c) => [...x.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((d) => d.textContent).join(" ")).join("|");
const amounts = (x = c) => [...x.querySelectorAll("[data-amount]")].map((d) => d.textContent).join(" ");
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
// Worked by hand: the 5% (50.25) falls 45.00, 2.50, 2.75 on nets of 900.00, 49.99, 54.97.
if (s("subtotal") !== "$1,109.96" || s("line_discounts") !== "$105.00" || s("order_discount") !== "$50.25" || s("tax") !== "$183.11" || s("total") !== "$1,137.82")
    return `totals: ${s("subtotal")} ${s("line_discounts")} ${s("order_discount")} ${s("tax")} ${s("total")}`;
if (rates() !== "5% $52.22 $2.61|20% $902.49 $180.50") return `summary: ${rates()}`;
if (amounts() !== "$900.00 $49.99 $54.97") return `lines: ${amounts()}`;
// Due dates, by terms and across a year's end and a leap February.
const due = () => $("#invoice-builder-demo-due").textContent;
const terms = $("#invoice-builder-demo-terms");
const pick = (v) => { terms.value = v; terms.dispatchEvent(new Event("change", { bubbles: true })); };
if (due() !== "2026-12-01") return `net 30: ${due()}`;
pick("net60"); await tick();
if (due() !== "2026-12-31") return `net 60: ${due()}`;
pick("net90"); await tick();
if (due() !== "2027-01-30") return `net 90: ${due()}`;
pick("receipt"); await tick();
if (due() !== "2026-11-01") return `receipt: ${due()}`;
pick("eom"); type($("#invoice-builder-demo-issued"), "2028-01-31"); await tick();
if (due() !== "2028-02-29") return `end of next month: ${due()}`;
type($("#invoice-builder-demo-issued"), ""); await tick();
if (due() !== "No date yet") return `no date: ${due()}`;
type($("#invoice-builder-demo-issued"), "2026-11-01"); pick("net30"); await tick();
// Inclusive: each rate's tax comes out of what its lines come to.
c.querySelector("input[name=invoice_tax_inclusive]").click(); await tick();
if (s("total") !== "$954.71" || s("tax") !== "$152.91" || rates() !== "5% $49.73 $2.49|20% $752.07 $150.42") return `inclusive: ${s("total")} ${s("tax")} ${rates()}`;
c.querySelector("input[name=invoice_tax_inclusive]").click(); await tick();
// Bad input.
const rows = () => [...c.querySelectorAll(".ui-invoice-builder-row")];
const cell = (i, n) => rows()[i].querySelector(`input[name=invoice_${n}]`);
for (const [n, text, want] of [["quantity", "two", "quantity of Design work"], ["unit_price", "-3", "price of Design work"], ["line_discount", "ten", "discount of Design work"],
    ["line_discount", "120%", "discount of Design work"], ["line_discount", "5000", "more than the line comes to"], ["tax_rate", "abc", "tax rate of Design work"], ["unit_price", "1e9", "price of Design work"]]) {
    const was = cell(0, n).value;
    type(cell(0, n), text); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-invoice-builder-out")) return `${n} ${text}: ${alert()}`;
    if (cell(0, n).getAttribute("aria-invalid") !== "true") return `${n} ${text}: aria-invalid`;
    type(cell(0, n), was);
}
await tick();
{
    const q = cell(0, "quantity").value, u = cell(0, "unit_price").value;
    type(cell(0, "quantity"), "1000000"); type(cell(0, "unit_price"), "100000000"); await tick();
    if (!alert().includes("amount of Design work is too large")) return `too large: ${alert()}`;
    type(cell(0, "quantity"), q); type(cell(0, "unit_price"), u); await tick();
}
type($("#invoice-builder-demo-discount"), "9999"); await tick();
if (!alert().includes("order discount is more than")) return `order too big: ${alert()}`;
type($("#invoice-builder-demo-discount"), "bad"); await tick();
if (!alert().includes("order discount must be")) return `order bad: ${alert()}`;
// An order discount as an amount: 100.00 of 1004.96 by largest remainder.
type($("#invoice-builder-demo-discount"), "100"); await tick();
if (s("order_discount") !== "$100.00" || rates() !== "5% $49.50 $2.48|20% $855.46 $171.09") return `an amount off: ${rates()}`;
if (s("total") !== "$1,078.53") return `total: ${s("total")}`;
// A half quantity rounds half up; a blank quantity counts as 1.
type(cell(1, "quantity"), ""); type(cell(1, "unit_price"), "10.01"); type(cell(2, "quantity"), "0.5"); type(cell(2, "unit_price"), "0.05"); type(cell(2, "line_discount"), ""); await tick();
if (amounts() !== "$900.00 $10.01 $0.03") return `half: ${amounts()}`;
// Saving asks for what is missing and names it.
const save = [...c.querySelectorAll("button")].find((b) => b.textContent === "Save invoice");
type($("#invoice-builder-demo-bill-to"), "   "); await tick();
save.click(); await tick();
if (!alert().includes("who the invoice is for")) return `no customer: ${alert()}`;
if ($("#invoice-builder-demo-bill-to").getAttribute("aria-invalid") !== "true") return "no customer: aria-invalid";
type($("#invoice-builder-demo-bill-to"), "Acme Ltd"); await tick();
if (alert().includes("who the invoice is for")) return "the message does not clear";
type(cell(0, "description"), ""); await tick();
if (!alert().includes("Describe line 1")) return `no description: ${alert()}`;
type(cell(0, "description"), "Design work"); await tick();
// Adding and removing lines; the last line left stays as a blank row.
const add = [...c.querySelectorAll("button")].find((b) => b.textContent === "Add a line");
const before = s("total");
add.click(); await tick();
if (rows().length !== 4) return "add a line";
if (s("total") !== before || alert() !== "") return `a blank line counts: ${s("total")} ${alert()}`;
rows()[3].querySelector("button").click(); await tick();
if (rows().length !== 3) return "remove a line";
// Sequence and on_save: 2 x 121.00 with 21% in it is 200 + 42, due the end of next month.
const d = $("#invoice-builder-demo-live-title").closest(".ui-invoice-builder");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("tax", d) !== "€42.00" || s("total", d) !== "€242.00") return `live: ${s("tax", d)} ${s("total", d)}`;
const dsave = [...d.querySelectorAll("button")].find((b) => b.textContent === "Save invoice");
dsave.click(); await tick();
if (note() !== "on_save: INV-0099, 1 lines, total 242.00, tax 42.00, due 2026-12-31.") return `on_save: ${note()}`;
const num = $("#invoice-builder-demo-live-number");
if (num.value !== "INV-0100") return `next number: ${num.value}`;
if (!d.querySelector("[role=status]").textContent.startsWith("Saved INV-0099 for €242.00")) return "no saved message";
if (d.querySelector("input[name=next_description]").value !== "" || d.querySelector("input[name=next_bill_to]").value !== "") return "the next invoice should start empty";
// INV-0100 is taken already, and saved numbers are taken too.
type(d.querySelector("input[name=next_bill_to]"), "Contoso"); type(d.querySelector("input[name=next_description]"), "Audit"); type(d.querySelector("input[name=next_unit_price]"), "100"); await tick();
dsave.click(); await tick();
if (!alert(d).includes("INV-0100 is already used") || !note().includes("INV-0099")) return `used: ${alert(d)}`;
type(num, "INV-0099"); await tick();
if (!alert(d).includes("INV-0099 is already used")) return `saved number: ${alert(d)}`;
type(num, "INV-9999"); await tick(); dsave.click(); await tick();
if (num.value !== "INV-10000") return `past the padding: ${num.value}`;
type(d.querySelector("input[name=next_bill_to]"), "X"); type(d.querySelector("input[name=next_unit_price]"), "1"); type(d.querySelector("input[name=next_description]"), "Y"); type(num, "Draft"); await tick(); dsave.click(); await tick();
if (num.value !== "Draft-2") return `no digits: ${num.value}`;
