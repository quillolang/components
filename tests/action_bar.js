const bar = $(".ui-action-bar");
if (bar.tagName !== "SECTION" || bar.getAttribute("aria-label") !== "Actions") return "not a named section";
if (bar.querySelector(".ui-action-bar-text b").textContent !== "€95 a night" || !bar.querySelector(".ui-action-bar-text span").textContent.startsWith("5 – 9 Nov")) return "the text is not shown";
if (!bar.querySelector(".ui-action-bar-do .ui-btn")) return "the action is not in it";
if (getComputedStyle(bar).position !== "static") return `wide, it is ${getComputedStyle(bar).position}`;
if (getComputedStyle(bar.nextElementSibling).display !== "none") return "wide, it leaves room it does not need";
