import { describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getGameLibraryPaths } from './gameLibrary';
import { approveImport, auditGameLibrary, inspectImportFolder, readManifest, validateEntry, validateGameId, validateManifest, writeManifest } from './manifestLibrary';

const validManifest = {
  schemaVersion: 1,
  id: 'friendly-game',
  title: 'Friendly Game',
  platform: 'dos',
  description: 'A friendly DOS game.',
  inputs: ['keyboard'],
  presentation: { accent: 'violet', icon: 'rocket' },
  launch: {
    adapter: 'dosbox-x',
    entry: 'START.BAT',
    settings: { fullscreen: true, cycles: 'auto', machine: 'svga_s3' },
  },
  state: { favorite: false, playCount: 0 },
  source: { label: 'Parent import', importedAt: '2026-01-01T00:00:00.000Z' },
};

describe('game manifest security', () => {
  it('accepts a versioned DOS manifest', () => {
    expect(validateManifest(validManifest)).toMatchObject({ id: 'friendly-game', launch: { entry: 'START.BAT' } });
  });

  it('rejects traversal, shell syntax, paths, and unsupported start files', () => {
    for (const entry of ['../START.BAT', '/tmp/START.BAT', 'START.BAT & whoami', 'START.SH', 'folder/START.EXE']) {
      expect(() => validateEntry(entry)).toThrow();
    }
    expect(() => validateGameId('../outside')).toThrow();
  });

  it('does not allow manifests to select a host executable or raw arguments', () => {
    expect(() => validateManifest({
      ...validManifest,
      launch: { ...validManifest.launch, adapter: '/bin/sh', args: ['-c', 'whoami'] },
    })).toThrow(/launch adapter/i);
  });

  it('rejects unsafe emulator settings and future schema versions', () => {
    expect(() => validateManifest({
      ...validManifest,
      launch: { ...validManifest.launch, settings: { ...validManifest.launch.settings, cycles: 'auto; whoami' } },
    })).toThrow(/cycles/i);
    expect(() => validateManifest({ ...validManifest, schemaVersion: 999 })).toThrow(/version/i);
  });

  it('accepts constrained Amiga and N64 manifests', () => {
    expect(validateManifest({
      ...validManifest,
      id: 'amiga-game',
      platform: 'amiga',
      launch: { adapter: 'fs-uae', entry: 'Disk 1.adf', settings: { fullscreen: true, amigaModel: 'A500' } },
    }).launch.adapter).toBe('fs-uae');
    expect(validateManifest({
      ...validManifest,
      id: 'n64-game',
      platform: 'n64',
      launch: { adapter: 'mupen64plus', entry: 'Game.z64', settings: { fullscreen: true, videoPlugin: 'glide64mk2' } },
    }).launch.adapter).toBe('mupen64plus');
  });

  it('accepts constrained GameCube manifests and media', () => {
    expect(validateManifest({
      ...validManifest,
      id: 'gamecube-game',
      platform: 'gamecube',
      launch: { adapter: 'dolphin', entry: 'Adventure.rvz', settings: { fullscreen: true, videoBackend: 'Metal' } },
    }).launch.adapter).toBe('dolphin');
    expect(validateEntry('Adventure.rvz', 'gamecube')).toBe('Adventure.rvz');
    expect(validateEntry("Disney's Party (USA).rvz", 'gamecube')).toBe("Disney's Party (USA).rvz");
    expect(() => validateEntry('../Adventure.iso', 'gamecube')).toThrow();
  });

  it('accepts the additional cartridge and home-computer formats', () => {
    const systems = [
      ['nes-game', 'nes', 'nestopia', 'Adventure.nes'],
      ['snes-game', 'snes', 'snes9x', 'Adventure.sfc'],
      ['atari-game', 'atari2600', 'stella', 'Adventure.a26'],
      ['genesis-game', 'genesis', 'ares', 'Adventure.gen'],
      ['c64-game', 'c64', 'vice-x64sc', 'Adventure.d64'],
      ['apple2-game', 'apple2', 'mame-apple2e', 'Adventure.woz'],
      ['apple2gs-game', 'apple2gs', 'mame-apple2gs', 'Adventure.2mg'],
    ] as const;
    for (const [id, platform, adapter, entry] of systems) {
      expect(validateManifest({
        ...validManifest,
        id,
        platform,
        launch: { adapter, entry, settings: { fullscreen: true } },
      })).toMatchObject({ platform, launch: { adapter, entry } });
      expect(validateEntry(entry, platform)).toBe(entry);
    }
  });

  it('rejects platform mismatches and unsupported media', () => {
    expect(() => validateManifest({
      ...validManifest,
      platform: 'amiga',
      launch: { adapter: 'mupen64plus', entry: 'Game.z64', settings: { fullscreen: true, amigaModel: 'A500' } },
    })).toThrow(/adapter/i);
    expect(() => validateEntry('Game.zip', 'n64')).toThrow();
    expect(() => validateEntry('../Disk.adf', 'amiga')).toThrow();
  });

  it('inspects and installs an approved folder into isolated game storage', async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'abbys-arcade-test-'));
    try {
      const source = path.join(temporary, 'Friendly Game');
      await mkdir(source);
      await writeFile(path.join(source, 'START.BAT'), '@echo off\\r\\nGAME.EXE\\r\\n');
      await writeFile(path.join(source, 'GAME.EXE'), 'test');
      const preview = await inspectImportFolder(source);
      expect(preview.entries).toContain('START.BAT');

      const library = getGameLibraryPaths(path.join(temporary, 'data'), '');
      const manifest = await approveImport(library, source, {
        token: 'test-token',
        id: 'friendly-game',
        title: 'Friendly Game',
        platform: 'dos',
        description: 'A friendly DOS game.',
        entry: 'START.BAT',
        inputs: ['keyboard'],
        accent: 'violet',
        icon: 'rocket',
        fullscreen: true,
        cycles: 'auto',
        machine: 'svga_s3',
        amigaModel: 'A500',
        videoPlugin: 'glide64mk2',
        videoBackend: 'Metal',
      });
      expect(manifest.id).toBe('friendly-game');
      expect((await readManifest(library, 'friendly-game')).launch.entry).toBe('START.BAT');
      expect(await readFile(path.join(library.games, 'friendly-game', 'content', 'GAME.EXE'), 'utf8')).toBe('test');
      expect(await auditGameLibrary(library)).toMatchObject({ installed: 1, valid: 1, issues: [] });
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it('rejects symbolic links and reports damaged installations', async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'abbys-arcade-test-'));
    try {
      const source = path.join(temporary, 'unsafe');
      await mkdir(source);
      await symlink('/tmp', path.join(source, 'outside'));
      await expect(inspectImportFolder(source)).rejects.toThrow(/symbolic links/i);

      const library = getGameLibraryPaths(path.join(temporary, 'data'), '');
      await mkdir(path.join(library.games, 'broken-game'), { recursive: true });
      expect((await auditGameLibrary(library)).issues[0]).toMatch(/broken-game/);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });

  it('backs up a valid manifest before changing settings', async () => {
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'abbys-arcade-test-'));
    try {
      const library = getGameLibraryPaths(path.join(temporary, 'data'), '');
      await mkdir(path.join(library.games, 'friendly-game', 'content'), { recursive: true });
      await writeFile(path.join(library.games, 'friendly-game', 'content', 'START.BAT'), '@echo off');
      const manifest = validateManifest(validManifest);
      await writeManifest(library, manifest, false);
      manifest.state.favorite = true;
      await writeManifest(library, manifest);
      const backup = JSON.parse(await readFile(path.join(library.games, 'friendly-game', 'game.json.backup'), 'utf8'));
      expect(backup.state.favorite).toBe(false);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
