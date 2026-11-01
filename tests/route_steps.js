// mobile
const card = () => $(".ui-routest-card");
const text = () => $(".ui-routest-text").textContent;
const left = () => $(".ui-routest-left").textContent;
const time = () => $(".ui-routest-time").textContent;
const eta = () => $(".ui-routest-eta").textContent;
const pct = () => $(".ui-routest-track").getAttribute("aria-valuenow");
const toTurn = () => $(".ui-routest-in-m").textContent;
const log = () => $(".route-steps-demo-log").textContent;
const step = (i) => $(`.ui-routest-step[data-i="${i}"]`);
const texts = ["Head south on Rua Augusta", "Turn left onto Rua do Comercio", "Turn right at the river", "At the roundabout, take the second exit", "Keep right to the ferry terminal", "You have reached the terminal"];

// The whole route: 2,395 m and 1,770 s, which is 29.5 min, said as 30, so 14:35.
if (text() !== texts[0] || toTurn() !== "400 m") return "start: " + text() + " " + toTurn();
if (left() !== "2.4 km" || time() !== "30 min" || eta() !== "14:35" || pct() !== "0") return "start stats: " + [left(), time(), eta(), pct()];
if (step(0).getAttribute("aria-current") !== "step") return "the list does not mark the step";
if ($$(".ui-routest-step").length !== 6) return "steps: " + $$(".ui-routest-step").length;

// Bigger than all else on the screen, as it is read at arm's length.
if (parseFloat(getComputedStyle($(".ui-routest-in-m")).fontSize) < 34) return "the distance is not large";

// Next button; step 1 has 2,395 - 400 = 1,995 m and 1,470 s, 24.5 min, said as 25.
await tap($(".ui-routest-next"));
if (text() !== texts[1] || log() !== "step 1") return "next: " + text() + log();
if (left() !== "2.0 km" || time() !== "25 min" || eta() !== "14:30") return "step 1: " + [left(), time(), eta()];
if (pct() !== "16") return "400 of 2395 is 16%: " + pct();
if (step(0).dataset.state !== "done" || step(1).getAttribute("aria-current") !== "step") return "list after next";
await tap($(".ui-routest-prev"));
if (text() !== texts[0]) return "previous: " + text();

// A swipe that falls short, slow: it springs back.
await drag(card(), -60, 0, 500);
if (text() !== texts[0]) return "a short swipe moved it: " + text();
if (card().style.transform !== "") return "did not spring back: " + card().style.transform;

// A slow long drag, past 30% of the card, with hardly any speed.
const width = card().offsetWidth;
await drag(card(), -Math.round(width * 0.4), 0, 900);
if (text() !== texts[1]) return "a long swipe: " + text();
// Back, the other way.
await drag(card(), Math.round(width * 0.4), 0, 900);
if (text() !== texts[0]) return "swipe back: " + text();

// A flick: short and fast, under 30% of the width.
await drag(card(), -70, 0, 60);
if (text() !== texts[1]) return "a flick: " + text();
await drag(card(), 70, 0, 60);
if (text() !== texts[0]) return "a flick back: " + text();

// Mostly up and down is not a swipe, and leaves the card where it was.
await drag(card(), -20, -90, 200);
if (text() !== texts[0] || card().style.transform !== "") return "vertical drag: " + text() + card().style.transform;

// The first step has nothing before it: a pull gives a little and comes back.
const p = middle(card());
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x + i * 15, y: p.y }]); await wait(16); }
await wait(120);
const pulled = new DOMMatrix(getComputedStyle(card()).transform).m41;
await fingers("touchEnd", []);
await wait(350);
if (!(pulled > 40 && pulled < 100)) return "rubber band: " + pulled;
if (text() !== texts[0] || card().style.transform !== "") return "after the pull: " + text();

// The system takes the gesture: back where it was, nothing moved.
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - i * 30, y: p.y }]); await wait(16); }
const during = card().style.transform;
await fingers("touchCancel", []);
await wait(350);
if (during === "") return "the card did not follow the finger";
if (text() !== texts[0] || card().style.transform !== "") return "cancelled: " + text() + card().style.transform;

// State changing under a held finger leaves the card where the finger has it.
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - i * 10, y: p.y }]); await wait(16); }
await wait(60);
const heldAt = card().style.transform, leftBefore = left();
$(".route-steps-demo-unit").click();
await wait(150);
const leftDuring = left(), heldAfter = card().style.transform, heldRect = new DOMMatrix(getComputedStyle(card()).transform).m41;
$(".route-steps-demo-unit").click();
await wait(150);
await fingers("touchMove", [{ x: p.x - 80, y: p.y }]);
await wait(40);
const goesOn = card().style.transform;
await fingers("touchCancel", []);
await wait(350);
if (heldAt === "" || heldAfter !== heldAt || Math.abs(heldRect + 60) > 1) return `a state change moved the card: ${heldAt} to ${heldAfter}, at ${heldRect}`;
if (leftDuring === leftBefore) return "no state changed during the swipe: " + leftDuring;
if (goesOn !== "translateX(-80px)") return "the swipe did not go on: " + goesOn;
if (text() !== texts[0] || card().style.transform !== "") return "after the held swipe: " + text() + card().style.transform;

// Keys, the equal of the swipe.
card().focus();
key(card(), "ArrowRight");
await wait(60);
if (text() !== texts[1]) return "ArrowRight: " + text();
key(card(), "ArrowLeft");
await wait(60);
if (text() !== texts[0]) return "ArrowLeft: " + text();
key(card(), "ArrowLeft");
await wait(60);
if (text() !== texts[0]) return "past the first step: " + text();

// Straight to a step from the list.
await tap(step(3));
if (text() !== texts[3] || log() !== "step 3") return "jump: " + text();
await tap(step(0));

// Over midnight: 23:50 and 30 minutes.
await tap($(".route-steps-demo-late"));
if (eta() !== "00:20 +1 day") return "eta over midnight: " + eta();

// Miles: 1.488 mi left, 400 m is 0.2 mi, and the last short step 49 ft, to the nearest 50.
await tap($(".route-steps-demo-unit"));
if (left() !== "1.5 mi" || toTurn() !== "0.2 mi") return "miles: " + left() + " " + toTurn();
if (step(4).querySelector(".ui-routest-far").textContent !== "50 ft") return "feet: " + step(4).querySelector(".ui-routest-far").textContent;
await tap($(".route-steps-demo-unit"));

// A position. 384 m from the first turn by the haversine, so 400 m said, to the nearest 50.
await tap($(".route-steps-demo-fix"));
if (text() !== texts[0] || toTurn() !== "400 m") return "first fix: " + text() + " " + toTurn();
// 203 m from it: 203 + 1,995 = 2,198 m left; 300 s x 203/400 + 1,470 = 1,622 s, 28 min; 196.9 of 2,395 is 8%.
await tap($(".route-steps-demo-fix"));
if (toTurn() !== "200 m" || left() !== "2.2 km" || time() !== "28 min" || pct() !== "8") return "second fix: " + [toTurn(), left(), time(), pct()];
// At the turn: the next step, by itself.
await tap($(".route-steps-demo-fix"));
if (text() !== texts[1] || log() !== "step 1") return "at the turn: " + text() + log();
// The same place again changes nothing.
await tap($(".route-steps-demo-fix"));
if (text() !== texts[1]) return "same fix: " + text();
// A long gap between fixes: past the end of step 2, so step 3, with step 2 never shown.
await tap($(".route-steps-demo-fix"));
if (text() !== texts[3] || log() !== "step 3") return "skipping: " + text();
// The end.
await tap($(".route-steps-demo-fix"));
if (text() !== "You have arrived") return "the end: " + text();
if (left() !== "0 m" || time() !== "0 min" || pct() !== "100") return "the end stats: " + [left(), time(), pct()];
if ($(".route-steps-demo-ended").textContent !== "yes") return "on_arrive";
if (!$(".ui-routest-next").disabled) return "Next at the end should be off";

// Rotation keeps the step, the list's scroll and the focus; a tablet has the list beside the card.
const list = $(".ui-routest-list");
$(".ui-routest-prev").focus();
const was = list.scrollTop;
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true });
await wait(300);
const turned = [text(), document.activeElement === $(".ui-routest-prev"), getComputedStyle($(".ui-routest-in")).flexDirection];
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (turned[0] !== "You have arrived" || !turned[1]) return "rotation: " + turned;
if (turned[2] !== "row") return "turned, the list should go beside the card: " + turned[2];
if (getComputedStyle($(".ui-routest-in")).flexDirection !== (device === "tablet" ? "row" : "column")) return "layout: " + getComputedStyle($(".ui-routest-in")).flexDirection;

// Back from the end by the button, and on_arrive is not said again.
await tap($(".ui-routest-prev"));
if (text() !== texts[4]) return "back from the end: " + text();
