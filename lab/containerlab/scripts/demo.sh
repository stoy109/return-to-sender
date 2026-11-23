#!/usr/bin/env bash
# Demo Layer 2: curl dari victim sukses saat filter off, gagal saat filter on.
set -euo pipefail
# shellcheck source=common.sh
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.sh"

rts_require_lab

# Make sure the victim still uses the lab resolver (some runtimes rewrite resolv.conf).
rts_exec victim sh -c "printf 'nameserver 10.10.1.53\noptions ndots:0\n' > /etc/resolv.conf"

section() {
  printf '\n======== %s ========\n' "$1"
}

show_cmd() {
  printf '\n$ %s\n' "$1"
}

# curl/dig from the victim; don't abort the demo on an expected failure.
victim() {
  rts_exec victim "$@"
}

section "1) Filter OFF — DNS mengarah ke server palsu, firewall izin"
bash "${RTS_LAB_DIR}/scripts/filter-off.sh"

show_cmd "ping -c 2 -W 2 10.10.1.1"
victim ping -c 2 -W 2 10.10.1.1

show_cmd "dig +time=2 +tries=2 +noall +answer +comments ${RTS_PHISH_NAME} @10.10.1.53"
victim dig +time=2 +tries=2 +noall +answer +comments "${RTS_PHISH_NAME}" @10.10.1.53 || true

show_cmd "curl -sS -m 5 -D - http://${RTS_PHISH_NAME}/"
if victim curl -sS -m 5 -D - "http://${RTS_PHISH_NAME}/"; then
  echo
  echo "OK: halaman DEMO muncul (filter off)."
else
  rts_die "curl seharusnya berhasil saat filter OFF. Cek ./scripts/status.sh"
fi

section "2) Filter ON — DNS NXDOMAIN + iptables DROP"
bash "${RTS_LAB_DIR}/scripts/filter-on.sh"

show_cmd "dig +time=2 +tries=2 +noall +answer +comments ${RTS_PHISH_NAME} @10.10.1.53"
victim dig +time=2 +tries=2 +noall +answer +comments "${RTS_PHISH_NAME}" @10.10.1.53 || true

show_cmd "curl -sS -m 5 http://${RTS_PHISH_NAME}/"
if victim curl -sS -m 5 "http://${RTS_PHISH_NAME}/"; then
  rts_die "curl by name seharusnya GAGAL saat filter ON"
else
  echo "OK: curl by name gagal (domain di-block DNS)."
fi

show_cmd "curl -sS -m 5 http://${RTS_PHISH_IP}/"
if victim curl -sS -m 5 "http://${RTS_PHISH_IP}/"; then
  rts_die "curl by IP seharusnya GAGAL (iptables DROP) saat filter ON"
else
  echo "OK: curl by IP juga gagal (iptables drop ke ${RTS_PHISH_IP})."
fi

section "Selesai"
echo "Capture Wireshark:  ./scripts/capture.sh"
echo "Matikan lab:        sudo containerlab destroy --runtime ${RTS_RUNTIME} -t ${RTS_TOPO} --cleanup"
