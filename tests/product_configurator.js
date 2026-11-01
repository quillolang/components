const c = $("#product-configurator-demo-i5").closest(".ui-prodconf");
const box = (i) => $(`#product-configurator-demo-${i}`);
const row = (i) => box(i).closest(".ui-prodconf-option");
const why = (i) => row(i).querySelector(".ui-prodconf-why")?.textContent;
const cost = (i) => row(i).querySelector(".ui-prodconf-cost").textContent;
const total = (r = c) => r.querySelector(".ui-prodconf-total span:last-child").textContent;
const notes = (r = c) => [...r.querySelectorAll(".ui-prodconf-notes li")].map((l) => l.textContent);
const missing = (r = c) => [...r.querySelectorAll(".ui-prodconf-missing li")].map((l) => l.textContent);
const valid = (r = c) => !!r.querySelector(".ui-prodconf-valid");
const lines = () => [...c.querySelectorAll(".ui-prodconf-lines li")].map((l) => l.textContent);
// Selected in an order that needs sorting out: rtx needs i7, which comes after it.
// 999 + 300 + 100 + 250.50 = 1649.50
if (!box("i7").checked || !box("m16").checked || !box("rtx").checked || total() !== "$1,649.50") return `start: ${total()}`;
if (notes().length) return `nothing should be dropped at the start: ${notes()}`;
if (box("i5").name !== "cpu" || box("rtx").type !== "radio" || box("care").type !== "checkbox") return "fields";
// Clashes and needs, with the reason.
if (!box("slim").disabled || why("slim") !== "Not with Discrete graphics") return `slim: ${why("slim")}`;
if (box("slim").getAttribute("aria-describedby") !== "product-configurator-demo-slim-why") return "the reason is not tied to its field";
if (box("i5").disabled || box("dock").disabled) return "i5 replaces i7, and the dock's need is met: neither is blocked";
// What each would add against what it replaces.
if (cost("i9") !== "+$300.00" || cost("i5") !== "−$300.00" || cost("m32") !== "+$199.99" || cost("i7") !== "$300.00" || cost("uk") !== "Included") return `costs: ${cost("i9")} ${cost("i5")} ${cost("m32")} ${cost("i7")} ${cost("uk")}`;
// Missing, then valid.
if (valid() || missing().join("|") !== "Choose Keyboard.") return `missing: ${missing()}`;
box("uk").click(); await wait();
if (!valid() || missing().length) return `valid after keyboard: ${missing()}`;
// A chain: the dock needs graphics, which need i7 or i9.
box("dock").click(); await wait();
if (total() !== "$1,799.50") return `dock: ${total()}`;
box("i5").click(); await wait();
if (notes().join("|") !== "Dropped Discrete graphics: it needs Core i7 or Core i9, and you chose Core i5.|Dropped Graphics dock: it needs Discrete graphics, and you chose Core i5.") return `chain: ${notes()}`;
// 999 + 100 = 1099
if (box("rtx").checked || box("dock").checked || total() !== "$1,099.00" || box("slim").disabled) return `after the drop: ${total()} ${box("slim").disabled}`;
if (!box("rtx").disabled || why("rtx") !== "Needs Core i7 or Core i9") return `rtx now: ${why("rtx")}`;
// Back again.
c.querySelector(".ui-prodconf-undo").click(); await wait();
if (!box("rtx").checked || !box("dock").checked || !box("i7").checked || total() !== "$1,799.50" || notes().length) return `put back: ${total()} ${notes()}`;
// None on a group that is not required takes what needs it.
row("rtx").parentElement.querySelector("input[value='']").click(); await wait();
if (notes().join("|") !== "Dropped Graphics dock: it needs Discrete graphics, and you chose no Graphics." || box("rtx").checked) return `none: ${notes()}`;
// The most a group takes: 16 GB lets the modem on; a third extra is refused.
box("care").click(); await wait();
box("lte").click(); await wait();
if (!box("slim").disabled || why("slim") !== "At most 2 in Extras" || !box("dock").disabled) return `limit: ${why("slim")}`;
// 999 + 300 + 100 + 89.90 + 110 = 1598.90
if (total() !== "$1,598.90") return `extras: ${total()}`;
if (lines().join("|") !== "Base price$999.00|Core i7$300.00|16 GB$100.00|UKIncluded|Care pack$89.90|4G modem$110.00") return `lines: ${lines()}`;
box("m8").click(); await wait();
if (notes().join("|") !== "Dropped 4G modem: it needs 16 GB or 32 GB, and you chose 8 GB.") return `modem: ${notes()}`;
box("care").click(); await wait();
if (notes().length || c.querySelector(".ui-prodconf-undo")) return "a change that drops nothing clears the notes";
if (total() !== "$1,299.00") return `after taking off: ${total()}`;
// Keyboard: arrow keys stay native, a space ticks a focused box.
box("care").focus();
if (document.activeElement !== box("care")) return "an option cannot take focus";
// The demo with a callback: an unknown id is said, least is counted, excludes work both ways.
const l = $("#product-configurator-demo-live-small").closest(".ui-prodconf");
const lb = (i) => $(`#product-configurator-demo-live-${i}`);
if (notes(l).join("|") !== "\"ghost\" is not an option." || missing(l).join("|") !== "Choose 1 more from Legs." || total(l).replace(/\s/g, "") !== "€349.00") return `live: ${notes(l)} ${missing(l)} ${total(l)}`;
lb("oak").click(); await wait();
if (!lb("steel").disabled || lb("steel").closest("label").querySelector(".ui-prodconf-why").textContent !== "Not with Oak") return "an exclusion written one way should work the other";
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (seen() !== "on_change: small, oak, 409.50, valid.") return `on_change: ${seen()}`;
if (lb("oak").name !== "desk_legs") return "name does not prefix the fields";
// Mistakes in the data: told, and no throw.
const b = $("#product-configurator-demo-bad-matt").closest(".ui-prodconf");
const said = [...b.querySelectorAll(".ui-prodconf-problems li")].map((x) => x.textContent);
for (const want of ["The currency \"XXZ\" is not known, so USD is used.", "The base price is not an amount, so it counts as 0.", "Plain has a price that is not an amount, so it cannot be chosen.",
    "The id \"plain\" is used twice: the second is left out.", "A group without an id or a list of options is left out.", "Plain names \"nothing\", which is not an option.", "Wax names \"nothing\", which is not an option.",
    "Matt, Gloss, Wax, Teak cannot be chosen: what they need can never be met."])
    if (!said.includes(want)) return `not said: ${want} in ${said.join(" / ")}`;
if (!$("#product-configurator-demo-bad-matt").disabled || !$("#product-configurator-demo-bad-plain").disabled) return "an option that can never be chosen must be off";
if (missing(b).join("|") !== "Trim: nothing can be chosen as things stand (cannot be chosen: what it needs can never be met).") return `dead group: ${missing(b)}`;
