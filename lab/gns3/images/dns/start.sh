#!/bin/sh
ip addr replace 10.10.1.53/24 dev eth0
ip link set dev eth0 up
ip route replace default via 10.10.1.1 || true
/lab/dns-set-filter.sh off
echo "dns: 10.10.1.53/24, dnsmasq jalan, filter OFF"
exec sleep infinity
