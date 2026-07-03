import { useState } from 'react';
import { usePlayer } from '../state/PlayerContext';
import { totalScore } from '../state/players';

export default function PlayerBar() {
  const { player, players, register, switchPlayer } = usePlayer();
  const [nameInput, setNameInput] = useState('');
  const [view, setView] = useState('me'); // 'me' | 'all'

  function submit(e) {
    e.preventDefault();
    if (nameInput.trim()) {
      register(nameInput);
      setNameInput('');
    }
  }

  const sorted = [...players].sort((a, b) => totalScore(b) - totalScore(a));

  return (
    <div className="player-bar">
      {!player && (
        <form onSubmit={submit} className="player-register-form">
          <span>New here? Register a name to start earning points:</span>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
          />
          <button type="submit">Register</button>
          {players.length > 0 && (
            <select onChange={(e) => e.target.value && switchPlayer(e.target.value)} defaultValue="">
              <option value="" disabled>Or switch to existing player…</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </form>
      )}

      {player && (
        <div className="player-active-row">
          <span>
            Playing as <strong>{player.name}</strong> — <strong>{totalScore(player)}</strong> pts total
          </span>
          <select onChange={(e) => e.target.value && switchPlayer(e.target.value)} value={player.id}>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="toggle" onClick={() => switchPlayer(null)}>+ New player</button>
          <button className={'toggle' + (view === 'me' ? ' selected' : '')} onClick={() => setView('me')}>My scores</button>
          <button className={'toggle' + (view === 'all' ? ' selected' : '')} onClick={() => setView('all')}>Leaderboard</button>
        </div>
      )}

      {player && view === 'me' && (
        <table className="detail-table score-table">
          <thead><tr><th>Level</th><th>Points</th></tr></thead>
          <tbody>
            {Object.entries(player.scores).map(([level, pts]) => (
              <tr key={level}><td>{level.replace('level', 'Level ')}</td><td>{pts}</td></tr>
            ))}
          </tbody>
        </table>
      )}

      {player && view === 'all' && (
        <table className="detail-table score-table">
          <thead><tr><th>#</th><th>Name</th><th>Total points</th></tr></thead>
          <tbody>
            {sorted.map((p, i) => (
              <tr key={p.id} className={p.id === player.id ? 'leaderboard-me' : ''}>
                <td>{i + 1}</td><td>{p.name}</td><td>{totalScore(p)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
