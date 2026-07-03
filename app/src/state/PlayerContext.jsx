import { createContext, useContext, useState, useCallback } from 'react';
import { loadPlayers, getCurrentPlayerId, setCurrentPlayerId, createPlayer, updatePlayer, addScore, totalScore } from './players';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [players, setPlayers] = useState(() => loadPlayers());
  const [currentId, setCurrentId] = useState(() => getCurrentPlayerId());

  const player = players.find((p) => p.id === currentId) || null;

  const register = useCallback((name) => {
    if (!name.trim()) return;
    const p = createPlayer(name);
    setPlayers(loadPlayers());
    setCurrentId(p.id);
  }, []);

  const switchPlayer = useCallback((id) => {
    setCurrentPlayerId(id);
    setCurrentId(id);
  }, []);

  const setGeneChoice = useCallback((gene) => {
    if (!currentId) return;
    updatePlayer(currentId, { geneChoice: gene });
    setPlayers(loadPlayers());
  }, [currentId]);

  const awardPoints = useCallback((levelKey, points) => {
    if (!currentId) return null;
    const updated = addScore(currentId, levelKey, points);
    setPlayers(loadPlayers());
    return updated ? totalScore(updated) : null;
  }, [currentId]);

  return (
    <PlayerContext.Provider value={{ player, players, register, switchPlayer, setGeneChoice, awardPoints, totalScore }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
