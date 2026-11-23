#!/bin/sh
# Address the victim client and point DNS at the lab resolver.
set -eu

wait_iface() {
  name=$1
  i=0
  while ! ip link show "${name}" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -gt 30 ]; then
      echo "victim-init: ${name} tidak muncul" >&2
      exit 1
    fi
    sleep 1
  done
}

wait_iface eth1
ip addr replace 10.10.1.10/24 dev eth1
ip link set dev eth1 up
ip route replace default via 10.10.1.1

# Runtime may also have written this from the topology dns.servers knob.
printf 'nameserver 10.10.1.53\noptions ndots:0\n' > /etc/resolv.conf

echo "victim-init: 10.10.1.10/24 via 10.10.1.1, DNS 10.10.1.53"
