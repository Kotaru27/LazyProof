# LazyProof v0.4

The study language is no longer a hardcoded dropdown. Before upload, no language is selected or shown. After importing a Confirmit survey XML/ZIP, the language list is read from `ProjectInfo/Languages`; if absent, the tool derives candidates only from routed question text fields. It suggests the language with greatest questionnaire-content coverage, ties favoring the XML's default language.

If there is only one actual project language, it is used automatically and no selector appears. If there are multiple, the main screen shows the selected locale and an optional Change control. No languages from unrelated template/resource tags are shown. XML-selected locale is enforced for both comparison and CSV.

The uploaded demo XML declares German (9) and Default (7), with language 9 covering more routed question text. The default project field is 7, so selecting 7 unconditionally would be wrong for this German QRE. Users can still choose 7 manually.

Tests: see `VERIFICATION.md`. No QRE, XML, uploaded studies, or client data are included in the published repository.