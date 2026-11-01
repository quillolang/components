// mobile
const box = () => $(".ui-video-capture");
const input = () => box().querySelector("input[type=file][name=clip]");
const note = () => $("#video-capture-demo-note").textContent;
const button = (t) => [...$$("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent).trim() === t);
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
if (box().dataset.state !== "idle" || !/Up to 0:02/.test(box().textContent)) return `starts as ${box().dataset.state}`;
if (getComputedStyle(input().parentElement).display !== "none") return "the fallback shows before it is needed";

// Every stream handed out is counted, to see it let go.
const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
const given = [];
const counted = async (c) => { const s = await real(c); given.push(s); return s; };
navigator.mediaDevices.getUserMedia = counted;
const off = () => given.every((s) => s.getTracks().every((t) => t.readyState === "ended"));
try {
    // Chrome's fake camera: a real recording, stopped by a finger.
    await tap(button("Record a clip"));
    if (!await until(() => box().dataset.state === "live")) return `no camera: ${box().dataset.state} ${box().textContent}`;
    const live = box().querySelector(".ui-video-capture-frame video:not([hidden])");
    if (!await until(() => live.videoWidth > 0)) return "the picture does not show";
    if (!live.muted) return "the live picture is not muted: the microphone would play back";
    await tap(button("Start recording"));
    if (box().dataset.state !== "recording") return `after the shutter it is ${box().dataset.state}`;
    const ring = box().querySelector(".ui-video-capture-ring-left");
    // The picture changes size during a recording, as it does when a phone is turned. Chrome
    // logs an error for that on avc1, and the harness fails on a logged error.
    await given.at(-1).getVideoTracks()[0].applyConstraints({ width: 320, height: 240 });
    await wait(700);
    const off1 = parseFloat(ring.getAttribute("stroke-dashoffset"));
    // 0.7 s to 1.5 s of 2 is a third to three quarters of 238.76.
    if (!(off1 > 80 && off1 < 200)) return `the ring has moved ${off1} after 0.7 s`;
    if (!/^0:0[01] \/ 0:02$/.test(box().querySelector(".ui-video-capture-clock").textContent)) return `the clock says ${box().querySelector(".ui-video-capture-clock").textContent}`;
    await tap(button("Stop recording"));
    if (!await until(() => box().dataset.state === "review")) return `after stopping: ${box().dataset.state}`;
    if (!off()) return "the camera stays on after the clip";
    const review = box().querySelector(".ui-video-capture-review");
    if (!review || !review.src.startsWith("blob:") || !review.controls) return "there is no clip to look at";
    if (!await until(() => review.readyState >= 1 || review.error)) return "the clip does not load";
    if (review.error) return `the clip does not play: ${review.error.message}`;
    if (input().files.length !== 0 || note() !== "No clip yet.") return "a clip is taken before it is accepted";
    if (!/Not sent until/.test(box().textContent)) return "it does not say the clip is not sent yet";

    // Retake opens the camera again; left alone, the limit ends the clip.
    const first = review.src;
    const freed = [], free0 = URL.revokeObjectURL;
    URL.revokeObjectURL = (u) => { freed.push(u); free0.call(URL, u); };
    await tap(button("Retake"));
    if (!await until(() => box().dataset.state === "live")) return `retake: ${box().dataset.state}`;
    if (!freed.includes(first)) return "the first clip is not freed";
    URL.revokeObjectURL = free0;
    await tap(button("Start recording"));
    const t0 = performance.now();
    if (!await until(() => box().dataset.state === "review", 4000)) return `the limit did not end it: ${box().dataset.state}`;
    const took = performance.now() - t0;
    if (took < 1700 || took > 3000) return `a limit of 2 s ended after ${Math.round(took)} ms`;

    // Accepted: a real file in the field, and the callback.
    await tap(button("Use this clip"));
    const f = input().files[0];
    if (!f || !/^clip\.(mp4|webm)$/.test(f.name) || !/^video\/(mp4|webm)$/.test(f.type) || f.size < 100) return `the field holds ${f?.name} ${f?.size}`;
    if (new FormData(box().closest("form")).get("clip").size !== f.size) return "the form does not carry the file";
    if (!/^Accepted: clip\.(mp4|webm), video\/(mp4|webm), 2 s\.$/.test(note())) return `on_change: ${note()}`;

    // Retake after accepting takes it back.
    await tap(button("Retake"));
    if (note() !== "No clip yet." || input().files.length !== 0) return "taking a clip back does not clear it";
    await until(() => box().dataset.state === "live");

    // The app leaves the screen: the camera goes.
    const hid = Object.getOwnPropertyDescriptor(Document.prototype, "hidden");
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden; Object.defineProperty(Document.prototype, "hidden", hid);
    await wait(100);
    if (box().dataset.state !== "idle" || !/closed while the app was away/.test(box().textContent) || !off()) return "leaving the screen keeps the camera";

    // Leaving while recording keeps what was taken.
    await tap(button("Record a clip"));
    await until(() => box().dataset.state === "live");
    await tap(button("Start recording"));
    await wait(500);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    if (!await until(() => box().dataset.state === "review")) return `a recording cut short: ${box().dataset.state}`;
    await tap(button("Retake"));
    await until(() => box().dataset.state === "live");

    // Leaving the page lets the camera go.
    await tap(button("Leave the page"));
    if (box() || !off()) return "the camera stays on when the component leaves";
    await tap(button("Come back"));
    await wait(100);

    // Made in the browser this time, not from the server's markup: still muted.
    await tap(button("Record a clip"));
    await until(() => box().dataset.state === "live");
    if (!box().querySelector(".ui-video-capture-frame video:not([hidden])").muted) return "a live picture made in the browser is not muted";
    await tap(button("Close the camera"));

    // Refused: the phone's camera in its place, Settings in the app.
    const denied = async () => { throw new DOMException("no", "NotAllowedError"); };
    navigator.mediaDevices.getUserMedia = denied;
    let settings = 0;
    window.quilloNative = { openSettings: () => { settings++; return true; } };
    await tap(button("Record a clip"));
    if (!await until(() => box().dataset.state === "refused")) return `refused: ${box().dataset.state}`;
    if (!/not allowed/.test(box().querySelector("[role=alert]").textContent)) return "the refusal is not explained";
    if (getComputedStyle(input().parentElement).display === "none") return "there is no fallback when refused";
    await tap(button("Open Settings"));
    if (settings !== 1) return "Settings does not open";
    delete window.quilloNative;

    // The system's camera gives a file: it goes straight into the field.
    const pick = async (file) => {
        const dt = new DataTransfer(); dt.items.add(file);
        input().files = dt.files;
        input().dispatchEvent(new Event("change", { bubbles: true }));
        await wait(300);
    };
    await pick(new File(["not really a video"], "mine.mp4", { type: "video/mp4" }));
    if (box().dataset.state !== "accepted" || input().files[0].name !== "mine.mp4") return `a fallback file: ${box().dataset.state}`;
    if (note() !== "Accepted: mine.mp4, video/mp4, length not known.") return `fallback callback: ${note()}`;
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotFoundError"); };
    await tap(button("Retake"));
    if (!await until(() => box().dataset.state === "none")) return `no camera: ${box().dataset.state}`;
    if (!/No camera could be opened/.test(box().textContent)) return "no camera is not explained";
    if (button("Open Settings")) return "Settings is offered in a browser";

    // Try again works once the camera is back.
    navigator.mediaDevices.getUserMedia = counted;
    await tap(button("Try again"));
    if (!await until(() => box().dataset.state === "live")) return `try again: ${box().dataset.state}`;
    await tap(button("Close the camera"));
    if (box().dataset.state !== "idle" || !off()) return "Close the camera leaves it on";

    // A recorder that refuses, at its making and at its start: the fallback, not a stuck screen.
    const Bad = (where) => class {
        static isTypeSupported() { return true; }
        constructor() { if (where === "make") throw new DOMException("no", "NotSupportedError"); this.state = "inactive"; this.mimeType = ""; }
        addEventListener() {}
        start() { throw new DOMException("no", "InvalidModificationError"); }
    };
    for (const where of ["make", "start"]) {
        const mr0 = window.MediaRecorder;
        window.MediaRecorder = Bad(where);
        await tap(button("Record a clip"));
        await until(() => box().dataset.state === "live");
        await tap(button("Start recording"));
        const ended = await until(() => box().dataset.state === "none", 800);
        window.MediaRecorder = mr0;
        if (!ended) return `a recorder refusing at ${where}: ${box().dataset.state}`;
        if (!/cannot record here/.test(box().textContent) || !off()) return `a recorder refusing at ${where} is not explained`;
        await tap(button("Try again"));
        await until(() => box().dataset.state === "live");
        await tap(button("Close the camera"));
    }

    // No MediaRecorder: the fallback, and the camera is never asked for.
    const mr = window.MediaRecorder;
    window.MediaRecorder = undefined;
    const before = given.length;
    await tap(button("Record a clip"));
    window.MediaRecorder = mr;
    if (box().dataset.state !== "none" || given.length !== before) return `without MediaRecorder: ${box().dataset.state}`;
    if (!/cannot record here/.test(box().textContent)) return "no recorder is not explained";
    await tap(button("Try again"));
    await until(() => box().dataset.state === "live");
    await tap(button("Close the camera"));
} finally {
    navigator.mediaDevices.getUserMedia = real;
    delete window.quilloNative;
}
const cols = getComputedStyle(box().querySelector(".ui-video-capture-body")).gridTemplateColumns.split(" ").length;
if (cols !== (device === "tablet" ? 2 : 1)) return `${device} has ${cols} columns`;
