const l = $("#match-score-demo-live");
if (!l || l.tagName !== "ARTICLE" || l.getAttribute("aria-label") !== "Arsenal 2, Chelsea 1, live, 67'") return `the live card says ${l?.getAttribute("aria-label")}`;
if (l.querySelector(".ui-mscore-where").textContent !== "Premier League · Matchday 10 · Emirates Stadium") return "competition and venue";
const st = l.querySelector(".ui-mscore-status");
if (st.textContent !== "Live 67'" || getComputedStyle(st, "::before").content === "none") return "the live status";
const probe = (v) => { const p = document.createElement("span"); p.style.color = `var(${v})`; l.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; };
if (getComputedStyle(st).backgroundColor !== probe("--ui-danger")) return "live is not red";
const teams = [...l.querySelectorAll(".ui-mscore-team")];
if (teams.map((t) => t.querySelector(".ui-mscore-goals").textContent).join("-") !== "2-1") return "the score";
if (teams[0].querySelector(".ui-mscore-crest").textContent !== "ARS" || teams[0].querySelector(".ui-mscore-crest").style.getPropertyValue("--c") !== "#db0007") return "the crest";
if (teams[0].querySelector(".ui-mscore-scorers").textContent !== "Saka 23', Ødegaard 51'") return "scorers";
if (l.querySelector(".ui-mscore-won, .ui-mscore-lost")) return "a live game has a winner";
const a = l.querySelector("a.ui-mscore-link");
if (!a || a.getAttribute("href") !== "#ars-che" || a.getAttribute("aria-label") !== l.getAttribute("aria-label")) return "the link";
const r = l.getBoundingClientRect(), ar = a.getBoundingClientRect();
if (Math.abs(r.width - ar.width) > 2.5 || Math.abs(r.height - ar.height) > 2.5) return "the link does not cover the card";
const f = $("#match-score-demo-final");
const ft = [...f.querySelectorAll(".ui-mscore-team")];
if (f.querySelector(".ui-mscore-status").textContent !== "FT" || !ft[1].classList.contains("ui-mscore-won") || !ft[0].classList.contains("ui-mscore-lost")) return "winner given on penalties";
if (ft[0].querySelector(".ui-mscore-name small").textContent !== "(a.e.t.)" || f.querySelector(".ui-mscore-note").textContent !== "Porto win 4–3 on penalties") return "notes";
if (ft[0].querySelector(".ui-mscore-crest").textContent !== "RS" || f.getAttribute("aria-label") !== "Real Sociedad 1, Porto 1, full time") return "initials, summary";
const s = $("#match-score-demo-ft");
const st2 = [...s.querySelectorAll(".ui-mscore-team")];
if (!s.classList.contains("ui-mscore-sm") || !st2[1].classList.contains("ui-mscore-won") || st2[1].querySelector(".ui-mscore-crest").textContent !== "NAN") return "the winner from the score";
if (getComputedStyle(st2[0].querySelector(".ui-mscore-goals")).color !== probe("--ui-muted")) return "the loser is not muted";
const n = $("#match-score-demo-next");
if (n.querySelector(".ui-mscore-goals") || n.querySelector(".ui-mscore-status")) return "a game not started shows a score";
const k = n.querySelector("time.ui-mscore-kick");
if (!k || k.textContent !== "Sat 3:00 PM" || k.getAttribute("datetime") !== "2026-11-01T15:00:00Z") return "kick-off";
if (n.getAttribute("aria-label") !== "Leeds United against Everton, kick-off Sat 3:00 PM") return `scheduled summary: ${n.getAttribute("aria-label")}`;
if (n.querySelector(".ui-mscore-crest").textContent !== "LU") return "two-word initials";
const o = $("#match-score-demo-off");
if (o.querySelector(".ui-mscore-status").textContent !== "Postponed" || o.querySelector(".ui-mscore-goals") || o.querySelector(".ui-mscore-crest").textContent !== "BC") return "postponed";
// Nothing spills out of a card: a long competition line is cut, the score stays inside.
for (const card of $$(".ui-mscore")) {
    const cr = card.getBoundingClientRect();
    for (const el of card.querySelectorAll(".ui-mscore-status, .ui-mscore-goals")) {
        const er = el.getBoundingClientRect();
        if (er.right > cr.right + 0.5) return `${el.className} spills out of ${card.id}`;
    }
}
