const [env, hdr, lab] = $$(".ui-kv");
if (!env || !hdr || !lab) return "expected three editors";
const posted = () => JSON.parse(env.querySelector("input[type=hidden][name=env]").value);
const rows = (ed) => [...ed.querySelectorAll(".ui-kv-row")];
if (JSON.stringify(posted()) !== '{"PORT":"8080","LOG_LEVEL":"info","DATABASE_URL":"postgres://db/app"}') return `it starts by posting ${JSON.stringify(posted())}`;
if (env.getAttribute("role") !== "group" || !env.getAttribute("aria-labelledby")) return "the editor is not a named group";
const k0 = rows(env)[0].querySelectorAll("input")[0];
if (k0.getAttribute("aria-label") !== "Key 1" || k0.name) return "a key box has no name for screen readers, or would be posted itself";
const v1 = rows(env)[1].querySelectorAll("input")[1];
type(v1, "debug"); await wait();
if (posted().LOG_LEVEL !== "debug") return "changing a value is not posted";
const k1 = rows(env)[1].querySelectorAll("input")[0];
type(k1, "PORT"); await wait();
if (k1.getAttribute("aria-invalid") !== "true" || k0.getAttribute("aria-invalid") !== "true") return "a key used twice is not marked on both rows";
const warn = document.getElementById(k1.getAttribute("aria-describedby"));
if (!warn || !warn.textContent.includes("more than once")) return "the duplicate key has no warning";
if (posted().PORT !== "debug" || Object.keys(posted()).length !== 2) return `the last of a duplicate key should win: ${JSON.stringify(posted())}`;
type(k1, "LOG_LEVEL"); await wait();
if (k1.getAttribute("aria-invalid") || env.querySelector(".ui-kv-warn")) return "the warning stays after the duplicate is fixed";
// Enter in the last value adds a row and focuses its key
const lastv = rows(env)[2].querySelectorAll("input")[1];
lastv.focus(); key(lastv, "Enter"); await wait();
if (rows(env).length !== 4) return `Enter in the last value did not add a row (${rows(env).length})`;
const nk = rows(env)[3].querySelectorAll("input")[0];
if (document.activeElement !== nk) return "the new row's key is not focused";
key(nk, "Enter"); await wait();
if (document.activeElement !== rows(env)[3].querySelectorAll("input")[1]) return "Enter in a key does not move to its value";
if (Object.keys(posted()).length !== 3) return "an empty key is posted";
type(nk, "CACHE"); type(rows(env)[3].querySelectorAll("input")[1], "on"); await wait();
if (posted().CACHE !== "on") return "the new pair is not posted";
// remove
const x = rows(env)[0].querySelector("button");
if (x.getAttribute("aria-label") !== "Remove PORT") return `remove button: ${x.getAttribute("aria-label")}`;
x.click(); await wait();
if ("PORT" in posted() || rows(env).length !== 3) return "removing did not take the row away";
if (document.activeElement !== rows(env)[0].querySelector("input")) return "after removing, the focus is not on the next row";
// max
const add = env.querySelector(".ui-kv-add");
for (let i = 0; i < 6; i++) { add.click(); await wait(60); }
if (rows(env).length !== 8 || !add.disabled) return `max=8: ${rows(env).length} rows, add disabled: ${add.disabled}`;
// on_change
const hk = rows(hdr)[1].querySelectorAll("input")[0];
type(hk, "X-Trace"); await wait();
const note = hdr.closest(".demo-stack").querySelector(".demo-note").textContent;
if (note !== "2 headers: Accept, X-Trace") return `on_change: ${note}`;
// fields format
if (!lab.querySelector(".ui-kv-empty")) return "an empty editor does not say so";
lab.querySelector(".ui-kv-add").click(); await wait();
const [lk, lv] = rows(lab)[0].querySelectorAll("input");
type(lk, "team"); type(lv, "web"); await wait();
const f = lab.querySelector('input[type=hidden][name="labels[team]"]');
if (!f || f.value !== "web") return "format=fields does not post name[key]";
