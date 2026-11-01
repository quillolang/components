const c = $("#best-coupon-demo-TAKE15").closest(".ui-bestcoupon");
const win = (r = c) => r.querySelector(".ui-bestcoupon-win")?.textContent;
const pay = (r = c) => r.querySelector(".ui-bestcoupon-total span:last-child").textContent;
const steps = (r = c) => [...r.querySelectorAll(".ui-bestcoupon-steps li")].map((l) => l.textContent.replace(/minus /, ""));
const why = (r, code) => [...r.querySelectorAll(".ui-bestcoupon-row")].find((x) => x.querySelector(`input[value="${code}"]`) || x.querySelector(".ui-bestcoupon-name").textContent === code)?.querySelector(".ui-bestcoupon-why").textContent;
const say = (r = c) => r.querySelector(".ui-bestcoupon-out .ui-bestcoupon-say")?.textContent;
// 120 + 30 + 20 = 170. Percent first: 170 -> 153 -> 138. Fixed first: 155 -> 139.50. Shoes 25%: 30 off, 140. Flat: 150.
if (win() !== "Best: Save 10 then Take 15 saves $32.00." || pay() !== "$138.00") return `start: ${win()} ${pay()}`;
if (steps().join("|") !== "Cart$170.00|Save 10−$17.00|Take 15−$15.00") return `steps: ${steps()}`;
if (say() !== "In this order it saves $1.50 more than the other way round.") return `order: ${say()}`;
if (why(c, "SAVE10") !== "Used: takes off $17.00." || why(c, "TAKE15") !== "Used: takes off $15.00.") return `used: ${why(c, "SAVE10")}`;
if (why(c, "SHOES25") !== "Cannot be combined. Alone it saves $30.00, $2.00 less than the winner.") return `SHOES25: ${why(c, "SHOES25")}`;
if (why(c, "FLAT20") !== "Cannot be combined. Alone it saves $20.00, $12.00 less than the winner.") return `FLAT20: ${why(c, "FLAT20")}`;
if (why(c, "BOOK5") !== "Needs $25.00 of books, and this cart has $20.00: $5.00 short.") return `BOOK5: ${why(c, "BOOK5")}`;
if (why(c, "OLD20") !== "Expired on Oct 1, 2026.") return `OLD20: ${why(c, "OLD20")}`;
if (why(c, "BIG50") !== "Needs $300.00, and this cart has $170.00: $130.00 short.") return `BIG50: ${why(c, "BIG50")}`;
if (why(c, "TOYS") !== "Nothing in toys in this cart.") return `TOYS: ${why(c, "TOYS")}`;
if (why(c, "HUGE") !== "Cannot be used: it takes more than 100%.") return `HUGE: ${why(c, "HUGE")}`;
if (!c.querySelector(".ui-bestcoupon-problems").textContent.includes("The code SAVE10 is given twice")) return "a repeated code is not said";
if (c.querySelector("input[type=hidden]").value !== "SAVE10,TAKE15" || c.querySelector("input[type=hidden]").name !== "coupons") return `hidden: ${c.querySelector("input[type=hidden]").value}`;
// Off with the 10%: Shoe sale wins alone, and Take 15 loses as a stacking coupon.
$("#best-coupon-demo-SAVE10").click(); await wait();
if (win() !== "Best: Shoe sale saves $30.00." || pay() !== "$140.00") return `SAVE10 off: ${win()} ${pay()}`;
if (why(c, "TAKE15") !== "Only goes with other stacking coupons, which together save $15.00, $15.00 less than the winner.") return `TAKE15: ${why(c, "TAKE15")}`;
if (why(c, "SAVE10") !== "Switched off.") return `off: ${why(c, "SAVE10")}`;
$("#best-coupon-demo-SHOES25").click(); await wait();
$("#best-coupon-demo-FLAT20").click(); await wait();
$("#best-coupon-demo-TAKE15").click(); await wait();
if (win() || say() !== "No coupon takes anything off this cart." || pay() !== "$170.00") return `none: ${win()} ${say()}`;
for (const k of ["SAVE10", "SHOES25", "FLAT20", "TAKE15"]) $(`#best-coupon-demo-${k}`).click();
await wait();
if (pay() !== "$138.00") return `all back: ${pay()}`;
// The shop's order: the 10% goes first, which leaves 90 under FIVE's minimum of 95.
const l = $("#best-coupon-demo-live-TEN").closest(".ui-bestcoupon");
if (win(l) !== "Best: TEN saves $10.00." || pay(l) !== "$90.00") return `set order: ${win(l)}`;
if (why(l, "FIVE") !== "Needs $95.00 when its turn comes, and only $90.00 is left by then.") return `late: ${why(l, "FIVE")}`;
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
$("#best-coupon-demo-live-TEN").click(); await wait();
if (seen() !== "on_change: FIVE, to pay 95.00, saving 5.00.") return `on_change: ${seen()}`;
if (l.querySelector("input[type=hidden]").name !== "codes" || $("#best-coupon-demo-live-TEN").name !== "codes_offered") return "names";
// A cap, then more than the cart: never below 0, and shared across categories without losing a penny.
const f = $("#best-coupon-demo-free-ALL").closest(".ui-bestcoupon");
// THIRD alone: 33.3% of 0.10 = 0.0333 -> 0.03, capped at 0.02; ALL then takes the 0.08 left: the same as ALL alone, with more coupons, so ALL wins alone.
if (win(f) !== "Best: ALL saves £0.10." || pay(f) !== "£0.00") return `cart gone: ${win(f)} ${pay(f)}`;
if (!f.querySelector(".ui-bestcoupon-problems").textContent.includes("Bad has no price or quantity it can read")) return "a bad line is not said";
if (why(f, "THIRD") !== "Adds nothing on top of the winner.") return `THIRD: ${why(f, "THIRD")}`;
const e = $("#best-coupon-demo-empty-X").closest(".ui-bestcoupon");
if (say(e) !== "The cart is empty, so there is nothing to save on." || why(e, "X") !== "Nothing in the cart to take it off.") return `empty: ${say(e)} ${why(e, "X")}`;
// Eight stacking coupons: the two that save least alone are not tried, and a change stays quick.
const m = $("#best-coupon-demo-many-C8").closest(".ui-bestcoupon");
if (why(m, "C1") !== "Not tried: only the 6 stacking coupons that save the most alone go together." || why(m, "C2") !== why(m, "C1")) return `past the limit: ${why(m, "C1")}`;
if (why(m, "C3") !== "Used: takes off " + why(m, "C3").slice(16)) return `C3: ${why(m, "C3")}`;
const t0 = performance.now();
$("#best-coupon-demo-many-C8").click();
await new Promise((r) => requestAnimationFrame(() => setTimeout(r)));
const ms = performance.now() - t0;
if (ms > 800) return `a change took ${Math.round(ms)} ms`;
$("#best-coupon-demo-SAVE10").focus();
if (document.activeElement !== $("#best-coupon-demo-SAVE10")) return "a coupon cannot take the focus";
