#!/bin/sh
# Usage: fw-set-filter.sh on|off  -> DROP semua yang di-forward ke 10.10.2.66
set -eu
rule_exists() { iptables -C FORWARD -d 10.10.2.66/32 -j DROP >/dev/null 2>&1; }
case "${1:-}" in
  on)  rule_exists || iptables -I FORWARD 1 -d 10.10.2.66/32 -j DROP ;;
  off) while rule_exists; do iptables -D FORWARD -d 10.10.2.66/32 -j DROP; done ;;
  *)   echo "usage: $0 on|off" >&2; exit 2 ;;
esac
echo "fw-set-filter: $1"
iptables -S FORWARD
