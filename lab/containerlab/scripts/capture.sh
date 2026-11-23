#!/usr/bin/env bash
# Capture lab traffic to Wireshark or a pcapng file.
#
# Usage:
#   ./scripts/capture.sh                  # live di Wireshark (victim eth1 + gw eth3)
#   ./scripts/capture.sh --pcap out.pcapng
#   ./scripts/capture.sh --list
#   ./scripts/capture.sh --tcpdump        # fallback: ip netns exec + tcpdump
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

rts_require_lab

mode="wireshark"
outfile=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)
      mode="list"
      shift
      ;;
    --pcap)
      mode="pcap"
      outfile=${2:-}
      if [[ -z "${outfile}" ]]; then
        rts_die "pakai: $0 --pcap file.pcapng"
      fi
      shift 2
      ;;
    --tcpdump)
      mode="tcpdump"
      shift
      ;;
    -h|--help)
      sed -n '2,11p' "$0"
      exit 0
      ;;
    *)
      rts_die "argumen tidak dikenal: $1 (lihat $0 --help)"
      ;;
  esac
done

targets=(--target victim:eth1 --target gw:eth3)

case "${mode}" in
  list)
    rts_clab capture -t "${RTS_TOPO}" --list
    ;;
  pcap)
    mkdir -p "$(dirname "${outfile}")"
    echo "Menulis ${outfile} — Ctrl+C untuk berhenti."
    rts_clab capture -t "${RTS_TOPO}" "${targets[@]}" -w "${outfile}"
    ;;
  wireshark)
    if ! command -v wireshark >/dev/null 2>&1; then
      rts_die "wireshark tidak ada di PATH. Pakai: $0 --pcap captures/demo.pcapng"
    fi
    echo "Live capture victim:eth1 + gw:eth3 -> Wireshark. Ctrl+C untuk berhenti."
    echo "Di Wireshark bisa filter: dns or http or icmp"
    rts_clab capture -t "${RTS_TOPO}" "${targets[@]}" -w - | wireshark -k -i -
    ;;
  tcpdump)
    if ! command -v wireshark >/dev/null 2>&1; then
      rts_die "wireshark tidak ada di PATH"
    fi
    echo "Fallback tcpdump via netns clab-rts-lab-gw, iface eth3."
    echo "Kalau netns tidak ketemu, coba: sudo ip netns list"
    sudo ip netns exec "${RTS_PREFIX}-gw" tcpdump -U -nni eth3 -w - | wireshark -k -i -
    ;;
esac
