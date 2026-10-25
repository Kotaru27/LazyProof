# LazyProof v0.8 verification

## Tested against

- Two privately provided demo files: one Word QRE and one Confirmit survey definition ZIP. The source filenames and content are not shipped or published.
- 16 targeted Node assertions in `tests/regression.cjs`, covering the original 12 issue families and four additional identity/heading/metadata guards.
- Real-demo browser regression in cloud Chromium for both declared XML languages, with no JavaScript page errors and no outbound requests.
- Additional browser security checks on HTML sanitization, actual synthetic DOCX strikethrough handling, alternative QIDs/headings, no horizontal overflow at 2560×1440 and 1366×768, and the collapsed CF-only review list.
- Dynamic text variants and changed instructions from the prior v0.7 regression suite remain under test.

## Observed demo summary

| Selected XML ID | QRE parsed | Mapped | Source matches | Potential differences | Needs review | Unmapped |
|---|---:|---:|---:|---:|---:|---:|
| 7 | 48 | 45 | 15 | 5 | 27 | 1 |
| 9 | 48 | 45 | 9 | 8 | 30 | 1 |

Language 7 moves one prior apparent difference to Needs review because the normalized QID alone does not confirm identity; another previously matched question requires review because strikethrough source text was detected. These are stricter classifications, not resolved survey defects. The report also exposes 89 unpaired CF respondent-text candidates for language 7 in a collapsed section, without claiming all 89 are errors.

## Test limits

Browser navigation to a local HTTP test server was blocked by the cloud environment's administrator policy. The exact static release HTML, CSS and JS were instead loaded into Chromium in memory; this proves client-side behavior but not that the public URL is reachable. Actual live public deployment requires GitHub Pages workflow verification separately. Exhaustive routing, visual respondent rendering, and arbitrary questionnaire formats are not certified.