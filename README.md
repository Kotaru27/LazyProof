# LazyProof — Word QRE vs Confirmit XML QA

A browser-local, deterministic text audit tool for survey programmers. Compare a DOCX questionnaire with a Confirmit Survey Definition XML or single-definition ZIP and review wording/answer discrepancies. No client documents are transmitted by the application.

## Usage

1. Open the GitHub Pages site or the bundled `index.html`.
2. Upload a Word QRE (`.docx`) and Confirmit Survey Definition (`.xml`/`.zip`).
3. **Choose** a language ID from the XML; none is selected automatically.
4. Select **Compare files**. The report defaults to likely differences. Explore unresolved items under **Needs review** and unpaired CF text under the collapsed separate section.
5. Inspect full QRE and CF wording, confirm uncertain mappings, and export a difference/review CSV.

## Safeguards

- Uncertain QID aliases, conflicting question identities, incomplete/struck-through QRE source, and dynamic text never get automatic approval.
- Answer options are compared within their mapped question and duplicates are not silently removed.
- Word questionnaire extraction is heuristic; unrelated QRE formats might need manual review. Routing and dynamic rendering are outside static XML verification.
- The browser works without a backend; the bundled JSZip license is documented in `THIRD_PARTY_NOTICES.md` and `lib/JSZIP-LICENSE.md`.

See `RELEASE.md` for changes and `VERIFICATION.md` for the measured test scope. The included Node regression script (`tests/regression.cjs`) is an optional developer QA artifact, not a runtime dependency.