const box = $("#iban-demo");
const wrap = box.closest(".ui-ibaninput");
const hid = (w = wrap) => w.querySelector("input[type=hidden]").value;
const said = (w = wrap) => [...w.querySelectorAll(".ui-ibaninput-out p")].map((p) => p.textContent).join(" / ");
const fix = (w = wrap) => w.querySelector(".ui-ibaninput-fix");
if (box.value !== "DE89 3704 0044 0532 0130 00" || hid() !== "DE89370400440532013000" || said() !== "Valid IBAN for Germany.") return `start: ${box.value} ${hid()} ${said()}`;
if (box.name || wrap.querySelector("input[type=hidden]").name !== "iban") return "the form gets it without spaces";
const valid = { DE89370400440532013000: "Germany", GB82WEST12345698765432: "United Kingdom", FR1420041010050500013M02606: "France", NL91ABNA0417164300: "Netherlands", BE68539007547034: "Belgium",
    NO9386011117947: "Norway", MT84MALT011000012345MTLCAST001S: "Malta", IT60X0542811101000000123456: "Italy", ES9121000418450200051332: "Spain", LC55HEMM000100010012001200023015: "Saint Lucia",
    SE4550000000058398257466: "Sweden", PL61109010140000071219812874: "Poland", CH9300762011623852957: "Switzerland", AT611904300234573201: "Austria", PT50000201231234567890154: "Portugal", IE29AIBK93115212345678: "Ireland" };
for (const [iban, country] of Object.entries(valid)) {
    type(box, iban); await wait(15);
    if (hid() !== iban || said() !== `Valid IBAN for ${country}.`) return `${iban}: ${hid()} ${said()}`;
    if (box.value.replaceAll(" ", "") !== iban || !box.value.split(" ").slice(0, -1).every((g) => g.length === 4)) return `grouped in fours: ${box.value}`;
}
for (const pasted of ["  de89-3704-0044-0532-0130-00 ", "IBAN: DE89 3704 0044 0532 0130 00", "iban DE89.3704.0044.0532.0130.00", "DE89 3704 0044 0532 0130 00"]) {
    type(box, pasted); await wait(20);
    if (hid() !== "DE89370400440532013000" || box.value !== "DE89 3704 0044 0532 0130 00") return `pasted "${pasted}": ${box.value}`;
}
for (const [text, says] of [["DE89", "Germany: 22 characters, 4 so far."], ["FR14 2004", "France: 27 characters, 8 so far."], ["NO93", "Norway: 15 characters, 4 so far."], ["D", "An IBAN starts with two letters, its country."]]) {
    type(box, text); await wait(20);
    if (said() !== says || hid() !== "" || box.getAttribute("aria-invalid")) return `"${text}": ${said()}`;
}
const fails = [
    ["1234", "An IBAN starts with two letters, its country (character 1).", null], ["D1", "An IBAN starts with two letters, its country (character 2).", null], ["XX89370400440532013000", "XX is not a country with IBANs.", null],
    ["DE8!", `"!" cannot be in an IBAN (character 4).`, null], ["DE😀", `"😀" cannot be in an IBAN (character 3).`, null], ["DEAB", "Characters 3 and 4 are check digits, not letters (character 3).", null], ["DE8A", "Characters 3 and 4 are check digits, not letters (character 4).", null],
    ["DE893704004405320130001234", "Germany has 22 characters: this has 4 too many.", null],
    ["DE89370400440532013001", "The check digits do not fit. If the rest is right they would be 62, not 89: look for a wrong character.", null],
    ["DE00370400440532013000", "The check digits do not fit. If the rest is right they would be 89, not 00: look for a wrong character.", null],
];
for (const [text, says] of fails) {
    type(box, text); await wait(20);
    if (said() !== says) return `"${text}": ${said()}`;
    if (hid() !== "" || box.getAttribute("aria-invalid") !== "true") return `"${text}" is sent or not marked`;
}
for (const [text, says] of [
    ["DE89370400445032013000", "Characters 13 and 14 may be the wrong way round."], ["DE89370400440523013000", "Characters 15 and 16 may be the wrong way round."], ["DE98370400440532013000", "Characters 3 and 4 may be the wrong way round."],
    ["DE89370400440532O13000", "Character 17 may be a 0, not an O."], ["DE893704004405320I3000", "Character 18 may be a 1, not an I."], ["DE893704004405320313000", "Character 18 may be extra."],
]) {
    type(box, text); await wait(20);
    if (!said().endsWith(says)) return `"${text}": ${said()}`;
    if (fix()?.textContent !== "Use DE89 3704 0044 0532 0130 00") return `the fix for "${text}": ${fix()?.textContent}`;
}
fix().click(); await wait(40);
if (hid() !== "DE89370400440532013000" || box.value !== "DE89 3704 0044 0532 0130 00" || said() !== "Valid IBAN for Germany." || document.activeElement !== box) return `the fix: ${hid()}`;
// One short is only a question until the field is left.
type(box, "DE8937040044053201300"); await wait(30);
if (said() !== "Germany: 22 characters, 21 so far." || fix()) return `one short, typing: ${said()}`;
box.dispatchEvent(new FocusEvent("blur")); await wait(40);
if (!said().endsWith("A digit may be missing near character 20.") || !fix()) return `one short, left: ${said()}`;
fix().click(); await wait(40);
if (hid() !== "DE89370400440532013000") return `the missing digit: ${hid()}`;
// Typing in the middle keeps the cursor with the character.
box.focus(); box.value = "DE89 3X704 0044"; box.setSelectionRange(7, 7); box.dispatchEvent(new InputEvent("input", { bubbles: true })); await wait(30);
if (box.value !== "DE89 3X70 4004 4" || box.selectionStart !== 6 + 1) return `the cursor after an insert: "${box.value}" ${box.selectionStart}`;
box.value = "DE89"; box.setSelectionRange(4, 4); box.dispatchEvent(new InputEvent("input", { bubbles: true })); await wait(30);
if (box.value !== "DE89" || box.selectionStart !== 4) return "the cursor at a group's end";
type(box, "x".repeat(5000)); await wait(30);
if (hid() !== "" || box.value.replaceAll(" ", "").length !== 64) return `a huge paste is cut: ${box.value.length}`;
type(box, "   "); await wait(30);
if (box.value !== "" || said() !== "" || box.getAttribute("aria-invalid")) return "blank";
const live = $("#iban-demo-live"), lw = live.closest(".ui-ibaninput"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
type(live, "GB82WEST12345698765432"); await wait(30);
if (said(lw) !== "Accounts in United Kingdom are not taken here." || hid(lw) !== "" || note() !== "on_change: not valid GB GB82WEST12345698765432") return `countries: ${said(lw)} ${note()}`;
type(live, "NL91ABNA0417164300"); await wait(30);
if (note() !== "on_change: valid NL NL91ABNA0417164300" || hid(lw) !== "NL91ABNA0417164300") return `on_change: ${note()}`;
if (box.labels[0]?.textContent.includes("Account (IBAN)") !== true) return "the label";
