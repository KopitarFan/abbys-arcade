export type Platform = 'n64' | 'amiga' | 'dos' | 'gamecube' | 'created';
export type InputKind = 'controller' | 'mouse' | 'keyboard';
export type InstallState = 'available' | 'installing' | 'installed' | 'failed';

export interface Game {
  id: string;
  title: string;
  platform: Platform;
  description: string;
  inputs: InputKind[];
  installed: boolean;
  favorite?: boolean;
  lastPlayed?: string;
  progress?: string;
  artwork?: string;
  playCount?: number;
  emulatorSettings?: {
    fullscreen: boolean;
    cycles?: 'auto' | 'max' | number;
    machine?: string;
    amigaModel?: string;
    videoPlugin?: string;
    videoBackend?: string;
  };
  accent: 'violet' | 'coral' | 'mint' | 'gold' | 'blue';
  icon: 'castle' | 'rocket' | 'gem' | 'cat' | 'car' | 'puzzle';
}

export interface CatalogItem extends Game {
  ageLabel: string;
  sourceLabel: string;
  installState: InstallState;
  installProgress?: number;
}

export interface ControllerInfo {
  id: string;
  name: string;
  connected: boolean;
  profile: 'playstation' | 'xbox' | 'generic';
}

export interface SystemStatus {
  online: boolean;
  freeSpaceGb: number;
  controllers: ControllerInfo[];
}

export interface LaunchResult {
  gameId: string;
  status: 'simulated' | 'exited' | 'crashed';
  exitCode: number | null;
  signal: string | null;
}

export interface ImportPreview {
  token: string;
  folderName: string;
  suggestedId: string;
  suggestedTitle: string;
  entries: string[];
  candidates: { dos: string[]; amiga: string[]; n64: string[]; gamecube: string[] };
  suggestedPlatform: 'dos' | 'amiga' | 'n64' | 'gamecube';
  fileCount: number;
  sizeMb: number;
  warnings: string[];
}

export interface ImportApproval {
  token: string;
  id: string;
  title: string;
  platform: 'dos' | 'amiga' | 'n64' | 'gamecube';
  description: string;
  entry: string;
  inputs: InputKind[];
  accent: Game['accent'];
  icon: Game['icon'];
  fullscreen: boolean;
  cycles: 'auto' | 'max' | number;
  machine: 'svga_s3' | 'vgaonly' | 'ega' | 'tandy';
  amigaModel: 'A500' | 'A500+' | 'A600' | 'A1200';
  videoPlugin: 'glide64mk2' | 'rice';
  videoBackend: 'Metal' | 'Vulkan' | 'OGL';
}

export interface LibraryHealth {
  root: string;
  installed: number;
  valid: number;
  issues: string[];
  runtimes?: { dos: boolean; amiga: boolean; n64: boolean; gamecube: boolean };
  amigaFirmware?: boolean;
}

export interface ArcadeApi {
  listGames(): Promise<Game[]>;
  listCatalog(): Promise<CatalogItem[]>;
  getSystemStatus(): Promise<SystemStatus>;
  launchGame(gameId: string): Promise<LaunchResult>;
  installApprovedGame(packageId: string): Promise<void>;
  uninstallGame(gameId: string): Promise<void>;
  startSpeechCapture(): Promise<string>;
  chooseImportFolder(): Promise<ImportPreview | null>;
  approveImport(approval: ImportApproval): Promise<string>;
  testImport(approval: ImportApproval): Promise<LaunchResult>;
  updateGame(gameId: string, changes: { favorite?: boolean; fullscreen?: boolean; cycles?: 'auto' | 'max' | number }): Promise<boolean>;
  getLibraryHealth(): Promise<LibraryHealth>;
}
