#!/usr/bin/env bash
# Build 5 image lab (rootful Podman, karena GNS3 pakai socket rootful).
# Jalanin dari folder ini:  ./build-images.sh   (minta password sudo)
set -euo pipefail
cd "$(dirname "$0")"
echo "Kalau pull/apk gagal dan Cloudflare WARP nyala, pause WARP dulu lalu ulangi."
for n in victim gw sw dns phish; do
  echo "== build localhost/rts-${n}:latest"
  # --network host: tetap bisa download walau containers.conf rootful di-set netns=none (mode GNS3).
  sudo podman build --network host -t "localhost/rts-${n}:latest" -f "images/${n}/Containerfile" "images/${n}"
done
echo
sudo podman images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | grep -E 'REPOSITORY|rts-' || true
echo
echo "Selesai. Cek dari sisi GNS3 (tanpa sudo): ./host/check-setup.sh"
