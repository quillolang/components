const sw = $("input[role=switch]");
if (!sw.checked) return "the first switch starts on";
sw.click(); await wait();
if (!$(".demo-note").textContent.includes("off")) return `on_change did not update the note: ${$(".demo-note").textContent}`;
const beta = $("input[name=beta]");
if (beta.type !== "checkbox") return "a switch is a checkbox";
