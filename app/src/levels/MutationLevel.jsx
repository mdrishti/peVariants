import { useState, useMemo } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';

const POINTS = { build: 20, snp: 20, classify: 30 };

/** Shared UI for Level 2 (synonymous) and Level 3 (non-synonymous) SNP levels. */
export default function MutationLevel({ data, title, levelKey }) {
  const { player, awardPoints } = usePlayer();
  const [stage, setStage] = useState('nucleotides');
  const [builtAminoAcids, setBuiltAminoAcids] = useState('');
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

  function award(key) {
    const total = awardPoints(levelKey, POINTS[key]);
    setBanner({ points: POINTS[key], total });
  }

  return (
    <div className="level">
      <h2>{title}</h2>
      <p>
        You've been handed an unlabeled DNA sample based on <strong>{geneKey}</strong> — the game won't
        tell you up front whether it matches the reference exactly or carries a mutation. Build it, assign
        amino acids, then compare both against the reference shown above to find out.
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />
      <ReferenceStrip
        label={`Reference sequence — ${geneKey} (known/healthy)`}
        sequence={reference.nucleotide_sequence}
        aminoAcidSequence={stage === 'compare' || stage === 'done' ? reference.amino_acid_sequence : undefined}
      />

      {stage === 'nucleotides' && (
        <>
          <p className="hint">Sample tile pile — build this unlabeled sequence below:</p>
          <SequenceBuilder
            letters={mutant.nucleotide_sequence}
            target={mutant.nucleotide_sequence}
            onComplete={(seq, ok) => {
              if (ok) {
                award('build');
                setStage('aminoacids');
              }
            }}
          />
        </>
      )}

      {stage === 'aminoacids' && (
        <CodonAssigner
          sequence={mutant.nucleotide_sequence}
          aminoLetters={mutant.amino_acid_sequence}
          onComplete={(built, ok) => {
            setBuiltAminoAcids(built);
            if (ok) {
              award('snp');
              setStage('compare');
            }
          }}
        />
      )}

      {(stage === 'compare' || stage === 'done') && (
        <div className="compare-panel">
          <h3>Compare with the reference</h3>
          <SequenceDiff
            refNt={reference.nucleotide_sequence}
            sampleNt={mutant.nucleotide_sequence}
            refAa={reference.amino_acid_sequence}
            sampleAa={builtAminoAcids || mutant.amino_acid_sequence}
            diffIndex={diffIndex}
            aaDiffIndex={aaDiffIndex}
          />
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

function SequenceDiff({ refNt, sampleNt, refAa, sampleAa, diffIndex, aaDiffIndex }) {
  return (
    <div className="diff-view">
      <div className="diff-row">
        <span className="diff-label">Reference DNA</span>
        {refNt.split('').map((c, i) => (
          <span key={i} className={'diff-nt' + (i === diffIndex ? ' diff-highlight' : '')}>{c}</span>
        ))}
      </div>
      <div className="diff-row">
        <span className="diff-label">Your sample</span>
        {sampleNt.split('').map((c, i) => (
          <span key={i} className={'diff-nt' + (i === diffIndex ? ' diff-highlight' : '')}>{c}</span>
        ))}
      </div>
      {diffIndex >= 0 && <p className="hint">DNA difference found at position {diffIndex + 1} (codon #{Math.floor(diffIndex / 3) + 1}).</p>}

      <div className="diff-row" style={{ marginTop: '0.75rem' }}>
        <span className="diff-label">Reference protein</span>
        {refAa.split('').map((c, i) => (
          <span key={i} className={'diff-nt' + (i === aaDiffIndex ? ' diff-highlight' : '')}>{c}</span>
        ))}
      </div>
      <div className="diff-row">
        <span className="diff-label">Your protein</span>
        {sampleAa.split('').map((c, i) => (
          <span key={i} className={'diff-nt' + (i === aaDiffIndex ? ' diff-highlight' : '')}>{c}</span>
        ))}
      </div>
      <p className="hint">
        {refAa === sampleAa
          ? 'The protein sequence is identical — whatever DNA difference exists, it did not change the protein.'
          : `The protein differs at position ${aaDiffIndex + 1} — this DNA change did alter the protein.`}
      </p>
    </div>
  );
}
