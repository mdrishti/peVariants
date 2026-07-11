/** Splits a flat string into groups of 3 characters (one per codon) for rendering. */
export function groupByCodon(str) {
  const groups = [];
  for (let i = 0; i < str.length; i += 3) groups.push(str.slice(i, i + 3).split(''));
  return groups;
}

/**
 * Builds codon-shaped boxes for whichever side is SHORTER than the other (reference for an
 * insertion/duplication, the sample for a deletion), so both rows line up box-for-box.
 * Generalizes to any edit length/gene:
 *  - codons entirely before the edit point are untouched.
 *  - the edit itself needs ceil(editLength / 3) boxes to match the longer side's box count; any
 *    slots left over once the pure-edit letters run out "echo" real reference content right at
 *    the resume point (dim styling) purely so both rows' boxes stay the same width.
 *  - for an INSERTION/DUPLICATION nothing was consumed from the reference, so the codon(s) partly
 *    echoed are then shown again in full right after. For a DELETION real content WAS consumed,
 *    so the "after" section picks up right where the echoed letters left off (no re-showing).
 */
export function buildGapAlignment(reference, correctGapIndex, editLength, mode) {
  const before = reference.codons.slice(0, correctGapIndex).map((c) => c.split(''));
  const numGapBoxes = Math.ceil(editLength / 3);
  const resumeRefIdx = mode === 'deletion' ? correctGapIndex * 3 + editLength : correctGapIndex * 3;
  const gapBoxes = [];
  for (let b = 0; b < numGapBoxes; b++) {
    const box = [];
    for (let slot = 0; slot < 3; slot++) {
      const cum = b * 3 + slot;
      if (cum < editLength) {
        box.push({ blank: true });
      } else {
        const refIdx = resumeRefIdx + (cum - editLength);
        box.push({ echo: true, letter: reference.nucleotide_sequence[refIdx] });
      }
    }
    gapBoxes.push(box);
  }
  const afterStartCodonIdx = mode === 'deletion' ? correctGapIndex + numGapBoxes : correctGapIndex;
  const after = reference.codons.slice(afterStartCodonIdx).map((c) => c.split(''));
  return { before, gapBoxes, after, numGapBoxes };
}
