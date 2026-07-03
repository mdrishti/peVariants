const PLAYERS_KEY = 'variant-game-players-v1';
const CURRENT_KEY = 'variant-game-current-player-v1';

export function loadPlayers() {
  try {
    return JSON.parse(localStorage.getItem(PLAYERS_KEY)) || [];
  } catch {
    return [];
  }
}

function savePlayers(players) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function getCurrentPlayerId() {
  return localStorage.getItem(CURRENT_KEY);
}

export function setCurrentPlayerId(id) {
  if (id) localStorage.setItem(CURRENT_KEY, id);
  else localStorage.removeItem(CURRENT_KEY);
}

export function createPlayer(name) {
  const players = loadPlayers();
  const trimmed = name.trim();
  const existing = players.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    setCurrentPlayerId(existing.id);
    return existing;
  }
  const player = {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: trimmed,
    createdAt: new Date().toISOString(),
    geneChoice: null,
    scores: { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 },
  };
  players.push(player);
  savePlayers(players);
  setCurrentPlayerId(player.id);
  return player;
}

export function updatePlayer(id, patch) {
  const players = loadPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  players[idx] = { ...players[idx], ...patch };
  savePlayers(players);
  return players[idx];
}

export function addScore(id, levelKey, points) {
  const players = loadPlayers();
  const idx = players.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const scores = { ...players[idx].scores, [levelKey]: (players[idx].scores[levelKey] || 0) + points };
  players[idx] = { ...players[idx], scores };
  savePlayers(players);
  return players[idx];
}

export function totalScore(player) {
  if (!player) return 0;
  return Object.values(player.scores).reduce((a, b) => a + b, 0);
}
