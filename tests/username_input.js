const box = $("#username-demo");
const wrap = box.closest(".ui-userinput");
const out = (w = wrap) => w.querySelector(".ui-userinput-out").textContent.trim();
const offers = (w = wrap) => [...w.querySelectorAll(".ui-userinput-offer")].map((b) => b.textContent);
const rule = (id, w = wrap) => w.querySelector(`[data-rule=${id}]`).dataset.ok;
if (box.name !== "username" || !box.required) return "a real, required field";
if (offers().join() !== "ana.nunez,ananunez,anan,nuneza") return `from the person's name, what is free: ${offers()}`;
for (const r of ["length", "start", "chars", "joins"]) if (rule(r) !== undefined) return `no marks on an empty field: ${r}`;
const verdict = [
    ["ab", "invalid", "length"], ["a".repeat(21), "invalid", "length"], ["1abc", "invalid", "start"], ["_abc", "invalid", "start"], ["ana bel", "invalid", "chars"], ["josé", "invalid", "chars"],
    ["emoji😀", "invalid", "chars"], ["ana__bel", "invalid", "joins"], ["ana_.bel", "invalid", "joins"], ["anabel_", "invalid", "joins"], ["ana-bel", "invalid", "chars"],
];
for (const [text, status, r] of verdict) {
    type(box, text); await wait(15);
    if (rule(r) !== "false" || !out().startsWith("Not yet:") || box.getAttribute("aria-invalid") !== "true") return `"${text}": ${r} ${rule(r)} ${out()}`;
}
type(box, "emily_rose"); await wait(30);
for (const r of ["length", "start", "chars", "joins"]) if (rule(r) !== "true") return `all rules met: ${r}`;
if (out() !== "emily_rose is free." || offers().length !== 0 || box.getAttribute("aria-invalid")) return `free: ${out()}`;
for (const [text, says] of [
    ["ana", "ana is taken."], ["ANA", "ANA is taken."], ["mike", "mike is taken."], ["MIKE", "MIKE is taken."],
    ["bi11", "bi11 looks too much like bill, which is taken."], ["biIl", "biIl looks too much like bill, which is taken."], ["BIl1", "BIl1 looks too much like bill, which is taken."],
    ["c0ol", "c0ol looks too much like cool, which is taken."], ["coOl", "coOl is taken."], ["C00L", "C00L looks too much like cool, which is taken."],
    ["lvan", "lvan looks too much like Ivan, which is taken."], ["rnike", "rnike looks too much like Mike, which is taken."], ["surnmer", "surnmer looks too much like summer, which is taken."],
    ["admin", "admin is kept for the site."], ["ADMIN", "ADMIN is kept for the site."], ["adm1n", "adm1n is free."], ["r00t", "r00t is kept for the site."], ["Support", "Support is kept for the site."],
]) {
    type(box, text); await wait(15);
    if (out() !== says) return `"${text}": ${out()}`;
}
// A small i and an l are told apart: "alice" is not "allce".
type(box, "bili"); await wait(30);
if (out() !== "bili is free.") return `bili: ${out()}`;
type(box, "@emily"); await wait(30);
if (box.value !== "emily" || out() !== "emily is free.") return `a leading @ goes: ${box.value}`;
type(box, "ana"); await wait(30);
const offered = offers();
if (offered.length !== 4 || new Set(offered).size !== 4) return `four free names: ${offered}`;
for (const o of offered) {
    if (["ana", "ana_nunez", "anunez"].includes(o)) return `a taken name is offered: ${o}`;
}
wrap.querySelectorAll(".ui-userinput-offer")[0].click(); await wait(40);
if (box.value !== offered[0] || out() !== `${offered[0]} is free.` || document.activeElement !== box) return `picking one: ${box.value} ${out()}`;
type(box, "   "); await wait(30);
if (out() !== "Not yet: starts with a letter.") return `spaces: ${out()}`;
type(box, ""); await wait(30);
if (out() !== "" || box.getAttribute("aria-invalid")) return "empty is quiet";
const t0 = performance.now();
type(box, "x".repeat(50000)); await wait(30);
if (performance.now() - t0 > 400) return `a huge name took ${performance.now() - t0} ms`;
const live = $("#username-demo-live"), lw = live.closest(".ui-userinput"), note = () => live.closest(".demo-stack").querySelector(".demo-note").textContent;
type(live, "José Luis"); await wait(30);
if (note() !== "on_change: invalid José Luis") return `on_change: ${note()}`;
if (offers(lw).join() !== "jose-luis,joseluis,jluis") return `from what was typed, in plain letters, with its separator: ${offers(lw)}`;
type(live, "summer"); await wait(30);
if (note() !== "on_change: taken summer" || offers(lw).join() !== "summer2,summer3,summer4") return `numbered, with no person: ${offers(lw)}`;
type(live, "a-b"); await wait(30);
if (out(lw) !== "a-b is free." || rule("chars", lw) !== "true") return `separators: ${out(lw)}`;
type(live, "a_b"); await wait(30);
if (rule("chars", lw) !== "false") return "separators: _ is not one here";
type(live, "abcdefghijklm"); await wait(30);
if (rule("length", lw) !== "false" || lw.querySelector("[data-rule=length]").textContent.indexOf("3 to 12 characters") < 0) return "max_length";
if (offers(lw).some((o) => o.length > 12)) return `offers stay within max_length: ${offers(lw)}`;
