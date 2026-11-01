// mobile
await wait(100);
const day = $("#activity-rings-day"), far = $("#activity-rings-far"), bad = $("#activity-rings-bad");

// Three rings of width 20: 84 / 3 = 28, of which 84% is 23.5, cut to 20, and a gap of 4.
// Radii: 98 - 10 = 88, then 64 and 40.
const arcs = (box) => [...box.querySelectorAll("g")].map((g) => {
    const [track, base, lap, head] = g.querySelectorAll("circle");
    return { r: +track.getAttribute("r"), w: +track.getAttribute("stroke-width"), base, lap, head };
});
const rs = arcs(day);
if (rs.length !== 3) return "three rings expected, are " + rs.length;
if (rs.map((r) => r.r).join() !== "88,64,40") return "radii: " + rs.map((r) => r.r).join();
if (rs.some((r) => r.w !== 20)) return "widths: " + rs.map((r) => r.w).join();
const dash = (c) => c.style.strokeDasharray.replace(/px/g, "").replace(",", "").split(" ").map(Number).join(" ");

// Move, 420 of 600: 70%, one arc.
if (dash(rs[0].base) !== "70 100") return "70% should be drawn 70 of 100: " + dash(rs[0].base);
if (!rs[0].lap.classList.contains("ui-arings-none")) return "a ring under its goal has no second lap";
// Exercise, 45 of 30: 150%, a full ring and half a lap over it, ending at the bottom.
if (dash(rs[1].base) !== "100 100") return "the first lap should be full: " + dash(rs[1].base);
if (dash(rs[1].lap) !== "50 100") return "150% should lap by 50: " + dash(rs[1].lap);
if (rs[1].lap.classList.contains("ui-arings-none")) return "the second lap should show";
// Half way round in the turned picture is cos(pi) = -1: x = 100 - 64 = 36, y = 100.
if (+rs[1].head.getAttribute("cx") !== 36 || +rs[1].head.getAttribute("cy") !== 100) return "the head of the lap: " + rs[1].head.getAttribute("cx") + "," + rs[1].head.getAttribute("cy");
// Stand, 12 of 12: exactly the goal, no second lap.
if (dash(rs[2].base) !== "100 100" || !rs[2].lap.classList.contains("ui-arings-none")) return "100% is one whole lap";
// 250%: the second lap is 50 again, and 200% lands on a whole lap.
const fs = arcs(far);
if (dash(fs[0].lap) !== "50 100") return "250% should lap by 50: " + dash(fs[0].lap);
if (dash(fs[1].lap) !== "100 100") return "200% should be a whole second lap: " + dash(fs[1].lap);
if (fs[0].w !== 20 || fs[0].r !== 88 || fs[1].r !== 64) return "two rings stay 20 wide";

// The words: the legend in the open, a sentence for screen readers.
const says = [...day.querySelectorAll(".ui-sr")].map((s) => s.textContent);
if (says[0] !== "Move: 420 of 600 kcal, 70 percent.") return "said: " + says[0];
if (says[1] !== "Exercise: 45 of 30 min, 150 percent, goal reached.") return "said: " + says[1];
if (says[2] !== "Stand: 12 of 12 h, 100 percent, goal reached.") return "said: " + says[2];
if (day.querySelector("svg").parentElement.getAttribute("aria-hidden") !== "true") return "the picture should be hidden from screen readers";
if (day.querySelector(".ui-arings-pct").textContent !== "70%") return "percent in the legend: " + day.querySelector(".ui-arings-pct").textContent;
if (far.querySelectorAll(".ui-arings-pct")[0].textContent !== "250%") return "past the goal, the legend says so";
if (day.querySelector(".ui-arings-center").textContent !== "Fri") return "the middle word";

// Bad data does not stop it: those without labels go, a goal of 0 is nothing, text is 0, below 0 is 0.
const said = [...bad.querySelectorAll(".ui-sr")].map((s) => s.textContent);
if (said.length !== 3) return "only the named should stay: " + said.length;
if (said[0] !== "No goal: 5 of 0, 0 percent.") return "no goal: " + said[0];
if (said[1] !== "Text: 0 of 10, 0 percent.") return "text: " + said[1];
if (said[2] !== "Below: 0 of 10, 0 percent.") return "below: " + said[2];
if (arcs(bad).some((r) => !r.base.classList.contains("ui-arings-none"))) return "nothing done draws no arc, whose round cap would be a dot";

// Drawn once: one run of the keyframes for each arc, none repeating, all done by now.
await wait(1800);
const runs = day.querySelector(".ui-arings-arc").getAnimations();
for (const a of day.querySelector(".ui-arings-arc").getAnimations({ subtree: false })) if (a.playState === "running") return "still drawing after 1.8 s";
const css = getComputedStyle(rs[0].base);
if (css.animationName !== "ui-arings-draw" || css.animationIterationCount !== "1") return "the arcs should draw once: " + css.animationName + " " + css.animationIterationCount;
if (css.animationFillMode !== "backwards") return "a finished draw leaves the arc as the value says";
if (getComputedStyle(rs[1].lap).animationDelay !== "0.85s") return "the second lap starts as the first ends";

// A later change slides: it does not draw again.
const live = $("#activity-rings-live"), add = $("#activity-rings-add");
const arc = live.querySelector(".ui-arings-arc"), lap = live.querySelector(".ui-arings-lap");
let started = 0;
live.addEventListener("animationstart", () => started++);
await tap(add);
await wait(100);
if (live.querySelector(".ui-arings-arc") !== arc) return "the arc should be kept, not made again";
if (dash(arc) !== "100 100" || dash(lap) !== "1.67 100") return "610 of 600: " + dash(arc) + " and " + dash(lap);
if (lap.classList.contains("ui-arings-none")) return "the lap should show now";
if (started !== 0) return "a change of value drew the ring again";
if (live.querySelector(".ui-sr").textContent !== "Move: 610 of 600 kcal, 102 percent, goal reached.") return "the sentence follows: " + live.querySelector(".ui-sr").textContent;

// Reduced motion: no drawing at all, and everything in place.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(50);
const still = getComputedStyle(rs[0].base).animationName;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "none") return "reduced motion should not draw: " + still;

// Beside the legend in a wide box, under it in a narrow one.
const inner = day.querySelector(".ui-arings-in"), box = day.querySelector(".ui-arings");
day.style.width = "300px";
await wait(50);
if (getComputedStyle(inner).flexDirection !== "column") return "narrow: legend under the rings";
day.style.width = "500px";
await wait(50);
if (getComputedStyle(inner).flexDirection !== "row") return "wide: legend beside the rings";
day.style.width = "700px";
await wait(50);
if (Math.round(box.querySelector(".ui-arings-pic").getBoundingClientRect().width) !== 280) return "a wide pane draws them larger: " + box.querySelector(".ui-arings-pic").getBoundingClientRect().width;
day.style.width = "";
