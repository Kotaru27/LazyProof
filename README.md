# LazyProof — Survey text QA (v0.7)

A privacy-oriented, static browser tool for comparing a Word QRE (`.docx`) against a Confirmit survey definition (`.xml` or `.zip`). No server, paid API, or AI inference is required. Files are processed locally in your browser.

**Live site:** https://kotaru27.github.io/LazyProof/

## Use

1. Upload the Word questionnaire and matching Confirmit XML/ZIP survey definition.
2. **Select a survey language** from the identifiers the XML declares. LazyProof does not guess or select one automatically. The XML project default is labeled where available.
3. Select **Compare files**. The report starts with differences. Switch to **Needs review** for ambiguous IDs, abbreviated answers, missing translations and structural cases.
4. Select a finding to read complete QRE and CF respondent wording side-by-side (including the XML's separate Instructions field); matching tokens are green and changed tokens red. When a mapping seems wrong, open **Correct question mapping** and search relevant CF question IDs/titles.
5. Export CSV to retain all discrepancies and unresolved review findings, excluding matches.

## Important limitations

The result is a **source-text comparison**, not proof that the rendered interview is correct. Language ID labels are deliberately neutral when the XML does not supply a reliable language name. Logic, routing, dynamic piping, conditions, grid rows, Word revisions, source versions and image-only options can require manual investigation. Repeated QIDs representing alternative piped wording are recognized only when each variant can be traced to a selected-language XML source variable; runtime selection remains unverified. The Word parser distinguishes programming notes and section headings from respondent copy, but document-specific structures can still require review. Only recognized QRE question IDs are counted, so coverage is not a guarantee that every QRE element has been extracted. Review findings must not be counted as verified matches.

## Deployment

Plain HTML, CSS and browser JavaScript. The checked-in `.github/workflows/pages.yml` publishes from `main` to GitHub Pages. No deploy secrets are required.

## Source and release details

- `parsers.js`: OOXML/Confirmit survey extractors
- `matching.js`: conservative ID/title matching and answer/text differences
- `differences.js`: bounded word alignment for complete text
- `app.js`: upload controls, language gate, mappings, reporting and CSV
- `styles.css`, `index.html`: user interface
- `lib/jszip.min.js`: vendored JSZip 3.10.1 (see `lib/JSZIP-LICENSE.md` and `THIRD_PARTY_NOTICES.md`)
- `VERIFICATION.md` and `RELEASE.md`: test evidence and release caveats