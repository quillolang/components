// Loads the gallery in headless Chrome, wakes every component, and runs each
// tests/<slug>.js in the page. A test is the body of an async function that
// returns nothing when it passes, or a string saying what went wrong. It may use:
//
//   $(sel), $$(sel)        querySelector(All) inside the component's section
//   wait(ms)               a pause (default 250), for the page to update
//   type(el, text)         sets an input's value and sends `input` and `change`
//   key(el, k)             sends a keydown (and keyup) of key `k` ("Enter", "ArrowDown", ...)
//
// and on a phone or a tablet, real input through the browser, not synthetic events:
//
//   device                 "phone" or "tablet"
//   tap(el)                a finger down and up on el
//   hold(el, ms)           a finger kept down (default 650), for a long press
//   drag(el, dx, dy, ms)   a finger moved from el's middle by dx, dy over ms (default 250)
//   pinch(el, scale)       two fingers moved apart or together
//   cdp(method, params)    any DevTools command: Emulation.setGeolocationOverride, say
//
// A test whose first line is `// alone` runs on a gallery showing only its component
// (/?only=<slug>), after the others: for what listens to the whole page, such as a
// keyboard shortcut or an idle timer, which another component could answer first.
//
// A test whose first line is `// mobile` runs alone too, once as a phone (390 by 844) and
// once as a tablet (820 by 1180), with touch on. `// tablet` runs as a tablet, upright
// (820 by 1180) and turned (1180 by 820). Either way the page may not scroll sideways, and
// what can be pressed must be 44 px each way: anything smaller fails the test unless it has
// data-small-target, for a reason worth a comment.
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
let ws;
let id = 0;
const pending = {};
let errors = [];
const onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending[d.id]) { pending[d.id](d); delete pending[d.id]; }
    // A dialog stops the page until it is answered, and a run would wait for ever.
    if (d.method === "Page.javascriptDialogOpening") send("Page.handleJavaScriptDialog", { accept: true });
    if (d.method === "Runtime.bindingCalled" && d.params.name === "__cdp") {
        const { n, method, params } = JSON.parse(d.params.payload);
        send(method, params).then((r) => ev(`__cdpDone[${JSON.stringify(n)}](${JSON.stringify(JSON.stringify(r.result ?? null))})`));
    }
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
// A new tab. Two fingers can leave a tab's touch dead, with Chrome still answering OK, so
// each phone or tablet test has its own: one test's pinch never fails the next.
let tab = null;
const open_tab = async () => {
    const old = tab;
    tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    ws?.close();
    ws = new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));
    ws.onmessage = onmessage;
    if (old) await fetch(`http://127.0.0.1:${port}/json/close/${old.id}`);
    await send("Runtime.enable");
    await send("Log.enable");
    await send("Page.enable");
    await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await send("Runtime.addBinding", { name: "__cdp" });
};
await open_tab();

const helpers = `
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const type = (el, text) => { el.focus(); el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); };
const key = (el, k) => { for (const t of ["keydown", "keyup"]) el.dispatchEvent(new KeyboardEvent(t, { key: k, bubbles: true, cancelable: true })); };
window.__cdpDone = window.__cdpDone ?? {};
const cdp = (method, params = {}) => new Promise((done) => {
    const n = Math.random().toString().slice(2);
    __cdpDone[n] = (text) => { delete __cdpDone[n]; done(JSON.parse(text)); };
    __cdp(JSON.stringify({ n, method, params }));
});
const middle = (el) => { el.scrollIntoView?.({ block: "nearest", inline: "nearest" }); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const fingers = (type, points) => cdp("Input.dispatchTouchEvent", { type, touchPoints: points });
const tap = async (el) => { const p = middle(el); await fingers("touchStart", [p]); await fingers("touchEnd", []); await wait(); };
const hold = async (el, ms = 650) => { const p = middle(el); await fingers("touchStart", [p]); await wait(ms); await fingers("touchEnd", []); await wait(); };
const drag = async (el, dx, dy, ms = 250) => {
    const p = middle(el), steps = Math.max(4, Math.round(ms / 16));
    await fingers("touchStart", [p]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }]); await wait(ms / steps); }
    await fingers("touchEnd", []);
    await wait();
};
const pinch = async (el, scale) => {
    const p = middle(el), gap = 40, at = (g) => [{ x: p.x - g, y: p.y, id: 1 }, { x: p.x + g, y: p.y, id: 2 }];
    await fingers("touchStart", at(gap));
    for (let i = 1; i <= 8; i++) { await fingers("touchMove", at(gap + (gap * scale - gap) * i / 8)); await wait(16); }
    await fingers("touchEnd", []);
    await wait();
};
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
const alone = [], sized = [], ran = new Set();
for (const slug of all) {
    if (slugs && !slugs.includes(slug)) continue;
    let test;
    try { test = readFileSync(`${dir}${slug}.js`, "utf8"); } catch { test = null; }
    if (test && test.startsWith("// mobile")) { sized.push([slug, ["phone", 390, 844], ["tablet", 820, 1180]]); continue; }
    if (test && test.startsWith("// tablet")) { sized.push([slug, ["tablet", 820, 1180], ["tablet", 1180, 820]]); continue; }
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
// A test as a phone or a tablet: real touch, then what no test should have to ask.
for (const [slug, ...sizes] of sized) {
    const test = readFileSync(`${dir}${slug}.js`, "utf8");
    for (const [device, width, height] of sizes) {
        await open_tab();
        errors = [];
        await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 2, mobile: true });
        await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
        await send("Page.navigate", { url: `${base}?only=${slug}` });
        await sleep(1200);
        await wake();
        await runOne(slug, test, device, `${device} ${width}x${height}`);
    }
}
async function runOne(slug, test, device = "desktop", label = "") {
    ran.add(slug);
    let res = null;
    if (test) {
        const limit = 180000;
        let timer;
        const hung = new Promise((r) => { timer = setTimeout(() => r(`hung: no answer in ${limit / 1000} s`), limit); });
        res = await Promise.race([hung, ev(`(async () => {
            const root = document.querySelector('section[data-slug="${slug}"] .g-stage');
            const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
            const device = ${JSON.stringify(device)};
            ${helpers}
            // In a function of its own, so a test's early return still reaches the checks below.
            const said = await (async () => { ${test}
            })();
            if (said != null) return said;
            ${device === "desktop" ? "" : `
            if (document.documentElement.scrollWidth > innerWidth) return "the page scrolls sideways: " + document.documentElement.scrollWidth + " in " + innerWidth;
            const small = $$("button, a[href], select, summary, [role=button], [role=tab], [role=switch], [role=menuitem], [role=option], input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea")
                .filter((e) => !e.closest("[data-small-target]") && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden")
                .filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
            if (small.length) return "too small to press: " + small.slice(0, 4).map((e) => e.tagName.toLowerCase() + (e.className ? "." + String(e.className).split(" ")[0] : "") + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height)).join(", ");`}
        })()`)]);
        clearTimeout(timer);
        if (String(res).startsWith("hung:")) {
            // Whatever it waits on may never end: a new tab, and the page back for the tests to come.
            await open_tab();
            if (device === "desktop") { await send("Page.navigate", { url: base }); await sleep(1200); await wake(); }
        } else {
            await ev(`document.querySelectorAll("dialog[open]").forEach((d) => d.close()); document.querySelectorAll(":popover-open").forEach((p) => p.hidePopover());`);
        }
    }
    const errs = errors.splice(0);
    const ok = res == null && errs.length === 0;
    if (!ok) failed++;
    console.log(`${ok ? "ok  " : "FAIL"} ${slug}${label ? ` (${label})` : ""}${test ? "" : " (no test)"}${res != null ? ": " + res : ""}${errs.length ? " errors: " + errs.join(" | ") : ""}`);
}
// Passing means something ran: a name not on the page is a failure, not a pass.
for (const slug of slugs ?? []) if (!ran.has(slug)) { console.log(`FAIL ${slug}: not in the gallery`); failed++; }
if (ran.size === 0) { console.log("FAIL nothing ran"); failed++; }
console.log(failed ? `${failed} failed` : `all ${ran.size} passed`);
ws.close();
process.exit(failed ? 1 : 0);
