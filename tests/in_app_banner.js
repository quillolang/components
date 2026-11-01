// mobile
const one = $$("button.ui-btn").find((b) => b.textContent === "One banner");
const three = $$("button.ui-btn").find((b) => b.textContent === "Three at once");
const banner = () => $(".ui-in-app-banner");
const main = () => $(".ui-in-app-banner-main");
const opened = () => $(".in-app-banner-demo-opened").textContent;
const dismissed = () => +$(".in-app-banner-demo-dismissed").textContent;
const leave = () => wait(420);
const host = $(".ui-in-app-banner-host");
if (host.getAttribute("role") !== "status" || host.getAttribute("aria-live") !== "polite") return "the place is not a live region";
if (banner()) return "a banner shows before any was sent";

// Comes from the top of its frame, and goes by itself after 3 seconds.
await tap(one);
for (let i = 0; i < 40 && !banner(); i++) await wait(50);
await wait(500);
let b = banner();
if (!b) return "no banner came";
const frameTop = $(".demo-phone").getBoundingClientRect().top;
const rest = b.getBoundingClientRect();
if (rest.top < frameTop || rest.top > frameTop + 16) return `it is not at the top of its frame: ${rest.top} in ${frameTop}`;
if (!b.textContent.includes("Ana Ruiz") || !b.textContent.includes("Are we still on for lunch at one?") || !b.textContent.includes("Messages")) return "the note's words are missing";
if ($(".ui-in-app-banner-icon").textContent !== "M") return "the icon is not the app's first letter";
if ($(".ui-in-app-banner-more")) return "one banner says more are waiting";
if (document.activeElement.closest?.(".ui-in-app-banner")) return "a banner took focus";
await wait(1800);
if (!banner()) return "it went too soon";
await wait(1300);
if (banner()) return "it did not go by itself after 3 seconds";
if (dismissed() !== 1) return `leaving by itself counted ${dismissed()}`;

// A short swipe springs back.
await tap(one); await wait(500);
b = banner();
let p = middle(b);
await fingers("touchStart", [p]);
for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - 6 * i }]); await wait(16); }
await wait(40);
const moved = rest.top - b.getBoundingClientRect().top;
if (Math.abs(moved - 18) > 1) return `it does not follow the finger: ${moved}`;
await wait(140);
await fingers("touchEnd", []); await wait(400);
if (Math.abs(b.getBoundingClientRect().top - rest.top) > 1 || !banner()) return "a short swipe did not spring back";
if (opened() !== "none") return "a short swipe opened it";

// Pulled down it resists. Pulled 100, it moves 23.16 by a limit of 40.
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y + 10 * i }]); await wait(16); }
await wait(30);
const down = b.getBoundingClientRect().top - rest.top;
if (Math.abs(down - 23.16) > 0.8) return `pulled down 100 it moved ${down}, not 23.16`;
// The system takes the gesture: it goes back.
await fingers("touchCancel", []); await wait(380);
if (Math.abs(b.getBoundingClientRect().top - rest.top) > 1) return "a cancelled gesture did not go back";

// A finger on it holds the timer: 5 seconds down, for a banner of 3.
p = middle($(".ui-in-app-banner-icon"));
await fingers("touchStart", [p]);
await wait(3600);
if (!banner()) return "a banner under a finger went anyway";
await fingers("touchCancel", []);
await wait(3500);
if (banner()) return "after the finger left the timer did not run on";

// A swipe up past the distance, and a flick.
const before = dismissed();
await tap(one); await wait(500);
b = banner();
p = middle($(".ui-in-app-banner-icon"));
await fingers("touchStart", [p]);
for (let i = 1; i <= 10; i++) { await fingers("touchMove", [{ x: p.x, y: p.y - b.offsetHeight * .5 * i / 10 }]); await wait(16); }
await wait(140);
await fingers("touchEnd", []); await leave();
if (banner()) return "a swipe up does not dismiss it";
if (dismissed() !== before + 1) return "the swipe did not call on_dismiss";
if (opened() !== "none") return "a swipe opened it";
await tap(one); await wait(500);
p = middle($(".ui-in-app-banner-icon"));
await fingers("touchStart", [p]);
await fingers("touchMove", [{ x: p.x, y: p.y - 8 }]);
await fingers("touchMove", [{ x: p.x, y: p.y - 24 }]);
await fingers("touchEnd", []); await leave();
if (banner()) return "a flick up does not dismiss it";

// A sideways drag is not the gesture.
await tap(one); await wait(500);
const t0 = banner().getBoundingClientRect().top;
await drag($(".ui-in-app-banner-icon"), 60, 2, 240); await wait(200);
if (!banner() || banner().getBoundingClientRect().top !== t0) return "a sideways drag moved it";
if (banner().style.transform !== "") return "a sideways drag left a transform";
if (opened() !== "none") return "a sideways drag opened it";

// A tap opens it.
await tap(main()); await leave();
if (banner()) return "a tap does not take it away";
if (opened() === "none") return "a tap did not call on_open";
const count = dismissed();

// The queue: three, one at a time, saying how many wait.
await tap(three); await wait(500);
const firstTitle = banner().querySelector(".ui-in-app-banner-title").textContent;
if ($(".ui-in-app-banner-more")?.textContent !== "2 more") return `three say ${$(".ui-in-app-banner-more")?.textContent}`;
await tap($(".ui-in-app-banner-close")); await leave();
const second = banner()?.querySelector(".ui-in-app-banner-title").textContent;
if (!second || second === firstTitle) return "the next did not follow";
if ($(".ui-in-app-banner-more")?.textContent !== "1 more") return "the count did not fall";
if (dismissed() !== count + 1) return "the Dismiss button did not call on_dismiss";
// Keys: Tab reaches it, Escape sends it away; focus in it holds it.
$(".ui-in-app-banner-main").focus();
await wait(3400);
if (banner()?.querySelector(".ui-in-app-banner-title").textContent !== second) return "focus in it did not hold the timer";
key($(".ui-in-app-banner-main"), "Escape"); await leave();
if (banner()?.querySelector(".ui-in-app-banner-title").textContent === second) return "Escape did not send it away";
if ($(".ui-in-app-banner-more")) return "the last one says more wait";
await tap($(".ui-in-app-banner-close")); await leave();
if (banner()) return "the line did not end";
await tap(one); await wait(500);

// Where motion is unwelcome it does not move.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const still = getComputedStyle(banner()).animationName;
await cdp("Emulation.setEmulatedMedia", { features: [] });
if (still !== "none") return `with reduced motion: ${still}`;
await tap($(".ui-in-app-banner-close")); await leave();
