#!/usr/bin/env bash
# OPSIONAL: compile VPCS (PC mini GNS3) dari source resmi. Nggak dibutuhin lab ini.
#   sudo dnf install gcc make git    (sekali)
#   ./vpcs/build-vpcs.sh
set -euo pipefail
SRC=${HOME}/src/vpcs
[[ -d $SRC ]] || git clone https://github.com/GNS3/vpcs.git "$SRC"
cd "$SRC/src"
./mk.sh
mkdir -p "$HOME/.local/bin"
cp vpcs "$HOME/.local/bin/vpcs"
"$HOME/.local/bin/vpcs" -v | head -n 3 || true
echo "Isi di GNS3: Edit -> Preferences -> VPCS -> path: $HOME/.local/bin/vpcs"
