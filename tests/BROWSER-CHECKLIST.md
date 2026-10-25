# Browser regression checklist

Use `fixtures/synthetic-qre.docx` and `fixtures/synthetic-survey.xml` on the static app.

1. Compare is disabled until XML language 7 is chosen.
2. All pairings shows 9 QRE entries. Q1 is a source match. Q2 has a capitalization change. Q3 has numeric answer changes. Q4 exposes its unclassified continuation paragraph.
3. Search `3. Bundesliga`: Q3 remains. Clear the search.
4. Unpaired QRE includes Q5 (duplicate XML QID) and Q6 (no unique automatic match).
5. Q5 candidate cards distinguish Q5-a / Q5-b and their source wording. Use Q5-a. Q5 must remain a pairing review with Same text/answers until Confirm this pairing is clicked.
6. After confirmation, Q5 is accessible in All pairings / Source matches as Confirmed by you. Undo confirmation restores the pairing review.
7. Q7 renders script-like text inertly. CSV titles beginning with `=` are prefixed with a single quote.
8. Q8 has no language-7 copy. Q9_1 maps to a grid parent and must remain unverified rather than a parent-wording change.
9. Mark inspected does not alter automatic evidence. Next exception moves to another pending exception and brings its row into view.
10. CSV contains all QRE records plus separate CF coverage candidates, available full text, answer lists, mapping and inspection state.
11. A new comparison resets inspection/mapping decisions. Language 9 must use only that language's copy.
12. Check empty search results, keyboard Enter, narrow and desktop viewports; no document horizontal overflow.
