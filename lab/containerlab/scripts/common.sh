# shellcheck shell=bash
# Shared helpers for host-side lab scripts. Sourced, not executed.

RTS_LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RTS_TOPO="${RTS_LAB_DIR}/rts-lab.clab.yml"
RTS_LAB_NAME="rts-lab"
RTS_PREFIX="clab-rts-lab"
RTS_RUNTIME="${CLAB_RUNTIME:-podman}"
RTS_PHISH_IP="10.10.2.66"
RTS_PHISH_NAME="jne-paket-tertunda.example"
# Exported so sourced scripts and nested bash can reuse them.
export RTS_LAB_DIR RTS_TOPO RTS_LAB_NAME RTS_PREFIX RTS_RUNTIME RTS_PHISH_IP RTS_PHISH_NAME

rts_die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

rts_clab() {
  sudo containerlab --runtime "${RTS_RUNTIME}" "$@"
}

rts_exec() {
  local node=$1
  shift
  sudo "${RTS_RUNTIME}" exec "${RTS_PREFIX}-${node}" "$@"
}

rts_running() {
  local node=$1
  local state
  state="$(sudo "${RTS_RUNTIME}" inspect -f '{{.State.Running}}' "${RTS_PREFIX}-${node}" 2>/dev/null || true)"
  [[ "${state}" == "true" ]]
}

rts_require_lab() {
  local node
  for node in victim gw dns phish; do
    if ! rts_running "${node}"; then
      rts_die "node ${node} belum jalan. Deploy dulu: sudo containerlab deploy --runtime ${RTS_RUNTIME} -t ${RTS_TOPO}"
    fi
  done
}
