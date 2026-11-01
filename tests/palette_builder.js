const c = $("#palette-builder-demo");
const base = $("#palette-builder-demo-base");
const lin = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const unhex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h) => { const [r, g, b] = unhex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hsl = (h) => { let [r, g, b] = unhex(h); r /= 255; g /= 255; b /= 255; const M = Math.max(r, g, b), m = Math.min(r, g, b), d = M - m, l = (M + m) / 2; if (!d) return [0, 0, l];
    return [M === r ? 60 * (((g - b) / d + 6) % 6) : M === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4), d / (1 - Math.abs(2 * l - 1)), l]; };
const scale = () => [...c.querySelectorAll("[data-step]")].map((e) => ({ step: +e.dataset.step, hex: e.querySelector("span").textContent, base: e.classList.contains("ui-palette-base") }));
const check = (hex) => {
    const s = scale();
    if (s.map((x) => x.step).join() !== "50,100,200,300,400,500,600,700,800,900,950") return `the steps: ${s.map((x) => x.step)}`;
    const b = s.filter((x) => x.base);
    if (b.length !== 1 || b[0].hex !== hex) return `the base stands at one step exactly: ${JSON.stringify(b)}, wanted ${hex}`;
    for (let i = 1; i < s.length; i++) if (lum(s[i].hex) > lum(s[i - 1].hex) + 1e-9) return `${s[i].step} is lighter than ${s[i - 1].step}: ${s[i].hex}, ${s[i - 1].hex}`;
    const [h0, s0] = hsl(hex);
    if (s0 > 0.05) for (const x of s) { const [h, sat, l] = hsl(x.hex); if (l > 0.08 && l < 0.92 && Math.min(Math.abs(h - h0), 360 - Math.abs(h - h0)) > 4) return `${x.step} lost the hue: ${h} vs ${h0}`; }
    return null;
};
let e = check("#5b4bdb"); if (e) return e;
// #5b4bdb has lightness .576, nearest the mark of 500 (.6).
if (scale().find((x) => x.base).step !== 500) return `the base's step: ${scale().find((x) => x.base).step}`;
for (const [t, hex, step] of [["#ffffff", "#ffffff", 50], ["#000", "#000000", 950], ["#808080", "#808080", 600], ["hsl(160, 60%, 35%)", "#248f6b", 700], ["rgb(255, 0, 0)", "#ff0000", 600]]) {
    type(base, t); await wait(80);
    e = check(hex); if (e) return `${t}: ${e}`;
    if (scale().find((x) => x.base).step !== step) return `${t}: step ${scale().find((x) => x.base).step}, wanted ${step}`;
}
type(base, "#5b4bdb"); await wait(80);
// Pairs: count them here on their own and compare with the sentence and the cells.
const s = scale();
let aa = 0, aaa = 0;
for (let i = 0; i < s.length; i++) for (let j = i + 1; j < s.length; j++) { const r = cr(s[i].hex, s[j].hex); if (r >= 4.5) aa++; if (r >= 7) aaa++; }
const count = c.querySelector(".ui-palette-count").textContent;
if (count !== `Of the 55 pairs of steps, ${aa} reach AA (4.5:1) and ${aaa} reach AAA (7:1).`) return `${count}, wanted ${aa} and ${aaa}`;
for (const a of s) for (const b of s) {
    const r = cr(a.hex, b.hex), want = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA+" : "";
    const got = c.querySelector(`[data-pair="${a.step}-${b.step}"]`).textContent;
    if (got !== want) return `${a.step} on ${b.step}: ${got}, wanted ${want} (${r})`;
}
// Semantic: each but primary reaches 4.5 on white, and `on` is the better of the two.
const role = (n) => { const li = c.querySelector(`[data-role=${n}]`); return li.querySelectorAll("span")[0].textContent; };
if (role("primary") !== "#5b4bdb") return `primary: ${role("primary")}`;
for (const n of ["success", "warning", "danger", "info", "neutral"]) {
    if (cr(role(n), "#ffffff") < 4.5) return `${n} ${role(n)} does not reach 4.5 on white: ${cr(role(n), "#ffffff")}`;
    const best = cr(role(n), "#ffffff") >= cr(role(n), "#000000") ? "#ffffff" : "#000000";
    if (!c.querySelector(`[data-role=${n}]`).textContent.endsWith(`with ${best}`)) return `${n} should carry ${best}: ${c.querySelector(`[data-role=${n}]`).textContent}`;
}
const hueOf = (n) => hsl(role(n))[0];
if (Math.abs(hueOf("success") - 145) > 3 || Math.abs(hueOf("warning") - 38) > 3 || Math.abs(hueOf("danger") - 4) > 3 || Math.abs(hueOf("info") - 205) > 3) return `semantic hues: ${["success", "warning", "danger", "info"].map(hueOf)}`;
// Export.
const out = () => c.querySelector("pre").textContent;
const lines = out().split("\n");
if (lines[0] !== ":root {" || lines[1] !== `  --brand-50: ${s[0].hex};` || lines[6] !== "  --brand-500: #5b4bdb;" || !out().includes("  --brand-on-primary: #ffffff;") || !out().endsWith("}\n")) return `the CSS: ${out().slice(0, 120)}`;
type($("#palette-builder-demo-prefix"), " My Brand! "); await wait(60);
if (!out().includes("--my-brand-500: #5b4bdb;")) return `the prefix is made safe: ${out().slice(0, 80)}`;
type($("#palette-builder-demo-prefix"), "9*"); await wait(60);
if (!out().includes("--c-9-500:")) return `a prefix starting with a digit: ${out().slice(0, 80)}`;
type($("#palette-builder-demo-prefix"), "   "); await wait(60);
if (!out().includes("--brand-500:")) return "an empty prefix";
const sel = $("#palette-builder-demo-format");
sel.value = "json"; sel.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
const j = JSON.parse(out());
if (j.scale["500"] !== "#5b4bdb" || Object.keys(j.scale).length !== 11 || j.semantic.primary.color !== "#5b4bdb" || j.semantic.primary.on !== "#ffffff" || Object.keys(j.semantic).join() !== "primary,success,warning,danger,info,neutral") return `the JSON: ${out().slice(0, 200)}`;
// Bad input.
for (const [t, msg] of [["", "Enter a colour, such as #3366cc."], ["blue", "\"blue\" is not a colour: use hex, rgb() or hsl()."], ["#12345", "A hex colour has 3 or 6 digits; \"#12345\" has 5."]]) {
    type(base, t); await wait(60);
    if (document.getElementById(base.getAttribute("aria-describedby"))?.textContent !== msg || c.querySelector("[data-step]") || c.querySelector("pre")) return `bad base ${t}`;
}
// The JSON format stays, on_change works.
const b2 = $("#palette-builder-demo-live-base");
const note = () => b2.closest(".demo-stack").querySelector(".demo-note:last-child").textContent;
const live = $("#palette-builder-demo-live");
if (!live.querySelector("pre").textContent.startsWith("{")) return "format=json should start on JSON";
type(b2, "#000000"); await wait(80);
const five = live.querySelector("[data-step='500'] span").textContent;
if (!note().includes(five)) return note();
type(b2, "x"); await wait(80);
if (note() !== "on_change: not a colour.") return note();
