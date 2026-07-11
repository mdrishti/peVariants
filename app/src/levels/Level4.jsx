import { useState } from 'react';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level4.json';
import { baseClass } from '../utils/bases';
import { groupByCodon, buildGapAlignment } from '../utils/indelAlignment';

const BASES = ['A', 'C', 'G', 'T'];

/**
 * Normalizes a gene's insertion or deletion data into one shape, so the rest of the level
 * (box-alignment, codon re-assignment, effects card) doesn't need to branch on type at all.
 */
function normalizeVariant(gene, mutationType) {
  if (mutationType === 'insertion') {
    const m = gene.mutant;
    return {
      type: 'insertion',
      nucleotideSequence: m.nucleotide_sequence,
      editStart: m.insertion_details.insertion_position_0based_nt,
      editLength: m.insertion_details.insertion_length,
      editedBases: m.insertion_details.inserted_bases,
      whyMultipleOf3Matters: m.insertion_details.why_multiple_of_3_matters,
      newCodons: m.new_codons_from_position_1,
      newAminoAcidSequenceUntilStop: m.new_amino_acid_sequence_until_stop,
    };
  }
  const m = gene.deletion_mutant;
  return {
    type: 'deletion',
    nucleotideSequence: m.nucleotide_sequence,
    editStart: m.deletion_details.deletion_position_0based_nt,
    editLength: m.deletion_details.deletion_length,
    editedBases: m.deletion_details.deleted_bases,
    whyMultipleOf3Matters: m.deletion_details.why_multiple_of_3_matters,
    newCodons: m.new_codons_from_position_1,
    newAminoAcidSequenceUntilStop: m.new_amino_acid_sequence_until_stop,
  };
}

/** Wordle-style per-letter scoring: 'correct' (right letter, right spot), 'present' (right letter, wrong spot), 'absent'. */
function scoreGuess(guess, answer) {
  const result = Array(guess.length).fill('absent');
  const answerLetters = answer.split('');
  const used = Array(answer.length).fill(false);
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answerLetters[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }
  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue;
    const idx = answerLetters.findIndex((c, j) => c === guess[i] && !used[j]);
    if (idx !== -1) {
      result[i] = 'present';
      used[idx] = true;
    }
  }
  return result;
}

export default function Level4() {
  const { player, awardPoints } = usePlayer();
  const [mutationType, setMutationType] = useState('insertion');
  const [stage, setStage] = useState('locate'); // locate | insert-order | confirm | assign | effects | orf
  const [guesses, setGuesses] = useState([]);
  const [banner, setBanner] = useState(null);
  const [builtAminoAcids, setBuiltAminoAcids] = useState('');

  if (!player) {
    return (
      <div className="level">
        <h2>Level 4 — Extra or Missing Letters (Indel / Frameshift)</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  if (!player.geneChoice) {
    return (
      <div className="level">
        <h2>Level 4 — Extra or Missing Letters (Indel / Frameshift)</h2>
        <p className="hint">Pick a gene in Level 1 first — this level continues with that same gene.</p>
      </div>
    );
  }

  const geneKey = player.geneChoice;
  const gene = data.genes[geneKey];
  const { reference } = gene;
  const codons = reference.codons;
  const variant = normalizeVariant(gene, mutationType);
  const isInsertion = mutationType === 'insertion';
  const correctGapIndex = variant.editStart / 3;
  const frameshiftAaLength = variant.newAminoAcidSequenceUntilStop.length;
  const hitPrematureStop = variant.newAminoAcidSequenceUntilStop.endsWith('*');
  const { before: gapSideBefore, gapBoxes, after: gapSideAfter, numGapBoxes } = buildGapAlignment(
    reference,
    correctGapIndex,
    variant.editLength,
    mutationType
  );
  const plainSideGroups = groupByCodon(isInsertion ? variant.nucleotideSequence : reference.nucleotide_sequence);

  function switchMutationType(next) {
    if (next === mutationType) return;
    setMutationType(next);
    setStage('locate');
    setGuesses([]);
    setBuiltAminoAcids('');
    setBanner(null);
  }

  function award(points) {
    const total = awardPoints('level4', points);
    setBanner({ points, total });
  }

  function guessGap(gapIndex) {
    if (gapIndex === correctGapIndex) {
      setGuesses([...guesses, { gapIndex, result: 'correct' }]);
      const guessCount = guesses.length + 1;
      award(guessCount <= 2 ? 25 : 15);
      setStage(isInsertion ? 'insert-order' : 'confirm');
      return;
    }
    const result = gapIndex < correctGapIndex ? 'later' : 'earlier';
    setGuesses([...guesses, { gapIndex, result }]);
  }

  const lastGuess = guesses[guesses.length - 1];

  return (
    <div className="level">
      <h2>Level 4 — Extra or Missing Letters (Indel / Frameshift)</h2>

      <div className="quiz-row" style={{ marginBottom: '0.75rem' }}>
        <span>Explore:</span>
        <button className={'toggle' + (isInsertion ? ' selected' : '')} onClick={() => switchMutationType('insertion')}>Insertion (extra letters)</button>
        <button className={'toggle' + (!isInsertion ? ' selected' : '')} onClick={() => switchMutationType('deletion')}>Deletion (missing letters)</button>
      </div>

      {isInsertion ? (
        <p>
          This pile has <strong>{variant.nucleotideSequence.length} tiles</strong> — {variant.editLength} more than the
          reference gene ({reference.nucleotide_sequence.length} nt).
        </p>
      ) : (
        <p>
          This pile has only <strong>{variant.nucleotideSequence.length} tiles</strong> — {variant.editLength} fewer than the
          reference gene ({reference.nucleotide_sequence.length} nt).
        </p>
      )}

      <RulesPanel rules={data.rules} />
      <CodonTable />
      <ReferenceStrip
        label={`Reference sequence — ${geneKey}`}
        sequence={reference.nucleotide_sequence}
        aminoAcidSequence={stage === 'effects' || stage === 'orf' ? reference.amino_acid_sequence : undefined}
      />

      <div className="compare-panel">
        <h3>Where were the {variant.editLength} {isInsertion ? 'extra' : 'missing'} letters {isInsertion ? 'inserted' : 'deleted'}?</h3>
        {stage === 'locate' ? (
          <p className="hint">
            Click a gap between reference codons to test your guess. The game will tell you if the real
            {isInsertion ? ' insertion' : ' deletion'} point is earlier or later in the sequence.
          </p>
        ) : (
          <p className="result-ok">✓ Found it — the {isInsertion ? 'insertion' : 'deletion'} happened right after codon {correctGapIndex} (marked below).</p>
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
            Not quite — the real {isInsertion ? 'insertion' : 'deletion'} point is {lastGuess.result} in the sequence. Try again. ({guesses.length} guess{guesses.length === 1 ? '' : 'es'} so far)
          </p>
        )}
      </div>

      {stage === 'insert-order' && (
        <div className="compare-panel">
          <h3>Vardle — guess the {variant.editLength} inserted letters</h3>
          <p className="hint">
            These {variant.editLength} nucleotides were found at that gap, but you don't know their order yet. Guess an
            {variant.editLength}-letter A/C/G/T sequence — after each guess, each letter is marked green (right base, right
            spot), yellow (right base, wrong spot), or grey (not in the inserted sequence at all), same as Wordle.
          </p>
          <Vardle
            answer={variant.editedBases}
            onSolved={() => {
              award(15);
              setStage('confirm');
            }}
          />
        </div>
      )}

      {(stage === 'confirm' || stage === 'assign' || stage === 'effects' || stage === 'orf') && (
        <div className="compare-panel">
          <h3>Full assembled sample sequence — aligned to the reference</h3>
          {isInsertion ? (
            <p className="hint">
              The reference row keeps its own original codons exactly as in Level 1 — nothing is renumbered.
              Where your sample carries the {variant.editLength} extra letters, the reference shows a blank instead;
              any dim, parenthesized letter is just a preview of the very next reference codon (shown again in full
              right after), included only so the two rows' boxes line up one-for-one.
            </p>
          ) : (
            <p className="hint">
              The reference row shows its own original codons, untouched. Your sample is missing {variant.editLength} letters,
              so its row shows a blank there instead; any dim letter is real sample sequence — it's just pulled forward from
              right after the gap purely so the two rows' boxes line up one-for-one.
            </p>
          )}
          <div className="diff-view">
            <div className="diff-row">
              <span className="diff-label">Reference ({reference.nucleotide_sequence.length}nt)</span>
              {isInsertion ? (
                <>
                  {gapSideBefore.map((codon, gi) => (
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
                  {gapSideAfter.map((codon, gi) => (
                    <span key={`a${gi}`} className="diff-codon-group">
                      {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                    </span>
                  ))}
                </>
              ) : (
                plainSideGroups.map((group, gi) => (
                  <span key={gi} className="diff-codon-group">
                    {group.map((c, j) => (
                      <span key={j} className={'diff-nt ' + baseClass(c) + (gi >= correctGapIndex && gi < correctGapIndex + numGapBoxes ? ' diff-highlight' : '')}>{c}</span>
                    ))}
                  </span>
                ))
              )}
            </div>
            <div className="diff-row">
              <span className="diff-label">Yours ({variant.nucleotideSequence.length}nt)</span>
              {isInsertion ? (
                plainSideGroups.map((group, gi) => (
                  <span key={gi} className="diff-codon-group">
                    {group.map((c, j) => (
                      <span key={j} className={'diff-nt ' + baseClass(c) + (gi >= correctGapIndex && gi < correctGapIndex + numGapBoxes ? ' diff-highlight' : '')}>{c}</span>
                    ))}
                  </span>
                ))
              ) : (
                <>
                  {gapSideBefore.map((codon, gi) => (
                    <span key={`b${gi}`} className="diff-codon-group">
                      {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                    </span>
                  ))}
                  {gapBoxes.map((box, gi) => (
                    <span key={`g${gi}`} className="diff-codon-group diff-highlight">
                      {box.map((cell, j) => (
                        <span key={j} className={'diff-nt' + (cell.blank ? ' diff-blank' : ' diff-dim ' + baseClass(cell.letter))}>
                          {cell.blank ? '-' : cell.letter}
                        </span>
                      ))}
                    </span>
                  ))}
                  {gapSideAfter.map((codon, gi) => (
                    <span key={`a${gi}`} className="diff-codon-group">
                      {codon.map((c, j) => <span key={j} className={'diff-nt ' + baseClass(c)}>{c}</span>)}
                    </span>
                  ))}
                </>
              )}
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
          <p className="hint">
            The reading frame doesn't reset at the {isInsertion ? 'insertion' : 'deletion'} — it just keeps reading in groups
            of 3 from the start. Assign each new codon its amino acid, same as before. Codons after a STOP is reached are
            shown greyed out — translation halts there, so there's nothing to assign.
          </p>
          <CodonAssigner
            sequence={variant.nucleotideSequence}
            aminoLetters={variant.newAminoAcidSequenceUntilStop}
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

      {stage === 'effects' && (
        <MutationEffectsCard
          variant={variant}
          reference={reference}
          gapIndex={correctGapIndex}
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

function Vardle({ answer, onSolved }) {
  const [current, setCurrent] = useState(Array(answer.length).fill(''));
  const [guesses, setGuesses] = useState([]);
  const activeIdx = current.findIndex((c) => c === '');
  const solved = guesses.some((g) => g.letters.join('') === answer);

  function pickLetter(letter) {
    if (solved) return;
    setCurrent((prev) => {
      const idx = prev.findIndex((c) => c === '');
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = letter;
      return next;
    });
  }

  function backspace() {
    setCurrent((prev) => {
      const lastFilled = [...prev].reverse().findIndex((c) => c !== '');
      if (lastFilled === -1) return prev;
      const idx = prev.length - 1 - lastFilled;
      const next = [...prev];
      next[idx] = '';
      return next;
    });
  }

  function submit() {
    if (current.includes('') || solved) return;
    const guessLetters = [...current];
    const feedback = scoreGuess(guessLetters.join(''), answer);
    const newGuesses = [...guesses, { letters: guessLetters, feedback }];
    setGuesses(newGuesses);
    setCurrent(Array(answer.length).fill(''));
    if (guessLetters.join('') === answer) onSolved();
  }

  return (
    <div className="vardle">
      <div className="vardle-board">
        {guesses.map((g, gi) => (
          <div key={gi} className="vardle-row">
            {g.letters.map((l, i) => (
              <span key={i} className={'vardle-tile vardle-' + g.feedback[i]}>{l}</span>
            ))}
          </div>
        ))}
        {!solved && (
          <div className="vardle-row">
            {current.map((l, i) => (
              <span key={i} className={'vardle-tile vardle-active' + (i === activeIdx ? ' vardle-cursor' : '')}>{l}</span>
            ))}
          </div>
        )}
      </div>
      {!solved && (
        <div className="vardle-controls">
          <div className="tile-bank">
            {BASES.map((l) => (
              <button key={l} className="tile" onClick={() => pickLetter(l)}>{l}</button>
            ))}
          </div>
          <div className="builder-controls">
            <button onClick={backspace} disabled={activeIdx === 0}>⌫ Back</button>
            <button onClick={submit} disabled={current.includes('')}>Submit guess</button>
            <span className="hint">{guesses.length} guess{guesses.length === 1 ? '' : 'es'} so far</span>
          </div>
        </div>
      )}
      {solved && <p className="result-ok">✓ Solved — the inserted letters are {answer}.</p>}
    </div>
  );
}

function MutationEffectsCard({ variant, reference, gapIndex, builtAminoAcids, hitPrematureStop, onContinue }) {
  const yourProtein = builtAminoAcids || variant.newAminoAcidSequenceUntilStop;
  const yourCodons = variant.newCodons;
  const refLen = reference.amino_acid_sequence.length;
  return (
    <div className="compare-panel">
      <h3>What just happened?</h3>
      <p className="classification">{variant.whyMultipleOf3Matters}</p>

      <p className="hint">Compare the reference protein to what your frameshifted sequence actually translates to — the codon that produced each amino acid is shown in small text above it:</p>
      <div className="diff-view">
        <div className="diff-row">
          <span className="diff-label">Reference protein</span>
          {reference.codons.map((codon, i) => (
            <span key={i} className={'diff-aa-col' + (i >= gapIndex ? ' diff-highlight' : '')}>
              <span className="diff-aa-codon">{codon}</span>
              <span className="diff-aa-letter">{reference.amino_acid_sequence[i]}</span>
            </span>
          ))}
        </div>
        <div className="diff-row">
          <span className="diff-label">Your protein</span>
          {Array.from({ length: refLen }).map((_, i) => {
            const aa = yourProtein[i];
            const codon = yourCodons[i];
            const disabled = aa === undefined;
            return (
              <span key={i} className={'diff-aa-col' + (i >= gapIndex ? ' diff-highlight' : '') + (disabled ? ' diff-aa-disabled' : '')}>
                <span className="diff-aa-codon">{codon ?? ''}</span>
                <span className="diff-aa-letter">{disabled ? '' : aa}</span>
              </span>
            );
          })}
        </div>
      </div>
      <p className="hint">
        Amino acids 1-{gapIndex} match the reference exactly. From amino acid {gapIndex + 1} onward, every position is
        different{hitPrematureStop ? ', and translation is cut off early by a premature STOP codon.' : ' — a completely scrambled downstream sequence.'}
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
            <span key={`up-${i}`} className={'orf-upstream-nt ' + baseClass(c) + (isHighlighted ? ' orf-upstream-highlight' : '')}>
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
