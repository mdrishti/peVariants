import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import data from '../data/level4.json';
import codonData from '../data/codon_table.json';

const table = codonData.codon_table;

export default function Level4() {
  const [stage, setStage] = useState('locate'); // locate | insert-order | confirm | translate
  const [guesses, setGuesses] = useState([]);
  const [selectedGap, setSelectedGap] = useState(null);
  const { reference, mutant } = data;
  const codons = reference.codons; // 16 codons
  const correctGapIndex = mutant.insertion_details.insertion_position_0based_nt / 3; // gap AFTER this many codons

  function guessGap(gapIndex) {
    if (gapIndex === correctGapIndex) {
      setSelectedGap(gapIndex);
      setGuesses([...guesses, { gapIndex, result: 'correct' }]);
      setStage('insert-order');
      return;
    }
    const result = gapIndex < correctGapIndex ? 'later' : 'earlier';
    setGuesses([...guesses, { gapIndex, result }]);
  }

  const lastGuess = guesses[guesses.length - 1];

  return (
    <div className="level">
      <h2>Level 4 — The Extra Letters (Insertion / Frameshift)</h2>
      <p>
        This pile has <strong>{mutant.nucleotide_sequence.length} tiles</strong> — 5 more than the
        reference gene ({reference.nucleotide_sequence.length} nt).
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />
      <ReferenceStrip label="Reference sequence — flaA" sequence={reference.nucleotide_sequence} aminoAcidSequence={reference.amino_acid_sequence} />

      {stage === 'locate' && (
        <div className="compare-panel">
          <h3>Where were the 5 extra tiles inserted?</h3>
          <p className="hint">Click a gap between reference codons to test your guess. The game will tell you if the real insertion point is earlier or later in the sequence.</p>
          <div className="gap-row">
            {Array.from({ length: codons.length + 1 }).map((_, gapIndex) => (
              <span key={gapIndex} className="gap-unit">
                <button
                  className={'gap-btn' + (guesses.some((g) => g.gapIndex === gapIndex && g.result === 'correct') ? ' gap-correct' : '')}
                  onClick={() => guessGap(gapIndex)}
                  title={`Gap after codon ${gapIndex}`}
                >
                  ⌄
                </button>
                {gapIndex < codons.length && <span className="gap-codon">{codons[gapIndex]}</span>}
              </span>
            ))}
          </div>
          {lastGuess && lastGuess.result !== 'correct' && (
            <p className={lastGuess.result === 'later' ? 'result-bad' : 'result-bad'}>
              Not quite — the real insertion point is {lastGuess.result} in the sequence. Try again. ({guesses.length} guess{guesses.length === 1 ? '' : 'es'} so far)
            </p>
          )}
        </div>
      )}

      {(stage === 'insert-order' || stage === 'confirm' || stage === 'translate') && (
        <div className="compare-panel">
          <p className="result-ok">✓ Found it — the insertion happened right after codon {correctGapIndex}.</p>
        </div>
      )}

      {stage === 'insert-order' && (
        <div className="compare-panel">
          <h3>Now order the 5 extra tiles</h3>
          <p className="hint">These tiles were found at that gap, but shuffled. Place them in the correct order.</p>
          <SequenceBuilder
            letters={mutant.insertion_details.inserted_bases}
            target={mutant.insertion_details.inserted_bases}
            onComplete={(seq, ok) => {
              if (ok) setStage('confirm');
            }}
          />
        </div>
      )}

      {(stage === 'confirm' || stage === 'translate') && (
        <div className="compare-panel">
          <h3>Full assembled sample sequence</h3>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference (48nt)</span>
              {reference.nucleotide_sequence.split('').map((c, i) => (
                <span key={i} className="diff-nt">{c}</span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Yours (53nt)</span>
              {mutant.nucleotide_sequence.split('').map((c, i) => {
                const insertStart = mutant.insertion_details.insertion_position_0based_nt;
                const insertEnd = insertStart + mutant.insertion_details.insertion_length;
                const isExtra = i >= insertStart && i < insertEnd;
                return (
                  <span key={i} className={'diff-nt' + (isExtra ? ' diff-highlight' : '')}>{c}</span>
                );
              })}
            </div>
          </div>
          {stage === 'confirm' && (
            <button onClick={() => setStage('translate')}>Re-translate from position 1 →</button>
          )}
        </div>
      )}

      {stage === 'translate' && (
        <div className="compare-panel">
          <h3>Re-split into codons of 3, starting over from position 1</h3>
          <div className="codon-row">
            {mutant.new_codons_from_position_1.map((codon, i) => {
              const aa = table[codon] || '?';
              const isStop = aa === '*';
              return (
                <div key={i} className="codon-col">
                  <div className="codon-label">{codon}</div>
                  <div className={'slot amino-slot filled' + (isStop ? ' incorrect' : '')}>{aa}</div>
                </div>
              );
            })}
          </div>
          <p className="classification">{mutant.insertion_details.why_multiple_of_3_matters}</p>
          <p className="classification">
            New protein until the stop: <strong>{mutant.new_amino_acid_sequence_until_stop}</strong>
          </p>
        </div>
      )}
    </div>
  );
}
