const f = $("#unit-converter-demo-from"), t = $("#unit-converter-demo-to");
const box = f.closest(".ui-unit-conv");
const ans = (c) => c.querySelector(".ui-unit-conv-answer")?.textContent;
const form = (c) => c.querySelector(".ui-unit-conv-formula")?.textContent;
const pick = async (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); await wait(100); };
const us = $("#unit-converter-demo-from-unit"), them = $("#unit-converter-demo-to-unit"), kind = $("#unit-converter-demo-kind");
// A mile is 1.609344 km, so 26.2 mi is 42.1648128 km, exactly.
if (t.value !== "42.1648128" || ans(box) !== "26.2 mi = 42.1648128 km") return `start: ${t.value} / ${ans(box)}`;
if (form(box) !== "km = mi × 1.609344") return `formula: ${form(box)}`;
if (f.name !== "from_value" || t.name !== "to_value" || us.name !== "from_unit" || kind.name !== "category" || !f.labels[0]) return "field names or labels";
// The other way, typing in the second field: 1.609344 km is exactly 1 mi, and the first field follows.
type(t, "1.609344"); await wait(100);
if (f.value !== "1" || t.value !== "1.609344") return `typing in To: ${f.value}`;
if (form(box) !== "mi = km ÷ 1.609344") return `the reverse formula: ${form(box)}`;
type(t, "1"); await wait(100);
if (f.value !== "0.621371192237" || !ans(box).startsWith("1 km ≈ 0.621371192237 mi")) return `1 km in miles: ${f.value} / ${ans(box)}`;
type(f, "12,000"); await wait(100);
if (t.value !== "19312.128") return `a comma in a number: ${t.value}`;
// Bad input.
type(f, "abc"); await wait(100);
if (box.querySelector(".ui-unit-conv-error")?.textContent !== '"abc" is not a number' || t.value !== "" || f.getAttribute("aria-invalid") !== "true") return `bad text: ${box.querySelector(".ui-unit-conv-error")?.textContent}`;
type(f, "   "); await wait(100);
if (box.querySelector(".ui-unit-conv-error") || t.value !== "" || ans(box)) return "blank is no answer and no error";
type(f, "9".repeat(60)); await wait(100);
if (!box.querySelector(".ui-unit-conv-error")) return "a 60-digit number is not refused";
type(f, "2000000000000"); await wait(100);
if (!box.querySelector(".ui-unit-conv-error")?.textContent.includes("too large")) return "past the limit";
type(f, "1e3"); await wait(100);
if (t.value !== "1609.344") return `an exponent: ${t.value}`;
// Swap keeps the number and turns the units round.
box.querySelector(".ui-unit-conv-swap").click(); await wait(100);
if (us.value !== "km" || them.value !== "mi" || f.value !== "1e3" || t.value !== "621.371192237") return `swap: ${us.value} ${them.value} ${f.value} ${t.value}`;
// Speed has factors no decimal holds: 3.6 km/h must be 1 m/s on the nose.
await pick(kind, "speed");
if (us.value !== "ms" || them.value !== "kmh") return `speed's units: ${us.value} ${them.value}`;
type(f, "1"); await wait(100);
if (t.value !== "3.6" || !ans(box).includes("=")) return `1 m/s: ${t.value}`;
type(t, "36"); await wait(100);
if (f.value !== "10") return `36 km/h: ${f.value}`;
await pick(them, "kn"); await pick(us, "kmh");
type(f, "1.852"); await wait(100);
if (t.value !== "1") return `1.852 km/h is a knot: ${t.value}`;
if (form(box) !== "kn = km/h ÷ 1.852") return `speed's formula: ${form(box)}`;
// Volume, area, mass, data and time: each by a figure worked out by hand.
await pick(kind, "volume"); await pick(us, "gal"); await pick(them, "l"); type(f, "1"); await wait(100);
if (t.value !== "3.785411784") return `a gallon: ${t.value}`;
await pick(us, "cup"); await pick(them, "tbsp"); await wait(100);
if (t.value !== "16") return `a cup in tablespoons: ${t.value}`;
await pick(kind, "area"); await pick(us, "acre"); await pick(them, "ft2"); await wait(100);
if (t.value !== "43560") return `an acre: ${t.value}`;
await pick(us, "ha"); await pick(them, "m2"); await wait(100);
if (t.value !== "10000") return `a hectare: ${t.value}`;
await pick(kind, "mass"); await pick(us, "st"); await pick(them, "lb"); await wait(100);
if (t.value !== "14") return `a stone: ${t.value}`;
await pick(kind, "time"); await pick(us, "wk"); await pick(them, "h"); await wait(100);
if (t.value !== "168") return `a week: ${t.value}`;
await pick(us, "s"); await pick(them, "h"); await wait(100);
if (t.value !== "0.000277777777778" || !ans(box).includes("≈")) return `a second in hours: ${t.value}`;
// Temperature, with its offset.
const h = $("#unit-converter-demo-heat-from").closest(".ui-unit-conv");
const hf = $("#unit-converter-demo-heat-from"), ht = $("#unit-converter-demo-heat-to");
const hto = $("#unit-converter-demo-heat-to-unit"), hfrom = $("#unit-converter-demo-heat-from-unit");
if (ht.value !== "212" || form(h) !== "°F = °C × 9/5 + 32") return `100 °C: ${ht.value} / ${form(h)}`;
type(hf, "-40"); await wait(100);
if (ht.value !== "-40") return `-40: ${ht.value}`;
type(hf, "37"); await wait(100);
if (ht.value !== "98.6") return `37 °C: ${ht.value}`;
type(ht, "32"); await wait(100);
if (hf.value !== "0") return `32 °F: ${hf.value}`;
type(ht, "212"); await wait(100);
if (hf.value !== "100") return `212 °F: ${hf.value}`;
await pick(hto, "k"); type(hf, "0"); await wait(100);
if (ht.value !== "273.15") return `0 °C in K: ${ht.value}`;
await pick(hfrom, "f"); type(hf, "32"); await wait(100);
if (ht.value !== "273.15" || form(h) !== "K = (°F + 459.67) × 5/9") return `32 °F in K, exactly: ${ht.value} / ${form(h)}`;
await pick(hfrom, "c"); await pick(hto, "r"); type(hf, "0"); await wait(100);
if (ht.value !== "491.67") return `0 °C in °R: ${ht.value}`;
// Below absolute zero is refused; a difference has no offset and no floor.
await pick(hto, "f"); type(hf, "-300"); await wait(100);
if (!h.querySelector(".ui-unit-conv-error")?.textContent.includes("below absolute zero") || ht.value !== "") return `below zero: ${h.querySelector(".ui-unit-conv-error")?.textContent}`;
h.querySelector(".ui-unit-conv-check input").click(); await wait(100);
if (h.querySelector(".ui-unit-conv-error") || ht.value !== "-540" || form(h) !== "°F = °C × 1.8") return `a difference of -300: ${ht.value} / ${form(h)}`;
type(hf, "100"); await wait(100);
if (ht.value !== "180") return `a rise of 100 °C: ${ht.value}`;
// A callback, and a name prefix.
const d = $("#unit-converter-demo-data-from");
if (d.name !== "size_from_value") return "name prefix";
const live = d.closest(".demo-stack");
if ($("#unit-converter-demo-data-to").value !== "1.073741824") return `1 GiB: ${$("#unit-converter-demo-data-to").value}`;
type(d, "2"); await wait(100);
if (live.querySelector(".demo-note").textContent !== "on_change: 2 gib is 2.147483648 gb.") return live.querySelector(".demo-note").textContent;
type($("#unit-converter-demo-data-to"), "8"); await wait(100);
if (live.querySelector(".demo-note").textContent !== "on_change: 7.450580596923828125 gib is 8 gb.") return live.querySelector(".demo-note").textContent;
