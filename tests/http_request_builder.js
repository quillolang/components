const f = (n, pre = "http-request-builder-demo") => $(`#${pre}-${n}`);
const c = f("url").closest(".ui-http-req");
const code = () => c.querySelector(".ui-http-req-code")?.textContent;
const warns = () => [...c.querySelectorAll("[data-warnings] li")].map((l) => l.textContent);
const probs = () => [...c.querySelectorAll("[data-problems] li")].map((l) => l.textContent);
const tab = async (t) => { c.querySelector(`#http-request-builder-demo-tab-${t}`).click(); await wait(40); };
const reveal = c.querySelector("[data-reveal]");
const method = async (m) => { f("method").value = m; f("method").dispatchEvent(new Event("change", { bubbles: true })); await wait(40); };
const url = async (u) => { type(f("url"), u); await wait(40); };
const body = async (b) => { type(f("body"), b); await wait(40); };
const rows = (k) => [...c.querySelectorAll(`[data-add=${k}]`)[0].parentElement.querySelectorAll(".ui-http-req-row")];
// A POSIX shell's reading of a command, as an independent check of the quoting: words,
// single quotes, double quotes, backslash, and a backslash before a line break is nothing.
const shell = (s) => { const out = []; let w = null; let i = 0;
    while (i < s.length) { const ch = s[i];
        if (ch === "\\" && s[i + 1] === "\n") { i += 2; continue; }
        if (ch === " " || ch === "\n") { if (w !== null) { out.push(w); w = null; } i++; continue; }
        if (w === null) w = "";
        if (ch === "'") { const e = s.indexOf("'", i + 1); if (e < 0) throw new Error("open quote"); w += s.slice(i + 1, e); i = e + 1; continue; }
        if (ch === "\\") { w += s[i + 1]; i += 2; continue; }
        if ('"$`&|;<>()*?#~[]{}!'.includes(ch)) throw new Error(`unquoted ${ch} in ${s}`);
        w += ch; i++; }
    if (w !== null) out.push(w); return out; };
// A snippet run with a fetch that records what it is given.
const run = async (src) => { let seen; await new Function("fetch", `return (async () => { ${src} })()`)(async (u, o) => { seen = [u, o]; return {}; }); return seen; };
if (f("url").name !== "url" || f("method").name !== "method" || f("body").name !== "body" || !f("body").labels[0]) return "fields";
if (rows("header").length !== 2 || rows("query").length !== 2) return "rows";
// Hidden at the start, in the snippet and in the field.
const secret = rows("header")[1].querySelectorAll("input")[1];
if (secret.type !== "password" || rows("header")[0].querySelectorAll("input")[1].type !== "text") return "the field is not hidden";
if (code().includes("sk_live_abc123")) return "the secret shows";
if (c.querySelector("[data-note]").textContent !== "1 secret is hidden, here and in what Copy gives.") return c.querySelector("[data-note]").textContent;
const finalUrl = "https://api.example.com/v1/orders?expand=items%2Ccustomer&note=it%27s%20a%20test";
const payload = `{"sku": "A-7", "note": "it's $5 & more"}`;
let w = shell(code());
if (JSON.stringify(w) !== JSON.stringify(["curl", finalUrl, "-H", "Content-Type: application/json", "-H", "Authorization: Bearer ••••••••", "--data-raw", payload])) return `curl: ${JSON.stringify(w)}`;
if (code() !== `curl '${finalUrl}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'Authorization: Bearer ••••••••' \\\n  --data-raw '{"sku": "A-7", "note": "it'\\''s $5 & more"}'`) return `curl text: ${code()}`;
reveal.click(); await wait(40);
if (reveal.textContent !== "Hide secrets" || reveal.getAttribute("aria-pressed") !== "true" || secret.type !== "text") return "reveal";
if (shell(code())[5] !== "Authorization: Bearer sk_live_abc123") return `shown: ${code()}`;
await tab("fetch");
let [u, o] = await run(code());
if (u !== finalUrl || o.method !== "POST" || o.headers.Authorization !== "Bearer sk_live_abc123" || o.headers["Content-Type"] !== "application/json" || o.body !== payload) return `fetch: ${code()}`;
await tab("httpie");
if (JSON.stringify(shell(code())) !== JSON.stringify(["http", "POST", finalUrl, "Content-Type:application/json", "Authorization:Bearer sk_live_abc123", "--raw", payload])) return `httpie: ${JSON.stringify(shell(code()))}`;
reveal.click(); await wait(40);
if (code().includes("sk_live_abc123")) return "hidden again";
// The nastiest text, through all three.
reveal.click(); await wait(40);
const nasty = `a'b"c\\d$HOME \`id\` $(id) !x\n\ttab 'q' 😀 '' \\'`;
await body(nasty);
await tab("curl");
if (shell(code()).at(-1) !== nasty) return `curl quoting: ${JSON.stringify(shell(code()).at(-1))}`;
await tab("httpie");
if (shell(code()).at(-1) !== nasty) return `httpie quoting: ${JSON.stringify(shell(code()).at(-1))}`;
await tab("fetch");
[u, o] = await run(code());
if (o.body !== nasty) return `fetch quoting: ${JSON.stringify(o.body)}`;
reveal.click(); await wait(40);
await tab("curl");
// Header values too, and an empty one.
const hv = rows("header")[0].querySelectorAll("input");
type(hv[0], "X-Note"); type(hv[1], "it's $HOME"); await wait(40);
if (!shell(code()).includes("X-Note: it's $HOME")) return `a header: ${code()}`;
type(hv[1], ""); await wait(40);
if (!shell(code()).includes("X-Note;")) return `an empty header in curl: ${code()}`;
await tab("httpie");
if (!shell(code()).includes("X-Note;")) return `an empty header in HTTPie: ${code()}`;
await tab("curl");
type(hv[0], "Content-Type"); type(hv[1], "application/json"); await wait(40);
await body(payload);
// The method by the tool's rules. Each ending checked against what curl does.
const curlHead = () => shell(code()).slice(0, 3).join(" ");
await method("PUT");
if (!curlHead().startsWith("curl -X PUT")) return curlHead();
await method("DELETE");
if (!curlHead().startsWith("curl -X DELETE") || !warns().includes("A body on DELETE: some servers and proxies ignore it.")) return `delete: ${warns()}`;
await method("GET");
if (!curlHead().startsWith("curl -X GET") || !warns().some((x) => x.startsWith("A body on GET:"))) return `GET with a body: ${curlHead()} ${warns()}`;
await tab("fetch");
if (!code().startsWith("// fetch refuses a body on GET, so it is left out.")) return `fetch GET: ${code()}`;
[u, o] = await run(code());
if (o.body !== undefined || o.method !== undefined) return "fetch keeps the body";
await tab("curl");
await method("HEAD");
if (!curlHead().startsWith("curl --head") || !warns().some((x) => x.startsWith("A body on HEAD:"))) return curlHead();
await body("");
await method("GET");
if (curlHead().includes("-X")) return `plain GET: ${curlHead()}`;
await method("OPTIONS");
await method("POST");
if (!curlHead().startsWith("curl -X POST")) return `POST without a body: ${curlHead()}`;
await body("a=1");
if (curlHead().includes("-X")) return `POST with a body needs no -X: ${curlHead()}`;
// Content types.
const types = rows("header")[0].querySelectorAll("input");
type(types[0], ""); type(types[1], ""); await wait(40);
await body(`{"a": 1}`);
if (!warns().includes("The body looks like JSON, but no Content-Type says so: curl would send it as a form.")) return `missing type: ${warns()}`;
c.querySelector("[data-fix-type]").click(); await wait(40);
if (!shell(code()).includes("Content-Type: application/json") || warns().some((x) => x.includes("no Content-Type"))) return `the fix: ${code()}`;
await body(`{"a": 1,}`);
if (!warns().includes("Content-Type says JSON, but the body does not parse as JSON.")) return `bad JSON: ${warns()}`;
rows("header").at(-1).querySelector("button").click(); await wait(40);
await body("plain words");
if (!warns().includes("The body has no Content-Type: curl would send it as a form, and fetch as text.")) return `no type: ${warns()}`;
c.querySelector("[data-add=header]").click(); await wait(40);
let added = rows("header").at(-1).querySelectorAll("input");
type(added[0], "content-type"); type(added[1], "application/x-www-form-urlencoded"); await wait(40);
await body(`{"a":1}`);
if (!warns().includes("Content-Type says a form, but the body looks like JSON.")) return `form: ${warns()}`;
// Header names and values that cannot be.
type(added[0], "Bad Name"); await wait(40);
if (probs()[0] !== `The header name "Bad Name" has characters a header name cannot.`) return `bad name: ${probs()}`;
type(added[0], ""); await wait(40);
if (!probs()[0].startsWith("The header with value")) return `no name: ${probs()}`;
// A browser's text field drops line breaks, so that check is for headers given as props.
type(added[0], "Host"); type(added[1], "x"); await wait(40);
if (!warns().some((x) => x.startsWith("A browser does not let fetch set Host"))) return `forbidden: ${warns()}`;
type(added[0], "Content-Length"); type(added[1], "5"); await wait(40);
if (!warns().some((x) => x.startsWith("Content-Length is worked out"))) return "content length";
rows("header").at(-1).querySelector("button").click(); await wait(40);
// Secrets by name, in each place.
await body(`{"user": "a", "password": "hunter2", "api_key": "k\\"1"}`);
if (!code().includes(`"password": "••••••••"`) || !code().includes(`"api_key": "••••••••"`) || code().includes("hunter2") || !code().includes(`"user": "a"`)) return `JSON body: ${code()}`;
await body("user=a&password=hunter2&x=1");
if (!code().includes("user=a&password=••••••••&x=1")) return `form body: ${code()}`;
await body("");
await url("https://ada:s3cret@api.example.com/x?token=abc&page=2");
if (!code().includes("https://ada:••••••••@api.example.com/x?token=••••••••&page=2") || code().includes("s3cret") || code().includes("abc")) return `URL secrets: ${code()}`;
if (!warns().includes("A secret in the query ends up in logs and browser history: a header is safer.")) return `query secret: ${warns()}`;
const q0 = rows("query")[0].querySelectorAll("input");
type(q0[0], "api_key"); type(q0[1], "zzz"); await wait(40);
if (q0[1].type !== "password" || code().includes("zzz")) return `a query row: ${code()}`;
type(q0[0], "expand"); type(q0[1], "a b&c=d"); await wait(40);
if (!shell(code())[0].length || !code().includes("expand=a%20b%26c%3Dd")) return `query encoding: ${code()}`;
await url("http://api.example.com/?token=abc");
if (!warns().includes("This sends a secret over plain http, where anyone on the way can read it.")) return `http: ${warns()}`;
await url("http://localhost:3000/?token=abc");
if (warns().includes("This sends a secret over plain http, where anyone on the way can read it.")) return "localhost is no risk";
// URLs: a fragment, no scheme, brackets, spaces, bad ones.
await url("https://a.example/p#top");
if (code().includes("#top") || !warns().some((x) => x.startsWith("The fragment #top is never sent"))) return `fragment: ${code()}`;
await url("a.example/p");
if (!code().includes("https://a.example/p") || !warns().includes("No scheme on the URL, so https:// was added.")) return `scheme: ${code()}`;
await url("https://a.example/p?ids[]=1&x={y}");
if (!shell(code()).includes("-g")) return `brackets need -g: ${code()}`;
await url("https://a.example/a b/é");
if (!code().includes("https://a.example/a%20b/%C3%A9")) return `encoded path: ${code()}`;
for (const [t, want] of [["", "Enter a URL."], ["   ", "Enter a URL."], ["ftp://a.example", "This is not an HTTP URL: it must start with http:// or https://."], ["mailto:a@b.c", "This is not an HTTP URL: it must start with http:// or https://."],
    ["https://", "The URL has no host."], ["https://a b/", "The URL's host has a space in it."], ["https://a.example/" + "x".repeat(25000), "The URL is 25,018 characters, past the 20,000 it will read."]]) {
    await url(t);
    if (probs()[0] !== want || code() !== undefined) return `${t.slice(0, 20)}: ${probs()}`;
    if (f("url").getAttribute("aria-invalid") !== "true") return "not marked";
}
// Keyboard: the snippets are tabs.
await url("https://a.example/");
const t1 = c.querySelector("#http-request-builder-demo-tab-curl");
t1.focus(); key(t1, "ArrowRight"); await wait(50);
if (document.activeElement.id !== "http-request-builder-demo-tab-fetch" || !code().startsWith("const response")) return `ArrowRight: ${document.activeElement.id}`;
key(document.activeElement, "End"); await wait(50);
if (document.activeElement.id !== "http-request-builder-demo-tab-httpie" || !code().startsWith("http ")) return "End";
key(document.activeElement, "ArrowRight"); await wait(50);
if (document.activeElement.id !== "http-request-builder-demo-tab-curl") return "it wraps";
key(document.activeElement, "ArrowLeft"); await wait(50);
if (document.activeElement.id !== "http-request-builder-demo-tab-httpie" || c.querySelector("[role=tabpanel]").getAttribute("aria-labelledby") !== "http-request-builder-demo-tab-httpie") return "ArrowLeft";
if (document.activeElement.getAttribute("tabindex") !== "0" || t1.getAttribute("tabindex") !== "-1") return "the roving tabindex";
// A map of headers works; the second demo uses HTTPie; on_change.
const l = f("url", "http-request-builder-demo-live");
if (l.name !== "probe_url") return "the name";
const lw = l.closest(".ui-http-req");
if (lw.querySelector(".ui-http-req-code").textContent !== "http GET https://api.example.com/health") return lw.querySelector(".ui-http-req-code").textContent;
type(l, "https://api.example.com/v2 'x"); await wait(40);
const note = lw.closest(".demo-stack").querySelector(".demo-note");
if (!note.textContent.startsWith("on_change: ok true, 0 warnings: http GET ")) return `on_change: ${note.textContent}`;
if (shell(note.textContent.split("warnings: ")[1])[2] !== "https://api.example.com/v2%20'x") return `quoted: ${note.textContent}`;
