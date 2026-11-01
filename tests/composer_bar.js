// mobile
const form = $("#composer-bar-live");
const box = form.querySelector("textarea");
const main = () => form.querySelector(".ui-composer-bar-main");
const log = () => $("#composer-bar-log").textContent;
const note = () => form.querySelector(".ui-composer-bar-note").textContent;
const input = async (text) => { box.focus(); box.value = text; box.dispatchEvent(new Event("input", { bubbles: true })); await wait(80); };

// Nothing written: the microphone. A space is still nothing.
if (main().getAttribute("aria-label") !== "Record a voice message") return "empty, the end button should be the microphone: " + main().getAttribute("aria-label");
await input("   ");
if (main().getAttribute("aria-label") !== "Record a voice message") return "spaces alone are not a message";
await input("");
const same = main();
await input("Hello");
if (main().getAttribute("aria-label") !== "Send" || main().type !== "submit") return "with text, it should be Send";
if (main() !== same) return "the swap remade the button, which would lose its focus";

// It grows line by line, to four lines here, and then scrolls inside itself.
const one = (await input(""), box.getBoundingClientRect().height);
if (one !== 44) return "one line should be 44 px, is " + one;
await input("a\nb\nc");
const three = box.getBoundingClientRect().height;
if (three !== 88) return "three lines should be 88 px (66 + 22), is " + three;
if (getComputedStyle(box).overflowY !== "hidden") return "it scrolls before it needs to";
await input("a\nb\nc\nd\ne\nf\ng\nh\ni\nj");
if (box.getBoundingClientRect().height !== 110) return "four lines is the limit, 110 px: " + box.getBoundingClientRect().height;
if (getComputedStyle(box).overflowY !== "auto") return "past its limit it should scroll inside";
await input("");
if (box.getBoundingClientRect().height !== 44) return "it did not shrink back";

// Send by the button, trimmed; the box empties, shrinks and keeps its focus.
await input("  Field notes\nsecond line ");
await tap(main()); await wait(120);
if (log() !== "Field notes\nsecond line (0)".replace("\n", "\n")) return "sent: " + JSON.stringify(log());
if (box.value !== "" || box.getBoundingClientRect().height !== 44) return "the box did not empty and shrink: " + box.getBoundingClientRect().height;

// Enter on a touch screen starts a line; Shift never sends; a composition never sends.
await input("line");
const k = (over) => { const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, ...over }); box.dispatchEvent(e); return e.defaultPrevented; };
if (k({})) return "Enter on a touch screen should start a line";
if (k({ shiftKey: true })) return "Shift+Enter sent";
if (k({ isComposing: true })) return "Enter during a composition sent";
await input("");

// The limit: typing past it is cut, and said.
await input("x".repeat(205)); await wait(50);
if (box.value.length !== 200) return "typing past the limit: " + box.value.length;
if (note() !== "The limit is 200 characters.") return "the limit was not said: " + note();
if (!form.querySelector(".ui-composer-bar-count-full")) return "the count does not show it full";
await input(""); await wait(50);

// A paste: cleaned, kept plain, inserted at the cursor.
const paste = async (text) => {
    const data = new DataTransfer();
    data.setData("text/plain", text);
    data.setData("text/html", "<b onclick='x()'>" + text + "</b>");
    const e = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
    box.dispatchEvent(e);
    // At once: anything that waits first lets the browser paste it as well.
    if (!e.defaultPrevented) pasteLate = true;
    await wait(80);
};
let pasteLate = false;
await input("ab");
box.setSelectionRange(1, 1);
await paste("X\r\nY\u0000‮gnp.exe⁩﻿‍");
if (pasteLate) return "the browser's own paste was not stopped at once";
if (box.value !== "aX\nYgnp.exe‍b") return "the paste was not cleaned: " + JSON.stringify(box.value);
if (box.selectionStart !== 12) return "the cursor should end after the paste: " + box.selectionStart;
if (main().getAttribute("aria-label") !== "Send") return "a paste did not swap to Send";
// Over the selection, and past the limit, a word on screen.
await input("hello");
box.setSelectionRange(0, 5);
await paste("y".repeat(250));
if (box.value.length !== 200) return "a long paste should stop at the limit: " + box.value.length;
if (note() !== "50 characters did not fit and were left out.") return "the cut was not said: " + note();
// A surrogate pair at the edge is not split.
await input("z".repeat(198));
box.setSelectionRange(198, 198);
await paste("😀😀😀");
if (box.value !== "z".repeat(198) + "😀😀") return "the emoji were cut wrongly: " + box.value.slice(198);
await input("");
await wait(60);

// A real paste, through the browser's own command: once, not twice, and cleaned.
await input("");
await cdp("Browser.grantPermissions", { origin: location.origin, permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
await cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
box.focus();
const copied = await navigator.clipboard.writeText("Real\u202E paste").then(() => "yes", (e) => e.name);
if (copied !== "yes") return "the clipboard could not be written: " + copied;
await cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "v", code: "KeyV", windowsVirtualKeyCode: 86, commands: ["paste"] });
await cdp("Input.dispatchKeyEvent", { type: "keyUp", key: "v", code: "KeyV", windowsVirtualKeyCode: 86 });
await wait(200);
await cdp("Emulation.setFocusEmulationEnabled", { enabled: false });
if (box.value !== "Real paste") return "a real paste: " + JSON.stringify(box.value);
await input(""); await wait(60);

// A pasted picture joins the attachments, and the end button is Send.
const png = (name, size = 10) => new File([new Uint8Array(size)], name, { type: "image/png", lastModified: 5 });
{
    const data = new DataTransfer();
    data.items.add(png("shot.png"));
    box.dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    await wait(120);
}
let tiles = () => [...form.querySelectorAll(".ui-composer-bar-file")];
if (tiles().length !== 1 || tiles()[0].querySelector("img")?.alt !== "shot.png") return "the pasted picture is not attached";
if (main().getAttribute("aria-label") !== "Send") return "with a file it should be Send";

// The tray: opened by the +, a row on a phone, a card by the button on a tablet.
const plus = form.querySelector(".ui-composer-bar-plus");
await tap(plus); await wait(100);
const tray = form.querySelector(".ui-composer-bar-tray");
if (!tray || plus.getAttribute("aria-expanded") !== "true") return "the + did not open the tray";
if ([...tray.querySelectorAll("button")].map((b) => b.textContent.trim()).join() !== "Photos,Camera,Files") return "the tray offers the wrong ways";
if ((device === "tablet") !== (getComputedStyle(tray).position === "absolute")) return `the tray at width ${form.clientWidth} is ${getComputedStyle(tray).position}`;
// Picking files: too big and over the count are refused with a word, a repeat is ignored.
const picker = form.querySelectorAll(".ui-composer-bar-pickers input")[1];
const pick = async (files) => { const d = new DataTransfer(); files.forEach((f) => d.items.add(f)); picker.files = d.files; picker.dispatchEvent(new Event("change", { bubbles: true })); await wait(120); };
await pick([png("shot.png"), new File([new Uint8Array(1048577)], "big.pdf", { type: "application/pdf", lastModified: 1 }), new File(["p"], "ok.pdf", { type: "application/pdf", lastModified: 1 })]);
if (tiles().length !== 2 || tiles()[1].textContent.trim() !== "ok.pdf") return "picked: " + tiles().map((t) => t.textContent.trim()).join();
if (note() !== "Files over 1 MB were left out.") return "the size refusal was not said: " + note();
if (form.querySelector(".ui-composer-bar-tray")) return "the tray should close after a pick";
await pick([png("c.png"), png("d.png"), png("e.png")]);
if (tiles().length !== 3 || note() !== "3 files at most in one message.") return "the count limit: " + tiles().length + " " + note();
const store = form.querySelector("input[name=message_files]");
if (store.files.length !== 3) return "the field a plain form sends holds " + store.files.length;
await tap(tiles()[1].querySelector(".ui-composer-bar-drop"));
if (tiles().length !== 2 || store.files.length !== 2) return "removing a file: " + tiles().length;
await input("With files");
form.requestSubmit(); await wait(150);
if (!log().endsWith("With files (2)")) return "the files were not sent: " + log();
if (tiles().length !== 0 || store.files.length !== 0) return "the files stayed after sending";

// Voice: recorded through the fake microphone.
await tap(main()); await wait(500);
if (!form.querySelector(".ui-composer-bar-rec")) return "the microphone did not start recording: " + note();
if (getComputedStyle(box).display !== "none") return "the box should give way while recording";
await wait(600);
if (form.querySelector(".ui-composer-bar-rec").textContent.trim() !== "0:00" && !/^0:0\d$/.test(form.querySelector(".ui-composer-bar-rec").textContent.trim())) return "the clock: " + form.querySelector(".ui-composer-bar-rec").textContent;
await tap(form.querySelector(".ui-composer-bar-stop")); await wait(400);
if (!/voice audio\/\S+ true$/.test(log())) return "no voice message came: " + log();
if ($("#composer-bar-clips").textContent !== "1 voice messages") return "on_voice was not called once";
// A double tap on the microphone: the second lands on the button now there, and is not an answer to it.
await tap(main()); await wait(120);
{
    const stop = form.querySelector(".ui-composer-bar-stop");
    if (!stop) return "the microphone did not start in time for a double tap";
    await tap(stop); await wait(150);
    if (!form.querySelector(".ui-composer-bar-rec")) return "a double tap ended the recording";
    if ($("#composer-bar-clips").textContent !== "1 voice messages") return "a double tap sent an empty recording";
}
await wait(450);
// Thrown away, nothing comes.
await tap(form.querySelector("[aria-label='Throw this recording away']")); await wait(400);
if ($("#composer-bar-clips").textContent !== "1 voice messages") return "a recording thrown away was sent";
if (form.querySelector(".ui-composer-bar-rec")) return "still recording";
// Refused: said on screen, and in an app, the way to Settings.
const md = navigator.mediaDevices;
let settings = 0;
md.getUserMedia = () => Promise.reject(new DOMException("no", "NotAllowedError"));
await tap(main()); await wait(300);
if (note() !== "The microphone was refused. Allow it in this site's settings to record.") return "a refusal in a browser: " + note();
if (form.querySelector(".ui-composer-bar-settings")) return "a browser has no Settings to open";
window.quilloNative = { info: () => ["openSettings"], openSettings: () => { settings++; return true; } };
await tap(main()); await wait(300);
if (note() !== "The microphone is off for this app.") return "a refusal in an app: " + note();
await tap(form.querySelector(".ui-composer-bar-settings")); await wait(100);
if (settings !== 1) return "Open Settings did not reach the app";
delete window.quilloNative;
delete md.getUserMedia;

// The keyboard, by what the two systems report: iOS keeps the window and shrinks the
// visual viewport. Headless Chrome has no on-screen keyboard, so the numbers are set here.
const vv = visualViewport, H = innerHeight;
const fake = (height, top = 0) => {
    Object.defineProperty(vv, "height", { get: () => height, configurable: true });
    Object.defineProperty(vv, "offsetTop", { get: () => top, configurable: true });
    vv.dispatchEvent(new Event("resize"));
};
const unfake = () => { delete vv.height; delete vv.offsetTop; vv.dispatchEvent(new Event("resize")); };
form.scrollIntoView({ block: "end" });
await wait(100);
const inner = form.querySelector(".ui-composer-bar-lifted");
const bottom = form.getBoundingClientRect().bottom;
const was = inner.getBoundingClientRect().bottom;
fake(H - 336); await wait(80);
const expected = Math.round(Math.max(0, Math.min(336, bottom - (H - 336))));
const moved = was - inner.getBoundingClientRect().bottom;
if (Math.abs(moved - expected) > 1) return `it should rise ${expected}, rose ${moved}`;
if (expected && !form.classList.contains("ui-composer-bar-up")) return "lifted, the safe area's padding should go";
// iOS may slide the visual viewport down as well: then less is covered.
fake(H - 336, 100); await wait(80);
const less = Math.round(Math.max(0, Math.min(336, bottom - (H - 336 + 100))));
if (Math.abs((was - inner.getBoundingClientRect().bottom) - less) > 1) return `with the view slid, it should rise ${less}, rose ${was - inner.getBoundingClientRect().bottom}`;
// A small change is browser bars, not a keyboard.
fake(H - 40); await wait(80);
if (Math.abs(was - inner.getBoundingClientRect().bottom) > 1) return "40 px of browser bar is not a keyboard";
// Zooming shrinks the view too, and is not a keyboard.
Object.defineProperty(vv, "scale", { get: () => 2, configurable: true });
fake(H / 2); await wait(80);
if (Math.abs(was - inner.getBoundingClientRect().bottom) > 1) return "zooming is not a keyboard";
delete vv.scale;
unfake(); await wait(80);
if (Math.abs(was - inner.getBoundingClientRect().bottom) > 1) return "it did not come back down";

// Turned: what is written stays, keeps its focus, and the box fits its new width.
{
    await input("word ".repeat(20));
    const before = box.getBoundingClientRect().height, value = box.value;
    const [w, h] = [innerWidth, innerHeight];
    await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(300);
    const scrollTall = box.scrollHeight, turned = box.getBoundingClientRect().height, same = box.value === value && document.activeElement === box;
    await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(300);
    if (!same) return "turning the screen lost the text or the focus";
    if (device === "phone" && !(turned < before)) return `wider, the box should need fewer lines: ${before} to ${turned}`;
    if (Math.abs(box.getBoundingClientRect().height - before) > 1) return "turned back, it should be as it was";
    await input("");
}

// With nothing, a plain form: Send is off, and the field carries the name.
const plain = $("#composer-bar-plain");
if (plain.tagName !== "FORM" || plain.getAttribute("method") !== "post" || !plain.querySelector("textarea[name=note]")) return "the plain form is wrong";
if (plain.querySelector(".ui-composer-bar-plus") || plain.querySelector(".ui-composer-bar-voice")) return "the plain form should have neither + nor microphone";
if (!plain.querySelector(".ui-composer-bar-main").disabled) return "Send should be off with nothing to send";
