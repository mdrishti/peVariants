const COMPLEMENT = { A: 'T', T: 'A', C: 'G', G: 'C' };

export function complementBase(base) {
  return COMPLEMENT[base];
}

/** Reverse-complement of a nucleotide string - what actually appears on the flipped strand when a segment inverts. */
export function reverseComplement(seq) {
  return seq.split('').reverse().map(complementBase).join('');
}
