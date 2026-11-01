// mobile
const until = async (test, ms = 3000) => { const t = Date.now(); while (Date.now() - t < ms) { if (test()) return true; await wait(15); } return false; };
const away = async (ms = 80) => {
    const t = await cdp("Target.createTarget", { url: "about:blank" });
    await wait(ms);
    const hid = document.visibilityState;
    await cdp("Target.closeTarget", { targetId: t.targetId });
    await until(() => document.visibilityState === "visible", 800);
    if (hid !== "hidden") throw new Error("the tab was not hidden");
};
const calls = () => parseInt($("#rsmr-calls").textContent.match(/\d+/)[0]);
const box = $("#rsmr-scroll");
const note = () => $(".ui-rsmr-note");
const row = (k) => box.querySelector(`[data-key="${k}"]`);
const rowsTop = () => box.getBoundingClientRect().top;
const net = async (offline) => { await cdp("Network.enable"); await cdp("Network.emulateNetworkConditions", { offline, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }); await wait(150); };

// Nothing happens by itself on start.
if (calls() !== 0) return "it should not load on start: " + calls();
if (note()) return "no notice on start";
// after_ms has passed, as the harness took over a second to get here, so go back past it now:
await wait(1300);
// At the very top: nothing held, and the new rows are simply seen. "3 new items", with no button.
await away();
if (!(await until(() => calls() === 1, 800))) return "coming back after a time refreshes: " + calls();
if (!(await until(() => note(), 500))) return "a notice";
if (note().textContent !== "3 new items") return "the notice: " + note().textContent;
if (box.scrollTop !== 0) return "at the top it stays at the top: " + box.scrollTop;
if (note().querySelector("button")) return "at the top there is nothing to show";
if (note().getBoundingClientRect().height < 44 && note().querySelector("button")) return "small";
// Recent: back at once, and it is skipped.
await away();
await wait(200);
if (calls() !== 1) return "recent is skipped: " + calls();
// The notice goes by itself.
if (!(await until(() => !note(), 1500))) return "the notice goes";

// Scrolled down, with text typed and focus in a row. Three rows land above it.
await wait(1300);
box.scrollTop = 1500;
await wait(50);
const key = [...box.querySelectorAll("[data-key]")].find((r) => r.getBoundingClientRect().bottom > rowsTop());
const k = key.dataset.key, gap = key.getBoundingClientRect().top - rowsTop();
const field = key.nextElementSibling.querySelector("input");
field.value = "typed here"; field.focus();
const scrollBefore = box.scrollTop;
await away();
if (!(await until(() => calls() === 2, 800))) return "second refresh: " + calls();
await until(() => note(), 800);
const off = row(k).getBoundingClientRect().top - rowsTop() - gap;
if (Math.abs(off) > 1) return "the place moved by " + off;
if (Math.abs(box.scrollTop - (scrollBefore + 3 * 56)) > 1) return "three rows above: " + box.scrollTop + " from " + scrollBefore;
if (field.value !== "typed here" || !field.isSameNode(document.activeElement)) return "typed text and focus stay";
if (note().textContent !== "3 new itemsShow") return "new rows above, and a way to them: " + note().textContent;
// Show goes to the top, with a real tap.
await tap(note().querySelector("button"));
if (box.scrollTop !== 0 || note()) return "Show: " + box.scrollTop;

// No new rows, and one: the words.
await tap($("#rsmr-none"));
await wait(1300);
await away();
await until(() => calls() === 3, 800); await until(() => note(), 500);
if (note().textContent !== "Up to date") return "none: " + note()?.textContent;
await until(() => !note(), 1500);
await tap($("#rsmr-one"));
await wait(1300);
await away();
await until(() => calls() === 4, 800); await until(() => note(), 500);
if (note().textContent !== "1 new item") return "one: " + note()?.textContent;
await until(() => !note(), 1500);

// A failure, as iOS's sleeping server gives: tried once more, 800 ms on, and no one is told.
await tap($("#rsmr-fail"));
await wait(1300);
await away();
await until(() => calls() === 5, 800);
await wait(200);
if (note()) return "a first failure is not said: " + note().textContent;
if (!(await until(() => calls() === 6, 1400))) return "tried once more: " + calls();
await until(() => note(), 500);
if (note().textContent !== "1 new item") return "and it worked: " + note()?.textContent;
await until(() => !note(), 1500);
// Two failures: said, and it stays, with a Try again that works.
await tap($("#rsmr-fail2"));
await wait(1300);
await away();
await until(() => calls() === 8, 2000);
await until(() => note(), 500);
if (note().dataset.kind !== "failed" || note().textContent !== "Could not update. This is what you had.Try again") return "a failure: " + note()?.textContent;
await wait(900);
if (!note()) return "a failure stays";
await tap(note().querySelector("button"));
await until(() => calls() === 9, 800);
await until(() => note()?.dataset.kind === "new", 800);
if (note().textContent !== "1 new item") return "Try again: " + note()?.textContent;
await until(() => !note(), 1500);

// Coming back online counts as coming back.
await wait(1300);
await net(true);
await net(false);
if (!(await until(() => calls() === 10, 800))) return "the connection back refreshes: " + calls();
// Two returns at once load once.
await until(() => !$("#rsmr-demo").hasAttribute("data-busy"), 800);
await wait(1300);
document.dispatchEvent(new Event("visibilitychange")); document.dispatchEvent(new Event("visibilitychange"));
await wait(300);
if (calls() !== 11) return "two at once: " + calls();
// A clock moved back: the age makes no sense, so it refreshes.
await until(() => !note(), 1500);
const clock = Date.now, real = clock.call(Date);
Date.now = () => real - 3600000;
document.dispatchEvent(new Event("visibilitychange"));
await wait(150);
Date.now = clock;
if (calls() !== 12) return "a clock moved back: " + calls();
