const c = $("#rule-form-demo");
const field = (n) => c.querySelector(`[name=${n}]`);
const shown = () => [...c.querySelectorAll(":scope > quillo-island, :scope > [data-field], [data-field]")].map((e) => e.dataset.field).filter(Boolean);
const names = () => [...new Set(shown())].join();
const error = (n) => c.querySelector(`[data-field=${n}] .ui-rform-error`)?.textContent ?? null;
const sent = () => c.closest(".demo-stack").querySelector("[data-sent]").textContent;
const submit = async () => { c.querySelector(".ui-rform-submit").click(); await wait(60); };
const say = () => c.querySelector("[role=status]").textContent;
const pick = (n, v) => { const s = field(n); s.value = v; s.dispatchEvent(new Event("change", { bubbles: true })); };
if (names() !== "kind,country,guests,from,to,email,agree") return `hidden at the start: ${names()}`;
if (c.querySelector("[name=company]") || c.querySelector("[name=vat]")) return "hidden fields must not be in the form";
if (c.querySelector(".ui-rform-problems")) return "a good description reports nothing";
// Show: choosing a company shows two fields, and a chain follows one value.
c.querySelector("input[value=company]").click(); await wait(50);
if (names() !== "kind,company,country,vat,guests,from,to,email,agree") return `a company: ${names()}`;
type(field("guests"), "1"); await wait(40);
if (field("seat")) return "one guest: no seat field";
type(field("guests"), "2"); await wait(40);
if (!field("seat") || field("seat_kind")) return "two guests: seats, but no kind yet";
type(field("seat"), "1"); await wait(40);
if (!field("seat_kind")) return "a seat shows its kind";
// Hide the middle of the chain: what hung on it goes too, though seat still holds 1.
type(field("guests"), "1"); await wait(40);
if (field("seat") || field("seat_kind")) return `the chain did not fall: ${names()}`;
type(field("guests"), "3"); await wait(40);
if (field("seat")?.value !== "1" || !field("seat_kind")) return "a field shown again keeps what was typed";
pick("seat_kind", "Baby"); await wait(30);
// required_if: VAT is required only with Portugal or Spain.
const star = () => c.querySelector("[data-field=vat] .ui-rform-req");
if (star()) return "no country: VAT is not required";
pick("country", "PT"); await wait(40);
if (!star() || field("vat").getAttribute("aria-required") !== "true") return "Portugal requires the VAT number";
pick("country", "CA"); await wait(40);
if (star()) return "Canada does not";
// Submitting with what is missing: says what, where, and moves there.
c.querySelector("input[value=person]").click(); await wait(40);
c.querySelector("input[value=company]").click(); await wait(40);
pick("country", "ES"); await wait(40);
type(field("from"), "2026-06-10");
await submit();
if (error("company") !== "Company name is required." || error("vat") !== "VAT number is required." || error("to") !== "To is required." || error("email") !== "Email is required." || error("agree") !== "I accept the terms is required.") return `required: ${error("company")} ${error("vat")} ${error("to")} ${error("email")} ${error("agree")}`;
if (say() !== "5 things to fix before this can be sent.") return say();
if (document.activeElement !== field("company")) return `focus goes to the first wrong field: ${document.activeElement?.name}`;
if (field("company").getAttribute("aria-invalid") !== "true" || field("company").getAttribute("aria-describedby") !== "rule-form-demo-company-error") return "the error is tied to its field";
if (!sent().startsWith("Fill it in")) return "an invalid form must not be sent";
// Rules, each with its message.
const each = [
    ["vat", "abc", "vat", "A VAT number is 8 to 12 capitals and digits."], ["vat", "PT12345678", "vat", null],
    ["guests", "0", "guests", "Guests is at least 1."], ["guests", "21", "guests", "Guests is at most 20."], ["guests", "2.5", "guests", "Guests is a whole number."], ["guests", "many", "guests", "Guests is not a number."], ["guests", "   ", "guests", "Guests is required."], ["guests", "3", "guests", null],
    ["email", "a@b", "email", "Email is not an email address."], ["email", "ana@example.com", "email", null],
    ["seat", "5", "seat", "Child seats is at most 4."], ["seat", "1", "seat", null],
];
for (const [n, v, at, want] of each) {
    type(field(n), v); await wait(35);
    if (error(at) !== want) return `${n}=${JSON.stringify(v)}: ${error(at)}, wanted ${want}`;
}
// Cross-field: on the field it names; dates in order; judged only when both are there.
type(field("to"), "2026-06-01"); await wait(40);
if (error("to") !== "To comes on or after From.") return `the dates: ${error("to")}`;
type(field("to"), "2026-06-10"); await wait(40);
if (error("to") !== null) return "the same day is fine";
// A check with no field of its own shows above the button.
type(field("seat"), "4"); await wait(40);
type(field("guests"), "2"); await wait(40);
const extra = () => [...c.querySelectorAll("ul.ui-rform-summary li")].map((l) => l.textContent).join();
if (extra() !== "There are more child seats than guests.") return `the form's check: ${extra()}`;
type(field("seat"), "0"); await wait(40);
if (extra() !== "") return extra();
if (field("seat_kind")) return "0 seats hides the kind";
type(field("company"), "Acme");
field("agree").click(); await wait(40);
await submit();
const got = JSON.parse(sent().replace("on_submit: ", ""));
const want = { kind: "company", company: "Acme", country: "ES", vat: "PT12345678", guests: "2", seat: "0", from: "2026-06-10", to: "2026-06-10", email: "ana@example.com", agree: true };
for (const k of Object.keys(want)) if (got[k] !== want[k]) return `sent ${k}: ${got[k]}`;
if (Object.keys(got).length !== Object.keys(want).length) return `seat_kind is hidden and must not be sent: ${sent()}`;
// A person: what belonged to the company is left out of what is sent.
c.querySelector("input[value=person]").click(); await wait(40);
await submit();
const got2 = JSON.parse(sent().replace("on_submit: ", ""));
if ("company" in got2 || "vat" in got2 || got2.kind !== "person") return `hidden fields sent: ${sent()}`;
// The broken description: every problem is named, and it still runs.
const b = $("#rule-form-demo-broken");
const list = [...b.querySelectorAll(".ui-rform-problems li")].map((l) => l.textContent);
const wanted = [
    "Field 9 has no name.", "Field 10 is not a map.", "Two fields are named f: the second is left out.",
    "g: there is no type \"colour\", so it is a text field.", "h has no options.",
    "f's show_if reads ghost, which is no field.", "g: rule 1's pattern is not one `re` takes.",
    "The show_if rules go round: a → b → c → a. These fields are always shown.",
];
for (const w of wanted) if (!list.includes(w)) return `not reported: ${w}\n${list.join("\n")}`;
const note = [...b.querySelectorAll(".ui-rform-problems li[data-level=note]")].map((l) => l.textContent);
if (note.join() !== "The required_if rules go round: d → e → d. That works, but check it is meant.") return `the note: ${note}`;
for (const n of ["a", "b", "c"]) if (!b.querySelector(`[name=${n}]`)) return `${n} is in a circle, and must be shown`;
if (b.querySelector("[name=f]")) return "f reads a field that is not there, so it stays hidden";
type(b.querySelector("[name=g]"), "anything"); await wait(30);
b.querySelector(".ui-rform-submit").click(); await wait(50);
if (b.querySelector("[data-field=g] .ui-rform-error")) return "a bad pattern must not stop a form";
// d and e: each required by the other, as it should work.
type(b.querySelector("[name=d]"), "x"); await wait(40);
if (!b.querySelector("[data-field=e] .ui-rform-req")) return "d filled requires e";
type(b.querySelector("[name=d]"), ""); await wait(40);
if (b.querySelector("[data-field=e] .ui-rform-req")) return "d empty does not";
