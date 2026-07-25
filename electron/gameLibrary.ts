import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export interface GameLibraryPaths {
  root: string;
  games: string;
  firmware: string;
  amigaFirmware: string;
  imports: string;
  cache: string;
  logs: string;
}

export interface GameStoragePaths {
  root: string;
  content: string;
  config: string;
  saves: string;
  media: string;
}

const gameIdPattern = /^[a-z0-9-]{1,80}$/;

export function getGameLibraryPaths(userDataPath: string, override = process.env.ABBYS_ARCADE_DATA_DIR): GameLibraryPaths {
  const root = override ? path.resolve(override) : path.join(userDataPath, 'game-library');
  return {
    root,
    games: path.join(root, 'games'),
    firmware: path.join(root, 'firmware'),
    amigaFirmware: path.join(root, 'firmware', 'amiga'),
    imports: path.join(root, 'imports'),
    cache: path.join(root, 'cache'),
    logs: path.join(root, 'logs'),
  };
}

export function getGameStoragePaths(library: GameLibraryPaths, gameId: string): GameStoragePaths {
  if (!gameIdPattern.test(gameId)) throw new Error('Invalid game identifier.');
  const root = path.join(library.games, gameId);
  return {
    root,
    content: path.join(root, 'content'),
    config: path.join(root, 'config'),
    saves: path.join(root, 'saves'),
    media: path.join(root, 'media'),
  };
}

export async function ensureGameLibrary(library: GameLibraryPaths) {
  await Promise.all(Object.values(library).map((directory) => mkdir(directory, { recursive: true })));
}

export async function ensureGameStorage(game: GameStoragePaths) {
  await Promise.all(Object.values(game).map((directory) => mkdir(directory, { recursive: true })));
}
