const box = $("#url-inspector-demo-url");
const c = box.closest(".ui-url-insp");
const part = (n) => c.querySelector(`[data-part=${n}]`)?.textContent;
const kind = () => c.querySelector("[data-kind]")?.dataset.kind;
const rebuilt = () => c.querySelector("[data-rebuilt]")?.textContent;
const rows = () => [...c.querySelectorAll("tbody tr")];
const row = (k) => rows().find((r) => r.querySelector("input").value === k);
const flags = (k) => [...row(k).querySelectorAll(".ui-url-insp-flag")].map((f) => f.textContent).join(",");
const problems = () => [...c.querySelectorAll(".ui-url-insp-bad li")].map((l) => l.textContent);
const notes = () => [...c.querySelectorAll(".ui-url-insp-list:not(.ui-url-insp-bad) li")].map((l) => l.textContent);
const load = async (t) => { type(box, t); await wait(60); };
const start = box.value;
if (box.name !== "url" || !box.labels[0]) return "the field";
if (kind() !== "absolute" || part("scheme") !== "https" || part("user") !== "ada" || part("password") !== "s3cret") return `parts: ${kind()} ${part("scheme")}`;
if (part("host") !== "xn--mnchen-3ya.example" || part("unicode") !== "münchen.example") return `punycode: ${part("host")} ${part("unicode")}`;
if (part("port") !== "443" || part("path") !== "/caf%C3%A9/a%2520b" || part("decoded") !== "/café/a%20b" || part("fragment") !== "top") return `rest: ${part("port")} ${part("path")} ${part("decoded")}`;
if (rows().length !== 6) return `rows: ${rows().length}`;
if (row("q").querySelectorAll("input")[1].value !== "café au lait") return `decoded: ${row("q").querySelectorAll("input")[1].value}`;
if (flags("utm_source") !== "tracking" || flags("fbclid") !== "tracking" || flags("q") !== "") return "tracking flags";
if (flags("next") !== "encoded twice" || row("next").querySelectorAll("input")[1].value !== "%2Fhome") return `twice: ${flags("next")}`;
if (row("flag").querySelectorAll("input")[1].value !== "") return "a name alone";
if (!notes().includes("It holds a password, which anyone who sees the URL can read.") || !notes().includes("Port 443 is what https uses anyway, so it can go.") || !notes().includes("The path looks encoded twice: it has %25 before an escape.")) return `notes: ${notes()}`;
// Nothing edited, nothing changes, but the host's case.
if (rebuilt() !== start) return `rebuilt: ${rebuilt()}`;
// Tracking goes at a press.
c.querySelector("[data-strip]").click(); await wait(60);
if (rebuilt() !== "https://ada:s3cret@xn--mnchen-3ya.example:443/caf%C3%A9/a%2520b?q=caf%C3%A9+au+lait&next=%252Fhome&flag#top") return `stripped: ${rebuilt()}`;
if (c.querySelector("[data-strip]")) return "the button stays";
// An edit encodes that row only.
const v = row("q").querySelectorAll("input")[1];
type(v, "a b&c=d/é"); await wait(60);
if (document.activeElement !== v) return "editing loses focus";
if (rebuilt() !== "https://ada:s3cret@xn--mnchen-3ya.example:443/caf%C3%A9/a%2520b?q=a%20b%26c%3Dd%2F%C3%A9&next=%252Fhome&flag#top") return `edit: ${rebuilt()}`;
row("next").querySelector("button").click(); await wait(60);
c.querySelector("[data-add]").click(); await wait(60);
const added = rows()[rows().length - 1].querySelectorAll("input");
type(added[0], "k y"); type(added[1], "😀"); await wait(60);
if (rebuilt() !== "https://ada:s3cret@xn--mnchen-3ya.example:443/caf%C3%A9/a%2520b?q=a%20b%26c%3Dd%2F%C3%A9&flag&k%20y=%F0%9F%98%80#top") return `added: ${rebuilt()}`;
// Duplicates stay, in order. No query is no ?.
await load("https://a.example/?x=1&x=2&x=3");
if (rows().length !== 3) return "repeated names";
for (const r of rows()) r.querySelector("button").click();
await wait(60);
if (rebuilt() !== "https://a.example/") return `no rows: ${rebuilt()}`;
// Keeps what is fine, encodes what is not.
await load("HTTP://EXAMPLE.com/a b/é?x=a b&y=é#f g");
if (rebuilt() !== "http://example.com/a%20b/%C3%A9?x=a%20b&y=%C3%A9#f%20g") return `encoded: ${rebuilt()}`;
if (new URL(rebuilt()).href !== rebuilt()) return "a browser would read it otherwise";
await load("https://a.example/100%/x");
if (problems()[0] !== "The path has a % that does not start an escape.") return `bad %: ${problems()}`;
await load("https://a.example/?x=100%&y=%zz&z=%FF");
if (flags("x") !== "bad escape" || flags("y") !== "bad escape" || flags("z") !== "not UTF-8") return `escapes: ${flags("x")} ${flags("y")} ${flags("z")}`;
if (rebuilt() !== "https://a.example/?x=100%25&y=%25zz&z=%FF") return `escapes rebuilt: ${rebuilt()}`;
// Punycode against the browser's own, both ways.
for (const host of ["münchen.de", "bücher.example", "例え.テスト", "пример.рф", "faß.example", "😀.example", "مثال.example", "a-ü-b.example", "ñandú.example", "한글.example"]) {
    await load(`https://${host}/`);
    const want = new URL(`https://${host}/`).hostname;
    // UTS 46 maps ß to itself now; the rest of its mapping is out of scope.
    if (part("host") !== want) return `${host}: ${part("host")}, a browser says ${want}`;
    if (part("unicode") !== host) return `${host} back: ${part("unicode")}`;
}
await load("https://xn--r8jz45g.xn--zckzah/");
if (part("unicode") !== "例え.テスト") return `known: ${part("unicode")}`;
await load("https://xn--pple-43d.com/");
if (part("unicode") !== "аpple.com" || !notes().includes(`The host part "аpple" mixes Latin with Cyrillic or Greek letters, which can pass for another name.`)) return `mixed: ${notes()}`;
await load("https://xn--a.example/");
if (problems()[0] !== `The host part "xn--a" is not valid punycode.`) return `bad punycode: ${problems()}`;
// Relative, with a base; the second demo starts relative. Against the browser's resolver.
const l = $("#url-inspector-demo-live-url");
const w = l.closest(".ui-url-insp");
const lk = () => w.querySelector("[data-kind]").dataset.kind;
const res = () => w.querySelector("[data-resolved]")?.textContent;
if (lk() !== "relative" || res() !== "https://example.com/blog/img/a%20b.png?v=2") return `relative: ${lk()} ${res()}`;
const lb = $("#url-inspector-demo-live-base");
if (lb.name !== "link_base") return "the base's name";
type(lb, "https://a.example/b/c/d?q"); await wait(30);
for (const ref of ["g", "./g", "g/", "/g", "//g", "?y", "g?y", "#s", "g#s", ";x", "g;x", "", ".", "./", "..", "../", "../g", "../..", "../../", "../../g", "../../../g", "g/./h", "g/../h", "/./g", "/../g", "g.", ".g", "..g"]) {
    type(l, ref); await wait(40);
    if (ref === "") continue;
    if (new URL(res()).href !== new URL(ref, "https://a.example/b/c/d?q").href) return `resolving ${ref}: ${res()}, a browser says ${new URL(ref, "https://a.example/b/c/d?q").href}`;
}
type(lb, "not a base"); type(l, "a"); await wait(60);
if (!w.querySelector("[role=alert]")?.textContent.includes("The base must be an absolute URL.")) return "a bad base";
type(lb, ""); await wait(60);
if (res()) return "no base, nothing resolved";
type(l, "example.com/path"); await wait(60);
if (lk() !== "relative" || !w.textContent.includes("If example.com is a host, add https:// in front.")) return "a host without a scheme";
type(l, "//cdn.example.com/x.js"); await wait(60);
if (lk() !== "scheme-relative" || w.querySelector("[data-part=host]").textContent !== "cdn.example.com") return "scheme-relative";
// Opaque, and each way of being invalid.
await load("mailto:ada@example.com?subject=hi");
if (kind() !== "opaque" || part("path") !== "ada@example.com" || c.querySelector("[data-add]")) return `mailto: ${kind()}`;
if (rebuilt() !== "mailto:ada@example.com?subject=hi") return `mailto rebuilt: ${rebuilt()}`;
await load("javascript:alert(1)");
if (!notes()[0].startsWith("This runs script")) return "javascript:";
for (const [t, want] of [
    ["http:/example.com", "http needs // after the colon: http://example.com"], ["http:example.com", "http needs // after the colon: http://example.com"], ["https://", "There is no host after the //."],
    ["https://exa mple.com/", `The host "exa mple.com" holds a character a host cannot: a space, or one of < > " \\ ^ \` { | } %.`], ["https://a.example:99999/", `The port "99999" is not a number from 0 to 65535.`],
    ["https://a.example:abc/", `The port "abc" is not a number from 0 to 65535.`], ["https://[::1/", `The host "[::1" opens a [ and never closes it.`], ["https://[zz]/", "[zz] is not an IPv6 address."],
    ["https://a..b/", `The host "a..b" has an empty part between dots.`], ["1http://x/", `"1http" cannot be a scheme: it starts with a letter, then letters, digits, + . or -.`],
    ["localhost:8080/x", `This reads as the scheme "localhost", but looks like a host and port. Add https:// in front.`], ["https://a:b:c/", `The host "a:b:c" has more than one colon. An IPv6 address needs [ ].`],
    ["https://" + "a".repeat(70) + ".example/", `The host part "${"a".repeat(20)}…" is longer than the 63 characters a part can have.`],
    ["https:\\\\example.com", "It holds a backslash, which a URL does not: browsers read it as /, others do not."]]) {
    await load(t);
    if (kind() !== "invalid" || !problems().includes(want)) return `${t}: ${kind()} ${problems()}`;
    if (box.getAttribute("aria-invalid") !== "true" || rebuilt()) return `${t} is not marked`;
    if (!c.querySelector("[role=alert]")) return "not announced";
}
await load("https://[2001:db8::1]:8443/x");
if (kind() !== "absolute" || part("host") !== "[2001:db8::1]" || part("port") !== "8443") return `IPv6: ${part("host")} ${part("port")}`;
await load("  https://a.example/\tb  ");
if (rebuilt() !== "https://a.example/b" || !notes().includes("Space around the URL is left out.")) return `white space: ${rebuilt()}`;
await load("");
if (kind() || !c.textContent.includes("Paste a URL to take it apart.")) return "empty";
await load("   ");
if (kind() || c.querySelector("[role=alert]")) return "blank";
await load("https://a.example/" + "x".repeat(30000));
if (problems()[0] !== "This is 30,018 characters, past the 20,000 it will read.") return `huge: ${problems()}`;
const q = Array.from({ length: 800 }, (_, i) => `k${i}=${i}`).join("&");
const t0 = performance.now();
await load(`https://a.example/?${q}`);
if (performance.now() - t0 - 60 > 500) return `800 parameters took ${Math.round(performance.now() - t0 - 60)} ms`;
if (rows().length !== 500 || !c.textContent.includes("Only the first 500 parameters are read.")) return `cap: ${rows().length}`;
await load(start);
// The callback.
type(l, "/x?utm_source=a&b=1"); await wait(60);
const note = w.closest(".demo-stack").querySelector(".demo-note");
if (note.textContent !== "on_change: relative, 1 tracking, /x?utm_source=a&b=1.") return `on_change: ${note.textContent}`;
