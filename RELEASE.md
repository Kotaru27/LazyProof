# LazyProof v0.10

Based on the supplied v0.9 package (SHA-256 `89c1f984dea2f20d1180dcff338e48a75a5735605d253d8236cc0b0716ad9acb`).

## Review flow

- Replaced the question-by-question findings list with a pairing overview: explicit QRE QID / CF QID columns and independent text, answer and identity states.
- Added all-pairings/source-match views, answer-label search and accurate unpaired counts that include ambiguous and repeated QIDs.
- Made available full wording and answer lists inspectable for every row.
- Added candidate wording/path/entity previews, separate human pairing confirmation, optional inspection marks and next-exception navigation.
- Export includes all QRE entries and separate CF coverage candidates, complete available source fields, original numbered lines and review state.

## Correctness fixes

- Capitalization-only source changes are visible.
- Numeric prefixes and literal annotations in CF answer labels are preserved.
- Grid rows are not compared as though parent wording were their own.
- Unclassified QRE paragraphs prevent false clean matches and are shown for review.
- Typed answer numbering is retained in original form and flagged when ambiguous; Word automatic numbering preserves literal respondent numbers.
- A manually selected pairing remains provisional until separately confirmed.
- Confirmation cannot bypass shared-node conflicts, grid-row limitations, missing translations, dynamic content or incomplete extraction.

## Supplied study check

Language 7: 48 QRE entries, 45 paired, 14 static matches, 6 observed changes, 25 other paired reviews and 3 unpaired entries. One observed change has provisional identity.

Language 9: 48 QRE entries, 45 paired, 8 static matches and 9 observed changes. Review state resets when a new comparison is run.

These are source-comparison results, not confirmed live-survey defect counts. The lower match count reflects newly surfaced extraction/numbering uncertainty.
