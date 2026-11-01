const q = $("#log-explorer-demo-query"), log = $("#log-explorer-demo-log");
const c = q.closest(".ui-log-explorer");
const count = () => c.querySelector("[data-count]").textContent;
const rows = () => [...c.querySelectorAll(".ui-log-explorer-row")];
const msgs = () => rows().map((r) => r.querySelector(".ui-log-explorer-msg").textContent.replace(/ \(\+\d+ trace lines\)$/, ""));
const lvls = () => [...c.querySelectorAll(".ui-log-explorer-level")].map((b) => b.textContent.trim().replace(/\s+/, " ")).join(", ");
const search = async (s) => { type(q, s); await wait(120); };
const lines = () => rows().map((r) => +r.dataset.line).join(",");
if (q.name !== "query" || log.name !== "log" || !q.labels[0]) return "fields";
if (count() !== "12 of 12 entries match") return count();
if (c.querySelector("[data-read]").textContent !== "Read 17 lines: 3 JSON, 3 logfmt, 6 plain, and 5 kept with a trace.") return c.querySelector("[data-read]").textContent;
if (lines() !== "1,2,3,4,5,11,12,13,14,15,16,17") return `entries: ${lines()}`;
if (lvls() !== "fatal 1, error 4, warn 3, info 3, debug 1") return `levels: ${lvls()}`;
const texts = msgs();
if (texts[0] !== "api started on :8080" || texts[1] !== "request done" || texts[2] !== "slow query" || texts[3] !== "upstream timeout" || texts[4] !== "Payment failed for order 8841" || texts[8] !== "GET /orders/8841 500") return `messages: ${texts.join(" / ")}`;
const times = rows().map((r) => r.querySelector(".ui-log-explorer-time").textContent);
if (times[1] !== "2026-10-30T09:14:05Z" || times[2] !== "2026-10-30T09:14:07Z" || times[4] !== "2026-10-30T09:14:11,204" || times[6] !== "2026-10-30T09:14:13Z" || times[8] !== "2026-10-30T09:14:15+00:00") return `times: ${times.join(" ")}`;
const tags = rows().map((r) => r.querySelector(".ui-log-explorer-tag").textContent).join(" ");
if (tags !== "info info warn error error info warn error error warn debug fatal") return `levels read: ${tags}`;
// The query language, each worked out by hand from the demo's lines.
for (const [s, want] of [
    ["level:error", "4,5,13,14"], ["level:error status:5xx", "4,13,14"], [`level:error status:5xx "timeout"`, "4,13"], ["-path:/health", "1,3,4,5,11,12,13,14,15,16,17"],
    ["status:>=500", "4,13,14"], ["status:>=200 status:<300", "2,11"], ["duration_ms:40..900", "3,11"], ["host:web-*", "3,4,11,12,13"], ["user:", "11"], ["level:>=warn", "3,4,5,12,13,14,15,17"],
    ["level:warning", "3,12,15"], [`"read timed out"`, "5"], ["http.method:post", "4"], ["method:GET", "14,15"], ["status:4xx", "15"], ["STATUS:5XX", "4,13,14"], ["level:<info", "16"],
    ["msg:timeout", "4,13"], ["-level:error -level:warn timeout", ""], ["host:WEB-2", "4,12"], ["attempt:2", "12"], [`msg:"request done" host:web-1`, "11"], ["time:2026-10-30T09:14:1", "5,11,12,13,14,15,16,17"],
    ["timeout", "4,5,13"], ["-timeout -payment level:error", "14"], ["nothing-here", ""], ["(((", ""], ["[", "14,15"], ["\\", ""], ["status:>abc", ""], ["😀", ""], [":", "1,2,3,4,5,11,12,13,14,15,16,17"]]) {
    await search(s);
    if (lines() !== want) return `${s}: ${lines()}, wanted ${want}`;
}
await search("nothing-here");
if (!c.querySelector("[data-none]") || count() !== "0 of 12 entries match") return `no match: ${count()}`;
await search(`"unclosed`);
if (!c.querySelector(".ui-log-explorer-problem")?.textContent.startsWith("The quote at character 1 is not closed")) return "an open quote";
await search("");
if (c.querySelector(".ui-log-explorer-problem") || count() !== "12 of 12 entries match") return "an empty query";
// Level buttons toggle their term and count what the rest of the query finds.
await search("timeout");
if (lvls() !== "error 3") return `levels of a search: ${lvls()}`;
await search("web-2 OR");
await search("host:web-2");
if (lvls() !== "error 1, warn 1") return `levels of host: ${lvls()}`;
c.querySelector("[data-level=warn]").click(); await wait(120);
if (q.value !== "host:web-2 level:warn" || lines() !== "12" || c.querySelector("[data-level=warn]").getAttribute("aria-pressed") !== "true") return `level on: ${q.value} ${lines()}`;
if (lvls() !== "error 1, warn 1") return `the buttons keep counting: ${lvls()}`;
c.querySelector("[data-level=warn]").click(); await wait(120);
if (q.value !== "host:web-2" || lines() !== "4,12") return `level off: ${q.value}`;
// An entry: fields, then a field adds to the query.
rows()[0].click(); await wait(120);
if (rows()[0].getAttribute("aria-expanded") !== "true") return "open";
const chips = [...c.querySelectorAll(".ui-log-explorer-chip")].map((x) => x.textContent).join(" ");
if (chips !== "status=504 http.path=/pay http.method=POST host=web-2") return `fields: ${chips}`;
[...c.querySelectorAll(".ui-log-explorer-chip")].find((x) => x.textContent === "status=504").click(); await wait(120);
if (q.value !== "host:web-2 status:504" || lines() !== "4") return `a field adds: ${q.value}`;
// The trace is kept together and found.
await search("level:error payment");
rows()[0].click(); await wait(120);
const pre = c.querySelector(".ui-log-explorer-trace");
if (!pre || pre.textContent.split("\n").length !== 5 || !pre.textContent.startsWith("java.lang.IllegalStateException: card declined") || !pre.textContent.endsWith("... 12 more")) return `trace: ${pre?.textContent}`;
if (!rows()[0].textContent.includes("(+5 trace lines)")) return "the trace is not counted";
const mark = c.querySelector(".ui-log-explorer-msg mark");
if (mark?.textContent !== "Payment") return `mark: ${mark?.textContent}`;
// Keyboard: Escape closes, arrows move.
key(rows()[0], "Escape"); await wait(120);
if (rows()[0].getAttribute("aria-expanded") !== "false") return "Escape does not close";
await search("level:>=warn");
rows()[0].focus(); key(rows()[0], "ArrowDown"); await wait(60);
if (document.activeElement !== rows()[1]) return "ArrowDown";
key(rows()[1], "ArrowDown"); await wait(60);
key(rows()[2], "ArrowUp"); await wait(60);
if (document.activeElement !== rows()[1]) return "ArrowUp";
key(rows()[0], "ArrowUp"); await wait(60);
if (document.activeElement !== rows()[1] && document.activeElement !== rows()[0]) return "ArrowUp at the top";
// Context: around the fatal line, past what the search hides.
await search("level:fatal");
if (lines() !== "17") return "fatal";
rows()[0].click(); await wait(120);
c.querySelector("[data-context]").click(); await wait(150);
if (lines() !== "12,13,14,15,16,17" || count() !== "Context around line 17") return `context: ${lines()} ${count()}`;
if (c.querySelector(".ui-log-explorer-anchor .ui-log-explorer-row").dataset.line !== "17") return "the line is not marked";
if (document.activeElement !== c.querySelector("[data-back]")) return "focus moves to Back";
c.querySelector("[data-more]").click(); await wait(120);
if (lines() !== "2,3,4,5,11,12,13,14,15,16,17") return `more context: ${lines()}`;
c.querySelector("[data-back]").click(); await wait(150);
if (lines() !== "17" || q.value !== "level:fatal") return `back: ${lines()}`;
if (document.activeElement !== rows()[0]) return `focus comes back: ${document.activeElement?.outerHTML?.slice(0, 80)}`;
await search("");
// Messy text.
const reset = log.value;
const load = async (t) => { type(log, t); await wait(150); };
await load("");
if (count() !== "Nothing to search yet.") return `empty: ${count()}`;
await load("   \n\n  ");
if (count() !== "Nothing to search yet.") return `blank: ${count()}`;
await load(`{not json\n{"unclosed": 1\n[1,2]\nnull\n{}\n`);
if (count() !== "3 of 3 entries match" || rows()[2].querySelector(".ui-log-explorer-time").textContent !== "no time") return `odd lines: ${count()}`;
await load(`{"msg":"a","stack":"Error: x\\n  at y\\n  at z","level":"ERROR"}`);
if (!rows()[0].textContent.includes("(+3 trace lines)")) return "a stack inside JSON";
await load(`time=2026-02-30T00:00:00Z level=info msg=hello a=1\r\nmsg="say \\"hi\\"" b=2\r\n`);
if (msgs().join("|") !== `hello|say "hi"`) return `logfmt: ${msgs().join("|")}`;
await load(`<b>not html</b> level=<script>\n`);
if (msgs()[0] !== "<b>not html</b> level=<script>" || c.querySelector(".ui-log-explorer-msg b")) return "markup in a log";
await load(`Traceback (most recent call last):\n  File "a.py", line 1\nValueError: nope\nnext thing\n`);
if (rows().length !== 2) return `python: ${msgs().join("|")}`;
await load("héllo wörld ÉCOLE\n");
await search("école");
if (lines() !== "1") return "accents and case";
await search("");
await load("x".repeat(200000));
if (msgs()[0].length !== 401) return `a huge line is cut for show: ${msgs()[0].length}`;
// Long logs are capped, and said so, and keep up.
const many = Array.from({ length: 6000 }, (_, i) => `2026-10-30T09:14:02Z ${i % 7 ? "INFO" : "ERROR"} request ${i} status=${i % 7 ? 200 : 500}`).join("\n");
const t0 = performance.now();
await load(many);
const took = performance.now() - t0 - 150;
if (took > 1500) return `5,000 lines took ${Math.round(took)} ms`;
if (!c.textContent.includes("Only the first 5000 lines are read; 1000 more are left out.")) return "the cap on lines";
if (rows().length !== 200 || !c.textContent.includes("Showing the first 200 of 5000.")) return `the cap on rows: ${rows().length}`;
const t1 = performance.now();
await search("status:5xx");
if (performance.now() - t1 - 120 > 500) return `a search took ${Math.round(performance.now() - t1 - 120)} ms`;
if (count() !== "715 of 5000 entries match") return `count over all: ${count()}`;
await search("");
await load(reset);
// Plain lines and the callback.
const lq = $("#log-explorer-demo-live-query");
const l = lq.closest(".ui-log-explorer");
if (l.querySelector("[data-count]").textContent !== "1 of 3 entries match") return `plain: ${l.querySelector("[data-count]").textContent}`;
type(lq, "disk full"); await wait(120);
const note = l.closest(".demo-stack").querySelector(".demo-note");
if (note.textContent !== `on_change: 1 of 3 for "disk full".`) return `on_change: ${note.textContent}`;
type(lq, "/var/data"); await wait(120);
if (l.querySelector("[data-count]").textContent !== "1 of 3 entries match") return "the indented line is kept with its entry";
