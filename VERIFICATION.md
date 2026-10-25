# LazyProof Survey QA — Verification record

Date: 2026-10-25. Version: 0.1 (working technical preview, not release-certified).

## What was executed

**Actual uploaded demo inputs** (not redistributed):

- Word QRE `.docx`, parsed by the browser OOXML reader.
- Confirmit survey-definition `.zip` (one XML file), parsed by the Confirmit routing/tree reader.
- Chromium 144 via Playwright, with the application HTML, CSS and scripts injected into an isolated page because direct navigation was blocked by the test environment's browser policy.

Observed:
- 1,004 Word content blocks extracted; 57 Word structured content controls detected.
- 48 recognizable QRE question IDs; 317 XML question/info nodes.
- 43 QRE items had unique XML node associations; 8 were classified as source matches, 16 as potential differences, 24 requiring review; 176 non-hidden XML nodes not used in mappings.
- Both the known `cq1200_x` ↔ `cq1200` ID variation and the wording difference were detected.
- The `oqBF2_x` ↔ `cqBF2` variation was identified, including shared answer-list lookup.
- XML grid parent vs QRE row comparisons were flagged for review instead of misleading question-text differences.
- Status filtering and CSV export executed; CSV was generated (nonempty, 27 KB in the final observed run).
- JavaScript runtime errors during this comparison: 0.

**Synthetic test suite** (no client data):
- 11 assertions passed covering DOCX extraction, content controls, alternate QIDs, shared predefined lists, an exact comparison, a wording discrepancy, additional nodes, malformed XML rejection and inert HTML parsing.
- JavaScript runtime errors: 0; observed external network requests: 0.

**Syntax checks**: `parsers.js`, `matching.js`, `app.js` checked by Node.js v22; no syntax errors.

## Limits and unverified release gates

- Direct navigation to either `file://` or the local HTTP site was blocked by environment Chrome administration policy. We **did not** verify the packaged ZIP by opening `index.html` directly in a normal, unmanaged browser.
- The program handles a subset of QRE structures. QIDs are detected conservatively; unnumbered question introductions and malformed/unsupported blocks are not yet reliably assigned. The 48 recognized items are **not** a claim of complete QRE coverage.
- The 16 possible differences are algorithmic findings, not manually certified programming defects.
- Grid rows, piping expressions, display logic, scripts, quotas, image content, response routing and rendered text/formatting are not comprehensively verified.
- Formatting extraction exists at the QRE paragraph level but full Word-vs-XML formatting comparison is **not implemented**.
- CSV export succeeds in browser execution; independent Excel compatibility/visual review is not yet verified.
- No production deployment or employer-managed browser integration has been verified.

## Release recommendation

Suitable as an early, review-assisted text QA tool on supported sources. **Not** suitable as an automatic survey sign-off or substitute for programming QA. Manually review discrepancies, unresolved mappings and all unsupported/unchecked questionnaire content.