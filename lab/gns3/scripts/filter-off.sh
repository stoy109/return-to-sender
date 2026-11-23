#!/usr/bin/env bash
# Filter OFF: DNS -> 10.10.2.66, firewall izinkan
set -euo pipefail
source "$(dirname "$0")/common.sh"
rts_exec dns /lab/dns-set-filter.sh off
rts_exec gw /lab/fw-set-filter.sh off
printf '\nFilter OFF. DNS: %s -> %s | FW: allow\n' "$RTS_PHISH_NAME" "$RTS_PHISH_IP"
