#!/usr/bin/env bash
set -euo pipefail

MARKER_START="# eypassiai local dev mapping start"
MARKER_END="# eypassiai local dev mapping end"
HOSTS_LINE="127.0.0.1 app.eypassiai.com"

if grep -q "$MARKER_START" /etc/hosts; then
  echo "Local eypassiai domain mapping already exists."
else
  {
    echo ""
    echo "$MARKER_START"
    echo "$HOSTS_LINE"
    echo "$MARKER_END"
  } | sudo tee -a /etc/hosts >/dev/null
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder 2>/dev/null || true
  echo "Added local eypassiai domain mapping."
fi

echo "Open local app: http://app.eypassiai.com:5173"
echo "Public privacy policy remains: https://eypassiai.com/privacy.html"
echo "Public terms remain: https://eypassiai.com/terms.html"
