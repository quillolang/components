// mobile
const field = $("#ui-assetl-in-code");
const live = () => $("#assetl-demo-said").textContent;
const card = () => $(".ui-assetl-card");
const todo = () => $$(".ui-assetl-todo li").map((l) => l.dataset.level + ":" + l.textContent).join(" | ");
const miss = () => $(".ui-assetl-miss");
const btn = (t) => $$(".ui-assetl .ui-btn").find((b) => b.textContent.trim() === t);
const enter = async () => { for (const type of ["keyDown", "keyUp"]) await cdp("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: type === "keyDown" ? "\r" : undefined }); };
const scan = async (code) => { field.focus(); await cdp("Input.insertText", { text: code }); await enter(); await wait(150); };
const beeps = [];
const start0 = OscillatorNode.prototype.start;
OscillatorNode.prototype.start = function (...a) { beeps.push(this.frequency.value); return start0.apply(this, a); };
const fail = (m) => { OscillatorNode.prototype.start = start0; return m; };
await tap(field);
if (!/Scan a tag/.test($(".ui-assetl-empty").textContent)) return fail("starts empty");
await scan("PMP-1042");
if (!/Sump pump/.test(card().textContent) || live() !== "found PMP-1042") return fail("found: " + live());
if (document.activeElement.tagName !== "H4") return fail("the record takes the focus: " + document.activeElement.tagName);
// 2026-10-20 to 2026-11-02 is 13 days.
if (todo() !== "stop:Service overdue by 13 days.") return fail("overdue: " + todo());
// Newest first.
if ($$(".ui-assetl-hist time").map((t) => t.textContent).join() !== "2026-08-02,2026-04-20,2025-10-18") return fail("history: " + $$(".ui-assetl-hist time").map((t) => t.textContent).join());
if (!/Seal replaced/.test($(".ui-assetl-hist li").textContent) || !/A\. Diallo/.test($(".ui-assetl-hist li").textContent)) return fail("history row");
if (beeps[beeps.length - 1] !== 1480) return fail("a found tag sounds good");
// However it is typed.
await scan("pmp 1042");
if (!/Sump pump/.test(card().textContent)) return fail("spaces and case");
// Due soon: 2026-11-10 is 8 days, and the certificate is far off, and todo text comes through.
await scan("GEN0007");
if (todo() !== "warn:Service due in 8 days. | warn:Check the fuel level before use") return fail("soon: " + todo());
// Out of service comes first and in words, whatever else there is.
await scan("LFT-2208");
if (!todo().startsWith("stop:Do not use. It is out of service.")) return fail("out of service: " + todo());
if ($(".ui-assetl-state").textContent !== "Out of service") return fail("state");
// Nothing to do says so.
await scan("DRL-5150");
if (todo() !== "ok:Nothing to do. It is fine to use.") return fail("fine: " + todo());
// A tag spelled like an object's field finds its asset, and an unknown one spelled like another does not throw.
await scan("constructor");
if (!/A tag that is also/.test(card().textContent)) return fail("constructor: " + card().textContent);
if (!/Reported missing/.test(todo())) return fail("missing: " + todo());
await scan("toString");
if (!miss() || !/Not in the register: toString/.test(miss().textContent)) return fail("toString: " + (miss()?.textContent ?? card()?.textContent));
if (beeps[beeps.length - 1] !== 330) return fail("an unknown tag sounds low");
// O for 0 is offered first.
await scan("GEN-OOO7");
const near = $$(".ui-assetl-pick");
if (near.length !== 1 || !/GEN-0007/.test(near[0].textContent)) return fail("O for 0: " + miss().textContent);
await tap(near[0]);
if (!/Generator/.test(card().textContent) || miss()) return fail("picking a near one opens it");
// Two letters out, and nothing near.
await scan("DRL-5105");
if (!/DRL-5150/.test(miss().textContent)) return fail("two swapped: " + miss().textContent);
await scan("QQQ-9999");
if (!/Check the label/.test(miss().textContent) || $$(".ui-assetl-pick").length !== 0) return fail("nothing near: " + miss().textContent);
await tap(btn("Report this tag"));
if (live() !== "unknown QQQ-9999") return fail("report: " + live());
if (!btn("Reported").disabled) return fail("once");
// Actions.
await scan("LFT-2208");
await tap(btn("Report a fault"));
if (live() !== "fault on LFT-2208") return fail("action: " + live());
// Recents, newest first, each once, and a tap opens one.
const chips = $$(".ui-assetl-chip").map((c) => c.textContent).join();
if (chips !== "LFT-2208,GEN-0007,constructor,DRL-5150,GEN0007".replace(",GEN0007", ",PMP-1042")) return fail("recent: " + chips);
await tap($$(".ui-assetl-chip")[1]);
if (!/Generator/.test(card().textContent)) return fail("a recent one opens");
// A tablet has the record beside the scanner.
const cols = $$(".ui-assetl-col"), a = cols[0].getBoundingClientRect(), b = cols[1].getBoundingClientRect();
if (device === "tablet" ? b.left <= a.left : b.top <= a.top) return fail("layout: " + device);
fail("");
