// mobile
const dlg = $("dialog.ui-cartsh"), open = $(".ui-varsh-open");
await tap(open); await wait(300);
if (!dlg.open) return "the button opens it";
const opt = (key, v) => dlg.querySelector(`#variant-demo-${key}-${v}`);
const lab = (key, v) => opt(key, v).closest("label");
const why = (key, v) => lab(key, v).querySelector(".ui-varsh-why")?.textContent ?? "";
const low = (key, v) => lab(key, v).querySelector(".ui-varsh-low")?.textContent ?? "";
const buy = dlg.querySelector(".ui-btn-full"), state = () => dlg.querySelector(".ui-varsh-state").textContent, cost = () => dlg.querySelector(".ui-varsh-price").textContent;
const said = () => dlg.querySelector(".ui-varsh-said").textContent;
// With nothing chosen: S has stock, L is sold out everywhere made, XL is back on the 20th.
if (why("size", "S") !== "" || why("size", "M") !== "") return "S and M can be had: " + why("size", "S");
if (why("size", "L") !== "Sold out") return "L is sold out: " + why("size", "L");
if (why("size", "XL") !== "Back 20 Dec") return "XL is back on a date: " + why("size", "XL");
if (why("colour", "rust") !== "Sold out") return "rust: " + why("colour", "rust");
if (!buy.disabled) return "nothing chosen, nothing to add";
if (state() !== "Pick a size and colour") return "it says what is missing: " + state();
if (cost() !== "$48.00") return "the price stands: " + cost();
// S: navy is sold out in S and back on the 12th; rust too but with no date.
await tap(lab("size", "S"));
if (!opt("size", "S").checked) return "a tap picks it";
if (why("colour", "navy") !== "Back 12 Dec in S") return "navy in S: " + why("colour", "navy");
if (why("colour", "sand") !== "") return "sand in S is in stock: " + why("colour", "sand");
if (low("colour", "sand") !== "") return "4 is not low with low 3: " + low("colour", "sand");
if (state() !== "Pick a colour") return "colour next: " + state();
await tap(lab("colour", "sand"));
if (!opt("colour", "sand").checked || opt("colour", "navy").checked) return "the group keeps one";
if (state() !== "In stock" || buy.disabled) return "S sand can be bought: " + state();
// Now L is not in sand at all, and M has 2.
if (why("size", "L") !== "Sold out") return "L sold out anywhere: " + why("size", "L");
if (why("size", "XL") !== "Back 20 Dec") return "XL: " + why("size", "XL");
if (low("size", "M") !== "Only 2 left") return "M sand is low: " + low("size", "M");
// M sand has its own price.
await tap(lab("size", "M"));
if (cost() !== "$52.00") return "the row's price: " + cost();
if (state() !== "Only 2 left") return "the state: " + state();
// A clash: rust is gone, so a tap says why and changes nothing.
await tap(lab("colour", "rust"));
if (opt("colour", "rust").checked) return "a gone option stays unpicked";
if (!opt("colour", "sand").checked) return "the choice stays";
if (said() !== "Rust: sold out.") return "it says why: " + said();
// Navy with S picked clashes: taken, and the size asked for again.
await tap(lab("size", "S"));
await tap(lab("colour", "navy"));
if (!opt("colour", "navy").checked) return "a clash takes the option";
if (opt("size", "S").checked) return "and clears the other";
if (said() !== "Navy chosen. Back 12 Dec in S, so pick the size again.") return "and says so: " + said();
if (state() !== "Pick a size") return "and asks: " + state();
// The keyboard: real radio buttons, arrow keys move in the group. CDP's own keys reach the browser's behaviour.
opt("size", "S").focus();
await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
await wait(100);
if (document.activeElement !== opt("size", "M") || !opt("size", "M").checked) return "the arrow key picks M: " + document.activeElement.id;
if (state() !== "In stock") return "M navy: " + state();
// Add.
await tap(buy); await wait(200);
if (dlg.open) return "adding closes it";
if ($("#variant-demo-got").textContent !== "Added M navy at 48.00, 7 there") return "on_pick: " + $("#variant-demo-got").textContent;
await tap(open); await wait(300);
if (!opt("size", "M").checked) return "the choice stays for next time";
// Two groups are separate, as two sheets on a page would be.
if (opt("size", "M").name === opt("colour", "navy").name) return "each option has its own group";
// A tablet puts the picture beside the options.
const pic = dlg.querySelector(".ui-varsh-pic").getBoundingClientRect(), groups = dlg.querySelector(".ui-varsh-groups").getBoundingClientRect();
if (device === "tablet" && !(pic.right <= groups.left)) return "the picture is beside: " + pic.right + " " + groups.left;
if (device === "phone" && !(pic.bottom <= groups.top)) return "the picture is above: " + pic.bottom + " " + groups.top;
const box = dlg.getBoundingClientRect();
if (device === "tablet" && (Math.abs((box.left + box.right) / 2 - innerWidth / 2) > 2 || box.bottom > innerHeight - 10)) return "a dialog in the middle: " + JSON.stringify(box);
// Rotation keeps the choice.
const [w0, h0] = [innerWidth, innerHeight];
await cdp("Emulation.setDeviceMetricsOverride", { width: h0, height: w0, deviceScaleFactor: 2, mobile: true });
await wait(250);
if (!opt("size", "M").checked || !dlg.open) return "turned, it keeps";
await cdp("Emulation.setDeviceMetricsOverride", { width: w0, height: h0, deviceScaleFactor: 2, mobile: true });
await wait(250);
if (!opt("size", "M").checked || !opt("colour", "navy").checked || !dlg.open) return "turned back, it keeps";
await tap(dlg.querySelector(".ui-cartsh-x")); await wait(100);
if (dlg.open) return "the button closes it";
