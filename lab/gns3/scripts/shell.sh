#!/usr/bin/env bash
# Buka shell di node (pengganti console GNS3, karena Podman nggak punya attach websocket).
#   ./scripts/shell.sh victim|dns|sw-lan|gw|phish
set -euo pipefail
source "$(dirname "$0")/common.sh"
[[ $# -ge 1 ]] || rts_die "pakai: $0 victim|dns|sw-lan|gw|phish"
node=$1; shift
if [[ $# -gt 0 ]]; then rts_exec_it "$node" "$@"; else rts_exec_it "$node" sh -c 'command -v bash >/dev/null && exec bash || exec sh'; fi
