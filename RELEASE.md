# LazyProof v0.8 — comparison integrity

This is a conservative accuracy update to v0.7. It preserves the upload workflow, manual selection of XML language, word-level green/red comparison, question mapping controls, and difference-only CSV.

## Corrections

1. Numeric QID suffixes are no longer silently removed. Possible mappings that lack corroborating question titles require review.
2. Choice questions with no verified options in either source no longer pass as matches.
3. Two-option unnumbered Word answer lists are recognized when an explicit selection instruction and question-type label support them.
4. Duplicate QRE answer labels are preserved instead of deduplicated.
5. Respondent-facing "Please use..." instructions are not globally discarded as programming notes.
6. A reused exact QID with conflicting titles is not considered automatically equivalent.
7. Unpaired, likely respondent-facing CF nodes appear in a collapsed candidate-review area. They are not called confirmed missing QRE questions. Internal Info nodes and empty copy are excluded.
8. Struck-through Word runs are excluded from active wording and trigger a review note. Fully struck paragraphs are accounted for.
9. HTML image alt text survives XML text normalization; inline hidden duplicates are excluded.
10. Alternative numeric QIDs (such as A1) and named q-prefixed IDs are recognized without study-specific QID names.
11. Section identification uses Word heading styles and contextual numbered headings instead of named demo sections; metadata labels such as QUALITY are not interpreted as QIDs.
12. Exact-QID identity conflicts and uncertain normalized-ID mappings are review cases rather than unsubstantiated definitive differences.

## Boundaries

- Text comparison uses only the user-selected XML language; runtime substitutions, routing, grid row mapping, and hidden node display cannot be exhaustively verified from a survey definition.
- Unpaired CF candidates are **not** confirmed additional respondent questions; survey cells, reused templates, and routing can legitimately explain them.
- The original questionnaire may contain struck-through text whose intended revision state requires manual signoff.
- No new dependencies, external APIs, or study-specific QID overrides were added.