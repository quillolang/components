const c = $("#plan-advisor-demo-seats").closest(".ui-planadv");
const f = (m) => $(`#plan-advisor-demo-${m}`);
const verdict = (r = c) => r.querySelector(".ui-planadv-verdict")?.textContent;
const turns = (r = c) => [...r.querySelectorAll(".ui-planadv-turns li")].map((l) => l.textContent);
const plans = (r = c) => [...r.querySelectorAll(".ui-planadv-plan")].map((p) => [...p.children].map((x) => x.textContent).join(" | "));
const alert = (r = c) => r.querySelector("[role=alert]")?.textContent;
if (!c.querySelector('input[value="monthly"]').checked) return "the billing radio it starts on is not checked: another instance shares its name";
// Team: 29 + 3 seats x 8 + 7 packs x 2 = 67 a month, 804 a year. Business: 99 a month. Free: 1 seat at most.
if (verdict() !== "Team is cheapest: $804.00 a year, about $67.00 a month.") return `start: ${verdict()}`;
if (plans().join(" / ") !== "Team | $804.00 a year | $29.00 a month + $24.00 a month for 3 seats over + $14.00 a month for 70 GB over / Business | $1,188.00 a year | $99.00 a month / Free | Cannot hold this: 1 seat at most.") return `plans: ${plans().join(" / ")}`;
// Seats: 43 + 8(s - 5) meets 99 at 12, where the tie goes to the later plan. Storage: 53 + 2 x packs meets 99 at 23 packs, 280 GB.
if (turns().join(" / ") !== "Seats: from 12 seats, Business. / Storage: from 280 GB, Business.") return `turns: ${turns().join(" / ")}`;
if ([...c.querySelectorAll("[aria-live] .ui-planadv-how")][0].textContent !== "Paying yearly would save $69.60 a year.") return `yearly: ${c.querySelector(".ui-planadv-how").textContent}`;
// Annual: 278.40 + 38 x 12 = 734.40; Business 950.40.
c.querySelector('input[value="annual"]').click(); await wait();
if (verdict() !== "Team is cheapest: $734.40 a year, about $61.20 a month.") return `annual: ${verdict()}`;
// 278.40 + 12 x (14 + 8(s - 5)) passes 950.40 at 11 seats (5.25 extra).
if (turns()[0] !== "Seats: from 11 seats, Business.") return `annual turn: ${turns()[0]}`;
c.querySelector('input[value="monthly"]').click(); await wait();
// The tie itself: 12 seats, 67 + 32 = 99.
type(f("seats"), "12"); await wait();
if (verdict() !== "Business is cheapest: $1,188.00 a year, about $99.00 a month.") return `tie: ${verdict()}`;
if (turns()[0] !== "Seats: at 11 seats or less, Team.") return `tie turns: ${turns()[0]}`;
// One seat and little storage: Free fits, and it goes at 2 seats or 10 GB.
type(f("seats"), "1"); type(f("gb"), "0"); await wait();
if (verdict() !== "Free is cheapest: $0.00 a year, about $0.00 a month.") return `free: ${verdict()}`;
if (turns().join(" / ") !== "Seats: from 2 seats, Team. / Storage: from 10 GB, Team.") return `free turns: ${turns().join(" / ")}`;
if (c.querySelector('input[type=range]').value !== "1") return "the slider follows the field";
// The slider, by keyboard's value, moves the same state.
const slider = f("seats").closest(".ui-planadv-meter").querySelector("input[type=range]");
slider.value = "30"; slider.dispatchEvent(new Event("input", { bubbles: true })); await wait();
if (f("seats").value !== "30") return `slider to field: ${f("seats").value}`;
// 30 seats, 0 GB: Team 29 + 200 = 229; Business 99 + 10 x 7.50 = 174: from the top down it changes at 19 and below.
if (verdict() !== "Business is cheapest: $2,088.00 a year, about $174.00 a month.") return `slider: ${verdict()}`;
for (const bad of ["abc", "-1", "1e3", ""]) {
    type(f("seats"), bad); await wait(60);
    if (alert() !== "Seats is not a number of 0 or more." || f("seats").getAttribute("aria-invalid") !== "true" || verdict()) return `bad ${bad}: ${alert()}`;
}
// Past the slider's end, a figure still costs out: 99 + 40 x 7.50 = 399.
type(f("seats"), "60"); await wait();
if (verdict() !== "Business is cheapest: $4,788.00 a year, about $399.00 a month.") return `past the end: ${verdict()}`;
if (f("seats").name !== "seats" || !f("seats").labels[0]) return "fields";
// A million steps: the turn is found exact. 10 + 0.50 x packs meets 100 at 180 packs: 179,001 calls past the 1,000 held.
const l = $("#plan-advisor-demo-live-calls").closest(".ui-planadv");
if (turns(l).join("") !== "Calls a month: from 180,001 calls, Flat.") return `live turn: ${turns(l).join("")}`;
if (verdict(l).replace(/\s/g, " ") !== "Pay as you go is cheapest: €1,014.00 a year, about €84.50 a month.") return `live: ${verdict(l)}`;
if (!l.querySelector(".ui-planadv-problems").textContent.includes("Odd has no price it can read")) return "a bad plan is not said";
const t0 = performance.now();
type($("#plan-advisor-demo-live-calls"), "200000"); await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
if (performance.now() - t0 > 200) return `a change took ${Math.round(performance.now() - t0)} ms`;
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
if (seen() !== "on_change: Flat, 1200.00 a year, monthly.") return `on_change: ${seen()}`;
if (turns(l).join("") !== "Calls a month: at 180,000 calls or less, Pay as you go.") return `live turn down: ${turns(l).join("")}`;
if ($("#plan-advisor-demo-live-calls").name !== "api_calls") return "name does not prefix the fields";
const n = $("#plan-advisor-demo-limit-seats").closest(".ui-planadv");
if (alert(n) !== "No plan can hold this much." || plans(n).join("") !== "Small | Cannot hold this: 10 seats at most.") return `limit: ${alert(n)} ${plans(n)}`;
const e = $("#plan-advisor-demo-empty-title").closest(".ui-planadv");
if (e.querySelectorAll("[role=alert]").length !== 2 || !e.querySelector(".ui-planadv-problems").textContent.includes("A meter needs an id")) return "empty";
f("seats").closest(".ui-planadv-meter").querySelector("input[type=range]").focus();
if (document.activeElement.type !== "range") return "a slider cannot take the focus";
