import { useState } from 'react';

const STORAGE_KEY = 'variant-game-authed';
const PASSWORD = import.meta.env.VITE_APP_PASSWORD;

export default function PasswordGate({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(STORAGE_KEY) === '1');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!PASSWORD) {
    return children; // no password configured (e.g. local dev without .env) - skip the gate
  }

  if (authed) return children;

  function submit(e) {
    e.preventDefault();
    if (input === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setAuthed(true);
    } else {
      setError(true);
    }
  }

  return (
    <div className="password-gate">
      <form onSubmit={submit} className="password-gate-form">
        <h1>🧬 Variant Explainer Game</h1>
        <p>This preview is shared with invited testers only. Enter the access password to continue.</p>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Password"
        />
        <button type="submit">Enter</button>
        {error && <p className="result-bad">Wrong password — try again.</p>}
      </form>
    </div>
  );
}
