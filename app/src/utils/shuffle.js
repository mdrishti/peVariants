export function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function makeTiles(letters) {
  return letters.split('').map((letter, i) => ({ id: `${letter}-${i}-${Math.random().toString(36).slice(2)}`, letter }));
}

export function codonsOf(seq) {
  const out = [];
  for (let i = 0; i < seq.length; i += 3) out.push(seq.slice(i, i + 3));
  return out;
}
