if (document.documentElement.scrollWidth > innerWidth) return "widens the page";
const fig = $("figure.ui-brush");
if (!fig) return "no brush chart";
if (/NaN|Infinity|undefined/.test(fig.innerHTML)) return "the chart has NaN, Infinity or undefined in it";
const note = () => $(".demo-note").textContent;
const rows = [...fig.querySelectorAll("tbody tr")];
if (rows.length !== 240) return "the table does not have every label";
const day = (i) => rows[i].querySelector("th").textContent;
const shownRange = () => { const [p, q] = fig.querySelectorAll(".ui-brush-edge"); return [day(+p.getAttribute("aria-valuenow")), day(+q.getAttribute("aria-valuenow"))]; };
const pts = () => fig.querySelector(".ui-brush-plot .ui-brush-line").getAttribute("d").slice(1).split(" L").length;
// start={180} end={239}.
if (fig.querySelector(".ui-brush-x span").textContent !== day(180) || pts() !== 60) return `the window starts at ${shownRange()[0]} with ${pts()} points`;
const win = fig.querySelector(".ui-brush-win"), [e1, e2] = fig.querySelectorAll(".ui-brush-edge");
if (win.getAttribute("role") !== "slider" || win.tabIndex !== 0 || win.getAttribute("aria-valuetext") !== `${day(180)} to ${day(239)}`) return "the window is not a slider saying its range";
if (e1.getAttribute("aria-valuenow") !== "180" || e2.getAttribute("aria-valuenow") !== "239") return "the edges are not sliders at the ends of the range";
const mini = fig.querySelector(".ui-brush-mini");
if (Math.abs(parseFloat(win.style.left) - 180 / 239 * 100) > 0.01) return "the window is not where the range is in the overview";
// The large chart's tooltip.
const tip = fig.querySelectorAll(".ui-brush-col")[10].querySelector(".ui-brush-tip");
if (getComputedStyle(tip).display !== "none") return "the tooltip shows before hover";
if (tip.textContent !== `${day(190)}Closing price${rows[190].querySelector("td").textContent}`) return `tooltip: ${tip.textContent}`;
// Keys.
win.focus(); key(win, "PageDown"); await wait();
if (shownRange()[0] !== day(121) || !note().includes(`${day(121)} to ${day(180)}`)) return `PageDown moved the window to ${shownRange()} / ${note()}`;
key(win, "Home"); await wait();
if (shownRange()[0] !== day(0) || pts() !== 60) return "Home does not move the window to the start, keeping its width";
key(e2, "ArrowLeft"); await wait();
if (e2.getAttribute("aria-valuenow") !== "58" || pts() !== 59) return "ArrowLeft on the end edge does not narrow the window";
key(e1, "End"); await wait();
if (e1.getAttribute("aria-valuenow") !== "57") return "the start edge passes the end";
key(win, "End"); await wait();
if (shownRange()[1] !== day(239)) return "End does not move the window to the end";
// Dragging in the overview.
mini.scrollIntoView({ block: "center" });
mini.setPointerCapture = () => {};
const r = mini.getBoundingClientRect();
const pe = (el, t, i) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 1, button: 0, isPrimary: true,
    clientX: r.left + r.width * i / 239, clientY: r.top + r.height / 2 }));
const shade = [...mini.querySelectorAll(".ui-brush-shade")][0];
pe(shade, "pointerdown", 20); pe(mini, "pointermove", 50); pe(mini, "pointerup", 50); await wait();
if (shownRange()[0] !== day(20) || shownRange()[1] !== day(50) || !note().includes(`${day(20)} to ${day(50)}`)) return `drawing a new window made ${shownRange()} / ${note()}`;
pe(fig.querySelector(".ui-brush-win"), "pointerdown", 30); pe(mini, "pointermove", 40); pe(mini, "pointerup", 40); await wait();
if (shownRange()[0] !== day(30) || shownRange()[1] !== day(60)) return `moving the window made ${shownRange()}`;
pe(fig.querySelectorAll(".ui-brush-edge")[1], "pointerdown", 60); pe(mini, "pointermove", 100); pe(mini, "pointerup", 100); await wait();
if (shownRange()[1] !== day(100) || shownRange()[0] !== day(30)) return `dragging the end edge made ${shownRange()}`;
if (fig.querySelector(".ui-brush-y span:last-child").textContent[0] !== "$") return "the axis does not take the prefix";
