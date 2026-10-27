#!/bin/sh
# Makes the two files put together from the others:
#
#   quillo-ui.qwe   every component in one file (theme.qwe first), and `ui_css`,
#                   all their styles: the file to download for the whole kit
#   demos.qwe       the gallery's examples (demos/_demo.qwe first)
#
# and stops if two files declare the same name, since `use` puts every file in
# one scope and the last would win. With --check, it only says whether the
# files are up to date.
set -eu
cd "$(dirname "$0")/.."

dupes=$(grep -hoE '^(let|fn|view|component|type|server fn) [A-Za-z_][A-Za-z0-9_]*' ui/*.qwe demos/*.qwe \
    | awk '{print $NF}' | sort | uniq -d)
if [ -n "$dupes" ]; then
    echo "build: declared in more than one file:" $dupes >&2
    exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
ui_files="ui/theme.qwe $(ls ui/*.qwe | grep -v '^ui/theme.qwe$')"
{
    echo "// Quillo UI: every component in one file. Made by scripts/build.sh from ui/;"
    echo "// edit those, not this. https://quillolang.org/components/"
    echo "//"
    echo "//   use \"quillo-ui.qwe\"     then   <head><style>{ui_css}</style></head>"
    for f in $ui_files; do
        echo
        echo "// ---- $f ----------------------------------------------------------------"
        echo
        cat "$f"
    done
    echo
    printf 'let ui_css = '
    first=1
    for f in $ui_files; do
        for v in $(grep -oE '^let [a-z_]+_css = css`' "$f" | awk '{print $2}'); do
            [ $first = 1 ] || printf ' +\n    '
            printf '%s' "$v"
            first=0
        done
    done
    echo
} > "$tmp/quillo-ui.qwe"
demo_files="demos/_demo.qwe $(ls demos/*.qwe | grep -v '^demos/_demo.qwe$')"
{
    echo "// The gallery's examples, in one file. Made by scripts/build.sh from demos/."
    for f in $demo_files; do
        echo
        echo "// ---- $f ----------------------------------------------------------------"
        echo
        cat "$f"
    done
} > "$tmp/demos.qwe"

if [ "${1:-}" = "--check" ]; then
    cmp -s "$tmp/quillo-ui.qwe" quillo-ui.qwe && cmp -s "$tmp/demos.qwe" demos.qwe \
        || { echo "build: quillo-ui.qwe or demos.qwe is out of date: run scripts/build.sh" >&2; exit 1; }
    exit 0
fi
cp "$tmp/quillo-ui.qwe" "$tmp/demos.qwe" .
echo "quillo-ui.qwe: $(ls ui/*.qwe | grep -vc theme.qwe) components; demos.qwe: $(ls demos/*.qwe | grep -vc _demo.qwe) demos"
