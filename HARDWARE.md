# ThinkPad T480 Hardware Baseline

Status: partial inventory; physical verification pending  
Source supplied by owner: Lenovo ThinkPad T480, 14-inch, 2017 listing/configuration

## Confirmed

| Component | Known value |
|---|---|
| Model | Lenovo ThinkPad T480 |
| Processor family | Intel Core i7, 8th-generation U-series |
| Memory | 16 GB |
| Storage | 256 GB SSD |
| Target architecture | `x86_64` / `amd64` |
| Current operating system | CachyOS |
| Preservation requirement | None; existing installation and data may be replaced |
| Current condition | Powers on |
| Available installation media | Erasable USB drive available |
| Available controllers | Sony PlayStation 4 / DualShock 4 controller(s) |

## Likely variants requiring verification

Lenovo offered this generation of T480 with either of these four-core/eight-thread CPUs:

- Intel Core i7-8550U, up to 4.0 GHz, 8 MB cache
- Intel Core i7-8650U, up to 4.2 GHz, 8 MB cache

The standard graphics device is Intel UHD Graphics 620. Some regional i7 models were also offered with an NVIDIA GeForce MX150 with 2 GB GDDR5. The actual machine must be queried rather than assuming either graphics configuration.

## Preliminary suitability

| Workload | Initial expectation | Must verify on hardware |
|---|---|---|
| Child launcher | Strong | Godot Compatibility renderer and full-screen focus |
| DOS emulation | Strong | Mouse capture, audio, and per-game mappings |
| Amiga emulation | Strong | PUAE/FS-UAE compatibility and controller mapping |
| N64 emulation | Generally viable | Per-game performance, renderer, thermals, and frame pacing |
| Offline speech recognition | Viable with a small/quantized model | Latency, microphone quality, and thermals |
| Godot 2D game creation | Strong | Editor/runtime compatibility and build latency |
| Large local coding model | Not recommended as the baseline | Prefer a remote agent or another household machine |

## Still needed

- Exact machine type/model code and serial-free product identifier
- Exact CPU model
- Integrated-only or optional NVIDIA GPU
- Display resolution and touch capability
- SSD interface and current free space
- Wi-Fi and Bluetooth chipset
- Exact CachyOS/kernel version
- BIOS/UEFI version
- Thunderbolt firmware/controller status
- Battery health for internal and removable batteries
- Microphone, speakers, webcam, ports, keyboard, TrackPoint, and touchpad condition

## Commands for a Linux live session

These are read-only inventory commands:

```sh
sudo dmidecode -s system-product-name
sudo dmidecode -s system-version
lscpu
free -h
lsblk -o NAME,SIZE,TYPE,FSTYPE,MODEL
lspci -nnk
lsusb
ip -brief link
rfkill list
uname -a
```

Graphics details:

```sh
glxinfo -B
vulkaninfo --summary
```

Battery and firmware details:

```sh
upower -e
upower -i /org/freedesktop/UPower/devices/battery_BAT0
upower -i /org/freedesktop/UPower/devices/battery_BAT1
fwupdmgr get-devices
fwupdmgr get-updates
```

The last command checks for updates but should not install them during the audit.

## Controller test baseline

Test the DualShock 4 over USB first, then Bluetooth. USB is the preferred first-release path because it removes pairing and battery state as failure modes. Record:

- Detection in `lsusb` and `/proc/bus/input/devices`
- D-pad, face buttons, shoulder buttons, analog sticks, Options, and Share
- Whether the touchpad is exposed as a mouse
- Whether unplug/reconnect works while the launcher is running
- Bluetooth pairing and reconnect behavior after a reboot
