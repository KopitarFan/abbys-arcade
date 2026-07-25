#!/usr/bin/env bash
set -u

REPORT_PATH="${1:-t480-hardware-report.txt}"

run_section() {
    local title="$1"
    shift
    {
        printf '\n## %s\n\n' "$title"
        "$@" 2>&1 || printf '[Command unavailable or returned an error]\n'
    } >> "$REPORT_PATH"
}

{
    printf '# ThinkPad T480 hardware report\n'
    printf 'Generated: %s\n' "$(date --iso-8601=seconds 2>/dev/null || date)"
    printf 'Note: review the report before sharing; serial numbers are intentionally excluded.\n'
} > "$REPORT_PATH"

run_section "Operating system" sh -c 'cat /etc/os-release; printf "Kernel: "; uname -r; printf "Architecture: "; uname -m'
run_section "CPU" lscpu
run_section "Memory" free -h
run_section "Storage" lsblk -e 7 -o NAME,SIZE,TYPE,FSTYPE,MODEL,TRAN,MOUNTPOINTS
run_section "PCI devices and drivers" lspci -nnk
run_section "USB devices" lsusb
run_section "Network interfaces" ip -brief link
run_section "Radio devices" rfkill list
run_section "Input devices" sh -c 'sed -n "/^N: Name=/,/^$/p" /proc/bus/input/devices'
run_section "OpenGL" sh -c 'command -v glxinfo >/dev/null && glxinfo -B || echo "glxinfo not installed"'
run_section "Vulkan" sh -c 'command -v vulkaninfo >/dev/null && vulkaninfo --summary || echo "vulkaninfo not installed"'
run_section "Power devices" sh -c 'command -v upower >/dev/null && { upower -e; for device in $(upower -e | grep battery); do upower -i "$device"; done; } || echo "upower not installed"'
run_section "Firmware devices" sh -c 'command -v fwupdmgr >/dev/null && fwupdmgr get-devices || echo "fwupdmgr not installed"'
run_section "Audio devices" sh -c 'command -v wpctl >/dev/null && wpctl status || { command -v pactl >/dev/null && pactl info; } || echo "wpctl and pactl not installed"'

printf 'Report written to %s\n' "$REPORT_PATH"
