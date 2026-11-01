// mobile
const name = "ui-demo-profile";
const open = $("#profile-setup-demo-open"), forget = $("#profile-setup-demo-forget");
const said = () => $("#profile-setup-demo-said").textContent;
const btn = (t) => $$(".ui-profile-setup .ui-btn").find((b) => b.textContent.trim() === t);
const press = async (t) => { const b = btn(t); if (!b) throw new Error("no button " + t + " at " + count() + " " + head() + " in " + $$(".ui-profile-setup .ui-btn").map((x) => x.textContent.trim())); await tap(b); };
const head = () => $(".ui-profile-setup-body h2")?.textContent;
const count = () => $(".ui-profile-setup-count")?.textContent;
const field = () => $("#profile-setup-name");
const clear = () => { document.cookie = name + "=; max-age=0; path=/"; localStorage.removeItem(name); localStorage.removeItem(name + "-photos"); };
const reopen = async () => { await tap(open); await wait(250); };
clear(); await tap(forget); await wait(250);

if (count() !== "Step 1 of 3" || head() !== "Add a photo") return "starts on the first: " + count() + " " + head();
if (btn("Back")) return "no Back on the first step";
// Next with nothing given asks; Skip does not.
await press("Next"); await wait(150);
if (!$(".ui-profile-setup-problem")?.textContent.includes("skip it for now")) return "Next with no photo should say so";
await press("Skip"); await wait(200);
if (count() !== "Step 2 of 3") return "Skip goes on: " + count();
if (document.activeElement !== $(".ui-profile-setup-body h2")) return "the heading takes the focus, without opening a keyboard";
await press("Next"); await wait(150);
if ($(".ui-profile-setup-problem")?.textContent !== "Fill this in, or skip it for now.") return "a blank name: " + $(".ui-profile-setup-problem")?.textContent;
type(field(), "   "); await wait(60);
await press("Next"); await wait(150);
if (count() !== "Step 2 of 3") return "only spaces is no name";
type(field(), "Ada Lovelace"); await wait(100);
if ($(".ui-profile-setup-problem")) return "typing clears the message";
if (field().autocomplete !== "name") return "the name's autofill";

// Turned with the keyboard's focus in the box: it stays, with what was typed.
field().focus();
const w = innerWidth, h = innerHeight;
await cdp("Emulation.setDeviceMetricsOverride", { width: h, height: w, deviceScaleFactor: 2, mobile: true }); await wait(250);
if (field().value !== "Ada Lovelace" || document.activeElement !== field() || count() !== "Step 2 of 3") return "rotation lost something: " + field().value;
await cdp("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 2, mobile: true }); await wait(250);

// Left part way: the same step, the same words, and Skip remembered.
await reopen();
if (count() !== "Step 2 of 3" || field().value !== "Ada Lovelace") return "progress should be kept: " + count() + " " + field()?.value;
// As a phone app's next launch: only the cookie survives a new port.
localStorage.removeItem(name); localStorage.removeItem(name + "-photos");
await reopen();
if (count() !== "Step 2 of 3" || field().value !== "Ada Lovelace") return "the cookie alone should restore: " + count();

await press("Next"); await wait(200);
if (count() !== "Step 3 of 3") return "on to the third: " + count();
await press("Next"); await wait(150);
if ($(".ui-profile-setup-problem")?.textContent !== "Pick one, or skip it for now.") return "no choice yet";
const radios = () => $$(".ui-profile-setup-choice input");
if (radios().length !== 3) return "three options";
await tap(radios()[1].closest("label")); await wait(150);
if (!radios()[1].checked) return "the option should be checked";
if ($(".ui-profile-setup-problem")) return "a choice clears the message";
await reopen();
if (!radios()[1]?.checked) return "the choice should be kept";
await press("Back"); await wait(200);
if (field().value !== "Ada Lovelace") return "Back keeps the name";
await press("Next"); await wait(200);
await press("Next"); await wait(250);

// The end says what was left undone.
if (head() !== "Nearly there") return "the end: " + head();
if (!$(".ui-profile-setup-text").textContent.includes("You left 1 for later")) return "says how many: " + $(".ui-profile-setup-text").textContent;
const left = $$(".ui-profile-setup-sum [data-left]"), done = $$(".ui-profile-setup-sum [data-done]");
if (left.length !== 1 || !left[0].textContent.includes("Add a photo") || done.length !== 2) return "left and done: " + left.length + " " + done.length;
// Add goes to that step, and Save comes back.
await tap(left[0].querySelector(".ui-btn")); await wait(200);
if (head() !== "Add a photo" || !btn("Save")) return "Add goes to the step";

// A file that is not a picture, one that claims to be and is not, and a real one.
const album = () => $("#profile-setup-album");
const give = async (file) => { const t = new DataTransfer(); t.items.add(file); album().files = t.files; album().dispatchEvent(new Event("change", { bubbles: true })); await wait(300); };
if (album().accept !== "image/*" || $("#profile-setup-camera").getAttribute("capture") !== "user") return "the two pickers";
await give(new File(["hello"], "note.txt", { type: "text/plain" }));
if ($(".ui-profile-setup-problem")?.textContent !== "That is not a picture. Pick a photo.") return "a text file: " + $(".ui-profile-setup-problem")?.textContent;
await give(new File(["not really"], "bad.png", { type: "image/png" }));
if ($(".ui-profile-setup-problem")?.textContent !== "That picture could not be read. Pick another one.") return "a broken picture: " + $(".ui-profile-setup-problem")?.textContent;
const c = document.createElement("canvas"); c.width = 900; c.height = 300;
const g = c.getContext("2d"); g.fillStyle = "#f00"; g.fillRect(0, 0, 900, 300); g.fillStyle = "#00f"; g.fillRect(300, 0, 300, 300);
const png = await new Promise((r) => c.toBlob(r, "image/png"));
await give(new File([png], "me.png", { type: "image/png" }));
const img = $(".ui-profile-setup-face img");
if (!img) return "the photo should show: " + $(".ui-profile-setup-problem")?.textContent;
if (!img.src.startsWith("data:image/jpeg")) return "a small jpeg: " + img.src.slice(0, 30);
await img.decode();
if (img.naturalWidth !== 300 || img.naturalHeight !== 300) return "cropped square from 900 by 300, no larger than it was: " + img.naturalWidth + "x" + img.naturalHeight;
// The middle third was blue: the crop took the centre.
const r = document.createElement("canvas"); r.width = 300; r.height = 300; const x = r.getContext("2d"); x.drawImage(img, 0, 0);
const p = x.getImageData(150, 150, 1, 1).data;
if (p[2] < 200 || p[0] > 60) return "should crop the centre: " + [...p];
if (album().value !== "") return "the picker is emptied, so the same photo can be picked again";
// Kept across a return in a browser.
await reopen();
if (!$(".ui-profile-setup-face img")) return "a photo is kept in a browser";
if (!document.cookie.includes(name + "=") || decodeURIComponent(document.cookie).includes("data:image")) return "a photo must stay out of the cookie";
// Removed.
await press("Remove it"); await wait(200);
if ($(".ui-profile-setup-face img")) return "Remove takes it away";
if (!$(".ui-profile-setup-face").textContent.includes("AL")) return "initials from the name: " + $(".ui-profile-setup-face").textContent;
await give(new File([png], "me.png", { type: "image/png" }));
// (Back here after a return, so Save has become Next.)
await press("Next"); await wait(200); await press("Next"); await wait(200); await press("Next"); await wait(250);
if (head() !== "All done") return "nothing left: " + head();
if ($$(".ui-profile-setup-sum [data-left]").length !== 0) return "nothing left undone";
await press("Finish"); await wait(200);
if (said() !== "Finished. Done: photo, name, use. Left: .") return "on_finish: " + said();
if (document.cookie.includes(name + "=") || localStorage.getItem(name)) return "finishing clears what was kept";

// What was kept cannot break it.
document.cookie = name + "=" + encodeURIComponent('{"at":99,"values":[1],"skipped":"x"}') + "; path=/";
await reopen();
if (count() !== "Step 1 of 3") return "bad progress is a fresh start: " + count();
document.cookie = name + "=%7Bnot-json; path=/";
await reopen();
if (count() !== "Step 1 of 3") return "unreadable progress is a fresh start: " + count();
document.cookie = name + "=%E0%A4%A; path=/";
await reopen();
if (count() !== "Step 1 of 3") return "a broken cookie is a fresh start: " + count();

// A tablet: the steps beside the step.
clear(); await tap(forget); await wait(250);
const list = $(".ui-profile-setup-list"), shows = getComputedStyle(list).display !== "none";
if (shows !== (innerWidth >= 600)) return "the list of steps at " + innerWidth + ": " + shows;
if (shows) {
    await tap(list.querySelectorAll("button")[2]); await wait(200);
    if (count() !== "Step 3 of 3") return "a step in the list goes to it";
}
clear(); await tap(forget); await wait(200);
