import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import refs from '../data/reference_sequences.json';
import levelData from '../data/level1.json';

const GENES = ['flaA', 'cadF', 'ciaB'];

export default function Level1() {
  const [geneIdx, setGeneIdx] = useState(0);
  const [stage, setStage] = useState('nucleotides'); // 'nucleotides' | 'aminoacids' | 'done'
  const gene = refs.genes[GENES[geneIdx]];

  function nextGene() {
    if (geneIdx < GENES.length - 1) {
      setGeneIdx(geneIdx + 1);
      setStage('nucleotides');
    } else {
      setStage('done');
    }
  }

  return (
    <div className="level">
      <h2>Level 1 — Build the Gene</h2>
      <p>Arrange the nucleotide squares to rebuild <strong>{GENES[geneIdx]}</strong>, then assign an amino acid to each codon using the codon table.</p>
      <p className="gene-desc">{gene.protein_function}</p>

      <RulesPanel rules={levelData.rules} />
      <CodonTable />
      <ReferenceStrip label={`Reference sequence — ${GENES[geneIdx]} (${gene.source_accession})`} sequence={gene.nucleotide_sequence} />

      {stage === 'nucleotides' && (
        <SequenceBuilder
          letters={gene.nucleotide_sequence}
          target={gene.nucleotide_sequence}
          onComplete={(seq, ok) => {
            if (ok) setStage('aminoacids');
          }}
        />
      )}

      {stage === 'aminoacids' && (
        <CodonAssigner
          sequence={gene.nucleotide_sequence}
          aminoLetters={gene.amino_acid_sequence}
          onComplete={(built, ok) => {
            if (ok) setStage('gene-done');
          }}
        />
      )}

      {stage === 'gene-done' && (
        <div className="celebrate">
          <p>✓ {GENES[geneIdx]} complete! Protein: <strong>{gene.amino_acid_sequence}</strong></p>
          <button onClick={nextGene}>
            {geneIdx < GENES.length - 1 ? 'Next gene →' : 'Finish Level 1'}
          </button>
        </div>
      )}

      {stage === 'done' && (
        <div className="celebrate">
          <h3>🎉 Level 1 complete — all 3 genes built!</h3>
        </div>
      )}
    </div>
  );
}
