# LazyProof v0.7 verification

Executed in the cloud Chromium harness against privately supplied demo DOCX and XML/ZIP files. The private files are not included in the public repository or release ZIP.

## Actual demo, selected XML language 7

- 48 parsed QRE entries; 45 mapped; 17 source matches; 6 potential differences; 25 review entries; 0 unmapped.
- A multiple-choice QRE list written entirely as unnumbered Word paragraphs now provides 10 options and agrees with the 10 XML response definitions.
- Two other unnumbered multiple-choice lists now provide 9 options each and agree with their XML response definitions.
- Two QRE wording variants that share a QID are mapped to one dynamic XML CF question via a referenced variable's selected-language answer texts, each remaining marked as `Needs review` for runtime selection.
- Six previously identified real differences remain detected; no newly introduced definite mismatch appeared in this demo.

## Browser and negative tests

- `test_v07_regression.py`: existing browser workflow, two selected languages, CSV export, QRE/XML instruction handling, word differences and no runtime errors/network requests — passed.
- `test_v07_targets.py`: unnumbered lists, variant 1/2 review labels, exact dynamic-source associations, false-duplicate avoidance, wrong variant rejection, ordinary duplicate-QID safeguards, basic generic unnumbered list fixture and no runtime errors/network requests — passed.
- `node --check` passed for modified JavaScript files.

## Important boundaries

The test harness injects release HTML/CSS/JS into a cloud Chromium page because direct public-site browsing is restricted. Source comparison does **not** certify runtime piping, script execution, visual rendering or all Word document layouts. Automated checks can still miss discrepancies. GitHub Actions deployment evidence is tracked separately from browser behavior.