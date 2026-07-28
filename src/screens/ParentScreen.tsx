import { AlertTriangle, CheckCircle2, Clock3, Database, FolderOpen, Gamepad2, LockKeyhole, Mic, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { arcadeApi, type Game, type ImportApproval, type ImportPreview, type LibraryHealth } from '../api';

const defaultApproval = (preview: ImportPreview): ImportApproval => ({
  token: preview.token,
  id: preview.suggestedId,
  title: preview.suggestedTitle,
  platform: preview.suggestedPlatform,
  description: `A ${preview.suggestedPlatform.toUpperCase()} adventure from the parent library.`,
  entry: preview.entries[0] ?? '',
  inputs: preview.suggestedPlatform === 'dos' ? ['keyboard'] : ['controller'],
  accent: 'violet',
  icon: 'rocket',
  fullscreen: true,
  cycles: 'auto',
  machine: 'svga_s3',
  amigaModel: 'A500',
  videoPlugin: 'glide64mk2',
  videoBackend: 'Metal',
});

export function ParentScreen({ freeSpaceGb, games, onGamesChanged }: {
  freeSpaceGb: number;
  games: Game[];
  onGamesChanged: () => Promise<void>;
}) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [approval, setApproval] = useState<ImportApproval | null>(null);
  const [health, setHealth] = useState<LibraryHealth | null>(null);
  const [message, setMessage] = useState('');
  const unlock = () => { if (pin === '2468') setUnlocked(true); };

  useEffect(() => {
    if (unlocked) void arcadeApi.getLibraryHealth().then(setHealth);
  }, [unlocked, games.length]);

  const chooseFolder = async () => {
    setMessage('');
    try {
      const next = await arcadeApi.chooseImportFolder();
      if (!next) return;
      setPreview(next);
      setApproval(defaultApproval(next));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The folder could not be inspected.');
    }
  };

  const install = async () => {
    if (!approval) return;
    try {
      await arcadeApi.approveImport(approval);
      await onGamesChanged();
      setHealth(await arcadeApi.getLibraryHealth());
      setMessage(`${approval.title} is installed and ready.`);
      setPreview(null);
      setApproval(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The game could not be installed.');
    }
  };
  const testLaunch = async () => {
    if (!approval) return;
    try {
      setMessage(`Testing ${approval.title}…`);
      const result = await arcadeApi.testImport(approval);
      setMessage(result.status === 'crashed' ? 'The test stopped unexpectedly. Check the start file and settings.' : 'Test complete. If it played correctly, approve the installation.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The test could not start.');
    }
  };

  if (!unlocked) {
    return (
      <section className="screen-content parent-lock" aria-labelledby="parent-title">
        <div className="lock-orb"><LockKeyhole aria-hidden="true" /></div>
        <h1 id="parent-title">Grown-ups only</h1>
        <p>Enter the demo PIN to open settings.</p>
        <label className="pin-field"><span>PIN</span><input data-arcade-focus inputMode="numeric" type="password" maxLength={4} value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} onKeyDown={(event) => event.key === 'Enter' && unlock()} /></label>
        <button className="primary-button" data-arcade-focus onClick={unlock}>Unlock</button>
        <small>Prototype PIN: 2468</small>
      </section>
    );
  }

  return (
    <section className="screen-content" aria-labelledby="settings-title">
      <div className="eyebrow"><ShieldCheck aria-hidden="true" /> Parent mode</div>
      <div className="title-row"><div><h1 id="settings-title">Arcade settings</h1><p className="settings-intro">Install DOS folders, tune games, and check the library.</p></div>
        <button className="secondary-button" data-arcade-focus onClick={() => { setUnlocked(false); setPin(''); }}><LockKeyhole aria-hidden="true" /> Lock</button>
      </div>

      <div className="library-health">
        <Database aria-hidden="true" />
        <div><strong>{health?.valid ?? games.length} healthy games</strong><small>{health?.root ?? `${freeSpaceGb} GB available`}</small></div>
        <span className={health?.issues.length ? 'health-warning' : 'health-good'}>
          {health?.issues.length ? <><AlertTriangle /> {health.issues.length} issue{health.issues.length === 1 ? '' : 's'}</> : <><CheckCircle2 /> Library healthy</>}
        </span>
      </div>
      <div className="runtime-strip" aria-label="Emulator readiness">
        <span className={health?.runtimes?.dos ? 'is-ready' : 'is-missing'}><strong>DOS</strong>{health?.runtimes?.dos ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.amiga && health?.amigaFirmware ? 'is-ready' : 'is-warning'}><strong>Amiga</strong>{!health?.runtimes?.amiga ? 'Runtime missing' : health?.amigaFirmware ? 'Ready' : 'Add Kickstart ROM'}</span>
        <span className={health?.runtimes?.n64 ? 'is-ready' : 'is-missing'}><strong>N64</strong>{health?.runtimes?.n64 ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.gamecube ? 'is-ready' : 'is-missing'}><strong>GameCube</strong>{health?.runtimes?.gamecube ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.nes ? 'is-ready' : 'is-missing'}><strong>NES</strong>{health?.runtimes?.nes ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.snes ? 'is-ready' : 'is-missing'}><strong>SNES</strong>{health?.runtimes?.snes ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.atari2600 ? 'is-ready' : 'is-missing'}><strong>Atari 2600</strong>{health?.runtimes?.atari2600 ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.genesis ? 'is-ready' : 'is-missing'}><strong>Genesis</strong>{health?.runtimes?.genesis ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.c64 ? 'is-ready' : 'is-missing'}><strong>C64</strong>{health?.runtimes?.c64 ? 'Ready' : 'Runtime missing'}</span>
        <span className={health?.runtimes?.apple2 && health?.apple2Firmware ? 'is-ready' : 'is-warning'}><strong>Apple II</strong>{!health?.runtimes?.apple2 ? 'Runtime missing' : health?.apple2Firmware ? 'Ready' : 'Add Apple IIe ROMs'}</span>
        <span className={health?.runtimes?.apple2gs && health?.apple2gsFirmware ? 'is-ready' : 'is-warning'}><strong>Apple IIgs</strong>{!health?.runtimes?.apple2gs ? 'Runtime missing' : health?.apple2gsFirmware ? 'Ready' : 'Add IIgs ROM 03'}</span>
      </div>

      <div className="parent-workspace">
        <section className="parent-panel">
          <div className="panel-heading"><div><span className="eyebrow"><FolderOpen /> Import</span><h2>Add a game</h2></div><button className="primary-button" onClick={chooseFolder}>Choose folder</button></div>
          {!preview && <div className="import-empty"><FolderOpen /><p>Choose a folder containing one supported game file. Nothing is copied until you approve it.</p></div>}
          {preview && approval && (
            <div className="import-form">
              <div className="import-summary"><strong>{preview.folderName}</strong><span>{preview.fileCount} files · {preview.sizeMb} MB</span></div>
              {preview.warnings.map((warning) => <p className="form-warning" key={warning}><AlertTriangle /> {warning}</p>)}
              <div className="form-grid">
                <label><span>Title</span><input value={approval.title} onChange={(e) => setApproval({ ...approval, title: e.target.value })} /></label>
                <label><span>Game ID</span><input value={approval.id} onChange={(e) => setApproval({ ...approval, id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></label>
                <label className="form-wide"><span>Description</span><input value={approval.description} onChange={(e) => setApproval({ ...approval, description: e.target.value })} /></label>
                <label><span>Platform</span><select value={approval.platform} onChange={(e) => {
                  const platform = e.target.value as ImportApproval['platform'];
                  setApproval({ ...approval, platform, entry: preview.candidates[platform][0] ?? '', inputs: platform === 'dos' ? ['keyboard'] : ['controller'] });
                }}><option value="dos">DOS</option><option value="amiga">Amiga</option><option value="n64">Nintendo 64</option><option value="gamecube">GameCube</option><option value="nes">NES</option><option value="snes">SNES</option><option value="atari2600">Atari 2600</option><option value="genesis">Genesis</option><option value="c64">Commodore 64</option><option value="apple2">Apple II</option><option value="apple2gs">Apple IIgs</option></select></label>
                <label><span>Start file</span><select value={approval.entry} onChange={(e) => setApproval({ ...approval, entry: e.target.value })}>{preview.candidates[approval.platform].map((entry) => <option key={entry}>{entry}</option>)}</select></label>
                {approval.platform === 'dos' && <label><span>CPU speed</span><select value={approval.cycles} onChange={(e) => setApproval({ ...approval, cycles: e.target.value as 'auto' | 'max' })}><option value="auto">Automatic</option><option value="max">Maximum</option></select></label>}
                {approval.platform === 'amiga' && <label><span>Amiga model</span><select value={approval.amigaModel} onChange={(e) => setApproval({ ...approval, amigaModel: e.target.value as ImportApproval['amigaModel'] })}><option>A500</option><option>A500+</option><option>A600</option><option>A1200</option></select></label>}
                {approval.platform === 'n64' && <label><span>Video renderer</span><select value={approval.videoPlugin} onChange={(e) => setApproval({ ...approval, videoPlugin: e.target.value as ImportApproval['videoPlugin'] })}><option value="glide64mk2">Glide64</option><option value="rice">Rice</option></select></label>}
                {approval.platform === 'gamecube' && <label><span>Video renderer</span><select value={approval.videoBackend} onChange={(e) => setApproval({ ...approval, videoBackend: e.target.value as ImportApproval['videoBackend'] })}><option value="Metal">Metal</option><option value="Vulkan">Vulkan</option><option value="OGL">OpenGL</option></select></label>}
                <label className="check-label"><input type="checkbox" checked={approval.fullscreen} onChange={(e) => setApproval({ ...approval, fullscreen: e.target.checked })} /> Fullscreen</label>
                <label className="check-label"><input type="checkbox" checked={approval.inputs.includes('controller')} onChange={(e) => setApproval({ ...approval, inputs: e.target.checked ? [...approval.inputs, 'controller'] : approval.inputs.filter((input) => input !== 'controller') })} /> Controller</label>
              </div>
              <div className="import-actions">
                <button className="secondary-button" disabled={!approval.entry || preview.warnings.length > 0} onClick={testLaunch}>Test launch</button>
                <button className="primary-button" disabled={!approval.entry || preview.warnings.length > 0} onClick={install}>Approve and install</button>
              </div>
            </div>
          )}
          {message && <p className="parent-message" role="status">{message}</p>}
        </section>

        <section className="parent-panel">
          <div className="panel-heading"><div><span className="eyebrow"><SlidersHorizontal /> Per-game</span><h2>Game settings</h2></div></div>
          <div className="managed-games">
            {games.map((game) => (
              <article className="managed-game" key={game.id}>
                <div><strong>{game.title}</strong><small>{game.platform.toUpperCase()} · played {game.playCount ?? 0} times</small></div>
                <label><input type="checkbox" checked={Boolean(game.favorite)} onChange={async (e) => { await arcadeApi.updateGame(game.id, { favorite: e.target.checked }); await onGamesChanged(); }} /> Favorite</label>
                <label><input type="checkbox" checked={game.emulatorSettings?.fullscreen ?? true} onChange={async (e) => { await arcadeApi.updateGame(game.id, { fullscreen: e.target.checked }); await onGamesChanged(); }} /> Fullscreen</label>
              </article>
            ))}
            {!games.length && <p className="prototype-note">No valid games are installed yet.</p>}
          </div>
        </section>
      </div>

      <div className="settings-grid compact-settings">
        <button className="setting-card" data-arcade-focus><Gamepad2 /><span><strong>Controllers</strong><small>Test buttons and profiles</small></span></button>
        <button className="setting-card" data-arcade-focus><Clock3 /><span><strong>Play time</strong><small>No limit configured</small></span></button>
        <button className="setting-card" data-arcade-focus><Mic /><span><strong>Speech</strong><small>Push-to-talk enabled</small></span></button>
      </div>
    </section>
  );
}
