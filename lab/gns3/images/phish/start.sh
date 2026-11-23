#!/bin/sh
ip addr replace 10.10.2.66/24 dev eth0
ip link set dev eth0 up
ip route replace default via 10.10.2.1
echo "phish: 10.10.2.66/24 via 10.10.2.1, nginx jalan"
exec nginx -g 'daemon off;'
