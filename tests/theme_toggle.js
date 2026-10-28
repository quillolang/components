const groups = $$(".ui-theme-toggle"), seg = groups[0], one = groups[1], note = () => $(".demo-note").textContent;
const html = document.documentElement, was = localStorage.getItem("ui-theme-toggle");
const btns = [...seg.querySelectorAll(".ui-theme-toggle-btn")];
try {
    if (groups.length !== 3 || btns.length !== 3 || seg.getAttribute("role") !== "group" || seg.getAttribute("aria-label") !== "Theme") return "not three named groups of three buttons";
    if (btns.map((b) => b.getAttribute("aria-pressed")).join() !== "false,false,true") return "system is not pressed to start";
    btns[1].click(); await wait();
    if (!html.classList.contains("ui-dark") || html.classList.contains("ui-light")) return "Dark does not set ui-dark on <html>";
    if (localStorage.getItem("ui-theme-toggle") !== "dark" || btns[1].getAttribute("aria-pressed") !== "true") return "Dark is not remembered or pressed";
    if (!note().startsWith("Theme: dark")) return `on_change did not reach the note: ${note()}`;
    if (getComputedStyle(document.body).colorScheme !== "dark") return "the page did not go dark";
    btns[0].click(); await wait();
    if (!html.classList.contains("ui-light") || html.classList.contains("ui-dark") || localStorage.getItem("ui-theme-toggle") !== "light") return "Light does not set ui-light";
    btns[2].click(); await wait();
    if (html.classList.contains("ui-light") || html.classList.contains("ui-dark") || localStorage.getItem("ui-theme-toggle") !== null) return "System does not clear the class and the memory";
    const b = one.querySelector(".ui-theme-toggle-btn");
    if (!b || b.textContent.trim() !== "System" || one.querySelectorAll(".ui-theme-toggle-btn").length !== 1) return "variant=button is not one button saying System";
    b.click(); await wait();
    if (b.textContent.trim() !== "Light" || !html.classList.contains("ui-light")) return "the cycling button does not go to Light first";
    b.click(); await wait();
    if (b.textContent.trim() !== "Dark" || !html.classList.contains("ui-dark")) return "then Dark";
    b.click(); await wait();
    if (b.textContent.trim() !== "System" || html.classList.contains("ui-dark")) return "then System";
    if ([...groups[2].querySelectorAll(".ui-theme-toggle-btn span")].map((s) => s.textContent).join() !== "Day,Night,Auto") return "the labels are not taken";
} finally {
    html.classList.remove("ui-dark"); html.classList.remove("ui-light");
    if (was == null) localStorage.removeItem("ui-theme-toggle"); else localStorage.setItem("ui-theme-toggle", was);
}
