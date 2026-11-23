#!/usr/bin/env bash
# Nyalakan filter: DNS NXDOMAIN + iptables DROP ke 10.10.2.66
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

rts_require_lab
rts_exec dns sh /lab/scripts/dns-set-filter.sh on
rts_exec gw sh /lab/scripts/fw-set-filter.sh on
printf '\nFilter ON.\n'
printf '  DNS  : %s -> NXDOMAIN\n' "${RTS_PHISH_NAME}"
printf '  FW   : FORWARD DROP ke %s\n' "${RTS_PHISH_IP}"
