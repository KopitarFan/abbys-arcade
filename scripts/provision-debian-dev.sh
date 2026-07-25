#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

if [[ ! -r /etc/os-release ]]; then
  echo "Cannot identify this operating system." >&2
  exit 1
fi

# shellcheck disable=SC1091
source /etc/os-release
if [[ ${ID:-} != "debian" || ${VERSION_CODENAME:-} != "trixie" ]]; then
  echo "Expected Debian 13 (trixie); found ${PRETTY_NAME:-unknown}." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  curl \
  git \
  libasound2t64 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0t64 \
  libnss3 \
  libxkbcommon0 \
  libxss1 \
  nodejs \
  npm \
  rsync \
  xdg-utils

# Debian 13 supplies Node 20. pnpm 11 currently expects the newer node:sqlite
# built-in, so keep the guest on the latest Node-20-compatible pnpm 10 release.
npm install --global pnpm@10.34.5

install -d -o parent -g parent -m 0750 /home/parent/abby-arcade
install -d -o arcade -g arcade -m 0750 /home/arcade/.local/share/abby-arcade
install -d -o abby -g abby -m 0750 /home/abby/Games /home/abby/Projects /home/abby/Saves

cat >/etc/profile.d/abby-arcade-development.sh <<'EOF'
export ABBY_ARCADE_ENV="development"
EOF
chmod 0644 /etc/profile.d/abby-arcade-development.sh

echo
echo "Debian development provisioning complete."
node --version
npm --version
pnpm --version
git --version
