# LazyProof v0.6 verification evidence

The regression checks were executed in a cloud Chromium runtime using a privately supplied Word QRE and corresponding Confirmit survey export. These source documents are **not included** in the published repository or ZIP.

## Confirmed from actual demo inputs (XML language 7)

- 48 recognized QRE questions, 43 mapped, 14 source matches, 6 potential discrepancies, 28 review cases, 0 unmapped.
- QRE/CF pairs `oqd3`, `cqd4`, `oqBF2_x`, `cq2000`, `cq3100_X`, `cq3200_X` correctly classified as matches after handling XML Instructions, QRE instruction text, list/section boundaries and quota tables.
- `cqd4` now yields 16 QRE region answer labels; `cq3100_X` 10 options; `cq2000` 12 options; `progRH9` 4 options.
- Genuine wording differences (including `cq1200_x` and `cq5200_x`) stay flagged; variable-branded `oqoe4_x` and `cqcp7_x` remain for human review.
- The CSV excludes exact matches, includes complete combined CF respondent wording for mismatches, and retains review cases.

## Synthetic regressions

- Exact QRE sentence matching XML Text + Instructions is a match.
- Changed, omitted, or additional XML instructions are a mismatch.
- Dynamic text placeholder is review-only.
- Similar-looking answer labels are not split into false question headings.
- User chooses language explicitly; English/German label guesses are not made from IDs. Language 9 uses only language-9 XML entries.
- Browser test had no JavaScript page errors or outgoing web requests.

## Verification limitations

The Chromium harness injected the exact release HTML/CSS/JS into a browser page because the test environment restricts direct file/host navigation. The public GitHub Pages deployment must be checked separately. No claim of comprehensive QA accuracy or all possible survey logic paths is made.