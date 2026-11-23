#!/usr/bin/env bash
# Demo: curl dari victim sukses saat filter OFF, gagal saat ON.
# Tips: start capture di link victim<->sw-lan dan gw<->phish dulu sebelum jalanin ini.
set -euo pipefail
source "$(dirname "$0")/common.sh"
section(){ printf '\n======== %s ========\n' "$1"; }
show(){ printf '\n$ %s\n' "$*"; }
v(){ rts_exec victim "$@"; }

section "1) Filter OFF"
bash "$(dirname "$0")/filter-off.sh"
show ping -c 2 -W 2 10.10.1.1; v ping -c 2 -W 2 10.10.1.1
show dig "$RTS_PHISH_NAME" @10.10.1.53; v dig +time=2 +tries=1 +noall +answer +comments "$RTS_PHISH_NAME" @10.10.1.53 || true
show curl -sS -m 5 -D - "http://$RTS_PHISH_NAME/"
if v curl -sS -m 5 -D - "http://$RTS_PHISH_NAME/"; then echo; echo "OK: halaman DEMO kebuka (filter OFF)."; else rts_die "harusnya berhasil saat OFF, cek ./scripts/status.sh"; fi

section "2) Filter ON"
bash "$(dirname "$0")/filter-on.sh"
show dig "$RTS_PHISH_NAME" @10.10.1.53; v dig +time=2 +tries=1 +noall +answer +comments "$RTS_PHISH_NAME" @10.10.1.53 || true
show curl -sS -m 5 "http://$RTS_PHISH_NAME/"
if v curl -sS -m 5 "http://$RTS_PHISH_NAME/"; then rts_die "harusnya GAGAL (DNS block)"; else echo "OK: by name gagal (NXDOMAIN)."; fi
show curl -sS -m 5 "http://$RTS_PHISH_IP/"
if v curl -sS -m 5 "http://$RTS_PHISH_IP/"; then rts_die "harusnya GAGAL (iptables DROP)"; else echo "OK: by IP juga gagal (DROP di gw)."; fi

section "Selesai"
echo "Balikin normal: ./scripts/filter-off.sh"
