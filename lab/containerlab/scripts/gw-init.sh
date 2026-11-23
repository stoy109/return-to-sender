#!/bin/sh
# Configure the gateway: bridge the LAN NICs, address both sides, enable forwarding.
set -eu

wait_iface() {
  name=$1
  i=0
  while ! ip link show "${name}" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -gt 30 ]; then
      echo "gw-init: ${name} tidak muncul" >&2
      exit 1
    fi
    sleep 1
  done
}

wait_iface eth1
wait_iface eth2
wait_iface eth3

if ! ip link show br-lan >/dev/null 2>&1; then
  ip link add name br-lan type bridge
fi

ip addr flush dev eth1 || true
ip addr flush dev eth2 || true

ip link set dev eth1 master br-lan
ip link set dev eth2 master br-lan
ip link set dev eth1 up
ip link set dev eth2 up
ip link set dev br-lan up
ip addr replace 10.10.1.1/24 dev br-lan

ip addr replace 10.10.2.1/24 dev eth3
ip link set dev eth3 up

sysctl -w net.ipv4.ip_forward=1 >/dev/null

# Fresh start: allow forwarding, no phish block yet (filter off).
iptables -P FORWARD ACCEPT
# Remove leftover block rules if this script is re-run.
while iptables -C FORWARD -d 10.10.2.66/32 -j DROP >/dev/null 2>&1; do
  iptables -D FORWARD -d 10.10.2.66/32 -j DROP
done

echo "gw-init: br-lan 10.10.1.1/24, eth3 10.10.2.1/24, ip_forward=1, filter OFF"
