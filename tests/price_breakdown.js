const [eur, yen] = $$(".ui-price-breakdown");
const rows = (b) => [...b.querySelectorAll(".ui-price-breakdown-line")].map((l) => [l.querySelector("dt").firstChild.textContent, l.querySelector("dd").textContent]);
if (eur.querySelector("h3")?.textContent !== "Your stay") return "no title";
if (rows(eur).length !== 6 || rows(eur)[5].join() !== "Total,€1,062.88") return `lines: ${JSON.stringify(rows(eur))}`;
if (!eur.querySelectorAll(".ui-price-breakdown-line")[1].classList.contains("ui-price-breakdown-success")) return "a discount is not shown as one";
if (eur.querySelectorAll(".ui-price-breakdown-hint")[1].textContent !== "2 guests × 7 nights") return "hints are not shown";
if (rows(yen)[4].join() !== "Total (JPY),￥76,840") return "total_label is not used";
const dd = eur.querySelectorAll("dd");
if (Math.abs(dd[0].getBoundingClientRect().right - dd[5].getBoundingClientRect().right) > 1) return "the amounts do not line up";
