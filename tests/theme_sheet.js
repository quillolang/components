// mobile
const dlg = $("#theme-sheet-demo dialog"), openBtn = $("#theme-sheet-demo-open"), out = () => $("#theme-sheet-demo-out").textContent;
const mode = (m) => dlg.querySelector(`input[value="${m}"][name$="-theme"]`), acc = (a) => dlg.querySelector(`input[value="${a}"][name$="-accent"]`);
const html = document.documentElement;
const v = (el, n) => getComputedStyle(el).getPropertyValue(n).trim();
const cookie = () => (document.cookie.match(/ui-theme=([^;]*)/) ?? [])[1] ?? null;
const scheme = (on) => cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: on ? "dark" : "light" }] });
const preview = dlg.querySelector(".ui-theme-sheet-preview"), sample = dlg.querySelector(".ui-theme-sheet-sample");
const open = async () => { await tap(openBtn); await wait(320); };
const closed = () => !dlg.open;
const luminance = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const hex = (rgb) => "#" + rgb.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, "0")).join("");
await scheme(false);
const seen = [];
document.addEventListener("ui-theme-change", () => seen.push(1));
try {
    if (dlg.open) return "open at the start";
    await open();
    if (!dlg.open) return "a tap does not open it";
    if (!mode("system").checked || !acc("indigo").checked) return "the start";
    // A real tap on each choice, with the page and the preview changing at once.
    await tap(mode("dark").closest("label"));
    if (!mode("dark").checked || mode("system").checked) return "radio: dark";
    if (!html.classList.contains("ui-dark")) return "the page is not dark";
    if (getComputedStyle(document.body).backgroundColor !== "rgb(15, 14, 23)") return "the page's background: " + getComputedStyle(document.body).backgroundColor;
    if (getComputedStyle(preview).backgroundColor !== "rgb(15, 14, 23)") return "the preview did not follow";
    if (cookie() !== "dark.indigo") return "kept: " + cookie();
    if (seen.length !== 1) return "ui-theme-change: " + seen.length;
    if (!out().startsWith("dark.indigo")) return "on_change: " + out();
    await tap(acc("teal").closest("label"));
    if (v(html, "--ui-accent") !== "#4fd1c5") return "the accent, dark: " + v(html, "--ui-accent");
    if (hex(getComputedStyle(sample).backgroundColor) !== "#4fd1c5") return "the preview's accent";
    if (cookie() !== "dark.teal") return "kept: " + cookie();
    // Text on the accent is worked out: dark text on a light accent, at a readable contrast.
    if (hex(getComputedStyle(sample).color) !== "#17132e") return "text on teal, dark: " + getComputedStyle(sample).color;
    await tap(mode("light").closest("label"));
    if (html.classList.contains("ui-dark") || !html.classList.contains("ui-light")) return "light: " + html.className;
    if (v(html, "--ui-accent") !== "#0b7470") return "the accent, light: " + v(html, "--ui-accent");
    if (hex(getComputedStyle(sample).color) !== "#ffffff") return "text on teal, light: " + getComputedStyle(sample).color;
    await tap(mode("system").closest("label"));
    if (html.classList.contains("ui-dark") || html.classList.contains("ui-light")) return "system leaves a class: " + html.className;
    if (v(html, "--ui-accent") !== "#0b7470") return "system, light";
    // System follows the system, live, with the accent changing with it.
    await scheme(true); await wait(120);
    if (getComputedStyle(document.body).backgroundColor !== "rgb(15, 14, 23)") return "the system's dark";
    if (v(html, "--ui-accent") !== "#4fd1c5") return "the system's dark, the accent: " + v(html, "--ui-accent");
    // Forced light under a dark system.
    await tap(mode("light").closest("label"));
    if (getComputedStyle(document.body).backgroundColor !== "rgb(255, 255, 255)") return "light under a dark system";
    if (v(html, "--ui-accent") !== "#0b7470") return "light under a dark system, accent";
    await scheme(false); await wait(120);

    // Every accent reads, on both themes, by the rule for text. Worked out here, not by the component.
    for (const a of ["indigo", "teal", "green", "amber", "rose", "blue"]) {
        await tap(acc(a).closest("label"));
        for (const m of ["light", "dark"]) {
            await tap(mode(m).closest("label"));
            const fill = hex(getComputedStyle(sample).backgroundColor), text = hex(getComputedStyle(sample).color), bg = hex(getComputedStyle(preview).backgroundColor);
            if (contrast(fill, text) < 4.5) return `${a} ${m}: text on it ${contrast(fill, text).toFixed(2)}`;
            if (contrast(fill, bg) < 3) return `${a} ${m}: on the page ${contrast(fill, bg).toFixed(2)}`;
        }
    }
    await tap(mode("system").closest("label"));
    await tap(acc("indigo").closest("label"));
    if (document.getElementById("ui-theme-sheet-style").textContent !== "") return "the first accent writes rules";
    if (v(html, "--ui-accent") !== "#5b4bdb") return "back to the kit's own: " + v(html, "--ui-accent");

    // Keys: the radios are real, so arrows work, with focus shown. Done is an equal to the drag.
    mode("system").focus(); await wait(30);
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 }); await wait(80);
    if (!mode("dark").checked || !html.classList.contains("ui-dark")) return "an arrow key";
    await cdp("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 }); await wait(80);
    if (!mode("system").checked) return "back by key";
    await tap(dlg.querySelector(".ui-theme-sheet-done")); await wait(80);
    if (!closed() || !out().endsWith("closed 1.")) return "Done: " + out();
    await open();
    await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(120);
    if (!closed()) return "Escape";

    if (device === "phone") {
        await open();
        const grip = dlg.querySelector(".ui-theme-sheet-grip");
        const h = dlg.offsetHeight, base = dlg.getBoundingClientRect().top;
        if (Math.abs(dlg.getBoundingClientRect().bottom - innerHeight) > 1) return "a phone: at the bottom";
        // Short: it springs back.
        await drag(grip, 0, 40, 240); await wait(320);
        if (!dlg.open || dlg.style.transform !== "" || Math.abs(dlg.getBoundingClientRect().top - base) > 1) return "a short drag: " + dlg.style.transform;
        // Upward does nothing past where it stands.
        await drag(grip, 0, -80, 240); await wait(320);
        if (!dlg.open || Math.abs(dlg.getBoundingClientRect().top - base) > 1) return "dragged up";
        // Mid-drag it follows the finger; a change of state under the finger leaves it there.
        const r = grip.getBoundingClientRect(), p = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        await fingers("touchStart", [p]);
        for (const y of [10, 30, 70]) { await fingers("touchMove", [{ x: p.x, y: p.y + y }]); await wait(30); }
        if (dlg.style.transform !== "translateY(70px)") return "mid drag: " + dlg.style.transform;
        acc("rose").click(); await wait(80);
        if (!cookie().endsWith(".rose")) return "mid drag: the state did not change: " + cookie();
        if (dlg.style.transform !== "translateY(70px)" || !dlg.classList.contains("ui-theme-sheet-dragging")) return "a state change mid-drag moved it: " + dlg.style.transform;
        await fingers("touchMove", [{ x: p.x, y: p.y + 90 }]); await wait(30);
        if (dlg.style.transform !== "translateY(90px)") return "the drag stopped after a state change: " + dlg.style.transform;
        // The system takes the gesture: back, and still open.
        await fingers("touchCancel", []); await wait(320);
        if (!dlg.open || dlg.style.transform !== "" || dlg.classList.contains("ui-theme-sheet-dragging")) return "cancelled: " + dlg.style.transform;
        await tap(acc("indigo").closest("label"));
        // Far enough: closed, and it comes back whole.
        await drag(grip, 0, h * 0.45, 500); await wait(120);
        if (dlg.open) return "a long drag did not close it";
        if (dlg.style.transform !== "") return "a long drag leaves a transform";
        await open();
        // A flick: short, fast.
        await drag(grip, 0, 90, 40); await wait(120);
        if (dlg.open) return "a flick did not close it";
        await open();
        // A tap on Done from the header is not a drag.
        await tap(dlg.querySelector(".ui-theme-sheet-done")); await wait(80);
        if (dlg.open) return "Done in the dragged header";
    } else {
        // A tablet: in the middle, the preview beside the choices, and no drag.
        await open();
        const r = dlg.getBoundingClientRect();
        if (Math.abs((r.left + r.right) / 2 - innerWidth / 2) > 1 || Math.abs((r.top + r.bottom) / 2 - innerHeight / 2) > 1) return `a tablet: not in the middle: ${r.left}, ${r.top}`;
        if (r.width !== 620) return "a tablet: width " + r.width;
        const pv = preview.getBoundingClientRect(), g = dlg.querySelector(".ui-theme-sheet-group").getBoundingClientRect();
        if (!(pv.left >= g.right)) return `a tablet: the preview ${pv.left}, ${g.right}`;
        if (getComputedStyle(dlg.querySelector(".ui-theme-sheet-grip")).display !== "none") return "a tablet: a grip";
        await drag(dlg.querySelector(".ui-theme-sheet-head h2"), 0, 200, 240); await wait(200);
        if (!dlg.open || dlg.style.transform !== "") return "a tablet: a drag acted";
        await tap(dlg.querySelector(".ui-theme-sheet-done")); await wait(80);
    }

    // A tap outside closes it, on the backdrop's own place.
    await open();
    await fingers("touchStart", [{ x: 8, y: 6 }]); await fingers("touchEnd", []); await wait(200);
    if (dlg.open) return "a tap outside";

    // With its own button, and remember off: it acts on the page and keeps nothing. Each has its own groups.
    const own = $("#theme-sheet-demo-own"), ownDlg = own.querySelector("dialog");
    await tap(own.querySelector("button.ui-theme-sheet-open")); await wait(320);
    if (!ownDlg.open) return "the trigger";
    if (ownDlg.querySelector('input[name$="-theme"]').name === mode("dark").name) return "two sheets share a radio group";
    await tap(ownDlg.querySelector('input[value="dark"]').closest("label"));
    if (!html.classList.contains("ui-dark")) return "the second sheet's choice";
    if (cookie() !== "system.indigo") return "remember null wrote a cookie: " + cookie();
    if (!mode("system").checked) return "a choice in one sheet moved the other's radio";
    await tap(ownDlg.querySelector('input[value="system"]').closest("label"));
    await tap(ownDlg.querySelector(".ui-theme-sheet-done")); await wait(80);

    // Kept, with no flash: the server's page, with every script taken out, is already dark, teal.
    await open();
    await tap(mode("dark").closest("label"));
    await tap(acc("teal").closest("label"));
    await tap(dlg.querySelector(".ui-theme-sheet-done")); await wait(80);
    const firstPaint = async () => {
        const served = await (await fetch(location.pathname + "?only=theme_sheet")).text();
        const frame = document.createElement("iframe");
        frame.srcdoc = served.replace(/<script[\s\S]*?<\/script>/g, "");
        frame.style.cssText = "position: fixed; left: 0; top: 0; width: 300px; height: 200px; visibility: hidden";
        const loaded = new Promise((done) => { frame.onload = done; });
        document.body.append(frame);
        await loaded;
        const w = frame.contentWindow, d = frame.contentDocument, s = w.getComputedStyle(d.documentElement);
        const got = { bg: s.getPropertyValue("--ui-bg").trim(), accent: s.getPropertyValue("--ui-accent").trim(), scheme: s.colorScheme, body: w.getComputedStyle(d.body).backgroundColor, checked: d.querySelector('#theme-sheet-demo input[value="dark"]').hasAttribute("checked") };
        frame.remove();
        return got;
    };
    let f = await firstPaint();
    if (f.bg !== "#0f0e17" || f.accent !== "#4fd1c5" || f.scheme !== "dark" || f.body !== "rgb(15, 14, 23)") return "first paint, dark: " + JSON.stringify(f);
    if (!f.checked) return "first paint: the server did not mark dark";
    // Light under a dark system must beat the theme's media query.
    await scheme(true); await wait(100);
    await open();
    await tap(mode("light").closest("label"));
    await tap(dlg.querySelector(".ui-theme-sheet-done")); await wait(80);
    f = await firstPaint();
    if (f.bg !== "#ffffff" || f.accent !== "#0b7470" || f.scheme !== "light") return "first paint, light on a dark system: " + JSON.stringify(f);
    await scheme(false); await wait(100);

    // A cookie can say anything: the sheet holds only what it knows.
    for (const bad of ["evil", "dark.nope", "</style><b>x", "dark.teal.more", "x".repeat(200)]) {
        document.cookie = `ui-theme=${encodeURIComponent(bad)}; Path=/`;
        const text = await (await fetch(location.pathname + "?only=theme_sheet")).text();
        if (text.includes("<b>x")) return "a cookie reached the page";
        const m = text.match(/id="ui-theme-sheet-style">([^<]*)</);
        if (!m) return "no sheet for " + bad;
        if (bad === "evil" && m[1] !== "") return "evil: " + m[1];
    }

    // Started open at load, the state its code reads is there: a real page in a frame.
    document.cookie = "ui-theme=dark.rose; Path=/";
    const frame = document.createElement("iframe");
    frame.src = location.pathname + "?only=theme_sheet&sheet=open";
    frame.style.cssText = "position: fixed; left: 0; top: 0; width: 390px; height: 700px; visibility: hidden";
    const loaded = new Promise((done) => { frame.onload = done; });
    document.body.append(frame);
    await loaded; await wait(900);
    const fd = frame.contentDocument, fdlg = fd.querySelector("#theme-sheet-demo dialog");
    if (!fdlg.open) { frame.remove(); return "open at load"; }
    if (!fd.documentElement.classList.contains("ui-dark")) { frame.remove(); return "open at load: not applied"; }
    if (!fdlg.querySelector('input[value="rose"]').checked) { frame.remove(); return "open at load: the accent"; }
    frame.remove();
} finally {
    document.cookie = "ui-theme=; Path=/; Max-Age=0";
    html.classList.remove("ui-dark", "ui-light");
    const t = document.getElementById("ui-theme-sheet-style");
    if (t) t.textContent = "";
    await cdp("Emulation.setEmulatedMedia", { features: [] });
}
