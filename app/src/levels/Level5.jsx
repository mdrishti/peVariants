import { useState } from 'react';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level5.json';

const GENES = ['jlpA', 'cadF', 'ciaB'];

export default function Level5() {
  const { player, awardPoints } = usePlayer();
  const [round, setRound] = useState(1);
  const [geneIdx, setGeneIdx] = useState(0);
  const [choice, setChoice] = useState(null); // 'ON' | 'OFF' for the current gene
  const [correctCount, setCorrectCount] = useState(0);
  const [round2Stage, setRound2Stage] = useState('active'); // active | done
  const [banner, setBanner] = useState(null);
  const gene = data.gene_analysis[GENES[geneIdx]];

  if (!player) {
    return (
      <div className="level">
        <h2>Level 5 — Marked Letters (Methylation and Gene Expression)</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  function award(points) {
    const total = awardPoints('level5', points);
    setBanner({ points, total });
  }

  function decide(val) {
    setChoice(val);
    const correct = val === gene.expression_state;
    if (correct) setCorrectCount((c) => c + 1);
    award(correct ? 20 : 5);
  }

  function nextGene() {
    if (geneIdx < GENES.length - 1) {
      setGeneIdx(geneIdx + 1);
      setChoice(null);
    } else {
      if (correctCount === GENES.length) {
        award(30);
      }
      setRound(2);
    }
  }

  const hasMotif = Boolean(gene.motif_position);

  return (
    <div className="level">
      <h2>Level 5 — Marked Letters (Methylation and Gene Expression)</h2>

      <RulesPanel rules={data.rules} />

      {round === 1 && (
        <div className="compare-panel">
          <h3>Round 1 — Spot the methylation: {GENES[geneIdx]}</h3>
          <table className="detail-table">
            <thead><tr><th>Motif</th><th>Methylated base</th><th>Rule</th></tr></thead>
            <tbody>
              {data.motif_table.motifs.map((m, i) => (
                <tr key={i}><td>{m.motif}</td><td>{m.methylated_base}</td><td>{m.game_rule}</td></tr>
              ))}
            </tbody>
          </table>

          <p className="hint">Look for a methylation blob (🔵) sitting on the sequence below — it marks a real methylated base.</p>
          <div className="methylation-view">
            {gene.nucleotide_sequence.split('').map((n, i) => {
              const isMethylated = hasMotif && i >= gene.motif_position.start_0based && i < gene.motif_position.start_0based + gene.motif_position.length;
              return (
                <span key={i} className="methylation-nt-col">
                  {isMethylated && <span className="methylation-blob" title="Methylated base">🔵</span>}
                  <span className={'diff-nt' + (isMethylated ? ' motif-nt-selected' : '')}>{n}</span>
                </span>
              );
            })}
          </div>

          {!choice && (
            <div className="quiz-row" style={{ marginTop: '0.75rem' }}>
              <span>Based on the blob (or lack of one), is {GENES[geneIdx]} expression ON or OFF?</span>
              <button className="toggle" onClick={() => decide('ON')}>ON</button>
              <button className="toggle" onClick={() => decide('OFF')}>OFF</button>
            </div>
          )}

          {choice && (
            <>
              <p className={choice === gene.expression_state ? 'result-ok' : 'result-bad'}>
                {choice === gene.expression_state ? '✓ Correct!' : `✗ Not quite — this gene is ${gene.expression_state}.`} {gene.motif_found ? `Motif found: ${gene.motif_found}` : 'No motif from the table appears in this sequence.'}
              </p>
              <p className="classification">{gene.reasoning}</p>
              <button onClick={nextGene}>
                {geneIdx < GENES.length - 1 ? 'Next gene →' : 'Go to Round 2 →'}
              </button>
            </>
          )}
        </div>
      )}

      {round === 2 && round2Stage !== 'done' && (
        <Round2 onDone={() => { award(25); setRound2Stage('done'); }} />
      )}

      {round === 2 && round2Stage === 'done' && (
        <div className="celebrate">
          <h3>🎉 Level 5 complete!</h3>
          <p>{data.discussion_prompt}</p>
        </div>
      )}

      <PointsBanner points={banner?.points} total={banner?.total} />
    </div>
  );
}

function Round2({ onDone }) {
  const r2 = data.round2;
  const [envKey, setEnvKey] = useState(r2.environments[0].key);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);
  const env = r2.environments.find((e) => e.key === envKey);
  const ctx = r2.real_motif_context;
  const highlightEnd = ctx.highlight_start + ctx.highlight_length;

  function answer(opt) {
    setSelectedOption(opt.key);
    setAnswered(true);
    if (opt.correct) onDone();
  }

  return (
    <div className="compare-panel">
      <h3>{r2.title}</h3>
      <p className="hint">{r2.gene_note}</p>
      <p>{r2.intro}</p>

      <p className="hint">Real sequence from inside {r2.gene_used} (not invented):</p>
      <div className="methylation-view">
        {ctx.sequence_window.split('').map((n, i) => {
          const isHit = i >= ctx.highlight_start && i < highlightEnd;
          const isMethylatedNow = isHit && env.methylation_active;
          return (
            <span key={i} className="methylation-nt-col">
              {isMethylatedNow && <span className="methylation-blob" title="Methylated base">🔵</span>}
              <span className={'diff-nt' + (isHit ? ' motif-nt-selected' : '')}>{n}</span>
            </span>
          );
        })}
      </div>
      <p className="hint">{ctx.position_note}</p>

      <div className="quiz-row">
        {r2.environments.map((e) => (
          <button key={e.key} className={'toggle' + (envKey === e.key ? ' selected' : '')} onClick={() => setEnvKey(e.key)}>
            {e.label}
          </button>
        ))}
      </div>

      <table className="detail-table">
        <tbody>
          <tr><td>Cj0031 (ModH) enzyme active?</td><td>{env.methylation_active ? 'Yes' : 'No'}</td></tr>
          <tr><td>This CCTGA site</td><td><strong>{env.effect_on_gene}</strong></td></tr>
        </tbody>
      </table>
      <p className="classification">{env.explanation}</p>
      <p className="hint">{r2.unaffected_genes_note}</p>

      <div className="quiz-row" style={{ marginTop: '0.75rem' }}>
        <span>{r2.quiz_question}</span>
      </div>
      {r2.quiz_options.map((opt) => (
        <div key={opt.key} className="quiz-row">
          <button className={'toggle' + (selectedOption === opt.key ? ' selected' : '')} onClick={() => answer(opt)}>
            {opt.label}
          </button>
        </div>
      ))}
      {answered && (
        <p className={r2.quiz_options.find((o) => o.key === selectedOption)?.correct ? 'result-ok' : 'result-bad'}>
          {r2.quiz_explanation}
        </p>
      )}
    </div>
  );
}
