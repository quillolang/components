const KEY = "ui-autosave:demo-story";
localStorage.removeItem(KEY);
const form = () => $("#autosave-form-demo");
const f = (n) => form().querySelector(`[name=${n}]`);
const status = () => form().querySelector(".ui-asave-status");
const visit = async () => { $("[data-visit]").click(); await wait(250); };
const last = () => $("[data-last]").textContent;
// Typing saves a draft, a moment later.
type(f("title"), "A trip to Porto"); type(f("body"), "Olá 😀\nline two"); await wait(40);
if (localStorage.getItem(KEY) !== null) return "saved before the first tick: the writes should be spaced";
await wait(250);
const saved = JSON.parse(localStorage.getItem(KEY));
if (saved.v !== 1 || saved.values.title !== "A trip to Porto" || saved.values.body !== "Olá 😀\nline two" || saved.values.public !== false) return `the draft: ${localStorage.getItem(KEY)}`;
if (!status().textContent.startsWith("Draft saved at ") || status().dataset.status !== "saved" || last() !== "on_status: saved") return `saved: ${status().textContent} / ${last()}`;
if (status().getAttribute("role") !== "status") return "the status is announced";
// A password is never kept.
type(f("code"), "s3cret"); await wait(250);
if (localStorage.getItem(KEY).includes("s3cret") || "code" in JSON.parse(localStorage.getItem(KEY)).values) return `a secret was stored: ${localStorage.getItem(KEY)}`;
// Coming back: the form is empty, and offers the draft.
await visit();
if (f("title").value !== "" || !form().querySelector("[data-offer]")?.textContent.startsWith("A draft from ") || last() !== "on_status: offered") return `the offer: ${f("title").value} / ${last()}`;
// Typing meanwhile does not overwrite what is on offer.
const held = localStorage.getItem(KEY);
type(f("title"), "Something else"); await wait(250);
if (localStorage.getItem(KEY) !== held) return "the draft was overwritten before the choice";
form().querySelector("[data-restore]").click(); await wait(50);
if (f("title").value !== "A trip to Porto" || f("body").value !== "Olá 😀\nline two" || form().querySelector("[data-offer]")) return `restore: ${f("title").value}`;
if (status().textContent !== "Draft restored." || last() !== "on_status: restored") return status().textContent;
// Discard.
await visit();
form().querySelector("[data-discard]").click(); await wait(50);
if (localStorage.getItem(KEY) !== null || status().textContent !== "Draft discarded." || f("title").value !== "") return `discard: ${localStorage.getItem(KEY)}`;
// A draft the same as the form is no offer; nothing there, none either.
await visit();
if (form().querySelector("[data-offer]")) return "nothing to offer";
localStorage.setItem(KEY, JSON.stringify({ v: 1, at: 1, values: { title: "" } }));
await visit();
if (form().querySelector("[data-offer]")) return "a draft saying nothing new";
// Bad drafts: cleared, and said so.
for (const bad of ["{oops", "null", "5", '{"v":2,"values":{}}', '{"v":1,"values":[]}']) {
    localStorage.setItem(KEY, bad);
    await visit();
    if (form().querySelector("[data-offer]") || localStorage.getItem(KEY) !== null) return `bad draft ${bad}: ${localStorage.getItem(KEY)}`;
    if (status().textContent !== "A saved draft could not be read, so it was cleared.") return status().textContent;
}
// A draft for a field that has gone, or of the wrong kind, takes only what fits.
localStorage.setItem(KEY, JSON.stringify({ v: 1, values: { title: "Kept", gone: "x", body: 5, public: "yes", code: "stolen" } }));
await visit();
if (form().querySelector("[data-offer]").textContent !== "A draft is saved in this browser.") return "a draft with no time";
form().querySelector("[data-restore]").click(); await wait(50);
if (f("title").value !== "Kept" || f("body").value !== "" || f("public").checked || f("code").value !== "") return `only what fits: ${f("body").value} ${f("code").value}`;
// Writing fails (full storage): says so, the form goes on, and it tries again.
const real = Storage.prototype.setItem;
Storage.prototype.setItem = function () { throw new DOMException("full", "QuotaExceededError"); };
type(f("body"), "more"); await wait(250);
Storage.prototype.setItem = real;
if (status().dataset.status !== "failed" || !status().textContent.startsWith("Could not save a draft") || last() !== "on_status: failed") return `failing: ${status().textContent}`;
if (f("body").value !== "more") return "what was typed stays";
type(f("body"), "more still"); await wait(250);
if (status().dataset.status !== "saved" || JSON.parse(localStorage.getItem(KEY)).values.body !== "more still") return `saving again: ${status().textContent}`;
// Required on submit: says where, and keeps the draft.
type(f("title"), "   "); await wait(30);
form().querySelector(".ui-asave-send").click(); await wait(60);
if (form().querySelector("[data-field=title] .ui-asave-error")?.textContent !== "Title is required." || f("title").getAttribute("aria-invalid") !== "true") return "required";
if (document.activeElement !== f("title")) return "focus goes to the empty field";
await wait(250);
if (localStorage.getItem(KEY) === null) return "a refused send keeps the draft";
// Sending clears it, and no late write brings it back.
type(f("title"), "Done"); 
form().querySelector(".ui-asave-send").click(); await wait(300);
if (localStorage.getItem(KEY) !== null) return `sending clears the draft: ${localStorage.getItem(KEY)}`;
if (status().textContent !== "Sent. The draft is cleared." || $("[data-said]").textContent !== "on_submit: Done" || last() !== "on_status: sent") return `sent: ${status().textContent} ${$("[data-said]").textContent}`;
// Storage blocked outright: reading throws too. It says so and the form works.
const was = Object.getOwnPropertyDescriptor(window, "localStorage");
Object.defineProperty(window, "localStorage", { configurable: true, get() { throw new DOMException("denied", "SecurityError"); } });
try {
    await visit();
    if (status().dataset.status !== "blocked" || status().textContent !== "Drafts are off: this browser is blocking storage. The form still works." || last() !== "on_status: blocked") return `blocked: ${status().textContent}`;
    type(f("title"), "Still works"); await wait(250);
    if (status().dataset.status !== "failed") return `blocked, typing: ${status().dataset.status}`;
    form().querySelector(".ui-asave-send").click(); await wait(80);
    if ($("[data-said]").textContent !== "on_submit: Still works" || status().textContent !== "Sent. The draft is cleared.") return "a blocked form must still send";
} finally {
    if (was) Object.defineProperty(window, "localStorage", was); else delete window.localStorage;
}
window.localStorage.removeItem(KEY);
