#!/usr/bin/env bash
# Read-only check of the Apache hardening for npg-ui-ai.
# Run it BEFORE and AFTER applying npg-ui-ai-hardening.conf and compare.
#
# Usage:
#   ./verify-apache-hardening.sh https://npg.example.com
#   ./verify-apache-hardening.sh https://npg.example.com /npg-ui-ai /npg-ui
#   INSECURE=1 ./verify-apache-hardening.sh https://10.0.0.5     # self-signed certificate
#
# Args: 1) base URL   2) new app path (default /npg-ui-ai)   3) other app path to confirm it is untouched (optional)

BASE="${1:?usage: $0 <base-url> [app-path] [other-app-path]}"
BASE="${BASE%/}"
APP="${2:-/npg-ui-ai}"
OTHER="${3:-}"
K=""; [ -n "$INSECURE" ] && K="-k"

pass=0; fail=0
ok()  { echo "  PASS  $1"; pass=$((pass+1)); }
bad() { echo "  FAIL  $1"; fail=$((fail+1)); }

HDR="$(curl -sI $K --max-time 20 "$BASE$APP/")"
if [ -z "$HDR" ]; then echo "No response from $BASE$APP/"; exit 2; fi
echo "Checking $BASE$APP/"

echo "$HDR" | head -1 | grep -q " 200" && ok "app answers 200" || bad "app did not answer 200"

srv="$(echo "$HDR" | grep -i '^Server:' | tr -d '\r')"
if echo "$srv" | grep -Eq '[0-9]+\.[0-9]+|Red Hat|Ubuntu|Debian|OpenSSL'; then bad "Server header exposes version/OS: $srv"; else ok "Server header does not expose version ($srv)"; fi

echo "$HDR" | grep -qi '^X-Content-Type-Options: *nosniff' && ok "X-Content-Type-Options: nosniff" || bad "X-Content-Type-Options missing"
echo "$HDR" | grep -qi '^X-Frame-Options: *\(DENY\|SAMEORIGIN\)' && ok "X-Frame-Options present" || bad "X-Frame-Options missing"
echo "$HDR" | grep -qi "^Content-Security-Policy:.*frame-ancestors" && ok "CSP frame-ancestors present" || bad "CSP frame-ancestors missing"

code="$(curl -s $K -o /dev/null -w '%{http_code}' -X TRACE --max-time 20 "$BASE$APP/")"
case "$code" in 405|403|501) ok "TRACE blocked ($code)";; *) bad "TRACE answered $code (expected 405/403)";; esac

for d in assets flows; do
  body="$(curl -s $K --max-time 20 "$BASE$APP/$d/")"
  code="$(curl -s $K -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$APP/$d/")"
  if echo "$body" | grep -q 'Index of'; then bad "directory listing is ON for $APP/$d/"; else ok "no directory listing for $APP/$d/ ($code)"; fi
done

# Refresh (F5) on a deep link must return the app, not 404 (logout reloads the current URL)
dl="$APP/view-processes"
code="$(curl -s $K -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$dl")"
[ "$code" = "200" ] && ok "refresh on deep link $dl returns 200" || bad "refresh on deep link $dl returned $code (expected 200; SPA fallback missing)"

if [ -n "$OTHER" ]; then
  code="$(curl -s $K -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$OTHER/")"
  [ "$code" = "200" ] && ok "other app $OTHER/ still answers 200" || bad "other app $OTHER/ answered $code"
fi

echo; echo "Result: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
