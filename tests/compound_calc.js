// A turn of the event loop in place of wait(): the page settles in one, and these tests make hundreds of changes.
const tick = () => new Promise((r) => { const m = new MessageChannel(); m.port1.onmessage = () => { m.port1.close(); r(); }; m.port2.postMessage(0); });
const c = $("#compound-calc-demo-title").closest(".ui-compound-calc");
const s = (k, x = c) => x.querySelector(`[data-key=${k}]`)?.textContent.trim();
const row = (i, x = c) => [...x.querySelectorAll("tbody tr")[i].cells].map((d) => d.textContent).join(" ");
const alert = (x = c) => x.querySelector("[role=alert]")?.textContent ?? "";
const f = (n, x = "compound-calc-demo") => $(`#${x}-${n}`);
const sel = (el, v) => { el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); };
// Worked independently to 60 digits.
if (s("balance") !== "$144,572.72" || s("contributed") !== "$48,000.00" || s("interest") !== "$86,572.72") return `start: ${s("balance")} ${s("contributed")} ${s("interest")}`;
if (row(0) !== "1 $2,400.00 $801.42 $13,201.42 $13,201.42") return `year 1: ${row(0)}`;
if (c.querySelectorAll("tbody tr").length !== 20) return "rows";
// Each row's parts add up to the next balance, to the cent.
const cents = (t) => Math.round(Number(t.replace(/[^0-9.-]/g, "")) * 100);
let run = 1000000;
for (const r of c.querySelectorAll("tbody tr")) { run += cents(r.cells[1].textContent) + cents(r.cells[2].textContent); if (run !== cents(r.cells[3].textContent)) return `rows do not add up at ${r.cells[0].textContent}`; }
// At the start of each period; other compounding, equivalent rates by root and by power.
c.querySelector("input[value=start]").click(); await tick();
if (s("balance") !== "$145,180.47") return `start of period: ${s("balance")}`;
c.querySelector("input[value=end]").click(); await tick();
sel(f("compounding"), "1"); await tick();
if (s("balance") !== "$140,204.12") return `yearly compounding: ${s("balance")}`;
sel(f("compounding"), "365"); await tick();
if (s("balance") !== "$144,982.48") return `daily compounding: ${s("balance")}`;
sel(f("compounding"), "12"); await tick();
// Bad input.
for (const [n, t, want] of [["start", "abc", "starting amount"], ["start", "-1", "starting amount"], ["contribution", "12,50", "contribution"], ["rate", "1001", "rate"], ["rate", "五", "rate"],
    ["years", "0", "years"], ["years", "1.5", "years"], ["years", "101", "years"], ["years", "", "years"], ["inflation", "x", "inflation"], ["target", "lots", "target"], ["start", "1e30", "starting amount"]]) {
    const was = f(n).value;
    type(f(n), t); await tick();
    if (!alert().includes(want) || c.querySelector(".ui-compound-calc-out")) return `${n} ${t}: ${alert()}`;
    if (f(n).getAttribute("aria-invalid") !== "true") return `${n} ${t} aria-invalid`;
    type(f(n), was);
}
await tick();
// The target: 9.22% reaches 200,000, 9.21% does not.
type(f("target"), "200,000"); await tick();
if (s("needed") !== "Reaching $200,000.00 takes a rate of 9.22% a year.") return `needed: ${s("needed")}`;
type(f("target"), "50000"); await tick();
if (s("needed") !== "The contributions alone reach $50,000.00, with no interest.") return `alone: ${s("needed")}`;
type(f("target"), ""); await tick();
if (s("needed")) return "no target";
// Zero rate, nothing at all, and an absurd rate that must stop rather than overflow.
type(f("rate"), "0"); await tick();
if (s("balance") !== "$58,000.00" || s("interest") !== "$0.00") return `no interest: ${s("balance")} ${s("interest")}`;
type(f("start"), ""); type(f("contribution"), ""); await tick();
if (s("balance") !== "$0.00") return `nothing: ${s("balance")}`;
type(f("start"), "1"); type(f("rate"), "1000"); type(f("years"), "100"); type(f("target"), "9999999999999"); sel(f("compounding"), "365"); await tick();
if (!c.querySelector(".ui-compound-calc-note")?.textContent.includes("passes 10 trillion")) return "no stop";
if (c.querySelectorAll("tbody tr").length !== 3) return `rows before stopping: ${c.querySelectorAll("tbody tr").length}`;
const t0 = performance.now();
type(f("start"), "1000000000000"); type(f("contribution"), "1000000000"); type(f("years"), "100"); type(f("target"), "10000000000000"); await tick();
if (performance.now() - t0 > 500) return `too slow: ${performance.now() - t0}`;
await tick();
type(f("start"), "1"); type(f("contribution"), "0"); type(f("years"), "1"); type(f("rate"), "5"); type(f("target"), "10000"); await tick();
if (s("needed") !== "Reaching $10,000.00 takes a rate of 932.76% a year.") return `a huge rate: ${s("needed")}`;
type(f("target"), "100000"); await tick();
if (s("needed") !== "No rate up to 1000% reaches $100,000.00.") return `no rate: ${s("needed")}`;
// The second: yearly at the start with daily interest, inflation and a target, and on_change.
const d = $("#compound-calc-demo-live-title").closest(".ui-compound-calc");
const note = () => d.closest(".demo-stack").querySelector(".demo-note").textContent;
if (s("balance", d) !== "€104,638.64" || s("real", d) !== "€49,885.71") return `live: ${s("balance", d)} ${s("real", d)}`;
if (row(0, d).split(" ").pop() !== "€6,184.60") return `real, year 1: ${row(0, d)}`;
if (s("needed", d) !== "Reaching €500,000.00 takes a rate of 12.02% a year.") return `live needed: ${s("needed", d)}`;
type(f("target", "compound-calc-demo-live"), "500,000.00"); await tick();
if (note() !== "on_change: balance 104638.64, interest 69638.64, needed 12.02.") return `on_change: ${note()}`;
