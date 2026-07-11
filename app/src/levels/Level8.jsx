import { useState } from 'react';
import CodonTable from '../components/CodonTable';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level8.json';
import { baseClass } from '../utils/bases';
import { groupByCodon } from '../utils/indelAlignment';
import { complementBase } from '../utils/dna';

const BASES = ['A', 'C', 'G', 'T'];
const PRIMER_BASES = ['A', 'T', 'C', 'G'];

export default function Level8() {
  const { player, awardPoints } = usePlayer();
  const [stage, setStage] = useState('primer'); // primer -> construct -> compare -> done
  const [primerIndex, setPrimerIndex] = useState(0);
  const [wrongPrimerPick, setWrongPrimerPick] = useState(null);
  const [banner, setBanner] = useState(null);

  if (!player) {
    return (
      <div className="level">
        <h2>Level 8 — Flipped Around (Inversion)</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  if (!player.geneChoice) {
    return (
      <div className="level">
        <h2>Level 8 — Flipped Around (Inversion)</h2>
        <p className="hint">Pick a gene in Level 1 first — this level continues with that same gene.</p>
      </div>
    );
  }

  const geneKey = player.geneChoice;
  const { reference, mutant, inversion_details: inv } = data.genes[geneKey];
  const [codonA, codonB] = inv.affected_codon_numbers_1based.map((n) => n - 1);

  function award(points) {
    const total = awardPoints('level8', points);
    setBanner({ points, total });
  }

  function pickPrimerComplement(letter) {
    if (letter === complementBase(PRIMER_BASES[primerIndex])) {
      if (primerIndex + 1 < PRIMER_BASES.length) {
        setPrimerIndex(primerIndex + 1);
      } else {
        award(10);
        setStage('construct');
      }
    } else {
      setWrongPrimerPick(letter);
      setTimeout(() => setWrongPrimerPick(null), 500);
    }
  }

  return (
    <div className="level">
      <h2>Level 8 — Flipped Around (Inversion)</h2>
      <p>
        A 6-nucleotide segment of <strong>{geneKey}</strong> has been flipped end-to-end in place — an inversion.
        Because DNA is double-stranded, what actually appears there is the segment's reverse complement, not just
        its letters reversed.
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />

      {stage === 'primer' && (
        <div className="compare-panel">
          <h3>Step 1 — Base-pairing primer</h3>
          <p className="hint">
            DNA's two strands always pair the same way: A with T, and C with G. Which base pairs with the one shown?
          </p>
          <div className="quiz-row">
            <span>What pairs with <strong className={baseClass(PRIMER_BASES[primerIndex])} style={{ fontSize: '1.2rem' }}>{PRIMER_BASES[primerIndex]}</strong>?</span>
          </div>
          <div className="tile-bank">
            {BASES.map((letter) => (
              <button
                key={letter}
                className={'tile ' + baseClass(letter) + (letter === wrongPrimerPick ? ' diff-wrong' : '')}
                onClick={() => pickPrimerComplement(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
          <p className="hint">{primerIndex}/{PRIMER_BASES.length} paired correctly so far.</p>
        </div>
      )}

      {stage !== 'primer' && (
        <ReferenceStrip label={`Reference sequence — ${geneKey}`} sequence={reference.nucleotide_sequence} />
      )}

      {stage === 'construct' && (
        <div className="compare-panel">
          <h3>Step 2 — Build the reverse complement</h3>
          <p className="hint">
            Here's the original 6-letter segment from the reference, read normally (5'→3'):
          </p>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Original segment</span>
              {inv.original_segment.split('').map((c, i) => (
                <span key={i} className={'diff-nt ' + baseClass(c)}>{c}</span>
              ))}
            </div>
          </div>
          <p className="hint">
            To predict what appears in your sample, read the original segment <strong>backwards</strong> (last letter
            first) and swap each letter for its complementary base. Build that 6-letter answer below.
          </p>
          <ComplementBuilder
            target={inv.inverted_segment}
            onComplete={() => {
              award(30);
              setStage('compare');
            }}
          />
        </div>
      )}

      {(stage === 'compare' || stage === 'done') && (
        <div className="compare-panel">
          <h3>Step 3 — What changed in the protein?</h3>
          <p className="hint">
            The inverted segment lands exactly inside codons {inv.affected_codon_numbers_1based[0]} and{' '}
            {inv.affected_codon_numbers_1based[1]} — the only 2 codons that can possibly change, since the inversion
            is a multiple of 3 and doesn't shift the reading frame.
          </p>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference DNA</span>
              {groupByCodon(reference.nucleotide_sequence).map((codon, ci) => (
                <span key={ci} className={'diff-codon-group' + (ci === codonA || ci === codonB ? ' diff-highlight' : '')}>
                  {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                </span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Your sample</span>
              {groupByCodon(mutant.nucleotide_sequence).map((codon, ci) => (
                <span key={ci} className={'diff-codon-group' + (ci === codonA || ci === codonB ? ' diff-highlight' : '')}>
                  {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                </span>
              ))}
            </div>
          </div>

          <div className="diff-view" style={{ marginTop: '0.75rem' }}>
            <div className="diff-row">
              <span className="diff-label">Reference protein</span>
              {reference.amino_acid_sequence.split('').map((c, i) => (
                <span key={i} className={'diff-nt' + (i === codonA || i === codonB ? ' diff-highlight' : '')}>{c}</span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Your protein</span>
              {mutant.amino_acid_sequence.split('').map((c, i) => (
                <span key={i} className={'diff-nt' + (i === codonA || i === codonB ? ' diff-highlight' : '')}>{c}</span>
              ))}
            </div>
          </div>

          {stage === 'compare' && (
            <button onClick={() => { award(30); setStage('done'); }}>Reveal the explanation</button>
          )}
          {stage === 'done' && (
            <>
              <table className="detail-table">
                <tbody>
                  <tr><td>Original segment</td><td>{inv.original_segment}</td></tr>
                  <tr><td>Reverse complement (what appears)</td><td>{inv.inverted_segment}</td></tr>
                  <tr><td>Codon {inv.affected_codon_numbers_1based[0]}</td><td>{inv.reference_codon_pair[0]} ({inv.reference_amino_acid_pair[0]}) → {inv.mutant_codon_pair[0]} ({inv.mutant_amino_acid_pair[0]})</td></tr>
                  <tr><td>Codon {inv.affected_codon_numbers_1based[1]}</td><td>{inv.reference_codon_pair[1]} ({inv.reference_amino_acid_pair[1]}) → {inv.mutant_codon_pair[1]} ({inv.mutant_amino_acid_pair[1]})</td></tr>
                </tbody>
              </table>
              <p className="classification">{inv.classification}</p>
            </>
          )}
        </div>
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}

function ReferenceStrip({ label, sequence }) {
  return (
    <div className="reference-strip">
      <div className="reference-strip-label">{label}</div>
      <div className="reference-strip-codons">
        {groupByCodon(sequence).map((codon, i) => (
          <span key={i} className="reference-codon">
            {codon.map((n, j) => (
              <span key={j} className={'reference-nt ' + baseClass(n)}>{n}</span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Click-to-fill builder for a fixed-length answer, using an infinite-supply A/C/G/T bank (letters repeat, so tiles aren't consumed). */
function ComplementBuilder({ target, onComplete }) {
  const [slots, setSlots] = useState(Array(target.length).fill(null));
  const [checked, setChecked] = useState(false);

  function placeInFirstEmpty(letter) {
    const idx = slots.findIndex((s) => s === null);
    if (idx === -1) return;
    const next = [...slots];
    next[idx] = letter;
    setSlots(next);
    setChecked(false);
  }

  function clearSlot(idx) {
    if (slots[idx] === null) return;
    const next = [...slots];
    next[idx] = null;
    setSlots(next);
    setChecked(false);
  }

  const full = slots.every((s) => s !== null);
  const built = slots.join('');
  const isCorrect = built === target;

  function check() {
    setChecked(true);
    if (isCorrect && onComplete) onComplete();
  }

  return (
    <div className="sequence-builder">
      <div className="tile-bank">
        {BASES.map((letter) => (
          <button key={letter} className={'tile ' + baseClass(letter)} onClick={() => placeInFirstEmpty(letter)}>
            {letter}
          </button>
        ))}
      </div>
      <div className="slots-row">
        {slots.map((letter, i) => (
          <button
            key={i}
            className={
              'slot' +
              (letter ? ' filled' : '') +
              (checked ? (letter === target[i] ? ' correct' : ' incorrect') : '')
            }
            onClick={() => clearSlot(i)}
          >
            {letter || ''}
          </button>
        ))}
      </div>
      <div className="builder-controls">
        <span>{slots.filter(Boolean).length}/{target.length} placed</span>
        <button disabled={!full} onClick={check}>Check answer</button>
        {checked && (
          <span className={isCorrect ? 'result-ok' : 'result-bad'}>
            {isCorrect ? '✓ That\'s the reverse complement!' : '✗ Not quite — remember: reverse the order AND swap each base for its complement.'}
          </span>
        )}
      </div>
    </div>
  );
}
