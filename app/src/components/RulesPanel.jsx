/** Always-visible, level-specific rules. Not collapsible on purpose — these should stay in view. */
export default function RulesPanel({ rules }) {
  if (!rules || rules.length === 0) return null;
  return (
    <div className="rules-panel">
      <div className="rules-panel-label">📋 Rules for this level</div>
      <ul>
        {rules.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}
