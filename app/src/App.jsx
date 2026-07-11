import { useState } from 'react';
import './App.css';
import Level1 from './levels/Level1';
import Level2 from './levels/Level2';
import Level3 from './levels/Level3';
import Level4 from './levels/Level4';
import Level5 from './levels/Level5';
import Level6 from './levels/Level6';
import Level7 from './levels/Level7';
import Level8 from './levels/Level8';
import PlayerBar from './components/PlayerBar';
import { PlayerProvider } from './state/PlayerContext';

const LEVELS = [
  { id: 1, title: 'Build the Gene', Component: Level1 },
  { id: 2, title: 'Synonymous SNP', Component: Level2 },
  { id: 3, title: 'Non-synonymous SNP', Component: Level3 },
  { id: 4, title: 'Frameshift', Component: Level4 },
  { id: 5, title: 'Methylation ON/OFF', Component: Level5 },
  { id: 6, title: 'Block Substitution', Component: Level6 },
  { id: 7, title: 'Tandem Duplication', Component: Level7 },
  { id: 8, title: 'Inversion', Component: Level8 },
];

function App() {
  const [levelId, setLevelId] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('variant-explainer-theme') || 'classic');
  const active = LEVELS.find((l) => l.id === levelId);

  function toggleTheme() {
    const next = theme === 'classic' ? 'alignment' : 'classic';
    setTheme(next);
    localStorage.setItem('variant-explainer-theme', next);
  }

  return (
    <PlayerProvider>
      <div className={'app-shell theme-' + theme}>
        <header>
          <div className="header-row">
            <h1>🧬 Variant Explainer Game</h1>
            <button className="theme-toggle" onClick={toggleTheme} title="Switch visual style">
              {theme === 'classic' ? '🧬 Switch to alignment view' : '🎨 Switch to classic view'}
            </button>
          </div>
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

        <footer className="app-footer">
          © {new Date().getFullYear()} Disha Tandon. Licensed under GPL-3.0.
        </footer>
      </div>
    </PlayerProvider>
  );
}

export default App;
