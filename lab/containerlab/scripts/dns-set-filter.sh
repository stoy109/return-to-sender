#!/bin/sh
# Toggle the dnsmasq blocklist and restart dnsmasq. Usage: dns-set-filter.sh on|off
set -eu

mode=${1:-}
case "${mode}" in
  on)
    # Empty address => NXDOMAIN for the name and its subdomains.
    printf 'address=/jne-paket-tertunda.example/\n' > /tmp/rts-filter.conf
    ;;
  off)
    printf 'address=/jne-paket-tertunda.example/10.10.2.66\n' > /tmp/rts-filter.conf
    ;;
  *)
    echo "usage: $0 on|off" >&2
    exit 2
    ;;
esac

stop_dnsmasq() {
  if [ -f /tmp/dnsmasq.pid ]; then
    pid=$(cat /tmp/dnsmasq.pid)
    if [ -n "${pid}" ]; then
      kill "${pid}" 2>/dev/null || true
    fi
  fi
  # Fallback if the pid file is stale.
  if command -v pidof >/dev/null 2>&1; then
    pids=$(pidof dnsmasq || true)
    if [ -n "${pids}" ]; then
      # shellcheck disable=SC2086
      kill ${pids} 2>/dev/null || true
    fi
  fi
  i=0
  while command -v pidof >/dev/null 2>&1 && pidof dnsmasq >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -gt 20 ]; then
      break
    fi
    sleep 0.1
  done
  rm -f /tmp/dnsmasq.pid
}

stop_dnsmasq
dnsmasq --conf-file=/etc/dnsmasq.conf --pid-file=/tmp/dnsmasq.pid
echo "dns-set-filter: ${mode}"
