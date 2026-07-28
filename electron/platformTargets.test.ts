import { describe, expect, it } from 'vitest';
import type { GameManifest } from './manifestLibrary';
import { getPlatformTarget } from './platformTargets';

const jillManifest: GameManifest = {
  schemaVersion: 1,
  id: 'jill-of-the-jungle',
  title: 'Jill of the Jungle',
  platform: 'dos',
  description: 'A DOS adventure.',
  inputs: ['keyboard'],
  presentation: { accent: 'mint', icon: 'gem' },
  launch: { adapter: 'dosbox-x', entry: 'JILL.BAT', settings: { fullscreen: true, cycles: 'auto', machine: 'svga_s3' } },
  state: { favorite: true, playCount: 0 },
  source: { label: 'Test', importedAt: '2026-01-01T00:00:00.000Z' },
};
const amigaManifest: GameManifest = {
  ...jillManifest,
  id: 'amiga-demo',
  title: 'Amiga Demo',
  platform: 'amiga',
  launch: { adapter: 'fs-uae', entry: 'Disk 1.adf', settings: { fullscreen: true, amigaModel: 'A500' } },
};
const n64Manifest: GameManifest = {
  ...jillManifest,
  id: 'n64-demo',
  title: 'N64 Demo',
  platform: 'n64',
  launch: { adapter: 'mupen64plus', entry: 'Demo.z64', settings: { fullscreen: true, videoPlugin: 'glide64mk2' } },
};
const gamecubeManifest: GameManifest = {
  ...jillManifest,
  id: 'gamecube-demo',
  title: 'GameCube Demo',
  platform: 'gamecube',
  launch: { adapter: 'dolphin', entry: 'Demo.rvz', settings: { fullscreen: true, videoBackend: 'Metal' } },
};
const additionalManifests: GameManifest[] = [
  { ...jillManifest, id: 'nes-demo', platform: 'nes', launch: { adapter: 'nestopia', entry: 'Demo.nes', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'snes-demo', platform: 'snes', launch: { adapter: 'snes9x', entry: 'Demo.sfc', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'atari-demo', platform: 'atari2600', launch: { adapter: 'stella', entry: 'Demo.a26', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'genesis-demo', platform: 'genesis', launch: { adapter: 'ares', entry: 'Demo.gen', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'c64-demo', platform: 'c64', launch: { adapter: 'vice-x64sc', entry: 'Demo.d64', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'apple2-demo', platform: 'apple2', launch: { adapter: 'mame-apple2e', entry: 'Demo.woz', settings: { fullscreen: true } } },
  { ...jillManifest, id: 'apple2gs-demo', platform: 'apple2gs', launch: { adapter: 'mame-apple2gs', entry: 'Demo.2mg', settings: { fullscreen: true } } },
];

describe('platform launch allowlist', () => {
  it('builds Jill commands from the application root, never catalog data', () => {
    expect(getPlatformTarget('jill-of-the-jungle', 'linux', '/var/lib/abby/games', 'x64', jillManifest)).toMatchObject({
      executable: '/usr/bin/dosbox-x',
      args: expect.arrayContaining(['mount d "/var/lib/abby/games/jill-of-the-jungle/content"', 'JILL.BAT']),
    });
  });

  it('uses the native Homebrew executable on Apple Silicon Macs', () => {
    expect(getPlatformTarget('jill-of-the-jungle', 'darwin', '/Users/abby/Library/games', 'arm64', jillManifest)).toMatchObject({
      executable: '/opt/homebrew/bin/dosbox-x',
      args: expect.arrayContaining(['mount d "/Users/abby/Library/games/jill-of-the-jungle/content"', 'JILL.BAT']),
    });
  });

  it('builds fixed FS-UAE arguments with managed firmware and saves', () => {
    expect(getPlatformTarget('amiga-demo', 'darwin', '/Library/Arcade/games', 'arm64', amigaManifest)).toMatchObject({
      executable: '/opt/homebrew/bin/fs-uae',
      args: expect.arrayContaining([
        '--amiga-model=A500',
        '--floppy-drive-0=/Library/Arcade/games/amiga-demo/content/Disk 1.adf',
        '--kickstarts-dir=/Library/Arcade/firmware/amiga',
      ]),
    });
  });

  it('builds fixed Mupen64Plus arguments with isolated config and saves', () => {
    expect(getPlatformTarget('n64-demo', 'linux', '/var/lib/arcade/games', 'x64', n64Manifest)).toMatchObject({
      executable: '/usr/bin/mupen64plus',
      args: expect.arrayContaining([
        '--configdir',
        '/var/lib/arcade/games/n64-demo/config',
        '/var/lib/arcade/games/n64-demo/content/Demo.z64',
      ]),
    });
  });

  it('builds a fixed Dolphin batch launch with an isolated user folder', () => {
    expect(getPlatformTarget('gamecube-demo', 'darwin', '/Library/Arcade/games', 'arm64', gamecubeManifest)).toMatchObject({
      executable: '/Applications/Dolphin.app/Contents/MacOS/Dolphin',
      args: expect.arrayContaining([
        '--batch',
        '--user',
        '/Library/Arcade/games/gamecube-demo/config/dolphin-user',
        '--exec',
        '/Library/Arcade/games/gamecube-demo/content/Demo.rvz',
      ]),
    });
  });

  it('builds approved launch targets for the additional systems', () => {
    const targets = additionalManifests.map((manifest) => getPlatformTarget(
      manifest.id, 'darwin', '/Library/Arcade/games', 'arm64', manifest,
    ));
    expect(targets.map((target) => target.executable)).toEqual([
      '/opt/homebrew/bin/nestopia',
      '/Applications/Snes9x.app/Contents/MacOS/Snes9x',
      '/opt/homebrew/bin/stella',
      '/Applications/ares.app/Contents/MacOS/ares',
      '/opt/homebrew/bin/x64sc',
      '/opt/homebrew/bin/mame',
      '/opt/homebrew/bin/mame',
    ]);
    expect(targets.map((target) => target.args.at(-1))).toEqual([
      '/Library/Arcade/games/nes-demo/content/Demo.nes',
      '/Library/Arcade/games/snes-demo/content/Demo.sfc',
      '/Library/Arcade/games/atari-demo/content/Demo.a26',
      '/Library/Arcade/games/genesis-demo/content/Demo.gen',
      '/Library/Arcade/games/c64-demo/content/Demo.d64',
      '-nowindow',
      '-nowindow',
    ]);
    expect(targets.at(-2)?.args).toEqual(expect.arrayContaining([
      'apple2e', '-rompath', '/Library/Arcade/firmware/apple2',
      '-flop1', '/Library/Arcade/games/apple2-demo/content/Demo.woz',
    ]));
    expect(targets.at(-1)?.args).toEqual(expect.arrayContaining([
      'apple2gs', '-rompath', '/Library/Arcade/firmware/apple2',
      '-flop3', '/Library/Arcade/games/apple2gs-demo/content/Demo.2mg',
    ]));
  });

  it('does not allow catalog ids, executable paths, or arguments', () => {
    expect(() => getPlatformTarget('mario-64', 'linux', '/opt/abby-arcade')).toThrow(/approved platform launcher/);
    expect(() => getPlatformTarget('/usr/bin/xterm', 'linux', '/opt/abby-arcade')).toThrow(/invalid game identifier/i);
    expect(() => getPlatformTarget('platform-test --help', 'linux', '/opt/abby-arcade')).toThrow(/invalid game identifier/i);
  });

  it('reports unsupported platforms cleanly', () => {
    expect(() => getPlatformTarget('platform-test', 'win32', '/opt/abby-arcade')).toThrow(/not available/);
  });
});
