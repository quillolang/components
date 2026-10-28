const cam = $(".ui-camera-capture");
const view = cam.querySelector(".ui-camera-capture-view");
const hidden = cam.querySelector("input[type=hidden][name=badge]");
const btn = () => [...cam.querySelectorAll(".ui-camera-capture-bar button")];
const msg = () => cam.querySelector(".ui-camera-capture-msg")?.textContent.trim() ?? "";
if (view.getAttribute("role") !== "region" || view.getAttribute("aria-label") !== "Badge photo") return "the view is not a named region";
if (!hidden || hidden.value !== "") return "the hidden input is missing or not empty";
if (msg() !== "The camera is off." || btn()[0].textContent.trim() !== "Turn on the camera") return `it starts with "${msg()}"`;
if (!view.classList.contains("ui-camera-capture-mirror")) return "the front camera is not mirrored";
// Headless Chrome has no camera: it says so.
btn()[0].click();
for (let i = 0; i < 50 && /Asking|is off/.test(msg()); i++) await wait(100);
const bad = cam.querySelector(".ui-camera-capture-msg");
if (!bad || bad.getAttribute("role") !== "alert" || !/No camera|not allowed/.test(msg())) return `without a camera it says "${msg()}"`;
if (btn()[0].textContent.trim() !== "Try again" || hidden.value !== "") return "without a camera it does not offer to try again";
// A camera made from a canvas, standing in for a real one.
const c = document.createElement("canvas"); c.width = 640; c.height = 480;
const g = c.getContext("2d"); g.fillStyle = "#3f9c8f"; g.fillRect(0, 0, 640, 480); g.fillStyle = "#ffd36b"; g.fillRect(200, 140, 240, 200);
const fake = c.captureStream(10);
const keep = setInterval(() => { g.fillRect(200, 140, 240, 200); }, 50);
const real = navigator.mediaDevices.getUserMedia;
navigator.mediaDevices.getUserMedia = async () => fake;
try {
    btn()[0].click();
    const v = cam.querySelector("video");
    for (let i = 0; i < 40 && !(v.videoWidth > 0 && !v.hidden); i++) await wait(100);
    if (v.hidden || v.srcObject !== fake) return "the camera's picture does not show";
    const live = btn().map((b) => b.textContent.trim());
    if (live.join() !== "Take photo,Turn off") return `while live the buttons are ${live}`;
    btn()[0].click(); await wait(300);
    if (!hidden.value.startsWith("data:image/jpeg")) return `the photo is not a JPEG data URL: ${hidden.value.slice(0, 30)}`;
    const img = cam.querySelector(".ui-camera-capture-view img");
    if (img.hidden || img.src !== hidden.value || img.alt !== "The photo taken") return "the photo is not shown";
    await new Promise((r) => (img.complete ? r() : (img.onload = r)));
    if (img.naturalWidth !== 320 || img.naturalHeight !== 240) return `the photo is ${img.naturalWidth} x ${img.naturalHeight}, not 320 x 240`;
    if (fake.getTracks().some((t) => t.readyState !== "ended")) return "the camera is not turned off once the photo is taken";
    if (!/^A photo of \d+ KB/.test($("#camera-capture-demo-note").textContent)) return `on_capture: ${$("#camera-capture-demo-note").textContent}`;
    if (btn()[0].textContent.trim() !== "Retake") return "there is no Retake";
    navigator.mediaDevices.getUserMedia = async () => c.captureStream(10);
    btn()[0].click(); await wait(400);
    if (hidden.value !== "" || $("#camera-capture-demo-note").textContent !== "No photo yet.") return "Retake does not clear the photo";
    btn()[1].click(); await wait();
    if (msg() !== "The camera is off.") return "Turn off does not turn it off";
} finally {
    navigator.mediaDevices.getUserMedia = real;
    clearInterval(keep);
}
