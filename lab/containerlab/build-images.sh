#!/usr/bin/env bash
# Pull public images and build the tiny local dnsmasq image (rootful Podman).
set -euo pipefail
# shellcheck source=scripts/common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/common.sh"

echo "Runtime: ${RTS_RUNTIME} (rootful via sudo)"
echo "Kalau pull gagal dan Cloudflare WARP lagi nyala, pause WARP dulu, ulang perintah ini."

sudo "${RTS_RUNTIME}" pull docker.io/nicolaka/netshoot:latest
sudo "${RTS_RUNTIME}" pull docker.io/library/nginx:alpine
sudo "${RTS_RUNTIME}" pull docker.io/library/alpine:3.22

sudo "${RTS_RUNTIME}" build \
  -t localhost/rts-dns:latest \
  -t rts-dns:latest \
  -f "${RTS_LAB_DIR}/images/dns/Dockerfile" \
  "${RTS_LAB_DIR}/images/dns"

echo
sudo "${RTS_RUNTIME}" images --format 'table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}' \
  | grep -E 'REPOSITORY|netshoot|nginx|alpine|rts-dns' || sudo "${RTS_RUNTIME}" images

echo
echo "Siap deploy:"
echo "  sudo containerlab deploy --runtime ${RTS_RUNTIME} -t ${RTS_TOPO}"
