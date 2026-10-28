// How Quillo copes with a program of many components: loads the kit's components
// into one program (0, 100, 250, all of them, then the kit several times over,
// renamed) and measures `quillo check`, the time until the server answers, its
// memory once running, and a page's time. Writes bench.json, which the README and
// quillolang.org/components show, and prints the same as a table.
//
//   node scripts/bench.mjs [--copies 4] [--out bench.json]     QUILLO and PORT can be set
//
// The program's page shows none of the components: what is measured is what a
// program pays for holding them, not for showing them.
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { execFileSync, spawn } from "node:child_process";
import { tmpdir, cpus, totalmem, platform, arch } from "node:os";
import { join } from "node:path";

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt; };
const quillo = process.env.QUILLO ?? "quillo";
const port = Number(process.env.PORT ?? 8794);
const copies = Number(arg("copies", 4));
const kit = new URL("..", import.meta.url).pathname;
const out = arg("out", join(kit, "bench.json"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The components that need no other file of the kit, so each copy stands alone.
const slugs = readdirSync(join(kit, "ui")).filter((f) => f.endsWith(".qwe") && f !== "theme.qwe").map((f) => f.slice(0, -4))
    .filter((s) => !/needs:\s*\[/.test(readFileSync(join(kit, "demos", `${s}.qwe`), "utf8"))).sort();

const dir = mkdtempSync(join(tmpdir(), "quillo-ui-bench-"));
mkdirSync(join(dir, "ui"));
for (const f of readdirSync(join(kit, "ui"))) writeFileSync(join(dir, "ui", f), readFileSync(join(kit, "ui", f)));

// Copy k of a file: every name it declares gets a suffix, so copies do not clash.
function copyOf(slug, k) {
    let s = readFileSync(join(kit, "ui", `${slug}.qwe`), "utf8");
    const names = [...s.matchAll(/^(?:let|fn|view|component|server fn|type) ([A-Za-z_][A-Za-z0-9_]*)/gm)].map((m) => m[1]);
    for (const n of [...new Set(names)].sort((a, b) => b.length - a.length))
        s = s.replace(new RegExp(`(?<![A-Za-z0-9_])${n}(?![A-Za-z0-9_])`, "g"), `${n}${/^[a-z]/.test(n) ? "_" : ""}X${k}`);
    const file = `copies/${slug}_${k}.qwe`;
    writeFileSync(join(dir, file), s);
    return file;
}
mkdirSync(join(dir, "copies"));

function program(files) {
    const name = `main${files.length}.qwe`;
    writeFileSync(join(dir, name), ['use "ui/theme.qwe"', ...files.map((f) => `use "${f}"`),
        'route GET / = <html><head><style>{theme_css}</style></head><body>ok</body></html>', ""].join("\n"));
    return name;
}

const rss = (pid) => Number(execFileSync("ps", ["-o", "rss=", "-p", String(pid)]).toString().trim()) * 1024;

async function measure(name, count) {
    let t = performance.now();
    execFileSync(quillo, ["check", name], { cwd: dir, stdio: "ignore" });
    const check = (performance.now() - t) / 1000;
    t = performance.now();
    const p = spawn(quillo, ["run", name, "--port", String(port), "--log", "off"], { cwd: dir, stdio: "ignore" });
    for (;;) {
        try { if ((await fetch(`http://127.0.0.1:${port}/`)).ok) break; } catch {}
        if (performance.now() - t > 120000) throw new Error(`${name} did not start`);
        await sleep(10);
    }
    const start = (performance.now() - t) / 1000;
    const memory = rss(p.pid);
    t = performance.now();
    for (let i = 0; i < 50; i++) await (await fetch(`http://127.0.0.1:${port}/`)).text();
    const page = (performance.now() - t) / 50;
    p.kill();
    await new Promise((r) => p.on("exit", r));
    return { components: count, check_s: +check.toFixed(2), start_s: +start.toFixed(2), memory_mb: Math.round(memory / 1048576), page_ms: +page.toFixed(1) };
}

const all = slugs.map((s) => `ui/${s}.qwe`);
const runs = [[0, []], [100, all.slice(0, 100)], [250, all.slice(0, 250)], [all.length, all]];
const many = [];
for (let k = 1; k <= copies; k++) for (const s of slugs) many.push(copyOf(s, k));
if (copies > 1) runs.push([many.length, many]);

const rows = [];
for (const [count, files] of runs) rows.push(await measure(program(files), count));
rmSync(dir, { recursive: true, force: true });

const version = execFileSync(quillo, ["--version"]).toString().trim();
const table = (rows) => ["| Components in one program | `quillo check` | Start-up | Memory, running | A page |", "|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.components} | ${r.check_s} s | ${r.start_s} s | ${r.memory_mb} MB | ${r.page_ms} ms |`)].join("\n");
const result = { date: new Date().toISOString().slice(0, 10), quillo: version, machine: `${cpus()[0].model.trim()}, ${Math.round(totalmem() / 2 ** 30)} GB, ${platform()} ${arch()}`, rows };
writeFileSync(out, JSON.stringify(result, null, 2) + "\n");
console.log(`${version} on ${result.machine}\n\n${table(rows)}`);

// The README's table, between its two markers.
const readme = join(kit, "README.md"), text = readFileSync(readme, "utf8");
const a = text.indexOf("<!-- bench -->"), b = text.indexOf("<!-- /bench -->");
if (a >= 0 && b > a) writeFileSync(readme, text.slice(0, a) + `<!-- bench -->\n${table(rows)}\n\n${version}, ${result.machine}, ${result.date}.\n` + text.slice(b));
