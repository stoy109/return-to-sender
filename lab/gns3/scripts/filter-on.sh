#!/usr/bin/env bash
# Filter ON: DNS NXDOMAIN + iptables DROP ke 10.10.2.66
set -euo pipefail
source "$(dirname "$0")/common.sh"
rts_exec dns /lab/dns-set-filter.sh on
rts_exec gw /lab/fw-set-filter.sh on
printf '\nFilter ON.  DNS: %s -> NXDOMAIN | FW: DROP ke %s\n' "$RTS_PHISH_NAME" "$RTS_PHISH_IP"
