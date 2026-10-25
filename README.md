# LazyProof — Survey Text QA (v0.4, XML-driven language selection)

A static, browser-local comparison tool for Word `.docx` questionnaires and **Confirmit Survey Definition** `.xml` or `.zip` files. This is a new tool, not an alteration of Lazy Finder.

## Open

Extract this ZIP and open `index.html` in Chrome or Edge. No installation, administrator access, backend, API key, internet connection, or externally hosted dependencies are needed. Imported files and results are processed in the browser session. Nothing is uploaded to a server.

1. Select the QRE `.docx`.
2. Select the survey-definition `.xml` or a ZIP containing one XML.
3. The survey language is detected automatically from `ProjectInfo/Languages` and the populated question text in the uploaded XML. Click **Analyze study**. If the XML declares multiple languages, select **Change** to choose another available XML language.
4. Inspect only *Difference*, *Needs review*, or *Unmapped* findings; successfully matched items are omitted from the display.
5. Optionally change uncertain mappings using the selector. **Export CSV** for Excel or record-keeping.

## What it can do

- Word OOXML paragraph/table and content-control extraction; tracked deleted text is excluded.
- Confirmit routing-tree node extraction: QIDs, language-specific titles, texts, instructions, grids, single/multi answers and shared predefined answer lists.
- Conservative QID, canonical-QID, grid-parent and exact unique-title identification. Ambiguous questions remain unresolved.
- Text and answer-list comparison, discrepancy reporting and explicit manual review for unsupported scenarios.
- Findings-only report: complete question wording for text discrepancies with unchanged tokens in green and changed tokens in red. Exact matches remain hidden; unrelated question/answer lists are not dumped.
- Findings-only CSV: selected XML language, complete QRE/CF wording for text differences, missing/extra answer text and unresolved findings; fully matched questions excluded.

## Known limits — read before relying on results

- This is **source-text QA**, not validation of the live survey. Full Word-vs-XML formatting comparison is not yet implemented. It cannot verify actual routing, display conditions, piping evaluations, rendered typography, media, quotas or scripts.
- The Word parser recognizes QIDs written in supported naming formats. Unnumbered introductions, embedded images, complex tables, some grid rows, dynamic fields and unusual Word numbering may be missed. `QRE questions found` measures *recognized* questions, not a guarantee of whole-document coverage.
- Exclusion rules are conservative, but programming notes may still appear among extracted options and require manual confirmation.
- Exact title matching is allowed only when unique; matching by title is flagged for review. Actual XML `NodeLabel` availability depends on the export; not assumed.
- Strict language mode: only the automatically detected or explicitly selected XML language is examined; unavailable selected-language fields are marked for review rather than borrowed from another locale. Ensure the QRE is in the matching language.
- Answer codes in the QRE are not always available from Word numbering; comparison is primarily by visible answer text, not verified QRE precodes.
- Unknown XML schemas or ZIPs with multiple XML files are rejected. Imported files should be below the specified sizes (35 MB archive / 40 MB expanded XML).
- XML and Word content are treated as untrusted data; no arbitrary XML scripts or HTML are executed. Exported CSV opens in spreadsheet programs; as with any untrusted CSV, validate its contents before passing to other systems.
- Nothing is persisted by default. Refreshing the page clears imported study data and manual matches. Export results before closing.

## Privacy and distribution

This package is static and includes a local copy of JSZip (MIT), located at `lib/jszip.min.js`; the licence is in `lib/JSZIP-LICENSE.md` and `THIRD_PARTY_NOTICES.md`. No network operations are performed by LazyProof.

## Evidence

No confidential study data is distributed. Browser test evidence is recorded in `VERIFICATION.md`. Do not mistake a successful parser run for verified survey equivalence.

## v0.3 changes

- Strict selected-language isolation in Confirmit form text and answer labels; no cross-language substitution. Missing translations remain review items.
- Full QRE and CF question text for wording differences; identical words green and changed/missing words red.
- Compact findings-first layout and a CSV with complete QRE/CF wording for text discrepancies.