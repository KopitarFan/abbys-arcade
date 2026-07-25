import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('arcadeDesktop', {
  launchGame: (gameId: string) => ipcRenderer.invoke('arcade:launch-game', gameId),
  listGames: () => ipcRenderer.invoke('arcade:list-games'),
  getSystemStatus: () => ipcRenderer.invoke('arcade:get-system-status'),
  chooseImportFolder: () => ipcRenderer.invoke('arcade:choose-import-folder'),
  approveImport: (approval: unknown) => ipcRenderer.invoke('arcade:approve-import', approval),
  testImport: (approval: unknown) => ipcRenderer.invoke('arcade:test-import', approval),
  updateGame: (gameId: string, changes: unknown) => ipcRenderer.invoke('arcade:update-game', gameId, changes),
  getLibraryHealth: () => ipcRenderer.invoke('arcade:get-library-health'),
  returnToArcade: () => ipcRenderer.send('arcade:return-to-arcade'),
  showGameMenu: () => ipcRenderer.send('arcade:show-game-menu'),
  keepPlaying: () => ipcRenderer.send('arcade:keep-playing'),
  onGameMenuState: (listener: (expanded: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, expanded: boolean) => listener(expanded);
    ipcRenderer.on('arcade:game-menu-state', handler);
    return () => ipcRenderer.removeListener('arcade:game-menu-state', handler);
  },
});
