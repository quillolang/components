// mobile
await wait(300);
const box = $("#calendar-sheet-screen .ui-calendar-sheet");
const clip = box.querySelector(".ui-calendar-sheet-clip");
const grid = box.querySelector(".ui-calendar-sheet-grid");
const handle = box.querySelector(".ui-calendar-sheet-handle");
const log = () => $("#calendar-sheet-log").textContent;
const title = () => box.querySelector(".ui-calendar-sheet-title").textContent;
const day = (d) => box.querySelector(`[data-day="${d}"]`);
const picked = () => box.querySelector('[aria-pressed="true"]').dataset.day;
const weeks = () => [...box.querySelectorAll(".ui-calendar-sheet-week")];
const agenda = () => [...box.querySelectorAll(".ui-calendar-sheet-agenda > div")].map((d) => d.querySelector("h3").textContent + ": " + [...d.querySelectorAll(".ui-calendar-sheet-item")].map((i) => i.querySelector(".ui-calendar-sheet-time").textContent + " " + i.querySelector(".ui-calendar-sheet-name").textContent).join(", "));
const folded = () => box.classList.contains("ui-calendar-sheet-folded");
const row = () => weeks()[0].offsetHeight;
const tr = () => new DOMMatrix(getComputedStyle(grid).transform).m42;
const btn = (t) => [...box.querySelectorAll(".ui-calendar-sheet-btn")].find((b) => (b.getAttribute("aria-label") ?? b.textContent) === t);

// November 2026 begins on a Sunday: six rows, Monday first, the first row ending on the 1st.
if (weeks().length !== 6) return "rows: " + weeks().length;
if (weeks()[0].querySelector("[data-day]").dataset.day !== "2026-10-26") return "the first day: " + weeks()[0].querySelector("[data-day]").dataset.day;
if (weeks()[5].querySelector("[data-day]").dataset.day !== "2026-11-30") return "the last row";
if (!day("2026-10-26").hasAttribute("data-out") || day("2026-11-01").hasAttribute("data-out")) return "other months' days";
if (title() !== "November 2026") return "title: " + title();
if (picked() !== "2026-11-04") return "picked: " + picked();
if (day("2026-11-04").getAttribute("aria-current") !== "date") return "today";
if (day("2026-11-04").getAttribute("aria-label") !== "Wednesday 4 November, today, 3 items") return "label: " + day("2026-11-04").getAttribute("aria-label");
// All day first, then by time; days with nothing left out, up to a week on.
const first = agenda();
if (first.length !== 2 || first[0] !== "Today, Wednesday 4 November: All day Ana's birthday, 09:30 Dentist, 13:00 Lunch with Ana" || first[1] !== "Friday 6 November: 18:00 Pick up keys") return "agenda: " + first.join(" | ");
if (getComputedStyle(clip).touchAction !== "none") return "touch-action: " + getComputedStyle(clip).touchAction;
const r = row();
if (clip.offsetHeight !== r * 6) return "the month's height: " + clip.offsetHeight;
if (r < 44) return "a day is too short: " + r;

if (device === "phone") {
    // Short and slow: back to open.
    await drag(handle, 0, -60, 600);
    await wait(320);
    if (folded() || clip.offsetHeight !== r * 6 || clip.style.height !== "") return "a short drag should spring back: " + clip.offsetHeight;

    // Mid-way it follows the finger, the chosen week rising to the top as the rest closes.
    let p = middle(handle);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 20 * i }]); await wait(30); }
    await wait(40);
    const h = r * 6 - 112;
    if (clip.offsetHeight !== h) return "mid-drag height: " + clip.offsetHeight + " not " + h;
    const share = (h - r) / (r * 5);
    if (Math.abs(tr() - -r * (1 - share)) > 0.6) return "mid-drag shift: " + tr();
    const ag = box.querySelector(".ui-calendar-sheet-agenda").getBoundingClientRect().top;
    // State changing under the finger must leave the drag alone: the day, then the fold on the root's class.
    const inner = box.querySelector(".ui-calendar-sheet-inner");
    day("2026-11-05").click();
    await wait(60);
    if (picked() !== "2026-11-05") return "the state should have changed";
    if (clip.offsetHeight !== h || clip.style.height !== h + "px") return "a new day undid the drag: " + clip.offsetHeight;
    handle.click();
    await wait(60);
    if (!folded()) return "the fold should have changed";
    if (!inner.classList.contains("ui-calendar-sheet-moving")) return "a new fold dropped the moving class";
    if (getComputedStyle(clip).transitionDuration !== "0s") return "the drag should stay free of transitions: " + getComputedStyle(clip).transitionDuration;
    if (clip.style.height !== h + "px") return "a new fold undid the drag: " + clip.style.height;
    handle.click();
    await wait(60);
    day("2026-11-04").click();
    await wait(60);
    await fingers("touchCancel", []);
    await wait(320);
    if (folded() || clip.offsetHeight !== r * 6) return "a cancelled drag should go back: " + clip.offsetHeight;
    if (box.querySelector(".ui-calendar-sheet-agenda").getBoundingClientRect().top <= ag) return "the agenda should have followed it";

    // Past half: folds to the chosen day's week, and the agenda has what was freed.
    const before = box.querySelector(".ui-calendar-sheet-agenda").offsetHeight;
    await drag(handle, 0, -r * 3.5, 700);
    await wait(320);
    if (!folded() || clip.offsetHeight !== r) return "a long drag should fold: " + clip.offsetHeight;
    if (Math.round(tr()) !== -r) return "the chosen week should show: " + tr();
    if (log() !== "fold true") return "on_fold: " + log();
    if (box.querySelector(".ui-calendar-sheet-agenda").offsetHeight !== before + r * 5) return "the agenda should grow by five rows: " + box.querySelector(".ui-calendar-sheet-agenda").offsetHeight + " " + before;
    if (handle.getAttribute("aria-expanded") !== "false" || handle.getAttribute("aria-label") !== "Show the whole month") return "the handle's words";
    // Weeks out of sight are out of reach.
    if (!weeks()[0].inert || weeks()[1].inert) return "only the chosen week can be reached";

    // A flick down opens from a short way; a flick up folds.
    const flick = async (el, dy, dx = 0) => {
        const q = middle(el);
        await fingers("touchStart", [q]);
        for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x + dx * i / 3, y: q.y + dy * i / 3 }]); await wait(4); }
        await fingers("touchEnd", []);
        await wait(320);
    };
    await flick(handle, 60);
    if (folded()) return "a flick down should open";
    await flick(handle, -60);
    if (!folded()) return "a flick up should fold";
    // A drag on the days themselves works as well.
    await drag(clip, 0, r * 4, 600);
    await wait(320);
    if (folded()) return "a drag down on the days should open";
    await drag(clip, 0, -r * 4, 600);
    await wait(320);
    if (!folded()) return "a drag up on the days should fold";

    // Folded, a swipe is a week: the title stays with the day, the row with the week.
    await drag(clip, -160, 0, 500);
    await wait(500);
    if (picked() !== "2026-11-11" || !folded()) return "a swipe folded is a week: " + picked();
    if (log() !== "pick 2026-11-11") return "on_pick: " + log();
    if (Math.round(tr()) !== -r * 2) return "the row should follow: " + tr();
    await tap(btn("Week before"));
    await wait(500);
    if (picked() !== "2026-11-04") return "Week before: " + picked();

    // The handle as a button, and its keys.
    await tap(handle);
    if (folded() || log() !== "fold false") return "a tap on the handle should open: " + log();
    await tap(handle);
    if (!folded()) return "a tap on the handle should fold";
    handle.focus();
    key(handle, "ArrowDown");
    await wait(320);
    if (folded()) return "ArrowDown should open";
    key(handle, "ArrowUp");
    await wait(320);
    if (!folded()) return "ArrowUp should fold";
    key(handle, "ArrowDown");
    await wait(320);
} else {
    // A tablet: side by side, no handle, and nothing folds.
    const s = box.querySelector(".ui-calendar-sheet-sheet").getBoundingClientRect(), a = box.querySelector(".ui-calendar-sheet-agenda").getBoundingClientRect();
    if (a.left < s.right) return "the agenda stands beside the month: " + a.left + " " + s.right;
    if (Math.abs(a.top - s.top) > 2) return "side by side from the top";
    if (getComputedStyle(handle).display !== "none") return "no handle on a tablet";
    if (r !== 60) return "a tablet's days are taller: " + r;
    await drag(clip, 0, -200, 500);
    await wait(320);
    if (folded() || clip.offsetHeight !== r * 6) return "a tablet does not fold: " + clip.offsetHeight;
    // Folded on a phone, then turned: the state keeps, the tablet shows the month.
    box.classList.add("ui-calendar-sheet-folded");
    await wait(320);
    if (clip.offsetHeight !== r * 6) return "folded is for narrow screens: " + clip.offsetHeight;
    box.classList.remove("ui-calendar-sheet-folded");
    await wait(320);
}

// A sideways swipe, open: springs back when short, and a month on, past it.
await drag(clip, -80, 0, 600);
await wait(320);
if (picked() !== "2026-11-04" || grid.style.translate !== "") return "a short swipe should spring back: " + picked() + " " + grid.style.translate;
const p2 = middle(clip);
await fingers("touchStart", [p2]);
for (let i = 1; i <= 5; i++) { await fingers("touchMove", [{ x: p2.x - 10 * i, y: p2.y }]); await wait(30); }
await wait(40);
if (grid.style.translate !== "-42px") return "mid-swipe: " + grid.style.translate;
await fingers("touchCancel", []);
await wait(320);
if (grid.style.translate !== "" || picked() !== "2026-11-04") return "a cancelled swipe";
await drag(clip, -240, 0, 500);
await wait(500);
if (title() !== "December 2026" || picked() !== "2026-12-04") return "a month on: " + title() + " " + picked();
if (weeks().length !== 5) return "December's rows: " + weeks().length;
if (clip.offsetHeight !== row() * 5) return "the sheet should fit five rows: " + clip.offsetHeight;
if (agenda()[0] !== "Friday 4 December: All day Rent") return "the agenda follows: " + agenda();

// A month's end stays inside the shorter month.
await tap(btn("Month after"));
await wait(500);
if (title() !== "January 2027") return "Month after: " + title();
await tap(day("2027-01-31"));
if (picked() !== "2027-01-31") return "the 31st: " + picked();
await tap(btn("Month after"));
await wait(500);
if (picked() !== "2027-02-28") return "January 31 to February: " + picked();
if (title() !== "February 2027") return "title: " + title();

// Today returns; a day of another month moves there.
await tap(btn("Today"));
await wait(100);
if (picked() !== "2026-11-04") return "Today: " + picked();
if (!btn("Today").disabled) return "Today should rest on today";
await tap(day("2026-10-28"));
if (title() !== "October 2026" || picked() !== "2026-10-28") return "another month's day: " + title();
await tap(btn("Today"));
await wait(100);

// A day with nothing says so.
await tap(day("2026-11-20"));
if (agenda().length !== 1 || box.querySelector(".ui-calendar-sheet-none").textContent !== "Nothing on this day.") return "an empty day: " + agenda();
await tap(day("2026-11-04"));

// The agenda's row opens.
await tap(box.querySelector(".ui-calendar-sheet-item"));
if (log() !== "open 2") return "on_open: " + log();

// Keys, focus following; a month from Page Down.
day("2026-11-04").focus();
const k = async (name) => { key(document.activeElement, name); await wait(90); };
await k("ArrowRight");
if (picked() !== "2026-11-05" || document.activeElement.dataset.day !== "2026-11-05") return "ArrowRight: " + picked();
await k("ArrowDown");
if (picked() !== "2026-11-12") return "ArrowDown: " + picked();
await k("Home");
if (picked() !== "2026-11-09") return "Home: " + picked();
await k("End");
if (picked() !== "2026-11-15") return "End: " + picked();
await k("PageDown");
if (picked() !== "2026-12-15" || document.activeElement.dataset.day !== "2026-12-15") return "PageDown: " + picked();
await k("PageUp");
if (picked() !== "2026-11-15") return "PageUp: " + picked();
if (box.querySelectorAll('.ui-calendar-sheet-grid [tabindex="0"]').length !== 1) return "one day in the tab order";

// Sunday first, folded from the start; a bad time is all day, and bad items are left out.
const sun = $("#calendar-sheet-more .ui-calendar-sheet");
if (sun.querySelector("[data-day]").dataset.day !== "2026-02-01") return "Sunday first: " + sun.querySelector("[data-day]").dataset.day;
if (!sun.classList.contains("ui-calendar-sheet-folded")) return "folded={true}";
if (sun.style.getPropertyValue("--rows").trim() !== "4") return "February 2026 from a Sunday is four rows: " + sun.style.getPropertyValue("--rows");
if (sun.style.getPropertyValue("--at").trim() !== "1") return "the week of the 10th: " + sun.style.getPropertyValue("--at");
const sunItems = [...sun.querySelectorAll(".ui-calendar-sheet-item")].map((i) => i.textContent.replace(/\s+/g, " ").trim());
if (sunItems.join("|") !== "All dayYes") return "bad items: " + sunItems.join("|");
