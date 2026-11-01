// mobile
const tag = () => document.querySelector('meta[name="theme-color"]');
const own = () => document.querySelector("meta[data-ui-status-tint]");
const color = () => tag()?.content ?? null;
const out = () => $("#status-tint-demo-out").textContent;
const changes = () => +$("#status-tint-demo-out").dataset.changes;
const home = $("#status-tint-demo-home"), alerts = $("#status-tint-demo-alerts"), over = $("#status-tint-demo-over"), leave = $("#status-tint-demo-leave");
const field = $("#status-tint-demo-color");
const note = () => $(".ui-status-tint-note")?.textContent ?? "";
const dark = (on) => cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: on ? "dark" : "light" }] });
await dark(false); await wait(150);
try {
    // By itself: the theme's page colour, in the head, ahead of all else.
    if (color() !== "#ffffff") return "the theme's colour: " + color();
    if (document.head.firstElementChild !== own()) return "not first in the head";
    if (note() !== "The browser's bar is asked for #ffffff.") return "the note: " + note();
    // The system goes dark and comes back: it follows with nothing else happening.
    await dark(true); await wait(150);
    if (color() !== "#0f0e17") return "the system's dark: " + color();
    await dark(false); await wait(150);
    if (color() !== "#ffffff") return "the system's light: " + color();
    // A class on <html> or <body>, as ThemeToggle sets: followed too.
    document.documentElement.classList.add("ui-dark"); await wait(120);
    if (color() !== "#0f0e17") return "a class on html: " + color();
    document.documentElement.classList.remove("ui-dark"); await wait(120);
    document.body.classList.add("ui-dark"); await wait(120);
    if (color() !== "#0f0e17") return "a class on body: " + color();
    document.body.classList.remove("ui-dark"); await wait(120);
    if (color() !== "#ffffff") return "after the classes: " + color();

    // By page, and by theme: the page changes, and so does its dark colour.
    await tap(alerts);
    if (color() !== "#c62a2f") return "alerts: " + color();
    await dark(true); await wait(150);
    if (color() !== "#3a1618") return "alerts, dark: " + color();
    await dark(false); await wait(150);
    await tap(home);
    if (color() !== "#ffffff") return "home: " + color();

    // Any colour the browser reads, worked out by hand; what it cannot is the theme's.
    const tries = [["rgb(10, 125, 85)", "#0a7d55"], ["#0A7D55", "#0a7d55"], ["rebeccapurple", "#663399"], ["hsl(0 100% 50%)", "#ff0000"],
        ["hsl(120 100% 25%)", "#008000"], ["rgba(255, 0, 0, 0.5)", "#ff0000"], ["color-mix(in srgb, #000 50%, #fff)", "#808080"],
        ["not a colour", "#ffffff"], ["transparent", "#ffffff"], ["rgba(1, 2, 3, 0)", "#ffffff"], ["", "#ffffff"], ["red; background: url(x)", "#ffffff"]];
    for (const [text, want] of tries) {
        type(field, text); await wait(60);
        if (color() !== want) return `${text}: ${color()}, not ${want}`;
    }
    type(field, "oklch(50% 0.1 200)"); await wait(60);
    if (!color().startsWith("oklch(")) return "another colour space is passed on: " + color();
    // on_change hears each new colour once.
    await tap(home);
    const n = changes();
    type(field, "#123456"); await wait(60);
    if (changes() !== n + 1 || out() !== "On change: #123456") return `on_change: ${changes() - n}, ${out()}`;
    type(field, "rgb(18, 52, 86)"); await wait(60);
    if (changes() !== n + 1) return "the same colour told twice";
    await tap(home);

    // Restored on leaving: a tag of the page's own comes back as it was, the page never touched.
    const page = document.createElement("meta");
    page.name = "theme-color"; page.content = "#abcdef"; page.media = "(prefers-color-scheme: light)";
    document.head.append(page);
    if (color() !== "#ffffff") return "the page's own tag took over: " + color();
    await tap(leave);
    if (own()) return "the tag stays after leaving";
    if (color() !== "#abcdef" || page.getAttribute("media") !== "(prefers-color-scheme: light)") return "not restored: " + color();
    await tap(leave);
    if (color() !== "#ffffff" || document.head.firstElementChild !== own()) return "back again: " + color();

    // Two at once: the newest wins, and they may leave in either order.
    await tap(alerts);
    await tap(over);
    if (color() !== "#0b6bcb") return "a sheet over the page: " + color();
    if (document.documentElement.style.backgroundColor !== "rgb(11, 107, 203)") return "background: " + document.documentElement.style.backgroundColor;
    await tap(over);
    if (color() !== "#c62a2f") return "the sheet left: " + color();
    await tap(over);
    await tap(leave);
    if (color() !== "#0b6bcb") return "the page left first: " + color();
    await tap(over);
    if (own() || color() !== "#abcdef") return "both left: " + color();
    if (document.documentElement.style.backgroundColor !== "") return "the page's background stays: " + document.documentElement.style.backgroundColor;
    await tap(leave);
    await tap(home);
    page.remove();

    // In the app a web view reads no theme-color, and it says so. A stand-in, in the test only.
    await tap(leave);
    window.quilloNative = {};
    await tap(leave);
    if (!note().includes("keeps its own colour")) return "the app's note: " + note();
    delete window.quilloNative;
} finally {
    delete window.quilloNative;
    document.documentElement.classList.remove("ui-dark"); document.body.classList.remove("ui-dark");
    await cdp("Emulation.setEmulatedMedia", { features: [] });
}
