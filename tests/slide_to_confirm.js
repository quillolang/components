// mobile
await wait(300);
const box = $(".ui-slide-confirm");
const track = $(".ui-slide-confirm-track");
const thumb = $(".ui-slide-confirm-thumb");
const hold_ = $(".ui-slide-confirm-hold");
const again = $("#slide-confirm-again");
const count = () => +$("#slide-confirm-count").textContent.match(/\d+/)[0];
const x = () => { const t = thumb.style.transform; return t === "" ? 0 : parseFloat(t.slice(11)); };
const text = () => $(".ui-slide-confirm-text").textContent;
const done = () => box.classList.contains("ui-slide-confirm-done");
const travel = track.clientWidth - thumb.offsetWidth - 8;
const reset = async () => { again.click(); await wait(120); if (done()) throw new Error("did not reset"); };
if (getComputedStyle(thumb).touchAction !== "pan-y") return "the thumb should leave the page its scroll: " + getComputedStyle(thumb).touchAction;

// A thumb held half way follows the finger.
const go = async (dist, gap = 30, n = 10) => {
    const p = middle(thumb);
    await fingers("touchStart", [p]);
    for (let i = 1; i <= n; i++) { await fingers("touchMove", [{ x: p.x + dist * i / n, y: p.y }]); await wait(gap); }
    return p;
};
await go(100);
await wait(100);
if (Math.abs(x() - 100) > 0.5) return "the thumb should follow: " + x();
await fingers("touchEnd", []);
await wait(350);
if (thumb.style.transform !== "") return "short of the end it should spring back: " + thumb.style.transform;
if (count() !== 0 || done()) return "a short slide confirmed";

// Past the end of the track it stops there.
await go(travel + 200);
await wait(100);
if (Math.abs(x() - travel) > 0.5) return "the thumb should stop at the end: " + x() + " of " + travel;
await fingers("touchCancel", []);
await wait(350);
if (thumb.style.transform !== "" || count() !== 0) return "a cancelled slide should spring back and not confirm";

// 85%, slowly and stopped: not enough.
await go(travel * 0.85);
await wait(200);
await fingers("touchEnd", []);
await wait(350);
if (done() || count() !== 0) return "85% with no speed confirmed";

// 75% at speed: it goes on. 3 moves in the last ~60 ms, each well over a pixel a millisecond.
const p = middle(thumb);
await fingers("touchStart", [p]);
for (let i = 1; i <= 3; i++) { await fingers("touchMove", [{ x: p.x + travel * 0.75 * i / 3, y: p.y }]); await wait(2); }
await fingers("touchEnd", []);
await wait(350);
if (!done() || count() !== 1) return "75% thrown should confirm, once: " + count();
if (text() !== "Paid") return "the track should say so: " + text();
const end = thumb.getBoundingClientRect().right;
if (Math.abs(end - (track.getBoundingClientRect().right - 4)) > 2) return "a confirmed thumb should stand at the end: " + end;
if (thumb.getAttribute("aria-valuenow") !== "100") return "aria-valuenow: " + thumb.getAttribute("aria-valuenow");

// Confirmed is final: another slide does nothing, and it does not call again.
await drag(thumb, -100, 0, 200);
if (count() !== 1) return "confirmed twice";
await reset();
if (text() !== "Slide to pay $120.00") return "after asking again: " + text();
if (thumb.getAttribute("aria-valuenow") !== "0") return "value after asking again: " + thumb.getAttribute("aria-valuenow");

// All the way, slowly.
await drag(thumb, travel + 8, 0, 500);
await wait(100);
if (count() !== 2) return "a full slide should confirm: " + count();
await reset();

// A short throw is not enough, however fast: 40% in one go.
await drag(thumb, travel * 0.4, 0, 20);
if (done() || count() !== 2) return "a fast short throw confirmed";

// Up and down is the page's.
document.body.style.paddingBottom = "1600px";
await wait(50);
const y0 = (middle(thumb), scrollY);
await drag(thumb, 2, -140, 250);
if (scrollY <= y0) return "a vertical drag on the thumb should scroll the page";
if (thumb.style.transform !== "") return "the scroll moved the thumb";
document.body.style.paddingBottom = "";
await wait(50);
scrollTo(0, 0);

// The keys: arrows step, leaving sends it back, and the end confirms.
thumb.focus();
key(thumb, "ArrowRight");
await wait(50);
if (thumb.getAttribute("aria-valuenow") !== "10") return "ArrowRight: " + thumb.getAttribute("aria-valuenow");
if (Math.abs(x() - travel * 0.1) > 0.5) return "the thumb should move with the keys: " + x();
key(thumb, "ArrowLeft");
await wait(50);
if (thumb.getAttribute("aria-valuenow") !== "0") return "ArrowLeft: " + thumb.getAttribute("aria-valuenow");
key(thumb, "End");
await wait(50);
if (thumb.getAttribute("aria-valuenow") !== "90" || done()) return "End stops short: " + thumb.getAttribute("aria-valuenow");
thumb.blur();
await wait(50);
if (thumb.getAttribute("aria-valuenow") !== "0") return "leaving should send it back: " + thumb.getAttribute("aria-valuenow");
thumb.focus();
key(thumb, "End");
await wait(50);
key(thumb, "ArrowRight");
await wait(100);
if (!done() || count() !== 3) return "the end should confirm by keys: " + count();
await reset();

// What differs on a tablet: the button stands beside the track.
const tr = track.getBoundingClientRect(), hr = hold_.getBoundingClientRect();
if (device === "tablet" && hr.left < tr.right - 1) return "a tablet's button stands beside the track";
if (device === "phone" && hr.top < tr.bottom - 1) return "a phone's button stands under the track";

// The hold: too short does not confirm.
const h = () => hold_.textContent.trim();
const held = async (ms) => { const q = middle(hold_); await fingers("touchStart", [q]); await wait(ms); await fingers("touchEnd", []); await wait(120); };
await held(300);
if (done() || count() !== 3) return "a short hold confirmed";
if (hold_.style.getPropertyValue("--h") !== "0") return "a let-go hold should empty: " + hold_.style.getPropertyValue("--h");
await wait(5100);
await held(1100);
if (!done() || count() !== 4) return "a full hold should confirm: " + count();
if (h() !== "Paid") return "the button should say so: " + h();
await reset();

// The hold cancelled by the system.
const q = middle(hold_);
await fingers("touchStart", [q]);
await wait(200);
await fingers("touchCancel", []);
await wait(900);
if (done()) return "a cancelled hold confirmed";

// A screen reader's press: one click asks again, the second confirms.
hold_.click();
await wait(60);
if (h() !== "Press again to confirm") return "one press should ask again: " + h();
if ($(".ui-sr").textContent !== "Press again to confirm") return "it should be said: " + $(".ui-sr").textContent;
await wait(450);
hold_.click();
await wait(100);
if (!done() || count() !== 5) return "the second press should confirm: " + count();
await reset();

// Two clicks in a blink are one mistake.
hold_.click();
hold_.click();
await wait(100);
if (done()) return "a double click confirmed";
await wait(5100);
if (h() !== "Hold to pay") return "the question should lapse: " + h();

// Enter held on the button.
hold_.focus();
const press = (t, repeat = false) => hold_.dispatchEvent(new KeyboardEvent(t, { key: "Enter", repeat, bubbles: true, cancelable: true }));
press("keydown");
await wait(300);
press("keydown", true);
await wait(800);
if (!done() || count() !== 6) return "Enter held should confirm: " + count();
press("keyup");
await wait(60);
await reset();

// Disabled: nothing moves.
const off = $$(".ui-slide-confirm-thumb")[1];
await drag(off, travel + 10, 0, 300);
if (off.style.transform !== "") return "a disabled thumb moved";
if (off.hasAttribute("tabindex")) return "a disabled thumb should not take focus";
const buttons = $$(".ui-slide-confirm-hold");
await tap(buttons[1]);
if (buttons[1].textContent.trim() !== "Hold to confirm") return "a disabled button asked again";
