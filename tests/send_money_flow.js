// mobile
const flow = $(".ui-sendflow");
const q = (s) => flow.querySelector(s), qq = (s) => [...flow.querySelectorAll(s)];
const step = () => q(".ui-sendflow-head p").textContent, log = () => $("#sendflow-log").textContent;
const foot = () => q(".ui-sendflow-foot .ui-btn"), err = () => qq(".ui-sendflow-step:not([hidden]) .ui-sendflow-err").map((e) => e.textContent).join("|");
const payee = (n) => qq(".ui-sendflow-payee").find((b) => b.textContent.includes(n));
const amt = () => q("#ui-sendflow-amount"), note = () => q("#ui-sendflow-note");
const seen = () => document.activeElement?.textContent;
if (step() !== "Step 1 of 4" || q(".ui-sendflow-back")) return "start: " + step();
// Nothing chosen: says so, stays.
await tap(foot());
if (step() !== "Step 1 of 4" || err() !== "Choose who to send to") return "nothing chosen: " + err();
// Search filters the saved.
type(q("#ui-sendflow-query"), "harb"); await wait(100);
if (qq(".ui-sendflow-payee").length !== 1) return "search: " + qq(".ui-sendflow-payee").length;
type(q("#ui-sendflow-query"), "zzz"); await wait(100);
if (!/No one saved/.test(q(".ui-sendflow-list").textContent)) return "search empty";
type(q("#ui-sendflow-query"), ""); await wait(100);
// A new payee is checked.
type(q("#ui-sendflow-name"), "Bo"); await wait(60);
await tap(foot());
if (err() !== "Enter the payee's account") return "new payee: " + err();
type(q("#ui-sendflow-account"), "bad<acct"); await wait(60);
await tap(foot());
if (!/letters, digits/.test(err())) return "bad account: " + err();
// Choosing a saved one takes over.
type(q("#ui-sendflow-name"), ""); type(q("#ui-sendflow-account"), ""); await wait(60);
await tap(payee("Ana Reyes"));
if (payee("Ana Reyes").getAttribute("aria-pressed") !== "true") return "picked";
await tap(foot()); await wait(120);
if (step() !== "Step 2 of 4") return "on: " + step();
if (seen() !== "How much?") return "focus goes to the step's heading: " + seen();
// Typing does not remake the field: the same element, still focused, after state changes.
const field = amt(); field.focus(); type(field, "1"); await wait(80); type(field, "12"); await wait(80);
if (amt() !== field || document.activeElement !== field) return "typing remakes the field";
type(field, ""); await wait(60);
// Every limit is written out.
const limits = () => qq(".ui-sendflow-limits li").map((l) => l.textContent);
if (limits().join("|") !== "Your balance$2,481.07|Smallest transfer$1.00|Most in one transfer$1,000.00|Left of today's limit$750.00|Left of this month's limit$4,000.00|Fee for this transfer$1.50") return "limits: " + limits().join("|");
await tap(foot());
if (err() !== "Enter an amount") return "no amount: " + err();
// Known answers for each limit, by the amount that goes past it.
const says = async (text, want) => { type(amt(), text); await wait(80); const got = q("#ui-sendflow-amount-says").textContent; if (got !== want) return text + ": " + got; };
let r;
if (r = await says("0.50", "That is $0.50 below the smallest transfer of $1.00")) return r;
if (r = await says("2480", "With the fee that is $0.43 more than your balance of $2,481.07")) return r;
if (r = await says("1000.01", "That is $0.01 over: most in one transfer is $1,000.00")) return r;
if (r = await says("750.01", "That is $0.01 over: left of today's limit is $750.00")) return r;
if (!q(".ui-sendflow-over")) return "the broken limit is marked";
if (r = await says("750", "$751.50 will leave your account, with the fee")) return r;
if (q(".ui-sendflow-over")) return "nothing is marked now";
// Amounts as people write them, and bad ones, which say so at Continue.
for (const [text, want] of [["abc", "That is not an amount"], ["12.345", "USD has 2 decimals at most"], ["0", "Enter an amount above zero"], ["1e3", "That is not an amount"], ["1.2.3", "That is not an amount"], ["-5", "That is not an amount"]]) {
    type(amt(), text); await wait(60);
    await tap(foot());
    if (err() !== want) return text + " says: " + err();
    if (step() !== "Step 2 of 4") return text + " went on";
}
// "1,234.50" and "1.234,50" are one number; over the limit, which proves the reading.
if (r = await says("1,234.50", "That is $234.50 over: most in one transfer is $1,000.00")) return r;
if (r = await says("1.234,50", "That is $234.50 over: most in one transfer is $1,000.00")) return r;
if (r = await says("12,5", "$14.00 will leave your account, with the fee")) return r;
if (r = await says("1,234", "That is $234.00 over: most in one transfer is $1,000.00")) return r;
// What cannot be told apart is refused, never guessed: this one is 1.234 or 1234.
type(amt(), "1.234"); await wait(60);
await tap(foot());
if (err() !== "USD has 2 decimals at most" || step() !== "Step 2 of 4") return "1.234: " + err();
type(amt(), "25.10"); await wait(60);
await tap(foot()); await wait(120);
if (step() !== "Step 3 of 4") return "to the note: " + step();
type(note(), "x".repeat(141)); await wait(60);
await tap(foot());
if (step() !== "Step 3 of 4" || !/1 too long/.test(err())) return "a long note: " + err();
// An emoji is one character.
type(note(), "Lunch 🍜"); await wait(60);
if (!/^7 of 140/.test(qq(".ui-sendflow-step:not([hidden]) .ui-sendflow-hint")[0].textContent)) return "characters: " + qq(".ui-sendflow-step:not([hidden]) .ui-sendflow-hint")[0].textContent;
// Back keeps it all, with the button.
await tap(q(".ui-sendflow-back")); await wait(200);
if (step() !== "Step 2 of 4" || amt().value !== "25.10") return "back keeps the amount: " + step() + " " + amt().value;
await tap(q(".ui-sendflow-back")); await wait(200);
if (step() !== "Step 1 of 4" || payee("Ana Reyes").getAttribute("aria-pressed") !== "true") return "back keeps the payee: " + step();
await tap(foot()); await wait(150);
await tap(foot()); await wait(150);
if (step() !== "Step 3 of 4" || note().value !== "Lunch 🍜") return "forward keeps the note: " + note().value;
// The browser's or phone's own back goes a step, and the keys typed stay.
const entries = (await cdp("Page.getNavigationHistory", {}));
await cdp("Page.navigateToHistoryEntry", { entryId: entries.entries[entries.currentIndex - 1].id }); await wait(300);
if (step() !== "Step 2 of 4" || amt().value !== "25.10") return "the system's back: " + step();
await tap(foot()); await wait(150);
await tap(foot()); await wait(200);
if (step() !== "Step 4 of 4") return "the last look: " + step();
const row = (l) => qq('[data-step="3"] .ui-sendflow-row').find((d) => d.querySelector("dt").textContent === l).querySelector("dd").textContent;
if (row("Amount") !== "$25.10" || row("Fee") !== "$1.50" || row("Total leaving your account") !== "$26.60" || row("Note") !== "Lunch 🍜" || row("To") !== "Ana Reyes\n•• 4021") return "the last look's lines: " + row("Total leaving your account");
if (foot().textContent.trim() !== "Send $26.60") return "the button: " + foot().textContent;
// A line changes and comes back here.
await tap(q('[aria-label="Change amount"]')); await wait(200);
if (step() !== "Step 2 of 4" || foot().textContent.trim() !== "Back to the last look") return "change: " + step() + foot().textContent;
type(amt(), "30"); await wait(60);
await tap(foot()); await wait(200);
if (step() !== "Step 4 of 4" || row("Total leaving your account") !== "$31.50") return "changed: " + row("Total leaving your account");
// Refused: stays with everything, and a second try keeps the key.
await tap(foot()); await wait(250);
if (err() !== "Your bank declined this." || step() !== "Step 4 of 4") return "refused: " + err();
await tap(foot()); await wait(300);
const ks = $("#sendflow-keys").textContent.split(",");
if (ks.length !== 2 || ks[0] !== ks[1]) return "one key for both tries: " + ks;
if (log() !== "Sent 30+1.50=31.50 USD to Ana Reyes (•• 4021): Lunch 🍜") return "sent: " + log();
if (step() !== "Receipt") return "receipt: " + step();
const rec = (l) => qq('[data-step="4"] .ui-sendflow-row').find((d) => d.querySelector("dt").textContent === l)?.querySelector("dd").textContent;
if (rec("Reference") !== "TX-20261101-0042" || rec("When") !== "Nov 1, 2026 09:43" || rec("Total") !== "$31.50" || rec("Note") !== "Lunch 🍜") return "receipt lines: " + rec("When");
if (q(".ui-sendflow-back")) return "no back from a receipt";
// The system's back on a receipt stays on it.
const h = await cdp("Page.getNavigationHistory", {});
await cdp("Page.navigateToHistoryEntry", { entryId: h.entries[h.currentIndex - 1].id }); await wait(300);
if (step() !== "Receipt") return "back from a receipt: " + step();
await tap(foot()); await wait(200);
if (log() !== "Done" || step() !== "Step 1 of 4" || amt().value !== "") return "done: " + log();
// The keyboard: the bar stays above what it covers.
const vv = window.visualViewport, real = Object.getOwnPropertyDescriptor(VisualViewport.prototype, "height");
Object.defineProperty(vv, "height", { configurable: true, get: () => innerHeight - 300 });
vv.dispatchEvent(new Event("resize")); await wait(80);
const kb = flow.style.getPropertyValue("--ui-sendflow-kb");
delete vv.height;
if (kb !== "300px") return "keyboard: " + kb;
const fr = foot().getBoundingClientRect();
if (fr.bottom > flow.getBoundingClientRect().bottom - 300 + 1) return "the button stays above it: " + fr.bottom;
vv.dispatchEvent(new Event("resize")); await wait(80);
if (device === "tablet") {
    await tap(payee("Joe Park")); await wait(100);
    const side = q(".ui-sendflow-side");
    if (getComputedStyle(side).display === "none" || !/Joe Park/.test(side.textContent)) return "a side panel on a tablet";
    const s = side.getBoundingClientRect(), c = q(".ui-sendflow-scroll").getBoundingClientRect();
    if (!(s.left >= c.right - 1)) return "beside it: " + s.left + " " + c.right;
} else if (getComputedStyle(q(".ui-sendflow-side")).display !== "none") return "no side panel on a phone";
