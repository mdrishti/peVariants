import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import RulesPanel from '../components/RulesPanel';
import data from '../data/level5.json';

const GENES = ['flaA', 'cadF', 'ciaB'];

export default function Level5() {
  const [geneIdx, setGeneIdx] = useState(0);
  const [stage, setStage] = useState('build'); // build | motif | quiz | done
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const gene = data.gene_analysis[GENES[geneIdx]];

  function nextGene() {
    if (geneIdx < GENES.length - 1) {
      setGeneIdx(geneIdx + 1);
      setStage('build');
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

      {stage !== 'quiz' && stage !== 'done' && (
        <>
          <p>Build <strong>{GENES[geneIdx]}</strong>, then we'll scan it for methylation motifs.</p>
          {stage === 'build' && (
            <SequenceBuilder
              letters={gene.nucleotide_sequence}
              target={gene.nucleotide_sequence}
              onComplete={(seq, ok) => {
                if (ok) setStage('motif');
              }}
            />
          )}
          {stage === 'motif' && (
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
              <p><strong>{GENES[geneIdx]}</strong> sequence: <code>{gene.nucleotide_sequence}</code></p>
              <p className="hint">{gene.motif_found ? `Motif found: ${gene.motif_found}` : 'No motif from the table appears in this sequence.'}</p>
              <button onClick={nextGene}>
                {geneIdx < GENES.length - 1 ? 'Next gene →' : 'Go to ON/OFF quiz →'}
              </button>
            </div>
          )}
        </>
      )}

      {stage === 'quiz' && (
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
          <button disabled={!allAnswered} onClick={() => { setChecked(true); if (allCorrect) setStage('done'); }}>
            Check answers
          </button>
        </div>
      )}

      {stage === 'done' && (
        <div className="celebrate">
          <h3>🎉 Level 5 complete!</h3>
          <p>{data.discussion_prompt}</p>
        </div>
      )}
    </div>
  );
}
