import path from 'node:path';
import type { GameManifest } from './manifestLibrary.js';

export interface PlatformTarget {
  executable: string;
  args: readonly string[];
  gameChrome?: boolean;
}

export function getPlatformTarget(
  gameId: unknown,
  platform = process.platform,
  gamesRoot = path.join(process.cwd(), 'game-library', 'games'),
  architecture = process.arch,
  manifest?: GameManifest,
  contentOverride?: string,
): PlatformTarget {
  if (typeof gameId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(gameId)) {
    throw new Error('Invalid game identifier.');
  }
  const prefix = platform === 'darwin' ? architecture === 'arm64' ? '/opt/homebrew/bin' : '/usr/local/bin' : '/usr/bin';
  const content = manifest ? contentOverride ?? path.join(gamesRoot, manifest.id, 'content') : '';
  const gameRoot = manifest ? path.join(gamesRoot, manifest.id) : '';
  const target = manifest && manifest.id === gameId ? Object.freeze(
    manifest.platform === 'dos' ? {
      executable: path.join(prefix, 'dosbox-x'),
      gameChrome: true,
      args: Object.freeze([
        '-fastlaunch',
        ...(manifest.launch.settings.fullscreen ? ['-fullscreen'] : []),
        '-nomenu', '-nogui', '-exit',
        '-set', `dosbox machine=${manifest.launch.settings.machine}`,
        '-set', `cpu cycles=${manifest.launch.settings.cycles}`,
        '-c', `mount d "${content}"`,
        '-c', 'd:',
        '-c', manifest.launch.entry,
      ]),
    } : manifest.platform === 'amiga' ? {
      executable: path.join(prefix, 'fs-uae'),
      gameChrome: true,
      args: Object.freeze([
        `--fullscreen=${manifest.launch.settings.fullscreen ? 1 : 0}`,
        `--amiga-model=${manifest.launch.settings.amigaModel}`,
        `--floppy-drive-0=${path.join(content, manifest.launch.entry)}`,
        `--kickstarts-dir=${path.join(path.dirname(gamesRoot), 'firmware', 'amiga')}`,
        `--save-states-dir=${path.join(gameRoot, 'saves')}`,
        `--screenshots-output-dir=${path.join(gameRoot, 'media')}`,
        '--kickstart-setup=0',
      ]),
    } : manifest.platform === 'n64' ? {
      executable: path.join(prefix, 'mupen64plus'),
      gameChrome: true,
      args: Object.freeze([
        manifest.launch.settings.fullscreen ? '--fullscreen' : '--windowed',
        '--nosaveoptions',
        '--configdir', path.join(gameRoot, 'config'),
        '--sshotdir', path.join(gameRoot, 'media'),
        '--gfx', `mupen64plus-video-${manifest.launch.settings.videoPlugin}`,
        '--set', `Core[SaveSRAMPath]=${path.join(gameRoot, 'saves')}`,
        '--set', `Core[SaveStatePath]=${path.join(gameRoot, 'saves')}`,
        path.join(content, manifest.launch.entry),
      ]),
    } : manifest.platform === 'gamecube' ? {
      executable: platform === 'darwin' ? '/Applications/Dolphin.app/Contents/MacOS/Dolphin' : '/usr/bin/dolphin-emu',
      gameChrome: true,
      args: Object.freeze([
        '--batch',
        '--user', path.join(gameRoot, 'config', 'dolphin-user'),
        '--video_backend', String(manifest.launch.settings.videoBackend),
        '--config', `Dolphin.Display.Fullscreen=${manifest.launch.settings.fullscreen ? 'True' : 'False'}`,
        '--exec', path.join(content, manifest.launch.entry),
      ]),
    } : manifest.platform === 'nes' ? {
      executable: path.join(prefix, 'nestopia'),
      gameChrome: true,
      args: Object.freeze([path.join(content, manifest.launch.entry)]),
    } : manifest.platform === 'snes' ? {
      executable: platform === 'darwin' ? '/Applications/Snes9x.app/Contents/MacOS/Snes9x' : '/usr/bin/snes9x',
      gameChrome: true,
      args: Object.freeze([path.join(content, manifest.launch.entry)]),
    } : manifest.platform === 'atari2600' ? {
      executable: path.join(prefix, 'stella'),
      gameChrome: true,
      args: Object.freeze([
        '-fullscreen', manifest.launch.settings.fullscreen ? '1' : '0',
        path.join(content, manifest.launch.entry),
      ]),
    } : manifest.platform === 'genesis' ? {
      executable: platform === 'darwin' ? '/Applications/ares.app/Contents/MacOS/ares' : '/usr/bin/ares',
      gameChrome: true,
      args: Object.freeze([
        ...(manifest.launch.settings.fullscreen ? ['--fullscreen'] : []),
        path.join(content, manifest.launch.entry),
      ]),
    } : manifest.platform === 'c64' ? {
      executable: path.join(prefix, 'x64sc'),
      gameChrome: true,
      args: Object.freeze([
        manifest.launch.settings.fullscreen ? '-fullscreen' : '+fullscreen',
        '-autostart', path.join(content, manifest.launch.entry),
      ]),
    } : manifest.platform === 'apple2' ? {
      executable: path.join(prefix, 'mame'),
      gameChrome: true,
      args: Object.freeze([
        'apple2e',
        '-skip_gameinfo',
        '-rompath', path.join(path.dirname(gamesRoot), 'firmware', 'apple2'),
        '-flop1', path.join(content, manifest.launch.entry),
        manifest.launch.settings.fullscreen ? '-nowindow' : '-window',
      ]),
    } : {
      executable: path.join(prefix, 'mame'),
      gameChrome: true,
      args: Object.freeze([
        'apple2gs',
        '-skip_gameinfo',
        '-rompath', path.join(path.dirname(gamesRoot), 'firmware', 'apple2'),
        ['.2mg', '.moof'].includes(path.extname(manifest.launch.entry).toLowerCase()) ? '-flop3' : '-flop1',
        path.join(content, manifest.launch.entry),
        manifest.launch.settings.fullscreen ? '-nowindow' : '-window',
      ]),
    },
  ) : undefined;

  if (platform === 'darwin') {
    const macTargets: Readonly<Record<string, PlatformTarget>> = Object.freeze({
      ...(target ? { [String(gameId)]: target } : {}),
      'platform-test': Object.freeze({
        executable: '/usr/bin/osascript',
        args: Object.freeze([
          '-e',
          'display dialog "Success! Abby’s Arcade safely launched an approved macOS program." with title "Abby’s Arcade Platform Test" buttons {"Back to the Arcade"} default button 1',
        ]),
      }),
    });
    const approvedTarget = macTargets[gameId];
    if (!approvedTarget) throw new Error('This game does not have an approved platform launcher yet.');
    return approvedTarget;
  }

  if (platform !== 'linux') throw new Error('This platform adapter is not available on this operating system yet.');

  const linuxTargets: Readonly<Record<string, PlatformTarget>> = Object.freeze({
    ...(target ? { [String(gameId)]: target } : {}),
    'platform-test': Object.freeze({
    executable: '/usr/bin/xmessage',
    args: Object.freeze([
      '-center',
      '-title',
      "Abby's Arcade Platform Test",
      '-buttons',
      'Back to the Arcade:0',
      "Success! Abby's Arcade safely launched an approved Linux program.",
    ]),
  }),
  });

  const approvedTarget = linuxTargets[gameId];
  if (!approvedTarget) throw new Error('This game does not have an approved platform launcher yet.');
  return approvedTarget;
}
