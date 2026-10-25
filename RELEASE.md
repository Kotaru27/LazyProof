# LazyProof v0.9 — source evidence and mapping confidence

Compared to v0.8:

- Keeps all verified source wording/answer differences visible, **even if question identity is not yet confirmed**. Such results are labeled as provisional pairing issues instead of being treated as confirmed survey defects.
- Records independent evidence states for **text**, **answer labels**, and **mapping**, without treating missing translations or dynamic expressions as definite differences.
- Splits the default results into non-overlapping **Observed changes**, **Other reviews**, and **Unmapped**. Exact source matches remain hidden. Mapping warnings remain accessible for changes.
- Improves the CSV with evidence and mapping columns. Complete QRE and CF text, including separate CF instructions, remain available for identified text changes.
- Resolves one reproducible stale-heading review only when a unique exact QID is corroborated by sufficiently distinctive identical question text and three or more identical options. No study-specific QID overrides.
- Retains the v0.8 Word/XML parsers, browser-side processing, manual language selection, and existing style hierarchy. No new runtime dependency.

## QA result on the supplied demo, language ID 7

- 48 QRE entries; 45 mapped; 16 source matches; 5 direct-mapping differences; 26 review verdicts; 1 unmapped.
- **6 observed source changes**, one of which has unconfirmed question pairing.
- **25 other reviews** with no directly observed text/answer change; many involve CF grids, dynamic content, or incomplete source information.
- 89 unpaired respondent-text CF candidates remain separate from confirmed defects.

Review counts must not be interpreted as numbers of defects. Exact live-survey rendering is out of scope.