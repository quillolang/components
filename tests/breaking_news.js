localStorage.removeItem("ui-breaking:demo-quake");
const b = $("#breaking-news-demo-main");
if (!b || b.tagName !== "SECTION" || b.getAttribute("aria-label") !== "Breaking news") return "the banner is not a named region";
if (b.querySelector(".ui-brk-label").textContent !== "Breaking") return "the label";
const red = () => { const p = document.createElement("span"); p.style.color = "var(--ui-danger)"; b.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
if (getComputedStyle(b.querySelector(".ui-brk-label")).backgroundColor !== red()) return "Breaking is not in the danger colour";
const a = b.querySelector(".ui-brk-headline a");
if (!a || a.getAttribute("href") !== "#quake-live" || !a.textContent.startsWith("Magnitude 6.1")) return "the headline is not a link to the story";
if (!b.querySelector(".ui-brk-summary")?.textContent.includes("tsunami warning")) return "the summary";
const t = b.querySelector("time.ui-brk-time");
// It counts on by itself (every 30 s), so the minutes are worked out from its datetime now: the
// demo's story came in 4 minutes before the page was made, maybe longer ago by the time this runs.
const ago = (el) => (Date.now() - Date.parse(el.getAttribute("datetime"))) / 60000;
const mins = ago(t), shown = Number((t.textContent.match(/^(\d+) min ago$/) || [])[1]);
if (!/^\d{4}-\d\d-\d\dT/.test(t.getAttribute("datetime")) || !(mins >= 4) || !(shown <= Math.floor(mins) && shown >= Math.floor(mins - 0.6)))
    return `${mins.toFixed(1)} minutes on, the time reads "${t.textContent}"`;
const fixed = $("#breaking-news-demo-fixed time");
if (fixed.textContent !== `${Math.floor(ago(fixed) / 60)} h ago`) return `three hours reads "${fixed.textContent}"`;
if ($("#breaking-news-demo-fixed .ui-brk-x")) return "dismissable={false} has a close button";
if (!$("#breaking-news-demo-fixed").classList.contains("ui-brk-accent")) return "tone accent";
const dev = $("#breaking-news-demo-dev");
if (!dev.classList.contains("ui-brk-warning") || dev.querySelector(".ui-brk-headline a")) return "tone warning, or a headline without href is a link";
if (dev.querySelector("time").textContent !== "Updated 14:20" || dev.querySelector("time").hasAttribute("datetime")) return "time given";
const x = b.querySelector(".ui-brk-x");
if (!x || !x.getAttribute("aria-label").startsWith("Dismiss: Magnitude")) return "the close button has no name";
x.click(); await wait();
if ($("#breaking-news-demo-main")) return "closing does not take it away";
if (localStorage.getItem("ui-breaking:demo-quake") !== "1") return "remember does not keep it closed";
localStorage.removeItem("ui-breaking:demo-quake");
dev.querySelector(".ui-brk-x").click(); await wait();
if ($("#breaking-news-demo-dev") || $("#breaking-news-demo-note").textContent !== "on_dismiss was called.") return "on_dismiss did not reach the note";
if (localStorage.getItem("ui-breaking:demo-quake") !== null || Object.keys(localStorage).some((k) => k.startsWith("ui-breaking:") && k !== "ui-breaking:demo-quake")) return "a banner without remember was remembered";
