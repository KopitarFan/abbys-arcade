import type { ArcadeApi, CatalogItem, Game, SystemStatus } from './types';

const games: Game[] = [
  {
    id: 'mario-64',
    title: 'Mario 64',
    platform: 'n64',
    description: 'Explore the castle and collect stars.',
    inputs: ['controller'],
    installed: true,
    favorite: true,
    lastPlayed: 'Today',
    progress: 'Snowy mountain',
    accent: 'violet',
    icon: 'castle',
  },
  {
    id: 'lemmings',
    title: 'Lemmings',
    platform: 'amiga',
    description: 'Help every little lemming find the exit.',
    inputs: ['mouse'],
    installed: true,
    lastPlayed: 'Yesterday',
    accent: 'mint',
    icon: 'rocket',
  },
  {
    id: 'crystal-caves',
    title: 'Crystal Caves',
    platform: 'dos',
    description: 'Collect crystals in colorful underground worlds.',
    inputs: ['keyboard', 'controller'],
    installed: true,
    accent: 'gold',
    icon: 'gem',
  },
  {
    id: 'moon-cat',
    title: 'Moon Cat',
    platform: 'created',
    description: 'A purple cat bounces across moon craters.',
    inputs: ['controller', 'keyboard'],
    installed: true,
    lastPlayed: '3 days ago',
    accent: 'blue',
    icon: 'cat',
  },
];

let catalog: CatalogItem[] = [
  {
    id: 'captain-dynamo',
    title: 'Captain Dynamo',
    platform: 'dos',
    description: 'A bright, fast platform adventure.',
    inputs: ['controller', 'keyboard'],
    installed: false,
    ageLabel: 'Ages 7+',
    sourceLabel: 'Parent library',
    installState: 'available',
    accent: 'coral',
    icon: 'rocket',
  },
  {
    id: 'open-puzzle-pack',
    title: 'Open Puzzle Pack',
    platform: 'created',
    description: 'Friendly puzzles made by open-source creators.',
    inputs: ['mouse', 'controller'],
    installed: false,
    ageLabel: 'Everyone',
    sourceLabel: 'Free & approved',
    installState: 'available',
    accent: 'blue',
    icon: 'puzzle',
  },
  {
    id: 'retro-racer',
    title: 'Retro Racer',
    platform: 'amiga',
    description: 'Quick races on tiny colorful tracks.',
    inputs: ['controller'],
    installed: true,
    ageLabel: 'Everyone',
    sourceLabel: 'Parent library',
    installState: 'installed',
    accent: 'mint',
    icon: 'car',
  },
];

const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export const mockArcadeApi: ArcadeApi = {
  async listGames() {
    await pause(180);
    return structuredClone(games);
  },
  async listCatalog() {
    await pause(220);
    return structuredClone(catalog);
  },
  async getSystemStatus(): Promise<SystemStatus> {
    await pause(80);
    return {
      online: true,
      freeSpaceGb: 68,
      controllers: [
        { id: 'mock-dualshock', name: 'DUALSHOCK 4', connected: true, profile: 'playstation' },
      ],
    };
  },
  async launchGame(gameId: string) {
    await pause(300);
    if (!games.some((game) => game.id === gameId)) throw new Error('That game is not installed.');
    return { gameId, status: 'simulated', exitCode: null, signal: null };
  },
  async installApprovedGame(packageId: string) {
    const item = catalog.find((game) => game.id === packageId);
    if (!item) throw new Error('That approved package could not be found.');
    item.installState = 'installing';
    item.installProgress = 15;
    await pause(350);
    item.installProgress = 58;
    await pause(350);
    item.installProgress = 100;
    item.installState = 'installed';
    item.installed = true;
  },
  async uninstallGame(gameId: string) {
    const item = catalog.find((game) => game.id === gameId);
    if (!item) throw new Error('That game could not be found.');
    await pause(250);
    item.installState = 'available';
    item.installed = false;
  },
  async startSpeechCapture() {
    await pause(800);
    return 'Make a game where a purple cat collects stars on the moon.';
  },
  async chooseImportFolder() { return null; },
  async approveImport() { throw new Error('Folder import is available in the desktop app.'); },
  async testImport() { throw new Error('Import testing is available in the desktop app.'); },
  async updateGame() { return true; },
  async getLibraryHealth() {
    return { root: 'Browser demo library', installed: games.length, valid: games.length, issues: [], runtimes: { dos: true, amiga: true, n64: true, gamecube: true }, amigaFirmware: true };
  },
};
