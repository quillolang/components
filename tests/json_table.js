const [api, cfg] = $$(".ui-jt");
if (!api || !cfg) return "expected two tables";
const grid = api.querySelector("table");
const scroll = api.querySelector(".ui-jt-scroll");
const count = () => api.querySelector(".ui-jt-count").textContent.trim();
const heads = (t = api) => [...t.querySelectorAll("thead th")].map((h) => h.textContent.trim());
const rows = (t = api) => [...t.querySelectorAll("tbody tr:not(.ui-jt-pad)")];
const nodes = () => [...api.querySelectorAll("tr.ui-jt-node")];
const node = (label) => nodes().find((n) => n.querySelector(".ui-jt-key, .ui-jt-idx")?.textContent === label);
const crumbs = () => [...api.querySelectorAll(".ui-jt-path button")].map((b) => b.textContent.trim());
const crumb = (t) => [...api.querySelectorAll(".ui-jt-path button")].find((b) => b.textContent.trim() === t);
const jq = () => api.querySelector(".ui-jt-jq").textContent;
const head = (r) => r.querySelector("th").textContent;
const active = () => grid.getAttribute("aria-activedescendant");

// Exports are caught instead of downloaded.
const saved = [];
const realUrl = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
URL.createObjectURL = (b) => { saved.push({ b }); return "blob:test"; };
HTMLAnchorElement.prototype.click = function () { saved[saved.length - 1].name = this.download; };
const exported = async (label) => {
    const n = saved.length;
    [...api.querySelectorAll(".ui-jt-export button")].find((b) => b.textContent.trim() === label).click();
    await wait();
    return saved.length > n ? { name: saved[n].name, text: await saved[n].b.text() } : null;
};
try {
    if (count() !== "3,000 rows") return `the count says "${count()}"`;
    if (heads().join("|") !== "#|id|name|email|active|plan|score|address|tags|orders|manager") return `columns: ${heads()}`;
    if (crumbs().join("|") !== "root|users" || jq() !== ".users") return `the path: ${crumbs()} ${jq()}`;
    if (grid.getAttribute("role") !== "treegrid" || grid.getAttribute("aria-rowcount") !== "3001") return "not a treegrid of 3,001 rows";
    if (rows().length > 40) return `${rows().length} rows drawn for 3,000`;
    const r1 = rows()[1].children;
    if (r1[6].textContent !== "3.7" || rows()[10].children[6].textContent !== "37") return `scores: ${r1[6].textContent}, ${rows()[10].children[6].textContent}`;
    if (rows()[0].children[10].textContent !== "null" || r1[10].textContent !== "1001") return "manager: null and numbers";

    scroll.scrollTop = 34 * 1500; scroll.dispatchEvent(new Event("scroll")); await wait();
    if (!rows().some((r) => head(r) === "1500")) return "scrolling does not draw row 1500";
    if (rows().length > 40) return `${rows().length} rows drawn after scrolling`;
    scroll.scrollTop = 0; scroll.dispatchEvent(new Event("scroll")); await wait();

    // A cell opens below its row, and its lines open further.
    const addr = rows()[1].children[7].querySelector("button");
    if (addr.textContent.trim() !== "{3}" || addr.getAttribute("aria-label") !== "address: 3 keys") return `the address cell: ${addr.textContent}`;
    addr.click(); await wait();
    if (rows()[1].children[7].querySelector("button").getAttribute("aria-expanded") !== "true") return "the cell is not marked open";
    if (!node("address") || node("city")?.textContent.includes("Lisbon") !== true) return `opened lines: ${nodes().map((n) => n.textContent)}`;
    if (node("city").getAttribute("aria-level") !== "3" || node("address").getAttribute("aria-level") !== "2") return "aria-level";
    node("geo").dispatchEvent(new MouseEvent("click", { bubbles: true })); await wait();
    if (node("geo").getAttribute("aria-expanded") !== "true" || !node("lat")?.textContent.includes("-83")) return "geo does not open";
    if (grid.getAttribute("aria-rowcount") !== String(3001 + 6)) return `rowcount with lines open: ${grid.getAttribute("aria-rowcount")}`;

    // Open as the table, export it, and go back by the path.
    node("geo").querySelector(".ui-jt-acts button").click(); await wait();
    if (crumbs().join("|") !== "root|users|[1]|address|geo" || jq() !== ".users[1].address.geo") return `after Open: ${crumbs()} ${jq()}`;
    if (heads().join("|") !== "Key|value" || count() !== "2 keys") return `geo as a table: ${heads()} "${count()}"`;
    let out = await exported("JSON");
    if (out?.name !== "accounts-users-1-address-geo.json" || JSON.stringify(JSON.parse(out.text)) !== '{"lat":-83,"lng":-169}') return `JSON export: ${out?.name} ${out?.text}`;
    crumb("users").click(); await wait();
    if (count() !== "3,000 rows" || nodes().length !== 0) return "going back does not show the users, closed";

    // Search goes into every level and marks what it found.
    const box = api.querySelector(".ui-jt-search");
    type(box, "LISBON"); await wait();
    if (count() !== "300 of 3,000 rows") return `searching lisbon: "${count()}"`;
    rows()[0].children[7].querySelector("button").click(); await wait();
    if (node("city")?.querySelector("mark")?.textContent !== "Lisbon") return "the match is not marked";
    out = await exported("CSV");
    const lines = out.text.trimEnd().split("\r\n");
    if (out.name !== "accounts-users.csv" || lines.length !== 301 || lines[0] !== "id,name,email,active,plan,score,address,tags,orders,manager") return `CSV: ${out.name}, ${lines.length} lines, ${lines[0]}`;
    if (!lines[1].startsWith("1001,Grace Hopper,grace.1@example.com,true,") || !lines[1].includes('"{""city"":""Lisbon""')) return `a CSV row: ${lines[1]}`;
    type(box, ""); await wait();

    // The keyboard.
    grid.focus();
    key(grid, "End"); await wait();
    // Cells opened while searching stay open.
    if (!active().endsWith(`-line-${Number(grid.getAttribute("aria-rowcount")) - 2}`)) return `End: ${active()}`;
    key(grid, "Home"); await wait();
    key(grid, "ArrowDown"); await wait();
    key(grid, "ArrowRight"); await wait();
    if (rows()[1].children[7].querySelector("button").getAttribute("aria-expanded") !== "true") return "→ does not open the row's first cell";
    key(grid, "ArrowDown"); await wait();
    if (!active().endsWith("-line-2")) return `↓ onto the opened line: ${active()}`;
    key(grid, "Enter"); await wait();
    if (crumbs().join("|") !== "root|users|[1]|address") return `Enter does not open it as the table: ${crumbs()}`;
    key(grid, "Backspace"); await wait();
    if (crumbs().join("|") !== "root|users|[1]" || count() !== "10 keys") return `Backspace does not go up one: ${crumbs()}`;

    // A list of 50,000 under the top, opened as the table.
    crumb("root").click(); await wait();
    if (count() !== "3 keys" || rows().map(head).join("|") !== "meta|users|events") return `the top: "${count()}" ${rows().map(head)}`;
    const ev = rows()[2].querySelector("button");
    if (ev.textContent.trim() !== "[50000]") return `events: ${ev.textContent}`;
    ev.click(); await wait();
    if (!node("events")?.textContent.includes("50,000 items")) return "the events line";
    node("events").querySelector(".ui-jt-acts button").click(); await wait();
    if (count() !== "50,000 rows" || rows().length > 40 || heads().join("|") !== "#|at|kind|user") return `events as a table: "${count()}", ${rows().length} drawn, ${heads()}`;
    crumb("root").click(); await wait();

    // A map placed straight in the page.
    if (heads(cfg).join("|") !== "Key|value" || cfg.querySelector(".ui-jt-count").textContent.trim() !== "7 keys") return "the settings table";
    const max = rows(cfg).find((r) => head(r) === "max-retries");
    if (max?.children[1].textContent !== "5") return "a key with a dash";
    rows(cfg).find((r) => head(r) === "database").querySelector("button").click(); await wait();
    if (!cfg.textContent.includes("1500.5") || !cfg.textContent.includes("postgres://db.internal/billing")) return "the database settings do not open";
} finally {
    URL.createObjectURL = realUrl;
    HTMLAnchorElement.prototype.click = realClick;
}
