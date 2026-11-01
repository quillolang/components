const box = $("#contact-paste-demo");
const wrap = box.closest(".ui-contactpaste");
const F = ["name", "email", "phone", "website", "company", "address"];
const val = (f, w = wrap) => w.querySelector(`[data-field=${f}] input`).value;
const sure = (f, w = wrap) => w.querySelector(`[data-field=${f}] .ui-contactpaste-tag`)?.dataset.sure;
const check = async (text, want) => {
    type(box, text); await wait(30);
    for (const f of F) {
        const [v, s] = want[f] ?? ["", undefined];
        if (val(f) !== v) return `${JSON.stringify(text.slice(0, 40))} ${f}: "${val(f)}", not "${v}"`;
        if (sure(f) !== s) return `${JSON.stringify(text.slice(0, 40))} ${f} (${v}): sure ${sure(f)}, not ${s}`;
    }
    return null;
};
if (wrap.querySelector("[data-field=email] input").name !== "email" || wrap.querySelector("[data-field=email] input").type !== "email") return "the fields are real";
const sig = { name: ["Jane Doe", "high"], email: ["jane.doe@acmerobotics.com", "high"], phone: ["+1 (415) 555-0132", "high"], website: ["www.acmerobotics.com", "high"],
    company: ["Acme Robotics Inc.", "high"], address: ["123 Market St, Suite 400, San Francisco, CA 94105", "high"] };
for (const f of F) if (val(f) !== sig[f][0] || sure(f) !== sig[f][1]) return `start, ${f}: "${val(f)}" ${sure(f)}`;
if (wrap.querySelector(".ui-contactpaste-sum span").textContent.trim() !== "Found 6 of 6 details.") return wrap.querySelector(".ui-contactpaste-sum span").textContent;
let bad;
bad = await check(`Mit freundlichen Grüßen\nDr. Jürgen Müller\nLeiter Vertrieb\nMüller & Söhne GmbH\nHauptstraße 12\n10115 Berlin\nTel.: +49 30 1234567\nE-Mail: j.mueller@mueller-soehne.de`, {
    name: ["Jürgen Müller", "high"], email: ["j.mueller@mueller-soehne.de", "high"], phone: ["+49 30 1234567", "high"], website: ["mueller-soehne.de", "low"], company: ["Müller & Söhne GmbH", "high"], address: ["Hauptstraße 12, 10115 Berlin", "high"] });
if (bad) return bad;
bad = await check("Hi, you can reach Maria Santos at maria@brightside.io or call 555-867-5309. She works at Brightside Studio in Manila.", {
    name: ["Maria Santos", "high"], email: ["maria@brightside.io", "high"], phone: ["555-867-5309", "medium"], website: ["brightside.io", "low"], company: ["Brightside Studio", "medium"] });
if (bad) return bad;
bad = await check("From: Tom Lee <tom.lee@gmail.com>", { name: ["Tom Lee", "high"], email: ["tom.lee@gmail.com", "high"] });
if (bad) return bad;
bad = await check("Name: Ada Lovelace\nCompany: Analytical Engines\nPhone: 020 7946 0958\nEmail: ada@analytical.org\nWebsite: https://analytical.org/\nAddress: 12 St James's Square, London SW1Y 4LB", {
    name: ["Ada Lovelace", "high"], email: ["ada@analytical.org", "high"], phone: ["020 7946 0958", "high"], website: ["https://analytical.org/", "high"], company: ["Analytical Engines", "high"], address: ["12 St James's Square, London SW1Y 4LB", "high"] });
if (bad) return bad;
bad = await check("sam.taylor@northwind-traders.com", { name: ["Sam Taylor", "low"], email: ["sam.taylor@northwind-traders.com", "high"], website: ["northwind-traders.com", "low"], company: ["Northwind Traders", "low"] });
if (bad) return bad;
bad = await check("Priya Nair | VP Engineering at Lumen Systems\nM: 415-555-0199 | F: 415-555-0100\npriya@lumen.systems | linkedin.com/in/priyanair", {
    name: ["Priya Nair", "high"], email: ["priya@lumen.systems", "high"], phone: ["415-555-0199", "high"], website: ["lumen.systems", "low"], company: ["Lumen Systems", "medium"] });
if (bad) return bad;
bad = await check("> Thanks, Olu Adeyemi\n> info@kwanza.co.uk\n> Kwanza Ltd\n> 2026-11-01", { name: ["Olu Adeyemi", "high"], email: ["info@kwanza.co.uk", "medium"], website: ["kwanza.co.uk", "low"], company: ["Kwanza Ltd", "high"] });
if (bad) return bad;
bad = await check("reach me at bo [at] example [dot] org", { email: ["bo@example.org", "medium"], website: ["example.org", "low"], company: ["Example", "low"] });
if (bad) return bad;
// Nothing to find: no guess is better than a wrong one, and nothing throws.
for (const text of ["asdf", "12345", "   ", "{\"a\": [1, 2, {\"b\": null}]}", "😀😀😀", "hello world", "Meeting on 2026-11-01 at noon", "<script>alert(1)</script>", "a@b", "@@@@", "\u0000\u0001"]) {
    const r = await check(text, {});
    if (r) return r;
}
type(box, ""); await wait(30);
if (wrap.querySelector(".ui-contactpaste-sum span").textContent.trim() !== "Nothing pasted yet.") return "empty";
type(box, "asdf"); await wait(30);
if (wrap.querySelector(".ui-contactpaste-sum span").textContent.trim() !== "Found nothing to fill in: is this a signature?") return "nothing found";
const t0 = performance.now();
type(box, "Jane Doe\njane@acme.org\n" + "x ".repeat(200000)); await wait(40);
if (performance.now() - t0 > 400) return `a huge paste took ${performance.now() - t0} ms`;
if (val("email") !== "jane@acme.org" || !wrap.querySelector(".ui-contactpaste-sum span").textContent.includes("Only the first 5,000 characters")) return `a huge paste says it was cut: ${val("email")}`;
// Edits are never overwritten.
const lv = $("#contact-paste-demo-live"), lw = lv.closest(".ui-contactpaste"), note = () => lv.closest(".demo-stack").querySelector(".demo-note").textContent;
if (lw.querySelector("[data-field=name] input").name !== "lead_name") return "prefix";
type(lv, "Jane Doe\njane@acme.org"); await wait(30);
if (note() !== "on_change: Jane Doe / jane@acme.org") return `on_change: ${note()}`;
const name = lw.querySelector("[data-field=name] input");
type(name, "Janet Doe"); await wait(30);
if (sure("name", lw) !== "edited" || note() !== "on_change: Janet Doe / jane@acme.org") return `an edit: ${sure("name", lw)} ${note()}`;
type(lv, "Bob Stone\nbob@stone.org"); await wait(30);
if (val("name", lw) !== "Janet Doe" || val("email", lw) !== "bob@stone.org") return `pasting again: ${val("name", lw)} ${val("email", lw)}`;
if (note() !== "on_change: Janet Doe / bob@stone.org") return `on_change after pasting again: ${note()}`;
const offer = lw.querySelector("[data-field=name] .ui-contactpaste-use");
if (offer?.textContent !== "Found Bob Stone: use that") return `what it found is offered: ${offer?.textContent}`;
type(lw.querySelector("[data-field=phone] input"), ""); await wait(30);
if (sure("phone", lw) !== "edited") return "clearing a field is an edit too";
type(lv, "Bob Stone\nbob@stone.org\n+44 20 7946 0958"); await wait(30);
if (val("phone", lw) !== "" ) return `a field cleared stays clear: ${val("phone", lw)}`;
offer.click(); await wait(40);
if (val("name", lw) !== "Bob Stone" || sure("name", lw) !== "high") return `taking the offer: ${val("name", lw)}`;
lw.querySelector(".ui-contactpaste-again").click(); await wait(40);
if (lv.value !== "" || val("name", lw) !== "" || val("phone", lw) !== "" || sure("phone", lw) !== undefined) return "Start over clears it all";
if (wrap.querySelector(".ui-contactpaste-sum").getAttribute("aria-live") !== "polite") return "what was found is announced";
if (box.labels[0]?.textContent !== "Paste a signature or a blurb") return "the label";
