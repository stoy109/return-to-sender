#!/usr/bin/env bash
# Cadangan kalau "Start capture" di GNS3 bermasalah: tcpdump di dalam node -> Wireshark.
#   ./scripts/capture-fallback.sh            # gw eth0 (sisi LAN)
#   ./scripts/capture-fallback.sh gw eth1    # sisi DMZ
#   ./scripts/capture-fallback.sh victim eth0
set -euo pipefail
source "$(dirname "$0")/common.sh"
node=${1:-gw}; ifc=${2:-eth0}
command -v wireshark >/dev/null || rts_die "wireshark nggak ada"
echo "Capture $node:$ifc -> Wireshark (Ctrl+C buat berhenti)"
rts_podman exec "$(rts_cname "$node")" tcpdump -U -nni "$ifc" -w - | wireshark -k -i -
