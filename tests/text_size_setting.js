// mobile
const live = $("#text-size-setting-demo"), range = $("#text-size-setting-demo-range");
const page = $("#text-size-setting-demo-page"), out = $("#text-size-setting-demo-out");
const px = () => getComputedStyle(page).fontSize;
const readout = () => live.querySelector("output").textContent;
const less = live.querySelector(".ui-text-size-setting-less"), more = live.querySelector(".ui-text-size-setting-more");
const same = live.querySelector(".ui-btn");
const cookie = () => (document.cookie.match(/ui-text-size=([^;]*)/) ?? [])[1] ?? null;
const scale = () => getComputedStyle(document.documentElement).getPropertyValue("--ui-text-scale").trim();
const set = async (v, commit = true) => { range.focus(); range.value = v; range.dispatchEvent(new Event("input", { bubbles: true })); if (commit) range.dispatchEvent(new Event("change", { bubbles: true })); await wait(60); };
const tag = () => document.getElementById("ui-text-size-setting-style");
try {
    if (range.value !== "100" || readout() !== "100%") return "start: " + range.value;
    if (px() !== "15px") return "start, the page: " + px();
    // At 100 nothing is set, so the system stays in charge.
    if (tag() && tag().textContent !== "") return "at 100 a rule is set: " + tag().textContent;
    if (getComputedStyle(document.documentElement).webkitTextSizeAdjust !== "auto") return "at 100: " + getComputedStyle(document.documentElement).webkitTextSizeAdjust;

    // The page follows at each step, 15 px times the percent, before letting go.
    await set(120, false);
    if (px() !== "18px") return "120%: " + px();
    if (scale() !== "1.2") return "--ui-text-scale: " + scale();
    if (readout() !== "120%") return "readout: " + readout();
    if (range.getAttribute("aria-valuetext") !== "120 percent") return "aria-valuetext";
    if (cookie() !== null) return "kept before letting go";
    if (out.dataset.changes !== "0") return "told before letting go";
    await set(120);
    if (cookie() !== "120" || out.textContent !== "Kept: 120%.") return `let go: ${cookie()}, ${out.textContent}`;
    // Text only: what is around it keeps its size. The preview's box does not get wider.
    const before = live.getBoundingClientRect().width;
    await set(200);
    if (px() !== "30px") return "200%: " + px();
    if (live.getBoundingClientRect().width !== before) return "the layout moved";

    // A real finger on the real slider, at two thirds along: 85 + 115 * x, snapped to 5.
    await set(100);
    const r = range.getBoundingClientRect();
    await cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: r.left + r.width / 2, y: r.top + r.height / 2 }] });
    await wait(50);
    for (let i = 1; i <= 6; i++) { await cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: r.left + r.width / 2 + r.width * 0.2 * i / 6, y: r.top + r.height / 2 }] }); await wait(25); }
    const mid = +range.value;
    await cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(120);
    if (mid <= 150) return `a finger moved the slider to ${mid}`;
    if (+range.value % 5 !== 0 || readout() !== `${range.value}%` || px() !== `${15 * +range.value / 100}px`) return `a finger: ${range.value}, ${readout()}, ${px()}`;
    if (cookie() !== range.value) return `a finger let go: ${cookie()}, ${range.value}`;

    // The buttons are an equal to dragging, and stop at the ends.
    await set(195);
    await tap(more);
    if (range.value !== "200" || !more.disabled || cookie() !== "200") return `more: ${range.value}`;
    await set(90);
    await tap(less);
    if (range.value !== "85" || !less.disabled) return `less: ${range.value}`;
    if (px() !== "12.75px") return "85%: " + px();
    if (out.textContent !== "Kept: 85%.") return "less, told: " + out.textContent;
    await tap(same);
    if (range.value !== "100" || tag().textContent !== "" || cookie() !== "100") return `same as the system: ${range.value}, ${tag().textContent}`;
    if (!same.disabled) return "at 100 nothing to reset";

    // Kept: a page made with this cookie has the size with no script at all. The frame holds the
    // server's page with its scripts taken out, so this is what a first paint shows.
    await set(140);
    const frame = document.createElement("iframe");
    const served = await (await fetch(location.pathname + "?only=text_size_setting")).text();
    frame.srcdoc = served.replace(/<script[\s\S]*?<\/script>/g, "");
    frame.style.cssText = "position: fixed; left: 0; top: 0; width: 300px; height: 200px; visibility: hidden";
    const loaded = new Promise((done) => { frame.onload = done; });
    document.body.append(frame);
    await loaded;
    const inner = frame.contentDocument.getElementById("text-size-setting-demo-page");
    const framed = frame.contentWindow.getComputedStyle(inner).fontSize;
    const startValue = frame.contentDocument.getElementById("text-size-setting-demo-range").getAttribute("value");
    frame.remove();
    if (framed !== "21px") return `no script, the kept size: ${framed}`;
    if (startValue !== "140") return `the server's slider: ${startValue}`;

    // A cookie can say anything: it never reaches the sheet as written, and the page stays well.
    for (const bad of ["abc", "120;}body{display:none", "99999", "-5", ""]) {
        document.cookie = `ui-text-size=${encodeURIComponent(bad)}; Path=/`;
        const text = await (await fetch(location.pathname + "?only=text_size_setting")).text();
        const m = text.match(/id="ui-text-size-setting-style">([^<]*)</);
        if (!m) return "no style tag for " + bad;
        if (!/^(|html \{ -webkit-text-size-adjust: \d+%; text-size-adjust: \d+%; --ui-text-scale: [\d.]+; \})$/.test(m[1])) return `the sheet for ${bad}: ${m[1]}`;
        if (bad === "99999" && !m[1].includes("200%")) return "past the end: " + m[1];
        if (bad === "-5" && !m[1].includes("85%")) return "below the end: " + m[1];
    }
    await set(100);

    // The system's size where it says one: iOS's, on a stand-in, as Chrome has no such font.
    // 20 px over its usual 17 is 118%, and a choice of 110% goes on top: 130%.
    const supports = CSS.supports;
    const fake = document.createElement("style");
    fake.textContent = ".ui-text-size-setting-probe-system { font-size: 20px !important; }";
    document.head.append(fake);
    CSS.supports = (a, b) => (a === "font" && b === "-apple-system-body") || supports.call(CSS, a, b);
    await tap($("#text-size-setting-demo-remount"));
    await tap($("#text-size-setting-demo-remount"));
    CSS.supports = supports; fake.remove();
    const again = $("#text-size-setting-demo-range");
    if (!live.isConnected) { /* made again by the demo */ }
    return await (async () => {
        let host = $("#text-size-setting-demo");
        const note = host.querySelector(".ui-text-size-setting-note").textContent;
        if (note !== "The system's text size is 118%, and this goes on top of it.") return "the system's size: " + note;
        if (tag().textContent !== "" && !tag().textContent.includes("118%")) return "at 100 with a system of 118: " + tag().textContent;
        if (px() !== "17.7px") return "the system's 118% under a choice of 100: " + px();
        again.focus(); again.value = 110; again.dispatchEvent(new Event("input", { bubbles: true })); await wait(60);
        if (!tag().textContent.includes("text-size-adjust: 130%")) return "110 on 118: " + tag().textContent;
        again.value = 100; again.dispatchEvent(new Event("input", { bubbles: true })); again.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
        // Where text-size-adjust does nothing, as on a desktop, the page is zoomed instead.
        const flat = document.createElement("style");
        flat.textContent = ".ui-text-size-setting-probe-adjust { -webkit-text-size-adjust: none !important; text-size-adjust: none !important; }";
        document.head.append(flat);
        await tap($("#text-size-setting-demo-remount")); await tap($("#text-size-setting-demo-remount"));
        flat.remove();
        const z = $("#text-size-setting-demo-range");
        z.focus(); z.value = 120; z.dispatchEvent(new Event("input", { bubbles: true })); await wait(60);
        if (tag().textContent !== "html { zoom: 1.2; --ui-text-scale: 1.2; }") return "the zoom path: " + tag().textContent;
        z.value = 100; z.dispatchEvent(new Event("input", { bubbles: true })); z.dispatchEvent(new Event("change", { bubbles: true })); await wait(60);
        if (tag().textContent !== "") return "the zoom path at 100: " + tag().textContent;
        // Own ends and steps; bad props; apply false leaves the page alone.
        const own = $("#text-size-setting-demo-own"), r2 = $("#text-size-setting-demo-own-range");
        if (r2.value !== "120" || r2.min !== "80" || r2.max !== "120" || r2.step !== "10") return `a value past the end: ${r2.value}, ${r2.min}-${r2.max}`;
        own.querySelector(".ui-text-size-setting-less").click(); await wait(60);
        if (r2.value !== "110" || $("#text-size-setting-demo-own-out").textContent !== "110") return "own step: " + r2.value;
        if (px() === "16.5px") return "apply false moved the page";
        if (own.querySelector(".ui-text-size-setting-preview").style.zoom !== "1.1") return "apply false, the preview: " + own.querySelector(".ui-text-size-setting-preview").style.zoom;
        if (cookie() !== "100") return "remember null wrote a cookie: " + cookie();
        // A tablet: the preview beside the controls. A phone: under them.
        host = $("#text-size-setting-demo");
        const pv = host.querySelector(".ui-text-size-setting-preview").getBoundingClientRect(), row = host.querySelector(".ui-text-size-setting-row").getBoundingClientRect();
        if (device === "tablet" ? !(pv.left >= row.right) : !(pv.top >= row.bottom)) return `layout: ${pv.left}, ${row.right}`;
    })();
} finally {
    document.cookie = "ui-text-size=; Path=/; Max-Age=0";
    const t = document.getElementById("ui-text-size-setting-style");
    if (t) t.textContent = "";
}
