// The modules of a code, from its path: a grid of 0 and 1 without the quiet zone.
const grid = (svg) => {
    const box = svg.getAttribute("viewBox").split(" ").map(Number)[2];
    const n = box - 8;
    const g = Array.from({ length: n }, () => Array(n).fill(0));
    for (const m of svg.querySelector("path").getAttribute("d").matchAll(/M(\d+) (\d+)h(\d+)v1h-\d+z/g)) {
        const [x, y, w] = [Number(m[1]) - 4, Number(m[2]) - 4, Number(m[3])];
        for (let i = 0; i < w; i++) g[y][x + i] = 1;
    }
    return g;
};
const formats = ["101010000010010", "101000100100101", "101111001111100", "101101101001011", "100010111111001", "100000011001110", "100111110010111", "100101010100000"];
const check = (svg, name) => {
    const g = grid(svg), n = g.length;
    if ((n - 17) % 4 !== 0) return `${name}: ${n} modules is not a version's size`;
    const finder = (r0, c0) => { for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) { const d = Math.max(Math.abs(r - 3), Math.abs(c - 3)); if (g[r0 + r][c0 + c] !== (d === 2 ? 0 : 1)) return false; } return true; };
    if (!finder(0, 0) || !finder(0, n - 7) || !finder(n - 7, 0)) return `${name}: a finder pattern is wrong`;
    for (let i = 8; i < n - 8; i++) if (g[6][i] !== (i + 1) % 2 || g[i][6] !== (i + 1) % 2) return `${name}: the timing pattern is wrong at ${i}`;
    if (g[n - 8][8] !== 1) return `${name}: no dark module`;
    let a = "", b = "";
    for (let i = 14; i >= 0; i--) {
        a += g[i <= 5 ? i : i === 6 ? 7 : 8][i <= 7 ? 8 : i === 8 ? 7 : 14 - i];
        b += g[i <= 7 ? 8 : n - 15 + i][i <= 7 ? n - 1 - i : 8];
    }
    if (a !== b || !formats.includes(a)) return `${name}: format information ${a} / ${b} is not level M`;
    return null;
};
const site = $("#qr-code-demo-site svg");
if (site.getAttribute("role") !== "img" || site.getAttribute("aria-label") !== "QR code: https://quillolang.org/components") return "the code is not a named image";
if (site.getAttribute("width") !== "160" || site.getAttribute("data-version") !== "3") return `size ${site.getAttribute("width")}, version ${site.getAttribute("data-version")}`;
for (const [sel, name] of [["#qr-code-demo-site svg", "site"], ["#qr-code-demo-wifi svg", "wifi"], ["#qr-code-demo-themed svg", "themed"], ["#qr-code-demo-live svg", "live"]]) {
    const bad = check($(sel), name);
    if (bad) return bad;
}
if ($("#qr-code-demo-site figcaption").textContent !== "quillolang.org/components") return "the caption";
if ($("#qr-code-demo-wifi svg").getAttribute("aria-label") !== "Wi-Fi: Quillo Café") return "label";
if (!$("#qr-code-demo-site").classList.contains("ui-light") || $("#qr-code-demo-themed").classList.contains("ui-light")) return "only themed follows the page's theme";
if (!$("#qr-code-demo-long .ui-qr-code-error")?.textContent.includes("300 bytes, 213 at most")) return "too long text does not say so";
// The browser draws what the server drew.
const input = $("#qr-code-demo-input");
type(input, "https://quillolang.org/components"); await wait(400);
const live = $("#qr-code-demo-live svg");
if (live.querySelector("path").getAttribute("d") !== site.querySelector("path").getAttribute("d")) return "the browser's code differs from the server's for the same text";
const note = input.closest(".demo-stack").querySelector(".demo-note").textContent;
if (!note.startsWith("33 bytes")) return `note: ${note}`;
type(input, "Olá, mundo! ✓"); await wait(400);
if ($("#qr-code-demo-live svg path").getAttribute("d") !== $("#qr-code-demo-themed svg path").getAttribute("d")) return "UTF-8 text: the browser's code differs from the server's";
type(input, "z".repeat(150)); await wait(800);
const big = $("#qr-code-demo-live svg");
if (big.getAttribute("data-version") !== "8") return `150 bytes: version ${big.getAttribute("data-version")}`;
const bad = check(big, "live v8");
if (bad) return bad;
