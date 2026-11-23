#!/usr/bin/env bash
# Nyalain/matiin setting podman-root khusus GNS3 (netns=none, no_hosts).
#   sudo ./host/gns3-mode.sh on|off|status
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "jalanin pakai sudo" >&2; exit 1; }
ROOT_CONF=/etc/containers/containers.rootful.conf.d/50-rts-gns3.conf
case "${1:-status}" in
  on)  mkdir -p "$(dirname "$ROOT_CONF")"
       printf '[containers]\nnetns = "none"\nno_hosts = true\n' > "$ROOT_CONF" ;;
  off) rm -f "$ROOT_CONF" ;;
  status) ;;
  *) echo "usage: $0 on|off|status" >&2; exit 2 ;;
esac
if [[ $1 != status ]]; then
  systemctl stop podman.service 2>/dev/null || true
  systemctl restart podman.socket
  chmod 0755 /run/podman
fi
if [[ -f $ROOT_CONF ]]; then echo "GNS3 mode: ON"; cat "$ROOT_CONF"; else echo "GNS3 mode: OFF"; fi
