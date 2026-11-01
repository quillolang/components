// mobile
const box = () => $(".ui-story-capture");
const input = () => box().querySelector("input[type=file][name=story]");
const note = () => $("#story-capture-demo-note").textContent;
const button = (t) => [...$$("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent).trim() === t);
const shutter = () => box().querySelector(".ui-story-capture-shutter");
const until = async (f, ms = 3000) => { for (let i = 0; i < ms / 40 && !f(); i++) await wait(40); return f(); };
if (box().dataset.state !== "idle" || box().dataset.side !== "user") return `starts as ${box().dataset.state}`;
if (box().getBoundingClientRect().height < 500) return `the screen is ${box().getBoundingClientRect().height} high`;

const real = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
const devices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
const given = [], constraints = [];
const counted = async (c) => { constraints.push(c); const s = await real(c); given.push(s); return s; };
navigator.mediaDevices.getUserMedia = counted;
navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput" }, { kind: "audioinput" }, { kind: "videoinput" }];
const off = () => given.every((s) => s.getTracks().every((t) => t.readyState === "ended"));
const live = async () => {
    await until(() => box().dataset.state === "live");
    const v = box().querySelector(".ui-story-capture-view video:not([hidden])");
    await until(() => v && v.videoWidth > 0);
    await wait(80);
};
try {
    await tap(button("Open the camera"));
    await live();
    if (box().dataset.state !== "live") return `no camera: ${box().dataset.state}: ${box().textContent}`;
    if (!box().querySelector(".ui-story-capture-mirror video")) return "the front camera is not mirrored";
    if (!/Tap for a photo, hold to record/.test(box().textContent)) return "no hint";

    // A tap: a photo, seen before it is used; the camera is let go.
    await tap(shutter());
    if (!await until(() => box().dataset.state === "review")) return `a tap: ${box().dataset.state}`;
    const img = box().querySelector("img.ui-story-capture-shot");
    if (!img || !img.src.startsWith("blob:")) return "the photo is not shown";
    if (!off()) return "the camera stays on behind a photo";
    if (input().files.length !== 0 || note() !== "Nothing used yet.") return "a photo was used before it was asked";
    await wait(350);    // the finger's lift is ignored for a moment
    await tap(button("Use this"));
    const pic = input().files[0];
    if (!pic || pic.name !== "story.jpg" || pic.type !== "image/jpeg") return `the field holds ${pic?.name}`;
    if (!/^Used: photo, story\.jpg, image\/jpeg, \d+ by \d+\.$/.test(note())) return `on_capture: ${note()}`;
    const bmp = await createImageBitmap(pic);
    if (!note().includes(`${bmp.width} by ${bmp.height}`)) return `the photo is ${bmp.width} by ${bmp.height}: ${note()}`;

    // Retake takes it back, and the camera comes again.
    await tap(button("Retake"));
    await live();
    if (note() !== "Nothing used yet." || input().files.length !== 0) return "Retake does not take it back";

    // A hold: recording while held, a ring that fills, and a clip on letting go.
    const p = middle(shutter());
    await fingers("touchStart", [p]);
    await wait(150);
    if (box().dataset.state !== "live") return "150 ms is taken for a hold";
    if (!await until(() => box().dataset.state === "recording", 700)) return `a hold: ${box().dataset.state}`;
    const ring = box().querySelector(".ui-story-capture-ring-on");
    const full = parseFloat(ring.getAttribute("stroke-dashoffset"));
    // The picture changes size in mid-clip, as when a phone is turned: see video_capture.js.
    await given.at(-1).getVideoTracks()[0].applyConstraints({ width: 320, height: 240 });
    await wait(600);
    const later = parseFloat(ring.getAttribute("stroke-dashoffset"));
    // 0.6 s of 2 is 30 percent of 251.33, about 75, with a little room.
    if (!(full - later > 50 && full - later < 130)) return `the ring moved ${full} to ${later}`;
    if (!/0:0[01] \/ 0:02/.test(box().querySelector(".ui-story-capture-clock").textContent)) return "no clock";
    await fingers("touchEnd", []);
    if (!await until(() => box().dataset.state === "review")) return `letting go: ${box().dataset.state}`;
    const clip = box().querySelector("video.ui-story-capture-shot");
    if (!clip || !clip.src.startsWith("blob:") || !clip.controls) return "the clip is not shown";
    if (!off()) return "the camera stays on behind a clip";
    await wait(350);    // the finger's lift is ignored for a moment
    await tap(button("Use this"));
    const vid = input().files[0];
    if (!vid || !/^story\.(mp4|webm)$/.test(vid.name) || !/^video\//.test(vid.type) || vid.size < 100) return `the field holds ${vid?.name} ${vid?.size}`;
    if (!/^Used: video, story\.(mp4|webm), video\/(mp4|webm)\.$/.test(note())) return `on_capture: ${note()}`;
    await tap(button("Retake"));
    await live();

    // Held past the limit, it stops by itself and waits for the finger.
    const q = middle(shutter());
    await fingers("touchStart", [q]);
    await until(() => box().dataset.state === "recording", 700);
    if (!await until(() => box().dataset.state === "review", 3200)) return `the limit: ${box().dataset.state}`;
    await fingers("touchEnd", []);
    await wait(100);
    if (box().dataset.state !== "review") return "the finger lifting after the limit did something";
    await wait(350);
    await tap(button("Retake"));
    await live();

    // A hold the system takes back: nothing kept, the camera still there.
    const r = middle(shutter());
    await fingers("touchStart", [r]);
    await until(() => box().dataset.state === "recording", 700);
    await wait(200);
    await fingers("touchCancel", []);
    if (!await until(() => box().dataset.state === "live")) return `a cancelled hold: ${box().dataset.state}`;
    if (box().querySelector(".ui-story-capture-shot")) return "a cancelled hold kept a clip";

    // A cancelled tap: nothing at all.
    const t = middle(shutter());
    await fingers("touchStart", [t]);
    await wait(40);
    await fingers("touchCancel", []);
    await wait(400);
    if (box().dataset.state !== "live") return `a cancelled tap: ${box().dataset.state}`;

    // The Record button is the hold's equal: no gesture needed.
    await tap(button("Record"));
    if (box().dataset.state !== "recording") return `Record: ${box().dataset.state}`;
    await wait(300);
    await tap(button("Stop"));
    if (!await until(() => box().dataset.state === "review")) return `Stop: ${box().dataset.state}`;
    await tap(button("Retake"));
    await live();

    // A click no finger made takes a photo: the keyboard's has detail 0, a screen reader's may have 1.
    for (const detail of [0, 1]) {
        await wait(750);
        shutter().dispatchEvent(new MouseEvent("click", { bubbles: true, detail }));
        if (!await until(() => box().dataset.state === "review")) return `a click of detail ${detail}: ${box().dataset.state}`;
        await tap(button("Retake"));
        await live();
    }
    // A click right behind a finger is that finger's, and is not a second photo: the tap
    // that began this is on the shutter, and a cancelled press is not a photo at all.
    const c = middle(shutter());
    await fingers("touchStart", [c]);
    await wait(30);
    await fingers("touchCancel", []);
    shutter().dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await wait(120);
    if (box().dataset.state !== "live") return `a click behind a finger: ${box().dataset.state}`;

    // Switch camera: the old one goes first, and it asks for the other side.
    const before = given.length;
    await tap(button("Switch camera"));
    await live();
    if (box().dataset.side !== "environment") return `switching: ${box().dataset.side}`;
    if (given.length !== before + 1 || constraints.at(-1).video.facingMode.ideal !== "environment") return "the other camera was not asked for";
    if (given.slice(0, -1).some((s) => s.getTracks().some((x) => x.readyState !== "ended"))) return "the old camera stays on";
    if (box().querySelector(".ui-story-capture-mirror video")) return "the back camera is mirrored";
    // The old camera's track ending late is not this camera stopping. Two streams compare as equal
    // with ==, so this needs them told apart by id.
    given[before - 1].getVideoTracks()[0].dispatchEvent(new Event("ended"));
    await wait(80);
    if (box().dataset.state !== "live" || /camera stopped/.test(box().textContent)) return `the old camera's end stopped this one: ${box().dataset.state}`;
    // The other camera refusing: stays on the one it has.
    navigator.mediaDevices.getUserMedia = async (c) => { if (c.video.facingMode.ideal === "user") throw new DOMException("no", "NotReadableError"); return counted(c); };
    await tap(button("Switch camera"));
    await live();
    if (box().dataset.side !== "environment" || !/other camera would not open/.test(box().textContent)) return `a camera that fails: ${box().dataset.side}`;
    navigator.mediaDevices.getUserMedia = counted;

    // One camera: no switch.
    navigator.mediaDevices.enumerateDevices = async () => [{ kind: "videoinput" }];
    await tap(button("Take a photo"));
    await until(() => box().dataset.state === "review");
    await wait(350);
    await tap(button("Retake"));
    await live();
    if (button("Switch camera")) return "a phone with one camera is offered a switch";

    // The app leaves the screen: the camera goes; a recording keeps what it has.
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    await wait(80);
    if (box().dataset.state !== "idle" || !off() || !/while the app was away/.test(box().textContent)) return `away: ${box().dataset.state}`;
    await tap(button("Open the camera"));
    await live();
    await tap(button("Record"));
    await wait(300);
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
    if (!await until(() => box().dataset.state === "review")) return `away while recording: ${box().dataset.state}`;
    await tap(button("Retake"));
    await live();

    // Leaving the page.
    await tap(button("Leave the page"));
    if (box() || !off()) return "the camera stays on when the component leaves";
    await tap(button("Come back"));
    await wait(100);

    // `auto`: open from the start, with nothing pressed, and working: a photo comes from it.
    await tap(button("Leave the page"));
    await wait(80);
    await tap(button("Come back with the camera open"));
    await live();
    if (box().dataset.state !== "live") return `auto: ${box().dataset.state}: ${box().textContent}`;
    await tap(shutter());
    if (!await until(() => box().dataset.state === "review")) return `a photo from auto: ${box().dataset.state}`;
    await wait(350);
    await tap(button("Leave the page"));
    await tap(button("Come back"));
    await wait(100);
    if (box().dataset.state !== "idle") return `without auto it opened by itself: ${box().dataset.state}`;

    // The microphone refused, the camera allowed: a clip with no sound.
    navigator.mediaDevices.getUserMedia = async (c) => { if (c.audio) throw new DOMException("no", "NotAllowedError"); return counted(c); };
    await tap(button("Open the camera"));
    await live();
    if (!/No sound/.test(box().textContent)) return `no sound: ${box().textContent}`;
    await tap(button("Leave the page"));
    await tap(button("Come back"));
    await wait(100);

    // Refused: its own screen, with Settings in the app.
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotAllowedError"); };
    let settings = 0;
    window.quilloNative = { openSettings: () => { settings++; return true; }, haptic: () => true };
    await tap(button("Open the camera"));
    if (!await until(() => box().dataset.state === "refused")) return `refused: ${box().dataset.state}`;
    if (!/The camera is not allowed/.test(box().textContent)) return "the refused screen is not there";
    await tap(button("Open Settings"));
    if (settings !== 1) return "Settings does not open";
    delete window.quilloNative;
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotFoundError"); };
    await tap(button("Try again"));
    if (!await until(() => box().dataset.state === "none")) return `no camera: ${box().dataset.state}`;
    if (!/No camera could be opened/.test(box().textContent) || button("Open Settings")) return "no camera is not explained";

    // A second quick tap lands where the review's buttons appear: it presses nothing.
    navigator.mediaDevices.getUserMedia = counted;
    await tap(button("Try again"));
    await live();
    const t2 = middle(shutter());
    await fingers("touchStart", [t2]);
    await fingers("touchEnd", []);
    await until(() => box().dataset.state === "review", 500);
    await fingers("touchStart", [t2]);
    await fingers("touchEnd", []);
    await wait(400);
    if (box().dataset.state !== "review") return `a double tap: ${box().dataset.state}`;
    await tap(button("Retake"));
    await live();

    // A recorder that refuses, at its making and at its start: a word, and the camera still there.
    const Bad = (where) => class {
        static isTypeSupported() { return true; }
        constructor() { if (where === "make") throw new DOMException("no", "NotSupportedError"); this.state = "inactive"; this.mimeType = ""; }
        addEventListener() {}
        start() { throw new DOMException("no", "InvalidModificationError"); }
    };
    for (const where of ["make", "start"]) {
        const mr0 = window.MediaRecorder;
        window.MediaRecorder = Bad(where);
        await tap(button("Record"));
        await wait(120);
        window.MediaRecorder = mr0;
        if (box().dataset.state !== "live" || !/cannot record here/.test(box().textContent)) return `a recorder refusing at ${where}: ${box().dataset.state}: ${box().textContent}`;
        await tap(button("Take a photo"));
        await until(() => box().dataset.state === "review");
        await wait(350);
        await tap(button("Retake"));
        await live();
    }
    await tap(button("Leave the page"));
    await tap(button("Come back"));
    await wait(100);
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("no", "NotFoundError"); };
    await tap(button("Open the camera"));
    await until(() => box().dataset.state === "none");

    // No MediaRecorder: photos only, and a hold is a photo.
    const mr = window.MediaRecorder;
    navigator.mediaDevices.getUserMedia = counted;
    window.MediaRecorder = undefined;
    await tap(button("Try again"));
    await live();
    window.MediaRecorder = mr;
    if (button("Record") || !/^Tap for a photo/.test(box().querySelector(".ui-story-capture-hint").textContent) || /hold/.test(box().textContent)) return "without a recorder it still offers one";
    await hold(shutter(), 500);
    if (!await until(() => box().dataset.state === "review")) return `a hold with no recorder: ${box().dataset.state}`;
    if (!box().querySelector("img.ui-story-capture-shot")) return "a hold with no recorder is not a photo";
} finally {
    navigator.mediaDevices.getUserMedia = real;
    navigator.mediaDevices.enumerateDevices = devices;
    delete window.quilloNative;
}
// On a wide box the shutter is at the side.
const b = box().getBoundingClientRect();
await wait(350);
await tap(button("Retake"));
await live();
const s = box().querySelector(".ui-story-capture-go").getBoundingClientRect();
if (device === "tablet" && !(s.left > b.left + b.width * 0.6)) return `on a tablet the shutter is at ${s.left - b.left} of ${b.width}`;
if (device === "phone" && Math.abs(s.left + s.width / 2 - (b.left + b.width / 2)) > 2) return "on a phone the shutter is not centred";
