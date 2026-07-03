import refs from '../data/reference_sequences.json';

const GENES = ['flaA', 'cadF', 'ciaB'];

/** Lets the player pick a gene once (Level 1); after that it's locked and carried into later levels. */
export default function GenePicker({ value, onChange, locked }) {
  if (locked && value) {
    return (
      <div className="gene-picker locked">
        <span>Gene: <strong>{value}</strong> (chosen in Level 1 — carries into later levels)</span>
      </div>
    );
  }

  return (
    <div className="gene-picker">
      <p className="hint">Choose which gene you want to work on:</p>
      <div className="gene-cards">
        {GENES.map((g) => (
          <button
            key={g}
            className={'gene-card' + (value === g ? ' selected' : '')}
            onClick={() => onChange(g)}
          >
            <div className="gene-card-name">{g}</div>
            <div className="gene-card-desc">{refs.genes[g].protein_function}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
