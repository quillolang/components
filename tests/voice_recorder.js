// mobile
const box = () => $(".ui-voice-recorder");
const input = () => box().querySelector("input[type=file][name=note]");
const note = () => $("#voice-recorder-demo-note").textContent;
const clock = () => box().querySelector(".ui-voice-recorder-clock").textContent;
const button = (t) => [...$$("button")].find((b) => b.textContent.trim() === t);
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
if (box().dataset.state !== "idle" || clock() !== "0:00" || !/up to 0:03/.test(box().textContent)) return `starts as ${box().dataset.state} ${clock()}`;
const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
const given = [];
const counted = async (c) => { const s = await real(c); given.push(s); return s; };
navigator.mediaDevices.getUserMedia = counted;
const off = () => given.every((s) => s.getTracks().every((t) => t.readyState === "ended"));
try {
    await tap(button("Record a voice note"));
    if (!await until(() => box().dataset.state === "recording")) return `no recording: ${box().dataset.state}: ${box().textContent}`;
    // Chrome's fake microphone beeps once a second: the bar must have moved by then.
    const fill = box().querySelector(".ui-voice-recorder-fill");
    let loud = 0;
    for (let i = 0; i < 28; i++) { await wait(40); loud = Math.max(loud, parseFloat(fill.dataset.level ?? "0")); }
    if (!(loud > 0.02)) return `the level never moved: ${loud}`;
    if (!/scaleX\(/.test(fill.style.transform)) return "the level does not reach the bar";

    // Pause stops the clock; resume goes on from there.
    await tap(button("Pause"));
    if (box().dataset.state !== "paused") return `after Pause: ${box().dataset.state}`;
    if (!/Paused/.test(box().textContent)) return "it does not say it is paused";
    const held = clock();
    await wait(900);
    if (clock() !== held) return `the clock runs while paused: ${held} then ${clock()}`;
    await tap(button("Resume"));
    await wait(300);
    if (box().dataset.state !== "recording") return `after Resume: ${box().dataset.state}`;
    await tap(button("Finish"));
    if (!await until(() => box().dataset.state === "done")) return `after Finish: ${box().dataset.state}`;
    if (!off()) return "the microphone stays on";

    // A real file, and something to play.
    const f = input().files[0];
    if (!f || !/^voice\.(m4a|webm)$/.test(f.name) || !/^audio\//.test(f.type) || f.size < 100) return `the field holds ${f?.name} ${f?.size}`;
    if (new FormData(box().closest("form")).get("note").size !== f.size) return "the form does not carry the file";
    if (!new RegExp(`^Ready: ${f.name.replace(".", "\\.")}, ${f.type}\\.$`).test(note())) return `on_change: ${note()}`;
    const audio = box().querySelector("audio");
    if (!audio || !audio.controls || !audio.src.startsWith("blob:")) return "no playback";
    if (!await until(() => audio.readyState >= 1 || audio.error)) return "the recording does not load";
    if (audio.error) return `the recording does not play: ${audio.error.message}`;

    // Delete: nothing left, and its address is freed.
    const url = audio.src, freed = [], free0 = URL.revokeObjectURL;
    URL.revokeObjectURL = (u) => { freed.push(u); free0.call(URL, u); };
    await tap(button("Delete"));
    URL.revokeObjectURL = free0;
    if (box().dataset.state !== "idle" || input().files.length !== 0 || note() !== "No recording yet." || !freed.includes(url)) return "Delete leaves something";

    // The limit ends it; the clock does not pass it.
    await tap(button("Record a voice note"));
    await until(() => box().dataset.state === "recording");
    if (!await until(() => box().dataset.state === "done", 5000)) return `the limit did not end it: ${box().dataset.state}`;
    if (clock() !== "0:03") return `the limit shows ${clock()}`;

    // The app goes away: it pauses, says so, and goes on after.
    await tap(button("Record again"));
    await until(() => box().dataset.state === "recording");
    if (note() !== "No recording yet.") return "Record again does not take the old one back";
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    await wait(80);
    if (box().dataset.state !== "paused" || !/while the app was away/.test(box().textContent)) return `away: ${box().dataset.state}`;
    await tap(button("Resume"));
    await tap(button("Finish"));
    await until(() => box().dataset.state === "done");

    // The microphone is lost during a recording: what there is, is kept.
    await tap(button("Record again"));
    await until(() => box().dataset.state === "recording");
    await wait(300);
    given.at(-1).getAudioTracks()[0].dispatchEvent(new Event("ended"));
    if (!await until(() => box().dataset.state === "done")) return `microphone lost: ${box().dataset.state}`;
    if (!/microphone stopped/.test(box().textContent)) return "losing the microphone is not explained";
    await tap(button("Delete"));

    // Leaving the page lets the microphone go.
    await tap(button("Record a voice note"));
    await until(() => box().dataset.state === "recording");
    await tap(button("Leave the page"));
    if (box() || !off()) return "the microphone stays on when the component leaves";
    await tap(button("Come back"));
    await wait(100);

    // Refused, in the app: a word, Settings, and Try again.
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotAllowedError"); };
    let settings = 0;
    window.quilloNative = { openSettings: () => { settings++; return true; }, haptic: () => true };
    await tap(button("Record a voice note"));
    if (!await until(() => box().dataset.state === "refused")) return `refused: ${box().dataset.state}`;
    if (!/not allowed/.test(box().querySelector("[role=alert]").textContent)) return "the refusal is not explained";
    await tap(button("Open Settings"));
    if (settings !== 1) return "Settings does not open";
    delete window.quilloNative;

    // No microphone, and no Settings in a browser.
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotFoundError"); };
    await tap(button("Try again"));
    if (!await until(() => box().dataset.state === "none")) return `no microphone: ${box().dataset.state}`;
    if (!/No microphone/.test(box().textContent) || button("Open Settings")) return "no microphone is not explained";

    // No MediaRecorder.
    const mr = window.MediaRecorder;
    window.MediaRecorder = undefined;
    await tap(button("Try again"));
    window.MediaRecorder = mr;
    if (!/cannot record sound here/.test(box().textContent)) return "no recorder is not explained";

    navigator.mediaDevices.getUserMedia = counted;

    // A recorder that refuses, at its making and at its start.
    const Bad = (where) => class {
        static isTypeSupported() { return true; }
        constructor() { if (where === "make") throw new DOMException("no", "NotSupportedError"); this.state = "inactive"; this.mimeType = ""; }
        addEventListener() {}
        start() { throw new DOMException("no", "InvalidModificationError"); }
    };
    for (const where of ["make", "start"]) {
        const mr0 = window.MediaRecorder;
        window.MediaRecorder = Bad(where);
        await tap(button("Try again"));
        const ended = await until(() => box().dataset.state === "none" && /cannot record sound here/.test(box().textContent) && off(), 800);
        window.MediaRecorder = mr0;
        if (!ended) return `a recorder refusing at ${where}: ${box().dataset.state}`;
    }

    // No level to show is no reason not to record: an AudioContext that throws.
    const AC = window.AudioContext;
    window.AudioContext = class { constructor() { throw new DOMException("no", "NotSupportedError"); } };
    await tap(button("Try again"));
    const recorded = await until(() => box().dataset.state === "recording", 800);
    window.AudioContext = AC;
    if (!recorded) return `with no AudioContext: ${box().dataset.state}`;
    await tap(button("Finish"));
    await until(() => box().dataset.state === "done");
    await tap(button("Delete"));
    await tap(button("Record a voice note"));
    if (!await until(() => box().dataset.state === "recording")) return `after that: ${box().dataset.state}`;
    await tap(button("Finish"));
    await until(() => box().dataset.state === "done");
    await tap(button("Delete"));
    await tap(button("Record a voice note"));
    if (!await until(() => box().dataset.state === "recording")) return `try again: ${box().dataset.state}`;
    await tap(button("Finish"));
    await until(() => box().dataset.state === "done");
    await tap(button("Delete"));
} finally {
    navigator.mediaDevices.getUserMedia = real;
    delete window.quilloNative;
}
