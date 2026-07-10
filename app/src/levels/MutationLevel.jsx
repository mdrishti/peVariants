import { useState, useMemo } from 'react';
import CodonTable from '../components/CodonTable';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import codonData from '../data/codon_table.json';

const table = codonData.codon_table;
const AA_OPTIONS = [...new Set(Object.values(table))].sort((a, b) => (a === '*' ? 1 : b === '*' ? -1 : a.localeCompare(b)));

const POINTS = { locate: 20, translate: 20, classify: 30 };

/** Splits a flat array of per-nucleotide items into groups of 3 (one per codon) for rendering. */
function groupByCodon(items) {
  const groups = [];
  for (let i = 0; i < items.length; i += 3) groups.push(items.slice(i, i + 3));
  return groups;
}

/** Shared UI for Level 2 (synonymous) and Level 3 (non-synonymous) SNP levels. */
export default function MutationLevel({ data, title, levelKey }) {
  const { player, awardPoints } = usePlayer();
  const [stage, setStage] = useState('locate'); // locate -> translate -> compare -> done
  const [pickedIndex, setPickedIndex] = useState(null);
  const [wrongPick, setWrongPick] = useState(null);
  const [pickedAA, setPickedAA] = useState(null);
  const [wrongAA, setWrongAA] = useState(null);
  const [banner, setBanner] = useState(null);

  if (!player) {
    return (
      <div className="level">
        <h2>{title}</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  if (!player.geneChoice) {
    return (
      <div className="level">
        <h2>{title}</h2>
        <p className="hint">Pick a gene in Level 1 first — this level continues with that same gene.</p>
      </div>
    );
  }

  const geneKey = player.geneChoice;
  const { reference, mutant } = data.genes[geneKey];

  const diffIndex = useMemo(() => {
    for (let i = 0; i < reference.nucleotide_sequence.length; i++) {
      if (reference.nucleotide_sequence[i] !== mutant.nucleotide_sequence[i]) return i;
    }
    return -1;
  }, [reference, mutant]);

  const aaDiffIndex = Math.floor(diffIndex / 3);
  const mutantCodon = mutant.codons[aaDiffIndex];
  const correctAA = table[mutantCodon];

  function award(key) {
    const total = awardPoints(levelKey, POINTS[key]);
    setBanner({ points: POINTS[key], total });
  }

  function clickNucleotide(i) {
    if (stage !== 'locate') return;
    if (i === diffIndex) {
      setPickedIndex(i);
      award('locate');
      setStage('translate');
    } else {
      setWrongPick(i);
      setTimeout(() => setWrongPick(null), 500);
    }
  }

  function pickAminoAcid(letter) {
    if (stage !== 'translate') return;
    if (letter === correctAA) {
      setPickedAA(letter);
      award('translate');
      setStage('compare');
    } else {
      setWrongAA(letter);
      setTimeout(() => setWrongAA(null), 500);
    }
  }

  return (
    <div className="level">
      <h2>{title}</h2>
      <p>
        You've been handed an unlabeled DNA sample based on <strong>{geneKey}</strong> — the game won't
        tell you up front whether it matches the reference exactly or carries a mutation. Compare it against
        the reference below to find out.
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />

      <div className="compare-panel">
        <h3>Step 1 — Find the changed nucleotide</h3>
        <p className="hint">
          {stage === 'locate'
            ? 'Click the nucleotide in YOUR SAMPLE row below that differs from the reference.'
            : 'Found it — the highlighted position is where the sample differs from the reference.'}
        </p>
        <div className="diff-view">
          <div className="diff-row">
            <span className="diff-label">Reference DNA</span>
            {groupByCodon(reference.nucleotide_sequence.split('')).map((codon, ci) => (
              <span key={ci} className="diff-codon-group">
                {codon.map((c, j) => {
                  const i = ci * 3 + j;
                  return <span key={i} className={'diff-nt' + (i === pickedIndex ? ' diff-highlight' : '')}>{c}</span>;
                })}
              </span>
            ))}
          </div>
          <div className="diff-row">
            <span className="diff-label">Your sample</span>
            {groupByCodon(mutant.nucleotide_sequence.split('')).map((codon, ci) => (
              <span key={ci} className="diff-codon-group">
                {codon.map((c, j) => {
                  const i = ci * 3 + j;
                  return (
                    <button
                      key={i}
                      className={
                        'diff-nt diff-nt-clickable' +
                        (i === pickedIndex ? ' diff-highlight' : '') +
                        (i === wrongPick ? ' diff-wrong' : '')
                      }
                      disabled={stage !== 'locate'}
                      onClick={() => clickNucleotide(i)}
                    >
                      {c}
                    </button>
                  );
                })}
              </span>
            ))}
          </div>
        </div>
        {pickedIndex !== null && (
          <p className="hint">
            DNA difference found at position {pickedIndex + 1} (codon #{aaDiffIndex + 1}): reference has{' '}
            <strong>{reference.nucleotide_sequence[pickedIndex]}</strong>, sample has{' '}
            <strong>{mutant.nucleotide_sequence[pickedIndex]}</strong>.
          </p>
        )}
      </div>

      {stage !== 'locate' && (
        <div className="compare-panel">
          <h3>Step 2 — Translate the changed codon</h3>
          <p className="hint">
            Codon #{aaDiffIndex + 1} in your sample is now <strong>{mutantCodon}</strong>. Use the codon table
            above to work out which amino acid it codes for, then fill in the blank below.
          </p>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference protein</span>
              {reference.amino_acid_sequence.split('').map((c, i) => (
                <span key={i} className={'diff-nt' + (i === aaDiffIndex ? ' diff-highlight' : '')}>{c}</span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Your protein</span>
              {reference.amino_acid_sequence.split('').map((_, i) => {
                if (i !== aaDiffIndex) {
                  return <span key={i} className="diff-nt">{mutant.amino_acid_sequence[i]}</span>;
                }
                return (
                  <span key={i} className={'diff-nt diff-blank' + (pickedAA ? ' diff-highlight' : '')}>
                    {pickedAA ? (pickedAA === '*' ? 'STOP' : pickedAA) : '?'}
                  </span>
                );
              })}
            </div>
          </div>

          {stage === 'translate' && (
            <div className="aa-picker">
              <p className="hint">Which amino acid does {mutantCodon} code for?</p>
              <div className="tile-bank">
                {AA_OPTIONS.map((letter) => (
                  <button
                    key={letter}
                    className={'tile amino' + (letter === '*' ? ' stop' : '') + (letter === wrongAA ? ' diff-wrong' : '')}
                    onClick={() => pickAminoAcid(letter)}
                  >
                    {letter === '*' ? 'STOP' : letter}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(stage === 'compare' || stage === 'done') && (
        <div className="compare-panel">
          <h3>Step 3 — What does this mean for the protein?</h3>
          <p className="hint">
            {reference.amino_acid_sequence === mutant.amino_acid_sequence
              ? 'The protein sequence is identical — this DNA change did not change the protein.'
              : `The protein differs at position ${aaDiffIndex + 1} — this DNA change did alter the protein.`}
          </p>
          {stage === 'compare' && (
            <button onClick={() => { award('classify'); setStage('done'); }}>Reveal the mutation type</button>
          )}
          {stage === 'done' && (
            <div className="mutation-reveal">
              <table className="detail-table">
                <tbody>
                  <tr><td>Codon changed</td><td>#{mutant.mutation_details.codon_number_1based}</td></tr>
                  <tr><td>Reference codon</td><td>{mutant.mutation_details.reference_codon} → {mutant.mutation_details.reference_amino_acid}</td></tr>
                  <tr><td>Mutant codon</td><td>{mutant.mutation_details.mutant_codon} → {mutant.mutation_details.mutant_amino_acid}</td></tr>
                  <tr><td>Change</td><td>{mutant.mutation_details.change}</td></tr>
                </tbody>
              </table>
              <p className="classification">{mutant.mutation_details.classification}</p>
            </div>
          )}
        </div>
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}
