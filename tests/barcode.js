const P = ["11011001100","11001101100","11001100110","10010011000","10010001100","10001001100","10011001000","10011000100","10001100100","11001001000","11001000100","11000100100","10110011100","10011011100","10011001110","10111001100","10011101100","10011100110","11001110010","11001011100","11001001110","11011100100","11001110100","11101101110","11101001100","11100101100","11100100110","11101100100","11100110100","11100110010","11011011000","11011000110","11000110110","10100011000","10001011000","10001000110","10110001000","10001101000","10001100010","11010001000","11000101000","11000100010","10110111000","10110001110","10001101110","10111011000","10111000110","10001110110","11101110110","11010001110","11000101110","11011101000","11011100010","11011101110","11101011000","11101000110","11100010110","11101101000","11101100010","11100011010","11101111010","11001000010","11110001010","10100110000","10100001100","10010110000","10010000110","10000101100","10000100110","10110010000","10110000100","10011010000","10011000010","10000110100","10000110010","11000010010","11001010000","11110111010","11000010100","10001111010","10100111100","10010111100","10010011110","10111100100","10011110100","10011110010","11110100100","11110010100","11110010010","11011011110","11011110110","11110110110","10101111000","10100011110","10001011110","10111101000","10111100010","11110101000","11110100010","10111011110","10111101110","11101011110","11110101110","11010000100","11010010000","11010011100","1100011101011"];
const ascii = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
// The bars of a drawn code as a string of 1 and 0, without the quiet zones.
const modules = (svg) => {
    const total = Number(svg.getAttribute("viewBox").split(" ")[2]);
    const m = Array(total).fill("0");
    for (const r of svg.querySelector("path").getAttribute("d").matchAll(/M(\d+) 0h(\d+)v1h-\d+z/g))
        for (let i = 0; i < Number(r[2]); i++) m[Number(r[1]) + i] = "1";
    return m.join("").slice(10, total - 10);
};
// Reads a code back: checks the start, check symbol and stop, and gives the text.
const read = (svg) => {
    const m = modules(svg);
    if ((m.length - 13) % 11 !== 0) return { bad: `${m.length} modules` };
    const vals = [];
    for (let i = 0; i < m.length - 13; i += 11) {
        const v = P.indexOf(m.slice(i, i + 11));
        if (v < 0 || v > 105) return { bad: `unknown symbol at ${i}` };
        vals.push(v);
    }
    if (m.slice(-13) !== P[106]) return { bad: "no stop" };
    const check = vals.pop();
    if ((vals[0] + vals.slice(1).reduce((s, v, k) => s + (k + 1) * v, 0)) % 103 !== check) return { bad: "the check symbol is wrong" };
    let set = vals[0] === 105 ? "C" : "B", text = "";
    if (vals[0] !== 104 && vals[0] !== 105) return { bad: "no start B or C" };
    for (const v of vals.slice(1)) {
        if (v === 99) set = "C"; else if (v === 100) set = "B";
        else text += set === "C" ? String(v).padStart(2, "0") : ascii[v];
    }
    return { text, vals };
};
const ticket = $("#barcode-demo-ticket");
const svg = ticket.querySelector("svg");
if (svg.getAttribute("role") !== "img" || svg.getAttribute("aria-label") !== "Barcode: QA204-LHR-OPO") return "not a named image";
const t = read(svg);
if (t.bad || t.text !== "QA204-LHR-OPO") return `the ticket reads ${t.bad ?? t.text}`;
if (ticket.querySelector("figcaption").textContent !== "QA204-LHR-OPO") return "the text under it";
if (svg.getAttribute("width") !== String((modules(svg).length + 20) * 2)) return `bar=2 gives width ${svg.getAttribute("width")}`;
const digits = read($("#barcode-demo-digits svg"));
if (digits.bad || digits.text !== "0012345678905") return `digits read ${digits.bad ?? digits.text}`;
if (!digits.vals.includes(99) || digits.vals.length > 10) return `long digit runs do not use set C: ${digits.vals}`;
if ($("#barcode-demo-digits svg").getAttribute("height") !== "48") return "height";
const bare = $("#barcode-demo-bare");
if (bare.querySelector("figcaption") || bare.querySelector("svg").getAttribute("aria-label") !== "Order number") return "show_text and label";
if (!ticket.classList.contains("ui-light") || bare.classList.contains("ui-light")) return "only themed follows the theme";
const input = $("#barcode-demo-input");
type(input, "QA204-LHR-OPO"); await wait(400);
if ($("#barcode-demo-live svg path").getAttribute("d") !== svg.querySelector("path").getAttribute("d")) return "the browser's bars differ from the server's";
type(input, "Olá 1234"); await wait(400);
const ola = read($("#barcode-demo-live svg"));
if (ola.bad || ola.text !== "Ol? 1234") return `a non-ASCII letter: ${ola.bad ?? ola.text}`;
if (!input.closest(".demo-stack").querySelector(".demo-note").textContent.startsWith(`${ola.vals.length + 2} symbols`)) return "the note";
