# LazyProof v0.6 — Respondent-text accuracy release

## Corrected findings

- Compare QRE respondent wording against **both** the selected XML language's question `Text` and `Instruction` fields. The original XML fields remain separate in source data. Display and CSV export now show the combined visible wording; no text is fetched from another language.
- Retain respondent-facing QRE instructions placed immediately before answers. Previously, the presence of any answer list could cause those instructions to be omitted.
- Stop misclassifying answer labels (for example region names and "Social Media") as question headings. Recognize genuine chapter boundaries so their names are not mistaken for answer options, and do not include region quota tables as response options.
- Treat scripted brand-piping replacements and uncertain dynamic answer labels as `Needs review`, rather than confirmed text/answer mismatches. Actual substitutions are not verified by the XML parser.
- Recognize a trailing `open end` programming marker on a QRE answer label without interpreting that marker as respondent-facing wording.

## Preserved behavior

- No UI redesign, no new dependencies, no change to user-controlled language selection or local-only file import.
- Exact matches hidden; user can review discrepancies and uncertain cases separately, override question mapping, search, and export CSV.
- Conservative QID/title matching, shared answer lists, XML locale isolation and Word extraction remain in place.

## Limits

The tool compares survey source definitions, not the rendered experience. It does not certify dynamic piping, routing, grid rows, all Word formatting, text inside media assets, or unrecognized unnumbered questions. Unresolved content remains review-only; zero displayed discrepancies does not prove complete survey equivalence.