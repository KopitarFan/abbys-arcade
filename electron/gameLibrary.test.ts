import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getGameLibraryPaths, getGameStoragePaths } from './gameLibrary';

describe('game library paths', () => {
  it('uses an OS-provided application data folder by default', () => {
    const library = getGameLibraryPaths('/Users/abby/Library/Application Support/AbbysArcade', '');
    expect(library.games).toBe(path.join('/Users/abby/Library/Application Support/AbbysArcade', 'game-library', 'games'));
  });

  it('supports a portable library override', () => {
    const library = getGameLibraryPaths('/ignored', '/Volumes/Arcade/Games');
    expect(library.root).toBe('/Volumes/Arcade/Games');
  });

  it('isolates content, configuration, saves, and media by game id', () => {
    const game = getGameStoragePaths(getGameLibraryPaths('/data', ''), 'jill-of-the-jungle');
    expect(game.content.endsWith(path.join('jill-of-the-jungle', 'content'))).toBe(true);
    expect(game.config.endsWith(path.join('jill-of-the-jungle', 'config'))).toBe(true);
    expect(game.saves.endsWith(path.join('jill-of-the-jungle', 'saves'))).toBe(true);
    expect(game.media.endsWith(path.join('jill-of-the-jungle', 'media'))).toBe(true);
  });

  it('rejects unsafe game ids', () => {
    expect(() => getGameStoragePaths(getGameLibraryPaths('/data', ''), '../outside')).toThrow(/invalid game identifier/i);
  });
});
