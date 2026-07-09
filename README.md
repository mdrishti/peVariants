# Variant Explainer Game

A browser game that teaches people with no genomics background how DNA -> codons -> amino acids -> proteins works, how single-letter mutations (SNPs) can be silent (synonymous) or protein-changing (non-synonymous), how small insertions cause frameshift mutations, and how DNA methylation can switch a gene on/off without changing any letter at all (epigenetics). Every sequence used is real, pulled from GenBank/RefSeq for pathogenic *Campylobacter jejuni* genes.

Five levels, roughly 2-4 minutes each:

1. **Build the gene** - assemble a real gene's DNA sequence, then decode it into amino acids codon by codon.
2. **Synonymous SNP** - a single letter changes but the amino acid (and protein) stays identical.
3. **Non-synonymous SNP** - the same kind of single-letter change, but this time the amino acid changes too.
4. **Frameshift** - a small insertion shifts the reading frame and corrupts everything downstream, plus a round using each gene's real upstream sequence to find its Shine-Dalgarno (ribosome-binding) signal.
5. **Methylation on/off** - DNA letters stay the same, but a real, published *C. jejuni* phase-variable methylation system (Cj0031/ModH, motif CCYGA) can switch gene expression on or off.


## Running it locally

The playable game is a React + Vite app in `app/`. The `data/` and `levels/` folders at the repo root are the source-of-truth JSON design files; `app/src/data/` holds copies of them that the app actually imports (re-copy after editing the root files, see below).

**Requirements:** [Node.js](https://nodejs.org/) 18 or later (this was built/tested with Node v24) and npm.

```bash
git clone <this-repo-url>
cd gameVariants/app
npm install
npm run dev
```

Then open the URL it prints - by default **http://localhost:4300** (the port is pinned in `app/vite.config.js`).

The app is password-gated for sharing with testers. For local development, either:
- create `app/.env.local` with `VITE_APP_PASSWORD=<any password you like>`, or
- leave it unset - with no `VITE_APP_PASSWORD` configured, the password screen is skipped automatically.

To produce a static production build (e.g. to deploy or hand off):

```bash
cd app
npm run build     # outputs to app/dist/
npm run preview   # serve that build locally to sanity-check it, same port (4300)
```

If you edit any file under the root `data/` or `levels/` folders, copy the changes into the app before rebuilding:

```bash
cp data/*.json levels/*.json app/src/data/
```

## Structure

- `data/codon_table.json` - the standard genetic code + amino acid full names.
- `data/reference_sequences.json` - 3 real 15-codon (45 nt) gene fragments (jlpA, cadF, ciaB) pulled from GenBank, with accessions and plain-language descriptions of what each protein does.
- `data/squares.json` - tile counts for the "squares" (nucleotide letter tiles and amino acid letter tiles) used as game pieces per gene.
- `levels/level1.json` - Level 1: arrange nucleotide squares into the reference sequence, then assign amino acid squares per codon.
- `levels/level2.json` - Level 2: same task but with a synonymous SNP planted at the same codon position in each gene (e.g. cadF GTT->GTC, both Valine).
- `levels/level3.json` - Level 3: same task but with a non-synonymous SNP planted at the same codon position (e.g. cadF GTT->ATT, Valine->Isoleucine).
- `levels/level4.json` - Level 4: a 5-nucleotide insertion (53 tiles instead of 48) teaches frameshift mutations, followed by a real Shine-Dalgarno/ribosome-binding round using authentic GenBank upstream sequence per gene.
- `levels/level5.json` - Level 5: Round 1 checks jlpA, cadF and ciaB for the real *C. jejuni* methylation motif CCYGA (recognized by the phase-variable enzyme Cj0031/ModH) - honestly, none of the three carry it in the fragment shown, so all three are ON regardless of methylation state. Round 2 introduces a fourth, literature-documented gene, `peb1A`, which does carry a real CCYGA site, and lets the player toggle Cj0031 phase ON/OFF to see it get methylated or not - ending on the real published finding (Anjum *et al.*, *Nucleic Acids Research* 2016, PMC4889913) that motif presence was only weakly associated with expression change.
- `app/` - the playable React + Vite app (see "Running it locally" above). `app/src/levels/Level1.jsx` ... `Level5.jsx` implement each level's UI; `app/src/components/` holds shared pieces (tile builders, the codon table, the reference-sequence strip, the rules panel, the password gate).
- `docs/public-engagement-overview.md` - a plain-language write-up of what the game is and why, intended for people running outreach/demo sessions rather than developers.

## Genes used

All genes used here help <i>Campylobacter</i> to attach, invade or feed off host (human) cells.

| Gene | Function | GenBank accession |
|---|---|---|
| jlpA | Surface lipoprotein - binds a human heat-shock protein to help the bacterium attach to and signal into human cells | AF295104.1 |
| cadF | Attach the bacterium to human gut cells | OR876352.1 |
| ciaB | Injected into gut cells to help invasion | AF114831.1 |
| peb1A | Adhesin gene used only in Level 5, Round 2 - real example gene from the published Cj0031 phasevarion study | cj0921c (NCTC11168 genome, NC_002163.1) |

Levels 1-4 are generalized across jlpA/cadF/ciaB - whichever one a player picks in Level 1 carries through automatically. Level 4's Shine-Dalgarno round uses real GenBank upstream sequence: jlpA and ciaB both show a strong, real Shine-Dalgarno-like motif; cadF's is a weaker, lower-confidence candidate since its GenBank record only includes limited upstream context. Level 5 Round 1 reuses jlpA/cadF/ciaB; Round 2 uses peb1A as the one gene in the game with a confirmed real methylation site, since none of the three main genes happen to carry the real motif in their available sequence.
