// Checks that no two files style the same CSS class at the start of a selector:
// every file in ui/ owns its classes, and two files claiming one (`.ui-cover` in
// cover.qwe and in cover_image.qwe) break each other on a page that shows both.
// A file may still style another's class inside its own (`.ui-sd > .ui-fab`).
//
//   node tests/classes.mjs          prints each clash; exits 1 if there is one
import { readFileSync, readdirSync } from "node:fs";

// Families whose files style each other's classes on purpose.
const FAMILIES = [["button", "button_group", "icon_button", "split_button", "toggle_button", "toolbar"]];
const together = (a, b) => FAMILIES.some((f) => f.includes(a) && f.includes(b));

const dir = new URL("../ui/", import.meta.url).pathname;
const owners = new Map();
for (const f of readdirSync(dir).filter((f) => f.endsWith(".qwe") && f !== "theme.qwe").sort()) {
    const slug = f.slice(0, -4), src = readFileSync(dir + f, "utf8");
    for (const [, block] of src.matchAll(/css`([\s\S]*?)`/g)) {
        const css = block.replace(/\/\*[\s\S]*?\*\//g, "");
        for (const [, sel] of css.matchAll(/([^{}]+)\{/g)) {
            if (sel.trim().startsWith("@")) continue;
            for (const part of sel.split(",")) {
                const m = part.match(/^\s*\.(ui-[a-z0-9-]+)/);
                if (!m) continue;
                if (!owners.has(m[1])) owners.set(m[1], new Set());
                owners.get(m[1]).add(slug);
            }
        }
    }
}
let clashes = 0;
for (const [cls, files] of owners) {
    const fs = [...files];
    const bad = fs.some((a) => fs.some((b) => a < b && !together(a, b)));
    if (bad) { clashes++; console.log(`classes: .${cls} is styled by ${fs.join(", ")}`); }
}
process.exit(clashes ? 1 : 0);
