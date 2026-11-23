#!/bin/sh
# Semua ethX (dari GNS3) dimasukin ke br0 -> jadi switch biasa.
ip link add name br0 type bridge stp_state 0 forward_delay 0 2>/dev/null || true
for dev in $(sed -n 's/^ *\(eth[0-9]*\):.*/\1/p' /proc/net/dev); do
  ip addr flush dev "$dev" 2>/dev/null || true
  ip link set dev "$dev" master br0
  ip link set dev "$dev" up
done
ip link set dev br0 up
echo "sw-lan: br0 = $(ls /sys/class/net/br0/brif | tr '\n' ' ')"
exec sleep infinity
