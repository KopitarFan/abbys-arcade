# Milestone 1 — T480 Audit Checklist

This milestone is read-only until the optional live-USB test. Nothing on the internal SSD needs to be preserved, but no disk changes are necessary yet.

## A. Collect the CachyOS baseline

- [ ] Copy `scripts/collect-hardware.sh` to the T480.
- [ ] Open a terminal on the T480.
- [ ] Run `chmod +x collect-hardware.sh`.
- [ ] Run `./collect-hardware.sh`.
- [ ] Return the generated `t480-hardware-report.txt` to this workspace.
- [ ] Review exact CPU, GPU, Wi-Fi, storage, firmware, kernel, audio, and battery results.

The script does not install packages or apply firmware updates. Sections may report that an optional command is unavailable.

## B. Basic device checks in CachyOS

- [ ] Internal display uses its native resolution.
- [ ] Brightness keys work.
- [ ] Keyboard, TrackPoint, touchpad, and physical buttons work.
- [ ] Speakers and headphone output work.
- [ ] Internal microphone records understandable speech.
- [ ] Wi-Fi connects and survives a reboot.
- [ ] Bluetooth can be enabled.
- [ ] Suspend/resume works with the lid.
- [ ] Both batteries are detected, if both are physically installed.
- [ ] All USB ports recognize a simple device.

## C. DualShock 4 controller checks

- [ ] Connect one controller with a known data-capable Micro-USB cable.
- [ ] Confirm Linux detects it.
- [ ] Test D-pad and all face buttons.
- [ ] Test analog sticks and triggers.
- [ ] Test Options, Share, and PS buttons.
- [ ] Unplug and reconnect it while the test application remains open.
- [ ] Pair over Bluetooth.
- [ ] Confirm Bluetooth reconnects after reboot.
- [ ] Repeat briefly with each controller intended for use.

USB functionality is required for the first prototype. Bluetooth is desirable but does not block development.

## D. Graphics and runtime checks

- [ ] Record OpenGL renderer and version.
- [ ] Record Vulkan device and version, if available.
- [ ] Confirm hardware acceleration is active rather than a software renderer such as `llvmpipe`.
- [ ] Record whether the machine has Intel UHD 620 only or also an NVIDIA MX150.
- [ ] Run a basic full-screen application and confirm clean resolution switching.

## E. Representative emulator checks

Use only games, demos, or homebrew that the owner may legally use.

- [ ] DOS: test one mouse-and-keyboard game.
- [ ] Amiga: test one joystick game.
- [ ] N64: test one representative 3D game.
- [ ] Record video smoothness, audio stability, controller behavior, and clean exit for each.
- [ ] Record whether the fan becomes unusually loud or performance degrades after 15 minutes.

Installing temporary emulator packages in CachyOS is optional. If we want a completely clean comparison, perform this section from the eventual Linux live environment instead.

## F. Decision gate

- [ ] Decide whether the existing CachyOS installation is useful for prototyping or whether to replace it with the selected baseline immediately after the audit.
- [ ] Select the production Linux distribution.
- [ ] Select the Godot version/renderer.
- [ ] Select initial N64, Amiga, and DOS emulator paths.
- [ ] Classify offline speech recognition as comfortable, acceptable, or remote-only.

Milestone 1 is complete when `HARDWARE.md` contains the verified configuration and the software choices are recorded in `DECISIONS.md`.
