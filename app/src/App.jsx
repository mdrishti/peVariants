import { useState } from 'react';
import './App.css';
import Level1 from './levels/Level1';
import Level2 from './levels/Level2';
import Level3 from './levels/Level3';
import Level4 from './levels/Level4';
import Level5 from './levels/Level5';
import PlayerBar from './components/PlayerBar';
import { PlayerProvider } from './state/PlayerContext';

const LEVELS = [
  { id: 1, title: 'Build the Gene', Component: Level1 },
  { id: 2, title: 'Synonymous SNP', Component: Level2 },
  { id: 3, title: 'Non-synonymous SNP', Component: Level3 },
  { id: 4, title: 'Frameshift', Component: Level4 },
  { id: 5, title: 'Methylation ON/OFF', Component: Level5 },
];

function App() {
  const [levelId, setLevelId] = useState(null);
  const active = LEVELS.find((l) => l.id === levelId);

  return (
    <PlayerProvider>
      <div className="app-shell">
        <header>
          <h1>🧬 Variant Explainer Game</h1>
          <p className="subtitle">Learn how DNA changes affect proteins — using real Campylobacter jejuni genes</p>
        </header>

        <PlayerBar />

        <nav className="level-nav">
          {LEVELS.map((l) => (
            <button
              key={l.id}
              className={'level-btn' + (levelId === l.id ? ' active' : '')}
              onClick={() => setLevelId(l.id)}
            >
              {l.id}. {l.title}
            </button>
          ))}
        </nav>

        <main key={levelId}>
          {active ? <active.Component /> : <p className="pick-hint">Pick a level above to start.</p>}
        </main>
      </div>
    </PlayerProvider>
  );
}

export default App;
