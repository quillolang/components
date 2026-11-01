// mobile
const pill = () => $$(".ui-netstat-pill")[0];
const compact = () => $$(".ui-netstat-pill")[1];
const say = () => $(".ui-netstat-say")?.textContent ?? "";
const note = () => $("#network-status-demo-note").textContent;
const cell = (t) => $$(".ui-netstat-grid > div").find((d) => d.querySelector("dt").textContent === t)?.querySelector("dd").textContent;
const html = document.documentElement;
const P = NetworkInformation.prototype;
const keep = {};
for (const k of ["type", "effectiveType", "downlink", "rtt", "saveData"]) keep[k] = Object.getOwnPropertyDescriptor(P, k);
const put = (k) => { if (keep[k]) Object.defineProperty(P, k, keep[k]); else delete P[k]; };
const fake = (o) => { for (const k of Object.keys(keep)) { if (k in o) Object.defineProperty(P, k, { configurable: true, get: () => o[k] }); else put(k); } };
const change = async () => { navigator.connection.dispatchEvent(new Event("change")); await wait(80); };
const conn = navigator.connection;
try {
    // What Chrome really says on a fast link.
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 20, downloadThroughput: 5e6, uploadThroughput: 5e6, connectionType: "wifi" });
    await wait(200);
    if (pill().dataset.state !== "online") return "fast: " + pill().dataset.state + " " + pill().textContent;
    if (cell("Behaves") !== "Like 4G or better") return "behaves: " + cell("Behaves");

    // Real slow conditions from Chrome: its numbers are noisy on purpose, so only their class.
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 2500, downloadThroughput: 5000, uploadThroughput: 5000, connectionType: "cellular2g" });
    await wait(200);
    if (cell("Behaves") !== "Very slow" && cell("Behaves") !== "Like 2G") return "2g: " + cell("Behaves");
    if (pill().dataset.state !== "slow") return "not slow: " + pill().dataset.state;
    if (compact().dataset.state !== "slow") return "the pill did not follow";
    if (!say().startsWith("Slow link (2G speed)")) return "slow say: " + say();
    if (html.getAttribute("data-slow-link") !== "slow") return "no flag on html";
    if (note() !== "slow true, images low, video false, prefetch false") return "plan: " + note();

    // Offline, a real event from the browser.
    await cdp("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await wait(200);
    if (pill().textContent.trim() !== "Offline" || pill().dataset.state !== "offline") return "offline: " + pill().textContent;
    if ($(".ui-netstat-grid")) return "numbers shown offline";
    if (say() !== "Anything that needs the internet waits until the connection is back.") return "offline say: " + say();
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await wait(200);
    if (pill().textContent.trim() === "Offline") return "back online was missed";

    // Exact numbers, by stand-ins on the real object, with a real change event.
    fake({ type: "wifi", effectiveType: "4g", downlink: 12.5, rtt: 50, saveData: false });
    await change();
    if (pill().textContent.trim() !== "Wi-Fi") return "wifi: " + pill().textContent;
    if (cell("Speed") !== "12.50 Mb/s" || cell("Delay") !== "50 ms" || cell("Save data") !== "Off") return "cells: " + cell("Speed") + cell("Delay");
    if (html.hasAttribute("data-slow-link")) return "flag on a fast link";
    if (note() !== "slow false, images full, video true, prefetch true") return "fast plan: " + note();

    // The two limits, each just under and at the line.
    fake({ type: "cellular", effectiveType: "3g", downlink: 0.7, rtt: 799, saveData: false });
    await change();
    if (pill().dataset.state !== "online" || pill().textContent.trim() !== "Mobile data") return "under the lines: " + pill().textContent;
    fake({ type: "cellular", effectiveType: "3g", downlink: 0.69, rtt: 300, saveData: false });
    await change();
    if (pill().textContent.trim() !== "Mobile data, slow" || !say().includes("low bandwidth")) return "bandwidth: " + say();
    fake({ type: "cellular", effectiveType: "3g", downlink: 5, rtt: 800, saveData: false });
    await change();
    if (!say().includes("long delays")) return "delay: " + say();

    // Save-data alone: not slow, but a page should fetch less.
    fake({ type: "wifi", effectiveType: "4g", downlink: 20, rtt: 40, saveData: true });
    await change();
    if (pill().dataset.state !== "online" || cell("Save data") !== "On") return "save data: " + cell("Save data");
    if (html.getAttribute("data-slow-link") !== "save-data") return "save-data flag: " + html.getAttribute("data-slow-link");
    if (note() !== "slow false, images low, video false, prefetch false") return "save plan: " + note();
    if (!say().startsWith("The person asked to save data")) return "save say: " + say();

    // A real data saver setting from Chrome is read too.
    fake({ type: "wifi", effectiveType: "4g", downlink: 20, rtt: 40, saveData: false });
    await change();
    if (html.hasAttribute("data-slow-link")) return "flag stayed";
    const sd = keep.saveData;
    Object.defineProperty(P, "saveData", sd);
    await cdp("Emulation.setDataSaverOverride", { dataSaverEnabled: true });
    await change();
    if (cell("Save data") !== "On") return "real save data: " + cell("Save data");
    await cdp("Emulation.setDataSaverOverride", { dataSaverEnabled: false });

    // Values that make no sense are not shown as if they did.
    fake({ type: "unknown", effectiveType: "6g", downlink: -1, rtt: "x", saveData: "no" });
    await change();
    if (!say().startsWith("This phone or browser says only")) return "bad values: " + say();
    fake({ type: "unknown", effectiveType: "4g", downlink: 0, rtt: 0, saveData: false });
    await change();
    if (cell("Speed") !== "Not said" || cell("Delay") !== "Not said" || pill().textContent.trim() !== "Online") return "zeroes: " + cell("Speed") + pill().textContent;

    // The stated limit where the phone does not say: iOS, with navigator.connection gone.
    const nd = Object.getOwnPropertyDescriptor(Navigator.prototype, "connection");
    Object.defineProperty(Navigator.prototype, "connection", { configurable: true, get: () => undefined });
    window.dispatchEvent(new Event("online"));
    await wait(100);
    const ok = pill().textContent.trim(), line = say(), plan = note(), grid = $(".ui-netstat-grid");
    Object.defineProperty(Navigator.prototype, "connection", nd);
    if (ok !== "Online") return "no connection info: " + ok;
    if (line !== "This phone or browser says only whether it is online, not what kind of connection it has or how fast it is.") return "limit: " + line;
    if (grid) return "numbers with nothing known";
    if (plan !== "slow unknown, images full, video true, prefetch true") return "limit plan: " + plan;

    // On a tablet, four in a row; on a phone, two.
    fake({ type: "wifi", effectiveType: "4g", downlink: 20, rtt: 40, saveData: false });
    await change();
    const cols = getComputedStyle($(".ui-netstat-grid")).gridTemplateColumns.split(" ").length;
    if (cols !== (device === "tablet" ? 4 : 2)) return device + " columns: " + cols;
} finally {
    for (const k of Object.keys(keep)) put(k);
    await cdp("Network.emulateNetworkConditions", { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
    await cdp("Emulation.setDataSaverOverride", { dataSaverEnabled: false });
}
