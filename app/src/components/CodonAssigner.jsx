import { useState, useMemo } from 'react';
import { shuffle, makeTiles, codonsOf } from '../utils/shuffle';
import codonData from '../data/codon_table.json';

const table = codonData.codon_table;

export default function CodonAssigner({ sequence, aminoLetters, onComplete }) {
  const codons = useMemo(() => codonsOf(sequence), [sequence]);
  const initialTiles = useMemo(() => shuffle(makeTiles(aminoLetters)), [aminoLetters]);
  const [bank, setBank] = useState(initialTiles);
  const [selected, setSelected] = useState(null); // tile picked from bank
  const [assigned, setAssigned] = useState(Array(codons.length).fill(null));
  const [checked, setChecked] = useState(false);

  function pick(tile) {
    setSelected(tile);
  }

  function assign(idx) {
    if (assigned[idx]) {
      // unassign, return to bank
      setBank([...bank, assigned[idx]]);
      const next = [...assigned];
      next[idx] = null;
      setAssigned(next);
      setChecked(false);
      return;
    }
    if (!selected) return;
    const next = [...assigned];
    next[idx] = selected;
    setAssigned(next);
    setBank(bank.filter((t) => t.id !== selected.id));
    setSelected(null);
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
      <p className="hint">Click an amino acid tile, then click the codon box you want to assign it to.</p>
      <div className="tile-bank">
        {bank.map((tile) => (
          <button
            key={tile.id}
            className={'tile amino' + (tile.letter === '*' ? ' stop' : '') + (selected?.id === tile.id ? ' selected' : '')}
            onClick={() => pick(tile)}
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
                onClick={() => assign(i)}
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
