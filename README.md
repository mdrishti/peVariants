# Variant Explainer Game

A game to teach kids/adults with no genomics background how DNA -> codons -> amino acids -> proteins works, and how mutations (SNPs) can be synonymous or non-synonymous. Built around real *Campylobacter jejuni* (pathogenic) gene fragments.

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
- `levels/level4.json` - Level 4: a 5-nucleotide insertion (53 tiles instead of 48) teaches frameshift mutations, followed by a real Shine-Dalgarno/ORF round using authentic GenBank upstream sequence per gene.
- `levels/level5.json` - Level 5: a motif hunt (players locate the CCWGG/GATC methylation motif themselves) followed by an environment-toggle round showing methylation-driven ON/OFF as conditional - cadF contains a real CCWGG motif; jlpA/ciaB have neither motif and are always ON.
- `app/` - the playable React + Vite app (see "Running it locally" above). `app/src/levels/Level1.jsx` ... `Level5.jsx` implement each level's UI; `app/src/components/` holds shared pieces (tile builders, the codon table, the reference-sequence strip, the rules panel, the password gate).

## Genes used

| Gene | Function (plain language) | GenBank accession |
|---|---|---|
| jlpA | Surface lipoprotein - binds a human heat-shock protein to help the bacterium stick to and signal into human cells | AF295104.1 |
| cadF | Sticks the bacterium to human gut cells | OR876352.1 |
| ciaB | Injected into gut cells to help invasion | AF114831.1 |

Levels 2-4 are generalized across all three genes - whichever one a player picks in Level 1 carries through automatically. Level 4's Round 3 (Shine-Dalgarno/ORF) uses real GenBank upstream sequence: jlpA and ciaB both show a strong, real Shine-Dalgarno-like motif; cadF's is a weaker, lower-confidence candidate since its GenBank record only includes 18 nt of upstream context. Level 5 reuses all three genes to contrast methylation-driven ON/OFF expression.
