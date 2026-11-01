// mobile
const host = $("#error-screen-demo"), title = () => $("#error-screen-demo-title").textContent, kind = () => host.dataset.kind;
const text = () => $(".ui-error-screen-text").textContent, reason = () => $(".ui-error-screen-reason")?.textContent ?? "";
const line = () => $(".ui-error-screen-say > .ui-error-screen-state").textContent;
const retry = () => $(".ui-error-screen-actions .ui-btn:not(.ui-btn-outline)");
const homeBtn = () => $(".ui-error-screen-actions .ui-btn-outline");
const status = (s) => tap($(`#error-screen-demo-s${s}`));
const plan = (p) => tap($(`#error-screen-demo-p${p}`));
const out = () => $("#error-screen-demo-out").textContent;
const offline = async (on) => { await cdp("Network.emulateNetworkConditions", { offline: on, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(200); };
const calls = () => parseInt(out());
await cdp("Network.enable");
await wait(100);
try {
    // Each status gets its own words, worked out from the code.
    const want = [[500, "server", "Something went wrong on our side"], [503, "down", "Down for a moment"], [404, "missing", "Not found"],
                  [401, "signin", "Sign in again"], [429, "busy", "Too many tries"], [0, "unreachable", "Cannot reach the server"]];
    for (const [s, k, t] of want) {
        await status(s);
        if (kind() !== k || title() !== t) return `${s}: ${kind()}, ${title()}`;
    }
    await status(500);
    if (reason() !== "The price list could not be loaded.") return "the reason: " + reason();
    if (!text().includes("not your connection")) return "server trouble must not blame the connection: " + text();

    // What retry cannot help has no such button, and the way out stays.
    await status(404);
    if (retry()) return "a 404 offers to try again";
    if (!homeBtn()) return "no way out of a 404";
    await tap(homeBtn());
    if (!out().includes("1 homes")) return "on_home: " + out();
    await status(500);

    // Offline told apart from the server: for real, through Chrome's network. A live change.
    if (kind() !== "server") return "before: " + kind();
    await offline(true);
    if (navigator.onLine) return "the emulation did not go offline";
    if (kind() !== "offline" || title() !== "You are offline") return `offline: ${kind()}, ${title()}`;
    if (!text().includes("no connection")) return "offline, the text: " + text();
    if (line() !== "It will try again when the connection is back.") return "offline, the line: " + line();
    if (!host.classList.contains("ui-error-screen-offline")) return "offline, its look";
    // Even offline a person may press it: onLine can be wrong. Failing says so.
    await plan("fail");
    const n0 = calls();
    await tap(retry());
    if (calls() !== n0 + 1) return "retry offline: " + out();
    // Back: it tries by itself, once, and goes back to what the server said.
    await offline(false);
    if (calls() !== n0 + 2) return `the auto retry: ${calls() - n0}`;
    if (kind() !== "server") return "back online: " + kind();
    if (line() !== "Still not working, after 2 tries.") return "after two tries: " + line();
    await offline(true); await offline(false);
    if (calls() !== n0 + 3) return `again: ${calls() - n0}`;

    // A new status clears the failure.
    await status(503);
    if (line() !== "") return "a new status keeps the old failure: " + line();

    // A failure with a new status and reason moves the screen on.
    await plan("status");
    await tap(retry());
    if (kind() !== "down" || reason() !== "Maintenance until noon.") return `a new answer: ${kind()}, ${reason()}`;
    if (line() !== "Still not working.") return `one try: ${line()}`;

    // A plain answer, a Promise of one, a refusal and an error value all come out as failures.
    await status(500);
    for (const p of ["fail", "reject", "err"]) {
        await plan(p);
        const n = calls();
        await tap(retry());
        if (calls() !== n + 1) return `${p}: not called`;
        if (!line().startsWith("Still not working")) return `${p}: ${line()}`;
        if (retry().disabled) return `${p}: stuck trying`;
    }
    await plan("promise-fail");
    await tap(retry());
    if (kind() !== "timeout") return "a Promise of a status: " + kind();

    // Wait: counted down on the button, and refused until then.
    await status(503); await status(500);
    await plan("wait");
    await tap(retry());
    if (kind() !== "busy") return "429: " + kind();
    if (!/Try again in [12] s/.test(retry().textContent) || !retry().disabled) return "the countdown: " + retry().textContent;
    const nw = calls();
    await tap(retry());
    if (calls() !== nw) return "pressed during the wait";
    await wait(2200);
    if (retry().textContent.trim() !== "Try again" || retry().disabled) return "after the wait: " + retry().textContent;

    // Worked: no failure line, and the count starts again.
    await plan("ok");
    await tap(retry());
    if (!out().includes("It worked")) return "worked: " + out();
    if (line() !== "") return "worked, the line: " + line();

    // The details, for support: the status, the reference, a way to copy it. 503 first, as the
    // prop was 500 all along and only the retries' answers had moved the screen.
    await status(503); await status(500);
    const more = $("details.ui-error-screen-more");
    await tap(more.querySelector("summary"));
    if (!more.open) return "details do not open";
    if (!more.textContent.includes("req-7f3a2c") || !more.textContent.includes("500")) return "details: " + more.textContent;
    const copy = more.querySelector("button");
    await cdp("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
    await tap(copy);
    const said = more.querySelector(".ui-error-screen-state").textContent;
    if (said !== "Copied." && !said.startsWith("It could not be copied")) return "copy: " + said;
    const realClip = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    await tap(copy);
    if (!more.querySelector(".ui-error-screen-state").textContent.startsWith("This browser cannot copy")) return "no clipboard: " + more.querySelector(".ui-error-screen-state").textContent;
    delete navigator.clipboard;

    // A status of nonsense never throws.
    if (getComputedStyle(host).position !== "static") return "not fill: " + getComputedStyle(host).position;
    // A tablet uses the width: picture beside the words, buttons in a row. A phone stacks, low on the screen.
    const icon = $(".ui-error-screen-icon").getBoundingClientRect(), t = $("#error-screen-demo-title").getBoundingClientRect(), r = retry().getBoundingClientRect(), h = homeBtn().getBoundingClientRect();
    if (device === "tablet") {
        if (!(icon.right <= t.left)) return `tablet: the icon ${icon.right} and title ${t.left}`;
        if (Math.abs(r.top - h.top) > 1) return `tablet: buttons in a row: ${r.top}, ${h.top}`;
    } else {
        if (!(icon.bottom <= t.top)) return "phone: stacked";
        if (!(r.bottom <= h.top)) return "phone: buttons stacked";
        if (Math.abs(r.width - h.width) > 1) return "phone: full-width buttons";
        const frame = $("#error-screen-demo-frame").getBoundingClientRect();
        if (frame.bottom - h.bottom > 60) return `phone: buttons out of a thumb's reach: ${frame.bottom - h.bottom}`;
    }
    // The safe areas are kept.
    await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 47, left: 0, right: 0, bottom: 34 } }); await wait(120);
    const pad = getComputedStyle(host);
    if (pad.paddingTop !== "47px" || pad.paddingBottom !== "34px") return `safe area: ${pad.paddingTop}, ${pad.paddingBottom}`;
    await cdp("Emulation.setSafeAreaInsetsOverride", { insets: { top: 0, left: 0, right: 0, bottom: 0 } }); await wait(80);
} finally {
    delete navigator.clipboard;
    await offline(false);
    await cdp("Network.disable");
}
