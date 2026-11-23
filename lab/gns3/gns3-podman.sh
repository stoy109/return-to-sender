#!/usr/bin/env bash
# Opsional: buka GNS3 dengan CONTAINER_HOST di-set, supaya "Auxiliary console" GNS3
# (yang manggil `docker exec`, butuh paket podman-docker) nyambung ke podman ROOT lewat socket.
# Tutup GNS3 dulu sepenuhnya sebelum pakai ini (server lokal ikut ke-restart).
export CONTAINER_HOST=unix:///var/run/docker.sock
exec gns3 "$@"
