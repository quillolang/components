// mobile
const pfl = $("#profile-screen-demo .ui-profile-screen");
const box = pfl.querySelector(".ui-profile-screen-scroll");
const cover = pfl.querySelector(".ui-profile-screen-cover");
const tabs = pfl.querySelector("[role=tablist]");
const tabBtn = (t) => tabs.querySelector(`[data-tab=${t}]`);
const panel = (t) => pfl.querySelector(`.ui-profile-screen-panels > [data-tab=${t}]`);
const note = () => $("#profile-screen-note").textContent;
const p = () => getComputedStyle(pfl.querySelector(".ui-profile-screen-in")).getPropertyValue("--ui-profile-screen-p").trim();
const face = pfl.querySelector(".ui-profile-screen-face");
const top = () => box.getBoundingClientRect().top;
const titled = () => pfl.matches(".ui-profile-screen-titled") || !!pfl.querySelector(".ui-profile-screen-titled");

// Numbers, cut down and never up: 214, 15300 to 15.3K, 1999 to 1.9K, text as it is.
const stats = [...pfl.querySelectorAll("dd")].map((d) => d.textContent).join();
if (stats !== "214,15.3K,1.9K,2019") return "stats: " + stats;
if (tabBtn("likes").querySelector("small").textContent !== "1.2K") return "a tab's count: " + tabBtn("likes").textContent;

// Only the first tab shows.
if (panel("posts").hidden || !panel("likes").hidden || !panel("about").hidden) return "only the first panel should show";
if (tabBtn("posts").getAttribute("aria-selected") !== "true") return "the first tab is not marked";
if (panel("posts").getAttribute("role") !== "tabpanel") return "panels should be tabpanels";

// Follow.
await tap(pfl.querySelector(".ui-profile-screen-action"));
if (pfl.querySelector(".ui-profile-screen-action").textContent !== "Following" || note() !== "Following: true") return "the action: " + note();
await tap(pfl.querySelector("[aria-label=Back]"));
if (note() !== "Back") return "on_back: " + note();

if (device === "phone") {
    // A little down: a share of the collapse, the cover going under the bar.
    await drag(box, 0, -64, 400); await wait(250);
    const s = box.scrollTop;
    if (s < 30) return "a real drag did not scroll: " + s;
    const range = 180 - 52, expected = Math.round(Math.min(s / range, 1) * 1000) / 1000;
    if (Math.abs(+p() - expected) > 0.002) return `at ${s} the progress should be ${expected}: ${p()}`;
    if (s < range && Math.abs(cover.getBoundingClientRect().top - (top() - s)) > 1) return "the cover should move with the page until it sticks";
    const scale = new DOMMatrix(getComputedStyle(face).transform).a;
    if (Math.abs(scale - (1 - 0.45 * +p())) > 0.002) return "the picture should shrink with it: " + scale;

    // Far down: the cover is the bar, the tabs stuck under it, the name up.
    box.scrollTop = 500; await wait(120);
    if (p() !== "1") return "collapsed, the progress is " + p();
    const c = cover.getBoundingClientRect(), t = tabs.getBoundingClientRect();
    if (Math.abs(c.bottom - (top() + 52)) > 1) return `the cover should stay as a bar of 52: ${c.bottom - top()}`;
    if (Math.abs(t.top - (top() + 52)) > 1) return `the tabs should stick under the bar: ${t.top - top()}`;
    if (!titled()) return "the name should be in the bar";
    if (getComputedStyle(pfl.querySelector(".ui-profile-screen-title")).opacity === "0" && (await wait(300), getComputedStyle(pfl.querySelector(".ui-profile-screen-title")).opacity !== "1")) return "the name did not show";

    // What the outer element's style and class read changes, collapsed: both are written whole, and what
    // scrolling set by hand must not be on them. 200 is put back, as the numbers below are for 180.
    const shrunk = new DOMMatrix(getComputedStyle(face).transform).a;
    if (Math.abs(shrunk - 0.55) > 0.002) return "collapsed, the picture should be at 0.55: " + shrunk;
    $("#profile-screen-tall").click(); await wait(120);
    if (!pfl.className.includes("demo-tall") || !pfl.getAttribute("style").includes("200px")) return "the props did not reach it";
    if (p() !== "1") return "a prop changing lost the collapse: " + JSON.stringify(p());
    if (Math.abs(new DOMMatrix(getComputedStyle(face).transform).a - 0.55) > 0.002) return "a prop changing brought the picture back";
    if (!titled()) return "a prop changing lost the name in the bar";
    $("#profile-screen-tall").click(); await wait(120);

    // Each tab keeps its place, at a place past the header: posts at 500.
    await tap(tabBtn("likes")); await wait(120);
    if (!panel("posts").hidden || panel("likes").hidden) return "the tab did not change";
    if (note() !== "Tab: likes") return "on_tab: " + note();
    const stuck = tabs.getBoundingClientRect().top - top();
    if (Math.abs(stuck - 52) > 1) return "changing tab should not bring the header back: " + stuck;
    const line = box.scrollTop;
    if (line >= 500) return "a new tab should start at the top of its content: " + line;
    box.scrollTop = line + 90; await wait(100);
    await tap(tabBtn("posts")); await wait(120);
    if (box.scrollTop !== 500) return "posts should come back at 500: " + box.scrollTop;
    await tap(tabBtn("likes")); await wait(120);
    if (box.scrollTop !== line + 90) return `likes should come back at ${line + 90}: ` + box.scrollTop;
    // A short tab still holds the tabs up.
    await tap(tabBtn("about")); await wait(120);
    if (Math.abs(tabs.getBoundingClientRect().top - top() - 52) > 1) return "a short tab let the header back: " + (tabs.getBoundingClientRect().top - top());

    // With the header showing, changing tab leaves the page where it is.
    box.scrollTop = 20; await wait(120);
    await tap(tabBtn("posts")); await wait(120);
    if (box.scrollTop !== 20) return "with the header showing, it should stay at 20: " + box.scrollTop;
    if (p() !== String(Math.round(20 / 128 * 1000) / 1000)) return "progress at 20: " + p();

    // iOS pulls past the top, which Chrome does not: the scroll goes negative and the cover grows.
    const pic = pfl.querySelector(".ui-profile-screen-cover img");
    Object.defineProperty(box, "scrollTop", { get: () => -36, configurable: true });
    box.dispatchEvent(new Event("scroll")); await wait(60);
    delete box.scrollTop;
    if (pic.style.transform !== "scale(1.2)") return "pulled past the top, the cover should grow: " + pic.style.transform;
    box.dispatchEvent(new Event("scroll")); await wait(60);
    if (pic.style.transform !== "") return "the cover stayed grown";
} else {
    // On a tablet: two columns, the person stays, no collapse.
    const aside = pfl.querySelector(".ui-profile-screen-aside"), main = pfl.querySelector(".ui-profile-screen-main");
    if (Math.abs(aside.getBoundingClientRect().width - 320) > 2) return "the person's column: " + aside.getBoundingClientRect().width;
    if (main.getBoundingClientRect().left < aside.getBoundingClientRect().right - 1) return "the columns overlap";
    await drag(box, 0, -300, 300); await wait(250);
    const s = box.scrollTop;
    if (s < 100) return "it should scroll: " + s;
    if (p() !== "0") return "no collapse on a tablet: " + p();
    if (Math.abs(aside.getBoundingClientRect().top - top()) > 1) return "the person should stay in sight: " + (aside.getBoundingClientRect().top - top());
    if (Math.abs(tabs.getBoundingClientRect().top - top()) > 1) return "the tabs should stick at the top: " + (tabs.getBoundingClientRect().top - top());
    await tap(tabBtn("likes")); await wait(120);
    if (box.scrollTop !== 0 && Math.abs(tabs.getBoundingClientRect().top - top()) > 1) return "tabs on a tablet";
    box.scrollTop = 40; await wait(100);
    await tap(tabBtn("posts")); await wait(120);
    if (box.scrollTop !== s) return `posts should come back at ${s}: ` + box.scrollTop;
}

// Turned: the tab and how far down it was stay.
{
    await tap(tabBtn("likes")); await wait(100);
    box.scrollTop = 300; await wait(100);
    const [w, h] = [innerWidth, innerHeight];
    await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(300);
    const still = pfl.querySelector("[aria-selected=true]").dataset.tab, at = box.scrollTop;
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (still !== "likes") return "turning the screen lost the tab";
    if (at <= 0) return "turning the screen lost the place";
    await tap(tabBtn("posts")); await wait(100);
}

// Keys: the arrows move through the tabs, with the focus, and wrap.
tabBtn("posts").focus();
await wait(50);
const was = pfl.querySelector("[aria-selected=true]").dataset.tab;
key(tabs, "ArrowRight"); await wait(100);
const after = pfl.querySelector("[aria-selected=true]").dataset.tab;
const order = ["posts", "likes", "about"];
if (after !== order[(order.indexOf(was) + 1) % 3]) return `ArrowRight from ${was}: ${after}`;
if (document.activeElement !== tabBtn(after)) return "focus should follow";
if (tabBtn(after).tabIndex !== 0 || tabBtn(was).tabIndex !== -1) return "only the current tab is in the tab order";
key(tabs, "End"); await wait(100);
key(tabs, "ArrowRight"); await wait(100);
if (pfl.querySelector("[aria-selected=true]").dataset.tab !== "posts") return "ArrowRight should wrap";
key(tabs, "ArrowLeft"); await wait(100);
if (pfl.querySelector("[aria-selected=true]").dataset.tab !== "about") return "ArrowLeft should wrap";
key(tabs, "Home"); await wait(100);
if (pfl.querySelector("[aria-selected=true]").dataset.tab !== "posts") return "Home";
