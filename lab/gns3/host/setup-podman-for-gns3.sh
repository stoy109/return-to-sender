#!/usr/bin/env bash
# Setup sekali jalan biar GNS3 2.2 (server jalan sebagai user kamu) bisa pakai Podman ROOTFUL
# lewat API kompatibel Docker di /var/run/docker.sock.
#   sudo ./host/setup-podman-for-gns3.sh            # pasang
#   sudo ./host/setup-podman-for-gns3.sh --undo     # bongkar lagi
# Peringatan: anggota grup "docker" = setara root di laptop ini. Oke buat laptop pribadi/lab.
set -euo pipefail

[[ $EUID -eq 0 ]] || { echo "jalanin pakai sudo" >&2; exit 1; }
USER_NAME=${SUDO_USER:?run this with sudo from your normal user}
SOCK_DROPIN=/etc/systemd/system/podman.socket.d/10-rts-gns3.conf
TMPFILES=/etc/tmpfiles.d/rts-gns3-docker-sock.conf
# Podman 6: drop-in khusus rootful (rootless nggak kena)
ROOT_CONF=/etc/containers/containers.rootful.conf.d/50-rts-gns3.conf

if [[ ${1:-} == "--undo" ]]; then
  rm -f "$SOCK_DROPIN" "$TMPFILES" "$ROOT_CONF"
  chmod 0700 /run/podman 2>/dev/null || true
  systemctl daemon-reload
  systemctl stop podman.service 2>/dev/null || true
  systemctl restart podman.socket
  echo "Undo selesai (grup docker dan paket nggak dihapus)."
  exit 0
fi

echo "== 1) paket: busybox (static, dipakai GNS3 di dalam container)"
rpm -q busybox >/dev/null || dnf install -y busybox

echo "== 2) grup docker + user ${USER_NAME}"
groupadd -f docker
usermod -aG docker "$USER_NAME"

echo "== 3) socket API Podman rootful bisa diakses grup docker"
mkdir -p "$(dirname "$SOCK_DROPIN")"
cat > "$SOCK_DROPIN" <<'CONF'
[Socket]
SocketMode=0660
SocketGroup=docker
DirectoryMode=0755
# tmpfiles podman bikin /run/podman 0700 (D! /run/podman 0700) -> user nggak bisa lewat.
ExecStartPost=/usr/bin/chmod 0755 /run/podman
CONF

echo "== 4) /var/run/docker.sock -> /run/podman/podman.sock (path yang di-hardcode GNS3)"
if [[ -S /run/docker.sock && ! -L /run/docker.sock ]]; then
  echo "!! /run/docker.sock sudah socket beneran (Docker terpasang?). Berhenti biar nggak bentrok." >&2
  exit 1
fi
if [[ -L /run/docker.sock ]]; then
  echo "   sudah ada (dari paket podman-docker): $(readlink /run/docker.sock)"
else
  echo 'L+ /run/docker.sock - - - - /run/podman/podman.sock' > "$TMPFILES"
  systemd-tmpfiles --create "$TMPFILES"
fi

echo "== 5) mode GNS3 untuk podman ROOT: tanpa network default + tanpa /etc/hosts bawaan"
# Podman mengabaikan NetworkDisabled dari API Docker, jadi tanpa ini container dapat eth0 sendiri
# dan uBridge GNS3 gagal memindahkan eth0 (nama bentrok). Lihat GNS3/gns3-server#1811.
# Cuma berlaku buat podman root (bukan rootless). containerlab tetap aman (dia set network sendiri),
# tapi kalau mau balik normal: sudo ./host/gns3-mode.sh off
mkdir -p "$(dirname "$ROOT_CONF")"
cat > "$ROOT_CONF" <<'CONF'
[containers]
netns = "none"
no_hosts = true
CONF

echo "== 6) restart socket"
systemctl daemon-reload
systemctl enable podman.socket
systemctl stop podman.service 2>/dev/null || true
systemctl restart podman.socket
chmod 0755 /run/podman
ls -l /run/podman/podman.sock

echo "== 7) uBridge capabilities"
UB=$(command -v ubridge || true)
if [[ -n "$UB" ]]; then
  if ! getcap "$UB" | grep -q cap_net_admin; then
    setcap cap_net_admin,cap_net_raw=ep "$UB"
  fi
  getcap "$UB"
else
  echo "!! ubridge nggak ketemu: sudo dnf install ubridge" >&2
fi

echo
echo "Beres. LOGOUT lalu LOGIN lagi (biar grup docker aktif), terus cek: ./host/check-setup.sh"
