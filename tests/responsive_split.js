// mobile
const host = $("#responsive-split-demo"), track = $(".ui-responsive-split-track");
const side = $(".ui-responsive-split-side"), mainP = $(".ui-responsive-split-main");
const list = side.querySelector(".ui-responsive-split-scroll"), body = mainP.querySelector(".ui-responsive-split-scroll");
const rows = () => $$(".ui-responsive-split-row"), row = (t) => rows().find((r) => r.querySelector("b").textContent === t);
const heading = () => mainP.querySelector("h2"), backBtn = $(".ui-responsive-split-back");
const out = () => $("#responsive-split-demo-out")?.textContent ?? "";
const seen = (el) => getComputedStyle(el).visibility === "visible";
const offset = () => { const a = mainP.getBoundingClientRect(), b = host.getBoundingClientRect(); return Math.round(a.left - b.left); };
const W = innerWidth, H = innerHeight;
const resize = async (w, h) => { await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(420); };
const edge = async (dx, dy, ms, end = "touchEnd", at = 12) => {
    const r = body.getBoundingClientRect(), p = { x: r.left + at, y: r.bottom - 60 }, steps = Math.max(4, Math.round(ms / 16));
    await fingers("touchStart", [p]);
    for (let i = 1; i <= steps; i++) { await fingers("touchMove", [{ x: p.x + dx * i / steps, y: p.y + dy * i / steps }]); await wait(ms / steps); }
    await fingers(end, []);
    await wait(400);
};
if (rows().length !== 40) return "rows: " + rows().length;
if (row("Rooftop Deliveries").getAttribute("aria-current") !== "true") return "the start is not selected";

if (device === "phone") {
    // A stack, starting on the selected one: the detail, with the list out of sight.
    if (offset() !== 0 || seen(side)) return `a phone starts on the detail: ${offset()}, list seen ${seen(side)}`;
    if (heading().textContent !== "Rooftop Deliveries") return "heading: " + heading().textContent;
    await tap(backBtn); await wait(400);
    if (offset() !== W || seen(mainP) || !seen(side)) return `Back: ${offset()}`;
    if (!out().includes("back 1")) return "on_back: " + out();
    if (document.activeElement !== row("Rooftop Deliveries")) return "Back leaves the focus on " + document.activeElement.tagName;
    if (row("Rooftop Deliveries").getAttribute("aria-current") !== "true") return "Back lost the selection";

    // A tap picks: the detail slides in, the focus goes to its heading.
    await tap(row("Ben Okafor")); await wait(400);
    if (offset() !== 0 || heading().textContent !== "Ben Okafor") return `a tap: ${offset()}, ${heading().textContent}`;
    if (document.activeElement !== heading()) return "the heading does not take the focus";
    if (!out().includes("Open: m3") || !out().includes("Picked 1")) return "on_select: " + out();

    // A drag from the edge: short, it springs back.
    await edge(60, 0, 200);
    if (offset() !== 0 || !seen(mainP)) return `short drag: ${offset()}`;
    if (track.style.transform !== "") return "short drag leaves a transform: " + track.style.transform;
    // The middle of a drag follows the finger, by style, with both sides showing.
    const r = body.getBoundingClientRect(), p = { x: r.left + 12, y: r.bottom - 60 };
    await fingers("touchStart", [p]);
    for (const x of [14, 40, 90]) { await fingers("touchMove", [{ x: p.x + x, y: p.y }]); await wait(30); }
    if (track.style.transform !== "translateX(calc(-50% + 90px))") return "mid drag: " + track.style.transform;
    if (!seen(side)) return "mid drag: the list is not showing behind";
    // State changing under the finger, in the parent and through a prop, must not send the drag home.
    const read = $("#responsive-split-demo-read");
    read.click(); await wait(80);
    if (!out().includes("read 1")) return "mid drag: the state did not change: " + out();
    if (track.style.transform !== "translateX(calc(-50% + 90px))") return "a state change mid-drag moved it: " + track.style.transform;
    if (!host.classList.contains("ui-responsive-split-dragging")) return "a state change mid-drag ended the drag";
    await fingers("touchMove", [{ x: p.x + 120, y: p.y }]); await wait(40);
    if (track.style.transform !== "translateX(calc(-50% + 120px))") return "the drag stopped after a state change: " + track.style.transform;
    // The system takes the gesture: back as it was.
    await fingers("touchCancel", []); await wait(400);
    if (offset() !== 0 || track.style.transform !== "" || host.classList.contains("ui-responsive-split-dragging")) return "cancelled: " + track.style.transform;
    if (!seen(mainP) || seen(side)) return "cancelled: not back on the detail";
    if (out().includes("back 2")) return "a cancelled gesture went back";
    // Far enough: a third of the width, slowly.
    await edge(W * 0.45, 0, 500);
    if (offset() !== W) return `a long drag: ${offset()}`;
    if (!out().includes("back 2")) return "a long drag, on_back: " + out();
    await tap(row("Ben Okafor")); await wait(400);
    // A flick, short but fast.
    await edge(70, 0, 40);
    if (offset() !== W) return `a flick: ${offset()}`;
    await tap(row("Ben Okafor")); await wait(400);
    // Started away from the edge it is nothing, and upward it is the content's scroll.
    await edge(W * 0.6, 0, 300, "touchEnd", 120);
    if (offset() !== 0) return `away from the edge: ${offset()}`;
    await edge(6, -100, 200);
    if (offset() !== 0 || track.style.transform !== "") return "a scroll took the pane";
    await edge(-60, 0, 200);
    if (offset() !== 0) return "a drag to the left moved it";

    // Keys: Escape goes back, arrows walk the list, Enter is the button's.
    key(heading(), "Escape"); await wait(400);
    if (offset() !== W) return `Escape: ${offset()}`;
    const r3 = document.activeElement;
    if (r3 !== row("Ben Okafor")) return "Escape: focus";
    key(r3, "ArrowDown"); await wait(60);
    if (document.activeElement !== row("Sender 4")) return "ArrowDown: " + document.activeElement.textContent;
    key(document.activeElement, "ArrowUp"); key(document.activeElement, "ArrowUp"); await wait(60);
    if (document.activeElement !== row("Rooftop Deliveries")) return "ArrowUp: " + document.activeElement.textContent;
    document.activeElement.blur();

    // Rotation: on its side it opens up, with the selection and the typed text kept.
    await tap(row("Ana Silva")); await wait(400);
    const reply = $("#responsive-split-demo-reply");
    reply.focus(); document.execCommand("insertText", false, "See you there");
    await wait(60);
    await resize(H, W);
    if (host.clientWidth !== H) return `turned, the width: ${host.clientWidth}`;
    if (!seen(side) || !seen(mainP)) return "turned: both sides should show";
    if (side.getBoundingClientRect().width !== 320) return `turned, the list: ${side.getBoundingClientRect().width}`;
    if (offset() !== 320) return `turned, the detail starts at ${offset()}`;
    if (getComputedStyle(backBtn).display !== "none") return "turned: Back shows";
    if (row("Ana Silva").getAttribute("aria-current") !== "true") return "turned: selection lost";
    if ($("#responsive-split-demo-reply") !== reply || reply.value !== "See you there" || document.activeElement !== reply) return "turned: the reply was remade or lost focus";
    await resize(W, H);
    if (offset() !== 0 || seen(side) || document.activeElement !== reply || reply.value !== "See you there") return "turned back";
    // Focus in the list, then narrow with the detail showing: the focus follows to what shows.
    await resize(H, W);
    row("Ben Okafor").focus(); await wait(60);
    await resize(W, H);
    if (seen(side)) return "narrow again: the list shows";
    if (document.activeElement !== heading()) return "narrow again: focus left behind on " + document.activeElement.tagName;
    await tap(backBtn); await wait(400);
} else {
    // A tablet uses the room: both sides, no Back, and no slide.
    if (host.clientWidth !== W) return `the frame is ${host.clientWidth}, not ${W}`;
    if (!seen(side) || !seen(mainP) || side.getBoundingClientRect().width !== 320 || offset() !== 320) return `tablet: ${offset()}, list ${side.getBoundingClientRect().width}`;
    if (getComputedStyle(backBtn).display !== "none") return "tablet: Back shows";
    // Picking keeps the focus on the list, for the next pick.
    row("Ben Okafor").focus();
    await tap(row("Ben Okafor")); await wait(200);
    if (heading().textContent !== "Ben Okafor" || document.activeElement !== row("Ben Okafor")) return "tablet: a pick moved the focus";
    if (offset() !== 320) return "tablet: a pick moved the layout";
    // A drag from the edge of the detail is nothing here.
    await edge(300, 0, 300);
    if (offset() !== 320 || heading().textContent !== "Ben Okafor") return "tablet: a drag acted";
    key(heading(), "Escape"); await wait(100);
    if (offset() !== 320 || getComputedStyle(side).visibility !== "visible") return "tablet: Escape acted";

    // The list's scroll and the selection come through a turn to a narrow pane, as in Slide Over.
    list.scrollTop = 500; await wait(100);
    const text = $("#responsive-split-demo-reply");
    text.focus(); document.execCommand("insertText", false, "Noted");
    await resize(390, 844);
    if (host.clientWidth !== 390) return "narrow pane: " + host.clientWidth;
    if (offset() !== 0 || !seen(mainP) || seen(side)) return `narrow pane: a stack on the detail, ${offset()}`;
    if (heading().textContent !== "Ben Okafor") return "narrow pane: selection";
    if (document.activeElement !== text || text.value !== "Noted") return "narrow pane: the field";
    await tap(backBtn); await wait(400);
    if (list.scrollTop !== 500) return `the list's scroll: ${list.scrollTop}`;
    await resize(W, H);
    if (list.scrollTop !== 500) return `the list's scroll after turning back: ${list.scrollTop}`;
    if (row("Ben Okafor").getAttribute("aria-current") !== "true") return "the selection after turning back";
    if (!seen(side) || !seen(mainP)) return "wide again: both sides";
    // Back in a stack, the list showing stays the list's: no hidden detail is tabbed to.
    await resize(390, 844);
    if (offset() !== 390) return `a stack after Back stays on the list: ${offset()}`;
    await resize(W, H);
}
await resize(W, H);
