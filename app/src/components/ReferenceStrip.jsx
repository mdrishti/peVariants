import { codonsOf } from '../utils/shuffle';
import { baseClass } from '../utils/bases';

/** Always-visible reference nucleotide (and optionally amino acid) sequence, shown as a picture to build/compare against. */
export default function ReferenceStrip({ label, sequence, aminoAcidSequence }) {
  const codons = codonsOf(sequence);
  const aaLetters = aminoAcidSequence ? aminoAcidSequence.split('') : null;
  return (
    <div className="reference-strip">
      <div className="reference-strip-label">{label}</div>
      <div className="reference-strip-codons">
        {codons.map((codon, i) => (
          <span key={i} className="reference-codon">
            {codon.split('').map((n, j) => (
              <span key={j} className={'reference-nt ' + baseClass(n)}>{n}</span>
            ))}
          </span>
        ))}
      </div>
      {aaLetters && (
        <>
          <div className="reference-strip-label reference-strip-aa-label">Reference protein (amino acids)</div>
          <div className="reference-strip-codons">
            {aaLetters.map((aa, i) => (
              <span key={i} className={'reference-aa' + (aa === '*' ? ' reference-aa-stop' : '')}>{aa}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
