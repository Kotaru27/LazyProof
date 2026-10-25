# LazyProof v0.5 verification

- Scope: two privately supplied demo-study files (Word questionnaire and matching Confirmit survey definition). Their filenames and contents are deliberately omitted from the public repository.
- Environment: cloud Chromium / Playwright, in-memory page assembled from exact static release JS/CSS. Browser navigation to `file://` was blocked by the execution policy; the app was rendered with `set_content` and `add_script_tag`.
- Input options: placeholder unselected, IDs 7 and 9 from XML; 7 marked project default; Analyze disabled until user selects a language.
- Language 7 demo: 48 QRE items; 43 mapped; 8 source matches hidden; 13 possible differences; 27 needs review; 0 classified `unmapped` (5 ambiguous items are part of review). 13 differences displayed by default; 40 non-match/review findings exported to CSV.
- Language 9 demo: 48 QRE items; 43 mapped; 6 source matches hidden; 16 possible differences; 26 needs review. No question titles/text borrowed from another selected language.
- Regression: full text rendered on both sides, per-word green/red markers; searchable mapping alternatives, manual override/reset; internal variables such as SMSVersion/PID excluded; abbreviation review retains visible reason; changing the XML to a single-language definition resets selection; invalid replacement cannot reuse old file.
- Correctness probe: additional CF wording following an otherwise exact QRE sentence is now a mismatch rather than accepted as equivalent.
- Desktop smoke test at 1366x768 and 2560x1440: no horizontal overflow. 2560 wide layout 2360 CSS pixels; 1366 wide layout about 1298 CSS pixels.
- No JavaScript page errors or external web requests observed during recorded test.
- Not verified: hosted-page client browser test, accessibility audit, real respondent-rendering equivalence, complete routing/piping/grid correctness, all possible survey exports.