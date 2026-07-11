import { useState, useMemo } from 'react';
import CodonTable from '../components/CodonTable';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import codonData from '../data/codon_table.json';
import { baseClass } from '../utils/bases';

const table = codonData.codon_table;
const AA_OPTIONS = [...new Set(Object.values(table))].sort((a, b) => (a === '*' ? 1 : b === '*' ? -1 : a.localeCompare(b)));

const POINTS = { locate: 20, translate: 20, classify: 30 };

/** Splits a flat array of per-nucleotide items into groups of 3 (one per codon) for rendering. */
function groupByCodon(items) {
  const groups = [];
  for (let i = 0; i < items.length; i += 3) groups.push(items.slice(i, i + 3));
  return groups;
}

/**
 * Shared UI for Level 2 (synonymous SNP), Level 3 (non-synonymous SNP) and Level 6 (a
 * multi-nucleotide block substitution). All three are the same shape: some set of nucleotide
 * positions differ from the reference, all within ONE codon, and the player finds every
 * differing position before that single codon gets re-translated. Levels 2/3 just happen to
 * have a set of size 1; Level 6's set has size 2 (an MNV) - no other code path needed.
 */
export default function MutationLevel({ data, title, levelKey }) {
  const { player, awardPoints } = usePlayer();
  const [stage, setStage] = useState('locate'); // locate -> translate -> compare -> done
  const [foundPositions, setFoundPositions] = useState([]);
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
  const details = mutant.block_substitution_details || mutant.mutation_details;
  const multi = details.nucleotide_positions_1based_in_fragment
    ? details.nucleotide_positions_1based_in_fragment.length > 1
    : false;

  const diffIndices = useMemo(() => {
    const found = [];
    for (let i = 0; i < reference.nucleotide_sequence.length; i++) {
      if (reference.nucleotide_sequence[i] !== mutant.nucleotide_sequence[i]) found.push(i);
    }
    return found;
  }, [reference, mutant]);

  const aaDiffIndex = Math.floor(diffIndices[0] / 3);
  const mutantCodon = mutant.codons[aaDiffIndex];
  const correctAA = table[mutantCodon];
  const allFound = foundPositions.length === diffIndices.length;

  function award(key) {
    const total = awardPoints(levelKey, POINTS[key]);
    setBanner({ points: POINTS[key], total });
  }

  function clickNucleotide(i) {
    if (stage !== 'locate' || foundPositions.includes(i)) return;
    if (diffIndices.includes(i)) {
      const next = [...foundPositions, i];
      setFoundPositions(next);
      if (next.length === diffIndices.length) {
        award('locate');
        setStage('translate');
      }
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
        {multi && ' This sample has more than one nucleotide changed together, in the same codon — find all of them before moving on.'}
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />

      <div className="compare-panel">
        <h3>Step 1 — Find the changed nucleotide{multi ? 's' : ''}</h3>
        <p className="hint">
          {stage === 'locate'
            ? `Click the nucleotide${multi ? `s (${foundPositions.length}/${diffIndices.length} found)` : ''} in YOUR SAMPLE row below that differ${multi ? '' : 's'} from the reference.`
            : `Found ${multi ? 'them' : 'it'} — the highlighted position${multi ? 's are' : ' is'} where the sample differs from the reference.`}
        </p>
        <div className="diff-view">
          <div className="diff-row">
            <span className="diff-label">Reference DNA</span>
            {groupByCodon(reference.nucleotide_sequence.split('')).map((codon, ci) => (
              <span key={ci} className="diff-codon-group">
                {codon.map((c, j) => {
                  const i = ci * 3 + j;
                  const isFound = foundPositions.includes(i) || (allFound && diffIndices.includes(i));
                  return <span key={i} className={'diff-nt ' + baseClass(c) + (isFound ? ' diff-highlight' : '')}>{c}</span>;
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
                  const isFound = foundPositions.includes(i) || (allFound && diffIndices.includes(i));
                  return (
                    <button
                      key={i}
                      className={
                        'diff-nt diff-nt-clickable ' + baseClass(c) +
                        (isFound ? ' diff-highlight' : '') +
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
        {foundPositions.length > 0 && (
          <p className="hint">
            DNA difference{multi ? 's' : ''} found at position{multi ? 's' : ''}{' '}
            {[...foundPositions].sort((a, b) => a - b).map((i) => i + 1).join(', ')} (codon #{aaDiffIndex + 1}): reference has{' '}
            <strong>{[...foundPositions].sort((a, b) => a - b).map((i) => reference.nucleotide_sequence[i]).join('')}</strong>, sample has{' '}
            <strong>{[...foundPositions].sort((a, b) => a - b).map((i) => mutant.nucleotide_sequence[i]).join('')}</strong>.
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
                  <tr><td>Codon changed</td><td>#{details.codon_number_1based}</td></tr>
                  <tr><td>Reference codon</td><td>{details.reference_codon} → {details.reference_amino_acid}</td></tr>
                  <tr><td>Mutant codon</td><td>{details.mutant_codon} → {details.mutant_amino_acid}</td></tr>
                  <tr><td>Change</td><td>{details.change}</td></tr>
                </tbody>
              </table>
              <p className="classification">{details.classification}</p>
            </div>
          )}
        </div>
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}
