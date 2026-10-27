const radios = $$("input[name=rating-demo-stars]");
if (radios.length !== 5 || radios.some((r) => r.type !== "radio")) return `expected 5 radios, got ${radios.length}`;
if (radios.map((r) => r.value).join() !== "1,2,3,4,5") return `values: ${radios.map((r) => r.value)}`;
if (!radios[0].required) return "required is not passed to the radios";
if (radios[2].getAttribute("aria-label") !== "3 stars") return `the third is named "${radios[2].getAttribute("aria-label")}"`;
const fs = radios[0].closest("fieldset");
if (!fs.querySelector("legend").textContent.includes("Your rating")) return "the group has no legend";
if (!document.getElementById(fs.getAttribute("aria-describedby"))?.textContent.includes("arrow keys")) return "the hint does not describe the group";
// Clicking the fourth star's label checks it, and lights four stars.
radios[3].labels[0].click(); await wait();
if (!radios[3].checked) return "clicking the 4th star did not choose 4";
const lit = $$("input[name=rating-demo-stars] + label").map((l) => getComputedStyle(l).color);
const on = lit[0], off = lit[4];
if (on === off || lit[3] !== on || lit[1] !== on) return `stars are not lit up to the choice: ${lit}`;
const form = new FormData(); radios.forEach((r) => r.checked && form.append(r.name, r.value));
if (form.get("rating-demo-stars") !== "4") return "the form would not send 4";
// Half stars: ten radios 0.5 .. 5, starting at 3.5.
const halves = $$("input[name=rating-demo-half]");
if (halves.length !== 10 || halves[0].value !== "0.5" || halves[9].value !== "5") return `half stars: ${halves.map((r) => r.value)}`;
if (!halves[6].checked || halves[6].value !== "3.5") return "value 3.5 is not checked";
if (halves[6].getAttribute("aria-label") !== "3.5 stars") return `3.5 is named ${halves[6].getAttribute("aria-label")}`;
// The live one: labels name the stars, on_change gets the number.
const live = $$("input[name=rating-demo-live]");
if (live[4].getAttribute("aria-label") !== "Great, 5 stars") return `labels are not used: ${live[4].getAttribute("aria-label")}`;
live[1].labels[0].click(); await wait();
const note = live[0].closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "You gave 2 of 5.") return `on_change did not update the note: ${note}`;
// Read-only: a picture with a label, 4.3 filling 30% of the fifth star.
const shown = $(".ui-rating-shown[role=img]");
if (shown.getAttribute("aria-label") !== "4.3 out of 5 stars, 128 ratings") return `read-only label: ${shown.getAttribute("aria-label")}`;
const fills = [...shown.querySelectorAll(".ui-rating-fill")].map((f) => f.style.width);
if (fills.join() !== "100%,100%,100%,100%,30%") return `fills: ${fills}`;
if (shown.closest(".ui-rating-show").querySelector("input")) return "read-only has inputs";
if (!$("#rating-rating-demo-locked").disabled) return "disabled does not disable the group";
