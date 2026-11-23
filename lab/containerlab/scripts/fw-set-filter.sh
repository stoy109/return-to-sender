#!/bin/sh
# Toggle the gateway iptables drop for the fake phishing server.
# Usage: fw-set-filter.sh on|off
set -eu

mode=${1:-}

rule_exists() {
  iptables -C FORWARD -d 10.10.2.66/32 -j DROP >/dev/null 2>&1
}

case "${mode}" in
  on)
    if ! rule_exists; then
      iptables -I FORWARD 1 -d 10.10.2.66/32 -j DROP
    fi
    ;;
  off)
    while rule_exists; do
      iptables -D FORWARD -d 10.10.2.66/32 -j DROP
    done
    ;;
  *)
    echo "usage: $0 on|off" >&2
    exit 2
    ;;
esac

echo "fw-set-filter: ${mode}"
iptables -S FORWARD
