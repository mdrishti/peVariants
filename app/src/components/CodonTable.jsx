import { useState } from 'react';
import codonData from '../data/codon_table.json';

const table = codonData.codon_table;
const names = codonData.amino_acid_names;
const BASES = ['A', 'C', 'G', 'T']; // alphabetical, so the table reads in a strict A-C-G-T order rather than grouped by amino acid

export default function CodonTable() {
  const [open, setOpen] = useState(true);

  return (
    <div className="codon-table-panel">
      <button className="collapse-toggle" onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} Codon table (reference)
      </button>
      {open && (
        <table className="codon-table-grid">
          <tbody>
            {BASES.map((first) => (
              <tr key={first}>
                {BASES.map((second) =>
                  BASES.map((third) => {
                    const codon = first + second + third;
                    const aa = table[codon];
                    return (
                      <td key={codon} className={aa === '*' ? 'codon-stop' : ''} title={names[aa]}>
                        <span className="codon-cell-codon">{codon}</span>
                        <span className="codon-cell-aa">{aa}</span>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
