import { Cat, Keyboard, Mic, Play, WandSparkles } from 'lucide-react';
import { useState } from 'react';

export function CreateScreen({ onListen }: { onListen: () => Promise<string> }) {
  const [idea, setIdea] = useState('Make a game where a purple cat collects stars on the moon, and the craters bounce you up.');
  const [listening, setListening] = useState(false);

  const listen = async () => {
    setListening(true);
    setIdea(await onListen());
    setListening(false);
  };

  return (
    <section className="screen-content creator-screen" aria-labelledby="create-title">
      <div className="eyebrow"><WandSparkles aria-hidden="true" /> Abby's game studio</div>
      <h1 id="create-title">Dream it. Make it. Play it!</h1>
      <div className="creator-layout">
        <div className="creator-prompt">
          <h2>What should we make?</h2>
          <p>Describe the hero, the goal, and where the adventure happens.</p>
          <label className="idea-box"><span className="sr-only">Game idea</span><textarea data-arcade-focus value={idea} onChange={(event) => setIdea(event.target.value)} /></label>
          <div className="creator-actions">
            <button className="primary-button" data-arcade-focus disabled={listening} onClick={listen}><Mic aria-hidden="true" /> {listening ? 'Listening…' : 'Hold to talk'}</button>
            <button className="secondary-button" data-arcade-focus onClick={() => document.querySelector<HTMLTextAreaElement>('.idea-box textarea')?.focus()}><Keyboard aria-hidden="true" /> Type instead</button>
          </div>
        </div>
        <div className="game-preview" aria-label="Moon Cat preview">
          <div className="moon"><span className="star star-one">✦</span><span className="star star-two">✦</span><Cat aria-hidden="true" /></div>
          <h2>Moon Cat</h2>
          <button className="secondary-button" data-arcade-focus><Play fill="currentColor" aria-hidden="true" /> Try tiny preview</button>
        </div>
      </div>
      <ol className="maker-steps" aria-label="Game creation steps"><li className="is-done">Idea</li><li className="is-current">Build a tiny version</li><li>Play-test</li><li>Save</li></ol>
      <p className="prototype-note">Prototype mode uses a safe, pretend builder. Real generation arrives in the game-creator milestone.</p>
    </section>
  );
}
