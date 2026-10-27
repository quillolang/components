const [inv, team] = $$(".ui-dt");
if (!inv || !team) return "expected two tables";
const ths = () => [...inv.querySelectorAll("th")];
const th = (name) => ths().find((t) => t.textContent.trim() === name);
const col = (i) => [...inv.querySelectorAll("tbody tr")].map((r) => r.children[i]?.textContent.trim());
const money = (s) => Number(s.replace(/[$,]/g, ""));
const foot = () => inv.querySelector(".ui-dt-foot span").textContent.trim();
const btn = (t) => [...inv.querySelectorAll(".ui-dt-pages button")].find((b) => b.textContent === t);

if (th("Issued").getAttribute("aria-sort") !== "descending") return "order_by + descending do not set aria-sort";
if (col(2)[0] !== "Sep 28, 2026") return `the newest invoice is not first: ${col(2)[0]}`;
if (col(0).length !== 10) return `page_size=10 shows ${col(0).length} rows`;
if (foot() !== "1–10 of 26") return `the pager says "${foot()}"`;
if (th("Tax").querySelector("button")) return "a column without sortable has a sort button";

th("Total").querySelector("button").click(); await wait();
if (th("Total").getAttribute("aria-sort") !== "ascending") return "clicking Total does not sort ascending";
if (th("Issued").hasAttribute("aria-sort")) return "the old column keeps aria-sort";
let totals = col(5).map(money);
if (totals.some((t, i) => i && t < totals[i - 1])) return `not ascending: ${totals}`;
if (col(5)[0] !== "$821.03") return `the smallest total is not first: ${col(5)[0]}`;
th("Total").querySelector("button").click(); await wait();
if (th("Total").getAttribute("aria-sort") !== "descending") return "a second click does not sort descending";
if (col(5)[0] !== "$14,904.00") return `the largest total is not first: ${col(5)[0]}`;

th("Customer").querySelector("button").click(); await wait();
const names = col(1);
if (names.some((n, i) => i && n.toLowerCase() < names[i - 1].toLowerCase())) return `customers not in order: ${names}`;

btn("Next").click(); await wait();
if (foot() !== "11–20 of 26") return `after Next the pager says "${foot()}"`;
btn("Next").click(); await wait();
if (foot() !== "21–26 of 26" || col(0).length !== 6) return `the last page: "${foot()}", ${col(0).length} rows`;
if (!btn("Next").disabled) return "Next is not disabled on the last page";
btn("Previous").click(); await wait();
if (foot() !== "11–20 of 26") return `Previous: "${foot()}"`;

const box = inv.querySelector("input[type=search]");
type(box, "NORTHWIND"); await wait();
if (foot() !== "1–5 of 5") return `searching NORTHWIND: "${foot()}"`;
if (col(1).some((c) => c !== "Northwind Traders")) return `the search kept other rows: ${col(1)}`;
type(box, "mar 14"); await wait();
if (col(0).join() !== "INV-1056") return `searching a shown date finds ${col(0)}`;
type(box, "zzz"); await wait();
if (inv.querySelector(".ui-dt-empty")?.textContent.trim() !== "No invoice matches.") return "no match does not show the empty text";
if (foot() !== "No rows") return `the pager with no rows says "${foot()}"`;
type(box, ""); await wait();
if (foot() !== "1–10 of 26") return `clearing the search: "${foot()}"`;
th("Total").querySelector("button").click(); await wait();
th("Total").querySelector("button").click(); await wait();
if (col(5)[0] !== "$14,904.00" || !col(5).includes("$11,758.71")) return `money: ${col(5)}`;

if (col(4).some((t) => !/^\d+(\.\d)?%$/.test(t)) || !col(4).includes("12.5%")) return `percent is not formatted: ${col(4)}`;
if (col(5).some((t) => !/^\$\d{1,3}(,\d{3})*\.\d\d$/.test(t))) return `money is not formatted: ${col(5)}`;
const tt = team.textContent;
for (const s of ["1,284.5", "978.25", "1,190", "87.5%", "92%", "—"]) if (!tt.includes(s)) return `the team table does not show ${s}`;
if (team.querySelector(".ui-dt-foot")) return "a table without page_size has no pager";
if (!team.querySelector("td.ui-dt-right")) return "number columns are not right-aligned";
if (getComputedStyle(inv.querySelector("th")).position !== "sticky") return "the header is not sticky";
const hours = [...team.querySelectorAll("th")].find((t) => t.textContent.trim() === "Hours").querySelector("button");
hours.click(); await wait();
const tcol = (i) => [...team.querySelectorAll("tbody tr")].map((r) => r.children[i].textContent.trim());
if (tcol(2).join("|") !== "978.25|1,012|1,190|1,284.5") return `the browser formats hours as ${tcol(2)}`;
if (tcol(3).join("|") !== "70%|—|87.5%|92%") return `the browser formats percent as ${tcol(3)}`;
