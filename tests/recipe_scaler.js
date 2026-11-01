const c = $("#recipe-scaler-demo-text").closest(".ui-recipe-scale");
const lines = (box = c) => [...box.querySelectorAll(".ui-recipe-scale-line")].map((l) => l.textContent);
const say = async (text) => { type($("#recipe-scaler-demo-text"), text); await wait(80); return lines().join(" | "); };
const eq = (got, want, what) => got === want ? null : `${what}: got "${got}", wanted "${want}"`;
const to = $("#recipe-scaler-demo-to"), from = $("#recipe-scaler-demo-from"), sys = $("#recipe-scaler-demo-units");
const units = async (v) => { sys.value = v; sys.dispatchEvent(new Event("change", { bubbles: true })); await wait(80); };
// Four servings to six is by 1.5.
let e = eq(lines().join(" | "), "2¼ cups flour | ¾ tsp salt | 1½ tbsp baking powder | 3 tbsp butter | 375 g sugar | 1.05 kg chicken thighs | 3 to 4½ cloves garlic | 3 eggs | 1½ onions, diced | a pinch of nutmeg | black pepper to taste", "at 1.5");
if (e) return e;
if (!c.querySelector("[aria-live]").textContent.startsWith("Scaled by 1.5, from 4 to 6 servings")) return c.querySelector("[aria-live]").textContent;
if (!c.textContent.includes("2 lines have no amount")) return "lines left as they are";
if (c.querySelector(".ui-recipe-scale-was").textContent !== "was 1 1/2 cups flour") return "what it was";
// Amounts as recipes write them, with the factor at 1.
type(to, "4"); await wait(80);
e = eq(await say("1 1/2 cups a\n1½ cups b\n1 ½ cups c\n1-1/2 cups d\n1.5 cups e\n1,5 cups f\n3/2 cups g\n⅔ cup h\n1⁄2 cup i\n2 to 3 cups j\n2–3 cups k\n2 Tbsp l\n2 T m\n2 t n\n250g o\n1.5kg p\n1,000 g q\n1 L r\n8 fl oz s\n8 fl. oz. t\n1 lb u\n3 lbs v\nhalf a cup w\na cup x\none cup y\ntwo tbsp z"),
    "1½ cups a | 1½ cups b | 1½ cups c | 1½ cups d | 1½ cups e | 1½ cups f | 1½ cups g | ⅔ cup h | ½ cup i | 2 to 3 cups j | 2 to 3 cups k | 2 tbsp l | 2 tbsp m | 2 tsp n | 250 g o | 1.5 kg p | 1 kg q | 1 l r | 1 cup s | 1 cup t | 1 lb u | 3 lb v | ½ cup w | 1 cup x | 1 cup y | 2 tbsp z", "reading");
if (e) return e;
// Moving between units.
e = eq(await say("12 tsp a\n3 tsp b\n16 tbsp c\n4 cups d\n16 cups e\n1000 ml f\n16 oz g\n1000 g h\n0.5 kg i\n1/16 cup j\n1/8 cup k\n0.5 tbsp l"),
    "¼ cup a | 1 tbsp b | 1 cup c | 1 qt d | 1 gal e | 1 l f | 1 lb g | 1 kg h | 500 g i | 1 tbsp j | 2 tbsp k | 1½ tsp l", "units move");
if (e) return e;
// Rounding to a measure, thirds of cups included: 1/3 cup times 3 is 1 cup, not 0.999...
type(to, "12"); await wait(80);
e = eq(await say("1/3 cup a\n1 tsp b\n100 g c\n33.3 g d\n1 egg\n1 tomato\n1 cherry\n1 bunch parsley\n1 large onion, sliced"),
    "1 cup a | 1 tbsp b | 300 g c | 100 g d | 3 eggs | 3 tomatoes | 3 cherries | 3 bunches parsley | 3 large onions, sliced", "by 3");
if (e) return e;
type(to, "1"); await wait(80);
// By a quarter: 1/32 tsp is a pinch, 83.25 g is 83, and a part of an egg stays a part.
e = eq(await say("1/8 tsp a\n1 cup b\n333 g c\n1 egg\n4 eggs\n2 cloves d"), "a pinch a | ¼ cup b | 83 g c | ¼ egg | 1 egg | ½ clove d", "by 1/4");
if (e) return e;
type(to, "3"); await wait(80);
// By 3/4: ¾ tsp, ¾ cup; 5 eggs is 3.75; 7 tbsp is 5.25, past ¼ cup and nearest ⅓ cup (5⅓ tbsp).
e = eq(await say("1 tsp a\n1 cup b\n5 eggs\n7 tbsp c"), "¾ tsp a | ¾ cup b | 3¾ eggs | ⅓ cup c", "by 3/4");
if (e) return e;
type(to, "4"); await wait(80);
// A mark where rounding moves it a lot.
type(to, "4.2"); await wait(80);
e = eq(await say("1 tsp a"), "1 tsp a", "under 5%");
if (e) return e;
type(to, "5"); await wait(80);
e = eq(await say("1 tsp a"), "1¼ tsp a", "by 1.25");
if (e) return e;
type(to, "4.6"); await wait(80);
e = eq(await say("1 tbsp a"), "about 1 tbsp a", "says about (1.15 tbsp)");
if (e) return e;
type(to, "4"); await wait(80);
// Systems: US to metric, keeping spoons under 4 tbsp, and the other way.
await units("metric");
e = eq(await say("1 cup a\n2 tbsp b\n1 lb c\n8 oz d\n1 gal e\n3 tsp f\n4 tbsp g\n200 g h"), "235 ml a | 2 tbsp b | 455 g c | 225 g d | 3.79 l e | 1 tbsp f | 60 ml g | 200 g h", "metric");
if (e) return e;
await units("us");
e = eq(await say("240 ml a\n15 ml b\n5 ml c\n1 l d\n250 g e\n1 kg f\n2 cups g"), "1 cup a | 1 tbsp b | 1 tsp c | about 1 qt d | 9 oz e | 2¼ lb f | 2 cups g", "US");
if (e) return e;
await units("written");
// Bad and awkward input.
e = eq(await say(""), "", "empty");
if (e) return e;
if (c.querySelector("[aria-live]").textContent !== "Add ingredients to scale them.") return "nothing to scale";
e = eq(await say("   \n\n  "), "", "only spaces");
if (e) return e;
e = eq(await say("3/0 cups a\n0 cups b\nconstructor c\n2 constructor\n99999999999 eggs\n🥚🥚\n- 1 cup bulleted\n• 2 tsp bulleted\n1"),
    "3/0 cups a | 0 cups b | constructor c | 2 constructors | 99999999999 eggs | 🥚🥚 | 1 cup bulleted | 2 tsp bulleted | 1", "bad lines");
if (e) return e;
e = eq(await say("3-2 cups reversed"), "2 to 3 cups reversed", "a range the wrong way");
if (e) return e;
type(to, "0"); await wait(80);
if (!c.querySelector("[role=alert]")?.textContent.includes("Servings are numbers") || to.getAttribute("aria-invalid") !== "true" || lines().length) return "0 servings";
type(to, "abc"); await wait(80);
if (!c.querySelector("[role=alert]")) return "text as servings";
type(to, "99999999"); await wait(80);
if (!c.querySelector("[role=alert]")) return "too many servings";
type(to, "8"); await wait(80);
const many = Array.from({ length: 250 }, (_, i) => `${i + 1} cups a`).join("\n");
const t0 = performance.now();
type($("#recipe-scaler-demo-text"), many); await wait(150);
if (performance.now() - t0 > 1500) return "too slow on 250 lines";
if (lines().length !== 200 || !c.querySelector("[role=alert]")?.textContent.includes("50 left out")) return `the cap: ${lines().length}`;
await say("1 cup a");
c.querySelector(".ui-recipe-scale-double").click(); await wait(80);
if (to.value !== "16" || lines()[0] !== "1 qt a") return `double: ${to.value} ${lines()[0]}`;
c.querySelector(".ui-recipe-scale-half").click(); await wait(80);
c.querySelector(".ui-recipe-scale-half").click(); await wait(80);
if (to.value !== "4" || lines()[0] !== "1 cup a") return `halve: ${to.value} ${lines()[0]}`;
// The callback and a name prefix. Twice 1 cup, 1 lb, 1 tbsp in metric: 473 ml to 475, 907 g to 905, 2 tbsp.
const m = $("#recipe-scaler-demo-metric-text").closest(".ui-recipe-scale");
e = eq(lines(m).join(" | "), "475 ml stock | 905 g potatoes | 2 tbsp oil", "metric demo");
if (e) return e;
if ($("#recipe-scaler-demo-metric-text").name !== "soup_ingredients" || $("#recipe-scaler-demo-text").name !== "ingredients") return "field names";
type($("#recipe-scaler-demo-metric-to"), "2"); await wait(80);
e = eq(m.closest(".demo-stack").querySelector(".demo-note").textContent, "on_change: by 1, first line 235 ml stock.", "on_change");
if (e) return e;
