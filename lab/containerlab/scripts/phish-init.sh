#!/bin/sh
# Address the fake phishing web server on the DMZ segment.
set -eu

wait_iface() {
  name=$1
  i=0
  while ! ip link show "${name}" >/dev/null 2>&1; do
    i=$((i + 1))
    if [ "${i}" -gt 30 ]; then
      echo "phish-init: ${name} tidak muncul" >&2
      exit 1
    fi
    sleep 1
  done
}

wait_iface eth1
ip addr replace 10.10.2.66/24 dev eth1
ip link set dev eth1 up
ip route replace default via 10.10.2.1

echo "phish-init: 10.10.2.66/24 via 10.10.2.1"
