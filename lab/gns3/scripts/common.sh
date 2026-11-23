# shellcheck shell=bash
# Helper buat script host. Di-source, bukan dijalankan.
export RTS_PHISH_IP=10.10.2.66
export RTS_PHISH_NAME=jne-paket-tertunda.example
RTS_URL=${RTS_URL:-unix:///var/run/docker.sock}

rts_die(){ printf 'error: %s\n' "$*" >&2; exit 1; }

# Pakai podman remote lewat socket (tanpa sudo) kalau bisa; kalau nggak, sudo podman.
rts_podman(){
  if [[ -w /var/run/docker.sock ]]; then
    podman --url "$RTS_URL" "$@"
  else
    sudo podman "$@"
  fi
}

# GNS3 menamai container: GNS3.<nama-node>.<project-id>
rts_cname(){
  local n
  n=$(rts_podman ps --filter "name=^GNS3\.$1\." --format '{{.Names}}' | head -n1)
  [[ -n $n ]] || rts_die "node '$1' belum jalan. Di GNS3 klik Start (tombol play hijau) dulu."
  printf '%s' "$n"
}

rts_exec(){ local node=$1; shift; rts_podman exec "$(rts_cname "$node")" "$@"; }
rts_exec_it(){ local node=$1; shift; rts_podman exec -it "$(rts_cname "$node")" "$@"; }
