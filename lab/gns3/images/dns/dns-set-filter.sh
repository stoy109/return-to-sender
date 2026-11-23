#!/bin/sh
# Usage: dns-set-filter.sh on|off
set -eu
case "${1:-}" in
  on)  printf 'address=/jne-paket-tertunda.example/\n' > /tmp/rts-filter.conf ;;
  off) printf 'address=/jne-paket-tertunda.example/10.10.2.66\n' > /tmp/rts-filter.conf ;;
  *)   echo "usage: $0 on|off" >&2; exit 2 ;;
esac
if [ -f /tmp/dnsmasq.pid ]; then kill "$(cat /tmp/dnsmasq.pid)" 2>/dev/null || true; fi
pkill dnsmasq 2>/dev/null || true
i=0; while pgrep dnsmasq >/dev/null 2>&1 && [ $i -lt 20 ]; do i=$((i+1)); sleep 0.1; done
rm -f /tmp/dnsmasq.pid
dnsmasq --conf-file=/etc/dnsmasq.conf --pid-file=/tmp/dnsmasq.pid
echo "dns-set-filter: $1"
