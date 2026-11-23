#!/bin/sh
ip addr replace 10.10.1.1/24 dev eth0
ip link set dev eth0 up
ip addr replace 10.10.2.1/24 dev eth1
ip link set dev eth1 up
sysctl -w net.ipv4.ip_forward=1 >/dev/null
iptables -P FORWARD ACCEPT
/lab/fw-set-filter.sh off >/dev/null
echo "gw: eth0 10.10.1.1/24 (LAN), eth1 10.10.2.1/24 (DMZ), ip_forward=1, filter OFF"
exec sleep infinity
