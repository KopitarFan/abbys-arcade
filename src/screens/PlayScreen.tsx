import { Gamepad2, Heart, Music2, Play, Sparkles, Star } from 'lucide-react';
import type { Game, LibraryHealth } from '../api';
import { GameIcon } from '../components/GameIcon';
import { InputBadges } from '../components/InputBadges';

export function PlayScreen({ games, health, onLaunch, onFavorite }: {
  games: Game[];
  health: LibraryHealth | null;
  onLaunch: (game: Game) => void;
  onFavorite: (game: Game) => void;
}) {
  const featured = games[0];
  if (!featured) return <div className="empty-state"><h1>No games yet</h1><p>Ask a grown-up to add the first game.</p></div>;

  return (
    <section className="screen-content" aria-labelledby="play-title">
      <div className="welcome-row">
        <div><div className="eyebrow"><Sparkles aria-hidden="true" /> Welcome back, Abby</div><h1 id="play-title">Pick your next adventure!</h1></div>
        <div className="magic-strip" aria-label="Abby's favorites"><span><Heart fill="currentColor" aria-hidden="true" /> Magic</span><span><Music2 aria-hidden="true" /> Music</span><span><Gamepad2 aria-hidden="true" /> Games</span></div>
      </div>
      <div className="system-showcase" aria-label="Systems in your arcade">
        <div className="system-card system-card--dos"><span>DOS</span><strong>{health?.runtimes?.dos ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--amiga"><span>AMIGA</span><strong>{health?.runtimes?.amiga && health?.amigaFirmware ? 'Ready for adventures' : health?.runtimes?.amiga ? 'Needs grown-up setup' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--n64"><span>N64</span><strong>{health?.runtimes?.n64 ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--gamecube"><span>GAMECUBE</span><strong>{health?.runtimes?.gamecube ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--nes"><span>NES</span><strong>{health?.runtimes?.nes ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--snes"><span>SNES</span><strong>{health?.runtimes?.snes ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--atari"><span>ATARI 2600</span><strong>{health?.runtimes?.atari2600 ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--genesis"><span>GENESIS</span><strong>{health?.runtimes?.genesis ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--c64"><span>C64</span><strong>{health?.runtimes?.c64 ? 'Ready for adventures' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--apple2"><span>APPLE II</span><strong>{health?.runtimes?.apple2 && health?.apple2Firmware ? 'Ready for adventures' : health?.runtimes?.apple2 ? 'Needs grown-up setup' : 'Getting ready'}</strong></div>
        <div className="system-card system-card--apple2"><span>APPLE IIGS</span><strong>{health?.runtimes?.apple2gs && health?.apple2gsFirmware ? 'Ready for adventures' : health?.runtimes?.apple2gs ? 'Needs grown-up setup' : 'Getting ready'}</strong></div>
      </div>
      <article className="featured-game">
        <div className="featured-copy">
          <span className="platform-label">{featured.platform.toUpperCase()} · Continue playing</span>
          <h2>{featured.title}</h2>
          <p>{featured.progress ? `You were exploring the ${featured.progress.toLowerCase()}.` : featured.description}</p>
          <button className="primary-button" data-arcade-focus onClick={() => onLaunch(featured)}>
            <Play fill="currentColor" aria-hidden="true" /> Keep playing
          </button>
        </div>
        <GameIcon game={featured} size="large" />
      </article>
      <div className="section-heading"><h2><Star fill="currentColor" aria-hidden="true" /> Ready to play</h2><span>{games.length} installed</span></div>
      <div className="game-grid">
        {games.map((game) => (
          <article className="game-card" key={game.id}>
            <button className={`favorite-button ${game.favorite ? 'is-favorite' : ''}`} aria-label={`${game.favorite ? 'Remove' : 'Add'} ${game.title} ${game.favorite ? 'from' : 'to'} favorites`} onClick={() => onFavorite(game)}>
              <Heart fill={game.favorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
            <button className="game-card-launch" data-arcade-focus onClick={() => onLaunch(game)}>
              <GameIcon game={game} />
              <span className="game-card-copy">
                <strong>{game.title}</strong>
                <small>{game.lastPlayed ? `Played ${new Date(game.lastPlayed).toLocaleDateString()}` : game.platform.toUpperCase()}</small>
              </span>
              <InputBadges inputs={game.inputs} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
