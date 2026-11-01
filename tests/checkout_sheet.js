// mobile
const dlg = () => $("dialog.ui-cartsh"), open = () => $(".ui-chksh-open");
const $d = (s) => dlg().querySelector(s), said = () => $("#checkout-demo-said").textContent;
const f = (k) => $d(`#checkout-demo-${k}`), err = (k) => $d(`#checkout-demo-${k}-err`)?.textContent ?? "";
const sums = () => [...dlg().querySelectorAll(".ui-chksh-sums dd")].map((d) => d.textContent).join(" ");
const states = () => [...dlg().querySelectorAll(".ui-chksh-state")].map((s) => s.textContent).join(",");
const thumb = () => $d(".ui-chksh-thumb"), slide = () => $d(".ui-chksh-slide");
await tap(open()); await wait(300);
if (!dlg().open) return "the button opens it";
// In decimals: 129 + 22.05 = 151.05; 8% is 12.084, so 12.08; 151.05 + 4.95 + 12.08 = 168.08.
if (sums() !== "$129.00 $22.05 $4.95 $12.08 $168.08") return "sums: " + sums();
if ($d(".ui-chksh-total").textContent !== "Total$168.08") return "the footer's total: " + $d(".ui-chksh-total").textContent;
if (!/Tue 3 Nov/.test(dlg().textContent === "" ? "" : dlg().textContent) && !/Fri 6 Nov/.test(dlg().textContent)) return "delivery dates: none";
if (!/Fri 6 Nov/.test($d('label[for="checkout-demo-delivery-std"]').textContent)) return "5 days from Sun 1 Nov: " + $d('label[for="checkout-demo-delivery-std"]').textContent;
if (states() !== "To fill in,Done,Done") return "states: " + states();
// The total follows the delivery: 151.05 + 12.00 + 12.08 = 175.13.
await tap($d('label[for="checkout-demo-delivery-fast"]'));
if (sums() !== "$129.00 $22.05 $12.00 $12.08 $175.13") return "faster: " + sums();
if ($d("#checkout-demo-delivery-std").name !== "checkout-demo-delivery") return "groups by id";
// The slide is locked: it gives a little, comes back, and goes to the first thing wrong.
if (!slide().classList.contains("ui-chksh-locked")) return "locked at the start";
await drag(thumb(), 260, 0, 300); await wait(300);
if (thumb().style.transform !== "") return "locked, it comes back: " + thumb().style.transform;
if (/Paying/.test(said())) return "locked, nothing is paid";
if (document.activeElement !== f("name")) return "it goes to the first field: " + document.activeElement.id;
if (err("name") !== "Enter your name." || err("street") !== "Enter your street and number." || err("postcode") !== "Enter a postcode.") return "every message shows: " + err("name");
if (!/Still needed: your address/.test(dlg().textContent)) return "it says what is missing";
// Typing puts each right, keeps the focus, and keeps the element.
const name = f("name");
name.focus(); type(name, "A"); await wait(60);
if (f("name") !== name || document.activeElement !== name) return "typing keeps the field";
if (err("name") !== "Enter your name.") return "one letter: " + err("name");
type(name, "Ana Reyes"); await wait(60);
if (err("name") !== "" || f("name") !== name) return "right now";
type(f("street"), "12 Rizal Ave"); type(f("city"), "Quezon City");
// Postcodes by country.
const pc = async (country, text) => { const sel = f("country"); sel.value = country; sel.dispatchEvent(new Event("change", { bubbles: true })); type(f("postcode"), text); await wait(60); return err("postcode"); };
if (await pc("US", "9021") !== "That does not look like a postcode here.") return "US short";
if (await pc("US", "90210-1234") !== "") return "US long";
if (await pc("GB", "sw1a 1aa") !== "") return "GB, any case";
if (await pc("GB", "90210") === "") return "GB refuses a zip";
if (await pc("CA", "K1A 0B1") !== "") return "CA";
if (await pc("DE", "10115") !== "") return "DE";
if (await pc("PH", "1100") !== "") return "PH";
// A saved card is enough: it starts chosen.
if (states() !== "Done,Done,Done") return "address done: " + states();
if (!$d("#checkout-demo-pay-visa").checked) return "the saved card starts chosen";
if (slide().classList.contains("ui-chksh-locked")) return "all done, the slide is free";
if (f("number")) return "no card fields with a saved card";
// Back to a new card: every check on it.
await tap($d('label[for="checkout-demo-pay-new"]'));
if (!slide().classList.contains("ui-chksh-locked")) return "a new card needs filling in";
if (states() !== "Done,Done,To fill in") return "the card is to fill in: " + states();
if (!/Still needed: how to pay/.test(dlg().textContent)) return "payment is next";
const num = () => f("number"), exp = () => f("expiry"), cvc = () => f("cvc");
type(num(), "4242424242424241"); num().blur(); await wait(60);
if (err("number") !== "That card number is not right: check the digits.") return "Luhn: " + err("number");
type(num(), "4242424242424242"); num().blur(); await wait(60);
if (num().value !== "4242 4242 4242 4242" || err("number") !== "") return "the number in fours: " + num().value;
type(num(), "378282246310005"); num().blur(); await wait(60);
if (num().value !== "3782 822463 10005" || err("number") !== "") return "Amex's groups: " + num().value;
type(cvc(), "123"); cvc().blur(); await wait(60);
if (err("cvc") !== "The code on the card has 4 digits.") return "Amex's code: " + err("cvc");
type(cvc(), "1234"); await wait(60);
type(exp(), "13/29"); exp().blur(); await wait(60);
if (err("expiry") !== "The month is 01 to 12.") return "month: " + err("expiry");
type(exp(), "10/26"); exp().blur(); await wait(60);
if (err("expiry") !== "This card has expired.") return "expired: " + err("expiry");
type(exp(), "1126"); exp().blur(); await wait(60);
if (exp().value !== "11/26" || err("expiry") !== "") return "this month is still good: " + exp().value + " " + err("expiry");
if (slide().classList.contains("ui-chksh-locked")) return "free again";
// What the slide's class reads changes under the finger: the form going wrong mid-slide must not throw the thumb about.
{
    const t0 = thumb().getBoundingClientRect(), p0 = { x: t0.left + 24, y: t0.top + 24 };
    const keep = f("name").value;
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p0] });
    await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x + 30, y: p0.y }] });
    await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p0.x + 90, y: p0.y }] });
    await wait(60);
    if (!slide().classList.contains("ui-chksh-sliding")) return "sliding is marked";
    type(f("name"), "A"); await wait(100);
    const locked = slide().classList.contains("ui-chksh-locked"), still = slide().classList.contains("ui-chksh-sliding"), at = thumb().style.transform;
    type(f("name"), keep); await wait(100);
    await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await wait(280);
    if (!locked) return "the form went wrong";
    if (!still) return "a change of `ready` drops the sliding mark mid-slide";
    if (!at.includes("translateX")) return "the thumb stays under the finger: " + at;
    if (thumb().style.transform !== "") return "and goes home after: " + thumb().style.transform;
}
// A slide that falls short springs back and pays nothing.
const w = slide().clientWidth, room = w - 56;
await drag(thumb(), Math.round(room * 0.6), 0, 500); await wait(300);
if (thumb().style.transform !== "" || /Paying/.test(said())) return "short: " + thumb().style.transform + " " + said();
// Cancelled by the system.
const t = thumb().getBoundingClientRect(), p = { x: t.left + 24, y: t.top + 24 };
await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + 30, y: p.y }] });
await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x + room, y: p.y }] });
await wait(40);
if (!thumb().style.transform.includes("translateX")) return "it follows the finger: " + thumb().style.transform;
await cdp("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
await wait(280);
if (thumb().style.transform !== "" || /Paying/.test(said())) return "a cancel pays nothing";
// Up and down is not a slide.
await drag(thumb(), 0, -80, 200); await wait(250);
if (/Paying/.test(said())) return "a slide up pays nothing";
// The fail path: refused, says so, can try again.
const nm = f("name"); type(nm, "Dee Clined"); await wait(60);
await drag(thumb(), room + 20, 0, 400); await wait(300);
if (said() !== "Paying 175.13 by card, fast, to 1100, call 1") return "pays: " + said();
if (!/did not go through/.test(dlg().textContent)) return "a refusal says so";
if (thumb().style.transform !== "") return "the thumb comes back to try again: " + thumb().style.transform;
type(f("name"), "Ana Reyes"); await wait(60);
if (/did not go through/.test(dlg().textContent)) return "the message goes with the change";
// A flick past halfway pays.
await drag(thumb(), Math.round(room * 0.7), 0, 60); await wait(300);
if (said() !== "Paying 175.13 by card, fast, to 1100, call 2") return "a flick pays: " + said();
if (!/was paid/.test(dlg().textContent)) return "paid: " + $d(".ui-cartsh-body").textContent;
if ($d(".ui-chksh-thumb")) return "no way to pay twice";
await tap($d(".ui-cartsh-foot .ui-btn")); await wait(200);
if (dlg().open) return "Done closes it";
// Tablet layout, then the button's route and the keys, on a new order.
await tap($("#checkout-demo-again")); await wait(300);
await tap(open()); await wait(300);
if (device === "tablet") {
    const a = $d(".ui-chksh-col").getBoundingClientRect(), b = dlg().querySelectorAll(".ui-chksh-col")[1].getBoundingClientRect();
    if (b.left < a.right) return "two columns: " + a.right + " " + b.left;
} else {
    if (Math.abs(dlg().getBoundingClientRect().bottom - innerHeight) > 1) return "a phone has a bottom sheet";
}
type(f("name"), "Ana Reyes"); type(f("street"), "12 Rizal Ave"); type(f("city"), "Quezon City"); type(f("postcode"), "90210"); await wait(80);
const payBtn = () => [...dlg().querySelectorAll(".ui-cartsh-foot .ui-btn")].find((b) => /pay/i.test(b.textContent));
await tap(payBtn());
if (payBtn().textContent !== "Press again to pay $168.08") return "the button asks: " + payBtn().textContent;
if (/call 3/.test(said())) return "the first press pays nothing";
type(f("name"), "Ana B Reyes"); await wait(60);
if (payBtn().textContent !== "Pay by button") return "a change asks again: " + payBtn().textContent;
// The arrow keys: four steps of a quarter.
thumb().focus();
key(thumb(), "ArrowRight"); await wait(60);
if (!thumb().style.transform.includes("translateX")) return "a key moves it";
key(thumb(), "ArrowLeft"); await wait(280);
if (thumb().style.transform !== "") return "ArrowLeft takes it home";
for (let i = 0; i < 4; i++) { key(thumb(), "ArrowRight"); await wait(60); }
await wait(250);
if (said() !== "Paying 168.08 by saved, std, to 90210, call 3") return "the keys pay: " + said();
if (!/was paid/.test(dlg().textContent)) return "a plain answer of true is paid";
await tap($d(".ui-cartsh-foot .ui-btn")); await wait(200);
// A plain false is refused as a Promise of false is, and a Promise of nothing is done.
await tap($("#checkout-demo-again")); await wait(300);
await tap(open()); await wait(300);
type(f("name"), "Dee Clined"); type(f("street"), "12 Rizal Ave"); type(f("city"), "Quezon City"); type(f("postcode"), "90210"); await wait(80);
await drag(thumb(), slide().clientWidth, 0, 400); await wait(300);
if (!/did not go through/.test(dlg().textContent)) return "a plain false says so";
type(f("name"), "Quiet Answer"); await wait(60);
await drag(thumb(), slide().clientWidth, 0, 400); await wait(300);
if (!/was paid/.test(dlg().textContent)) return "a Promise of nothing is done";
await tap($d(".ui-cartsh-foot .ui-btn")); await wait(200);
// The cart empties under the sheet: its rows go, the slide locks and it says why.
await tap($("#checkout-demo-again")); await wait(300);
await tap(open()); await wait(300);
type(f("name"), "Ana Reyes"); type(f("street"), "12 Rizal Ave"); type(f("city"), "Quezon City"); type(f("postcode"), "90210"); await wait(80);
if (slide().classList.contains("ui-chksh-locked")) return "free with lines";
dlg().close(); await wait(150);
await tap($("#checkout-demo-empty")); await wait(200);
await tap(open()); await wait(300);
if (sums() !== "$0.00 $0.00" ) { if (sums() !== "$4.95 $4.95") return "no lines left: " + sums(); }
if (!slide().classList.contains("ui-chksh-locked") || !/Your cart is empty/.test(dlg().textContent)) return "an empty cart cannot be paid";
dlg().close(); await wait(150);
// Rotation keeps what was typed.
await tap($("#checkout-demo-again")); await wait(300);
await tap(open()); await wait(300);
type(f("name"), "Ana Reyes"); await wait(60);
const body = $d(".ui-cartsh-body"); body.scrollTop = 120; await wait(60);
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (f("name").value !== "Ana Reyes" || !dlg().open) return "turned, it keeps";
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(300);
if (f("name").value !== "Ana Reyes" || !dlg().open) return "turned back, it keeps";
await tap($d(".ui-cartsh-x")); await wait(150);
await tap($("#checkout-demo-again")); await wait(150);
