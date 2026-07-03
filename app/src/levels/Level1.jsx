import { useState } from 'react';
import SequenceBuilder from '../components/SequenceBuilder';
import CodonAssigner from '../components/CodonAssigner';
import CodonTable from '../components/CodonTable';
import ReferenceStrip from '../components/ReferenceStrip';
import RulesPanel from '../components/RulesPanel';
import GenePicker from '../components/GenePicker';
import PointsBanner from '../components/PointsBanner';
import { usePlayer } from '../state/PlayerContext';
import refs from '../data/reference_sequences.json';
import levelData from '../data/level1.json';

const POINTS = { nucleotides: 20, aminoacids: 30, complete: 50 };

export default function Level1() {
  const { player, setGeneChoice, awardPoints } = usePlayer();
  const [stage, setStage] = useState('pick'); // pick | nucleotides | aminoacids | gene-done
  const [banner, setBanner] = useState(null);

  if (!player) {
    return (
      <div className="level">
        <h2>Level 1 — Build the Gene</h2>
        <p className="hint">Register a player name above to start earning points.</p>
      </div>
    );
  }

  const locked = Boolean(player.geneChoice);
  const activeGene = player.geneChoice;
  const gene = activeGene ? refs.genes[activeGene] : null;

  function pickGene(g) {
    setGeneChoice(g);
    setStage('nucleotides');
  }

  function award(stageKey) {
    const total = awardPoints('level1', POINTS[stageKey]);
    setBanner({ points: POINTS[stageKey], total });
  }

  return (
    <div className="level">
      <h2>Level 1 — Build the Gene</h2>
      <p>Pick a gene, arrange the nucleotide squares to rebuild it, then assign an amino acid to each codon using the codon table.</p>

      <RulesPanel rules={levelData.rules} />

      {!activeGene && <GenePicker value={activeGene} onChange={pickGene} locked={locked} />}

      {activeGene && (
        <>
          <GenePicker value={activeGene} onChange={pickGene} locked={locked} />
          <p className="gene-desc">{gene.protein_function}</p>

          <CodonTable />
          <ReferenceStrip label={`Reference sequence — ${activeGene} (${gene.source_accession})`} sequence={gene.nucleotide_sequence} />

          {stage === 'nucleotides' && (
            <SequenceBuilder
              letters={gene.nucleotide_sequence}
              target={gene.nucleotide_sequence}
              onComplete={(seq, ok) => {
                if (ok) {
                  award('nucleotides');
                  setStage('aminoacids');
                }
              }}
            />
          )}

          {stage === 'aminoacids' && (
            <CodonAssigner
              sequence={gene.nucleotide_sequence}
              aminoLetters={gene.amino_acid_sequence}
              onComplete={(built, ok) => {
                if (ok) {
                  const total = awardPoints('level1', POINTS.aminoacids + POINTS.complete);
                  setBanner({ points: POINTS.aminoacids + POINTS.complete, total });
                  setStage('gene-done');
                }
              }}
            />
          )}

          {stage === 'gene-done' && (
            <div className="celebrate">
              <p>✓ {activeGene} complete! Protein: <strong>{gene.amino_acid_sequence}</strong></p>
              <PointsBanner points={banner?.points} total={banner?.total} />
            </div>
          )}

          {stage !== 'gene-done' && <PointsBanner points={banner?.points} total={banner?.total} />}
        </>
      )}
    </div>
  );
}
