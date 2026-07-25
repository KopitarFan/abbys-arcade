import { useEffect, useMemo, useState } from 'react';
import { arcadeApi, type CatalogItem, type Game, type LibraryHealth, type SystemStatus } from './api';
import { ControlHints, Header, Navigation, WhimsyBackdrop } from './components/Chrome';
import { useArcadeNavigation } from './hooks/useArcadeNavigation';
import { useDesktopControllers } from './hooks/useDesktopControllers';
import { CreateScreen } from './screens/CreateScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ParentScreen } from './screens/ParentScreen';
import { PlayScreen } from './screens/PlayScreen';

export type Screen = 'play' | 'library' | 'create' | 'parent';

const emptyStatus: SystemStatus = { online: false, freeSpaceGb: 0, controllers: [] };

export default function App() {
  const [screen, setScreen] = useState<Screen>('play');
  const [games, setGames] = useState<Game[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [status, setStatus] = useState<SystemStatus>(emptyStatus);
  const [libraryHealth, setLibraryHealth] = useState<LibraryHealth | null>(null);
  const [notice, setNotice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  useArcadeNavigation(() => setScreen('play'));
  useDesktopControllers(setStatus);

  useEffect(() => {
    Promise.all([arcadeApi.listGames(), arcadeApi.listCatalog(), arcadeApi.getSystemStatus(), arcadeApi.getLibraryHealth()])
      .then(([nextGames, nextCatalog, nextStatus, nextHealth]) => {
        setGames(nextGames);
        setCatalog(nextCatalog);
        setStatus(nextStatus);
        setLibraryHealth(nextHealth);
      })
      .catch(() => setNotice('The arcade could not finish loading. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const profile = useMemo(() => status.controllers.find((item) => item.connected)?.profile, [status]);
  const refreshGames = async () => setGames(await arcadeApi.listGames());
  const launch = async (game: Game) => {
    setNotice(`Starting ${game.title}…`);
    try {
      const result = await arcadeApi.launchGame(game.id);
      if (result.status === 'simulated') setNotice(`${game.title} launch simulated.`);
      else if (result.status === 'exited') setNotice(`Welcome back! ${game.title} closed normally.`);
      else setNotice(`${game.title} stopped unexpectedly (exit code ${result.exitCode ?? 'unknown'}).`);
      await refreshGames();
    }
    catch (error) { setNotice(error instanceof Error ? error.message : 'The game could not start.'); }
  };
  const toggleFavorite = async (game: Game) => {
    await arcadeApi.updateGame(game.id, { favorite: !game.favorite });
    await refreshGames();
  };
  const install = async (item: CatalogItem) => {
    setCatalog((current) => current.map((entry) => entry.id === item.id ? { ...entry, installState: 'installing', installProgress: 10 } : entry));
    try { await arcadeApi.installApprovedGame(item.id); setCatalog(await arcadeApi.listCatalog()); setNotice(`${item.title} is ready to play.`); }
    catch { setCatalog((current) => current.map((entry) => entry.id === item.id ? { ...entry, installState: 'failed' } : entry)); setNotice(`${item.title} could not be installed.`); }
  };

  return (
    <div className="app-shell" data-theme="abby">
      <WhimsyBackdrop />
      <Header online={status.online} controllers={status.controllers} />
      <Navigation active={screen} onNavigate={setScreen} />
      <main>
        {loading ? <div className="loading-state"><span className="loader" /><p>Opening the arcade…</p></div> : (
          <>
            {screen === 'play' && <PlayScreen games={games} health={libraryHealth} onLaunch={launch} onFavorite={toggleFavorite} />}
            {screen === 'library' && <LibraryScreen items={catalog} onInstall={install} />}
            {screen === 'create' && <CreateScreen onListen={() => arcadeApi.startSpeechCapture()} />}
            {screen === 'parent' && <ParentScreen freeSpaceGb={status.freeSpaceGb} games={games} onGamesChanged={refreshGames} />}
          </>
        )}
      </main>
      {notice && <div className="toast" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></div>}
      <ControlHints profile={profile} />
    </div>
  );
}
