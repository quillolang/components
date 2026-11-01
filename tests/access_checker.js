const who = $("#access-checker-demo-who"), act = $("#access-checker-demo-action"), res = $("#access-checker-demo-resource");
const box = who.closest(".ui-access-checker");
const verdict = () => box.querySelector(".ui-access-checker-verdict").textContent;
const reason = () => box.querySelector(".ui-access-checker-reason").textContent;
const rule = () => box.querySelector(".ui-access-checker-rule")?.textContent;
const via = () => box.querySelector(".ui-access-checker-via")?.textContent;
const pick = async (w, a, r) => { who.value = w; who.dispatchEvent(new Event("change", { bubbles: true })); type(act, a); type(res, r); await wait(); };
if (who.name !== "who" || act.name !== "action" || res.name !== "resource") return "field names";
if (!box.querySelector("[aria-live]")) return "the answer is not announced";
// Ben writing a published doc: rule 2 allows through editor, rule 5 denies. Deny wins.
if (verdict() !== "Deny") return `start: ${verdict()}`;
if (reason() !== "Rule 5 denies it, and a deny beats the allow of rule 2.") return `reason: ${reason()}`;
if (rule() !== "5. deny role editor write docs/published (frozen after review)") return `rule: ${rule()}`;
if (via() !== "Through the role editor") return `via: ${via()}`;
await pick("user:ben", "write", "docs/plan");
if (verdict() !== "Allow" || rule() !== "2. allow role editor write docs/*") return `ben writes a plan: ${verdict()} ${rule()}`;
await pick("user:ben", "read", "docs/plan");
if (verdict() !== "Allow" || rule() !== "1. allow role viewer read docs/*" || via() !== "Through editor → viewer") return `inherited: ${verdict()} ${rule()} ${via()}`;
// Ada is admin, which inherits editor, so the deny reaches her past the allow of * on *.
await pick("user:ada", "write", "docs/published");
if (verdict() !== "Deny" || reason() !== "Rule 5 denies it, and a deny beats the allow of rule 2 and rule 4." || via() !== "Through admin → editor") return `deny through inheritance: ${reason()} ${via()}`;
await pick("user:ada", "shred", "anything/at/all");
if (verdict() !== "Allow" || !rule().startsWith("4.")) return `the wildcard: ${verdict()} ${rule()}`;
await pick("user:cleo", "read", "billing/payroll");
if (verdict() !== "Deny" || rule() !== "6. deny user cleo read billing/payroll") return `a user's own deny: ${rule()}`;
await pick("user:cleo", "read", "billing/invoices");
if (verdict() !== "Allow" || rule() !== "3. allow role finance read billing/*") return `finance: ${rule()}`;
await pick("user:dev", "read", "docs/plan");
if (verdict() !== "Deny" || rule() !== undefined || reason() !== "No rule matches, and what no rule allows is denied.") return `the default: ${reason()}`;
// A pattern needs its slash: "docs/*" does not take "docs" or "docsplan".
await pick("role:viewer", "read", "docs");
if (verdict() !== "Deny") return `docs is not docs/*: ${verdict()}`;
await pick("role:viewer", "read", "docs/a/b");
if (verdict() !== "Allow") return `* crosses slashes: ${verdict()}`;
await pick("role:viewer", "", "");
if (box.querySelector("[role=alert]")) return "an empty pick is not an error";
// The matrix: 8 people and roles by 4 resources by 2 actions.
const cells = box.querySelectorAll(".ui-access-checker-cell");
if (cells.length !== 64) return `cells: ${cells.length}`;
const yes = box.querySelectorAll(".ui-access-checker-yes").length;
// By hand, out of 8 for each: ada 7 (all but writing published), ben 3, cleo 3, dev 0;
// viewer 2, editor 3, finance 4, admin 7. A script over the same rules also gives 29.
if (yes !== 29) return `allowed cells: ${yes}`;
const cell = [...cells].find((c) => c.getAttribute("aria-label") === "cleo, read, billing/payroll: deny");
if (!cell) return `no cell for cleo: ${cells[0].getAttribute("aria-label")}`;
cell.click(); await wait();
if (rule() !== "6. deny user cleo read billing/payroll" || !cell.classList.contains("ui-access-checker-picked")) return `a cell picks its case: ${rule()}`;
if (who.value !== "user:cleo" || act.value !== "read" || res.value !== "billing/payroll") return `the fields follow the cell: ${who.value} ${act.value} ${res.value}`;
// A cycle is named, each role still answers, and nothing hangs.
const policy = $("#access-checker-demo-policy");
if (policy.name !== "policy") return "the policy's name";
const good = policy.value;
const p = JSON.parse(good);
if (p.rules.length !== 6 || p.users.ben[0] !== "editor") return "the policy text";
p.roles.viewer = ["admin"];
type(policy, JSON.stringify(p)); await wait();
const probs = () => [...box.querySelectorAll(".ui-access-checker-problems li")].map((l) => l.textContent);
if (probs().length !== 2 || !probs()[0].includes("viewer → admin → editor → viewer") || !probs()[1].includes("viewer → admin → finance → viewer")) return `cycles: ${probs().join(" / ")}`;
await pick("role:viewer", "shred", "x");
if (verdict() !== "Allow" || via() !== "Through viewer → admin") return `a loop still answers: ${verdict()} ${via()}`;
p.roles.viewer = ["viewer"];
type(policy, JSON.stringify(p)); await wait();
if (!probs()[0].includes("viewer → viewer")) return `a role that inherits itself: ${probs()}`;
p.roles = { viewer: ["ghost"] }; p.users = { a: ["nobody"] }; p.rules = [{ effect: "maybe", role: "viewer", action: "x", resource: "y" }, { effect: "allow", action: "x", resource: "y" }, { effect: "allow", role: "nope", action: "x", resource: "y" }, 7];
type(policy, JSON.stringify(p)); await wait();
const list = probs();
if (list[0] !== `Role "viewer" inherits "ghost", which is not in the roles.` || list[1] !== `User "a" holds "nobody", which is not in the roles.`
    || list[2] !== `Rule 1 needs effect "allow" or "deny", so it is ignored.` || list[3] !== "Rule 2 names neither a role nor a user, so it is ignored."
    || list[4] !== `Rule 3 names the role "nope", which is not in the roles.` || list[5] !== "Rule 4 is not a map of fields, so it is ignored.") return `problems: ${list.join(" / ")}`;
type(policy, "{ not json"); await wait();
if (!box.querySelector("[role=alert]").textContent.startsWith("The policy is not valid JSON")) return "bad JSON";
if (box.querySelectorAll(".ui-access-checker-cell").length !== 64) return "bad JSON keeps the policy given";
type(policy, "[1, 2]"); await wait();
if (!box.querySelector("[role=alert]").textContent.includes("must be a map")) return `not a map: ${box.querySelector("[role=alert]")?.textContent}`;
type(policy, "{}"); await wait();
if (box.querySelector("[role=alert]") || verdict() !== "Deny" || !box.querySelector(".ui-access-checker-note").textContent.startsWith("The matrix needs")) return "an empty policy";
type(policy, good); await wait();
// Too many cells: fewer resources, said so, and every rule still answers.
const big = JSON.parse(good);
big.rules = []; for (let i = 0; i < 3000; i++) big.rules.push({ effect: "allow", role: "viewer", action: "read", resource: `r${i}` });
const t0 = performance.now();
type(policy, JSON.stringify(big)); await wait(50);
if (performance.now() - t0 > 900) return `slow on 3000 rules: ${performance.now() - t0}`;
await wait();
if (!probs().includes("Only the first 2000 rules are read.")) return `the rule cap: ${probs()}`;
type(policy, good); await wait();
// The callback: a cell in the second one.
const live = $("#access-checker-demo-live-who").closest(".ui-access-checker");
const note = live.closest(".demo-stack").querySelector(".demo-note");
live.querySelector('[aria-label="sam, read, wiki: allow"]').click(); await wait();
if (note.textContent !== "on_decide: user:sam read wiki is allowed by rule 1.") return `on_decide: ${note.textContent}`;
if (live.querySelector("textarea")) return "editable false shows the policy";
