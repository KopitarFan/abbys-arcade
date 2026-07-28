import { constants } from 'node:fs';
import { access, copyFile, cp, mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { GameLibraryPaths } from './gameLibrary.js';
import { getGameStoragePaths } from './gameLibrary.js';

export const MANIFEST_VERSION = 1;
const gameIdPattern = /^[a-z0-9-]{1,80}$/;
const entryPatterns = {
  dos: /^[A-Za-z0-9][A-Za-z0-9_. -]{0,119}\.(bat|exe|com)$/i,
  amiga: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.adf$/i,
  n64: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(z64|n64|v64)$/i,
  gamecube: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(iso|gcm|rvz)$/i,
  nes: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.nes$/i,
  snes: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(sfc|smc)$/i,
  atari2600: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(a26|bin)$/i,
  genesis: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(md|gen|bin)$/i,
  c64: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(d64|t64|prg|crt)$/i,
  apple2: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(dsk|do|po|nib|woz)$/i,
  apple2gs: /^[A-Za-z0-9][A-Za-z0-9_. '()[\]-]{0,159}\.(dsk|do|po|nib|woz|2mg|moof)$/i,
} as const;
const artworkPattern = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}\.(png|jpe?g|webp)$/i;
const accents = ['violet', 'coral', 'mint', 'gold', 'blue'] as const;
const icons = ['castle', 'rocket', 'gem', 'cat', 'car', 'puzzle'] as const;
const inputs = ['controller', 'mouse', 'keyboard'] as const;

export interface GameManifest {
  schemaVersion: 1;
  id: string;
  title: string;
  platform: 'dos' | 'amiga' | 'n64' | 'gamecube' | 'nes' | 'snes' | 'atari2600' | 'genesis' | 'c64' | 'apple2' | 'apple2gs';
  description: string;
  inputs: Array<(typeof inputs)[number]>;
  presentation: { accent: (typeof accents)[number]; icon: (typeof icons)[number]; artwork?: string };
  launch: {
    adapter: 'dosbox-x' | 'fs-uae' | 'mupen64plus' | 'dolphin' | 'nestopia' | 'snes9x' | 'stella' | 'ares' | 'vice-x64sc' | 'mame-apple2e' | 'mame-apple2gs';
    entry: string;
    settings: {
      fullscreen: boolean;
      cycles?: 'auto' | 'max' | number;
      machine?: 'svga_s3' | 'vgaonly' | 'ega' | 'tandy';
      amigaModel?: 'A500' | 'A500+' | 'A600' | 'A1200';
      videoPlugin?: 'glide64mk2' | 'rice';
      videoBackend?: 'Metal' | 'Vulkan' | 'OGL';
    };
  };
  state: { favorite: boolean; playCount: number; lastPlayed?: string };
  source: { label: string; importedAt: string };
}

export interface ImportPreview {
  token: string;
  folderName: string;
  suggestedId: string;
  suggestedTitle: string;
  entries: string[];
  candidates: Record<GameManifest['platform'], string[]>;
  suggestedPlatform: GameManifest['platform'];
  fileCount: number;
  sizeMb: number;
  warnings: string[];
}

export interface ImportApproval {
  token: string;
  id: string;
  title: string;
  platform: GameManifest['platform'];
  description: string;
  entry: string;
  inputs: GameManifest['inputs'];
  accent: GameManifest['presentation']['accent'];
  icon: GameManifest['presentation']['icon'];
  fullscreen: boolean;
  cycles: 'auto' | 'max' | number;
  machine: 'svga_s3' | 'vgaonly' | 'ega' | 'tandy';
  amigaModel: 'A500' | 'A500+' | 'A600' | 'A1200';
  videoPlugin: 'glide64mk2' | 'rice';
  videoBackend: 'Metal' | 'Vulkan' | 'OGL';
}

export function manifestFromApproval(approval: ImportApproval): GameManifest {
  const adapters: Record<GameManifest['platform'], GameManifest['launch']['adapter']> = {
    dos: 'dosbox-x', amiga: 'fs-uae', n64: 'mupen64plus', gamecube: 'dolphin',
    nes: 'nestopia', snes: 'snes9x', atari2600: 'stella', genesis: 'ares', c64: 'vice-x64sc', apple2: 'mame-apple2e', apple2gs: 'mame-apple2gs',
  };
  const adapter = adapters[approval.platform];
  return validateManifest({
    schemaVersion: 1,
    id: approval.id,
    title: approval.title,
    platform: approval.platform,
    description: approval.description,
    inputs: approval.inputs,
    presentation: { accent: approval.accent, icon: approval.icon },
    launch: {
      adapter,
      entry: approval.entry,
      settings: {
        fullscreen: approval.fullscreen,
        ...(approval.platform === 'dos' ? { cycles: approval.cycles, machine: approval.machine } : {}),
        ...(approval.platform === 'amiga' ? { amigaModel: approval.amigaModel } : {}),
        ...(approval.platform === 'n64' ? { videoPlugin: approval.videoPlugin } : {}),
        ...(approval.platform === 'gamecube' ? { videoBackend: approval.videoBackend } : {}),
      },
    },
    state: { favorite: false, playCount: 0 },
    source: { label: 'Parent import', importedAt: new Date().toISOString() },
  });
}

const oneOf = <T extends readonly string[]>(value: unknown, choices: T, label: string): T[number] => {
  if (typeof value !== 'string' || !choices.includes(value)) throw new Error(`Invalid ${label}.`);
  return value as T[number];
};

const text = (value: unknown, label: string, maximum: number) => {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum) throw new Error(`Invalid ${label}.`);
  return value.trim();
};

export function validateGameId(value: unknown) {
  if (typeof value !== 'string' || !gameIdPattern.test(value)) throw new Error('Invalid game identifier.');
  return value;
}

export function validateEntry(value: unknown, platform: GameManifest['platform'] = 'dos') {
  if (typeof value !== 'string' || !entryPatterns[platform].test(value) || path.basename(value) !== value) {
    throw new Error(`The start file is not a supported ${platform.toUpperCase()} filename.`);
  }
  return value;
}

export function validateArtwork(value: unknown) {
  if (typeof value !== 'string' || !artworkPattern.test(value) || path.basename(value) !== value) {
    throw new Error('Artwork must be a simple PNG, JPEG, or WebP filename.');
  }
  return value;
}

export function validateManifest(value: unknown): GameManifest {
  if (!value || typeof value !== 'object') throw new Error('The game manifest is not an object.');
  const item = value as Record<string, any>;
  if (item.schemaVersion !== MANIFEST_VERSION) throw new Error('Unsupported game manifest version.');
  const platform = oneOf(item.platform, ['dos', 'amiga', 'n64', 'gamecube', 'nes', 'snes', 'atari2600', 'genesis', 'c64', 'apple2', 'apple2gs'] as const, 'platform');
  const cycles = item.launch?.settings?.cycles;
  if (platform === 'dos' && !(cycles === 'auto' || cycles === 'max' || (Number.isInteger(cycles) && cycles >= 300 && cycles <= 200_000))) {
    throw new Error('Invalid DOS CPU cycles setting.');
  }
  const expectedAdapters: Record<GameManifest['platform'], GameManifest['launch']['adapter']> = {
    dos: 'dosbox-x', amiga: 'fs-uae', n64: 'mupen64plus', gamecube: 'dolphin',
    nes: 'nestopia', snes: 'snes9x', atari2600: 'stella', genesis: 'ares', c64: 'vice-x64sc', apple2: 'mame-apple2e', apple2gs: 'mame-apple2gs',
  };
  const expectedAdapter = expectedAdapters[platform];
  if (item.launch?.adapter !== expectedAdapter) throw new Error('Invalid launch adapter for this platform.');
  const manifest: GameManifest = {
    schemaVersion: 1,
    id: validateGameId(item.id),
    title: text(item.title, 'title', 80),
    platform,
    description: text(item.description, 'description', 240),
    inputs: Array.isArray(item.inputs) && item.inputs.length
      ? [...new Set(item.inputs.map((input) => oneOf(input, inputs, 'input type')))]
      : ['keyboard'],
    presentation: {
      accent: oneOf(item.presentation?.accent, accents, 'accent'),
      icon: oneOf(item.presentation?.icon, icons, 'icon'),
      ...(item.presentation?.artwork ? { artwork: validateArtwork(item.presentation.artwork) } : {}),
    },
    launch: {
      adapter: expectedAdapter,
      entry: validateEntry(item.launch?.entry, platform),
      settings: {
        fullscreen: Boolean(item.launch?.settings?.fullscreen),
        ...(platform === 'dos' ? {
          cycles,
          machine: oneOf(item.launch?.settings?.machine, ['svga_s3', 'vgaonly', 'ega', 'tandy'] as const, 'DOS machine'),
        } : {}),
        ...(platform === 'amiga' ? {
          amigaModel: oneOf(item.launch?.settings?.amigaModel, ['A500', 'A500+', 'A600', 'A1200'] as const, 'Amiga model'),
        } : {}),
        ...(platform === 'n64' ? {
          videoPlugin: oneOf(item.launch?.settings?.videoPlugin, ['glide64mk2', 'rice'] as const, 'N64 video plugin'),
        } : {}),
        ...(platform === 'gamecube' ? {
          videoBackend: oneOf(item.launch?.settings?.videoBackend, ['Metal', 'Vulkan', 'OGL'] as const, 'Dolphin video backend'),
        } : {}),
      },
    },
    state: {
      favorite: Boolean(item.state?.favorite),
      playCount: Number.isInteger(item.state?.playCount) && item.state.playCount >= 0 ? item.state.playCount : 0,
      ...(typeof item.state?.lastPlayed === 'string' ? { lastPlayed: item.state.lastPlayed } : {}),
    },
    source: {
      label: text(item.source?.label, 'source label', 80),
      importedAt: text(item.source?.importedAt, 'import date', 40),
    },
  };
  return manifest;
}

const manifestPath = (library: GameLibraryPaths, gameId: string) => path.join(library.games, validateGameId(gameId), 'game.json');

export async function writeManifest(library: GameLibraryPaths, manifest: GameManifest, backup = true) {
  const valid = validateManifest(manifest);
  const destination = manifestPath(library, valid.id);
  await mkdir(path.dirname(destination), { recursive: true });
  if (backup) {
    try { await copyFile(destination, `${destination}.backup`); } catch { /* first write */ }
  }
  const temporary = `${destination}.tmp`;
  await writeFile(temporary, `${JSON.stringify(valid, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await rename(temporary, destination);
}

export async function readManifest(library: GameLibraryPaths, gameId: string) {
  const parsed = JSON.parse(await readFile(manifestPath(library, gameId), 'utf8'));
  const manifest = validateManifest(parsed);
  const storage = getGameStoragePaths(library, manifest.id);
  await access(path.join(storage.content, manifest.launch.entry), constants.R_OK);
  return manifest;
}

export async function listManifests(library: GameLibraryPaths) {
  const entries = await readdir(library.games, { withFileTypes: true });
  const manifests: GameManifest[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !gameIdPattern.test(entry.name)) continue;
    try { manifests.push(await readManifest(library, entry.name)); } catch { /* invalid games stay hidden */ }
  }
  return manifests.sort((a, b) => {
    const recent = (b.state.lastPlayed ?? '').localeCompare(a.state.lastPlayed ?? '');
    return recent || Number(b.state.favorite) - Number(a.state.favorite) || a.title.localeCompare(b.title);
  });
}

export async function auditGameLibrary(library: GameLibraryPaths) {
  const entries = await readdir(library.games, { withFileTypes: true });
  const issues: string[] = [];
  let valid = 0;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!gameIdPattern.test(entry.name)) {
      issues.push(`${entry.name}: unsafe folder name`);
      continue;
    }
    try {
      await readManifest(library, entry.name);
      valid += 1;
    } catch (error) {
      issues.push(`${entry.name}: ${error instanceof Error ? error.message : 'invalid installation'}`);
    }
  }
  return { installed: entries.filter((entry) => entry.isDirectory()).length, valid, issues };
}

export async function writeLaunchLog(library: GameLibraryPaths, event: Record<string, unknown>) {
  const line = `${JSON.stringify({ timestamp: new Date().toISOString(), ...event })}\n`;
  await writeFile(path.join(library.logs, 'launches.jsonl'), line, { encoding: 'utf8', flag: 'a', mode: 0o600 });
}

export async function readArtworkDataUrl(library: GameLibraryPaths, manifest: GameManifest) {
  if (!manifest.presentation.artwork) return undefined;
  const artwork = validateArtwork(manifest.presentation.artwork);
  const file = path.join(getGameStoragePaths(library, manifest.id).media, artwork);
  const info = await stat(file);
  if (info.size > 8_000_000) throw new Error('Artwork is too large.');
  const extension = path.extname(artwork).toLowerCase();
  const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
}

export async function migrateJillManifest(library: GameLibraryPaths) {
  const storage = getGameStoragePaths(library, 'jill-of-the-jungle');
  try {
    await access(path.join(storage.content, 'JILL.BAT'), constants.R_OK);
    await access(path.join(storage.root, 'game.json'), constants.R_OK);
  } catch {
    try {
      await access(path.join(storage.content, 'JILL.BAT'), constants.R_OK);
      await writeManifest(library, {
        schemaVersion: 1,
        id: 'jill-of-the-jungle',
        title: 'Jill of the Jungle',
        platform: 'dos',
        description: 'Leap, climb, and transform through a magical jungle.',
        inputs: ['keyboard'],
        presentation: { accent: 'mint', icon: 'gem' },
        launch: { adapter: 'dosbox-x', entry: 'JILL.BAT', settings: { fullscreen: true, cycles: 'auto', machine: 'svga_s3' } },
        state: { favorite: true, playCount: 0 },
        source: { label: 'Parent library', importedAt: new Date().toISOString() },
      }, false);
    } catch { /* Jill is not installed */ }
  }
}

export async function inspectImportFolder(source: string): Promise<Omit<ImportPreview, 'token'>> {
  const root = path.resolve(source);
  const files: string[] = [];
  let bytes = 0;
  const walk = async (directory: string, depth = 0) => {
    if (depth > 8) throw new Error('This folder is nested too deeply.');
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Imports cannot contain symbolic links.');
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute, depth + 1);
      else if (entry.isFile()) {
        files.push(path.relative(root, absolute));
        bytes += (await stat(absolute)).size;
        if (files.length > 10_000 || bytes > 2_000_000_000) throw new Error('This import is too large.');
      }
    }
  };
  await walk(root);
  const topLevel = files.filter((file) => !file.includes(path.sep));
  const candidates = {
    dos: topLevel.filter((file) => entryPatterns.dos.test(file)).sort(),
    amiga: topLevel.filter((file) => entryPatterns.amiga.test(file)).sort(),
    n64: topLevel.filter((file) => entryPatterns.n64.test(file)).sort(),
    gamecube: topLevel.filter((file) => entryPatterns.gamecube.test(file)).sort(),
    nes: topLevel.filter((file) => entryPatterns.nes.test(file)).sort(),
    snes: topLevel.filter((file) => entryPatterns.snes.test(file)).sort(),
    atari2600: topLevel.filter((file) => entryPatterns.atari2600.test(file)).sort(),
    genesis: topLevel.filter((file) => entryPatterns.genesis.test(file)).sort(),
    c64: topLevel.filter((file) => entryPatterns.c64.test(file)).sort(),
    apple2: topLevel.filter((file) => entryPatterns.apple2.test(file)).sort(),
    apple2gs: topLevel.filter((file) => entryPatterns.apple2gs.test(file)).sort(),
  };
  const suggestionOrder: GameManifest['platform'][] = ['gamecube', 'amiga', 'n64', 'nes', 'snes', 'atari2600', 'genesis', 'c64', 'apple2', 'apple2gs', 'dos'];
  const suggestedPlatform = suggestionOrder.find((platform) => candidates[platform].length) ?? 'dos';
  const topLevelEntries = candidates[suggestedPlatform];
  const folderName = path.basename(root);
  const suggestedId = folderName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'dos-game';
  return {
    folderName,
    suggestedId,
    suggestedTitle: folderName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    entries: topLevelEntries.sort(),
    candidates,
    suggestedPlatform,
    fileCount: files.length,
    sizeMb: Math.round(bytes / 1024 / 1024 * 10) / 10,
    warnings: topLevelEntries.length ? [] : ['No supported top-level game file was found.'],
  };
}

export async function approveImport(library: GameLibraryPaths, source: string, approval: ImportApproval) {
  const id = validateGameId(approval.id);
  const entry = validateEntry(approval.entry, approval.platform);
  const storage = getGameStoragePaths(library, id);
  try { await access(storage.root); throw new Error('A game with this ID is already installed.'); } catch (error) {
    if (error instanceof Error && error.message.includes('already installed')) throw error;
  }
  await Promise.all([storage.root, storage.config, storage.saves, storage.media].map((directory) => mkdir(directory, { recursive: true })));
  const stagedContent = path.join(storage.root, '.content-importing');
  await cp(source, stagedContent, { recursive: true, errorOnExist: true, force: false, verbatimSymlinks: false });
  await access(path.join(stagedContent, entry), constants.R_OK);
  await rename(stagedContent, storage.content);
  const manifest = manifestFromApproval({ ...approval, id, entry });
  await writeManifest(library, manifest, false);
  return manifest;
}
