import { useState, useMemo } from 'react';
import { shuffle, makeTiles, codonsOf } from '../utils/shuffle';
import codonData from '../data/codon_table.json';

const table = codonData.codon_table;

export default function CodonAssigner({ sequence, aminoLetters, onComplete }) {
  const codons = useMemo(() => codonsOf(sequence), [sequence]);
  const initialTiles = useMemo(() => shuffle(makeTiles(aminoLetters)), [aminoLetters]);
  const [bank, setBank] = useState(initialTiles);
  const [assigned, setAssigned] = useState(Array(codons.length).fill(null));
  const [checked, setChecked] = useState(false);

  function placeInFirstEmpty(tile) {
    const idx = assigned.findIndex((a) => a === null);
    if (idx === -1) return;
    const next = [...assigned];
    next[idx] = tile;
    setAssigned(next);
    setBank(bank.filter((t) => t.id !== tile.id));
    setChecked(false);
  }

  function unassign(idx) {
    const tile = assigned[idx];
    if (!tile) return;
    const next = [...assigned];
    next[idx] = null;
    setAssigned(next);
    setBank([...bank, tile]);
    setChecked(false);
  }

  const full = assigned.every((a) => a !== null);

  function check() {
    setChecked(true);
    const built = assigned.map((a) => a.letter).join('');
    const correctSeq = codons.map((c) => table[c]).join('');
    if (onComplete) onComplete(built, built === correctSeq);
  }

  return (
    <div className="codon-assigner">
      <p className="hint">Click an amino acid tile — it fills the next empty codon box automatically. Click a filled box to send it back.</p>
      <div className="tile-bank">
        {bank.map((tile) => (
          <button
            key={tile.id}
            className={'tile amino' + (tile.letter === '*' ? ' stop' : '')}
            onClick={() => placeInFirstEmpty(tile)}
          >
            {tile.letter === '*' ? 'STOP' : tile.letter}
          </button>
        ))}
        {bank.length === 0 && <span className="empty-hint">Bank empty</span>}
      </div>
      <div className="codon-row">
        {codons.map((codon, i) => {
          const correctAA = table[codon];
          const a = assigned[i];
          return (
            <div key={i} className="codon-col">
              <div className="codon-label">{codon}</div>
              <button
                className={
                  'slot amino-slot' +
                  (a ? ' filled' : '') +
                  (a?.letter === '*' ? ' stop' : '') +
                  (checked && a ? (a.letter === correctAA ? ' correct' : ' incorrect') : '')
                }
                onClick={() => unassign(i)}
              >
                {a ? (a.letter === '*' ? 'STOP' : a.letter) : ''}
              </button>
            </div>
          );
        })}
      </div>
      <div className="builder-controls">
        <span>{assigned.filter(Boolean).length}/{codons.length} assigned</span>
        <button disabled={!full} onClick={check}>Check amino acids</button>
      </div>
    </div>
  );
}
