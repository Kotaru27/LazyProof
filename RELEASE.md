# LazyProof v0.5 — Review-first upgrade

This release changes the report presentation and two verified correctness risks without redesigning the source-extraction architecture.

## User-facing changes

- Read the available survey language identifiers from the uploaded Confirmit XML. Do **not** select a language automatically; require the user to choose one. Label the XML's project default accurately, without guessing that a numeric ID means German, English, or another language.
- Fill most of the desktop viewport with the report. The navigation list and the complete QRE/CF text comparison have stronger sizing and contrast. Compare texts in parallel on wider desktops, stacked on narrower screens.
- Open the results on **Differences**. Keep **Needs review**, **Unmapped**, and **All findings** available in the filter, without treating unverified questions as matches.
- Show the primary review reason immediately when there is no text or answer delta; hide extra technical notes under a disclosure.
- Replace the giant manual-mapping `<select>` with a compact, searchable set of plausible respondent-question candidates. Exclude empty internal variables from that shortlist.
- Keep CSV export semantics: export all non-matching and unverified source comparisons, not exact matches, irrespective of the current visual filter. This preserves coverage information.

## Meaningful correctness fixes

- Reject extra CF text appended to a QRE sentence instead of silently accepting its prefix as an exact match.
- Reject invalid replacement file selections without leaving an older valid file silently active.

## Scope retained

- DOCX / CF XML or ZIP import; local JSZip; language-isolated CF fields; conservative QID/title mapping; shared answer references; complete word-level diff; manual override; search; CSV; no external API.
- No live-survey verification, automatic routing/loop certification, or full formatting comparison. Grid and ambiguous cases remain flagged for human review.

## Evidence

`test_v05.py` and `visual_check.py` were executed in a cloud Chromium environment using local injected production assets because direct file navigation is restricted. Tests cover both project language choices, selection-gate behavior, candidate mapping, full-text differences, CSV, stale upload rejection, mobile/desktop overflow and runtime errors. These are not proof of real-user survey QA accuracy.