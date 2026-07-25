import type { ArcadeApi } from './types';
import { mockArcadeApi } from './mockArcadeApi';

declare global {
  interface Window {
    arcadeDesktop?: Pick<ArcadeApi,
      'listGames' | 'launchGame' | 'getSystemStatus' | 'chooseImportFolder' | 'approveImport' | 'updateGame' | 'getLibraryHealth'
      | 'testImport'
    >;
  }
}

export const arcadeApi: ArcadeApi = {
  ...mockArcadeApi,
  listGames: window.arcadeDesktop?.listGames ?? mockArcadeApi.listGames,
  launchGame: window.arcadeDesktop?.launchGame ?? mockArcadeApi.launchGame,
  getSystemStatus: window.arcadeDesktop?.getSystemStatus ?? mockArcadeApi.getSystemStatus,
  chooseImportFolder: window.arcadeDesktop?.chooseImportFolder ?? mockArcadeApi.chooseImportFolder,
  approveImport: window.arcadeDesktop?.approveImport ?? mockArcadeApi.approveImport,
  testImport: window.arcadeDesktop?.testImport ?? mockArcadeApi.testImport,
  updateGame: window.arcadeDesktop?.updateGame ?? mockArcadeApi.updateGame,
  getLibraryHealth: window.arcadeDesktop?.getLibraryHealth ?? mockArcadeApi.getLibraryHealth,
};

export type {
  ArcadeApi, CatalogItem, ControllerInfo, Game, ImportApproval, ImportPreview, InputKind,
  LaunchResult, LibraryHealth, Platform, SystemStatus,
} from './types';
