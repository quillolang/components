// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#bill-splitter-demo-subtotal").closest(".ui-bill-split");
const sum = (k) => c.querySelector(`[data-key=${k}]`)?.textContent;
const pays = (s = c) => [...s.querySelectorAll("tbody tr")].map((r) => [...r.cells].map((x) => x.textContent).join(" ")).join("|");
if (sum("tax") !== "$7.13" || sum("tip") !== "$15.55" || sum("total") !== "$109.08") return `start: ${sum("tax")} ${sum("tip")} ${sum("total")}`;
if (pays() !== "Ana $36.36|Ben $36.36|Cy $36.36") return `equal: ${pays()}`;
type($("#bill-splitter-demo-subtotal"), "100"); await tick();
if (sum("total") !== "$126.25") return `100: ${sum("total")}`;
if (pays() !== "Ana $42.09|Ben $42.08|Cy $42.08") return `the odd cent: ${pays()}`;
// A tip on the total with tax: 18% of 108.25 is 19.485, half up.
c.querySelector("input[name=bill_tip_on_total]").click(); await tick();
if (sum("tip") !== "$19.49" || sum("total") !== "$127.74") return `tip on total: ${sum("tip")} ${sum("total")}`;
c.querySelector("input[name=bill_tip_on_total]").click(); await tick();
// By shares: 12625 cents by 1, 2, 1 is 3156.25, 6312.5, 3156.25: the cent goes to the largest remainder, not the first.
c.querySelector("input[name=bill_mode][value=shares]").click(); await tick();
const shares = c.querySelectorAll("input[name=bill_shares]");
if (shares.length !== 3) return "no shares fields";
type(shares[1], "2"); await tick();
if (pays() !== "Ana $31.56|Ben $63.13|Cy $31.56") return `shares: ${pays()}`;
type(shares[0], "x"); await tick();
const alert = () => c.querySelector("[role=alert]")?.textContent ?? "";
if (!alert().includes("shares of Ana") || c.querySelector(".ui-bill-split-out") || shares[0].getAttribute("aria-invalid") !== "true") return `bad share: ${alert()}`;
type(shares[0], "0"); type(shares[1], "0"); type(shares[2], "0"); await tick();
if (!alert().includes("at least one person a share")) return `no shares at all: ${alert()}`;
type(shares[0], "1"); type(shares[1], "0"); type(shares[2], "0"); await tick();
if (pays() !== "Ana $126.25|Ben $0.00|Cy $0.00") return `one share: ${pays()}`;
c.querySelector("input[name=bill_mode][value=equal]").click(); await tick();
// Bad amounts say what is wrong and never stop it.
for (const [text, want] of [["12,50", "bill before tax"], ["abc", "bill before tax"], ["-5", "bill before tax"], ["1e5", "bill before tax"], ["99999999999999999999999999999999999", "bill before tax"], ["١٢", "bill before tax"]]) {
    type($("#bill-splitter-demo-subtotal"), text); await tick();
    if (!alert().toLowerCase().includes(want)) return `${text}: ${alert()}`;
}
type($("#bill-splitter-demo-subtotal"), "1,234.56"); await tick();
if (sum("subtotal") !== "$1,234.56") return `thousands: ${sum("subtotal")}`;
type($("#bill-splitter-demo-subtotal"), "   "); await tick();
if (sum("total") !== "$0.00" || pays() !== "Ana $0.00|Ben $0.00|Cy $0.00") return `blank: ${sum("total")} ${pays()}`;
type($("#bill-splitter-demo-tax"), "5000"); await tick();
if (!alert().includes("percent from 0 to 1000")) return `tax 5000%: ${alert()}`;
type($("#bill-splitter-demo-tax"), "0"); type($("#bill-splitter-demo-tip"), "0"); type($("#bill-splitter-demo-subtotal"), "0.01"); await tick();
if (pays() !== "Ana $0.01|Ben $0.00|Cy $0.00") return `one cent: ${pays()}`;
// Tax as an amount, a tip past the cents.
type($("#bill-splitter-demo-subtotal"), "10"); type($("#bill-splitter-demo-tax"), "1.005");
const taxAs = c.querySelector("select[name=bill_tax_as]"); taxAs.value = "amount"; taxAs.dispatchEvent(new Event("change", { bubbles: true })); await tick();
if (sum("tax") !== "$1.01") return `tax as amount: ${sum("tax")}`;
// Adding and removing people, with focus kept on a typed row.
const names = () => [...c.querySelectorAll("input[name=bill_person]")];
[...c.querySelectorAll("button")].find((b) => b.textContent === "Add a person").click(); await tick();
if (names().length !== 4) return "add a person";
if (pays().split("|")[3] !== "Person 4 $2.75") return `a blank name: ${pays()}`;
names()[3].focus(); type(names()[3], "Dee"); await tick();
if (document.activeElement !== names()[3] || !pays().includes("Dee")) return "typing a name loses focus or does not show";
[...c.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === "Remove Ana").click(); await tick();
if (pays().split("|")[0] !== "Ben $3.67") return `removing: ${pays()}`;
for (let i = 0; i < 30; i++) { const b = [...c.querySelectorAll("button")].find((b) => b.textContent === "Add a person"); if (b.disabled) break; b.click(); await tick(); }
await tick();
if (names().length !== 30) return `cap: ${names().length}`;
// Items, from the second demo: 925 and 3325 of 4250, of 5175 in all.
const d = $("#bill-splitter-demo-items-title").closest(".ui-bill-split");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
const dsum = (k) => d.querySelector(`[data-key=${k}]`)?.textContent;
if (dsum("subtotal") !== "€42.50" || dsum("tax") !== "€4.25" || dsum("tip") !== "€5.00" || dsum("total") !== "€51.75") return `items: ${dsum("total")}`;
if (pays(d) !== "Ana €9.25 €11.26|Ben €33.25 €40.49") return `by items: ${pays(d)}`;
// Nobody ticked on the wine: everyone shares it, and it says so.
const wine = d.querySelectorAll(".ui-bill-split-who")[1].querySelectorAll("input");
wine[1].click(); await tick();
if (!d.querySelector(".ui-bill-split-notes")?.textContent.includes("Nobody is ticked for Wine")) return "no note for an item with nobody";
if (pays(d) !== "Ana €21.25 €25.88|Ben €21.25 €25.87") return `shared wine: ${pays(d)}`;
if (note() !== "on_change: 2 parts of 51.75, Ana pays 25.88.") return `on_change: ${note()}`;
const price = d.querySelectorAll("input[name=dinner_price]")[0];
type(price, "oops"); await tick();
if (!d.querySelector("[role=alert]")?.textContent.includes("price of Pizza")) return "bad price";
type(price, "18.50"); await tick();
[...d.querySelectorAll("button")].find((b) => b.textContent === "Add an item").click(); await tick();
if (d.querySelectorAll("input[name=dinner_item]").length !== 3) return "add an item";
const sumOf = (t) => t.split("|").map((r) => Number(r.split("€").pop())).reduce((a, b) => a + Math.round(b * 100), 0);
if (sumOf(pays(d)) !== 5175) return `parts do not add up: ${pays(d)}`;
