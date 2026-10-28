#!/bin/sh
# Checks the kit: the made files are up to date, no two files style the same
# class (tests/classes.mjs), `quillo check` finds nothing wrong in the gallery, and every component works in headless Chrome
# (tests/browser.mjs runs tests/<slug>.js against the gallery).
#
#   scripts/test.sh [slug...]      QUILLO, CHROME and PORT can be set
set -eu
cd "$(dirname "$0")/.."
quillo=${QUILLO:-quillo}
chrome=${CHROME:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
port=${PORT:-8795}
cdp=$((port + 1))

scripts/build.sh --check
node tests/classes.mjs
"$quillo" check gallery.qwe

"$quillo" run gallery.qwe --port "$port" --log off &
server=$!
profile=$(mktemp -d)
"$chrome" --headless=new --remote-debugging-port="$cdp" --user-data-dir="$profile" --no-first-run about:blank >/dev/null 2>&1 &
browser=$!
trap 'kill $server $browser 2>/dev/null; sleep 0.5; rm -rf "$profile" 2>/dev/null || true' EXIT
i=0
until curl -sf -o /dev/null "http://127.0.0.1:$port/"; do
    i=$((i + 1)); [ $i -gt 50 ] && { echo "test: the gallery did not start" >&2; exit 1; }; sleep 0.2
done
node tests/browser.mjs "http://127.0.0.1:$port/" "$cdp" "$@"
