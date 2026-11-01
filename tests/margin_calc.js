const c = $("#margin-calc-demo-cost").closest(".ui-margincalc");
const f = (n) => $(`#margin-calc-demo-${n}`);
const dd = (cls) => c.querySelector(`.ui-margincalc-${cls} dd`)?.textContent;
const tag = (n) => f(n).closest(".ui-margincalc-field").querySelector(".ui-margincalc-tag").textContent;
const alert = () => c.querySelector("[role=alert]")?.textContent;
const note = () => c.querySelector(".ui-margincalc-note")?.textContent;
const warn = () => c.querySelector(".ui-margincalc-warn")?.textContent;
const say = () => c.querySelector(".ui-margincalc-say").textContent;
// Worked by hand: 19.99 - 12.40 = 7.59; 7.59 / 19.99 = 37.9689...%; 7.59 / 12.40 = 61.2096...%.
if (f("margin").value !== "37.97" || f("markup").value !== "61.21" || dd("profit") !== "$7.59") return `start: ${f("margin").value} ${f("markup").value} ${dd("profit")}`;
if (tag("cost") !== "set" || tag("price") !== "set" || tag("margin") !== "worked out") return "the two set are not marked";
if (f("cost").name !== "cost" || !f("cost").labels[0]?.textContent.startsWith("Cost")) return "field name or label";
// 12.40 / 0.55 = 22.5454...: rounded up, so the 45% is reached.
if (say() !== "Price for 45%: $22.55.") return `target: ${say()}`;
type(f("margin"), "40"); await wait();
// Margin edited with the price set before it: the price stays, the cost moves. 19.99 x 0.6 = 11.994.
if (f("price").value !== "19.99" || f("cost").value !== "11.99" || f("markup").value !== "66.72") return `margin 40: ${f("cost").value} ${f("markup").value}`;
if (tag("margin") !== "set" || tag("price") !== "set" || tag("cost") !== "worked out") return `after margin: ${tag("margin")} ${tag("price")} ${tag("cost")}`;
if (note() !== "Rounded to the cent, this price gives a margin of 40.02%.") return `drift: ${note()}`;
type(f("markup"), "50"); await wait();
// Margin and markup cannot be the two: the amount stays. 19.99 / 1.5 = 13.3266...
if (tag("markup") !== "set" || tag("price") !== "set" || tag("margin") !== "worked out") return `after markup: ${tag("markup")} ${tag("price")} ${tag("margin")}`;
if (f("cost").value !== "13.33" || f("margin").value !== "33.32") return `markup 50: ${f("cost").value} ${f("margin").value}`;
type(f("cost"), "30"); await wait();
if (f("price").value !== "45.00" || f("margin").value !== "33.33" || dd("profit") !== "$15.00") return `cost 30 at 50%: ${f("price").value} ${f("margin").value}`;
type(f("price"), "25"); await wait();
if (f("margin").value !== "-20.00" || f("markup").value !== "-16.67") return `under cost: ${f("margin").value} ${f("markup").value}`;
if (warn() !== "Under cost: each sale loses $5.00.") return `no warning under cost: ${warn()}`;
type(f("price"), "30"); await wait();
if (warn() !== "At cost: each sale makes nothing.") return `at cost: ${warn()}`;
type(f("price"), "1,234.50"); await wait();
if (f("margin").value !== "97.57" || warn()) return `grouped thousands: ${f("margin").value}`;
for (const bad of ["abc", "12,50", "1e3", "١٢", "99999999999999"]) {
    type(f("cost"), bad); await wait(60);
    if (!alert() || f("cost").getAttribute("aria-invalid") !== "true" || c.querySelector(".ui-margincalc-out")) return `bad text ${bad}: ${alert()}`;
    if (f("margin").value !== "") return `a worked-out field should empty on ${bad}`;
}
type(f("cost"), "  "); await wait();
if (alert() || note() !== "Set any two of the four, one of them an amount.") return `blank: ${alert()} / ${note()}`;
type(f("cost"), "-5"); await wait();
if (alert() !== "A cost cannot be below 0.") return `negative cost: ${alert()}`;
type(f("cost"), "0"); await wait();
if (dd("markup") !== "No cost" || f("markup").value !== "" || f("margin").value !== "100.00") return `cost 0: ${dd("markup")}`;
type(f("cost"), "10"); await wait();
type(f("margin"), "100"); await wait();
if (alert() !== "A margin of 100% or more cannot be reached with a cost above 0.") return `margin 100 on a cost: ${alert()}`;
// The target's price, and the button that uses it. Exactly half a cent up stays up.
type(f("margin"), "20"); await wait();
type(f("target"), "100"); await wait();
if (say() !== "A target of 100% or more cannot be reached with a cost above 0." || !c.querySelector(".ui-margincalc-use").disabled) return `target 100: ${say()}`;
type(f("target"), "x"); await wait();
if (say() !== "Target margin is not a number." || f("target").getAttribute("aria-invalid") !== "true") return `target x: ${say()}`;
type(f("target"), "60"); await wait();
if (say() !== "Price for 60%: $25.00.") return `target 60: ${say()}`;
c.querySelector(".ui-margincalc-use").click(); await wait();
if (f("price").value !== "25.00" || f("margin").value !== "60.00" || f("markup").value !== "150.00" || tag("price") !== "set" || tag("cost") !== "set") return `use this price: ${f("price").value} ${f("margin").value}`;
const l = $("#margin-calc-demo-live-cost").closest(".ui-margincalc");
const lf = (n) => $(`#margin-calc-demo-live-${n}`);
// 80 / 0.75 = 106.666...; 26.67 / 80 = 33.3375%.
if (lf("price").value !== "106.67" || lf("markup").value !== "33.34") return `euros: ${lf("price").value} ${lf("markup").value}`;
if (lf("cost").name !== "trade_cost") return "name does not prefix the fields";
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
type(lf("margin"), "50"); await wait();
if (seen() !== "on_change: price 160.00, profit 80.00.") return `on_change: ${seen()}`;
if (l.querySelector(".ui-margincalc-profit dd").textContent.replace(/\s/g, "") !== "€80.00") return `euro profit: ${l.querySelector(".ui-margincalc-profit dd").textContent}`;
const focusable = f("margin"); focusable.focus();
if (document.activeElement !== focusable) return "a field cannot take the focus";
