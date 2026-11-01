const c = $("#color-contrast-demo");
const fg = $("#color-contrast-demo-fg"), bg = $("#color-contrast-demo-bg");
const ratio = () => c.querySelector(".ui-ccontrast-ratio strong")?.textContent;
const level = (id) => c.querySelector(`[data-level=${id}]`).classList.contains("ui-ccontrast-pass");
const levels = () => ["aa", "aaa", "aa-large", "aaa-large"].map(level).join();
const why = (el) => document.getElementById(el.getAttribute("aria-describedby"))?.textContent ?? null;
// #777 on white is 4.478, which rounds to 4.48: fails AA, passes large.
if (ratio() !== "4.47:1" || levels() !== "false,false,true,false") return `#777 on white: ${ratio()} ${levels()}`;
if (fg.name !== "foreground" || bg.name !== "background" || fg.labels[0].textContent !== "Text colour") return "the names and labels of the fields";
const table = [
    ["#000", "#fff", "21.00:1", "true,true,true,true"],
    ["#ffffff", "rgb(0, 0, 0)", "21.00:1", "true,true,true,true"],
    ["#767676", "#fff", "4.54:1", "true,false,true,true"],
    ["#ff0000", "#ffffff", "3.99:1", "false,false,true,false"],
    ["#0000ff", "#ffffff", "8.59:1", "true,true,true,true"],
    ["rgb(255 255 0)", "white-ish", null, null],
    ["hsl(0, 100%, 50%)", "#fff", "3.99:1", "false,false,true,false"],
    ["hsl(120deg 100% 25%)", "#fff", "5.13:1", "true,false,true,true"],
    ["hsl(480, 100%, 25%)", "#fff", "5.13:1", "true,false,true,true"],
    ["rgb(100%, 0%, 0%)", "#FFF", "3.99:1", "false,false,true,false"],
    ["#abcdef", "#abcdef", "1.00:1", "false,false,false,false"],
    ["  #000000FF  ", "#ffff", "21.00:1", "true,true,true,true"],
];
for (const [f, b, r, l] of table) {
    type(fg, f); type(bg, b); await wait(60);
    if (r === null) { if (ratio() !== undefined) return `${b} should be refused`; continue; }
    if (ratio() !== r || levels() !== l) return `${f} on ${b}: ${ratio()} ${levels()}, wanted ${r} ${l}`;
}
type(bg, "#fff");
const bad = [
    ["", "Enter a colour, such as #3366cc."],
    ["   ", "Enter a colour, such as #3366cc."],
    ["#12", "A hex colour has 3 or 6 digits; \"#12\" has 2."],
    ["#12345", "A hex colour has 3 or 6 digits; \"#12345\" has 5."],
    ["#ggg", "\"#ggg\" has something other than the hex digits 0 to 9 and a to f."],
    ["red", "\"red\" is not a colour: use hex, rgb() or hsl()."],
    ["rgb(300, 0, 0)", "300 is outside 0 to 255."],
    ["rgb(-1, 0, 0)", "-1 is outside 0 to 255."],
    ["rgb(1, 2)", "rgb() takes three numbers; this has 2."],
    ["rgb(a, b, c)", "\"a\" is not a number."],
    ["rgb(1, 2, 3", "A bracket is missing at the end."],
    ["hsl(10, 200%, 50%)", "Saturation and lightness go from 0% to 100%."],
    ["hsl(x, 20%, 50%)", "\"x\" is not a hue: give degrees, such as 220."],
    ["lab(50% 40 59)", "lab() is not taken: use hex, rgb() or hsl()."],
    ["#00000080", "A see-through colour has no contrast of its own: give a solid one."],
    ["rgba(0, 0, 0, .5)", "A see-through colour has no contrast of its own: give a solid one."],
    ["rgb(0 0 0 / 50%)", "A see-through colour has no contrast of its own: give a solid one."],
    ["🎨", "\"🎨\" is not a colour: use hex, rgb() or hsl()."],
    ["#".repeat(100), "That is too long to be a colour."],
];
for (const [t, msg] of bad) {
    type(fg, t); await wait(40);
    if (why(fg) !== msg) return `bad input ${JSON.stringify(t)}: ${why(fg)}`;
    if (fg.getAttribute("aria-invalid") !== "true" || ratio() !== undefined) return `bad input ${t} still judged`;
}
for (const t of ["rgba(0, 0, 0, 1)", "rgb(0 0 0 / 100%)", "000", "#000f", "RGB(0,0,0)"]) {
    type(fg, t); await wait(40);
    if (ratio() !== "21.00:1") return `${t} should be black: ${ratio()} ${why(fg)}`;
}

// The nearest colour, worked out here on its own by walking lightness a step at a time.
const lin = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const unhex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m, l = (M + m) / 2; if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1)); const h = M === r ? 60 * (((g - b) / d + 6) % 6) : M === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4); return [h, s, l]; };
const fromHsl = (h, s, l) => { const c = (1 - Math.abs(2 * l - 1)) * s, m = l - c / 2, x = h / 60; return [5, 3, 1].map((n) => { const k = (n + x) % 6; return Math.round((m + c - c * Math.max(0, Math.min(k, 4 - k, 1))) * 255); }); };
type(fg, "#777777"); type(bg, "#ffffff"); await wait(60);
const fix = (id) => c.querySelector(`[data-fix="${id}"]`);
const aaText = fix("text-4.5")?.querySelector("code")?.textContent;
if (aaText !== "#767676") return `the nearest AA text colour for #777 on white is #767676, the known edge: got ${aaText}`;
if (fix("text-4.5").querySelector("small").textContent !== "4.54:1") return `its ratio: ${fix("text-4.5").querySelector("small").textContent}`;
// A coloured one: keeps hue and saturation, passes, and a step less of a move fails.
type(fg, "#ff8800"); await wait(60);
const was = hsl(unhex("#ff8800"));
const got = fix("text-4.5").querySelector("code").textContent;
const gh = hsl(unhex(got));
if (cr(unhex(got), [255, 255, 255]) < 4.5) return `${got} does not reach 4.5`;
if (Math.abs(gh[0] - was[0]) > 1.5 || Math.abs(gh[1] - was[1]) > 0.03) return `hue or saturation moved: ${got} ${gh}`;
if (cr(fromHsl(was[0], was[1], gh[2] + 0.01), [255, 255, 255]) >= 4.5) return `${got} is not the nearest: a lighter one passes`;
// One click uses it, and AA then passes.
fix("text-4.5").querySelector("button").click(); await wait(80);
if (fg.value !== got || !level("aa")) return `Use it: ${fg.value} ${levels()}`;
if (fix("text-4.5")) return "a level that passes still offers a fix";
// Keyboard: the button is a button; Swap swaps.
type(fg, "#111111"); type(bg, "#eeeeee"); await wait(60);
c.querySelector(".ui-ccontrast-swap").click(); await wait(60);
if (fg.value !== "#eeeeee" || bg.value !== "#111111" || c.querySelector("[data-fix]")) return `Swap: ${fg.value} ${bg.value}`;
if (c.querySelector(".ui-ccontrast-note").textContent !== "Passes every level: nothing to change.") return "the all clear";
// Mid grey on mid grey: AAA can be reached only one way, or not at all.
type(fg, "#808080"); type(bg, "#808080"); await wait(80);
const none = fix("back-7");
if (!none || !fix("text-7").textContent.includes("No shade")) return `#808080 cannot reach 7:1 on #808080 in text: ${fix("text-7")?.textContent}`;
// The sample shows the colours.
type(fg, "#123456"); type(bg, "#fedcba"); await wait(60);
const s = c.querySelector(".ui-ccontrast-sample");
if (getComputedStyle(s).color !== "rgb(18, 52, 86)" || getComputedStyle(s).backgroundColor !== "rgb(254, 220, 186)") return `the sample: ${s.style.cssText}`;
// on_change and name.
const fg2 = $("#color-contrast-demo-live-fg");
if (fg2.name !== "banner_foreground") return `name: ${fg2.name}`;
const note = () => $("#color-contrast-demo-live").closest(".demo-stack").querySelector(".demo-note").textContent;
type(fg2, "#000"); await wait(80);
if (note() !== "on_change: #000000 on #fff7e6, AA passes.") return note();
type(fg2, "nope"); await wait(80);
if (note() !== "on_change: not a colour.") return note();
