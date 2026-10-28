// Loads the gallery in headless Chrome, wakes every component, and runs each
// tests/<slug>.js in the page. A test is the body of an async function that
// returns nothing when it passes, or a string saying what went wrong. It may use:
//
//   $(sel), $$(sel)        querySelector(All) inside the component's section
//   wait(ms)               a pause (default 250), for the page to update
//   type(el, text)         sets an input's value and sends `input` and `change`
//   key(el, k)             sends a keydown (and keyup) of key `k` ("Enter", "ArrowDown", ...)
//
// A test whose first line is `// alone` runs on a gallery showing only its component
// (/?only=<slug>), after the others: for what listens to the whole page, such as a
// keyboard shortcut or an idle timer, which another component could answer first.
//
//   node tests/browser.mjs <gallery url> <chrome debugging port> [slug...]
//
// Prints one line per component and the page's errors; exits 1 on any failure.
import { readFileSync, readdirSync } from "node:fs";

const [, , base, port, ...only] = process.argv;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = new URL(".", import.meta.url).pathname;

for (let i = 0; i < 50; i++) {
    try { await fetch(`http://127.0.0.1:${port}/json/version`); break; } catch { await sleep(200); }
}
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = {};
let errors = [];
ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text);
    if (d.method === "Runtime.consoleAPICalled" && (d.params.type === "error" || d.params.type === "warning"))
        errors.push(d.params.args.map((a) => a.value ?? a.description).join(" "));
    if (d.method === "Log.entryAdded" && d.params.entry.level === "error") errors.push(`${d.params.entry.text} ${d.params.entry.url ?? ""}`);
};
const send = (method, params = {}) => new Promise((r) => { pending[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) return `threw: ${r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text}`;
    return r.result?.result?.value;
};
await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

const helpers = `
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const type = (el, text) => { el.focus(); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
const key = (el, k) => { for (const t of ["keydown", "keyup"]) el.dispatchEvent(new KeyboardEvent(t, { key: k, bubbles: true, cancelable: true })); };
`;

const slugs = only.length ? only : null;
let failed = 0;
let page = errors;
await send("Page.navigate", { url: base });
await sleep(1200);
// Wake every component: hovering one loads the bundle, and each resumes when reached.
await ev(`(async () => {
    for (const i of document.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    for (let n = 0; n < 50 && !window.__quillo_booted; n++) await new Promise((r) => setTimeout(r, 100));
    for (const i of document.querySelectorAll("quillo-island")) i.firstElementChild?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
})()`);
await sleep(600);
const all = await ev(`[...document.querySelectorAll("section[data-slug]")].map((s) => s.dataset.slug)`);
if (page.length) { console.log("errors loading the page:", page); failed++; }
errors = [];
const wake = async () => {
    await ev(`(async () => {
        for (const i of document.querySelectorAll("quillo-island")) i.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
        for (let n = 0; n < 50 && !window.__quillo_booted; n++) await new Promise((r) => setTimeout(r, 100));
        for (const i of document.querySelectorAll("quillo-island")) i.firstElementChild?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    })()`);
    await sleep(600);
};
const alone = [];
for (const slug of all) {
    if (slugs && !slugs.includes(slug)) continue;
    let test;
    try { test = readFileSync(`${dir}${slug}.js`, "utf8"); } catch { test = null; }
    if (test && test.startsWith("// alone")) { alone.push(slug); continue; }
    await runOne(slug, test);
}
for (const slug of alone) {
    errors = [];
    await send("Page.navigate", { url: `${base}?only=${slug}` });
    await sleep(1200);
    await wake();
    errors = [];
    await runOne(slug, readFileSync(`${dir}${slug}.js`, "utf8"));
}
async function runOne(slug, test) {
    let res = null;
    if (test) {
        res = await ev(`(async () => {
            const root = document.querySelector('section[data-slug="${slug}"] .g-stage');
            const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
            ${helpers}
            ${test}
        })()`);
        await ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close()); document.querySelectorAll(":popover-open").forEach((p) => p.hidePopover());`);
    }
    const errs = errors.splice(0);
    const ok = res == null && errs.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${slug}${test ? "" : " (no test)"}${res != null ? ": " + res : ""}${errs.length ? " errors: " + errs.join(" | ") : ""}`);
}
console.log(failed ? `${failed} failed` : `all ${slugs ? slugs.length : all.length} passed`);
ws.close();
process.exit(failed ? 1 : 0);
