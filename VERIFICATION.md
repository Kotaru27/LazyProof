# LazyProof v0.3 — verification evidence

## Changes
- Use only the selected XML language ID for question Title/Text/Instruction and answer text. No language fallback in the comparison parser. Missing requested-language entries stay unresolved/review, not confirmed wording mismatches.
- Display complete QRE and CF question texts for wording differences. Unchanged words appear green, changed words red. Literal ellipses present in the input XML remain literal content; LazyProof does not insert ellipses to truncate excerpts.
- Use a compact results workspace; unmatched and review findings remain visible, matched rows remain hidden. Technical notes and manual mapping are collapsed until opened.
- Export complete QRE and CF texts for wording discrepancies in CSV; otherwise no full question in a review-only row. Include XML language in CSV.

## Verified locally in browser
Cloud-hosted headless Chromium via Playwright and the real demo QRE + ZIP:
- QRE 48 recognized, XML 317 nodes, 43 mapped; 8 match, 14 mismatch, 26 review. 40 reported findings, all nonmatching. These counts are source-heuristic estimates, not validated survey defects.
- QRE `cq1200_x` and CF `cq1200`: full text on both sides, distinct red changed words and green identical words. CF contains an actual typographic ellipsis character in the exported question definition; it is retained as data.
- All returned question and option `language` fields are either the selected language ID or empty; no cross-language results.
- Synthetic three-language XML probe: when `9` missing, no fallback from `7` or `12`, and result classified `review`; selecting `12` or `7` returns precisely those strings.
- Switching to XML language `12` works, 158 of the XML question nodes have no selected-language FormText; these are kept as missing/review, never filled using another language.
- Full-text comparison with 500+ tokens preserved both sides, with bounded complexity path.
- CSV exported 40 findings, all nonmatching, selected language 9, full wording for changed texts.
- No runtime page errors or network requests in this browser test.

Not verified: live respondent rendering, true runtime language fallback (intentionally not assumed), exhaustive grid/routing comparisons, respondent-level outputs, or real-user acceptance.

Test script (requires Playwright in QA environment): `tests-v03.py` with the demo files in the specified test location. No client-side installation required to use the application.