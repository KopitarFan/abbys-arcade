# Abby's Arcade

A whimsical, controller-first retro game library designed for kids and families.
The project combines a sandboxed Electron interface with constrained native emulator
adapters, parent-controlled imports, isolated saves, and a universal return-to-arcade
overlay.

[Project website](https://kopitarfan.github.io/abbys-arcade/)

## Current platform adapters

- DOS — DOSBox-X
- Amiga — FS-UAE (`.adf`, parent-supplied Kickstart firmware)
- Nintendo 64 — Mupen64Plus (`.z64`, `.n64`, `.v64`)
- GameCube — Dolphin (`.iso`, `.gcm`, `.rvz`)
- NES — Nestopia UE (`.nes`)
- SNES — Snes9x (`.sfc`, `.smc`)
- Atari 2600 — Stella (`.a26`, `.bin`)
- Sega Genesis — ares (`.md`, `.gen`, `.bin`)
- Commodore 64 — VICE x64sc (`.d64`, `.t64`, `.prg`, `.crt`)
- Apple IIe — MAME (`.dsk`, `.do`, `.po`, `.nib`, `.woz`; parent-supplied `apple2e.zip` ROM set)
- Apple IIgs — MAME (`.dsk`, `.do`, `.po`, `.nib`, `.woz`, `.2mg`, `.moof`; parent-supplied ROM 03 `apple2gs.zip` set)

No games, ROMs, disc images, BIOS files, or firmware are included.

## Run locally

Requirements:

- Node.js 20 or newer
- pnpm 10
- Electron-compatible macOS or Linux desktop
- Only the emulators needed for the games being tested

```sh
pnpm install
pnpm dev:desktop
```

Renderer-only development is also available:

```sh
pnpm dev
```

The browser version uses deterministic mock data and cannot launch host emulators.

## Validate

```sh
pnpm test
pnpm lint:types
pnpm build
```

## Controls

- Arrow keys or controller D-pad: move focus
- Enter, Space, PlayStation Cross, or Xbox A: choose
- Escape, PlayStation Circle, or Xbox B: return to Play
- F12: reveal the in-game arcade menu
- Share + Options held for one second: reveal the arcade menu
- Mouse and trackpad remain fully supported

Parent Mode currently uses prototype PIN `2468`. It is a development convenience,
not a finished security boundary.

## Storage and safety

Game files live outside the repository in an operating-system-specific managed
library. Imports are selected through a native folder picker, validated, copied to a
staging directory, and atomically promoted after approval. Manifests select an
allowlisted adapter; they never provide host executables or shell arguments.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the storage layout and security
invariants.

## Project status

This is an early family project under active development. Packaging, persistent
controller profiles, appliance mode, and the agentic game maker remain on the
roadmap. A public-use license has not been selected yet.
