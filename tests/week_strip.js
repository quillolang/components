// mobile
await wait(300);
const box = $(".ui-week-strip");
const pages = () => [...box.querySelectorAll(".ui-week-strip-page")];
const days = () => [...pages()[1].querySelectorAll("[data-day]")].map((b) => b.dataset.day);
const first = () => days()[0];
const title = () => box.querySelector(".ui-week-strip-jump span").textContent;
const btn = (d) => pages()[1].querySelector(`[data-day="${d}"]`);
const picked = () => pages()[1].querySelector('[aria-pressed="true"]')?.dataset.day;
const log = () => $("#week-strip-log").textContent;
const week = () => $("#week-strip-week").textContent;
const view = box.querySelector(".ui-week-strip-view");
const track = box.querySelector(".ui-week-strip-track");
const w = view.offsetWidth;

// 2026-11-04 is a Wednesday: Monday first.
if (first() !== "2026-11-02" || days()[6] !== "2026-11-08") return "the week: " + days();
if (picked() !== "2026-11-04") return "today starts picked: " + picked();
if (title() !== "November 2026") return "title: " + title();
if (btn("2026-11-04").getAttribute("aria-current") !== "date") return "today is marked";
if (btn("2026-11-04").getAttribute("aria-label") !== "Wednesday 4 November, today, 2 items") return "label: " + btn("2026-11-04").getAttribute("aria-label");
if (btn("2026-11-02").getAttribute("aria-label") !== "Monday 2 November, 1 item") return "label: " + btn("2026-11-02").getAttribute("aria-label");
if (btn("2026-11-05").getAttribute("aria-label") !== "Thursday 5 November") return "label: " + btn("2026-11-05").getAttribute("aria-label");
// Dots: as many as there are, up to three, then a plus; a tone on each.
const dots = (d) => [...btn(d).querySelectorAll(".ui-week-strip-dot")].map((x) => x.dataset.tone).join();
if (dots("2026-11-04") !== "danger,success") return "dots: " + dots("2026-11-04");
if (dots("2026-11-06") !== "warning,accent,accent" || !btn("2026-11-06").querySelector(".ui-week-strip-plus")) return "dots past three: " + dots("2026-11-06");
if (dots("2026-11-05") !== "" || btn("2026-11-05").querySelector(".ui-week-strip-plus")) return "no dots: " + dots("2026-11-05");
if (getComputedStyle(view).touchAction !== "pan-y") return "touch-action: " + getComputedStyle(view).touchAction;
if (!pages()[0].inert || !pages()[2].inert || pages()[1].inert) return "only the middle page can be reached";

// Days off the strip's left and right are real neighbours, drawn ready for the finger.
if (pages()[0].querySelector("[data-day]").dataset.day !== "2026-10-26") return "the week before";
if (pages()[2].querySelector("[data-day]").dataset.day !== "2026-11-09") return "the week after";

// A tap picks.
await tap(btn("2026-11-05"));
if (log() !== "2026-11-05" || picked() !== "2026-11-05") return "tap: " + log() + " " + picked();
if (week() !== "") return "no new week yet: " + week();

// Short and slow: springs back, nothing picked.
await drag(view, -w * 0.25, 0, 600);
await wait(300);
if (first() !== "2026-11-02") return "a short swipe moved the week: " + first();
if (track.style.transform !== "") return "should spring back: " + track.style.transform;
if (log() !== "2026-11-05") return "a short swipe picked: " + log();

// Mid-swipe the strip follows the finger, less the slop, with the next week in view.
const p = middle(view);
await fingers("touchStart", [p]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: p.x - 10 * i, y: p.y }]); await wait(30); }
await wait(40);
if (track.style.transform !== "translateX(calc(-33.3333% - 52px))") return "mid-swipe: " + track.style.transform;
// State changing under the finger must leave the drag alone.
type(box.querySelector(".ui-week-strip-date"), "0001-01-01");
await wait(60);
if (box.querySelector(".ui-week-strip-say").textContent === "") return "the state should have changed";
if (track.style.transform !== "translateX(calc(-33.3333% - 52px))") return "a state change undid the swipe: " + track.style.transform;
if (!track.classList.contains("ui-week-strip-moving")) return "a state change dropped the moving class";
await fingers("touchCancel", []);
await wait(300);
if (track.style.transform !== "" || first() !== "2026-11-02") return "a cancelled swipe should spring back";

// Past 40%: the next week, the same weekday picked.
await drag(view, -w * 0.6, 0, 600);
await wait(320);
if (first() !== "2026-11-09") return "a long swipe: " + first();
if (picked() !== "2026-11-12" || log() !== "2026-11-12") return "the weekday should stay: " + picked();
if (week() !== "2026-11-09") return "on_week: " + week();
const tr = new DOMMatrix(getComputedStyle(track).transform).m41;
if (Math.abs(tr + track.offsetWidth / 3) > 1) return "the strip should be home: " + tr;

// A flick from a short way, and the other way.
const flick = async (dist) => {
    const q = middle(view);
    await fingers("touchStart", [q]);
    for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: q.x + dist * i / 3, y: q.y }]); await wait(4); }
    await fingers("touchEnd", []);
    await wait(420);
};
await flick(70);
if (first() !== "2026-11-02") return "a flick right: " + first();
if (picked() !== "2026-11-05") return "after the flick: " + picked();
await flick(-70);
if (first() !== "2026-11-09") return "a flick left: " + first();

// Thrown back, it stays.
const q = middle(view);
await fingers("touchStart", [q]);
for (let i = 1; i <= 6; i++) { await fingers("touchMove", [{ x: q.x - 25 * i, y: q.y }]); await wait(30); }
await wait(120);
for (let i = 1; i <= 2; i++) { await fingers("touchMove", [{ x: q.x - 150 + 45 * i, y: q.y }]); await wait(4); }
await fingers("touchEnd", []);
await wait(350);
if (first() !== "2026-11-09") return "a throw back should stay: " + first();

// Down the page is the page's.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(view), scrollY);
await drag(view, 3, -150, 250);
if (scrollY <= y0) return "a vertical drag should scroll the page";
if (first() !== "2026-11-09") return "a vertical drag moved the week";
document.body.style.paddingBottom = "";
scrollTo(0, 0);
await wait(100);

// Today comes back; the button is off when it is there.
const todayBtn = [...box.querySelectorAll(".ui-week-strip-btn")].find((b) => b.textContent === "Today");
await tap(todayBtn);
if (picked() !== "2026-11-04" || first() !== "2026-11-02") return "Today: " + picked();
if (!todayBtn.disabled) return "Today should rest when it is today";

// The buttons do what a swipe does.
await tap(box.querySelector('[aria-label="Week after"]'));
await wait(350);
if (first() !== "2026-11-09") return "Week after: " + first();
await tap(box.querySelector('[aria-label="Week before"]'));
await wait(350);
await tap(box.querySelector('[aria-label="Week before"]'));
await wait(350);
if (first() !== "2026-10-26" || picked() !== "2026-10-28") return "Week before: " + first() + " " + picked();
if (title() !== "Oct to Nov 2026" && title() !== "October 2026") return "title: " + title();
if (title() !== "Oct to Nov 2026") return "a week across two months: " + title();

// Jumping to any day, through the field over the title.
const field = box.querySelector(".ui-week-strip-date");
if (field.type !== "date") return "the jump is the system's picker";
const fr = field.getBoundingClientRect(), tr2 = box.querySelector(".ui-week-strip-jump").getBoundingClientRect();
if (fr.width !== tr2.width || fr.height < 44) return "the field should lie over the title: " + fr.width + " " + fr.height;
type(field, "2027-03-17");
await wait(100);
if (picked() !== "2027-03-17" || first() !== "2027-03-15") return "the jump: " + picked();
if (log() !== "2027-03-17" || week() !== "2027-03-15") return "the jump's callbacks: " + log();
type(field, "0001-01-01");
await wait(100);
if (picked() !== "2027-03-17") return "a day too far should be refused";
if (box.querySelector(".ui-week-strip-say").textContent !== "Pick a day between 1900 and 2999.") return "what it says";
if (field.value !== "2027-03-17") return "the field should go back: " + field.value;
type(field, "");
await wait(100);
if (field.value !== "2027-03-17") return "an emptied field should go back: " + field.value;
await tap(todayBtn);

// Keys, from the picked day, focus following.
const k = async (name) => { key(document.activeElement, name); await wait(80); };
btn("2026-11-04").focus();
await k("ArrowRight");
if (picked() !== "2026-11-05" || document.activeElement.dataset.day !== "2026-11-05") return "ArrowRight: " + picked();
await k("ArrowDown");
if (picked() !== "2026-11-12" || first() !== "2026-11-09") return "ArrowDown: " + picked();
if (document.activeElement.dataset.day !== "2026-11-12") return "focus should follow to the next week: " + document.activeElement.dataset.day;
await k("Home");
if (picked() !== "2026-11-09") return "Home: " + picked();
await k("ArrowLeft");
if (picked() !== "2026-11-08" || first() !== "2026-11-02") return "ArrowLeft over the week's edge: " + picked();
await k("End");
if (picked() !== "2026-11-08") return "End: " + picked();
await k("PageUp");
if (picked() !== "2026-11-01") return "PageUp: " + picked();
await k("PageDown");
if (picked() !== "2026-11-08") return "PageDown: " + picked();
if ($$(".ui-week-strip-page")[1].querySelectorAll('[tabindex="0"]').length !== 1) return "one day in the tab order";

// Sunday first, across the year's end: a bad tone is the plain dot, and no bad mark counts.
const sun = $("#week-strip-sunday .ui-week-strip");
const sunDays = [...sun.querySelectorAll(".ui-week-strip-page")[1].querySelectorAll("[data-day]")].map((b) => b.dataset.day);
if (sunDays[0] !== "2026-12-27" || sunDays[6] !== "2027-01-02") return "Sunday first: " + sunDays;
if (sun.querySelector(".ui-week-strip-jump span").textContent !== "Dec 2026 to Jan 2027") return "across a year: " + sun.querySelector(".ui-week-strip-jump span").textContent;
if ([...sun.querySelectorAll(".ui-week-strip-dot")].filter((d) => d.closest(".ui-week-strip-page") === sun.querySelectorAll(".ui-week-strip-page")[1]).map((d) => d.dataset.tone).join() !== "accent") return "bad marks";

// Bad data shows a week.
if ($("#week-strip-bad .ui-week-strip-page [data-day]") === null) return "bad data should still show a week";

// Past midnight the page comes back to a new today.
const RealDate = Date;
const later = new RealDate(RealDate.now() + 2 * 864e5);
window.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [later.getTime()])); } };
document.dispatchEvent(new Event("visibilitychange"));
await wait(150);
window.Date = RealDate;
const moved = box.querySelector('[aria-current="date"]')?.dataset.day;
if (moved !== "2026-11-06") return "today should move on with the clock: " + moved;
document.dispatchEvent(new Event("visibilitychange"));
await wait(150);

if (device === "tablet") {
    const t = pages()[1].querySelector(".ui-week-strip-titles");
    if (getComputedStyle(t).display !== "grid") return "a tablet says what is on a day";
    const six = await (async () => { key(document.activeElement, "Home"); await wait(80); return btn("2026-11-02"); })();
    if (!six.textContent.includes("Standup")) return "the titles: " + six.textContent;
    if (six.offsetHeight < 120) return "a tablet's day has room: " + six.offsetHeight;
} else if (getComputedStyle(pages()[1].querySelector(".ui-week-strip-titles")).display !== "none") return "a phone shows dots only";
