import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import RulesPanel from '../components/RulesPanel';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import data from '../data/level5.json';

const GENES = ['flaA', 'cadF', 'ciaB'];

export default function Level5() {
  const { player, awardPoints } = usePlayer();
  const [round, setRound] = useState(1);
  const [geneIdx, setGeneIdx] = useState(0);
  const [stage, setStage] = useState('build'); // build | hunt | reveal
  const [selected, setSelected] = useState([]);
  const [huntResult, setHuntResult] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
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

  function toggleNt(i) {
    setSelected((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort((a, b) => a - b)));
  }

  function isContiguous(arr) {
    if (arr.length === 0) return false;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] !== arr[i - 1] + 1) return false;
    }
    return true;
  }

  function checkHunt() {
    const mp = gene.motif_position;
    let correct;
    if (!mp) {
      correct = selected.length === 0;
    } else {
      correct = isContiguous(selected) && selected[0] === mp.start_0based && selected.length === mp.length;
    }
    setHuntResult(correct);
    award(correct ? 20 : 5);
    setStage('reveal');
  }

  function declareNoMotif() {
    setSelected([]);
    const correct = !gene.motif_position;
    setHuntResult(correct);
    award(correct ? 20 : 5);
    setStage('reveal');
  }

  function nextGene() {
    if (geneIdx < GENES.length - 1) {
      setGeneIdx(geneIdx + 1);
      setStage('build');
      setSelected([]);
      setHuntResult(null);
    } else {
      setStage('quiz');
    }
  }

  function setAnswer(name, val) {
    setAnswers({ ...answers, [name]: val });
  }

  const allAnswered = GENES.every((g) => answers[g]);
  const allCorrect = GENES.every((g) => answers[g] === data.gene_analysis[g].expression_state);

  return (
    <div className="level">
      <h2>Level 5 — Marked Letters (Methylation and Gene Expression)</h2>

      <RulesPanel rules={data.rules} />

      {round === 1 && stage !== 'quiz' && stage !== 'done' && (
        <>
          <p>Round 1 — Motif hunt: build <strong>{GENES[geneIdx]}</strong>, then find the motif yourself (or declare there isn't one).</p>
          {stage === 'build' && (
            <SequenceBuilder
              letters={gene.nucleotide_sequence}
              target={gene.nucleotide_sequence}
              onComplete={(seq, ok) => {
                if (ok) {
                  award(10);
                  setStage('hunt');
                }
              }}
            />
          )}
          {stage === 'hunt' && (
            <div className="compare-panel">
              <h3>Motif table</h3>
              <table className="detail-table">
                <thead><tr><th>Motif</th><th>Methylated base</th><th>Rule</th></tr></thead>
                <tbody>
                  {data.motif_table.motifs.map((m, i) => (
                    <tr key={i}><td>{m.motif}</td><td>{m.methylated_base}</td><td>{m.game_rule}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">Click nucleotides below to select a contiguous stretch you think matches a motif, then check. Or declare there's no motif here.</p>
              <div className="reference-strip-codons" style={{ fontFamily: 'monospace' }}>
                {gene.nucleotide_sequence.split('').map((n, i) => (
                  <button
                    key={i}
                    className={'diff-nt motif-nt' + (selected.includes(i) ? ' motif-nt-selected' : '')}
                    onClick={() => toggleNt(i)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="builder-controls">
                <button disabled={selected.length === 0} onClick={checkHunt}>Check my selection</button>
                <button onClick={declareNoMotif}>I think there's no motif here</button>
              </div>
            </div>
          )}
          {stage === 'reveal' && (
            <div className="compare-panel">
              <p className={huntResult ? 'result-ok' : 'result-bad'}>
                {huntResult ? '✓ Correct!' : '✗ Not quite.'} {gene.motif_found ? `Motif found: ${gene.motif_found}` : 'No motif from the table appears in this sequence.'}
              </p>
              <p className="classification">{gene.reasoning}</p>
              <button onClick={nextGene}>
                {geneIdx < GENES.length - 1 ? 'Next gene →' : 'Go to ON/OFF quiz →'}
              </button>
            </div>
          )}
        </>
      )}

      {round === 1 && stage === 'quiz' && (
        <div className="compare-panel">
          <h3>Now decide: is each gene's expression ON or OFF?</h3>
          {GENES.map((g) => (
            <div key={g} className="quiz-row">
              <span>{g}</span>
              <button className={answers[g] === 'ON' ? 'toggle selected' : 'toggle'} onClick={() => setAnswer(g, 'ON')}>ON</button>
              <button className={answers[g] === 'OFF' ? 'toggle selected' : 'toggle'} onClick={() => setAnswer(g, 'OFF')}>OFF</button>
              {checked && (
                <span className={answers[g] === data.gene_analysis[g].expression_state ? 'result-ok' : 'result-bad'}>
                  {answers[g] === data.gene_analysis[g].expression_state ? '✓' : `✗ (${data.gene_analysis[g].expression_state})`}
                </span>
              )}
            </div>
          ))}
          <button disabled={!allAnswered} onClick={() => {
            setChecked(true);
            if (allCorrect) {
              award(30);
              setRound(2);
            }
          }}>
            Check answers
          </button>
        </div>
      )}

      {round === 2 && stage !== 'done' && (
        <Round2 onDone={() => { award(25); setStage('done'); }} />
      )}

      {stage === 'done' && (
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

  function answer(opt) {
    setSelectedOption(opt.key);
    setAnswered(true);
    if (opt.correct) onDone();
  }

  return (
    <div className="compare-panel">
      <h3>{r2.title}</h3>
      <p>{r2.intro}</p>

      <div className="quiz-row">
        {r2.environments.map((e) => (
          <button key={e.key} className={'toggle' + (envKey === e.key ? ' selected' : '')} onClick={() => setEnvKey(e.key)}>
            {e.label}
          </button>
        ))}
      </div>

      <table className="detail-table">
        <tbody>
          <tr><td>Methyltransferase active?</td><td>{env.methylation_active ? 'Yes' : 'No'}</td></tr>
          <tr><td>cadF expression</td><td><strong>{env.effect_on_cadF}</strong></td></tr>
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
