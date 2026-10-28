const host = $(".ui-image-hotspots");
const img = host.querySelector("img");
const spots = $$(".ui-image-hotspots-pin");
if (spots.length !== 5) return `expected 5 points, found ${spots.length}`;
if (host.querySelector(".ui-image-hotspots-points").getAttribute("aria-label") !== "Rooms") return "the list of points has no label";
if (spots[0].textContent !== "1" || spots[4].textContent !== "5") return "the points are not numbered";
if (spots[0].getAttribute("aria-label") !== "1: Bed") return `the first point is named ${spots[0].getAttribute("aria-label")}`;
const note = (i) => document.getElementById(spots[i].getAttribute("aria-describedby"));
if (!note(0) || note(0).getAttribute("role") !== "tooltip" || note(0).querySelector("strong").textContent !== "Bed" || !note(0).textContent.includes("160 cm")) return "the note is not the point's tooltip";
if (note(4).querySelector("span")) return "a point without text has an empty span";
const ir = img.getBoundingClientRect(), b = spots[1].getBoundingClientRect();
const cx = (b.left + b.right) / 2 - ir.left, cy = (b.top + b.bottom) / 2 - ir.top;
if (Math.abs(cx / ir.width * 100 - 60) > 1.5 || Math.abs(cy / ir.height * 100 - 25) > 1.5) return `point 2 sits at ${cx / ir.width * 100}%, ${cy / ir.height * 100}%`;
if (getComputedStyle(note(2)).visibility !== "hidden") return "a note shows before hover or focus";
// A headless page has no window focus, so :focus never matches here: check the rules that show a note instead.
const rules = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .filter((r) => r.selectorText && r.style.visibility === "visible").map((r) => r.selectorText).join(" ");
if (!rules.includes(".ui-image-hotspots-pin:focus + .ui-image-hotspots-pin-note")) return "no rule shows a note when its point has focus";
if (!rules.includes(".ui-image-hotspots-pin-at:hover .ui-image-hotspots-pin-note")) return "no rule shows a note on hover";
spots[2].focus(); await wait();
if (document.activeElement !== spots[2]) return "a point cannot take focus";
spots[2].blur();
const shown = (i, f) => { note(i).style.visibility = "visible"; try { return f(); } finally { note(i).style.visibility = ""; } };
if (shown(2, () => note(2).getBoundingClientRect().bottom > spots[2].getBoundingClientRect().top + 1)) return "a note in the lower part of the picture does not open above its point";
if (shown(0, () => note(0).getBoundingClientRect().top < spots[0].getBoundingClientRect().bottom - 1)) return "a note near the top does not open below its point";
if (shown(4, () => note(4).getBoundingClientRect().right > spots[4].getBoundingClientRect().right + 16)) return "a note near the right edge does not lean left";
