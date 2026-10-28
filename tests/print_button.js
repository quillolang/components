const [part, whole] = $$("button.ui-print-button"), receipt = $("#print-demo-receipt"), note = () => $(".demo-note").textContent;
if (!part || !whole || !receipt) return "the buttons or the receipt are missing";
if (part.textContent.trim() !== "Print the receipt" || !part.querySelector("svg")) return "the label or icon is missing";
const real = window.print;
let printed = 0, duringPrint = null;
try {
    window.print = () => { printed++; duringPrint = { html: document.documentElement.classList.contains("ui-print-button-printing"), target: receipt.classList.contains("ui-print-button-target") }; };
    part.click(); await wait();
    if (printed !== 1) return "clicking did not call window.print";
    if (!duringPrint.html || !duringPrint.target) return `while printing, the classes were ${JSON.stringify(duringPrint)}`;
    if (note() !== "Printed 1 time.") return `on_print did not reach the note: ${note()}`;
    window.dispatchEvent(new Event("afterprint")); await wait();
    if (document.documentElement.classList.contains("ui-print-button-printing") || receipt.classList.contains("ui-print-button-target")) return "after printing the classes stay";
    whole.click(); await wait();
    if (printed !== 2 || duringPrint.html) return "printing the whole page set the printing class";
    window.dispatchEvent(new Event("afterprint")); await wait();
} finally {
    window.print = real;
    document.documentElement.classList.remove("ui-print-button-printing"); receipt.classList.remove("ui-print-button-target");
}
