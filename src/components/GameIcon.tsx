import { Car, Castle, Cat, Gem, Puzzle, Rocket } from 'lucide-react';
import type { Game } from '../api';

const icons = { car: Car, castle: Castle, cat: Cat, gem: Gem, puzzle: Puzzle, rocket: Rocket };

export function GameIcon({ game, size = 'medium' }: { game: Pick<Game, 'icon' | 'accent' | 'artwork'>; size?: 'small' | 'medium' | 'large' }) {
  const Icon = icons[game.icon];
  return (
    <div className={`game-icon game-icon--${game.accent} game-icon--${size}`} aria-hidden="true">
      {game.artwork ? <img src={game.artwork} alt="" /> : <Icon />}
    </div>
  );
}
