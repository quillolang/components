const box = $("#jwt-inspector-demo-token");
const c = box.closest(".ui-jwt");
const b64 = (s) => { const bytes = typeof s === "string" ? new TextEncoder().encode(s) : s; return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const jwt = (h, p, sig = "c2ln") => `${b64(typeof h === "string" ? h : JSON.stringify(h))}.${b64(typeof p === "string" ? p : JSON.stringify(p))}.${sig}`;
const claim = (k) => c.querySelector(`[data-claim=${k}]`);
const warns = () => [...c.querySelectorAll(".ui-jwt-warnings li")].map((l) => l.textContent);
const errors = () => [...c.querySelectorAll(".ui-jwt-error")].map((l) => l.textContent);
const banner = () => c.querySelector(".ui-jwt-unverified")?.textContent;
const load = async (t) => { type(box, t); await wait(60); };
const now = 1793534400; // 2026-11-01T12:00:00Z
const start = box.value;
if (box.name !== "token" || !box.labels[0]) return "the field";
if (banner() !== "The signature was not verified. This only decodes the token, so anyone could have written what it says.") return `banner: ${banner()}`;
if (warns().length) return `a good token: ${warns()}`;
if (claim("exp").firstChild.textContent !== "2026-11-01 13:00:00 UTC" || claim("exp").querySelector("span").textContent !== "1793538000, in 1 h") return `exp: ${claim("exp").textContent}`;
if (claim("iat").firstChild.textContent !== "2026-11-01 11:00:00 UTC" || claim("iat").querySelector("span").textContent !== "1793530800, 1 h ago") return `iat: ${claim("iat").textContent}`;
if (claim("nbf").querySelector("span").textContent !== "1793530800, 1 h ago") return "nbf";
if (claim("name").textContent !== "Zoë 😀") return `UTF-8: ${claim("name").textContent}`;
if (claim("id").textContent !== "9007199254740993") return `a large id keeps its digits: ${claim("id").textContent}`;
if (claim("aud").textContent !== `["api","web"]`) return `aud: ${claim("aud").textContent}`;
const order = [...c.querySelectorAll("tbody th")].map((t) => t.textContent).join(" ");
if (order !== "iss sub aud iat nbf exp name role id") return `order: ${order}`;
if (c.querySelector("[data-part=header]").textContent !== `{\n  "alg": "HS256",\n  "typ": "JWT"\n}`) return `header: ${c.querySelector("[data-part=header]").textContent}`;
if (!c.querySelector("[data-part=payload]").textContent.includes(`"id": 9007199254740993`)) return "the payload rounds";
if (c.querySelector("[data-signature]").textContent !== "Signature: 15 bytes, not checked.") return c.querySelector("[data-signature]").textContent;
// Warnings, each from a token made here.
const hs = { alg: "HS256", typ: "JWT" };
const fine = { sub: "x", exp: now + 3600 };
for (const [h, p, want, sig] of [
    [{ alg: "none" }, fine, "alg is none: this token has no signature at all, and anyone could have written it. Refuse it.", ""],
    [{ alg: "None" }, fine, "alg is None: this token has no signature at all, and anyone could have written it. Refuse it.", ""],
    [{ alg: "nOnE" }, fine, "alg is nOnE, yet there is a signature. A verifier that believes the header would skip it: refuse this token.", "c2ln"],
    [{ typ: "JWT" }, fine, "There is no alg in the header, so nothing says how it is signed."],
    [hs, fine, "alg is HS256, but the signature is empty.", ""],
    [{ alg: "XX1" }, fine, "alg XX1 is not one of the usual algorithms."],
    [{ alg: 7 }, fine, "alg is not text."],
    [hs, { sub: "x" }, "There is no exp, so this token never expires."],
    [hs, { exp: now - 90000 }, "Expired 1 day 1 h ago."],
    [hs, { exp: now }, "Expired now."],
    [hs, { exp: now + 1, nbf: now + 7200 }, "Not valid yet: nbf is in 2 h."],
    [hs, { exp: now + 7200, iat: now + 60 }, "Issued in the future, in 1 min: a clock is wrong, or this was made by hand."],
    [hs, { exp: now - 10, iat: now - 5 }, "exp is not after iat, so it was never valid."],
    [hs, { exp: now + 5, nbf: now + 5 }, "exp is not after nbf, so it was never valid."],
    [hs, { exp: now + 40000000, iat: now }, "It lasts 462 days 23 h from issue, over a year: a stolen copy works that long."],
    [hs, { exp: (now + 3600) * 1000 }, "exp looks like milliseconds: JWT times are seconds. As milliseconds it would be 2026-11-01 13:00:00 UTC."],
    [hs, { exp: String(now) }, "exp must be a number of seconds, and this is not one."],
    [hs, { exp: -5 }, "exp is not a date that can be."],
    [hs, { exp: 1e300 }, "exp is not a date that can be."],
    [hs, { exp: now + 60, password: "hunter2" }, "The payload names password. A payload is only encoded, so anyone holding the token can read it."],
    [{ alg: "RS256", jku: "https://evil.example/keys" }, fine, "The header carries jku, naming its own key. Never fetch or trust a key because the token says so."]]) {
    await load(jwt(h, p, sig ?? "c2ln"));
    if (!warns().includes(want)) return `${JSON.stringify(h)} ${JSON.stringify(p)}: ${warns().join(" / ")}`;
    if (!banner()) return "the banner must always show";
}
await load(jwt({ alg: "none" }, fine, ""));
if (!c.querySelector(".ui-jwt-warnings .ui-jwt-danger")) return "alg none is not marked as danger";
await load(jwt(hs, { exp: 1793538000.5 }));
if (claim("exp").firstChild.textContent !== "2026-11-01 13:00:00 UTC") return `a fraction: ${claim("exp").textContent}`;
// What people paste.
for (const t of [`Bearer ${start}`, `bearer   ${start}`, `Authorization: Bearer ${start}`, `"${start}"`, `  ${start}\n`, start.slice(0, 30) + "\n  " + start.slice(30)]) {
    await load(t);
    if (claim("sub")?.textContent !== "user-8841") return `pasted ${t.slice(0, 22)}: ${errors()}`;
}
// Plain base64 and padding are read too.
await load(`${btoa(JSON.stringify(hs))}.${btoa(JSON.stringify(fine))}.c2ln`);
if (claim("sub")?.textContent !== "x") return `padding: ${errors()}`;
// Bad tokens say what is wrong.
for (const [t, want] of [
    ["abc", "A token has parts with dots between them, and this has no dots."], ["a.b.c.d", "This has 4 parts. A signed token has 3 and an encrypted one 5."],
    ["a.b.c.d.e.f", "This has 6 parts. A signed token has 3 and an encrypted one 5."], ["...", "This has 4 parts. A signed token has 3 and an encrypted one 5."],
    ["😀.😀.😀", "The header is not base64url: 😀 at character 1."], ["ab!d.e30.x", "The header is not base64url: ! at character 3."], ["a.e30.x", "The header has a length no base64url text can have, so it is cut short."],
    [".e30.x", "The header is empty."], ["e30..x", "The payload is empty."], [`${b64("not json")}.e30.x`, "The header decodes, but is not JSON (line 1, column 1)."],
    [`${b64("[1]")}.e30.x`, "The header decodes, but is not a JSON object."], [`e30.${b64(`{"a":`)}.x`, "The payload decodes, but is not JSON (line 1, column 6)."]]) {
    await load(t);
    if (!errors().includes(want)) return `${t}: ${errors().join(" / ")}`;
}
await load(`${b64(JSON.stringify(hs))}.${b64(`{"a":`)}.c2ln`);
if (!c.querySelector("[data-part=header]") || c.querySelector("[data-part=payload]").textContent !== `{"a":`) return "a bad payload still shows the header and its text";
await load(`${b64(JSON.stringify(hs))}.${b64(JSON.stringify(fine))}`);
if (!warns().includes("There is no third part, so no signature.") || c.querySelector("[data-signature]").textContent !== "No signature part.") return `two parts: ${warns()}`;
await load(`${b64(JSON.stringify(hs))}.${b64(JSON.stringify(fine))}.a!b`);
if (!warns().includes("The signature is not base64url.")) return `a bad signature: ${warns()}`;
await load(`${b64(JSON.stringify({ alg: "RSA-OAEP", enc: "A256GCM" }))}.a.b.c.d`);
if (warns()[0] !== "This token is encrypted, so its payload cannot be read here, only the header." || c.querySelector("[data-part=payload]") || !c.querySelector("[data-part=header]").textContent.includes("RSA-OAEP")) return `encrypted: ${warns()}`;
// Bad UTF-8 becomes U+FFFD, in a string; a lone continuation byte and an overlong form.
await load(`e30.${b64(new Uint8Array([0x7b, 0x22, 0x61, 0x22, 0x3a, 0x22, 0xff, 0xc0, 0x80, 0x22, 0x7d]))}.c2ln`);
if (claim("a")?.textContent !== "���") return `bad bytes: ${claim("a")?.textContent}`;
await load(`e30.${b64(`{"a":"日本語 é 𝒳"}`)}.c2ln`);
if (claim("a")?.textContent !== "日本語 é 𝒳") return `multi-byte: ${claim("a")?.textContent}`;
await load(`e30.${b64(`{"<b>":"<script>alert(1)</script>"}`)}.c2ln`);
if (c.querySelector("td b, td script") || !c.textContent.includes("<script>alert(1)</script>")) return "markup in a claim";
await load("");
if (banner() || !c.textContent.includes("Paste a token to read it.")) return "empty";
await load("   \n ");
if (banner() || errors().length) return "white space";
const t0 = performance.now();
await load("a".repeat(200000));
if (errors()[0] !== "This is 200,000 characters, too long for a token: it stops at 100,000.") return `huge: ${errors()}`;
await load(`e30.${b64(JSON.stringify({ exp: now + 9, pad: "x".repeat(60000) }))}.c2ln`);
if (performance.now() - t0 - 120 > 700) return `a long token took ${Math.round(performance.now() - t0 - 120)} ms`;
if (claim("pad")?.textContent.length !== 60000) return "a long claim";
await load(start);
// The callback.
const l = $("#jwt-inspector-demo-live-token");
if (l.name !== "suspect") return "the name";
const w = l.closest(".ui-jwt");
if (!w.querySelector(".ui-jwt-danger")?.textContent.startsWith("alg is none")) return "the second demo";
type(l, jwt(hs, { exp: now - 1 })); await wait(60);
if (w.closest(".demo-stack").querySelector(".demo-note").textContent !== "on_change: ok true, alg HS256, 1 warnings.") return `on_change: ${w.closest(".demo-stack").querySelector(".demo-note").textContent}`;
