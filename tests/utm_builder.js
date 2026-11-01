localStorage.removeItem("utm-builder-demo");
const f = (n, pre = "utm-builder-demo") => $(`#${pre}-${n}`);
const c = f("url").closest(".ui-utm");
const link = () => c.querySelector("[data-link]")?.textContent;
const warns = () => [...c.querySelectorAll("[data-warnings] li")].map((l) => l.textContent);
const probs = () => [...c.querySelectorAll("[data-problems] li")].map((l) => l.textContent);
const sent = (n) => c.querySelector(`[data-sent=${n}]`)?.textContent;
const set = async (n, v) => { type(f(n), v); await wait(50); };
if (f("url").name !== "url" || f("source").name !== "utm_source" || f("content").name !== "utm_content" || !f("term").labels[0].textContent.includes("(optional)")) return "fields";
// Lower case, hyphens, the query and the fragment where they were.
if (link() !== "https://example.com/sale?ref=7&utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale-2026#buy") return `start: ${link()}`;
if (sent("source") !== "Sent as newsletter" || sent("campaign") !== "Sent as spring-sale-2026") return `sent: ${sent("source")} ${sent("campaign")}`;
if (!warns().includes("Campaign has spaces: they become -, giving spring-sale-2026.")) return `spaces: ${warns()}`;
if (!warns().includes("Source had capitals: it goes as newsletter, so it counts with the rest.")) return `capitals: ${warns()}`;
if (!warns().includes("Campaign spring-sale-2026 is close to spring_sale_2026, used before. The same spelling keeps them together in reports.")) return `near: ${warns()}`;
// The separator and case options.
const sels = c.querySelectorAll("select");
const pick = async (s, v) => { s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); await wait(50); };
await pick(sels[1], "_");
if (!link().includes("utm_campaign=spring_sale_2026#buy") || warns().some((w) => w.includes("is close to"))) return `underscores: ${link()}`;
await pick(sels[1], "keep");
if (!link().includes("utm_campaign=spring%20sale%202026#buy") || !warns().includes("Campaign has spaces, which show as %20 in the link and in reports.")) return `keep: ${link()}`;
await pick(sels[1], "-");
await pick(sels[0], "typed");
if (!link().includes("utm_source=Newsletter&") || !link().includes("utm_campaign=Spring-Sale-2026")) return `typed: ${link()}`;
if (!warns().includes("Source has capitals: Email and email would count as two sources in reports.")) return `typed warns: ${warns()}`;
await pick(sels[0], "lower");
// Mixed conventions, in one field and across fields.
await set("campaign", "spring_sale-2026");
if (!warns().includes("Campaign joins words in more than one way: spring_sale-2026. Pick one.")) return `mixed: ${warns()}`;
await set("campaign", "spring_sale");
await set("content", "header-link");
if (!warns().includes("The fields join words differently: some with underscores, some with hyphens. Reports read better with one.")) return `across: ${warns()}`;
await set("content", "");
await pick(sels[0], "typed");
await set("campaign", "springSale_2026");
if (!warns().includes("Campaign joins words in more than one way: springSale_2026. Pick one.")) return `camel: ${warns()}`;
await pick(sels[0], "lower");
await set("campaign", "spring");
// Mediums.
await set("medium", "e-mail");
if (!warns().includes("Medium e-mail: analytics tools group this under email.")) return `alias: ${warns()}`;
await set("medium", "pigeons");
if (!warns().includes("Medium pigeons is not one analytics tools group by: the usual are cpc, email, social, display, referral, affiliate.")) return `unknown medium: ${warns()}`;
await set("medium", "Email");
if (warns().some((w) => w.startsWith("Medium Email") || w.startsWith("Medium email"))) return `a known medium: ${warns()}`;
await set("source", "email");
if (!warns().includes("Source and medium are both email: source says who sent the visit, medium how.")) return `same: ${warns()}`;
await set("source", "newsletter");
// Encoding.
await set("term", "shoes & socks=50%");
if (!link().includes("utm_term=shoes-%26-socks%3D50%25")) return `encoded: ${link()}`;
if (!warns().includes("Term has characters that get encoded: shoes-&-socks=50%. Letters, digits, - and _ read best in reports.")) return `special: ${warns()}`;
await set("term", "café 😀");
if (!link().includes("utm_term=caf%C3%A9-%F0%9F%98%80")) return `unicode: ${link()}`;
await set("term", "");
// Existing parameters: replaced where a value is given, kept where none is.
await set("url", "https://a.example/p?x=1&UTM_SOURCE=old&utm_id=9&b=a%20b&#top?tab=2");
if (link() !== "https://a.example/p?x=1&utm_id=9&b=a%20b&utm_source=newsletter&utm_medium=email&utm_campaign=spring#top?tab=2") return `existing: ${link()}`;
if (!warns().includes("The address already had UTM_SOURCE=old: replaced.") || !warns().includes("The address keeps utm_id=9, as no value here replaces it.")) return `existing notes: ${warns()}`;
if (!warns().some((w) => w.startsWith("The fragment holds a ?"))) return "a hash route";
await set("url", "example.com");
if (link() !== "https://example.com?utm_source=newsletter&utm_medium=email&utm_campaign=spring" || !warns().includes("No https:// on the address, so it was added.")) return `no scheme: ${link()}`;
await set("url", "http://localhost:3000/a");
if (!link().startsWith("http://localhost:3000/a?utm_source=")) return `localhost: ${link()}`;
await set("url", "intranet/page");
if (!warns().includes("The host intranet has no dot: check the address.")) return `no dot: ${warns()}`;
// What cannot be built says why.
for (const [u, want] of [["", "Enter the page's address."], ["   ", "Enter the page's address."], ["/just/a/path", "A campaign link goes in emails and ads, so it needs the whole address, with https://."], ["?a=1", "A campaign link goes in emails and ads, so it needs the whole address, with https://."],
    ["https://exa mple.com", "The address has a space in it: encode it as %20 or take it out."], ["mailto:a@b.c", "This is not a web address: it must start with http:// or https://."], ["ftp://a.example/x", "This is not a web address: it must start with http:// or https://."],
    ["https://", "The address has no host."], ["https:///x", "The address has no host."], ["x".repeat(9000), "The address is 9,000 characters, past the 8,000 it will read."]]) {
    await set("url", u);
    if (!probs().includes(want) || link()) return `${u.slice(0, 20)}: ${probs()}`;
}
await set("url", "https://a.example/");
await set("source", "  ");
if (!probs().includes("Source is needed.") || link()) return `a blank source: ${probs()}`;
await set("source", "x");
await set("medium", "");
await set("campaign", "");
if (probs().join("|") !== "Medium is needed.|Campaign is needed.") return `two needed: ${probs()}`;
await set("medium", "cpc");
await set("campaign", "a");
await set("url", `https://a.example/?q=${"y".repeat(2100)}`);
if (!warns().some((w) => /^The link is 2,1\d\d characters/.test(w))) return `long: ${warns()}`;
await set("url", "https://a.example/");
// Recent values: offered, picked, kept newest first, capped, kept in this browser.
const picks = (n) => [...f(n).closest(".ui-utm-field").querySelectorAll(".ui-utm-pick")].map((b) => b.textContent);
if (picks("source").join(",") !== "newsletter,partner-blog") return `recent: ${picks("source")}`;
if ([...f("source").closest(".ui-utm-field").querySelectorAll("datalist option")].length !== 2) return "datalist";
[...f("source").closest(".ui-utm-field").querySelectorAll(".ui-utm-pick")][1].click(); await wait(50);
if (f("source").value !== "partner-blog") return "a pick fills the field";
await set("campaign", "Winter Push");
c.querySelector("[data-keep]").click(); await wait(50);
if (picks("campaign").join(",") !== "winter-push,spring_sale_2026") return `kept: ${picks("campaign")}`;
if (picks("source").join(",") !== "partner-blog,newsletter") return `moved to the front, once: ${picks("source")}`;
if (JSON.parse(localStorage.getItem("utm-builder-demo")).campaign[0] !== "winter-push") return "not stored";
for (let i = 0; i < 12; i++) { type(f("campaign"), `c${i}`); await wait(10); c.querySelector("[data-keep]").click(); await wait(10); }
await wait(50);
if (picks("campaign").length !== 5 || picks("campaign")[0] !== "c11") return `shown: ${picks("campaign")}`;
if (JSON.parse(localStorage.getItem("utm-builder-demo")).campaign.length !== 8) return "the cap";
localStorage.removeItem("utm-builder-demo");
// on_change; the address gets https://; a name prefix.
const l = f("source", "utm-builder-demo-live");
if (l.name !== "ad_utm_source") return `prefix: ${l.name}`;
const w = l.closest(".ui-utm");
if (w.querySelector("[data-link]").textContent !== "https://shop.example/shoes?utm_source=google&utm_medium=cpc&utm_campaign=shoes") return w.querySelector("[data-link]").textContent;
type(l, "bing"); await wait(50);
const note = w.closest(".demo-stack").querySelector(".demo-note");
if (note.textContent !== "on_change: ok true, 1 warnings, https://shop.example/shoes?utm_source=bing&utm_medium=cpc&utm_campaign=shoes.") return `on_change: ${note.textContent}`;
type(l, ""); await wait(50);
if (note.textContent !== "on_change: ok false, 1 warnings, null.") return `on_change: ${note.textContent}`;
