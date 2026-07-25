# Kids Arcade Development Plan

Status: planning  
Host: Apple M2 Mac (`arm64`)  
Target: Lenovo ThinkPad T480 (`x86_64`), 8th-generation Core i7 U-series, 16 GB RAM, 256 GB SSD

## Guiding decisions

- Build the launcher renderer with TypeScript, React, and Vite, wrapped in Electron for Linux, macOS, and Windows.
- Develop the interface in a container with mocked platform services; run the Electron shell natively when desktop integration is under test.
- Keep all hardware and operating-system behavior behind typed platform adapters.
- Maintain an `x86_64` Linux VM for Linux integration tests without making it the only supported runtime.
- Provision the VM and laptop from version-controlled scripts; do not treat the VM disk as the product.
- Keep copyrighted game files, firmware/BIOS files, credentials, API keys, recordings, and child data out of Git.
- Give the child account no administrator access. Downloads and installation must come from a parent-approved catalog.
- Test on the physical ThinkPad early. VM success does not establish GPU, audio, controller, suspend, or N64 performance.

## Step 0 — Things to prepare or install

### Required before development begins

1. **Free at least 50 GiB on the Mac; 70–100 GiB is preferable.**
   - Current free space at planning time: approximately 22 GiB.
   - Budget: 25–35 GiB VM disk, 5–10 GiB snapshots, 3–5 GiB ISO/tools, plus working space.

2. **Install UTM for macOS before Linux integration work.**
   - Download: <https://mac.getutm.app/>
   - We need its QEMU emulation mode because the M2 host is ARM and the ThinkPad is x86-64.
   - Do not create the VM until its exact configuration is recorded in this repository.

3. **Use the existing Docker, Node.js, and pnpm installations for interface development.**
   - Docker, Node.js, npm, and pnpm are already installed on this Mac.
   - The repository pins pnpm 10.34.5 so both the Node 20 Debian guest and newer development hosts use the same compatible package manager.
   - Project versions will be pinned inside the repository/container rather than depending on the host's Node version.
   - Godot is deferred until the game-creator milestone; it is not required for the launcher interface.

4. **Obtain a wired USB game controller.**
   - Prefer an Xbox-style controller with two analog sticks and USB input.
   - Wired input removes Bluetooth pairing from the first prototype.
   - Do not buy anything until the controllers already available in the household have been checked.

5. **Complete the ThinkPad hardware inventory.** The T480 model, processor family, RAM, and SSD capacity are now known.
   - Exact model/type number from the bottom label or BIOS.
   - Exact CPU, GPU, storage interface/free space, Wi-Fi chipset, current operating system, and whether its microphone works.
   - Record whether preserving any existing laptop data is required.

6. **Have one 16 GiB or larger USB drive available.**
   - It will be used for a Linux live boot and can be erased later.
   - Do not erase or write it until its device identity has been verified.

### Already installed on this Mac

- Git: `/usr/bin/git`
- Homebrew: `/opt/homebrew/bin/brew`
- Xcode and command-line developer tools
- Codex and this Git workspace

### Download later

- The selected `amd64` Linux installation ISO. Debian Stable with XFCE is the current baseline candidate; final selection depends on the ThinkPad.
- Emulator packages. These should be installed by platform provisioning, not manually preinstalled on the Mac.
- Godot and its export templates when the constrained game-creator milestone begins.
- `whisper.cpp` and a small English speech model. This belongs to the speech milestone, not initial setup.
- Any legal game content, Kickstart ROMs, console firmware, or commercial game data. These remain in a private content directory outside Git.

### Optional—not required to start

- USB microphone or headset if the ThinkPad microphone is poor.
- Second controller for multiplayer testing.
- External SSD for VM storage and backups.
- A GitHub remote. Local Git is sufficient for the first prototype.
- Cloud AI/API account. The first game-maker prototype can use a fake agent response and requires no credentials.

### Preflight verification

The interface-development preflight is:

```sh
git --version
brew --version
xcode-select -p
docker --version
node --version
pnpm --version
df -h .
```

Interface development is ready now. Linux VM work is ready when UTM is installed and adequate disk space is available. A controller is needed before real input validation, but not for initial UI construction.

## Milestone 1A — Portable interface vertical slice ✅

**Goal:** Build the child-facing interface immediately without choosing final hardware or operating system.

Steps:

1. Scaffold the containerized TypeScript/React/Vite workspace.
2. Define the typed Arcade API and a deterministic mock adapter.
3. Implement the Play home screen with controller-style focus navigation.
4. Implement Find Games, My Games, and Parent Mode routes.
5. Add fake catalog data, installation progress, failures, and empty states.
6. Add keyboard and mouse equivalents for every controller action.
7. Add responsive tests at laptop and narrow-window sizes.
8. Add the Electron shell with a sandboxed renderer and minimal validated preload bridge.

Exit criteria:

- One command launches the interface in container/browser mode.
- The complete prototype is usable with keyboard and mouse.
- Simulated controller input and platform-service states are testable.
- No renderer code imports Node.js or contains OS-specific commands or paths.

## Milestone 1B — Hardware audit and technical baseline

**Goal:** Know what the ThinkPad can realistically support before committing to OS and emulator choices.

Steps:

1. Capture the complete ThinkPad specifications and condition.
2. Back up anything that must be preserved.
3. Boot a Linux live USB without installing it.
4. Test display, keyboard, TrackPoint/trackpad, sound, microphone, wired networking, Wi-Fi, Bluetooth, suspend/resume, and controller recognition.
5. Run a basic graphics capability check and record OpenGL/Vulkan support.
6. Test one representative DOS, Amiga, and N64 title from legally available media.
7. Choose the Linux distribution and emulator/runtime baseline based on the results.

Exit criteria:

- Hardware inventory is committed without sensitive identifiers.
- Linux live boot works and critical devices are accounted for.
- We have a written N64 expectation: good, game-dependent, or out of scope.
- OS and engine versions are pinned for the prototype.

## Milestone 2 — Reproducible x86 Linux development VM

**Goal:** Produce a disposable VM that can be rebuilt from documented inputs.

Steps:

1. Download and checksum the selected `amd64` Linux ISO.
2. Create an emulated `x86_64` UTM VM with a 30–40 GiB dynamically allocated disk.
3. Install the OS and enable SSH for development only.
4. Create `parent` and unprivileged `arcade` accounts.
5. Add an idempotent provisioning script for packages, directories, users, and permissions.
6. Record VM settings and rebuild instructions.
7. Rebuild once from scratch to prove the documentation is complete.

Exit criteria:

- A clean VM can be provisioned by running one documented command.
- The arcade account cannot use `sudo` or modify the protected library.
- No game data or secrets exist in the VM template or Git repository.

## Milestone 3 — Native launcher integration

**Goal:** Boot into a usable controller-first interface with fake content.

Steps:

1. Package the existing renderer in Electron for the target operating system.
2. Connect real keyboard, mouse, and controller input.
3. Add the Play, Find Games, My Games, and Parent Mode screens.
4. Load entries from a small local JSON catalog rather than hard-coding them.
5. Implement launch, return-to-launcher, error, and missing-controller flows using test programs.
6. Add large text, clear focus indicators, readable labels, and optional spoken prompts.
7. Configure automatic login and launch into kiosk mode in the VM.

Exit criteria:

- Cold boot reaches the launcher without exposing the Linux desktop.
- Every child-facing action works with controller, keyboard, and mouse.
- Parent mode is protected and can exit safely to the desktop.
- A crashed test game returns to a usable launcher.

## Milestone 4 — Retro gaming vertical slice

**Goal:** Reliably play a small, parent-supplied library: two games per target platform.

Steps:

1. Provision RetroArch and the selected N64 core(s).
2. Provision PUAE or FS-UAE for Amiga.
3. Provision DOSBox Staging and evaluate DOSBox Pure for controller-oriented DOS titles.
4. Define a per-game manifest: platform, launch command, emulator/core, controls, artwork, and save paths.
5. Create per-game controller mappings without changing the global navigation convention.
6. Implement a reliable controller shortcut to pause/quit back to the launcher.
7. Separate protected content from writable saves and screenshots.
8. Repeat the vertical slice on the physical ThinkPad.

Exit criteria:

- Six selected games launch and exit consistently on the ThinkPad.
- Mouse-dependent games capture and release the pointer safely.
- Saves survive reboot and can be backed up.
- Controller instructions are visible before unusual games begin.

## Milestone 5 — Safe game catalog and installation

**Goal:** Let the child independently add approved games without general software-install privileges.

Steps:

1. Define signed or checksummed game-package and catalog formats.
2. Build a parent-side import/approval tool.
3. Build the child-facing Find Games screen with platform and input labels.
4. Implement an allowlisted installer service with narrowly scoped privileges.
5. Add disk-space, checksum, compatibility, and duplicate checks.
6. Add uninstall that preserves saves unless a parent explicitly removes them.
7. Add offline behavior and clear download/install errors.
8. Threat-model path traversal, arbitrary command execution, archive bombs, and catalog tampering.

Exit criteria:

- An approved package can be added and removed using only the controller.
- An unapproved or modified package is rejected.
- The child account cannot install arbitrary Linux packages or execute catalog-supplied commands.

## Milestone 6 — Speech-to-text

**Goal:** Add private, understandable push-to-talk input.

Steps:

1. Integrate `whisper.cpp` behind a local service boundary.
2. Benchmark Tiny English and a quantized Base English model on the ThinkPad.
3. Implement hold-to-talk, listening/transcribing states, editable transcript, cancel, and retry.
4. Keep recordings ephemeral by default.
5. Add keyboard entry as an equal fallback.
6. Test with the intended child in normal room noise; do not retain test recordings without parental intent.

Exit criteria:

- A spoken game idea can be transcribed and corrected without leaving the launcher.
- The UI clearly shows when the microphone is active.
- Speech can be disabled completely in Parent Mode.

## Milestone 7 — Constrained agentic game creator

**Goal:** Create and revise one kind of safe, small game through conversation.

Steps:

1. Choose one template genre, initially a simple 2D collect-and-explore game.
2. Define a schema for characters, goal, level, hazards, dialogue, controls, and visual theme.
3. Build a deterministic generator from that schema into a tested Godot template.
4. Start with stubbed agent output and schema validation.
5. Add the remote agent behind a parent-owned proxy; never place the API key in the child account or launcher.
6. Restrict generation to project data and approved assets; prohibit arbitrary shell commands, native extensions, and unrestricted file access.
7. Add build validation, time/resource limits, preview, rollback, autosave, and version history.
8. Add conversational revisions that modify the schema rather than unrestricted source code.

Exit criteria:

- A spoken or typed idea produces a playable small game.
- Invalid output fails safely with an understandable retry path.
- The agent cannot read private files, escape its project directory, install software, or access arbitrary network destinations.
- Earlier working versions can be restored.

## Milestone 8 — Laptop pilot and appliance hardening

**Goal:** Make the system dependable enough for unsupervised child use within household rules.

Steps:

1. Fresh-install and provision the ThinkPad from the same scripts used in the VM.
2. Tune graphics, audio, controller, Wi-Fi, power, lid, and suspend behavior.
3. Add atomic or recoverable application/configuration updates.
4. Add automatic save/project backups to parent-controlled storage.
5. Add storage limits, log rotation, and a simple support bundle.
6. Run reboot, forced-power-off, offline, full-disk, unplugged-controller, and crashed-game tests.
7. Conduct short supervised play sessions and simplify confusing flows.
8. Create a ThinkPad-specific recovery image after the pilot is stable.

Exit criteria:

- The system survives the failure tests without losing the launcher or existing saves.
- A parent can recover it using documented steps.
- Normal use does not require access to the Linux desktop.
- The child can play, add approved content, and create a template game with minimal help.

## First development session

Once Step 0 is complete:

1. Record the ThinkPad specifications.
2. Create the initial repository structure and ignore rules.
3. Scaffold the React launcher with the four top-level destinations and a mock Arcade API.
4. Add controller focus navigation and three fake catalog entries.
5. Run it natively on the Mac with the actual controller.
6. Add the native Electron shell after the browser interface is navigable.
7. Create the x86 VM when Linux platform integration is ready to begin.
