#!/usr/bin/env bash
# Matikan filter: DNS mengarah ke 10.10.2.66, iptables tidak drop.
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

rts_require_lab
rts_exec dns sh /lab/scripts/dns-set-filter.sh off
rts_exec gw sh /lab/scripts/fw-set-filter.sh off
printf '\nFilter OFF.\n'
printf '  DNS  : %s -> %s\n' "${RTS_PHISH_NAME}" "${RTS_PHISH_IP}"
printf '  FW   : traffic ke %s diizinkan\n' "${RTS_PHISH_IP}"
