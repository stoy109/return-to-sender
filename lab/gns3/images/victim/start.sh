#!/bin/sh
# GNS3 menjalankan /gns3/init.sh dulu (nunggu eth0 dari ubridge), lalu script ini.
ip addr replace 10.10.1.10/24 dev eth0
ip link set dev eth0 up
ip route replace default via 10.10.1.1
printf 'nameserver 10.10.1.53\noptions ndots:0 timeout:2 attempts:1\n' > /etc/resolv.conf
echo "victim: 10.10.1.10/24 via 10.10.1.1, DNS 10.10.1.53"
exec sleep infinity
