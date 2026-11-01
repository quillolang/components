const c = $("#size-advisor-demo-chest").closest(".ui-sizeadv");
const f = (m) => $(`#size-advisor-demo-${m}`);
const card = (n, r = c) => [...r.querySelectorAll(".ui-sizeadv-card")].find((x) => x.querySelector(".ui-sizeadv-garment").textContent === n);
const size = (n, r) => card(n, r).querySelector(".ui-sizeadv-size").textContent;
const say = (n, r) => card(n, r).querySelector(".ui-sizeadv-say").textContent;
const fit = (n, r) => [...card(n, r).querySelectorAll(".ui-sizeadv-fit li")].map((l) => l.textContent).join(", ");
const pick = (v, r = c) => r.querySelector(`input[value="${v}"]`).click();
if (!c.querySelector('input[value="cm"]').checked || !c.querySelector('input[value="regular"]').checked) return "the radios it starts on are not checked: another instance shares their name";
// 92.5 chest is in the gap S/M: S 1.5 tight, M 1.5 loose. 78 waist: S 2 tight, M 1 loose.
// S misses by 2, M by 1.5: M. The chest is not sure of either.
if (size("Shirt") !== "M" || say("Shirt") !== "Between S and M. For a regular fit, M.") return `start: ${size("Shirt")} ${say("Shirt")}`;
if (fit("Shirt") !== "Chest: 1.5 cm loose, Waist: 1.0 cm loose") return `fit: ${fit("Shirt")}`;
pick("snug"); await wait();
if (size("Shirt") !== "S" || say("Shirt") !== "Between S and M. For a snug fit, S." || fit("Shirt") !== "Chest: 1.5 cm tight, Waist: 2.0 cm tight") return `snug: ${say("Shirt")} ${fit("Shirt")}`;
pick("relaxed"); await wait();
if (size("Shirt") !== "M") return `relaxed: ${size("Shirt")}`;
pick("regular"); await wait();
// A tie on the regular fit goes up: chest and waist each 1.5 either way.
type(f("waist"), ""); await wait();
if (size("Shirt") !== "M" || say("Shirt") !== "Between S and M. For a regular fit, M. Based on chest: add waist to be surer.") return `a tie: ${say("Shirt")}`;
// Plainly inside a size.
type(f("chest"), "96"); type(f("waist"), "80"); await wait();
if (size("Shirt") !== "M" || say("Shirt") !== "M fits." || fit("Shirt") !== "Chest: fits, Waist: fits") return `inside: ${say("Shirt")}`;
// A chart in inches, against centimetres: 80 cm is 31.496 in, 0.496 past 31 and 0.504 short of 32: the nearer is 30.
if (size("Jeans") !== "30" || say("Jeans") !== "Between 30 and 32. For a regular fit, 30. Based on waist: add inside leg to be surer.") return `jeans: ${size("Jeans")} ${say("Jeans")}`;
if (fit("Jeans") !== "Waist: 1.3 cm tight") return `jeans fit: ${fit("Jeans")}`;
// Measurements that point different ways.
type(f("chest"), "104"); type(f("waist"), "77"); await wait();
// L by the chest, between S and M by the waist: S is 13 tight, M 5 tight, L 10 loose: M.
if (say("Shirt") !== "Between S and L. For a regular fit, M.") return `disagree: ${say("Shirt")}`;
// Off the chart.
type(f("chest"), "125"); type(f("waist"), "101"); await wait();
if (size("Shirt") !== "XL" || say("Shirt") !== "Above this chart: XL is the largest, and it will be tight." || fit("Shirt") !== "Chest: 10.0 cm tight, Waist: 1.0 cm tight") return `above: ${say("Shirt")} ${fit("Shirt")}`;
type(f("chest"), "70"); type(f("waist"), "60"); await wait();
if (size("Shirt") !== "S" || say("Shirt") !== "Below this chart: S is the smallest, and it will be loose.") return `below: ${say("Shirt")}`;
// Ranges that overlap: both fit, and the preference still decides.
type(f("head"), "57.5"); await wait();
if (say("Cap") !== "Both S/M and L/XL fit. For a regular fit, S/M.") return `overlap: ${say("Cap")}`;
pick("relaxed"); await wait();
if (size("Cap") !== "L/XL") return `overlap, relaxed: ${size("Cap")}`;
pick("regular"); await wait();
type(f("head"), ""); await wait();
if (size("Cap") !== "?" || say("Cap") !== "Add head to get a size.") return `none yet: ${say("Cap")}`;
// Bad input.
for (const [text, want] of [["abc", "Chest is not a number."], ["-3", "Chest is not a number."], ["0", "Chest must be more than 0."], ["9000", "Chest is too large to be a measurement."], ["1e3", "Chest is not a number."]]) {
    type(f("chest"), text); await wait(60);
    if ($("#size-advisor-demo-chest-error")?.textContent !== want || f("chest").getAttribute("aria-invalid") !== "true") return `bad ${text}: ${$("#size-advisor-demo-chest-error")?.textContent}`;
}
// Switching units keeps the exact measurement: there and back changes nothing.
type(f("chest"), "96"); type(f("waist"), "80"); await wait();
pick("in"); await wait();
if (f("chest").value !== "37.8" || f("waist").value !== "31.5") return `to inches: ${f("chest").value} ${f("waist").value}`;
if (size("Shirt") !== "M" || say("Shirt") !== "M fits.") return `in inches: ${say("Shirt")}`;
if (fit("Jeans") !== "Waist: 0.5 in tight") return `length in inches: ${fit("Jeans")}`;
pick("cm"); await wait();
if (f("chest").value !== "96.0" || f("waist").value !== "80.0" || say("Shirt") !== "M fits.") return `back: ${f("chest").value}`;
// A figure that is plainly in the other unit.
type(f("chest"), "38"); type(f("waist"), "32"); await wait();
const hint = c.querySelector(".ui-sizeadv-hint");
if (hint?.querySelector("span").textContent !== "Chest, Waist look like inches.") return `hint: ${hint?.textContent}`;
hint.querySelector("button").click(); await wait();
// 38 in is 96.52 cm, 32 in is 81.28 cm: M.
if (!c.querySelector('input[value="in"]').checked || f("chest").value !== "38" || say("Shirt") !== "M fits." || c.querySelector(".ui-sizeadv-hint")) return `read as inches: ${say("Shirt")}`;
if (f("chest").name !== "chest" || f("inside_leg").labels[0].textContent !== "Inside leg") return "fields";
// Inches first, snug, a chart with mistakes, and on_change.
const l = $("#size-advisor-demo-live-chest").closest(".ui-sizeadv");
// 36.5 in is 92.71 cm, in the gap: snug is S.
if (size("Tee", l) !== "S" || fit("Tee", l) !== "Chest: 0.7 in tight") return `live: ${size("Tee", l)} ${fit("Tee", l)}`;
const said = [...l.querySelectorAll(".ui-sizeadv-problems li")].map((x) => x.textContent);
for (const w of ["Tee bad: the chest figures cannot be read, so they are left out.", "A size of Tee has no name, so it is left out.", "A chart without an id or sizes is left out."])
    if (!said.includes(w)) return `not said: ${w} in ${said.join(" / ")}`;
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
l.querySelector('input[value="relaxed"]').click(); await wait();
if (seen() !== "on_change: in, relaxed, tee M.") return `on_change: ${seen()}`;
if ($("#size-advisor-demo-live-chest").name !== "me_chest") return "name does not prefix the fields";
const e = $("#size-advisor-demo-empty-title").closest(".ui-sizeadv");
if (e.querySelector("[role=alert]")?.textContent !== "No size chart to go by.") return "no charts";
f("chest").focus();
if (document.activeElement !== f("chest")) return "a field cannot take the focus";
