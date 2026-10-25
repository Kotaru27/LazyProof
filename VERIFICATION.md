# LazyProof v0.10 verification — 25 October 2026

## Executed source checks

Cloud workspace Node execution:

- `node tests/regression.cjs` — 16/16 passed.
- `node tests/evidence.cjs` — 21/21 passed.
- `node tests/safety.cjs` — 21/21 passed.
- JavaScript syntax checks passed for every application module.

An independent agent reviewed the changed source, reproduced defects before the fixes, and executed 20/20 adversarial checks after them. Its exact-function CSV check verified 23 aligned columns, both record types, complete source fields, raw numbering, quoted commas and formula escaping. The primary agent reran those independent scripts successfully. This is cloud source execution, not hosted CI.

## Executed cloud Chromium checks

Used the supported internal HTTP preview serving the exact application assets. Imported actual files through the browser file chooser; no mock parser or fabricated comparison result was used.

Supplied demo, XML languages 7 and 9:

- Required manual language selection before comparison.
- Language 7: all 48 QRE entries accessible in All pairings; 14 source matches accessible with source text.
- Optional inspection marks, next-exception navigation, and review reset on a new language comparison.
- Downloaded real CSV: 48 QRE rows plus 89 separate CF candidates; all 23 columns aligned, including inspection state and source matches. Four QRE stems were empty in extraction and remained flagged, rather than invented.
- Language 9: 8 source matches and 9 observed changes; language 7 review marks cleared.

Synthetic DOCX/XML inputs:

- Capitalization and numeric label changes surfaced.
- Answer-label search found the corresponding QID.
- Ambiguous CF IDs were included in Unpaired QRE, with distinguishable candidate wording and entity IDs.
- Manual pairing with identical source text stayed provisional; explicit confirmation changed its identity state to Confirmed by you.
- Unclassified continuation text stayed visible and unverified.
- Missing selected-language copy and grid-row limitations remained visible.
- Markup-like source content rendered as text with zero script elements injected into the detail view.
- Downloaded CSV retained human confirmation and escaped formula-leading titles.
- Enter on a question button selected its details and exposed numeric answer differences.

Layout tested through real iframe viewports at 390×844, 1024×768, 1366×768, 1440×900 and 2560×1440. Document scroll width did not exceed client width at any tested size. Desktop screenshot inspected. Browser extension metadata warnings belonged to the test environment; no application-origin error was reported in the final layout tab.

## Scope and limits

- No public deployment, GitHub push or live Confirmit respondent-path test was performed.
- Direct file-protocol opening was not browser-tested; this environment permits HTTP preview testing.
- No exhaustive accessibility certification, real-device test, 200% zoom audit, independent multi-study accuracy benchmark, or routing/piping/grid-runtime certification.
- No study documents, private exports, browser profile data or credentials are included.
- Source matches are scoped to extracted normalized plain text and comparable label multisets; formatting, answer order and answer code changes are outside the comparison.

The package is verified for the changes and checks above. It is not a claim of complete survey validation.
