// Other tests on the page may have sent online and offline already: look at what this one adds.
const seen = () => ($(".demo-note").textContent.match(/^Seen: (.*)\.$/)?.[1] ?? "").split(", ").filter(Boolean);
const before = seen().length;
const added = () => seen().slice(before).join(", ");
const note = () => $(".demo-note").textContent;
if ($(".ui-offline")) return "a banner shows while online";
window.dispatchEvent(new Event("offline")); await wait();
try {
const all = $$(".ui-offline");
if (all.length !== 2) return `offline shows ${all.length} banners, not 2`;
const [flow, top] = all;
if (flow.getAttribute("role") !== "alert") return "the banner is not an alert";
if (flow.querySelector(".ui-offline-title").textContent !== "No connection." || !flow.textContent.includes("keep writing")) return "title and text";
if (!flow.classList.contains("ui-offline-flow") || getComputedStyle(flow).position === "fixed") return "sticky={false} is fixed";
await wait(300); // its slide-in
if (getComputedStyle(top).position !== "fixed" || Math.abs(top.getBoundingClientRect().top) > 0.5) return `the default is not fixed to the top: ${top.getBoundingClientRect().top}`;
if (top.querySelector(".ui-offline-title").textContent !== "You are offline") return "default title";
if (top.querySelector(".ui-offline-btn")?.textContent !== "Try again" || flow.querySelector(".ui-offline-btn")) return "reload button";
if (added() !== "offline") return `on_change(false): ${note()}`;
const x = flow.querySelector(".ui-offline-x");
if (x.getAttribute("aria-label") !== "Dismiss") return "the close button has no name";
x.click(); await wait();
if ($$(".ui-offline").length !== 1) return "Dismiss did not hide it";
} finally { window.dispatchEvent(new Event("online")); }
await wait();
if ($$(".ui-offline").length !== 0) return "back online, a banner stays";
if (added() !== "offline, online") return `on_change(true): ${note()}`;
window.dispatchEvent(new Event("offline")); await wait();
if ($$(".ui-offline").length !== 2) return "a dismissed banner does not come back on the next outage";
window.dispatchEvent(new Event("online")); await wait();
