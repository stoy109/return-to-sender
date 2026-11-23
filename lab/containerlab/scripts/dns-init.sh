#!/bin/sh
# Address the DNS node on the LAN and start dnsmasq with the filter OFF
# (jne-paket-tertunda.example -> 10.10.2.66).
set -eu

wait_iface() {
  name=$1
  i=0
  while ! ip link show "${name}" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -gt 30 ]; then
      echo "dns-init: ${name} tidak muncul" >&2
      exit 1
    fi
    sleep 1
  done
}

wait_iface eth1
ip addr replace 10.10.1.53/24 dev eth1
ip link set dev eth1 up
ip route replace default via 10.10.1.1 || true

# Default: filter off so the first curl demo succeeds.
sh /lab/scripts/dns-set-filter.sh off

echo "dns-init: 10.10.1.53/24, dnsmasq jalan, filter OFF"
