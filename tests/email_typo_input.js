const box = $("#email-typo-demo");
const wrap = box.closest(".ui-emailtypo");
const fix = (w = wrap) => w.querySelector(".ui-emailtypo-fix")?.textContent;
const bad = (w = wrap) => w.querySelector(".ui-emailtypo-bad")?.textContent;
const good = (w = wrap) => w.querySelector(".ui-emailtypo-good")?.textContent;
if (box.type !== "email" || box.name !== "email" || !box.required) return "it is a real required email field";
if (fix() !== "jane@gmail.com") return `start: ${fix()}`;
const typos = [["gmial.com", "gmail.com"], ["gmal.com", "gmail.com"], ["gmaill.com", "gmail.com"], ["gnail.com", "gmail.com"], ["gamil.com", "gmail.com"], ["mgail.com", "gmail.com"],
    ["gmail.con", "gmail.com"], ["gmail.cmo", "gmail.com"], ["gmail.co", "gmail.com"], ["gmail.cm", "gmail.com"], ["gmail.om", "gmail.com"], ["GMIAL.COM", "gmail.com"],
    ["hotmial.com", "hotmail.com"], ["hotmal.com", "hotmail.com"], ["hotnail.com", "hotmail.com"], ["yaho.com", "yahoo.com"], ["yahooo.com", "yahoo.com"], ["yahoo.con", "yahoo.com"],
    ["outlok.com", "outlook.com"], ["outllook.com", "outlook.com"], ["iclod.com", "icloud.com"], ["icloud.con", "icloud.com"], ["protonmial.com", "protonmail.com"], ["protnmal.com", "protonmail.com"],
    ["hotmial.con", "hotmail.com"], ["yaho.co.uk", "yahoo.co.uk"], ["acme.con", "acme.com"], ["charity.ogr", "charity.org"]];
for (const [domain, want] of typos) {
    type(box, `jane@${domain}`); await wait(15);
    if (fix() !== `jane@${want}`) return `${domain} offers ${fix()}, not ${want}`;
    if (bad() || box.getAttribute("aria-invalid")) return `${domain} is a question, not an error`;
}
// Valid, uncommon or merely near a common name: no alarm.
for (const domain of ["gmail.com", "proton.me", "fastmail.com", "example.org", "acme.co.uk", "quillolang.org", "gmail.de", "yahoo.ca", "outlook.de", "hotmail.fr", "mail.com", "email.com",
    "ymail.com", "zoho.com", "hey.com", "gmx.net", "bigcorp.io", "g.co", "wahoo.com", "cloud.com", "andes.com", "life.com", "love.com", "hotmart.com", "tuta.com", "mail.example.co", "exämple.de"]) {
    type(box, `jane@${domain}`); await wait(15);
    if (fix()) return `a false alarm on ${domain}: ${fix()}`;
    if (good() !== "Looks right.") return `${domain} is not taken as right: ${bad()}`;
}
type(box, "Jane.Doe+news@gmial.com"); await wait(30);
if (fix() !== "Jane.Doe+news@gmail.com") return `the part before the @ is kept: ${fix()}`;
wrap.querySelector(".ui-emailtypo-fix").click(); await wait(50);
if (box.value !== "Jane.Doe+news@gmail.com" || good() !== "Looks right." || fix()) return `one click fixes: ${box.value}`;
if (document.activeElement !== box) return "the fix gives focus back to the field";
type(box, "jane@gmial.com"); await wait(30);
wrap.querySelector(".ui-emailtypo-keep").click(); await wait(50);
if (fix() || box.value !== "jane@gmial.com") return "Keep what I typed keeps it, and the offer goes";
type(box, "jane@hotmial.com"); await wait(30);
if (fix() !== "jane@hotmail.com") return "a new typo is offered again";
for (const [text, says] of [
    ["a@b@c.com", "An address has one @. (character 4)"], ["@gmail.com", "Something goes before the @. (character 1)"], [".a@gmail.com", "The address cannot start with a dot. (character 1)"],
    ["a.@gmail.com", "The part before the @ cannot end with a dot. (character 2)"], ["a..b@gmail.com", "Two dots in a row. (character 2)"], ["a b@gmail.com", "A space cannot be in an address. (character 2)"],
    ["a(b@gmail.com", `"(" cannot be in an address. (character 2)`], ["a@.gmail.com", "The domain cannot start with a dot. (character 3)"], ["a@gmail..com", "Two dots in a row. (character 8)"],
    ["a@-x.com", "A part of the domain cannot start with a hyphen. (character 3)"], ["a@x-.com", "A part of the domain cannot end with a hyphen. (character 4)"], ["a@b_c.com", `"_" cannot be in a domain. (character 4)`],
    ["a@b.1", "The domain's ending should be letters, such as .com. (character 5)"], [`${"a".repeat(65)}@x.com`, "The part before the @ is too long: 64 characters at most. (character 65)"],
    [`a@${"b".repeat(64)}.com`, "A part of the domain is too long: 63 characters at most. (character 66)"], [`a@${"b.".repeat(130)}com`, "Too long for an address: 254 characters at most. (character 255)"],
]) {
    type(box, text); await wait(20);
    if (bad() !== says) return `"${text.slice(0, 30)}" says: ${bad()}`;
    if (box.getAttribute("aria-invalid") !== "true") return `"${text.slice(0, 30)}" is not marked`;
}
for (const [text, says, want] of [["jane@gmail,com", "A comma cannot be in a domain. (character 11)", "jane@gmail.com"], ["jane@gmail.com.", "The domain cannot end with a dot. (character 15)", "jane@gmail.com"],
    ["jane@gmial.com.", "The domain cannot end with a dot. (character 15)", "jane@gmail.com"], ["jane at gmail.com", "An address has an @ in place of the word. (character 6)", "jane@gmail.com"],
    ["Jane Doe <jane@acme.org>", "Only the address goes here. (character 1)", "jane@acme.org"], ["mailto:jane@acme.org", "Only the address goes here. (character 1)", "jane@acme.org"]]) {
    type(box, text); await wait(20);
    if (bad() !== says || fix() !== want) return `"${text}": ${bad()} / ${fix()}`;
}
// Unfinished is not wrong, until the field is left.
const other = $("#email-typo-demo-live"), ow = other.closest(".ui-emailtypo"), note = () => other.closest(".demo-stack").querySelector(".demo-note").textContent;
type(other, "jane"); await wait(30);
if (bad(ow) || other.getAttribute("aria-invalid")) return `"jane" while typing: ${bad(ow)}`;
type(other, "jane@gmail"); await wait(30);
if (bad(ow) || fix(ow) !== "jane@gmail.com") return `a domain without its ending: ${bad(ow)} ${fix(ow)}`;
type(other, "jane@gmailcom"); await wait(30);
if (fix(ow) !== "jane@gmail.com") return `a lost dot: ${fix(ow)}`;
type(other, "jane@gmial"); await wait(30);
if (fix(ow) !== "jane@gmail.com") return `a typo and no ending: ${fix(ow)}`;
type(other, "jane@"); await wait(30);
other.dispatchEvent(new FocusEvent("blur")); await wait(50);
if (bad(ow) !== "Something goes after the @. (character 6)") return `after leaving: ${bad(ow)}`;
type(other, "jane"); await wait(30);
if (bad(ow) !== "An address needs an @. (character 5)") return `left once, it keeps saying: ${bad(ow)}`;
type(other, "lee@acme-robotics.com"); await wait(30);
if (fix(ow) || good(ow) !== "Looks right." || note() !== "on_change: ok lee@acme-robotics.com") return `a domain from the prop: ${note()}`;
type(other, "lee@acme-robotcs.com"); await wait(30);
if (fix(ow) !== "lee@acme-robotics.com" || note() !== "on_change: suggest lee@acme-robotcs.com") return `the prop's domain is compared too: ${fix(ow)} ${note()}`;
ow.querySelector(".ui-emailtypo-fix").click(); await wait(50);
if (note() !== "on_change: ok lee@acme-robotics.com") return `on_change on a fix: ${note()}`;
for (const d of ["mailinator.com", "MAILINATOR.com", "x.guerrillamail.com"]) {
    type(box, `a@${d}`); await wait(20);
    if (wrap.querySelector(".ui-emailtypo-warn")?.textContent !== "This is a throwaway address, so a reply may never reach it.") return `disposable ${d}`;
    if (bad() || good()) return "a warning, not an error and not all right";
}
type(box, "a@notmailinator.com"); await wait(30);
if (wrap.querySelector(".ui-emailtypo-warn")) return "a list entry only matches whole domain parts";
type(box, "   "); await wait(30);
if (bad() || fix() || good()) return "blank says nothing";
if (box.labels[0]?.textContent.includes("Email") !== true) return "the label";
