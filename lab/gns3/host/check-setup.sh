#!/usr/bin/env bash
# shellcheck disable=SC2015
# Cek prasyarat GNS3 + Podman TANPA sudo. Jalanin: ./host/check-setup.sh
set -uo pipefail
SOCK=/var/run/docker.sock
ok(){ printf '  [OK]  %s\n' "$*"; }
bad(){ printf '  [!!]  %s\n' "$*"; FAIL=1; }
FAIL=0
api(){ curl -s --unix-socket "$SOCK" "$@"; }

echo "== grup"
id -nG | tr ' ' '\n' | grep -qx docker && ok "user $(id -un) ada di grup docker" || bad "belum di grup docker (sudah logout/login?)"

echo "== socket $SOCK"
if v=$(api http://d/version 2>/dev/null) && [[ $v == *ApiVersion* ]]; then
  ok "API bisa diakses: $(printf '%s' "$v" | python3 -c 'import json,sys;d=json.load(sys.stdin);print(d.get("Version"),"ApiVersion",d.get("ApiVersion"),"Min",d.get("MinAPIVersion"))')"
else
  bad "nggak bisa akses $SOCK (ls -l: $(ls -lL $SOCK 2>&1))"
fi

echo "== image lab (di storage podman ROOT)"
for n in victim gw sw dns phish; do
  code=$(api -o /dev/null -w '%{http_code}' "http://d/images/localhost/rts-${n}:latest/json")
  [[ $code == 200 ]] && ok "localhost/rts-${n}:latest" || bad "localhost/rts-${n}:latest belum ada (./build-images.sh)"
done

echo "== podman root ngikutin NetworkDisabled? (bikin container test sebentar)"
if [[ $FAIL -eq 0 ]]; then
  api -X DELETE "http://d/containers/rts-netcheck?force=1" >/dev/null 2>&1
  api -H 'Content-Type: application/json' -X POST "http://d/containers/create?name=rts-netcheck" \
    -d '{"Image":"localhost/rts-sw:latest","NetworkDisabled":true,"Entrypoint":[],"Cmd":["sh","-c","ls /sys/class/net; echo HOSTS:; cat /etc/hosts 2>/dev/null | head -3"]}' >/dev/null
  api -X POST http://d/containers/rts-netcheck/start >/dev/null
  api -X POST "http://d/containers/rts-netcheck/wait" >/dev/null
  out=$(api "http://d/containers/rts-netcheck/logs?stdout=1&stderr=1" | tr -cd '[:print:]\n')
  api -X DELETE "http://d/containers/rts-netcheck?force=1" >/dev/null
  if printf '%s' "$out" | grep -q eth0; then
    bad "container test masih dapat eth0 -> mode GNS3 belum aktif (sudo ./host/gns3-mode.sh on)"
  else
    ok "container test cuma punya: $(printf '%s' "$out" | sed -n '1,/HOSTS:/p' | grep -v HOSTS | tr '\n' ' ')"
  fi
else
  echo "  (dilewati, beresin yang [!!] dulu)"
fi

echo "== uBridge"
UB=$(command -v ubridge || true)
if [[ -n $UB ]] && getcap "$UB" | grep -q cap_net_admin; then ok "$(getcap "$UB")"; else bad "ubridge belum punya cap_net_admin (sudo setcap cap_net_admin,cap_net_raw=ep $(command -v ubridge))"; fi

echo "== busybox static (wajib buat GNS3 Docker node)"
BB=$(command -v busybox-static || command -v busybox.static || command -v busybox || true)
if [[ -z $BB ]]; then bad "busybox belum ada (sudo dnf install busybox)";
elif ldd "$BB" >/dev/null 2>&1; then bad "$BB dynamic-linked; GNS3 butuh yang static";
else ok "$BB static"; fi

echo "== wireshark"
command -v wireshark >/dev/null && ok "$(command -v wireshark)" || bad "wireshark nggak ketemu"

echo
[[ $FAIL -eq 0 ]] && echo "Semua aman. Buka project di GNS3." || echo "Masih ada [!!], lihat README bagian Troubleshooting."
exit $FAIL
