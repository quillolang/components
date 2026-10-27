const stats = $$(".ui-stat");
if (stats.length !== 6) return `expected 6 stats, found ${stats.length}`;
const delta = (s) => s.querySelector(".ui-stat-delta")?.textContent.replace(/\s+/g, "");
const [rev, users, churn, tickets, uptime, resp] = stats;
if (delta(rev) !== "↑+12.5%" || !rev.classList.contains("ui-stat-good")) return `revenue: ${delta(rev)} ${rev.className}`;
if (delta(users) !== "↓-3.2%" || !users.classList.contains("ui-stat-bad")) return `users: ${delta(users)} ${users.className}`;
if (delta(churn) !== "↓-0.4pts" || !churn.classList.contains("ui-stat-good")) return `good=down does not make a fall good: ${churn.className}`;
if (!tickets.classList.contains("ui-stat-flat")) return "a 0 change is not flat";
if (!resp.classList.contains("ui-stat-bad")) return "good=down does not make a rise bad";
if (uptime.querySelector(".ui-stat-delta") || !uptime.classList.contains("ui-stat-bare")) return "uptime: no delta, card={false}";
if (rev.querySelector(".ui-stat-value").textContent !== "$48,210") return "the value is missing";
const d = rev.querySelector(".ui-stat-trend path").getAttribute("d");
if (!/^M[\d.]+,[\d.]+( L[\d.]+,[\d.]+){7}$/.test(d)) return `the trend path is ${d}`;
const ys = d.slice(1).split(" L").map((p) => Number(p.split(",")[1]));
if (!(ys[7] < ys[0])) return "a rising trend does not go up";
if (getComputedStyle(rev.querySelector(".ui-stat-trend")).color !== getComputedStyle(rev.querySelector(".ui-stat-delta")).color)
    return "the trend is not in the delta's colour";
if (churn.querySelector(".ui-stat-trend")) return "no trend draws no line";
