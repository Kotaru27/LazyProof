# LazyProof — QRE / Confirmit source QA

**v0.10 — See every question pairing. Review the exceptions.**

LazyProof compares Word QRE documents with Confirmit Survey Definition XML in the browser. Deterministic comparison, no AI, no backend, and no study-content upload by the application. JSZip is bundled.

## Use

1. Open `index.html`, or host the package as a static site.
2. Import the Word QRE (`.docx`) and matching survey definition (`.xml` or a ZIP containing one XML file).
3. Select the XML language explicitly, then choose **Compare files**.
4. The tool compares all extracted QIDs together. **Needs attention** shows exceptions; **All pairings** includes source matches. You do not need to select or approve every matching question.
5. Read the **QRE QID**, **CF QID**, **Text**, **Answers**, and **Pairing** states together. Search includes question wording and answer labels.
6. Open an exception for complete extracted wording and answer lists. Ambiguous questions appear under **Unpaired QRE** as well as **Pairing checks**.
7. If a pairing needs correction, inspect candidate wording, path and entity ID, then choose **Use this pairing**. **Confirm this pairing** is a separate human identity decision. It does not validate routing, translations or variable substitutions.
8. **Mark inspected** tracks your review without changing evidence. **Next exception** moves to another uninspected exception. These marks are optional.
9. **Export CSV** saves every QRE pairing, available source passages, answer lists, evidence and review decisions. Additional unpaired CF respondent-text candidates are separate record types.

Review marks and pairing decisions are held in memory for the current comparison. A new comparison, language change or refresh clears them. Remapping clears prior decisions/inspection marks because it can affect shared-node conflicts. Export before leaving if you need a record.

## Meaning of results

- **Source match:** the extracted static wording and comparable answer labels agree under normalization. It does not certify survey behaviour or document formatting.
- **Changed:** observed source wording or labels differ. Capitalization and visible numeric labels matter. A provisional pairing means the change is not yet attributable to the correct question.
- **Not verified:** extraction, translation, variable expressions, grid structure or abbreviated content prevents a complete static comparison.
- **Auto-paired:** the deterministic identity rules corroborate the pairing. **Confirmed by you** records a distinct human decision.
- **Inspected:** a human review mark only. It does not turn an unresolved item into a pass.

Whitespace and selected Unicode typography are normalized. Answer labels are compared as a multiset, preserving duplicate counts; answer order and code changes are not validated. Known programming annotations are cleaned only from QRE answers. Apparent annotations in CF labels remain visible.

Unclassified QRE paragraphs are retained and flagged instead of silently discarded. Manually typed numeric answer prefixes can be codes or visible text; their original lines are shown and comparison remains a review. Automatic Word list numbering is handled separately.

## Limits

Static XML cannot establish respondent-path routing, loop behaviour, live piping, hidden-node visibility, formatting fidelity, or row-level grid identity. Missing translations never borrow another XML language. Additional CF candidates are coverage leads, not confirmed defects. Legacy `.doc` is unsupported.

See `RELEASE.md` and `VERIFICATION.md` for changes, executed checks and verification limits. Test fixtures are synthetic; supplied study documents are excluded from this package.
