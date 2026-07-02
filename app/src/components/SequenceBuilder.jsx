import { useState, useMemo } from 'react';
import { shuffle, makeTiles } from '../utils/shuffle';

const NUCLEOTIDE_COLORS = { A: '#7fb3ff', T: '#ff9e9e', G: '#8ee6a8', C: '#ffd97f' };

/** Click-to-place tile builder: bank tiles on top, target slots below. */
export default function SequenceBuilder({ letters, target, onComplete, colorMap = NUCLEOTIDE_COLORS, tileLabel = (l) => l }) {
  const initialTiles = useMemo(() => shuffle(makeTiles(letters)), [letters]);
  const [bank, setBank] = useState(initialTiles);
  const [slots, setSlots] = useState(Array(letters.length).fill(null));
  const [checked, setChecked] = useState(false);

  function placeInFirstEmpty(tile) {
    const idx = slots.findIndex((s) => s === null);
    if (idx === -1) return;
    const next = [...slots];
    next[idx] = tile;
    setSlots(next);
    setBank(bank.filter((t) => t.id !== tile.id));
    setChecked(false);
  }

  function returnTile(idx) {
    const tile = slots[idx];
    if (!tile) return;
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
    setBank([...bank, tile]);
    setChecked(false);
  }

  const full = slots.every((s) => s !== null);
  const builtSequence = slots.map((s) => (s ? s.letter : '')).join('');
  const isCorrect = target ? builtSequence === target : null;

  function check() {
    setChecked(true);
    if (onComplete) onComplete(builtSequence, target ? builtSequence === target : null);
  }

  return (
    <div className="sequence-builder">
      <div className="tile-bank">
        {bank.map((tile) => (
          <button
            key={tile.id}
            className="tile"
            style={{ background: colorMap[tile.letter] || '#ddd' }}
            onClick={() => placeInFirstEmpty(tile)}
          >
            {tileLabel(tile.letter)}
          </button>
        ))}
        {bank.length === 0 && <span className="empty-hint">Bank empty</span>}
      </div>
      <div className="slots-row">
        {slots.map((tile, i) => (
          <button
            key={i}
            className={
              'slot' +
              (tile ? ' filled' : '') +
              (checked && tile && target ? (tile.letter === target[i] ? ' correct' : ' incorrect') : '')
            }
            style={tile ? { background: colorMap[tile.letter] || '#ddd' } : {}}
            onClick={() => returnTile(i)}
            title={`Position ${i + 1}`}
          >
            {tile ? tileLabel(tile.letter) : ''}
          </button>
        ))}
      </div>
      <div className="builder-controls">
        <span>{slots.filter(Boolean).length}/{letters.length} placed</span>
        <button disabled={!full} onClick={check}>Check sequence</button>
        {checked && target && (
          <span className={isCorrect ? 'result-ok' : 'result-bad'}>
            {isCorrect ? '✓ Matches expected sequence' : '✗ Not quite — compare with the reference'}
          </span>
        )}
      </div>
    </div>
  );
}
