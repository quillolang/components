const t = $("#jxt-orders");
const p = $("#jxt-products");
if (!t || !p) return "expected two tables";
const ths = (el = t) => [...el.querySelectorAll("thead th")];
const types = (el = t) => ths(el).map((h) => `${h.dataset.key}:${h.dataset.type}`).join(" ");
const th = (key, el = t) => ths(el).find((h) => h.dataset.key === key);
const col = (key, el = t) => ths(el).indexOf(th(key, el));
const rows = (el = t) => [...el.querySelectorAll("tbody tr")];
const cell = (r, key, el = t) => rows(el)[r].children[col(key, el)];
const ids = () => rows().map((r) => r.children[col("id")].textContent.trim()).join(",");
const pick = (el, value) => { el.value = value; el.dispatchEvent(new Event("change", { bubbles: true })); };
const typeOf = (key) => th(key).querySelector("select");
const box = (key) => [...t.querySelectorAll(".ui-jxt-colitem")].find((li) => li.querySelector("label span").textContent === key);
const status = () => t.querySelector('[role="status"]').textContent;
const fmt = t.querySelector(".ui-jxt-format");

// Exports are caught instead of downloaded.
const saved = [];
const realUrl = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
URL.createObjectURL = (b) => { saved.push({ b }); return "blob:test"; };
HTMLAnchorElement.prototype.click = function () { saved[saved.length - 1].name = this.download; };
const exported = async (format) => {
    pick(fmt, format); await wait();
    const n = saved.length;
    t.querySelector(".ui-jxt-primary").click(); await wait();
    if (saved.length === n) return null;
    const bytes = new Uint8Array(await saved[n].b.arrayBuffer());
    return { name: saved[n].name, type: saved[n].b.type, bom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
             text: (await saved[n].b.text()).replace(/^﻿/, "") };
};
try {
    // Types worked out from the values; tags is left out at the start.
    if (types() !== "id:integer customer:text email:email total:money paid:boolean placed:date shipped_at:datetime coupon:text ship_to:json")
        return `types: ${types()}`;
    if (typeOf("total").value !== "money" || typeOf("total").getAttribute("aria-label") !== "Type of total") return "the type menu";
    if (th("total").querySelector(".ui-jxt-sort .ui-sr").textContent !== ", money") return "the header does not say its type to screen readers";
    if (!t.querySelector(".ui-jxt-count").textContent.includes("6 rows · 9 of 10 columns")) return `count: ${t.querySelector(".ui-jxt-count").textContent}`;
    const types2 = ths(p).map((h) => `${h.dataset.key}:${h.dataset.type}`).join(" ");
    if (types2 !== "sku:text name:text price:money stock:mixed weight_kg:decimal active:boolean site:url") return `products' types: ${types2}`;

    // How cells show.
    if (cell(0, "total").textContent.trim() !== "$129.99" || !cell(0, "total").classList.contains("ui-jxt-num")) return `money: ${cell(0, "total").textContent}`;
    if (cell(0, "id").textContent.trim() !== "1,001") return `integer: ${cell(0, "id").textContent}`;
    if (!cell(0, "paid").querySelector(".ui-jxt-yes") || cell(1, "paid").querySelector(".ui-sr")?.textContent !== "no") return "yes/no marks";
    if (!cell(0, "coupon").querySelector(".ui-jxt-null") || cell(0, "coupon").textContent.trim() !== "—empty") return `null: ${cell(0, "coupon").textContent}`;
    if (cell(0, "placed").textContent.trim() !== "Oct 2, 2026") return `date: ${cell(0, "placed").textContent}`;
    if (cell(2, "shipped_at").textContent.replace(/\s+/g, " ").trim() !== "Sep 29, 2026, 17:40 +02:00") return `date-time: ${cell(2, "shipped_at").textContent}`;
    if (cell(0, "email").querySelector("a")?.getAttribute("href") !== "mailto:ada@example.com") return "email link";
    if (cell(0, "ship_to").querySelector("code")?.textContent !== '{"city":"London","zip":"N1 9GU"}') return "nested JSON";
    if (cell(2, "stock", p).textContent.trim() !== "n/a" && !rows(p).some((r) => r.children[col("stock", p)].textContent.trim() === "n/a")) return "mixed";
    if (rows(p)[0].children[0].textContent.trim() !== "BOLT-M6" || th("price", p).getAttribute("aria-sort") !== "descending") return "products start sorted by price, descending";
    if (!p.querySelector(".ui-jxt-preview pre").textContent.startsWith('CREATE TABLE "products" (\n  "sku" VARCHAR(16) NOT NULL,'))
        return `the SQL preview: ${p.querySelector(".ui-jxt-preview pre").textContent.slice(0, 80)}`;

    // The preview is the file's start.
    const pre = t.querySelector(".ui-jxt-preview pre").textContent;
    if (!pre.startsWith("id,customer,email,total,paid,placed,shipped_at,coupon,ship_to\n1001,Ada Lovelace,") || pre.trimEnd().split("\n").length !== 6)
        return `preview: ${JSON.stringify(pre.slice(0, 120))}`;

    // CSV: quotes, commas, the BOM, the name.
    let out = await exported("csv");
    if (out?.name !== "orders.csv" || !out.bom || !out.type.startsWith("text/csv")) return `CSV file: ${out?.name} ${out?.type} bom=${out?.bom}`;
    let lines = out.text.split("\r\n");
    if (lines.length !== 8 || lines[7] !== "") return `CSV lines: ${lines.length}`;
    if (lines[2] !== '1002,"Grace ""Amazing"" Hopper, Rear Adm.",grace@example.com,45.50,false,2026-10-04,,FALL10,"{""city"":""New York"",""zip"":""10001""}"')
        return `a CSV row: ${lines[2]}`;
    if (status() !== "Saved orders.csv") return `status: "${status()}"`;

    // Left out, moved, put back.
    box("ship_to").querySelector("input").click(); await wait();
    if (th("ship_to") || !t.querySelector(".ui-jxt-cols summary").textContent.includes("8 of 10 included")) return "leaving a column out";
    box("tags").querySelector("input").click(); await wait();
    box("email").querySelector('button[aria-label="Move email up"]').click(); await wait();
    if (ths().map((h) => h.dataset.key).join(",") !== "id,email,customer,total,paid,placed,shipped_at,coupon,tags") return `columns: ${ths().map((h) => h.dataset.key)}`;
    out = await exported("tsv");
    lines = out.text.split("\n");
    if (out.name !== "orders.tsv" || out.bom || lines[0] !== "id\temail\tcustomer\ttotal\tpaid\tplaced\tshipped_at\tcoupon\ttags") return `TSV header: ${lines[0]}`;
    if (lines[5] !== "1005\t\tLinus\\tTorvalds\t310.40\tfalse\t2026-10-15\t\t\t[\"beta\"]") return `TSV escaping: ${lines[5]}`;

    // Sorting by type: amounts as numbers, then the other way, then not.
    th("total").querySelector(".ui-jxt-sort").click(); await wait();
    if (ids() !== "1,004,1,002,1,006,1,001,1,005,1,003" || th("total").getAttribute("aria-sort") !== "ascending") return `by total: ${ids()}`;
    th("total").querySelector(".ui-jxt-sort").click(); await wait();
    if (ids() !== "1,003,1,005,1,001,1,006,1,002,1,004" || th("total").getAttribute("aria-sort") !== "descending") return `by total, descending: ${ids()}`;
    th("total").querySelector(".ui-jxt-sort").click(); await wait();
    if (ids() !== "1,001,1,002,1,003,1,004,1,005,1,006" || th("total").hasAttribute("aria-sort")) return `unsorted: ${ids()}`;
    // Date-times by the instant, whatever their offset; empty ones last.
    th("shipped_at").querySelector(".ui-jxt-sort").click(); await wait();
    if (ids() !== "1,003,1,006,1,001,1,004,1,002,1,005") return `by shipped_at: ${ids()}`;
    if (!t.querySelector(".ui-jxt-count").textContent.includes("sorted by shipped_at")) return "the count does not say the sort";

    // Typed JSON follows the sort and the columns.
    out = await exported("json");
    if (out.name !== "orders.json" || !out.text.startsWith("[\n  {\"id\":1003,\"email\":\"orders@smith-sons.example\",\"customer\":\"Smith | Sons\",\"total\":1200.00,\"paid\":true,"))
        return `JSON: ${out.text.slice(0, 120)}`;
    const data = JSON.parse(out.text);
    if (data.length !== 6 || data[4].id !== 1002 || data[4].total !== 45.5 || data[4].paid !== false || data[4].shipped_at !== null || data[5].email !== null)
        return `JSON values: ${JSON.stringify(data[4])}`;

    // Changing a type: ids as text, a coupon as a number it is not.
    pick(typeOf("id"), "text"); await wait();
    if (th("id").dataset.type !== "text" || cell(0, "id").textContent.trim() !== "1003" || cell(0, "id").classList.contains("ui-jxt-num")) return "id as text";
    pick(typeOf("coupon"), "integer"); await wait();
    const bad = rows().map((r) => r.children[col("coupon")].querySelector(".ui-jxt-bad")).filter(Boolean);
    if (bad.length !== 2 || !bad[0].textContent.includes("(not a whole number)")) return `values that do not fit: ${bad.length}`;
    out = await exported("jsonl");
    lines = out.text.split("\n");
    if (out.name !== "orders.jsonl" || lines.length !== 7 || !lines[0].startsWith('{"id":"1003",') || !lines[3].includes('"coupon":"WELCOME"')) return `JSON Lines: ${lines[0]}`;
    pick(typeOf("coupon"), "text"); await wait();

    // SQL: types from the values, names and text quoted.
    out = await exported("sql");
    lines = out.text.split("\n");
    if (out.name !== "orders.sql" || lines[0] !== 'CREATE TABLE "orders" (' || lines[1] !== '  "id" VARCHAR(16) NOT NULL,' || lines[4] !== '  "total" DECIMAL(12, 2) NOT NULL,'
        || lines[7] !== '  "shipped_at" TIMESTAMP WITH TIME ZONE,' || lines[9] !== '  "tags" JSON NOT NULL') return `CREATE TABLE: ${lines.slice(0, 11).join(" / ")}`;
    const ins = lines.find((l) => l.includes("1004"));
    if (ins !== `INSERT INTO "orders" ("id", "email", "customer", "total", "paid", "placed", "shipped_at", "coupon", "tags") VALUES ('1004', 'siobhan@example.ie', 'Siobhán O''Brien', 8.05, TRUE, '2026-10-11', '2026-10-12 08:00:00Z', 'WELCOME', '[]');`)
        return `INSERT: ${ins}`;

    // Markdown: pipes and brackets escaped, numbers on the right.
    out = await exported("md");
    lines = out.text.split("\n");
    if (lines[1] !== "| --- | --- | --- | ---: | :---: | --- | --- | --- | --- |") return `Markdown rule: ${lines[1]}`;
    if (!lines[2].startsWith("| 1003 | orders@smith-sons.example | Smith \\| Sons | 1200.00 | true |") || !lines.some((l) => l.includes("Margaret \\<Hamilton\\> & co")))
        return `Markdown row: ${lines[2]}`;

    // Excel: typed cells, date-times in UTC, text escaped.
    out = await exported("xls");
    if (out.name !== "orders.xls" || !out.text.includes('<Worksheet ss:Name="orders">')) return `Excel: ${out.name}`;
    const first = out.text.split("\n").find((l) => l.includes(">1003<"));
    if (!first.includes('<Cell ss:StyleID="m"><Data ss:Type="Number">1200.00</Data></Cell><Cell><Data ss:Type="Boolean">1</Data></Cell>')
        || !first.includes('<Cell ss:StyleID="t"><Data ss:Type="DateTime">2026-09-29T15:40:00.000</Data></Cell>')
        || !first.includes('<Cell><Data ss:Type="String">1003</Data></Cell>')) return `Excel row: ${first}`;
    if (!out.text.includes('<Data ss:Type="String">Margaret &lt;Hamilton&gt; &amp; co</Data>') || !out.text.includes("<Cell/>")) return "Excel text and empty cells";
    if (t.querySelector(".ui-jxt-copy")) return "Excel is not offered to copy";

    // HTML and XML escape what they must.
    out = await exported("html");
    if (!out.text.startsWith("<!DOCTYPE html>") || !out.text.includes("<td>Grace &quot;Amazing&quot; Hopper, Rear Adm.</td>") || !out.text.includes("<td>Siobhán O&#39;Brien</td>"))
        return "HTML escaping";
    out = await exported("xml");
    const x = new DOMParser().parseFromString(out.text, "application/xml");
    if (x.querySelector("parsererror") || x.documentElement.tagName !== "orders" || x.querySelectorAll("row").length !== 6) return "XML does not parse";
    if (x.querySelectorAll("row")[5].querySelector("customer").textContent !== "Linus\tTorvalds" || x.querySelectorAll("row")[5].querySelector("email")) return "XML values";

    // Copy puts the file's text on the clipboard.
    let copied = null;
    const clip = navigator.clipboard && Object.getOwnPropertyDescriptor(navigator.clipboard, "writeText");
    Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: (s) => { copied = s; return Promise.resolve(); } });
    pick(fmt, "md"); await wait();
    t.querySelector(".ui-jxt-copy").click(); await wait();
    if (clip) Object.defineProperty(navigator.clipboard, "writeText", clip); else delete navigator.clipboard.writeText;
    if (!copied?.startsWith("| id | email | customer |") || status() !== "Copied Markdown") return `copy: ${status()} ${copied?.slice(0, 40)}`;
} finally {
    URL.createObjectURL = realUrl;
    HTMLAnchorElement.prototype.click = realClick;
}
