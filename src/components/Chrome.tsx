import { Gamepad2, Heart, House, Library, LockKeyhole, Music2, Palette, Sparkles, Star, Wifi, WifiOff } from 'lucide-react';
import type { ControllerInfo } from '../api';
import type { Screen } from '../App';

const items: Array<{ id: Screen; label: string; Icon: typeof House }> = [
  { id: 'play', label: 'Play', Icon: House },
  { id: 'library', label: 'Find games', Icon: Library },
  { id: 'create', label: 'My games', Icon: Palette },
  { id: 'parent', label: 'Grown-ups', Icon: LockKeyhole },
];

export function Header({ online, controllers }: { online: boolean; controllers: ControllerInfo[] }) {
  const controller = controllers.find((item) => item.connected);
  return (
    <header className="app-header">
      <div className="wordmark">
        <span className="wordmark-mark" aria-hidden="true"><Sparkles /></span>
        <span>Abby's Arcade</span>
        <span className="abby-badge"><Heart aria-hidden="true" /> Abby mode</span>
      </div>
      <div className="system-pills">
        <span className={`system-pill ${controller ? 'is-good' : ''}`}>
          <Gamepad2 aria-hidden="true" />
          {controller ? controller.name : 'No controller'}
        </span>
        <span className={`system-pill ${online ? 'is-good' : 'is-warning'}`}>
          {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
          {online ? 'Online' : 'Offline'}
        </span>
        <span className="avatar" aria-label="Abby profile">A<span aria-hidden="true">♥</span></span>
      </div>
    </header>
  );
}

export function WhimsyBackdrop() {
  return (
    <div className="whimsy-backdrop" aria-hidden="true">
      <span className="floaty floaty--one"><Star fill="currentColor" /></span>
      <span className="floaty floaty--two"><Music2 /></span>
      <span className="floaty floaty--three"><Heart fill="currentColor" /></span>
      <span className="floaty floaty--four"><Sparkles /></span>
      <span className="rainbow-swoop" />
      <span className="cloud cloud--one" />
      <span className="cloud cloud--two" />
    </div>
  );
}

export function Navigation({ active, onNavigate }: { active: Screen; onNavigate: (screen: Screen) => void }) {
  return (
    <nav className="main-nav" aria-label="Main navigation">
      {items.map(({ id, label, Icon }) => (
        <button
          className={`nav-item ${active === id ? 'is-active' : ''}`}
          data-arcade-focus
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={active === id ? 'page' : undefined}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function ControlHints({ profile = 'playstation' }: { profile?: ControllerInfo['profile'] }) {
  const labels = profile === 'playstation' ? { confirm: '✕ Choose', back: '○ Back' } : profile === 'xbox' ? { confirm: 'A Choose', back: 'B Back' } : { confirm: 'Choose', back: 'Back' };
  return (
    <footer className="control-hints">
      <span>{labels.confirm}</span>
      <span>{labels.back}</span>
      <span>Arrow keys also work</span>
    </footer>
  );
}
