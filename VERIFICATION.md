# LazyProof v0.9 verification

## Source and test environment

- Based on public `Kotaru27/LazyProof` v0.8, commit `486bca4015b81b846ad2cf3a6575d1fdd9c39514`.
- Tested locally in the cloud workspace against privately supplied demo Word QRE and Confirmit XML ZIP. Those inputs are **not published**.
- Chromium tests load the exact static app assets in-memory because the cloud test environment restricts local HTTP navigation; this does not establish public URL accessibility.

## Tests executed and passed

- Existing Node regression suite: **16/16** scenarios.
- New independent-evidence Node suite: **21/21** scenarios (identity, content/answers, dynamic, grid, selected language missing, duplicate answers, manual mapping, safe title corroboration).
- Cloud Chromium demo end-to-end in language IDs **7 and 9**: import, user-selected language, observed-change/review filters, provisional mapping details, full word highlighting, export, XSS-safe rendering, and language isolation.
- Cloud Chromium security/Word tests: HTML sanitization, actual synthetic DOCX struck-through text, QID parsing, additional CF candidates, 2560×1440 and 1366×768 without horizontal overflow.
- **Zero** page JavaScript errors and **zero** unexpected outbound requests observed in those browser runs.

## Demo summary

| XML language ID | QRE entries | Exact source matches | Original mismatch verdicts | Review verdicts | Unmapped | Observed source changes | Other reviews |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 7 | 48 | 16 | 5 | 26 | 1 | 6 | 25 |
| 9 | 48 | 10 | 8 | 29 | 1 | 9 | 28 |

A source change can overlap a review verdict, but the *display filters* partition changes vs other reviews so the interface doesn't duplicate items. The CSV preserves review verdicts alongside evidence fields.

## Untested limits

No live Confirmit runtime navigation, exhaustive piping/routing evaluation, independent sample-study accuracy benchmark, or public-site-browser smoke test was performed in these local runs. GitHub Actions deployment must be checked independently on publication.