// mobile
const menu = $(".ui-pull-down-menu");
const head = $(".ui-pull-down-menu-head");
const panel = $(".ui-pull-down-menu-panel");
const button = $(".ui-pull-down-menu-button");
const rows = () => $$(".ui-pull-down-menu-row");
const did = () => $(".pull-down-menu-demo-did").textContent;
const opens = () => +$(".pull-down-menu-demo-opens").textContent;
const closes = () => +$(".pull-down-menu-demo-closes").textContent;
const showing = () => menu.classList.contains("ui-pull-down-menu-showing");
const settle = () => wait(300);
if (showing()) return "it starts open";
if (getComputedStyle(panel).pointerEvents !== "none" || !panel.inert) return "the closed menu can be reached";
const p = () => { const r = head.querySelector(".ui-pull-down-menu-title").getBoundingClientRect(); return { x: r.left + 40, y: r.top + r.height / 2 }; };
const pullTo = async (start, y) => { for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: start.x, y: start.y + (y - start.y) * i / 10 }]); await wait(16); } await wait(80); };

// A pull that falls short springs back, shows it on the way, and picks nothing.
let s = p();
await fingers("touchStart", [s]);
await pullTo(s, s.y + 30);
if (!showing()) return "pulling does not bring the menu";
const faded = +panel.style.opacity;
if (Math.abs(faded - 30 / 56) > 0.02) return `at 30 of 56 the menu is ${faded} shown`;
if ($$(".ui-pull-down-menu-over").length) return "a row lit before the menu was pulled out";
await fingers("touchEnd", []); await settle();
if (showing()) return "a short pull did not spring back";
if (head.style.transform !== "" || panel.style.opacity !== "") return "a short pull left its styles";
if (closes() !== 1) return "the short pull did not call on_close";
if (did() !== "nothing yet") return "a short pull picked something";

// Pulled and slid to a row, let go: it is done, in one movement.
const felt = [];
window.quilloNative = { haptic: (k) => { felt.push(k); } };
s = p();
await fingers("touchStart", [s]);
await pullTo(s, s.y + 70);
const r1 = rows()[1].getBoundingClientRect();
await pullTo({ x: s.x, y: s.y + 70 }, r1.top + r1.height / 2);
if (!rows()[1].classList.contains("ui-pull-down-menu-over")) return "the row under the finger does not light";
if (!felt.length || felt.some((k) => k !== "selection")) return `the phone felt ${felt}`;
delete window.quilloNative;
await fingers("touchEnd", []); await settle();
if (did() !== "read") return `sliding to a row gave ${did()}`;
if (showing()) return "picking did not close it";

// Slid over a disabled row: nothing lights, and letting go leaves it open.
s = p();
await fingers("touchStart", [s]);
const r2 = rows()[2].getBoundingClientRect();
await pullTo(s, r2.top + r2.height / 2);
if ($$(".ui-pull-down-menu-over").length) return "a disabled row lit";
await fingers("touchEnd", []); await settle();
if (!showing() || opens() !== 1) return "pulled far and let go on no row, it did not stay open";
if (did() !== "read") return "a disabled row was chosen";
if (panel.inert) return "the open menu is inert";
// Now it is a menu: a tap chooses.
await tap(rows()[0]); await settle();
if (did() !== "new" || showing()) return `a tap gave ${did()}`;

// The way back: pulled, then back up over the header: nothing happens.
s = p();
await fingers("touchStart", [s]);
await pullTo(s, s.y + 120);
await pullTo({ x: s.x, y: s.y + 120 }, s.y + 10);
await fingers("touchEnd", []); await settle();
if (showing()) return "pulled back up, it stayed";
// Cancelled by the system.
s = p();
await fingers("touchStart", [s]);
await pullTo(s, s.y + 90);
await fingers("touchCancel", []); await settle();
if (showing() || head.style.transform !== "") return "a cancelled pull left it out";
// A push up or sideways is not a pull.
await drag(head.querySelector(".ui-pull-down-menu-title"), 90, 3, 240); await settle();
if (showing()) return "a sideways drag opened it";
await drag(head.querySelector(".ui-pull-down-menu-title"), 2, -40, 240); await settle();
if (showing()) return "a push up opened it";

// The equal: the button, with keys.
await tap(button); await settle();
if (!showing() || button.getAttribute("aria-expanded") !== "true") return "the button does not open it";
if (document.activeElement !== rows()[0]) return "focus did not go to the first row";
key(rows()[0], "ArrowDown"); await wait(50);
key(rows()[1], "ArrowDown"); await wait(50);
if (document.activeElement !== rows()[3]) return "ArrowDown does not skip the disabled row";
key(rows()[3], "ArrowUp"); await wait(50);
if (document.activeElement !== rows()[1]) return "ArrowUp does not skip it either";
key(rows()[1], "ArrowUp"); key(rows()[0], "ArrowUp"); await wait(50);
if (document.activeElement !== rows()[4]) return "ArrowUp does not go round";
key(rows()[4], "Escape"); await settle();
if (showing()) return "Escape does not close it";
if (document.activeElement !== button) return "focus did not come back";
await tap(button); await settle();
await tap(rows()[4]); await settle();
if (did() !== "trash") return `the destructive row gave ${did()}`;
// Tap away.
await tap(button); await settle();
await fingers("touchStart", [{ x: 6, y: innerHeight - 8 }]); await fingers("touchEnd", []); await settle();
if (showing()) return "a tap away does not close it";
await tap(button); await settle();
await tap(button); await settle();
if (showing()) return "the button does not close it";

// Width: a band on a phone, a small menu on a tablet.
await tap(button); await settle();
const box = panel.getBoundingClientRect(), bar = head.getBoundingClientRect();
if (device === "phone" && Math.abs(box.width - bar.width) > 2) return `on a phone the menu is ${box.width} of ${bar.width}`;
if (device === "tablet" && (box.width !== 300 || Math.abs(box.right - (bar.right - 8)) > 1)) return `on a tablet the menu is ${box.width} wide, ending at ${box.right} of ${bar.right}`;
key(rows()[0], "Escape"); await settle();

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(panel).transitionDuration;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "0s") return `with reduced motion: ${still}`;
