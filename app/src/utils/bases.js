/** className for a single nucleotide/codon letter — lets the "alignment" theme color-code bases the way real sequence viewers do (A/T/G/C), while the classic theme just ignores it. */
export function baseClass(letter) {
  if (letter === 'A' || letter === 'C' || letter === 'G' || letter === 'T') {
    return 'nt-base nt-' + letter;
  }
  return 'nt-base';
}
