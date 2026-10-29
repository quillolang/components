const t = $("#cross-rates-demo");
const cell = (r, c) => t.querySelector(`tr[data-code="${r}"] td[data-code="${c}"]`);
const text = (r, c) => cell(r, c).textContent.trim();
const heads = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
if (heads.slice(1).join(" ") !== "USD EUR GBP JPY CHF CAD") return `the columns: ${heads}`;
if (t.querySelectorAll("tbody tr").length !== 6 || t.querySelectorAll("tbody td").length !== 36) return "not a 6 by 6 matrix";
for (const c of ["USD", "EUR", "GBP", "JPY", "CHF", "CAD"]) {
    const d = cell(c, c);
    if (!d.classList.contains("ui-fxcross-self") || d.textContent.trim() !== "same currency" || d.querySelector(".ui-sr") === null) return `the diagonal at ${c} is not blank`;
}
if (text("USD", "EUR") !== "0.9224" || text("EUR", "USD") !== "1.0841") return `EUR and USD: ${text("USD", "EUR")} ${text("EUR", "USD")}`;
if (text("EUR", "JPY") !== "169.38" || text("JPY", "USD") !== "0.006400") return `JPY: ${text("EUR", "JPY")} ${text("JPY", "USD")}`;
if (text("GBP", "EUR") !== "1.1764" || text("CHF", "CAD") !== "1.5599") return `crosses: ${text("GBP", "EUR")} ${text("CHF", "CAD")}`;
const prod = Number(cell("EUR", "GBP").dataset.rate) * Number(cell("GBP", "EUR").dataset.rate);
if (Math.abs(prod - 1) > 1e-9) return `EUR/GBP times GBP/EUR is ${prod}`;
if (!t.querySelector('tr[data-code="USD"] th .ui-fxcross-base')) return "the base is not marked";
if (!t.querySelector("caption").textContent.includes("mid-market, 14:05 UTC")) return "updated";
const c = $("#cross-rates-demo-cee");
const cc = (r, k) => c.querySelector(`tr[data-code="${r}"] td[data-code="${k}"]`);
if (cc("EUR", "HUF").textContent.trim() !== "395.8000" || cc("PLN", "CZK").textContent.trim() !== "5.8467") return `decimals={4}: ${cc("EUR", "HUF").textContent} ${cc("PLN", "CZK").textContent}`;
if (!cc("PLN", "EUR").classList.contains("ui-fxcross-hl") || !cc("CZK", "PLN").classList.contains("ui-fxcross-hl") || cc("CZK", "HUF").classList.contains("ui-fxcross-hl")) return "highlight";
