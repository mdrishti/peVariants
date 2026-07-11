import { useState } from 'react';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level7.json';
import { baseClass } from '../utils/bases';
import { groupByCodon, buildGapAlignment } from '../utils/indelAlignment';

export default function Level7() {
  const { player, awardPoints } = usePlayer();
  const [subMode, setSubMode] = useState('inframe'); // inframe | frameshift
  const [stage, setStage] = useState('locate'); // locate -> confirm -> (inframe: compare/done) | (frameshift: assign/effects)
  const [guesses, setGuesses] = useState([]);
  const [banner, setBanner] = useState(null);
  const [builtAminoAcids, setBuiltAminoAcids] = useState('');

  if (!player) {
    return (
      <div className="level">
        <h2>Level 7 — Copy-Paste Errors (Tandem Duplication)</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  if (!player.geneChoice) {
    return (
      <div className="level">
        <h2>Level 7 — Copy-Paste Errors (Tandem Duplication)</h2>
        <p className="hint">Pick a gene in Level 1 first — this level continues with that same gene.</p>
      </div>
    );
  }

  const geneKey = player.geneChoice;
  const gene = data.genes[geneKey];
  const { reference } = gene;
  const codons = reference.codons;
  const isInframe = subMode === 'inframe';
  const variantMutant = isInframe ? gene.inframe_mutant : gene.frameshift_mutant;
  const details = variantMutant.duplication_details;
  const editLength = details.duplication_length;
  const correctGapIndex = details.duplication_position_0based_nt / 3;
  const { before, gapBoxes, after, numGapBoxes } = buildGapAlignment(reference, correctGapIndex, editLength, 'insertion');
  const sampleGroups = groupByCodon(variantMutant.nucleotide_sequence);
  const frameshiftAaLength = !isInframe ? variantMutant.new_amino_acid_sequence_until_stop.length : null;
  const hitPrematureStop = !isInframe && variantMutant.new_amino_acid_sequence_until_stop.endsWith('*');

  function switchSubMode(next) {
    if (next === subMode) return;
    setSubMode(next);
    setStage('locate');
    setGuesses([]);
    setBuiltAminoAcids('');
    setBanner(null);
  }

  function award(points) {
    const total = awardPoints('level7', points);
    setBanner({ points, total });
  }

  function guessGap(gapIndex) {
    if (gapIndex === correctGapIndex) {
      setGuesses([...guesses, { gapIndex, result: 'correct' }]);
      const guessCount = guesses.length + 1;
      award(guessCount <= 2 ? 20 : 10);
      setStage('confirm');
      return;
    }
    const result = gapIndex < correctGapIndex ? 'later' : 'earlier';
    setGuesses([...guesses, { gapIndex, result }]);
  }

  const lastGuess = guesses[guesses.length - 1];

  return (
    <div className="level">
      <h2>Level 7 — Copy-Paste Errors (Tandem Duplication)</h2>

      <div className="quiz-row" style={{ marginBottom: '0.75rem' }}>
        <span>Explore:</span>
        <button className={'toggle' + (isInframe ? ' selected' : '')} onClick={() => switchSubMode('inframe')}>In-frame (1 codon copied)</button>
        <button className={'toggle' + (!isInframe ? ' selected' : '')} onClick={() => switchSubMode('frameshift')}>Frameshift (2 nt copied)</button>
      </div>

      <p>
        {isInframe
          ? <>Your sample has one whole codon (<strong>{details.duplicated_codon}</strong>) duplicated in tandem — copied right after itself.</>
          : <>Your sample has <strong>{editLength} extra letters</strong> that exactly match the sequence right before them — a small tandem duplication.</>}
      </p>

      <RulesPanel rules={data.rules} />
      <CodonTable />
      <ReferenceStrip
        label={`Reference sequence — ${geneKey}`}
        sequence={reference.nucleotide_sequence}
        aminoAcidSequence={stage === 'compare' || stage === 'done' || stage === 'effects' ? reference.amino_acid_sequence : undefined}
      />

      <div className="compare-panel">
        <h3>Where did the duplication happen?</h3>
        {stage === 'locate' ? (
          <p className="hint">Click a gap between reference codons to test your guess. The game will tell you if the real duplication point is earlier or later in the sequence.</p>
        ) : (
          <p className="result-ok">✓ Found it — the duplicated copy was inserted right after codon {correctGapIndex} (marked below).</p>
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
            Not quite — the real duplication point is {lastGuess.result} in the sequence. Try again. ({guesses.length} guess{guesses.length === 1 ? '' : 'es'} so far)
          </p>
        )}
      </div>

      {stage !== 'locate' && (
        <div className="compare-panel">
          <h3>Full assembled sample sequence — aligned to the reference</h3>
          <p className="hint">
            The reference row keeps its own original codons, untouched. Any dim, parenthesized letter is just a
            preview of the very next reference codon (shown again in full right after), included only so the two
            rows' boxes line up one-for-one — the real duplicated content is the highlighted stretch in your row.
          </p>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference ({reference.nucleotide_sequence.length}nt)</span>
              {before.map((codon, gi) => (
                <span key={`b${gi}`} className="diff-codon-group">
                  {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                </span>
              ))}
              {gapBoxes.map((box, gi) => (
                <span key={`g${gi}`} className="diff-codon-group">
                  {box.map((cell, j) => (
                    <span key={j} className={'diff-nt' + (cell.blank ? ' diff-blank' : ' diff-echo')}>
                      {cell.blank ? '-' : '(-)'}
                    </span>
                  ))}
                </span>
              ))}
              {after.map((codon, gi) => (
                <span key={`a${gi}`} className="diff-codon-group">
                  {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                </span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Yours ({variantMutant.nucleotide_sequence.length}nt)</span>
              {sampleGroups.map((group, gi) => (
                <span key={gi} className="diff-codon-group">
                  {group.map((c, j) => (
                    <span key={j} className={'diff-nt ' + baseClass(c) + (gi >= correctGapIndex && gi < correctGapIndex + numGapBoxes ? ' diff-highlight' : '')}>{c}</span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {stage === 'confirm' && isInframe && (
            <button onClick={() => setStage('compare')}>Compare proteins →</button>
          )}
          {stage === 'confirm' && !isInframe && (
            <button onClick={() => setStage('assign')}>Re-translate from position 1 →</button>
          )}
        </div>
      )}

      {isInframe && (stage === 'compare' || stage === 'done') && (
        <div className="compare-panel">
          <h3>Compare the proteins</h3>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference protein</span>
              {reference.amino_acid_sequence.split('').map((c, i) => (
                <span key={i} className={'diff-nt' + (i === details.duplicated_codon_number_1based - 1 ? ' diff-highlight' : '')}>{c}</span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Your protein</span>
              {variantMutant.amino_acid_sequence.split('').map((c, i) => (
                <span key={i} className={'diff-nt' + (i === details.duplicated_codon_number_1based || i === details.duplicated_codon_number_1based - 1 ? ' diff-highlight' : '')}>{c}</span>
              ))}
            </div>
          </div>
          {stage === 'compare' && (
            <button onClick={() => { award(25); setStage('done'); }}>Reveal what happened</button>
          )}
          {stage === 'done' && (
            <p className="classification">{details.classification}</p>
          )}
        </div>
      )}

      {!isInframe && stage === 'assign' && (
        <div className="compare-panel">
          <h3>Re-split into codons of 3, starting from position 1, and assign amino acids</h3>
          <p className="hint">
            Same as Level 4's insertion — the reading frame doesn't reset at the duplication, it just keeps reading
            in groups of 3 from the start.
          </p>
          <CodonAssigner
            sequence={variantMutant.nucleotide_sequence}
            aminoLetters={variantMutant.new_amino_acid_sequence_until_stop}
            activeCount={frameshiftAaLength}
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

      {!isInframe && stage === 'effects' && (
        <div className="compare-panel">
          <h3>What just happened?</h3>
          <p className="classification">{details.why_multiple_of_3_matters}</p>
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference protein</span>
              {reference.codons.map((codon, i) => (
                <span key={i} className={'diff-aa-col' + (i >= correctGapIndex ? ' diff-highlight' : '')}>
                  <span className="diff-aa-codon">{codon}</span>
                  <span className="diff-aa-letter">{reference.amino_acid_sequence[i]}</span>
                </span>
              ))}
            </div>
            <div className="diff-row">
              <span className="diff-label">Your protein</span>
              {Array.from({ length: reference.amino_acid_sequence.length }).map((_, i) => {
                const aa = (builtAminoAcids || variantMutant.new_amino_acid_sequence_until_stop)[i];
                const codon = variantMutant.new_codons_from_position_1[i];
                const disabled = aa === undefined;
                return (
                  <span key={i} className={'diff-aa-col' + (i >= correctGapIndex ? ' diff-highlight' : '') + (disabled ? ' diff-aa-disabled' : '')}>
                    <span className="diff-aa-codon">{codon ?? ''}</span>
                    <span className="diff-aa-letter">{disabled ? '' : aa}</span>
                  </span>
                );
              })}
            </div>
          </div>
          <p className="hint">
            Amino acids 1-{correctGapIndex} match the reference exactly. From amino acid {correctGapIndex + 1} onward, every
            position is different{hitPrematureStop ? ', and translation is cut off early by a premature STOP codon.' : ' — a completely scrambled downstream sequence, just like Level 4\'s insertion.'}
          </p>
        </div>
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}
