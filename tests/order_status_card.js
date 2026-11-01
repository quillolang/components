// mobile
const cards = $$(".ui-ordst");
if (cards.length !== 7) return "seven cards: " + cards.length;
const [ok, slip, late, lost, there, gone, bad] = cards;
const eta = (c) => c.querySelector(".ui-ordst-eta strong")?.textContent;
const pct = (c) => c.querySelector("[role=progressbar]")?.getAttribute("aria-valuenow");
// On plan. Packed 22:00 on the 31st; Shipped takes 24 h, so 22:00 on the 1st; Delivered 48 h, so the 3rd, a Tuesday.
if (eta(ok) !== "Tue 3 Nov") return "eta from data: " + eta(ok);
// Hours 1 + 12 + 24 + 48 = 85. Past 13, and 14 hours into the 24 of Shipped: 27/85 = 31.7%.
if (pct(ok) !== "31") return "percent: " + pct(ok);
if (ok.querySelector("h3").textContent !== "Packed") return "the title is the last stage reached: " + ok.querySelector("h3").textContent;
if (ok.querySelector("details")) return "on plan, nothing to do";
if (ok.querySelector('[aria-current="step"] .ui-ordst-name').textContent !== "Shipped") return "the stage under way";
if (ok.classList.contains("ui-ordst-late")) return "not late";
// Slipping: shipped 09:00 on the 31st, 48 h out for delivery + 8 h: 09:00 on the 2nd + 8 h = 17:00 on the 2nd. Promised to the end of the 1st: 1 day.
if (!slip.classList.contains("ui-ordst-slipping")) return "slipping: " + slip.className;
if (eta(slip) !== "Mon 2 Nov") return "slip eta: " + eta(slip);
const d1 = slip.querySelector("details");
if (!d1 || d1.open) return "slipping is folded: it needs nothing";
if (!/may come 1 day after/.test(d1.textContent)) return "slip says: " + d1.textContent;
if (slip.querySelector('a[href="#help"]')) return "nothing to ask yet";
await tap(d1.querySelector("summary"));
if (!d1.open) return "a tap unfolds it";
await tap(d1.querySelector("summary"));
if (d1.open) return "a tap folds it";
// Late: promised the 30th, now the 1st at noon: past by 36 h, so 2 days. Out for delivery that morning.
if (!late.classList.contains("ui-ordst-late")) return "late: " + late.className;
if (!late.querySelector("details").open) return "late is open";
if (!/It is 2 days late/.test(late.textContent)) return "late says: " + late.querySelector("details").textContent;
if (!late.querySelector('a[href="#track"]') || !late.querySelector('a[href="#help"]')) return "late offers both";
if (late.querySelector('a[href="#refund"]')) return "no refund yet";
// Out at 06:00, delivered in 8 h: 14:00 today.
if (eta(late) !== "Sun 1 Nov") return "late eta: " + eta(late);
if (!/Now expected/.test(late.querySelector(".ui-ordst-eta").textContent)) return "it says now";
// Very late: promised the 29th: 3 days, and shipped 10:00 on the 27th with nothing for 5 days.
if (!lost.classList.contains("ui-ordst-very_late")) return "very late: " + lost.className;
if (!/has not moved for a while and is 3 days late/.test(lost.textContent)) return "very late says: " + lost.textContent;
if (!lost.querySelector('a[href="#refund"]')) return "very late offers a refund";
// Overdue: the stage should have ended, so it ends now: the 1st + 8 h.
if (eta(lost) !== "Sun 1 Nov") return "overdue eta starts from now: " + eta(lost);
if (Number(pct(lost)) >= 100) return "never 100 before it is there";
// Delivered.
if (pct(there) !== "100" || there.querySelector("h3").textContent !== "Delivered") return "delivered: " + pct(there);
if (eta(there) !== "Wed 28 Oct") return "it came on: " + eta(there);
if (there.querySelector("[aria-current]")) return "no stage under way";
// Cancelled.
if (gone.querySelector("h3").textContent !== "Cancelled" || gone.querySelector("[role=progressbar]") || gone.querySelector(".ui-ordst-eta")) return "cancelled";
// Bad input does nothing worse than say little.
if (bad.querySelector("h3").textContent !== "Not started") return "bad data: " + bad.querySelector("h3").textContent;
if (bad.querySelectorAll(".ui-ordst-stage").length !== 1) return "the junk stage is left out";
// Touch: the links are links, and big enough (the harness checks that).
// Layout: down a phone, along a wide card, by the card's own width.
const flow = () => getComputedStyle(ok.querySelector(".ui-ordst-stages")).gridAutoFlow;
const wide = ok.clientWidth >= 520 + 32;
if (wide !== flow().startsWith("column")) return "stages lie along a wide card: " + ok.clientWidth + " " + flow();
if (device === "tablet" && !wide) return "a tablet is wide";
if (device === "phone" && wide) return "a phone is not";
