// tablet
localStorage.removeItem("pos-demo");
await wait(300);
const frame = $(".demo-tablet");
const $f = (q) => frame.querySelector(q), $$f = (q) => [...frame.querySelectorAll(q)];
const items = () => $$f(".ui-pos-register-item");
const item = (name) => items().find((b) => b.querySelector("b").textContent === name);
const btn = (t) => $$f(".ui-pos-register-btn").find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);
const padKey = (k) => $$f(".ui-pos-register-key").find((b) => b.getAttribute("aria-label") === k);
const sums = () => ["subtotal", "discount", "tax", "total"].map((n) => $f(`[data-sum=${n}]`).textContent).join(" ");
const stored = () => JSON.parse(localStorage.getItem("pos-demo") ?? "null");
const lines = () => $$f(".ui-pos-register-lines .ui-pos-register-line").map((l) => l.querySelector("b").textContent + " x" + l.querySelector(".ui-pos-register-qty").textContent + " " + l.querySelector(".ui-pos-register-net").textContent).join(", ");
const note = () => $("#pos-register-note").textContent;
const typeKeys = async (s) => { for (const c of s) await tap(padKey(c)); };

// Bad products left out; the id seen twice keeps the first.
if (items().length !== 10) return "products: " + items().map((b) => b.textContent).join();
if (item("Flat white").querySelector("span").textContent !== "$4.50") return "a price: " + item("Flat white").textContent;
if ($$f(".ui-pos-register-cat").map((c) => c.textContent).join() !== "All,Coffee,Bakery,Kitchen,Drinks") return "categories: " + $$f(".ui-pos-register-cat").map((c) => c.textContent).join();
await tap($$f(".ui-pos-register-cat")[2]);
if (items().map((b) => b.querySelector("b").textContent).join() !== "Croissant,Blueberry muffin,Scone") return "a category: " + items().length;
await tap($$f(".ui-pos-register-cat")[0]);

// Three tens of cents are thirty cents exactly, and tax on it rounds half up: 0.30 * 0.0825 = 0.02475.
await tap(item("Water")); await tap(item("Water")); await tap(item("Water"));
if (lines() !== "Water x3 $0.30") return "lines: " + lines();
if (sums() !== "$0.30 $0.00 $0.02 $0.32") return "three water: " + sums();
await tap(btn("Void"));
if (lines() !== "" || sums() !== "$0.00 $0.00 $0.00 $0.00") return "void: " + lines() + sums();

// A sale: 2 flat whites 9.00, 3 croissants 11.25, toastie 7.60 = 27.85.
await tap(item("Flat white")); await tap(item("Flat white"));
await tap(item("Croissant"));
await tap(btn("One more Croissant")); await tap(btn("One more Croissant"));
await tap(item("Toastie"));
if (lines() !== "Flat white x2 $9.00, Croissant x3 $11.25, Toastie x1 $7.60") return "the ticket: " + lines();
// Tax 27.85 * 0.0825 = 2.297625 -> 2.30; total 30.15.
if (sums() !== "$27.85 $0.00 $2.30 $30.15") return "sums: " + sums();
// One fewer, then back, and the last one off takes the line.
await tap(btn("One fewer Toastie"));
if (lines().includes("Toastie")) return "the last one off should take the line: " + lines();
await tap(item("Toastie"));

// The quantity by the pad: the picked line is the last added.
await tap($$f(".ui-pos-register-line-pick")[0]);
await tap(btn("Quantity"));
if ($f(".ui-pos-register-panel h4").textContent !== "Quantity of Flat white") return "the pad's title: " + $f(".ui-pos-register-panel h4").textContent;
await typeKeys("4");
await tap(btn("Apply"));
if (!lines().startsWith("Flat white x4 $18.00")) return "quantity: " + lines();
// Quantity takes whole numbers: a point is refused.
await tap(btn("Quantity"));
await typeKeys(".");
if ($f(".ui-pos-register-entry").textContent !== "0") return "a point in a quantity: " + $f(".ui-pos-register-entry").textContent;
await typeKeys("2");
await tap(btn("Apply"));
if (!lines().startsWith("Flat white x2 $9.00")) return "quantity again: " + lines();

// 10% off the croissants: 11.25 less 1.125, half up 1.13, leaves 10.12.
await tap($$f(".ui-pos-register-line-pick")[1]);
await tap(btn("Line % off"));
await typeKeys("10");
await tap(btn("Apply"));
if (!lines().includes("Croissant x3 $10.12")) return "a line's percent: " + lines();
if (!$$f(".ui-pos-register-line")[1].textContent.includes("less $1.13")) return "the line's discount: " + $$f(".ui-pos-register-line")[1].textContent;
// 2.00 off the toastie: 5.60. More than it costs takes it to nothing, no further.
await tap($$f(".ui-pos-register-line-pick")[1]);
await tap($$f(".ui-pos-register-line-pick")[2]);
await tap(btn("Line amount off"));
await typeKeys("2.00");
await tap(btn("Apply"));
if (!lines().includes("Toastie x1 $5.60")) return "a line's amount: " + lines();
await tap(btn("Line amount off"));
await typeKeys("500");
await tap(btn("Apply"));
if (!lines().includes("Toastie x1 $0.00")) return "more off than it costs: " + lines();
await tap(btn("Line amount off"));
await typeKeys("2");
await tap(btn("Apply"));

// 9.00 + 10.12 + 5.60 = 24.72. 5% off the sale: 1.236, half up 1.24, leaves 23.48.
// Tax 23.48 * 0.0825 = 1.9371 -> 1.94; total 25.42.
await tap(btn("Sale % off"));
await typeKeys("5");
await tap(btn("Apply"));
if (sums() !== "$24.72 $1.24 $1.94 $25.42") return "the sale's percent: " + sums();

// The sale is kept as it stands: a new load of the page finds it.
if (stored().lines.length !== 3 || stored().off !== "5") return "stored: " + JSON.stringify(stored());
if (!stored().ref) return "the sale has no reference";
const reload = async () => {
    const f = document.createElement("iframe");
    f.src = location.href;
    f.style.cssText = "position: fixed; left: 0; top: 0; width: 820px; height: 700px; opacity: 0; pointer-events: none";
    document.body.append(f);
    await new Promise((r) => (f.onload = r));
    await wait(1800);
    const d = f.contentDocument;
    const out = { lines: [...d.querySelectorAll(".demo-tablet .ui-pos-register-lines .ui-pos-register-line b")].map((b) => b.textContent).join(), total: d.querySelector(".demo-tablet [data-sum=total]").textContent };
    f.remove();
    return out;
};
const again = await reload();
if (again.lines !== "Flat white,Croissant,Toastie" || again.total !== "$25.42") return "after a reload: " + JSON.stringify(again);

// Cash: short says by how much, and cannot be taken.
await tap(btn("Cash"));
await typeKeys("20");
if ($f("[data-part=short]").textContent !== "Short by $5.42") return "short: " + $f("[data-part=short]").textContent;
if (!btn("Take cash").disabled) return "short cash could be taken";
// Two decimals at most, one point only.
await tap(padKey("Delete")); await tap(padKey("Delete"));
await typeKeys("26.5.55");
if ($f(".ui-pos-register-entry").textContent !== "26.55") return "the entry: " + $f(".ui-pos-register-entry").textContent;
await tap(btn("Take cash"));
if (note() !== "cash: 25.42, change 1.13, 3 lines.") return "on_sale by cash: " + note();
if ($f(".ui-pos-register-change").textContent !== "Change $1.13") return "the change: " + $f(".ui-pos-register-change").textContent;
if (stored().lines.length !== 0) return "the finished sale stayed in storage";
await tap(btn("New sale"));
if (lines() !== "" || $f(".ui-pos-register-change")) return "New sale: " + lines();

// The note buttons: for 23.47 and such. Latte 4.75 + tax 0.39 = 5.14: 10, 20, 50, 100.
await tap(item("Latte"));
if ($f("[data-sum=total]").textContent !== "$5.14") return "a latte: " + $f("[data-sum=total]").textContent;
await tap(btn("Cash"));
const notes = $$f(".ui-pos-register-panel .ui-pos-register-row .ui-pos-register-btn").map((b) => b.textContent);
if (notes.slice(0, 5).join() !== "Exact,10,20,50,100") return "the notes: " + notes.join();
await tap(btn("10"));
if (note() !== "cash: 5.14, change 4.86, 1 lines.") return "a note: " + note();
await tap(btn("New sale"));

// Card: refused keeps the sale; two taps are one charge; accepted finishes.
await tap(item("Espresso"));
await tap($("#pos-refuse"));
await tap(btn("Card"));
await tap(btn("Charge"));
await wait(300);
if ($f("[data-part=card]").textContent !== "The card was not accepted. The sale is kept.") return "a refused card: " + $f("[data-part=card]").textContent;
if (!lines().startsWith("Espresso x1")) return "a refusal lost the sale: " + lines();
await tap($("#pos-refuse"));
const charge = middle(btn("Charge"));
await fingers("touchStart", [charge]);
await fingers("touchEnd", []);
await fingers("touchStart", [charge]);
await fingers("touchEnd", []);
await wait(30);
if ($f("[data-part=card]") && !$f("[data-part=card]").textContent.includes("Waiting")) return "no word of waiting: " + $f("[data-part=card]").textContent;
await wait(400);
if (note() !== "card: 3.46, change none, 1 lines.") return "on_sale by card: " + note();
if ($("#pos-register-charges").textContent !== "2 card attempts.") return "two taps charged twice: " + $("#pos-register-charges").textContent;
await tap(btn("New sale"));

// The keyboard on the pad.
await tap(item("Scone"));
await tap(btn("Cash"));
const panel = $f(".ui-pos-register-panel");
if (document.activeElement !== panel) return "the pad should take focus";
for (const [k, code, vk] of [["5", "Digit5", 53], ["Backspace", "Backspace", 8], ["7", "Digit7", 55]]) {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
}
await wait(60);
if ($f(".ui-pos-register-entry").textContent !== "7") return "keys on the pad: " + $f(".ui-pos-register-entry").textContent;
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await wait(60);
if ($f(".ui-pos-register-panel")) return "Escape should leave the pad";
// Enter takes the cash: a scone is 3.10, tax 0.25575 rounds to 0.26, so 3.36, and 7 gives 3.64 back.
await tap(btn("Cash"));
for (const [k, code, vk] of [["7", "Digit7", 55], ["Enter", "Enter", 13]]) {
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code, windowsVirtualKeyCode: vk });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
}
await wait(100);
if (note() !== "cash: 3.36, change 3.64, 1 lines.") return "Enter on the pad: " + note();
await tap(btn("New sale"));

// Bad storage is an empty sale, and storage that refuses is said.
localStorage.setItem("pos-demo", "{nope");
const broke = await reload();
if (broke.lines !== "" || broke.total !== "$0.00") return "bad storage: " + JSON.stringify(broke);
const realSet = Storage.prototype.setItem;
Storage.prototype.setItem = () => { throw new Error("full"); };
await tap(item("Scone"));
await wait(80);
Storage.prototype.setItem = realSet;
if (!$f(".ui-pos-register-acts").textContent.includes("will not keep the sale")) return "a refusing store was not said";
await tap(btn("Void"));
await wait(60);

// Yen have no decimals; prices with tax included take it out of them: 1250 from 1.1 is 1136.36 -> 1136, tax 114.
const yen = $("#pos-register-yen");
yen.querySelector(".ui-pos-register-item").click();
await wait(100);
const t = [...yen.querySelectorAll(".ui-pos-register-sums dd")].map((d) => d.textContent).join(" ");
if (t !== "￥1,250 ￥0 ￥114 ￥1,250") return "yen: " + t;
yen.remove();

// A held sale from outside: the good line kept, an unknown currency and a bad rate fall back, a percent past 100 stops there.
const heldBox = $("#pos-register-held");
const held = [...heldBox.querySelectorAll(".ui-pos-register-sums dd")].map((d) => d.textContent).join(" ");
if (held !== "$5.00 $5.00 $0.00 $0.00") return "a held sale: " + held;
if (heldBox.querySelectorAll(".ui-pos-register-line").length !== 1) return "held lines: " + heldBox.querySelectorAll(".ui-pos-register-line").length;
heldBox.remove();

// Rotation keeps the sale.
await tap(item("Scone"));
const turned = innerWidth > innerHeight;
const size = (w, h) => cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true });
await (turned ? size(820, 1180) : size(1180, 820));
await wait(250);
if (!lines().startsWith("Scone x1")) return "turning lost the sale";
const shop = $f(".ui-pos-register-shop").getBoundingClientRect(), tick = $f(".ui-pos-register-ticket").getBoundingClientRect();
if ((innerWidth >= 960) !== (tick.left >= shop.right - 1)) return "the ticket's place at " + innerWidth + ": " + tick.left + " " + shop.right;
await (turned ? size(1180, 820) : size(820, 1180));
await wait(250);
await tap(btn("Void"));
localStorage.removeItem("pos-demo");
