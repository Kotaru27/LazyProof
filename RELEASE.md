# LazyProof v0.7 — Dynamic wording and unnumbered answer-list fixes

## Corrections

- QRE answer options written as plain Word paragraphs can now be classified when a question has an explicit SA/MA heading, a respondent-facing selection instruction, and a contiguous list of at least three plausible answers. The rule is not based on whether XML answer text matches; unexpected QRE options remain detectable.
- A bare `Answers` heading is not an answer option. Trailing `[Open answer]` annotations on actual answer options are normalized, but a standalone `[Open answer]` placeholder is **not** silently accepted as a match.
- Repeated QRE QIDs representing alternative text from one `^f('variable')^` field are checked against that variable's answer texts in the **selected XML language**. If all variants are identifiable, the corresponding CF question is mapped with individually labeled variants instead of a false duplicate warning.
- Dynamic source matches remain **Needs review** because XML cannot prove the runtime category/route selection. A duplicated QID with unresolved variable sources continues to require manual review.
- Avoid false duplicate-mapping warnings for two verified alternative QRE wordings pointing to the same dynamic CF question. All other ambiguous/multiple mappings retain safeguards.

## Preserved

Manual language selection, source-file privacy, full wording comparison, red/green difference highlighting, report filtering, manual mapping and CSV export. No dependencies added; no broad style rewrite.

## Limitations

This does not execute Confirmit scripts or prove displayed text on every respondent path. Generic document layouts, routing, other complex expressions and unsupported question structures remain subject to manual review.