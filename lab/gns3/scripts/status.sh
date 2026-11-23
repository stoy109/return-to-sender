#!/usr/bin/env bash
# Ringkasan node, IP, dan status filter.
set -euo pipefail
source "$(dirname "$0")/common.sh"
rts_podman ps --filter 'name=^GNS3\.' --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'
for n in victim dns sw-lan gw phish; do
  echo "--- $n ---"; rts_exec "$n" sh -c 'ip -br addr show | grep -v "^lo"' || true
done
echo "--- filter DNS ---"; rts_exec dns cat /tmp/rts-filter.conf || true
echo "--- firewall gw ---"; rts_exec gw iptables -S FORWARD || true
