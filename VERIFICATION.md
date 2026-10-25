# LazyProof v0.4 verification (2026-10-25)

Scope: only XML-derived language options and selection UI. Parsing, matching, text comparison, and CSV behavior are unchanged except for rejecting unsupported locale requests.

## Source evidence

- Demo XML `p474943337087.zip`: `ProjectInfo/Languages` lists **9** and **7**. `ProjectInfo DefaultLanguage=7`; routed question text in language 9 is more populated than in language 7. Auto detection uses the higher populated count from the **active routing question content**, rather than blindly using a template default.
- Other language attributes, e.g. 12 and 1043, occur in resource/template content and do not qualify as project languages.

## Executed checks

- `node --check app.js`, `node --check parsers.js`: syntax passed.
- `python test-v04.py`: Chromium test PASS — no preselected menu before file, German (9) selected by uploaded XML, selectable options exactly [9, 7], 48 QRE questions compared, 40 discrepancy/review CSV rows and selected locale 9, change to 7 preserved; synthetic XML with only 12 auto-selects English (12) and hides Change; resource-only languages hidden; malformed XML blocks Analyze; no uncaught browser errors.
- `python test-v04-regression.py`: existing full-text word-highlight, CSV, language isolation and strict missing selected-language tests PASS after updating the fixtures to declare their available languages; selected 7 only returns 7 when specified; no page script errors or external network requests recorded.

## Important boundary

- Auto locale determination is a deterministic heuristic when multiple project languages are explicitly listed. A translated study where the default language is 7 but most routed question text is 9 will select 9. Users may switch languages only to those listed in XML. A QRE in another language still requires manual selection or a matching QRE.
- This does not prove comparison accuracy across all possible XML survey schema variants or live rendering.