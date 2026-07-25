import { app, BrowserWindow, dialog, globalShortcut, ipcMain, screen } from 'electron';
import { spawn, type ChildProcess } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { access, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ensureGameLibrary, ensureGameStorage, getGameLibraryPaths, getGameStoragePaths } from './gameLibrary.js';
import {
  approveImport,
  auditGameLibrary,
  inspectImportFolder,
  listManifests,
  manifestFromApproval,
  migrateJillManifest,
  readManifest,
  readArtworkDataUrl,
  validateGameId,
  writeLaunchLog,
  writeManifest,
  type GameManifest,
  type ImportApproval,
} from './manifestLibrary.js';
import { getPlatformTarget } from './platformTargets.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const developmentUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://127.0.0.1:5173';
let activeGame: ChildProcess | undefined;
let mainWindow: BrowserWindow | undefined;
let gameChrome: BrowserWindow | undefined;
let gameChromeExpanded = false;
let returnRequested = false;
let gameLibrary = getGameLibraryPaths('.');
const importTokens = new Map<string, string>();

const emulatorExecutable = (platform: GameManifest['platform']) => {
  if (platform === 'gamecube') return process.platform === 'darwin' ? '/Applications/Dolphin.app/Contents/MacOS/Dolphin' : '/usr/bin/dolphin-emu';
  const prefix = process.platform === 'darwin' ? process.arch === 'arm64' ? '/opt/homebrew/bin' : '/usr/local/bin' : '/usr/bin';
  return path.join(prefix, platform === 'dos' ? 'dosbox-x' : platform === 'amiga' ? 'fs-uae' : 'mupen64plus');
};

const hasAmigaFirmware = async () => {
  try { return (await readdir(gameLibrary.amigaFirmware)).some((file) => file.toLowerCase().endsWith('.rom')); }
  catch { return false; }
};

const ensureRuntimeReady = async (manifest: GameManifest) => {
  await access(emulatorExecutable(manifest.platform));
  if (manifest.platform === 'amiga' && !await hasAmigaFirmware()) {
    throw new Error(`Amiga Kickstart firmware is required. Add a legally obtained .rom file to ${gameLibrary.amigaFirmware}`);
  }
};

app.setName('AbbysArcade');

const createWindow = async () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 760,
    minHeight: 560,
    backgroundColor: '#100d21',
    title: "Abby's Arcade",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = window;
  window.on('closed', () => {
    if (mainWindow === window) mainWindow = undefined;
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    const allowed = app.isPackaged ? url.startsWith('file:') : url.startsWith(developmentUrl);
    if (!allowed) event.preventDefault();
  });

  if (app.isPackaged) await window.loadFile(path.join(currentDirectory, '../dist/index.html'));
  else await window.loadURL(developmentUrl);
};

const closeGameChrome = () => {
  globalShortcut.unregister('CommandOrControl+Shift+Q');
  globalShortcut.unregister('F12');
  if (gameChrome && !gameChrome.isDestroyed()) gameChrome.destroy();
  gameChrome = undefined;
  gameChromeExpanded = false;
};

const returnToArcade = () => {
  if (!activeGame) return;
  returnRequested = true;
  activeGame.kill();
};

const setGameChromeExpanded = (expanded: boolean) => {
  if (!gameChrome || gameChrome.isDestroyed()) return;
  const display = screen.getDisplayMatching(gameChrome.getBounds()).workArea;
  gameChromeExpanded = expanded;
  const bounds = expanded
    ? { width: 340, height: 190, x: Math.round(display.x + (display.width - 340) / 2), y: display.y + 18 }
    : { width: 54, height: 112, x: display.x + display.width - 54, y: display.y + 84 };
  gameChrome.setBounds(bounds, true);
  gameChrome.webContents.send('arcade:game-menu-state', expanded);
  if (expanded) {
    gameChrome.show();
    gameChrome.focus();
  }
};

const showGameChrome = () => {
  const display = screen.getPrimaryDisplay().workArea;
  const shortcutLabel = process.platform === 'darwin' ? '⌘⇧Q' : 'Ctrl+Shift+Q';
  gameChrome = new BrowserWindow({
    width: 54,
    height: 112,
    x: display.x + display.width - 54,
    y: display.y + 84,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  gameChrome.setAlwaysOnTop(true, 'floating');
  gameChrome.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  const html = encodeURIComponent(`<!doctype html>
    <html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'">
    <style>
      *{box-sizing:border-box}html,body{margin:0;background:transparent;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:white}
      button{border:1px solid rgba(255,255,255,.38);color:white;background:rgba(45,25,72,.92);font:700 14px inherit;cursor:pointer;backdrop-filter:blur(14px)}
      button:hover,button:focus{background:rgba(112,55,145,.97);outline:2px solid #ff9ed8;outline-offset:-3px}
      #tab{display:flex;width:54px;height:112px;border-radius:24px 0 0 24px;align-items:center;justify-content:center;writing-mode:vertical-rl;transform:rotate(180deg);box-shadow:0 5px 20px rgba(0,0,0,.3)}
      #panel{display:none;width:340px;height:186px;padding:22px;border:1px solid rgba(255,255,255,.35);border-radius:26px;background:linear-gradient(145deg,rgba(55,27,83,.97),rgba(116,48,139,.96));box-shadow:0 12px 35px rgba(0,0,0,.4);text-align:center}
      body.expanded #tab{display:none}body.expanded #panel{display:block}
      h1{margin:0 0 7px;font-size:22px}p{margin:0 0 18px;color:#f3dff6;font-size:13px;line-height:1.35}
      .actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.actions button{height:48px;border-radius:16px}
      #return{background:#d44391}small{display:block;margin-top:12px;opacity:.68}
    </style></head><body>
      <button id="tab" aria-label="Open arcade menu">Arcade menu</button>
      <section id="panel" aria-label="Arcade menu"><h1>Return to the arcade?</h1><p>Your game will close. Save first if the game supports it.</p>
        <div class="actions"><button id="keep">Keep playing</button><button id="return">Return</button></div>
        <small>F12 · ${shortcutLabel} · hold Share + Options</small>
      </section>
      <script>
        const tab = document.getElementById('tab');
        const keep = document.getElementById('keep');
        const leave = document.getElementById('return');
        tab.addEventListener('click', () => window.arcadeDesktop.showGameMenu());
        keep.addEventListener('click', () => window.arcadeDesktop.keepPlaying());
        leave.addEventListener('click', () => window.arcadeDesktop.returnToArcade());
        window.arcadeDesktop.onGameMenuState((expanded) => {
          document.body.classList.toggle('expanded', expanded);
          if (expanded) keep.focus();
        });
        let chordStarted = 0;
        let chordTriggered = false;
        function watchController(now) {
          const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
          const pressed = pads.some((pad) => pad.buttons[8]?.pressed && pad.buttons[9]?.pressed);
          if (pressed) {
            if (!chordStarted) chordStarted = now;
            if (!chordTriggered && now - chordStarted >= 1000) {
              chordTriggered = true;
              window.arcadeDesktop.showGameMenu();
            }
          } else {
            chordStarted = 0;
            chordTriggered = false;
          }
          requestAnimationFrame(watchController);
        }
        requestAnimationFrame(watchController);
      </script>
    </body></html>`);
  void gameChrome.loadURL(`data:text/html;charset=utf-8,${html}`);
  globalShortcut.register('F12', () => setGameChromeExpanded(true));
  globalShortcut.register('CommandOrControl+Shift+Q', () => setGameChromeExpanded(true));
};

app.whenReady().then(async () => {
  gameLibrary = getGameLibraryPaths(app.getPath('userData'));
  await ensureGameLibrary(gameLibrary);
  await ensureGameStorage(getGameStoragePaths(gameLibrary, 'jill-of-the-jungle'));
  await migrateJillManifest(gameLibrary);

  ipcMain.handle('arcade:get-system-status', () => ({
    online: true,
    freeSpaceGb: 0,
    controllers: [],
  }));
  ipcMain.on('arcade:return-to-arcade', (event) => {
    if (event.sender === gameChrome?.webContents) returnToArcade();
  });
  ipcMain.on('arcade:show-game-menu', (event) => {
    if (event.sender === gameChrome?.webContents) setGameChromeExpanded(true);
  });
  ipcMain.on('arcade:keep-playing', (event) => {
    if (event.sender === gameChrome?.webContents) setGameChromeExpanded(false);
  });
  ipcMain.handle('arcade:list-games', async () => Promise.all((await listManifests(gameLibrary)).map(async (manifest) => ({
    id: manifest.id,
    title: manifest.title,
    platform: manifest.platform,
    description: manifest.description,
    inputs: manifest.inputs,
    installed: true,
    favorite: manifest.state.favorite,
    lastPlayed: manifest.state.lastPlayed,
    accent: manifest.presentation.accent,
    icon: manifest.presentation.icon,
    artwork: await readArtworkDataUrl(gameLibrary, manifest).catch(() => undefined),
    playCount: manifest.state.playCount,
    emulatorSettings: manifest.launch.settings,
  }))));
  ipcMain.handle('arcade:choose-import-folder', async () => {
    const selection = await dialog.showOpenDialog(mainWindow!, {
      title: 'Choose a DOS, Amiga, N64, or GameCube game folder',
      properties: ['openDirectory'],
    });
    if (selection.canceled || !selection.filePaths[0]) return null;
    const token = randomUUID();
    const preview = await inspectImportFolder(selection.filePaths[0]);
    importTokens.set(token, selection.filePaths[0]);
    return { ...preview, token };
  });
  ipcMain.handle('arcade:approve-import', async (_event, approval: ImportApproval) => {
    const source = approval && typeof approval === 'object' ? importTokens.get(approval.token) : undefined;
    if (!source) throw new Error('This import session expired. Choose the folder again.');
    const manifest = await approveImport(gameLibrary, source, approval);
    importTokens.delete(approval.token);
    await writeLaunchLog(gameLibrary, { type: 'import', gameId: manifest.id, result: 'approved' });
    return manifest.id;
  });
  ipcMain.handle('arcade:test-import', async (_event, approval: ImportApproval) => {
    if (activeGame) throw new Error('Another game is already running.');
    const source = approval && typeof approval === 'object' ? importTokens.get(approval.token) : undefined;
    if (!source) throw new Error('This import session expired. Choose the folder again.');
    const manifest = manifestFromApproval(approval);
    await ensureRuntimeReady(manifest);
    const preview = await inspectImportFolder(source);
    if (!preview.entries.includes(manifest.launch.entry)) throw new Error('The selected start file is not available.');
    const target = getPlatformTarget(manifest.id, process.platform, gameLibrary.games, process.arch, manifest, source);
    return await new Promise((resolve, reject) => {
      const child = spawn(target.executable, [...target.args], { shell: false, stdio: 'ignore' });
      activeGame = child;
      returnRequested = false;
      child.once('spawn', () => {
        mainWindow?.minimize();
        showGameChrome();
      });
      child.once('error', (error) => {
        activeGame = undefined;
        closeGameChrome();
        mainWindow?.restore();
        mainWindow?.show();
        reject(new Error(`The test could not start: ${error.message}`));
      });
      child.once('close', (exitCode, signal) => {
        activeGame = undefined;
        closeGameChrome();
        mainWindow?.restore();
        mainWindow?.show();
        mainWindow?.focus();
        resolve({ gameId: manifest.id, status: exitCode === 0 || returnRequested ? 'exited' : 'crashed', exitCode, signal });
      });
    });
  });
  ipcMain.handle('arcade:update-game', async (_event, gameId: unknown, changes: unknown) => {
    const manifest = await readManifest(gameLibrary, validateGameId(gameId));
    if (!changes || typeof changes !== 'object') throw new Error('Invalid game settings.');
    const update = changes as Record<string, unknown>;
    if (typeof update.favorite === 'boolean') manifest.state.favorite = update.favorite;
    if (typeof update.fullscreen === 'boolean') manifest.launch.settings.fullscreen = update.fullscreen;
    if (update.cycles === 'auto' || update.cycles === 'max' || (Number.isInteger(update.cycles) && Number(update.cycles) >= 300 && Number(update.cycles) <= 200_000)) {
      manifest.launch.settings.cycles = update.cycles as GameManifest['launch']['settings']['cycles'];
    }
    await writeManifest(gameLibrary, manifest);
    return true;
  });
  ipcMain.handle('arcade:get-library-health', async () => {
    const audit = await auditGameLibrary(gameLibrary);
    const runtimes = await Promise.all((['dos', 'amiga', 'n64', 'gamecube'] as const).map(async (platform) => {
      try { await access(emulatorExecutable(platform)); return [platform, true] as const; }
      catch { return [platform, false] as const; }
    }));
    return { root: gameLibrary.root, ...audit, runtimes: Object.fromEntries(runtimes), amigaFirmware: await hasAmigaFirmware() };
  });

  ipcMain.handle('arcade:launch-game', async (_event, gameId: unknown) => {
    if (activeGame) throw new Error('Another game is already running.');
    const validGameId = validateGameId(gameId);
    const manifest = await readManifest(gameLibrary, validGameId);
    await ensureRuntimeReady(manifest);
    const target = getPlatformTarget(validGameId, process.platform, gameLibrary.games, process.arch, manifest);
    await writeLaunchLog(gameLibrary, { type: 'launch', gameId: validGameId, result: 'starting' });

    return await new Promise((resolve, reject) => {
      const child = spawn(target.executable, [...target.args], {
        shell: false,
        stdio: 'ignore',
      });
      activeGame = child;
      returnRequested = false;
      let started = false;

      child.once('spawn', () => {
        started = true;
        mainWindow?.minimize();
        if (target.gameChrome) showGameChrome();
      });
      child.once('error', (error) => {
        activeGame = undefined;
        closeGameChrome();
        mainWindow?.restore();
        mainWindow?.show();
        mainWindow?.focus();
        void writeLaunchLog(gameLibrary, { type: 'launch', gameId: validGameId, result: 'failed', error: error.message });
        reject(new Error(`The approved program could not start: ${error.message}`));
      });
      child.once('close', async (exitCode, signal) => {
        activeGame = undefined;
        closeGameChrome();
        mainWindow?.restore();
        mainWindow?.show();
        mainWindow?.focus();
        if (!started) return;
        manifest.state.playCount += 1;
        manifest.state.lastPlayed = new Date().toISOString();
        await writeManifest(gameLibrary, manifest);
        await writeLaunchLog(gameLibrary, {
          type: 'launch',
          gameId: validGameId,
          result: exitCode === 0 || returnRequested ? 'exited' : 'crashed',
          exitCode,
          signal,
        });
        resolve({
          gameId: validGameId,
          status: exitCode === 0 || returnRequested ? 'exited' : 'crashed',
          exitCode,
          signal,
        });
      });
    });
  });

  await createWindow();
  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeGameChrome();
  activeGame?.kill();
});
