#!/usr/bin/env bash
# Ringkasan singkat node, IP, dan status filter.
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

rts_require_lab

echo "== container =="
sudo "${RTS_RUNTIME}" ps --filter "name=${RTS_PREFIX}-" \
  --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

echo
echo "== alamat (eth1/br-lan/eth3) =="
for node in victim dns gw phish; do
  echo "--- ${node} ---"
  rts_exec "${node}" sh -c 'ip -br addr show | grep -v "^lo\|^eth0"' || true
done

echo
echo "== filter DNS (/tmp/rts-filter.conf) =="
rts_exec dns sh -c 'cat /tmp/rts-filter.conf 2>/dev/null || echo "(belum ada)"'

echo
echo "== filter firewall (iptables FORWARD) =="
rts_exec gw sh -c 'iptables -S FORWARD'
