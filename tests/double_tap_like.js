// mobile
await wait(300);
// Bad counts read as none, others as whole numbers.
const nums = [...$("#double-tap-bad").querySelectorAll(".ui-double-tap-n")].map((n) => n.textContent).join();
if (nums !== "0,0,12,1.5m") return "counts: " + nums;
$("#double-tap-bad").remove();

const media = $(".ui-double-tap-media");
const like = $(".ui-double-tap-like");
const said = () => $("#double-tap-said").textContent;
const taps = () => +$("#double-tap-taps").textContent.match(/\d+/)[0];
const count = () => $(".ui-double-tap-n").textContent;
const pressed = () => like.getAttribute("aria-pressed");
const tapAt = async (p) => { await fingers("touchStart", [p]); await fingers("touchEnd", []); };
if (count() !== "1.2k") return "1284 reads 1.2k: " + count();
if (getComputedStyle(media).touchAction !== "manipulation") return "the browser's double tap is not off: " + getComputedStyle(media).touchAction;
if (media.getAttribute("role") !== "button") return "with on_tap the picture is a button";

// One tap: a tap, once the wait is over, and no like.
await tap(media);
await wait(200);
if (taps() !== 1) return "a single tap should run on_tap once: " + taps();
if (pressed() !== "false") return "a single tap liked it";

// Two taps: a like, a heart at the finger, and no on_tap.
const r = media.getBoundingClientRect();
const p = middle(media);
const rect = media.getBoundingClientRect();
const q = { x: rect.left + 60, y: rect.top + 50 };
await tapAt(q);
await wait(30);
await tapAt(q);
await wait(40);
const b = $(".ui-double-tap-burst");
if (!b) return "no heart";
if (Math.abs(parseFloat(b.style.left) - 60) > 1 || Math.abs(parseFloat(b.style.top) - 50) > 1) return "the heart should be at the finger: " + b.style.left + " " + b.style.top;
if (pressed() !== "true") return "a double tap should like it";
if (said() !== "liked true 1285") return "on_like: " + said();
await wait(420);
if (taps() !== 1) return "a double tap ran on_tap: " + taps();
await wait(600);
if ($(".ui-double-tap-burst")) return "the heart should go by itself";

// Liked already: a double tap stays liked, and says so with a heart, not a second like.
const q2 = { x: rect.left + 90, y: rect.top + 80 };
await tapAt(q2);
await wait(30);
await tapAt(q2);
await wait(40);
if (!$(".ui-double-tap-burst")) return "a second double tap should still show a heart";
if (pressed() !== "true" || said() !== "liked true 1285") return "a second double tap changed the like: " + said();
await wait(900);

// Two taps too slow are two taps.
await tapAt(q);
await wait(480);
await tapAt(q);
await wait(480);
if (taps() !== 3) return "two slow taps are two taps: " + taps();

// Two quick taps far apart are two taps too.
await tapAt(q);
await wait(30);
await tapAt({ x: rect.right - 20, y: rect.bottom - 20 });
await wait(480);
if (taps() !== 5) return "two taps far apart are two taps: " + taps();

// A scroll is no tap, nor a slow press.
await drag(media, 0, 60, 200);
await wait(380);
if (taps() !== 5) return "a drag counted as a tap: " + taps();
await hold(media, 520);
await wait(380);
if (taps() !== 5) return "a long press counted as a tap: " + taps();

// A cancelled press.
await fingers("touchStart", [q]);
await fingers("touchCancel", []);
await wait(380);
if (taps() !== 5) return "a cancelled press counted as a tap: " + taps();

// The button is the equal, and takes the like back.
await tap(like);
if (pressed() !== "false") return "the button should take the like back";
if (said() !== "liked false 1284") return "on_like from the button: " + said();
if (like.getAttribute("aria-label") !== "Like, 1284 likes") return "the button's name: " + like.getAttribute("aria-label");
await tap(like);
if (pressed() !== "true" || said() !== "liked true 1285") return "the button should like it: " + said();
await tap(like);

// Enter on the picture is a tap.
media.focus();
key(media, "Enter");
await wait(60);
if (taps() !== 6) return "Enter should be a tap: " + taps();

// Double taps as fast as they come: a heart for each pair, one like.
for (let i = 0; i < 16; i++) { await tapAt(q); await wait(6); }
await wait(40);
const hearts = $$(".ui-double-tap-burst").length;
if (hearts < 2 || hearts > 6) return "hearts in the air: " + hearts;
if (pressed() !== "true") return "fast taps should like it";
if (said() !== "liked true 1285") return "many double taps are one like: " + said();
await wait(800);

// What differs on a tablet: words beside the picture.
const side = $(".ui-double-tap-side").getBoundingClientRect(), m = media.getBoundingClientRect();
if (device === "tablet" && side.left < m.right - 1) return "a tablet puts the words beside the picture";
if (device === "phone" && side.top < m.bottom - 1) return "a phone puts the words under the picture";

// With less motion a heart still shows, and still goes.
await cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
await wait(60);
await tapAt(q); await wait(30); await tapAt(q);
await wait(120);
if (!$(".ui-double-tap-burst")) return "a heart should show with less motion";
await wait(800);
await cdp("Emulation.setEmulatedMedia", { features: [] });
if ($(".ui-double-tap-burst")) return "with less motion the heart should still go";
