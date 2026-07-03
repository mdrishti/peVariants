import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level4.json';

export default function Level4() {
  const { player, awardPoints } = usePlayer();
  const [stage, setStage] = useState('locate'); // locate | insert-order | confirm | assign | effects | orf
  const [guesses, setGuesses] = useState([]);
  const [banner, setBanner] = useState(null);
  const [builtAminoAcids, setBuiltAminoAcids] = useState('');

  if (!player) {
    return (
      <div className="level">
        <h2>Level 4 — The Extra Letters (Insertion / Frameshift)</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  if (!player.geneChoice) {
    return (
      <div className="level">
        <h2>Level 4 — The Extra Letters (Insertion / Frameshift)</h2>
        <p className="hint">Pick a gene in Level 1 first — this level continues with that same gene.</p>
      </div>
    );
  }

  const geneKey = player.geneChoice;
  const { reference, mutant } = data.genes[geneKey];
  const codons = reference.codons;
  const correctGapIndex = mutant.insertion_details.insertion_position_0based_nt / 3;
  const frameshiftAaLength = mutant.new_amino_acid_sequence_until_stop.length;
  const frameshiftNtSequence = mutant.nucleotide_sequence.slice(0, frameshiftAaLength * 3);
  const hitPrematureStop = mutant.new_amino_acid_sequence_until_stop.endsWith('*');

  function award(points) {
    const total = awardPoints('level4', points);
    setBanner({ points, total });
  }

  function guessGap(gapIndex) {
    if (gapIndex === correctGapIndex) {
      setGuesses([...guesses, { gapIndex, result: 'correct' }]);
      const guessCount = guesses.length + 1;
      award(guessCount <= 2 ? 25 : 15);
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
      <ReferenceStrip
        label={`Reference sequence — ${geneKey}`}
        sequence={reference.nucleotide_sequence}
        aminoAcidSequence={stage === 'effects' || stage === 'orf' ? reference.amino_acid_sequence : undefined}
      />

      <div className="compare-panel">
        <h3>Where were the 5 extra tiles inserted?</h3>
        {stage === 'locate' ? (
          <p className="hint">Click a gap between reference codons to test your guess. The game will tell you if the real insertion point is earlier or later in the sequence.</p>
        ) : (
          <p className="result-ok">✓ Found it — the insertion happened right after codon {correctGapIndex} (marked below).</p>
        )}
        <div className="gap-row">
          {Array.from({ length: codons.length + 1 }).map((_, gapIndex) => {
            const isCorrectFound = stage !== 'locate' && gapIndex === correctGapIndex;
            return (
              <span key={gapIndex} className="gap-unit">
                <button
                  className={'gap-btn' + (isCorrectFound || guesses.some((g) => g.gapIndex === gapIndex && g.result === 'correct') ? ' gap-correct' : '')}
                  onClick={() => stage === 'locate' && guessGap(gapIndex)}
                  disabled={stage !== 'locate'}
                  title={`Gap after codon ${gapIndex}`}
                >
                  ⌄
                </button>
                {gapIndex < codons.length && <span className="gap-codon">{codons[gapIndex]}</span>}
              </span>
            );
          })}
        </div>
        {stage === 'locate' && lastGuess && lastGuess.result !== 'correct' && (
          <p className="result-bad">
            Not quite — the real insertion point is {lastGuess.result} in the sequence. Try again. ({guesses.length} guess{guesses.length === 1 ? '' : 'es'} so far)
          </p>
        )}
      </div>

      {stage === 'insert-order' && (
        <div className="compare-panel">
          <h3>Now order the 5 extra tiles</h3>
          <p className="hint">These tiles were found at that gap, but shuffled. Place them in the correct order.</p>
          <SequenceBuilder
            letters={mutant.insertion_details.inserted_bases}
            target={mutant.insertion_details.inserted_bases}
            onComplete={(seq, ok) => {
              if (ok) {
                award(15);
                setStage('confirm');
              }
            }}
          />
        </div>
      )}

      {(stage === 'confirm' || stage === 'assign' || stage === 'effects' || stage === 'orf') && (
        <div className="compare-panel">
          <h3>Full assembled sample sequence</h3>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference ({reference.nucleotide_sequence.length}nt)</span>
              {reference.nucleotide_sequence.split('').map((c, i) => (
                <span key={i} className="diff-nt">{c}</span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Yours ({mutant.nucleotide_sequence.length}nt)</span>
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
            <button onClick={() => setStage('assign')}>Re-translate from position 1 →</button>
          )}
        </div>
      )}

      {stage === 'assign' && (
        <div className="compare-panel">
          <h3>Re-split into codons of 3, starting from position 1, and assign amino acids</h3>
          <p className="hint">The reading frame doesn't reset at the insertion — it just keeps reading in groups of 3 from the start. Assign each new codon its amino acid, same as before.</p>
          <CodonAssigner
            sequence={frameshiftNtSequence}
            aminoLetters={mutant.new_amino_acid_sequence_until_stop}
            onComplete={(built, ok) => {
              setBuiltAminoAcids(built);
              if (ok) {
                award(30);
                setStage('effects');
              }
            }}
          />
        </div>
      )}

      {stage === 'effects' && (
        <MutationEffectsCard
          mutant={mutant}
          builtAminoAcids={builtAminoAcids}
          hitPrematureStop={hitPrematureStop}
          onContinue={() => setStage('orf')}
        />
      )}

      {stage === 'orf' && (
        <OrfExplainStage geneKey={geneKey} reference={reference} onAnswered={(correct) => correct && award(20)} />
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}

function MutationEffectsCard({ mutant, builtAminoAcids, hitPrematureStop, onContinue }) {
  return (
    <div className="compare-panel">
      <h3>What just happened?</h3>
      <p className="classification">{mutant.insertion_details.why_multiple_of_3_matters}</p>
      <p>
        Your translated protein: <strong>{builtAminoAcids}</strong>
        {hitPrematureStop && ' — cut off early by a premature STOP codon.'}
      </p>

      <div className="mutation-effects-card">
        <h4>A frameshift mutation can cause:</h4>
        <ul>
          <li><strong>Premature (early) STOP codon</strong> — translation halts long before the normal end, producing a truncated protein.</li>
          <li><strong>Loss of function</strong> — if the truncated or scrambled protein is missing parts it needs to fold or work correctly.</li>
          <li><strong>A completely different downstream sequence</strong> — every amino acid after the shift is essentially random relative to the original, since the ribosome is now reading the wrong groups of 3.</li>
          <li><strong>Ribosome rescue / degradation</strong> — in bacteria, ribosomes stuck on broken mRNAs (e.g. no proper stop reached) can be rescued by systems like tmRNA (SsrA), which tags the incomplete protein for destruction.</li>
          <li><strong>Rarely, a second compensating indel</strong> — another nearby insertion/deletion could theoretically restore the original reading frame, but this is uncommon and usually still leaves some damage in between.</li>
        </ul>
      </div>

      <button onClick={onContinue}>Continue to Round 3: Why THIS Methionine is the start →</button>
    </div>
  );
}

function OrfExplainStage({ geneKey, reference, onAnswered }) {
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const sd = data.shine_dalgarno_by_gene[geneKey];
  const round3 = data.round3;
  const codons = reference.codons;
  const internalAtgIndices = codons.map((c, i) => (c === 'ATG' && i !== 0 ? i : null)).filter((i) => i !== null);

  function answer(codonNumber1based) {
    setSelected(codonNumber1based);
    setAnswered(true);
    onAnswered(codonNumber1based === round3.quiz_correct_answer);
  }

  const hasHighlight = Boolean(sd.sd_highlight);
  const highlightStart = hasHighlight ? sd.sd_highlight.start : null;
  const highlightEnd = hasHighlight ? sd.sd_highlight.start + sd.sd_highlight.length : null;
  const highlightedText = hasHighlight ? sd.upstream_sequence.slice(highlightStart, highlightEnd) : '';
  const offsetStart = hasHighlight ? highlightStart - sd.upstream_sequence.length : null;
  const offsetEnd = hasHighlight ? highlightEnd - sd.upstream_sequence.length : null;

  return (
    <div className="compare-panel">
      <h3>{round3.title}</h3>

      <p className="hint">{sd.source_note}</p>
      <div className="orf-leader-view">
        {sd.upstream_sequence.split('').map((c, i) => {
          const isHighlighted = hasHighlight && i >= highlightStart && i < highlightEnd;
          return (
            <span key={`up-${i}`} className={'orf-upstream-nt' + (isHighlighted ? ' orf-upstream-highlight' : '')}>
              {c}
            </span>
          );
        })}
        <span className="orf-leader-gap" />
        {codons.map((codon, i) => {
          const isStart = i === 0;
          const isInternalAtg = internalAtgIndices.includes(i);
          return (
            <span
              key={i}
              className={'orf-codon' + (isStart ? ' orf-start' : '') + (isInternalAtg ? ' orf-internal-met' : '')}
              title={isStart ? 'START — positioned by the ribosome-binding context' : isInternalAtg ? 'Internal Methionine — not a new start' : undefined}
            >
              {codon}
            </span>
          );
        })}
      </div>
      {hasHighlight && (
        <p className="hint">
          Highlighted: <strong>{highlightedText}</strong> — positions {offsetStart} to {offsetEnd} relative to the start codon (i.e. {Math.abs(offsetStart)} to {Math.abs(offsetEnd)} nt upstream).
        </p>
      )}
      <p className="hint" style={{ fontStyle: 'italic' }}>{sd.confidence_note}</p>

      <div className="orf-legend">
        {hasHighlight && <span><span className="legend-swatch orf-sd-swatch" /> Candidate Shine-Dalgarno-like motif (real upstream sequence)</span>}
        <span><span className="legend-swatch orf-start-swatch" /> True start (codon 1)</span>
        {internalAtgIndices.length > 0 && (
          <span><span className="legend-swatch orf-internal-swatch" /> Internal ATG (Met only, not a start)</span>
        )}
      </div>

      <ul className="rules-panel-list-plain">
        {round3.explanation.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {internalAtgIndices.length === 0 && (
        <p className="hint">
          This particular fragment only has one ATG (codon 1) — but the same logic applies everywhere in a real genome:
          ATG alone never means "start". It's the upstream ribosome-binding context that tells the ribosome where to begin.
        </p>
      )}

      <div className="quiz-row" style={{ marginTop: '0.75rem' }}>
        <span>{round3.quiz_question}</span>
      </div>
      <div className="quiz-row">
        <button className={'toggle' + (selected === 1 ? ' selected' : '')} onClick={() => answer(1)}>Codon 1</button>
        {internalAtgIndices.map((i) => (
          <button key={i} className={'toggle' + (selected === i + 1 ? ' selected' : '')} onClick={() => answer(i + 1)}>Codon {i + 1}</button>
        ))}
      </div>
      {answered && (
        <p className={selected === round3.quiz_correct_answer ? 'result-ok' : 'result-bad'}>
          {round3.quiz_explanation}
        </p>
      )}
    </div>
  );
}
