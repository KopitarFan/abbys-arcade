# Portable Kids Arcade Architecture

## Supported targets

The application is designed for 64-bit Linux, macOS, and Windows. Linux remains the preferred appliance deployment, but the interface and catalog must not depend on Linux-specific paths, commands, or package formats.

## Application boundary

```text
Renderer UI
  └── typed, narrow Arcade API
        ├── Mock adapter (container/browser development)
        ├── Linux adapter
        ├── macOS adapter
        └── Windows adapter
```

The renderer never executes commands, chooses emulator binaries, or accesses arbitrary filesystem paths. It asks the Arcade API to perform explicit operations such as:

- `listGames()`
- `launchGame(gameId)`
- `stopGame()`
- `getControllers()`
- `installApprovedGame(packageId)`
- `startSpeechCapture()`
- `createProject(spec)`

Platform adapters translate those operations into OS-specific behavior.

## Technology baseline

- **Interface:** TypeScript, React, and Vite
- **Desktop shell:** Electron for Linux, macOS, and Windows
- **Container:** Node-based development container for the renderer, tests, linting, and mock services
- **Catalog:** versioned JSON schema initially; SQLite may be introduced when local state warrants it
- **Testing:** browser component tests plus an Electron integration-test layer
- **Game input:** browser gamepad events in the renderer, with a platform adapter for device status and mappings when required

Electron is intentionally accepted despite its larger footprint because it provides one consistent Chromium runtime across all three target operating systems. The intended T480 has enough memory for it. A future native shell can replace Electron without rewriting the renderer or domain model.

## Development modes

### Container/browser mode

This is the everyday interface-development loop. It runs on the current Mac and provides:

- Fake games and artwork
- Simulated installs and progress
- Simulated controller connect/disconnect events
- Keyboard equivalents for all gamepad actions
- Simulated speech transcripts
- Simulated game creation and error states

It does not launch real host emulators or validate OS kiosk behavior.

### Native Electron mode

This tests the desktop boundary on the current host:

- Full-screen behavior
- Real gamepad input exposed by Chromium
- Microphone permission flow
- Safe IPC between the renderer and main process
- Launching allowlisted test executables

### Platform integration mode

This runs on each intended operating system, physically or in a VM:

- Linux VM and eventual Linux appliance
- Native macOS build on an available Mac
- Windows VM or machine only if Windows becomes a supported deployment target

Packaging must happen for each target platform/architecture. We do not assume a Linux container can produce and validate every final desktop package.

## Security boundary

- Electron renderer sandboxing and context isolation remain enabled.
- Node integration is disabled in the renderer.
- The preload bridge exposes individual validated operations, never raw IPC or shell execution.
- Game manifests contain identifiers and declarative options, never executable command strings.
- Only the platform adapter maps an approved emulator identifier to a configured executable.
- Remote catalog content is treated as untrusted until schema, signature/checksum, archive, size, and path validation succeeds.
- Child, save, project, secret, and game-content data live outside the application installation directory.

## Portability rules

- Use logical directory names through the Arcade API; never hard-code `/home`, drive letters, or macOS bundle paths in UI code.
- Store controller actions semantically (`confirm`, `back`, `menu`) rather than by physical button label.
- Render PlayStation, Xbox, or generic button hints from the active controller profile.
- Keep emulator configuration in platform-specific adapter packages.
- Treat microphone and speech engines as providers with local and remote implementations.
- Treat the game-creation agent as a provider; the UI must work with a deterministic mock.
- Ensure every controller action has a keyboard and mouse equivalent.

## Theme boundary

The renderer uses semantic CSS custom properties for palette, surfaces, focus, and decorative identity. The default `abby` theme supplies the pink/purple magical-music direction, while layout, behavior, accessibility, and the Arcade API remain theme-independent. Future themes should add a token stylesheet and optional decorative component rather than branching screen logic.
# Game storage

Game files are stored outside the application source and installation. Electron creates
the library beneath its operating-system-specific user-data directory:

```text
game-library/
├── games/
│   └── <game-id>/
│       ├── content/   Original game files
│       ├── config/    Emulator configuration and controller maps
│       ├── saves/     Writable saves and snapshots
│       └── media/     Cover art, screenshots, and video
├── firmware/          Parent-supplied shared firmware
├── imports/           Parent-controlled incoming packages
├── cache/             Rebuildable generated data
└── logs/              Emulator and launch diagnostics
```

`ABBYS_ARCADE_DATA_DIR` overrides the root for portable installations or external
drives. Catalog metadata never supplies executable paths or command-line arguments.

## Versioned game manifests

Every installed game has a `game.json` manifest beside its storage folders. Version 1
contains child-facing metadata, a DOSBox-X adapter identifier, a simple DOS start
filename, constrained emulator settings, source provenance, favorites, and play
history. Electron validates manifests before discovery or launch.

Version 1 currently supports four adapter profiles:

- DOSBox-X with top-level `.BAT`, `.EXE`, or `.COM` entry files;
- FS-UAE with Amiga `.adf` floppy images and parent-supplied Kickstart firmware;
- Mupen64Plus with `.z64`, `.n64`, or `.v64` cartridge images;
- Dolphin with GameCube `.iso`, `.gcm`, or `.rvz` disc images and isolated user data.

Security invariants:

- game IDs contain only lowercase letters, numbers, and hyphens;
- start files are top-level `.BAT`, `.EXE`, or `.COM` filenames, never paths;
- the start file must exist inside the game’s own `content/` folder;
- manifests select an adapter, never a host executable or raw arguments;
- DOS machine and CPU settings come from enums and bounded numeric values;
- imports selected through the native folder picker use short-lived opaque tokens;
- imports reject symbolic links, traversal, excessive nesting, and oversized trees;
- content is copied to a staging directory and atomically promoted after validation;
- manifest changes preserve `game.json.backup`;
- launches and imports append structured events to `logs/launches.jsonl`.
