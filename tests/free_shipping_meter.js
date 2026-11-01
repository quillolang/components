const c = $("#free-shipping-meter-demo-title").closest(".ui-fsmeter");
const say = (r) => r.querySelector(".ui-fsmeter-say")?.textContent;
const bar = (r) => r.querySelector(".ui-fsmeter-track");
const offers = (r) => [...r.querySelectorAll(".ui-fsmeter-offer")].map((o) => [...o.querySelectorAll("h4, span, button, p")].map((x) => x.textContent).join(" ").replace(/\s+/g, " "));
const rows = (r) => [...r.querySelectorAll(".ui-fsmeter-tiers li")].map((l) => l.textContent);
const btn = (r, name) => r.querySelector(`button[aria-label="${name}"]`);
const hidden = (r) => r.querySelector("input[type=hidden]");
// 38.50 against tiers given out of order: 50 first. 11.50 short; the cap at 11.50 is exact, and 9 + 2.75 = 11.75 is dearer.
if (say(c) !== "$11.50 more for free shipping.") return `start: ${say(c)}`;
if (bar(c).getAttribute("aria-valuenow") !== "38.50" || bar(c).querySelector(".ui-fsmeter-fill").style.width !== "38.5%") return `bar: ${bar(c).getAttribute("aria-valuenow")}`;
if (bar(c).getAttribute("aria-valuetext") !== "$38.50 of $100.00") return `valuetext: ${bar(c).getAttribute("aria-valuetext")}`;
if ([...bar(c).querySelectorAll(".ui-fsmeter-tick")].map((t) => t.style.left).join(" ") !== "50% 100%") return "ticks";
if (rows(c).join("|") !== "Free shipping$11.50 to go|A free gift$61.50 to go") return `rows: ${rows(c)}`;
if (offers(c).join("|") !== "Cheapest item that gets you there Canvas cap, $11.50 Add This gets you there exactly.") return `offer: ${offers(c)}`;
btn(c, "Add Canvas cap").click(); await wait();
// Exactly 50.00: reached, not one cent short.
if (say(c) !== "You have free shipping. $50.00 more for a free gift.") return `exactly: ${say(c)}`;
if (rows(c)[0] !== "Free shippingReached" || !c.querySelector(".ui-fsmeter-got")) return `reached: ${rows(c)}`;
if (hidden(c).value !== "cap" || hidden(c).name !== "added") return `hidden: ${hidden(c).value}`;
// 50 short with the cap gone: nothing alone (40 is the most). Cheapest set: 40 + 9 + 2.75 = 51.75 (40 + 12 = 52).
if (offers(c)[0] !== "No single item gets you there. The cheapest set Enamel pin + Enamel mug + Tote bag, $51.75 Add all This goes $1.75 past it.") return `set: ${offers(c)[0]}`;
btn(c, "Add Enamel pin and Enamel mug and Tote bag").click(); await wait();
if (say(c) !== "You have every reward." || !c.classList.contains("ui-fsmeter-full") || bar(c).getAttribute("aria-valuenow") !== "100") return `top: ${say(c)}`;
if (hidden(c).value !== "cap,pin,mug,tote") return `hidden after: ${hidden(c).value}`;
btn(c, "Take off Tote bag").click(); await wait();
// 38.5 + 11.5 + 2.75 + 9 = 61.75: 38.25 short, and 12 is all that is left.
if (say(c) !== "You have free shipping. $38.25 more for a free gift.") return `take off: ${say(c)}`;
if (!offers(c).join("|").includes("Tote bag, $40.00 Add This goes $1.75 past it.")) return `after taking off: ${offers(c)}`;
for (const n of ["Enamel pin", "Enamel mug", "Canvas cap"]) btn(c, `Take off ${n}`).click();
await wait();
if (say(c) !== "$11.50 more for free shipping." || hidden(c).value !== "") return `all off: ${say(c)}`;
// One cent short, in euros: the clip gets there exactly, cheaper than shipping.
const l = $("#free-shipping-meter-demo-live-title").closest(".ui-fsmeter");
if (say(l).replace(/\s/g, " ") !== "€0.01 more for free shipping.") return `euros: ${say(l)}`;
if (offers(l).join("|") !== "Cheapest item that gets you there Clip, €0.01 Add This gets you there exactly, for less than the €6.50 shipping.") return `euro offer: ${offers(l)}`;
const seen = () => l.closest(".demo-stack").querySelector(".demo-note").textContent;
btn(l, "Add Clip").click(); await wait();
if (seen() !== "on_add: Clip; on_change: 45.00, reached Free shipping, next A free gift, short 45.00.") return `on_change: ${seen()}`;
if (hidden(l).name !== "basket") return "name";
// Yen: no cents, and a set cheaper than the only item that does it alone.
const y = $("#free-shipping-meter-demo-yen-title").closest(".ui-fsmeter");
if (say(y) !== "¥200 more for free shipping.") return `yen: ${say(y)}`;
if (offers(y).join("|") !== "Cheapest item that gets you there Poster, ¥900 Add This goes ¥700 past it.|Cheaper as a set Sticker + Badge, ¥250 Add all This goes ¥50 past it, for less than the ¥700 shipping.") return `yen offers: ${offers(y)}`;
if (y.querySelector(".ui-fsmeter-problems").textContent !== "Dollars only has no amount in JPY, so it is left out.") return `tier in another currency: ${y.querySelector(".ui-fsmeter-problems").textContent}`;
// Exactly at the top.
const t = $("#free-shipping-meter-demo-top-title").closest(".ui-fsmeter");
if (say(t) !== "You have every reward." || bar(t).querySelector(".ui-fsmeter-fill").style.width !== "100%") return `top: ${say(t)}`;
// Bad input.
const b = $("#free-shipping-meter-demo-bad-title").closest(".ui-fsmeter");
if (b.querySelector("[role=alert]")?.textContent !== "The cart total is not an amount of 0 or more, so nothing can be worked out." || bar(b)) return "bad total";
const n = $("#free-shipping-meter-demo-none-title").closest(".ui-fsmeter");
if (n.querySelector("[role=alert]")?.textContent !== "There are no tiers to reach in GBP." || n.querySelectorAll(".ui-fsmeter-problems li").length !== 2) return "no tiers";
btn(c, "Add Canvas cap").focus();
if (document.activeElement !== btn(c, "Add Canvas cap")) return "Add cannot take the focus";
