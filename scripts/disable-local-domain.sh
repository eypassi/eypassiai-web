#!/usr/bin/env bash
set -euo pipefail

MARKER_START="# eypassiai local dev mapping start"
MARKER_END="# eypassiai local dev mapping end"

sudo awk -v start="$MARKER_START" -v end="$MARKER_END" '
  $0 == start { skip = 1; next }
  $0 == end { skip = 0; next }
  skip != 1 { print }
' /etc/hosts | sudo tee /etc/hosts.tmp >/dev/null

sudo mv /etc/hosts.tmp /etc/hosts
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null || true
echo "Removed local eypassiai domain mapping."
