# LazyProof — Word QRE vs Confirmit XML QA

**v0.9 — Separate source changes from mapping certainty.**

LazyProof is a browser-local, deterministic QRE/Confirmit XML comparison tool. No study file content is uploaded by the application.

## Use

1. Open the GitHub Pages site or `index.html` from the package.
2. Import Word QRE (`.docx`) and the corresponding Confirmit Survey Definition (`.xml` or `.zip`).
3. **Select the XML language yourself**; the tool never guesses.
4. Choose **Compare files**. The default **Observed changes** view includes changed source text/answers, even when the question mapping still requires confirmation.
5. Use **Other reviews** for grids, dynamic substitutions, incomplete selected-language labels, Word revisions, and ambiguous identifiers. **Unmapped** is a separate filter.
6. Open any item to see the complete original QRE and CF wording side-by-side, then export the report CSV.

## Important distinctions

- An **observed change** is a difference between two selected-language source passages. It is **not automatically a confirmed defect**: some pairings require confirmation, and source does not prove runtime display.
- An **other review** may have matching static text but incomplete structural/runtime verification.
- A unique exact QID with complete identical respondent wording and at least three independently matching answer labels can corroborate a stale Word heading. This is conservative; incomplete lists and weak/generic wording never override identity conflicts.
- Dynamically piped survey text, grid row mapping, loops, routing, hidden questions, and unsupported Word structures are not fully validated by static comparison.
- Only the selected XML language is used in comparisons.

The app is static and does not require a backend or API. JSZip is bundled with its license. Node scripts in `tests/` are for regression evidence, not runtime dependencies.